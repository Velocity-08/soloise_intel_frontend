import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabase/env";

type CookieToSet = { name: string; value: string; options: any };

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");

  if (!code) return NextResponse.redirect(new URL("/auth?error=missing_code", url.origin));

  const supabaseUrl = getSupabaseUrl();
  const anonKey = getSupabaseAnonKey();

  if (!supabaseUrl) {
    console.error("Missing Supabase URL. Check NEXT_PUBLIC_SUPABASE_URL or SUPABASE_URL env vars");
    return NextResponse.redirect(new URL("/auth?error=missing_supabase_url", url.origin));
  }

  if (!anonKey) {
    console.error("Missing Supabase Anon Key. Check NEXT_PUBLIC_SUPABASE_ANON_KEY or SUPABASE_ANON_KEY env vars");
    return NextResponse.redirect(new URL("/auth?error=missing_supabase_key", url.origin));
  }

  const response = NextResponse.redirect(new URL("/dashboard", url.origin));

  const supabase = createServerClient(supabaseUrl, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      }
    }
  });

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    console.error("Supabase OAuth callback failed:", {
      message: error.message,
      status: error.status,
      code: error.code,
      supabaseUrl,
      codeLength: code?.length
    });
    return NextResponse.redirect(new URL("/auth?error=oauth_failed&details=" + encodeURIComponent(error.message), url.origin));
  }

  return response;
}