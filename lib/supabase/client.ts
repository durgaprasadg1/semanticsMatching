// Browser-side Supabase client. Use this in "use client" components only.
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const supabaseURL=process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  
  return createBrowserClient( 
   supabaseURL,anonKey
  );
}
