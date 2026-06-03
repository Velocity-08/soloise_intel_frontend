import { redirect } from "next/navigation";
import KeyManager from "@/components/key-manager";
import { getDashboardSnapshot } from "@/lib/dashboard";

export const dynamic = "force-dynamic";

export default async function KeysPage() {
  const snapshot = await getDashboardSnapshot();
  if (!snapshot) redirect("/auth");

  return (
    <section className="space-y-6">
      <div><h1 className="text-[22px] font-semibold text-[#0A0A0A]">API Keys</h1></div>
      <KeyManager initialKeys={snapshot.keys} />
    </section>
  );
}
