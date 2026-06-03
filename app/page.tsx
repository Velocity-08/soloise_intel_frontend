import { redirect } from "next/navigation";
import { getDashboardSnapshot } from "@/lib/dashboard";

export const dynamic = "force-dynamic";

function formatDate(value: string) {
  return new Date(value).toLocaleString();
}

function StatCard({ label, value, suffix, tone = "default" }: { label: string; value: string | number; suffix: string; tone?: "default" | "amber" | "danger"; }) {
  const toneClass = tone === "amber" ? "text-[#D97706]" : tone === "danger" ? "text-[#DC2626]" : "text-[#0A0A0A]";
  return (
    <div className="rounded-[8px] border border-[#E5E5E5] bg-white p-5">
      <p className="text-[12px] font-medium text-[#737373]">{label}</p>
      <p className={`mt-4 text-[32px] font-semibold tracking-tight ${toneClass}`}>{value}</p>
      {suffix ? <p className="mt-1 text-[12px] text-[#737373]">{suffix}</p> : null}
    </div>
  );
}

export default async function DashboardPage() {
  const snapshot = await getDashboardSnapshot();
  if (!snapshot) redirect("/auth");

  const keyNameById = new Map(snapshot.keys.map((key) => [key.id, key.name]));
  const lowCredits = snapshot.credits < 50;
  const zeroCredits = snapshot.credits === 0;

  return (
    <section className="space-y-6">
      <div><h1 className="text-[22px] font-semibold text-[#0A0A0A]">Overview</h1></div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Credits" value={snapshot.credits} suffix="remaining" tone={zeroCredits ? "danger" : lowCredits ? "amber" : "default"} />
        <StatCard label="API Keys" value={snapshot.keyCount} suffix="active" />
        <StatCard label="Total Calls" value={snapshot.totalCalls} suffix="this month" />
        <StatCard label="Last Latency" value={snapshot.latestLatencyMs == null ? "—" : `${snapshot.latestLatencyMs} ms`} suffix="" />
      </div>

      <div className="rounded-[8px] border border-[#E5E5E5] bg-white">
        <div className="border-b border-[#E5E5E5] px-4 py-3">
          <h2 className="text-[14px] font-semibold text-[#0A0A0A]">Recent API calls</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[#F5F5F5] text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-[#737373]">
                <th className="px-4 py-3">Time</th>
                <th className="px-4 py-3">Key used</th>
                <th className="px-4 py-3">Query length</th>
                <th className="px-4 py-3">Result</th>
                <th className="px-4 py-3">Credits used</th>
              </tr>
            </thead>
            <tbody>
              {snapshot.recentCalls.length > 0 ? snapshot.recentCalls.map((call, index) => (
                <tr key={call.id} className={`border-t border-[#F5F5F5] text-[13px] ${index % 2 === 1 ? "bg-[#FAFAFA]" : "bg-white"}`}>
                  <td className="px-4 py-3 text-[#737373]">{formatDate(call.created_at)}</td>
                  <td className="px-4 py-3 text-[#0A0A0A]">{call.key_id ? keyNameById.get(call.key_id) ?? call.key_id : "—"}</td>
                  <td className="px-4 py-3 text-[#0A0A0A]">{call.query_length ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-2 ${call.success ? "text-[#16A34A]" : "text-[#DC2626]"}`}>
                      <span className="text-[16px] leading-none">●</span>
                      <span>{call.success ? "Success" : "Error"}</span>
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[#0A0A0A]">1</td>
                </tr>
              )) : (
                <tr><td className="px-4 py-10 text-center text-[13px] text-[#737373]" colSpan={5}>No API calls yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
