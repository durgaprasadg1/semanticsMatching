import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { cacheGet, cacheSet } from "@/lib/redis/client";
import type { GraphNode, GraphEdge } from "@/types/db";

// GET /api/graph — nodes + edges for the graph view (cached).
// Currently returns structural edges only; semantic edges show up once
// rag-service is writing file_links rows with link_type = 'semantic'.
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const cacheKey = `graph:${user.id}`;
  const cached = await cacheGet<{ nodes: GraphNode[]; edges: GraphEdge[] }>(cacheKey);
  if (cached) return NextResponse.json(cached);

  const [{ data: files, error: filesError }, { data: folders, error: foldersError }, { data: links, error: linksError }] =
    await Promise.all([
      supabase.from("files").select("id, title, folder_id"),
      supabase.from("folders").select("id, name"),
      supabase.from("file_links").select("source_file_id, target_file_id, target_folder_id, link_type, similarity_score"),
    ]);

  if (filesError || foldersError || linksError) {
    return NextResponse.json(
      { error: filesError?.message || foldersError?.message || linksError?.message },
      { status: 500 }
    );
  }

  const nodes: GraphNode[] = [
    ...(files ?? []).map((f) => ({ id: f.id, label: f.title, type: "file" as const, folder_id: f.folder_id })),
    ...(folders ?? []).map((fo) => ({ id: fo.id, label: fo.name, type: "folder" as const, folder_id: null })),
  ];

  const edges: GraphEdge[] = (links ?? [])
    .map((l) => ({
      source: l.source_file_id,
      target: l.target_file_id ?? l.target_folder_id ?? "",
      link_type: l.link_type,
      similarity_score: l.similarity_score,
    }))
    .filter((e) => e.target !== "");

  const payload = { nodes, edges };
  await cacheSet(cacheKey, payload, 120);
  return NextResponse.json(payload);
}
