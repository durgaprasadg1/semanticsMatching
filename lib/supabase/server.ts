// Server-side Supabase client — for Server Components and Route Handlers.
// Reads/writes the session via cookies so RLS-scoped queries work on the server.
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component with no write access — middleware
            // already refreshes the session, so this is safe to ignore.
          }
        },
      },
    }
  );
}

// Admin client — service role key, bypasses RLS. Only ever use this for
// trusted server-only operations (e.g. background jobs), never per-request
// user CRUD. Regular route handlers should use createClient() above so RLS
// still applies.
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}
