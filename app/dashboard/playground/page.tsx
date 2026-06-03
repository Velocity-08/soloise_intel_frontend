import { redirect } from "next/navigation";
import PlaygroundClient from "@/components/playground-client";
import { getDashboardSnapshot } from "@/lib/dashboard";

export const dynamic = "force-dynamic";

export default async function PlaygroundPage() {
  const snapshot = await getDashboardSnapshot();
  if (!snapshot) redirect("/auth");

  return (
    <section className="space-y-6">
      <PlaygroundClient creditsRemaining={snapshot.credits} initialKeys={snapshot.keys} />
    </section>
  );
}
