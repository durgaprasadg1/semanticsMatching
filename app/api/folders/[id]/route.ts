import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { updateFolderSchema } from "@/lib/validation/schemas";
import { cacheDel } from "@/lib/redis/client";

type Params = { params: Promise<{ id: string }> };

// PATCH /api/folders/:id — rename or move a folder.
export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const parsed = updateFolderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("folders")
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await cacheDel(`file-tree:${user.id}`);
  return NextResponse.json({ folder: data });
}

// DELETE /api/folders/:id — cascade delete (subfolders + files inside them),
// enforced by ON DELETE CASCADE in the schema. Frontend confirms with a modal
// before calling this.
export async function DELETE(_request: Request, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { error } = await supabase.from("folders").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await cacheDel(`file-tree:${user.id}`);
  await cacheDel(`graph:${user.id}`);
  return NextResponse.json({ success: true });
}
