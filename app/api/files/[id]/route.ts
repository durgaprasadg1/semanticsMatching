import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { updateFileSchema } from "@/lib/validation/schemas";
import { cacheGet, cacheSet, cacheDel } from "@/lib/redis/client";
import { enqueueReembedJob } from "@/lib/queue/embedQueue";
import type { FileRow } from "@/types/db";

type Params = { params: Promise<{ id: string }> };

// GET /api/files/:id — load a file's full content (cache-through Redis).
export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const cacheKey = `file-content:${id}`;
  const cached = await cacheGet<FileRow>(cacheKey);
  if (cached) return NextResponse.json({ file: cached });

  const { data, error } = await supabase.from("files").select("*").eq("id", id).single();
  if (error) return NextResponse.json({ error: error.message }, { status: 404 });

  await cacheSet(cacheKey, data, 300);
  return NextResponse.json({ file: data });
}

// PATCH /api/files/:id — save content (autosave target). Updates the file,
// refreshes the structural link if the folder changed, invalidates caches,
// and enqueues an async re-embed job. Never blocks on the queue.
export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const parsed = updateFileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { data: file, error } = await supabase
    .from("files")
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (parsed.data.folder_id !== undefined) {
    // Folder changed (or cleared) — replace the structural link.
    await supabase.from("file_links").delete().eq("source_file_id", id).eq("link_type", "structural");
    if (file.folder_id) {
      await supabase.from("file_links").insert({
        user_id: user.id,
        source_file_id: id,
        target_folder_id: file.folder_id,
        link_type: "structural",
      });
    }
  }

  await cacheDel(`file-content:${id}`);
  await cacheDel(`file-tree:${user.id}`);
  await cacheDel(`graph:${user.id}`);

  // Fire-and-forget: semantic re-linking happens later once rag-service consumes this.
  void enqueueReembedJob(id, user.id);

  return NextResponse.json({ file });
}

// DELETE /api/files/:id
export async function DELETE(_request: Request, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { error } = await supabase.from("files").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await cacheDel(`file-content:${id}`);
  await cacheDel(`file-tree:${user.id}`);
  await cacheDel(`graph:${user.id}`);
  return NextResponse.json({ success: true });
}
