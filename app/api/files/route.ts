import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createFileSchema } from "@/lib/validation/schemas";
import { cacheDel } from "@/lib/redis/client";

// GET /api/files?folder_id=... — list files. Omit folder_id to list root-level files.
export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const folderId = searchParams.get("folder_id");

  let query = supabase.from("files").select("id, title, folder_id, file_type, updated_at, created_at");
  query = folderId ? query.eq("folder_id", folderId) : query.is("folder_id", null);

  const { data, error } = await query.order("updated_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ files: data });
}

// POST /api/files — create a file. Also writes the structural link
// (file -> parent folder) synchronously, per PRD §5.4.1.
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const parsed = createFileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { data: file, error } = await supabase
    .from("files")
    .insert({ ...parsed.data, user_id: user.id })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (file.folder_id) {
    // Structural link — trivial, synchronous, no ML involved.
    await supabase.from("file_links").insert({
      user_id: user.id,
      source_file_id: file.id,
      target_folder_id: file.folder_id,
      link_type: "structural",
    });
  }

  await cacheDel(`file-tree:${user.id}`);
  await cacheDel(`graph:${user.id}`);
  return NextResponse.json({ file }, { status: 201 });
}
