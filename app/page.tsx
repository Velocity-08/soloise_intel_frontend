
import { getDashboardSnapshot } from "@/lib/dashboard";
import DashboardView from "@/components/dashboard-view";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const snapshot = await getDashboardSnapshot();
  return <DashboardView snapshot={snapshot} />;
}

