import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type DashboardKey = {
  id: string;
  name: string;
  key_prefix: string | null;
  is_active: boolean;
  created_at: string;
};

export type UsageLog = {
  id: string;
  key_id: string | null;
  query_length: number | null;
  top_n: number | null;
  latency_ms: number | null;
  success: boolean | null;
  created_at: string;
};

export type DashboardSnapshot = {
  user: {
    id: string;
    email: string;
  };
  credits: number;
  keyCount: number;
  totalCalls: number;
  latestLatencyMs: number | null;
  keys: DashboardKey[];
  recentCalls: UsageLog[];
};

export async function getDashboardSnapshot(): Promise<DashboardSnapshot | null> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const admin = createSupabaseAdminClient();

  const [balanceRes, keysRes, countRes, latestRes, recentRes] = await Promise.all([
    admin.from("credit_balances").select("credits").eq("user_id", user.id).maybeSingle(),
    admin.from("api_keys").select("id,name,key_prefix,is_active,created_at").eq("user_id", user.id).order("created_at", { ascending: false }),
    admin.from("usage_logs").select("id", { count: "exact", head: true }).eq("user_id", user.id),
    admin.from("usage_logs").select("latency_ms").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    admin.from("usage_logs").select("id,key_id,query_length,top_n,latency_ms,success,created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(10)
  ]);

  return {
    user: { id: user.id, email: user.email ?? "" },
    credits: balanceRes.data?.credits ?? 0,
    keyCount: keysRes.data?.length ?? 0,
    totalCalls: countRes.count ?? 0,
    latestLatencyMs: latestRes.data?.latency_ms ?? null,
    keys: (keysRes.data ?? []) as DashboardKey[],
    recentCalls: (recentRes.data ?? []) as UsageLog[]
  };
}
