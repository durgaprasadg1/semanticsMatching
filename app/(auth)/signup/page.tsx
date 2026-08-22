"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/callback` },
    });
    setLoading(false);
    if (error) return setError(error.message);
    setDone(true);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50">
      <div className="w-full max-w-sm space-y-6 rounded-xl border border-neutral-200 bg-white p-8 shadow-sm">
        <div>
          <h1 className="text-xl font-semibold">Create your account</h1>
          <p className="text-sm text-neutral-500">Start building your knowledge graph.</p>
        </div>

        {done ? (
          <p className="text-sm text-neutral-700">
            Check your inbox for a confirmation link, then log in.
          </p>
        ) : (
          <form onSubmit={handleSignup} className="space-y-3">
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
              placeholder="Password (min 6 chars)"
              minLength={6}
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
              {loading ? "Creating…" : "Sign up"}
            </button>
          </form>
        )}

        <p className="text-center text-sm text-neutral-500">
          Already have an account? <a href="/login" className="font-medium text-neutral-900 underline">Log in</a>
        </p>
      </div>
    </div>
  );
}
