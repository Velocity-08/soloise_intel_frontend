import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import SiteTopbar from "@/components/site-topbar";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getDashboardSnapshot } from "@/lib/dashboard";
import "./globals.css";
import type { ReactNode } from "react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"]
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"]
});

export const metadata: Metadata = {
  title: "Soloise — Behavioral Intelligence API",
  description: "API keys, credits, and live analytics in one minimal dashboard."
};

async function getTopbarData() {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { email: null as string | null, credits: 0, totalCredits: 1000 };
    const snap = await getDashboardSnapshot();
    return {
      email: user.email ?? null,
      credits: snap?.credits ?? 0,
      totalCredits: 1000
    };
  } catch {
    return { email: null as string | null, credits: 0, totalCredits: 1000 };
  }
}

export default async function RootLayout({
  children
}: Readonly<{ children: ReactNode }>) {
  const { email, credits, totalCredits } = await getTopbarData();

  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        <SiteTopbar userEmail={email} credits={credits} totalCredits={totalCredits} />
        <div style={{ paddingTop: "var(--topbar-h, 56px)" }}>
          {children}
        </div>
      </body>
    </html>
  );
}
