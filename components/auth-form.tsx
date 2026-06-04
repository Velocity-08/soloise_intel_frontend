"use client";

import { useMemo, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { ArrowRight, Sparkles, Shield, Zap } from "lucide-react";

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
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo }
    });
    if (error) {
      setError(error.message);
      setLoading(false);
    }
  }

  async function submitEmailAuth(event: FormEvent<HTMLFormElement>) {
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

      setNotice(data?.message || "Account created.");
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
    <div className="grid w-full max-w-6xl gap-6 lg:grid-cols-[1.05fr_0.95fr]">
      <section className="relative overflow-hidden rounded-[28px] border border-white/10 bg-white/5 p-8 shadow-soft backdrop-blur-xl sm:p-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.18),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(16,185,129,0.14),transparent_30%)]" />
        <div className="relative">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-[12px] text-cyan-100">
            <Sparkles className="h-3.5 w-3.5" />
            Premium dashboard access
          </div>

          <h1 className="mt-6 max-w-xl text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            One account.
            <span className="block text-white/70">Keys, credits, and analytics in one place.</span>
          </h1>

          <p className="mt-5 max-w-2xl text-[15px] leading-7 text-white/60">
            Sign in to unlock API key creation. Your starter credits stay attached to the first authenticated session, and your usage analytics live on the same dashboard.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <InfoChip icon={<Shield className="h-4 w-4" />} title="Secure" text="Supabase auth and protected keys" />
            <InfoChip icon={<Zap className="h-4 w-4" />} title="Fast" text="Single-page workflow" />
            <InfoChip icon={<ArrowRight className="h-4 w-4" />} title="Focused" text="No extra navigation clutter" />
          </div>

          <div className="mt-10 rounded-[24px] border border-white/10 bg-black/40 p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <PreviewCard title="Dashboard" text="Locked until sign-in" />
              <PreviewCard title="API keys" text="Create from the same screen" />
              <PreviewCard title="Analytics" text="Selected key usage on demand" />
              <PreviewCard title="Credits" text="Starter balance on first login" />
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[28px] border border-white/10 bg-[#0b0b0d]/92 p-6 shadow-soft backdrop-blur-xl sm:p-8">
        <div className="mx-auto w-full max-w-[460px]">
          <div>
            <p className="text-[13px] font-medium uppercase tracking-[0.2em] text-white/45">Authentication</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white">
              {mode === "signin" ? "Welcome back" : "Create your account"}
            </h2>
            <p className="mt-2 text-[14px] leading-6 text-white/55">
              {mode === "signin"
                ? "Open the dashboard, unlock your keys, and monitor every request from one panel."
                : "Create an account to unlock the dashboard and receive starter credits on first login."}
            </p>
          </div>

          <button
            type="button"
            onClick={signInWithGoogle}
            disabled={loading}
            className="mt-7 inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 text-[14px] font-medium text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <GoogleIcon />
            Continue with Google
          </button>

          <div className="my-5 flex items-center gap-3 text-center text-[11px] uppercase tracking-[0.18em] text-white/30">
            <span className="flex-1 border-t border-white/10" />
            <span>or email</span>
            <span className="flex-1 border-t border-white/10" />
          </div>

          <div className="grid grid-cols-2 gap-0 overflow-hidden rounded-2xl border border-white/10 bg-white/5">
            <button
              type="button"
              onClick={() => setMode("signin")}
              className={`h-11 text-[14px] font-medium transition ${
                mode === "signin" ? "bg-white text-black" : "bg-transparent text-white/70 hover:bg-white/5"
              }`}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => setMode("signup")}
              className={`h-11 text-[14px] font-medium transition ${
                mode === "signup" ? "bg-white text-black" : "bg-transparent text-white/70 hover:bg-white/5"
              }`}
            >
              Create account
            </button>
          </div>

          <form onSubmit={submitEmailAuth} className="mt-5 space-y-4">
            <label className="block">
              <span className="mb-2 block text-[13px] font-medium text-white/80">Email</span>
              <input
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11 w-full rounded-2xl border border-white/10 bg-black/40 px-4 text-[14px] text-white outline-none placeholder:text-white/30 focus:border-cyan-300/40"
                placeholder="you@company.com"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-[13px] font-medium text-white/80">Password</span>
              <input
                type="password"
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                minLength={6}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11 w-full rounded-2xl border border-white/10 bg-black/40 px-4 text-[14px] text-white outline-none placeholder:text-white/30 focus:border-cyan-300/40"
                placeholder="••••••••"
              />
            </label>

            {error ? <div className="rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-[13px] text-red-200">{error}</div> : null}
            {notice ? <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-[13px] text-emerald-200">{notice}</div> : null}

            <button
              type="submit"
              disabled={loading}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-white px-4 text-[14px] font-semibold text-black transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Working..." : mode === "signin" ? "Sign in" : "Create account"}
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          <p className="mt-5 text-[13px] leading-6 text-white/40">
            Starter credits are attached to the first login, and everything stays in the same dashboard after that.
          </p>
        </div>
      </section>
    </div>
  );
}

function InfoChip({ icon, title, text }: { icon: ReactNode; title: string; text: string; }) {
  return (
    <div className="rounded-[22px] border border-white/10 bg-black/30 p-4">
      <div className="flex items-center gap-2 text-white">
        {icon}
        <span className="text-[13px] font-medium">{title}</span>
      </div>
      <p className="mt-2 text-[13px] leading-6 text-white/50">{text}</p>
    </div>
  );
}

function PreviewCard({ title, text }: { title: string; text: string; }) {
  return (
    <div className="rounded-[20px] border border-white/10 bg-white/5 p-4">
      <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-white/35">{title}</p>
      <p className="mt-2 text-[14px] text-white/75">{text}</p>
    </div>
  );
}
