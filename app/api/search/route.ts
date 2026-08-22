import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/search?q=... — simple full-text search over file titles/content.
// Semantic search will layer on top of this once embeddings exist.
export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();
  if (!q) return NextResponse.json({ files: [] });

  const { data, error } = await supabase
    .from("files")
    .select("id, title, folder_id, updated_at")
    .or(`title.ilike.%${q}%,content.ilike.%${q}%`)
    .limit(20);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ files: data });
}
