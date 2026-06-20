import { createClient } from "@supabase/supabase-js";
import { getSupabaseServiceRoleKey, getSupabaseUrl } from "@/lib/supabase/env";

export function createSupabaseAdminClient() {
  const url = getSupabaseUrl();
  const serviceRoleKey = getSupabaseServiceRoleKey();

  if (!url || !serviceRoleKey) {
    throw new Error("Missing Supabase URL or service role key. Set NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY, or SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY.");
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}
