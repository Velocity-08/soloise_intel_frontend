import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabase/env";

export function createSupabaseBrowserClient() {
  const url = getSupabaseUrl();
  const anonKey = getSupabaseAnonKey();

  if (!url || !anonKey) {
    throw new Error("Missing Supabase URL or anon key. Set NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY, or SUPABASE_URL / SUPABASE_ANON_KEY.");
  }

  return createBrowserClient(url, anonKey);
}
