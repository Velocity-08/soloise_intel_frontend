import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type CookieToSet = { name: string; value: string; options: any; };
type RouteContext = { params: { id: string } };

function buildSupabaseClient(request: NextRequest, cookiesToSet: CookieToSet[]) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
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

export async function DELETE(request: NextRequest, context: RouteContext) {
  const cookiesToSet: CookieToSet[] = [];
  const supabase = buildSupabaseClient(request, cookiesToSet);
  const admin = createSupabaseAdminClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    const response = NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
    applyCookies(response, cookiesToSet);
    return response;
  }

  const { data, error } = await admin.from("api_keys").update({ is_active: false }).eq("id", context.params.id).eq("user_id", user.id).select("id").maybeSingle();

  if (error) {
    const response = NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    applyCookies(response, cookiesToSet);
    return response;
  }

  if (!data) {
    const response = NextResponse.json({ ok: false, error: "Key not found." }, { status: 404 });
    applyCookies(response, cookiesToSet);
    return response;
  }

  const response = NextResponse.json({ ok: true, revoked: data.id });
  applyCookies(response, cookiesToSet);
  return response;
}
