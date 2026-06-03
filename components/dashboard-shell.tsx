"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

const links = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/keys", label: "API Keys" },
  { href: "/dashboard/playground", label: "Playground" },
  { href: "/dashboard/docs", label: "Documentation" }
];

export default function DashboardShell({
  userEmail,
  children
}: {
  userEmail: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [signingOut, setSigningOut] = useState(false);

  async function signOut() {
    setSigningOut(true);
    await supabase.auth.signOut();
    router.push("/auth");
    router.refresh();
    setSigningOut(false);
  }

  return (
    <div className="min-h-[calc(100vh-56px)] bg-[#FAFAFA]">
      <aside className="hidden lg:fixed lg:left-0 lg:top-14 lg:bottom-0 lg:block lg:w-[220px] lg:border-r lg:border-[#E5E5E5] lg:bg-white">
        <div className="flex h-full flex-col px-4 py-5">
          <div className="pb-5">
            <p className="text-[16px] font-semibold tracking-tight text-[#0A0A0A]">Soloise</p>
            <p className="mt-1 truncate text-[11px] text-[#737373]">{userEmail}</p>
          </div>

          <nav className="space-y-1">
            {links.map((link) => {
              const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex h-9 items-center border-l-2 px-4 text-[13px] font-medium transition ${
                    active ? "border-l-[#0A0A0A] bg-[#F5F5F5] text-[#0A0A0A]" : "border-l-transparent text-[#737373] hover:bg-[#F5F5F5]"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto pt-5">
            <button type="button" onClick={signOut} disabled={signingOut} className="text-[13px] font-medium text-[#DC2626] transition hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-60">
              {signingOut ? "Signing out..." : "Sign out"}
            </button>
          </div>
        </div>
      </aside>

      <div className="px-6 py-6 lg:pl-[244px] lg:pr-6">
        <div className="rounded-[8px] border border-[#E5E5E5] bg-white p-4 lg:hidden">
          <p className="text-[16px] font-semibold text-[#0A0A0A]">Soloise</p>
          <p className="mt-1 text-[11px] text-[#737373]">{userEmail}</p>
          <div className="mt-3 flex flex-wrap gap-3">
            {links.map((link) => (
              <Link key={link.href} href={link.href} className={`text-[13px] font-medium ${pathname === link.href || pathname.startsWith(`${link.href}/`) ? "text-[#0A0A0A]" : "text-[#737373]"}`}>
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="mx-auto max-w-[1120px] pt-6">{children}</div>
      </div>
    </div>
  );
}
