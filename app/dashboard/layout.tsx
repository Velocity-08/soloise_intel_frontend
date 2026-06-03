import { redirect } from "next/navigation";
import DashboardShell from "@/components/dashboard-shell";
import { getDashboardSnapshot } from "@/lib/dashboard";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  const snapshot = await getDashboardSnapshot();
  if (!snapshot) redirect("/auth");
  return <DashboardShell userEmail={snapshot.user.email}>{children}</DashboardShell>;
}
