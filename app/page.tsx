import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Landing route — bounces straight to the app or to login.
export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  redirect(user ? "/vault" : "/login");
}
