// Thin helpers around the tiptap-markdown extension. Kept separate so the
// editor component doesn't need to know the storage internals.
import type { Editor } from "@tiptap/react";

export function getMarkdown(editor: Editor): string {
  // tiptap-markdown attaches a `markdown` namespace to editor.storage.
  return (editor.storage as { markdown?: { getMarkdown: () => string } }).markdown?.getMarkdown() ?? editor.getText();
}
