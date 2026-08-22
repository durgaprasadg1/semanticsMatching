import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createFolderSchema } from "@/lib/validation/schemas";
import { cacheDel } from "@/lib/redis/client";

// GET /api/folders — list all folders for the logged-in user (flat list;
// the client builds the tree from parent_folder_id).
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("folders")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ folders: data });
}

// POST /api/folders — create a folder.
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const parsed = createFolderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("folders")
    .insert({ ...parsed.data, user_id: user.id })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await cacheDel(`file-tree:${user.id}`);
  return NextResponse.json({ folder: data }, { status: 201 });
}
