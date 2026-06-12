
import { createHash, randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabase/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type CookieToSet = { name: string; value: string; options: any; };

function buildSupabaseClient(request: NextRequest, cookiesToSet: CookieToSet[]) {
  const url = getSupabaseUrl();
  const anonKey = getSupabaseAnonKey();
  if (!url || !anonKey) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY.");

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() { return request.cookies.getAll(); },
      setAll(cookies) { cookiesToSet.push(...(cookies as CookieToSet[])); }
    }
  });
}

function applyCookies(response: NextResponse, cookiesToSet: CookieToSet[]) {
  for (const cookie of cookiesToSet) response.cookies.set(cookie.name, cookie.value, cookie.options);
}

function hashKey(rawKey: string) {
  return createHash("sha256").update(rawKey).digest("hex");
}

function generateApiKey() {
  const rawKey = `sk-sol-${randomBytes(20).toString("hex")}`;
  return { rawKey, keyHash: hashKey(rawKey), keyPrefix: rawKey.slice(0, 16) };
}

export async function GET(request: NextRequest) {
  const cookiesToSet: CookieToSet[] = [];
  const supabase = buildSupabaseClient(request, cookiesToSet);
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    const response = NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    applyCookies(response, cookiesToSet);
    return response;
  }

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.from("api_keys").select("id,name,key_prefix,is_active,created_at").eq("user_id", user.id).order("created_at", { ascending: false });

  if (error) {
    const response = NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    applyCookies(response, cookiesToSet);
    return response;
  }

  const response = NextResponse.json(data ?? []);
  applyCookies(response, cookiesToSet);
  return response;
}

export async function POST(request: NextRequest) {
  const cookiesToSet: CookieToSet[] = [];
  const supabase = buildSupabaseClient(request, cookiesToSet);
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    const response = NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    applyCookies(response, cookiesToSet);
    return response;
  }

  let body: { name?: string } = {};
  try { body = await request.json(); } catch { body = {}; }

  const name = body.name?.trim() || "Default Key";
  const { rawKey, keyHash, keyPrefix } = generateApiKey();
  const admin = createSupabaseAdminClient();

  const { data, error } = await admin.from("api_keys").insert({
    user_id: user.id,
    name,
    key_prefix: keyPrefix,
    key_hash: keyHash,
    is_active: true
  }).select("id,name,key_prefix,is_active,created_at").single();

  if (error) {
    const response = NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    applyCookies(response, cookiesToSet);
    return response;
  }

  const response = NextResponse.json({ ok: true, key: rawKey, api_key: data });
  applyCookies(response, cookiesToSet);
  return response;
}

