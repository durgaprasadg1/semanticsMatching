"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { FileNode } from "./FileNode";
import { Button } from "@/components/ui/Button";
import type { Folder, FileListItem } from "./FileTree";

export function FolderNode({
  folder,
  allFolders,
  refreshToken,
  onChanged,
}: {
  folder: Folder;
  allFolders: Folder[];
  refreshToken: number;
  onChanged: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [files, setFiles] = useState<FileListItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const params = useParams<{ fileId?: string }>();
  const router = useRouter();

  const children = allFolders.filter((f) => f.parent_folder_id === folder.id);

  async function toggle() {
    const next = !open;
    setOpen(next);
    if (next && !loaded) {
      const res = await fetch(`/api/files?folder_id=${folder.id}`);
      const data = await res.json();
      setFiles(data.files ?? []);
      setLoaded(true);
    }
  }

  async function handleNewFile(e: React.MouseEvent) {
    e.stopPropagation();
    const title = prompt("File title:");
    if (!title) return;
    const res = await fetch("/api/files", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, folder_id: folder.id }),
    });
    const data = await res.json();
    if (data.file) {
      setFiles((prev) => [data.file, ...prev]);
      setOpen(true);
      router.push(`/vault/${data.file.id}`);
    }
  }

  async function handleDeleteFolder(e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm(`Delete "${folder.name}" and everything inside it?`)) return;
    await fetch(`/api/folders/${folder.id}`, { method: "DELETE" });
    onChanged();
  }

  return (
    <div>
      <div
        onClick={toggle}
        className="group flex cursor-pointer items-center justify-between rounded px-2 py-1 text-sm hover:bg-neutral-100"
      >
        <span className="truncate">{open ? "📂" : "📁"} {folder.name}</span>
        <div className="hidden gap-1 group-hover:flex">
          <Button variant="ghost" className="px-1.5 py-0.5 text-xs" onClick={handleNewFile}>
            + file
          </Button>
          <Button variant="danger" className="px-1.5 py-0.5 text-xs" onClick={handleDeleteFolder}>
            ✕
          </Button>
        </div>
      </div>

      {open && (
        <div className="ml-4 border-l border-neutral-200 pl-2">
          {children.map((child) => (
            <FolderNode
              key={child.id}
              folder={child}
              allFolders={allFolders}
              refreshToken={refreshToken}
              onChanged={onChanged}
            />
          ))}
          {files.map((f) => (
            <FileNode
              key={f.id}
              id={f.id}
              title={f.title}
              active={params.fileId === f.id}
              onDeleted={() => setFiles((prev) => prev.filter((x) => x.id !== f.id))}
            />
          ))}
        </div>
      )}
    </div>
  );
}
