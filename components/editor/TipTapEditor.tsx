"use client";

import { useEffect, useRef, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Highlight from "@tiptap/extension-highlight";
import { Markdown } from "tiptap-markdown";
import { EditorToolbar } from "./EditorToolbar";
import { getMarkdown } from "./markdownSerializer";

const AUTOSAVE_DELAY_MS = 1500;

export function TipTapEditor({
  fileId,
  initialContent,
  onSave,
}: {
  fileId: string;
  initialContent: string;
  onSave: (content: string) => Promise<void>;
}) {
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const editor = useEditor({
    extensions: [StarterKit, Underline, Highlight, Markdown],
    content: initialContent,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      setStatus("idle");
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(async () => {
        setStatus("saving");
        await onSave(getMarkdown(editor));
        setStatus("saved");
      }, AUTOSAVE_DELAY_MS);
    },
  });

  // Re-hydrate content when switching between files.
  useEffect(() => {
    if (editor && editor.isEmpty === false) {
      editor.commands.setContent(initialContent);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileId]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return (
    <div className="flex h-full flex-col rounded-lg border border-neutral-200 bg-white">
      <div className="flex items-center justify-between">
        <EditorToolbar editor={editor} />
        <span className="pr-3 text-xs text-neutral-400">
          {status === "saving" ? "Saving…" : status === "saved" ? "Saved" : ""}
        </span>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        <EditorContent editor={editor} className="prose prose-neutral max-w-none focus:outline-none" />
      </div>
    </div>
  );
}
