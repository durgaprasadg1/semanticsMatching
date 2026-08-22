"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { FolderNode } from "./FolderNode";
import { FileNode } from "./FileNode";
import { Button } from "@/components/ui/Button";

export type Folder = {
  id: string;
  name: string;
  parent_folder_id: string | null;
};

export type FileListItem = {
  id: string;
  title: string;
  folder_id: string | null;
};

// The whole file tree, root-level down. Root folders/files render at the top
// level; each FolderNode lazily fetches its own children when expanded.
export function FileTree() {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [rootFiles, setRootFiles] = useState<FileListItem[]>([]);
  const [refreshToken, setRefreshToken] = useState(0);
  const params = useParams<{ fileId?: string }>();
  const router = useRouter();

  const refresh = useCallback(() => setRefreshToken((t) => t + 1), []);

  useEffect(() => {
    (async () => {
      const [foldersRes, filesRes] = await Promise.all([
        fetch("/api/folders"),
        fetch("/api/files"), // no folder_id -> root files
      ]);
      const foldersData = await foldersRes.json();
      const filesData = await filesRes.json();
      setFolders(foldersData.folders ?? []);
      setRootFiles(filesData.files ?? []);
    })();
  }, [refreshToken]);

  const rootFolders = folders.filter((f) => f.parent_folder_id === null);

  async function handleNewFolder() {
    const name = prompt("Folder name:");
    if (!name) return;
    await fetch("/api/folders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    refresh();
  }

  async function handleNewRootFile() {
    const title = prompt("File title:");
    if (!title) return;
    const res = await fetch("/api/files", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
    const data = await res.json();
    if (data.file) {
      refresh();
      router.push(`/vault/${data.file.id}`);
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-neutral-200 px-3 py-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Vault</span>
        <div className="flex gap-1">
          <Button variant="ghost" className="px-1.5 py-0.5 text-xs" onClick={handleNewFolder}>
            + folder
          </Button>
          <Button variant="ghost" className="px-1.5 py-0.5 text-xs" onClick={handleNewRootFile}>
            + file
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {rootFolders.map((folder) => (
          <FolderNode key={folder.id} folder={folder} allFolders={folders} refreshToken={refreshToken} onChanged={refresh} />
        ))}
        {rootFiles.map((f) => (
          <FileNode
            key={f.id}
            id={f.id}
            title={f.title}
            active={params.fileId === f.id}
            onDeleted={refresh}
          />
        ))}
        {rootFolders.length === 0 && rootFiles.length === 0 && (
          <p className="px-2 py-4 text-sm text-neutral-400">Nothing here yet — create a file or folder.</p>
        )}
      </div>
    </div>
  );
}
