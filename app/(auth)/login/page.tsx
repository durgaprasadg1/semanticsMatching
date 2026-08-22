"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault();
   try {
      setLoading(true);
      setError(null);
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setLoading(false);
      if (error) return setError(error.message);
      router.push("/vault");
      router.refresh();
   } catch (error) {
      console.log(error);
   }
  }

  async function handleOAuth(provider: "google" | "github") {
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/callback` },
    });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50">
      <div className="w-full max-w-sm space-y-6 rounded-xl border border-neutral-200 bg-white p-8 shadow-sm">
        <div>
          <h1 className="text-xl font-semibold">Log in to NoteGraph</h1>
          <p className="text-sm text-neutral-500">Your second brain, linked automatically.</p>
        </div>

        <form onSubmit={handleEmailLogin} className="space-y-3">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-neutral-900 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {loading ? "Logging in…" : "Log in"}
          </button>
        </form>

        <div className="flex items-center gap-2 text-xs text-neutral-400">
          <div className="h-px flex-1 bg-neutral-200" /> or <div className="h-px flex-1 bg-neutral-200" />
        </div>

        <div className="space-y-2">
          <button
            onClick={() => handleOAuth("google")}
            className="w-full rounded-md border border-neutral-300 py-2 text-sm font-medium hover:bg-neutral-50"
          >
            Continue with Google
          </button>
          <button
            onClick={() => handleOAuth("github")}
            className="w-full rounded-md border border-neutral-300 py-2 text-sm font-medium hover:bg-neutral-50"
          >
            Continue with GitHub
          </button>
        </div>

        <p className="text-center text-sm text-neutral-500">
          No account? <a href="/signup" className="font-medium text-neutral-900 underline">Sign up</a>
        </p>
      </div>
    </div>
  );
}
