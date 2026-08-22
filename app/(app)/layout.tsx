import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { FileTree } from "@/components/file-tree/FileTree";
import LogoutButton from "./LogoutButton";

// Shared shell for everything behind auth: sidebar (file tree + nav) + content area.
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="flex h-screen">
      <aside className="flex w-64 flex-col border-r border-neutral-200 bg-white">
        <div className="flex items-center justify-between border-b border-neutral-200 px-3 py-3">
          <span className="text-sm font-semibold">NoteGraph</span>
          <LogoutButton />
        </div>
        <nav className="flex gap-2 border-b border-neutral-200 px-3 py-2 text-sm">
          <Link href="/vault" className="text-neutral-700 hover:underline">Vault</Link>
          <Link href="/graph" className="text-neutral-700 hover:underline">Graph</Link>
        </nav>
        <div className="flex-1 overflow-hidden">
          <FileTree />
        </div>
        <div className="border-t border-neutral-200 px-3 py-2 text-xs text-neutral-400 truncate">
          {user.email}
        </div>
      </aside>
      <main className="relative flex-1 overflow-hidden bg-neutral-50 p-4">{children}</main>
    </div>
  );
}
