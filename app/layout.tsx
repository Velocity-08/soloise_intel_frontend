import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import SiteTopbar from "@/components/site-topbar";
import { createSupabaseServerClient } from "@/lib/supabase/server";
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
  description: "A single-premium dashboard for auth, API keys, and usage analytics."
};

async function getUserEmail() {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    return user?.email ?? null;
  } catch {
    return null;
  }
}

export default async function RootLayout({
  children
}: Readonly<{ children: ReactNode }>) {
  const userEmail = await getUserEmail();

  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        <SiteTopbar userEmail={userEmail} />
        <div style={{ paddingTop: "var(--topbar-h, 68px)" }}>
          {children}
        </div>
      </body>
    </html>
  );
}


