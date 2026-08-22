"use client";

import { TipTapEditor } from "@/components/editor/TipTapEditor";

export function EditorClient({
  fileId,
  title,
  initialContent,
}: {
  fileId: string;
  title: string;
  initialContent: string;
}) {
  async function handleSave(content: string) {
    await fetch(`/api/files/${fileId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
  }

  return (
    <div className="flex h-full flex-col gap-2">
      <h1 className="text-lg font-semibold">{title}</h1>
      <div className="flex-1 overflow-hidden">
        <TipTapEditor fileId={fileId} initialContent={initialContent} onSave={handleSave} />
      </div>
    </div>
  );
}
