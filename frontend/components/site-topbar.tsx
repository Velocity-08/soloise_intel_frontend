"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { Sparkles, LogOut, ShieldCheck } from "lucide-react";

type Props = { userEmail: string | null };

export default function SiteTopbar({ userEmail }: Props) {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [signingOut, setSigningOut] = useState(false);
  const authed = Boolean(userEmail);

  async function signOut() {
    setSigningOut(true);
    await supabase.auth.signOut();
    router.push("/auth");
    router.refresh();
    setSigningOut(false);
  }

  return (
    <header className="fixed inset-x-0 top-0 z-50 h-[var(--topbar-h)] border-b border-white/10 bg-black/[0.72] backdrop-blur-xl">
      <div className="mx-auto flex h-full max-w-[1400px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="inline-flex items-center gap-3">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 shadow-soft">
            <Sparkles className="h-4 w-4 text-cyan-300" />
          </span>
          <span className="flex flex-col leading-tight">
            <span className="text-[15px] font-semibold tracking-[0.12em] text-white uppercase">Soloise</span>
            <span className="text-[11px] text-white/45">Behavioral Intelligence API</span>
          </span>
        </Link>

        <div className="flex items-center gap-3">
          {authed ? (
            <>
              <span className="hidden items-center gap-2 rounded-full border border-emerald-400/[0.25] bg-emerald-400/10 px-3 py-1.5 text-[12px] text-emerald-200 md:inline-flex">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span className="max-w-[180px] truncate">{userEmail}</span>
              </span>
              <button
                type="button"
                onClick={signOut}
                disabled={signingOut}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[13px] font-medium text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <LogOut className="h-3.5 w-3.5" />
                {signingOut ? "Signing out" : "Sign out"}
              </button>
            </>
          ) : (
            <Link
              href="/auth"
              className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-[13px] font-medium text-cyan-100 transition hover:bg-cyan-300/[0.15]"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
