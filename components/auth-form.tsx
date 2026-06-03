"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type Mode = "signin" | "signup";

async function safeReadJson(response: Response) {
  const text = await response.text();
  if (!text) return null;
  try { return JSON.parse(text) as any; } catch { return { message: text }; }
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
      <path fill="#EA4335" d="M12 10.2v3.9h5.4c-.2 1.2-.9 2.3-1.8 3l2.9 2.3c1.7-1.6 2.7-4 2.7-6.8 0-.7-.1-1.3-.2-1.9H12z" />
      <path fill="#34A853" d="M6.6 14.5 5.8 15l-2.5 2c1.6 3 4.7 5 8.7 5 2.8 0 5.1-.9 6.8-2.6l-2.9-2.3c-.8.5-1.8.9-3.2.9-2.5 0-4.6-1.7-5.3-4.1z" />
      <path fill="#FBBC05" d="M4.5 7.2 2 5.2C.9 7 .3 9 .3 11s.6 4 1.7 5.8l2.5-2c-.4-1-.6-2-.6-3.1s.2-2.1.6-3.1z" />
      <path fill="#4285F4" d="M12 4.8c1.5 0 2.9.5 4 1.5l3-3C17.1 1.5 14.9.6 12 .6 8 0 4.9 2 2 5.2l2.5 2c.7-2.4 3-4.4 5.5-4.4z" />
    </svg>
  );
}

export default function AuthForm() {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function signInWithGoogle() {
    setLoading(true);
    setError(null);
    setNotice(null);
    const redirectTo = `${window.location.origin}/auth/callback`;
    const { error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo } });
    if (error) {
      setError(error.message);
      setLoading(false);
    }
  }

  async function submitEmailAuth(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setNotice(null);

    try {
      const endpoint = mode === "signin" ? "/api/auth/signin" : "/api/auth/signup";
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const data = (await safeReadJson(response)) as { ok?: boolean; message?: string; error?: string } | null;

      if (!response.ok) {
        setError(data?.error || data?.message || "Authentication failed.");
        return;
      }

      if (mode === "signin") {
        router.push("/dashboard");
        router.refresh();
        return;
      }

      setNotice(data?.message || "Account created. Check your email to confirm, then log in.");
      if (data?.message?.toLowerCase().includes("signed in")) {
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      setError("Network error.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-[400px]">
      <div className="rounded-[8px] border border-[#E5E5E5] bg-white p-10 shadow-sm">
        <div>
          <p className="text-[20px] font-semibold tracking-tight text-[#0A0A0A]">Soloise</p>
          <h1 className="mt-3 text-[24px] font-semibold tracking-tight text-[#0A0A0A]">
            {mode === "signin" ? "Sign in to your account" : "Create your account"}
          </h1>
          <p className="mt-2 text-[13px] font-medium text-[#16A34A]">Free $3 credit on first login.</p>
        </div>

        <button type="button" onClick={signInWithGoogle} disabled={loading} className="mt-6 inline-flex h-10 w-full items-center justify-center gap-2 rounded-[6px] border border-[#E5E5E5] bg-white px-4 text-[14px] font-medium text-[#0A0A0A] transition hover:bg-[#FAFAFA] disabled:cursor-not-allowed disabled:opacity-60">
          <GoogleIcon />
          Continue with Google
        </button>

        <div className="my-5 flex items-center gap-3 text-center text-[11px] text-[#737373]">
          <span className="flex-1 border-t border-[#E5E5E5]" />
          <span>or</span>
          <span className="flex-1 border-t border-[#E5E5E5]" />
        </div>

        <div className="grid grid-cols-2 gap-0 overflow-hidden rounded-[6px]">
          <button type="button" onClick={() => setMode("signin")} className={`h-10 text-[14px] font-medium ${mode === "signin" ? "bg-[#0A0A0A] text-white" : "bg-[#F5F5F5] text-[#0A0A0A]"}`}>Sign in</button>
          <button type="button" onClick={() => setMode("signup")} className={`h-10 text-[14px] font-medium ${mode === "signup" ? "bg-[#0A0A0A] text-white" : "bg-[#F5F5F5] text-[#0A0A0A]"}`}>Create account</button>
        </div>

        <form onSubmit={submitEmailAuth} className="mt-5 space-y-4">
          <label className="block">
            <span className="mb-2 block text-[13px] font-medium text-[#0A0A0A]">Email</span>
            <input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="h-10 w-full rounded-[6px] border border-[#E5E5E5] bg-white px-3.5 text-[14px] text-[#0A0A0A] outline-none placeholder:text-[#A3A3A3] focus:border-[#0A0A0A]" placeholder="you@company.com" />
          </label>

          <label className="block">
            <span className="mb-2 block text-[13px] font-medium text-[#0A0A0A]">Password</span>
            <input type="password" autoComplete={mode === "signin" ? "current-password" : "new-password"} minLength={6} required value={password} onChange={(e) => setPassword(e.target.value)} className="h-10 w-full rounded-[6px] border border-[#E5E5E5] bg-white px-3.5 text-[14px] text-[#0A0A0A] outline-none placeholder:text-[#A3A3A3] focus:border-[#0A0A0A]" placeholder="••••••••" />
          </label>

          {error ? <div className="rounded-[8px] border border-[#FCA5A5] bg-[#FEF2F2] px-4 py-3 text-[13px] text-[#DC2626]">{error}</div> : null}
          {notice ? <div className="rounded-[8px] border border-[#16A34A] bg-[#F0FDF4] px-4 py-3 text-[13px] text-[#16A34A]">{notice}</div> : null}

          <button type="submit" disabled={loading} className="inline-flex h-10 w-full items-center justify-center rounded-[6px] bg-[#0A0A0A] px-4 text-[14px] font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60">
            {loading ? "Working..." : mode === "signin" ? "Sign in" : "Create account"}
          </button>
        </form>

        <p className="mt-5 text-[13px] leading-6 text-[#737373]">
          By creating an account you agree to our Terms and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
