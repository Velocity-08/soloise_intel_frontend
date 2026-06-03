"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type Props = { userEmail: string | null };

function NavLink({ href, label, active }: { href: string; label: string; active?: boolean; }) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center border-b-2 px-0 py-1 text-[13px] font-medium transition ${
        active ? "border-[#0A0A0A] text-[#0A0A0A]" : "border-transparent text-[#737373] hover:text-[#0A0A0A]"
      }`}
    >
      {label}
    </Link>
  );
}

export default function SiteTopbar({ userEmail }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const authed = Boolean(userEmail);
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const publicLinks = [{ href: "/dashboard/docs", label: "Docs" }, { href: "/dashboard/playground", label: "Playground" }];
  const authedLinks = [{ href: "/dashboard", label: "Dashboard" }, { href: "/dashboard/keys", label: "Keys" }, { href: "/dashboard/playground", label: "Playground" }, { href: "/dashboard/docs", label: "Docs" }];

  async function signOut() {
    setSigningOut(true);
    await supabase.auth.signOut();
    router.push("/auth");
    router.refresh();
    setSigningOut(false);
  }

  const links = authed ? authedLinks : publicLinks;

  return (
    <header className="fixed inset-x-0 top-0 z-40 h-[var(--topbar-h)] border-b border-[#E5E5E5] bg-white/92 backdrop-blur-md">
      <div className="mx-auto flex h-full max-w-[1280px] items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="text-[15px] font-semibold tracking-tight text-[#0A0A0A]">Soloise</Link>

        <nav className="hidden items-center gap-5 md:flex">
          {links.map((link) => <NavLink key={link.href} href={link.href} label={link.label} active={pathname === link.href || pathname.startsWith(`${link.href}/`)} />)}
        </nav>

        <div className="hidden items-center gap-4 md:flex">
          {authed ? (
            <>
              <span className="max-w-[220px] truncate text-[13px] text-[#737373]">{userEmail}</span>
              <button type="button" onClick={signOut} disabled={signingOut} className="text-[13px] font-medium text-[#DC2626]">
                {signingOut ? "Signing out..." : "Sign out"}
              </button>
            </>
          ) : (
            <Link href="/auth" className="rounded-[6px] bg-[#0A0A0A] px-4 py-2 text-[13px] font-medium text-white">
              Sign in
            </Link>
          )}
        </div>

        <button type="button" onClick={() => setOpen((v) => !v)} className="md:hidden rounded-[6px] border border-[#E5E5E5] px-3 py-2 text-[13px] text-[#0A0A0A]">
          Menu
        </button>
      </div>

      {open ? (
        <div className="border-t border-[#E5E5E5] bg-white md:hidden">
          <div className="mx-auto flex max-w-[1280px] flex-col gap-3 px-4 py-4 sm:px-6">
            {links.map((link) => <Link key={link.href} href={link.href} onClick={() => setOpen(false)} className={`text-[14px] ${pathname === link.href || pathname.startsWith(`${link.href}/`) ? "font-semibold text-[#0A0A0A]" : "text-[#737373]"}`}>{link.label}</Link>)}
            {authed ? (
              <>
                <span className="text-[13px] text-[#737373]">{userEmail}</span>
                <button type="button" onClick={signOut} disabled={signingOut} className="text-left text-[14px] font-medium text-[#DC2626]">
                  {signingOut ? "Signing out..." : "Sign out"}
                </button>
              </>
            ) : (
              <Link href="/auth" onClick={() => setOpen(false)} className="text-[14px] font-medium text-[#0A0A0A]">
                Sign in / Get started
              </Link>
            )}
          </div>
        </div>
      ) : null}
    </header>
  );
}
