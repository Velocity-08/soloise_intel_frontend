"use client";

import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { ArrowRight, Eye, EyeOff, Github } from "lucide-react";

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

function StepCard({
  index,
  title,
  active,
  done,
}: {
  index: number;
  title: string;
  active?: boolean;
  done?: boolean;
}) {
  return (
    <div
      className={`relative flex h-full min-h-[92px] flex-col justify-between rounded-[10px] border p-3.5 transition ${
        active
          ? "border-white bg-white text-black"
          : "border-white/15 bg-white/[0.04] text-white/80"
      }`}
    >
      <div
        className={`flex h-6 w-6 items-center justify-center rounded-full text-[12px] font-semibold ${
          active
            ? "bg-black text-white"
            : done
            ? "bg-[#FF5C1F] text-black"
            : "border border-white/20 text-white/60"
        }`}
      >
        {index}
      </div>
      <p className={`text-[12px] leading-[16px] font-medium ${active ? "text-black" : ""}`}>
        {title}
      </p>
    </div>
  );
}

export default function AuthForm() {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
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

  const heading = mode === "signin" ? "Welcome back" : "Sign up account";
  const sub =
    mode === "signin"
      ? "Sign in to your account to manage keys and credits."
      : "Enter your details to create your account.";

  return (
    <div className="w-full">
      <div className="grid w-full overflow-hidden rounded-[14px] border border-white/[0.1] bg-[#0a0a0a] shadow-[0_30px_80px_-20px_rgba(255,92,31,0.25)] lg:grid-cols-[1.05fr_1fr]">
        {/* LEFT — orange/yellow glow panel with steps */}
        <section className="relative overflow-hidden p-7 sm:p-10">
          {/* radial glow */}
          <div
            aria-hidden
            className="absolute inset-0 opacity-90"
            style={{
              background:
                "radial-gradient(75% 65% at 25% 30%, rgba(255,92,31,0.65) 0%, rgba(245,197,24,0.18) 35%, transparent 70%), radial-gradient(60% 50% at 80% 90%, rgba(255,92,31,0.35) 0%, transparent 60%), #0a0a0a"
            }}
          />
          {/* subtle grid */}
          <div
            aria-hidden
            className="absolute inset-0 opacity-[0.12] mix-blend-overlay"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)",
              backgroundSize: "40px 40px"
            }}
          />

          <div className="relative flex h-full min-h-[460px] flex-col">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/20 bg-black/30 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-white backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-[#F5C518]" />
              Soloise · API
            </div>

            <h1 className="mt-auto pt-12 text-[40px] leading-[1.05] font-semibold tracking-tight text-white sm:text-[48px]">
              Get Started <br /> with Us
            </h1>
            <p className="mt-3 max-w-[320px] text-[14px] leading-6 text-white/75">
              Complete these easy steps to register and start using the API.
            </p>

            {/* Step cards */}
            <div className="mt-6 grid grid-cols-3 gap-3">
              <StepCard index={1} title="Sign up your account" active />
              <StepCard index={2} title="Create your API key" />
              <StepCard index={3} title="Make your first call" />
            </div>
          </div>
        </section>

        {/* RIGHT — dark form */}
        <section className="bg-black p-7 sm:p-10">
          <div className="mx-auto w-full max-w-[400px]">
            <div className="text-center">
              <h2 className="text-[26px] font-semibold tracking-tight text-white">{heading}</h2>
              <p className="mt-1.5 text-[13px] text-white/55">{sub}</p>
            </div>

            {/* OAuth row */}
            <div className="mt-6 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={signInWithGoogle}
                disabled={loading}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-[8px] border border-white/[0.1] bg-white/[0.03] px-3 text-[13px] font-medium text-white transition hover:bg-white/[0.06] disabled:opacity-60"
              >
                <GoogleIcon />
                Google
              </button>
              <button
                type="button"
                disabled
                title="Coming soon"
                className="inline-flex h-10 items-center justify-center gap-2 rounded-[8px] border border-white/[0.1] bg-white/[0.03] px-3 text-[13px] font-medium text-white/60 cursor-not-allowed"
              >
                <Github className="h-4 w-4" />
                GitHub
              </button>
            </div>

            <div className="my-5 flex items-center gap-3 text-center text-[11px] uppercase tracking-[0.2em] text-white/30">
              <span className="flex-1 border-t border-white/[0.08]" />
              <span>or</span>
              <span className="flex-1 border-t border-white/[0.08]" />
            </div>

            <form onSubmit={submitEmailAuth} className="space-y-3.5">
              <label className="block">
                <span className="mb-1.5 block text-[12px] font-medium text-white/75">Email</span>
                <input
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-10 w-full rounded-[8px] border border-white/[0.1] bg-[#0a0a0a] px-3 text-[13px] text-white outline-none placeholder:text-white/30 transition focus:border-[#FF5C1F]/70 focus:ring-2 focus:ring-[#FF5C1F]/15"
                  placeholder="you@company.com"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-[12px] font-medium text-white/75">Password</span>
                <div className="relative">
                  <input
                    type={showPw ? "text" : "password"}
                    autoComplete={mode === "signin" ? "current-password" : "new-password"}
                    minLength={6}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-10 w-full rounded-[8px] border border-white/[0.1] bg-[#0a0a0a] px-3 pr-10 text-[13px] text-white outline-none placeholder:text-white/30 transition focus:border-[#FF5C1F]/70 focus:ring-2 focus:ring-[#FF5C1F]/15"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    aria-label={showPw ? "Hide password" : "Show password"}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 transition"
                  >
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {mode === "signup" ? (
                  <p className="mt-1.5 text-[11px] text-white/40">Must be at least 6 characters.</p>
                ) : null}
              </label>

              {error ? (
                <div className="rounded-[8px] border border-red-400/20 bg-red-500/10 px-3 py-2 text-[12px] text-red-200">
                  {error}
                </div>
              ) : null}
              {notice ? (
                <div className="rounded-[8px] border border-[#F5C518]/25 bg-[#F5C518]/10 px-3 py-2 text-[12px] text-[#F5C518]">
                  {notice}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={loading}
                className="group relative inline-flex h-11 w-full items-center justify-center gap-2 overflow-hidden rounded-[8px] bg-gradient-to-r from-[#FF5C1F] to-[#FFA033] px-4 text-[14px] font-semibold text-black transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span className="relative z-10">
                  {loading ? "Working..." : mode === "signin" ? "Sign in" : "Sign up"}
                </span>
                <ArrowRight className="relative z-10 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </button>
            </form>

            <p className="mt-5 text-center text-[12px] text-white/45">
              {mode === "signin" ? (
                <>
                  Don&apos;t have an account?{" "}
                  <button
                    type="button"
                    onClick={() => { setMode("signup"); setError(null); setNotice(null); }}
                    className="font-medium text-[#FF7A2D] hover:text-[#FFD84D] transition"
                  >
                    Sign up
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => { setMode("signin"); setError(null); setNotice(null); }}
                    className="font-medium text-[#FF7A2D] hover:text-[#FFD84D] transition"
                  >
                    Log in
                  </button>
                </>
              )}
            </p>
          </div>
        </section>
      </div>

      <p className="mt-6 text-center text-[11px] text-white/30">
        By continuing, you agree to the Terms and Privacy Policy.
      </p>
    </div>
  );
}
