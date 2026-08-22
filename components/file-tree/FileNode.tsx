"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

export function FileNode({
  id,
  title,
  active,
  onDeleted,
}: {
  id: string;
  title: string;
  active: boolean;
  onDeleted: () => void;
}) {
  const router = useRouter();

  async function handleDelete(e: React.MouseEvent) {
    e.preventDefault();
    if (!confirm(`Delete "${title}"?`)) return;
    await fetch(`/api/files/${id}`, { method: "DELETE" });
    onDeleted();
    router.push("/vault");
  }

  return (
    <div
      className={`group flex items-center justify-between rounded px-2 py-1 text-sm ${
        active ? "bg-neutral-200" : "hover:bg-neutral-100"
      }`}
    >
      <Link href={`/vault/${id}`} className="flex-1 truncate">
        📄 {title}
      </Link>
      <Button
        variant="danger"
        className="hidden px-1.5 py-0.5 text-xs group-hover:inline-block"
        onClick={handleDelete}
      >
        ✕
      </Button>
    </div>
  );
}
