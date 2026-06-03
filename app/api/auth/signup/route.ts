import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function POST(request: NextRequest) {
  const cookiesToSet: { name: string; value: string; options: any }[] = [];
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return NextResponse.json({ ok: false, error: "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY." }, { status: 500 });
  }

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookies) {
        cookiesToSet.push(...(cookies as any[]));
      }
    }
  });

  let body: { email?: string; password?: string } = {};
  try { body = await request.json(); } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON." }, { status: 400 });
  }

  const email = body.email?.trim();
  const password = body.password ?? "";
  if (!email || !password) {
    return NextResponse.json({ ok: false, error: "Email and password are required." }, { status: 400 });
  }

  const redirectTo = new URL("/auth/callback", request.url).toString();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: redirectTo }
  });

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 });

  const response = NextResponse.json({
    ok: true,
    message: data.session ? "Account created and signed in." : "Account created. Check your email to confirm, then log in."
  });

  cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
  return response;
}
