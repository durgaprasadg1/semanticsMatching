import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EditorClient } from "./EditorClient";

export default async function FilePage({ params }: { params: Promise<{ fileId: string }> }) {
  const { fileId } = await params;
  const supabase = await createClient();

  const { data: file, error } = await supabase.from("files").select("*").eq("id", fileId).single();
  if (error || !file) notFound();

  return <EditorClient fileId={file.id} title={file.title} initialContent={file.content} />;
}
