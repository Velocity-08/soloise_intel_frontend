"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { LogOut, ChevronDown, Zap, ExternalLink, Copy, Check } from "lucide-react";

type Props = {
  userEmail: string | null;
  credits?: number;
  totalCredits?: number;
};

function SoloiseMark() {
  // Pure CSS/SVG monogram — small orange diamond + wordmark
  return (
    <Link href="/" className="inline-flex items-center gap-2.5 group">
      <span className="relative inline-flex h-7 w-7 items-center justify-center">
        <svg viewBox="0 0 24 24" className="h-7 w-7">
          <rect x="2" y="2" width="20" height="20" rx="4" fill="#0a0a0a" stroke="rgba(255,255,255,0.14)" />
          <path d="M7 12 L12 7 L17 12 L12 17 Z" fill="#FF5C1F" />
        </svg>
      </span>
      <span className="text-[14px] font-semibold tracking-tight text-white">soloise</span>
      <span className="hidden sm:inline-flex h-[18px] items-center rounded-[4px] border border-white/10 bg-white/[0.04] px-1.5 text-[10px] font-medium uppercase tracking-wider text-white/55">
        beta
      </span>
    </Link>
  );
}

function Avatar({ email, size = 28 }: { email: string | null; size?: number }) {
  const initial = (email || "?").trim().charAt(0).toUpperCase();
  const px = `${size}px`;
  return (
    <span
      className="inline-flex items-center justify-center rounded-full border border-white/12 bg-gradient-to-br from-[#FF5C1F] to-[#F5C518] font-semibold text-black"
      style={{ width: px, height: px, fontSize: size <= 28 ? 11 : 14 }}
    >
      {initial}
    </span>
  );
}

export default function SiteTopbar({ userEmail, credits = 0, totalCredits = 1000 }: Props) {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [signingOut, setSigningOut] = useState(false);
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const popRef = useRef<HTMLDivElement | null>(null);
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const authed = Boolean(userEmail);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!open) return;
      const t = e.target as Node;
      if (popRef.current?.contains(t) || btnRef.current?.contains(t)) return;
      setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function signOut() {
    setSigningOut(true);
    await supabase.auth.signOut();
    setOpen(false);
    router.push("/auth");
    router.refresh();
    setSigningOut(false);
  }

  async function copyEmail() {
    if (!userEmail) return;
    await navigator.clipboard.writeText(userEmail);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }

  const pct = Math.max(0, Math.min(100, (credits / Math.max(1, totalCredits)) * 100));
  const low = credits < 50;

  return (
    <header className="fixed inset-x-0 top-0 z-50 h-[var(--topbar-h)] border-b border-white/[0.08] bg-black/85 backdrop-blur-xl">
      <div className="mx-auto flex h-full max-w-[1400px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-5">
          <SoloiseMark />
          <nav className="hidden md:flex items-center gap-1 text-[13px]">
            <Link href="/dashboard" className="px-2.5 py-1 rounded-[6px] text-white hover:bg-white/[0.05] transition">Dashboard</Link>
            <a href="https://soloise-intel.vercel.app" target="_blank" rel="noopener noreferrer" className="px-2.5 py-1 rounded-[6px] text-white/55 hover:text-white hover:bg-white/[0.05] transition inline-flex items-center gap-1">
              API <ExternalLink className="h-3 w-3 opacity-60" />
            </a>
          </nav>
        </div>

        <div className="flex items-center gap-2">
          {authed ? (
            <>
              {/* Credits chip — visible on md+ */}
              <div className="hidden md:inline-flex items-center gap-2 h-8 rounded-[6px] border border-white/[0.08] bg-white/[0.02] px-2.5 text-[12px] text-white/75 tabular">
                <Zap className={`h-3.5 w-3.5 ${low ? "text-[#F5C518]" : "text-[#FF7A2D]"}`} />
                <span className="font-medium text-white">{credits.toLocaleString()}</span>
                <span className="text-white/40">credits</span>
              </div>

              <button
                ref={btnRef}
                onClick={() => setOpen((v) => !v)}
                className={`inline-flex items-center gap-2 h-8 rounded-[6px] border border-white/[0.1] bg-white/[0.03] pl-1 pr-2 text-[12px] text-white hover:bg-white/[0.06] transition ${open ? "bg-white/[0.06]" : ""}`}
                aria-expanded={open}
              >
                <Avatar email={userEmail} size={22} />
                <span className="hidden sm:inline max-w-[160px] truncate text-white/85">{userEmail}</span>
                <ChevronDown className={`h-3.5 w-3.5 text-white/55 transition ${open ? "rotate-180" : ""}`} />
              </button>

              {open ? (
                <div
                  ref={popRef}
                  className="animate-pop absolute right-4 sm:right-6 lg:right-8 top-[calc(var(--topbar-h)+6px)] w-[300px] origin-top-right rounded-[10px] border border-white/[0.1] bg-[#0a0a0a] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.7)]"
                  role="menu"
                >
                  {/* Header */}
                  <div className="flex items-center gap-3 p-3 border-b border-white/[0.08]">
                    <Avatar email={userEmail} size={36} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium text-white">{userEmail}</p>
                      <button
                        onClick={copyEmail}
                        className="mt-0.5 inline-flex items-center gap-1 text-[11px] text-white/45 hover:text-white/80 transition"
                      >
                        {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                        {copied ? "Copied" : "Copy email"}
                      </button>
                    </div>
                  </div>

                  {/* Credits */}
                  <div className="p-3 border-b border-white/[0.08]">
                    <div className="flex items-center justify-between">
                      <div className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-white/45">
                        <Zap className="h-3 w-3" />
                        Credits remaining
                      </div>
                      <span className={`text-[11px] tabular ${low ? "text-[#F5C518]" : "text-white/55"}`}>
                        {credits.toLocaleString()} / {totalCredits.toLocaleString()}
                      </span>
                    </div>
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${pct}%`,
                          background: low
                            ? "linear-gradient(90deg, #F5C518, #FF5C1F)"
                            : "linear-gradient(90deg, #FF5C1F, #FFD84D)"
                        }}
                      />
                    </div>
                    <p className="mt-2 text-[11px] text-white/40">
                      {low ? "Low balance. Top up soon." : "1 credit per API call."}
                    </p>
                  </div>

                  {/* Quick row */}
                  <div className="grid grid-cols-2 gap-px bg-white/[0.06] border-b border-white/[0.08]">
                    <Link
                      href="/dashboard"
                      onClick={() => setOpen(false)}
                      className="bg-[#0a0a0a] px-3 py-2.5 text-[12px] text-white/80 hover:bg-white/[0.04] hover:text-white transition"
                    >
                      Dashboard
                    </Link>
                    <a
                      href="https://soloise-intel.vercel.app"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-[#0a0a0a] px-3 py-2.5 text-[12px] text-white/80 hover:bg-white/[0.04] hover:text-white transition inline-flex items-center gap-1"
                    >
                      API docs <ExternalLink className="h-3 w-3 opacity-60" />
                    </a>
                  </div>

                  {/* Sign out */}
                  <button
                    onClick={signOut}
                    disabled={signingOut}
                    className="flex w-full items-center gap-2 px-3 py-2.5 text-[13px] text-white/80 hover:bg-white/[0.04] hover:text-white transition disabled:opacity-50"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    {signingOut ? "Signing out..." : "Sign out"}
                  </button>
                </div>
              ) : null}
            </>
          ) : (
            <Link
              href="/auth"
              className="inline-flex items-center gap-1.5 h-8 rounded-[6px] bg-white px-3 text-[12px] font-medium text-black hover:bg-white/90 transition"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
