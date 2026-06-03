export const dynamic = "force-dynamic";

const nav = [
  { id: "quick-start", label: "Quick Start (1 min)" },
  { id: "authentication", label: "Authentication" },
  { id: "endpoints", label: "Endpoints" },
  { id: "request-format", label: "Request format" },
  { id: "response-format", label: "Response format" },
  { id: "error-codes", label: "Error codes" },
  { id: "limits", label: "Limits" }
];

export default function DocsPage() {
  return (
    <section className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[180px_1fr]">
        <aside className="lg:sticky lg:top-20 lg:h-fit">
          <div className="rounded-[8px] border border-[#E5E5E5] bg-white p-4">
            <div className="space-y-1 border-l-2 border-[#E5E5E5] pl-3">
              {nav.map((item) => (
                <a key={item.id} href={`#${item.id}`} className={`block border-l-2 py-1.5 pl-3 text-[13px] ${item.id === "quick-start" ? "border-[#0A0A0A] text-[#0A0A0A]" : "border-transparent text-[#737373]"}`}>
                  {item.label}
                </a>
              ))}
            </div>
          </div>
        </aside>

        <article className="space-y-8">
          <section id="quick-start" className="space-y-4">
            <h1 className="text-[22px] font-semibold text-[#0A0A0A]">Up and running in 60 seconds</h1>
            <InfoBox>1. Sign up and get your API key</InfoBox>
            <CodeBox>{`pip install requests`}</CodeBox>
            <CodeBox>{`import requests

API_KEY = "sk-sol-your_key_here"

r = requests.post(
    "https://api.soloise.com/recommend",
    headers={"Authorization": f"Bearer {API_KEY}"},
    json={"query": "help users convert faster on pricing page", "top_n": 3}
)

for principle in r.json()["principles"]:
    print(f"{principle['principle_name']}: {principle['one_liner']}")`}</CodeBox>
            <pre className="overflow-x-auto rounded-[8px] border border-[#E5E5E5] bg-[#FAFAFA] p-4 text-[13px] leading-6 text-[#16A34A]"><code>{`Zeigarnik Effect: Incomplete tasks hijack the brain until they're finished.
Loss Aversion: Losses feel twice as powerful as equivalent gains.
Social Proof Gradient: People follow the crowd when unsure what to do.`}</code></pre>
          </section>

          <Section id="authentication" title="Authentication">
            <p className="text-[14px] leading-7 text-[#0A0A0A]">All requests must include an <code className="rounded-[3px] bg-[#F5F5F5] px-1 py-0.5">Authorization</code> header:</p>
            <CodeBox>{`Authorization: Bearer sk-sol-your_key`}</CodeBox>
            <p className="text-[14px] leading-7 text-[#0A0A0A]">Keys are created in the dashboard. Each key shows only once. Revoked keys immediately stop working.</p>
          </Section>

          <Section id="endpoints" title="POST /recommend">
            <DataTable rows={[
              ["query", "string", "Yes", "—", "Any text. Your copy, headline, user problem."],
              ["top_n", "integer", "No", "3", "How many principles to return. Max 10."]
            ]} />
            <p className="text-[14px] leading-7 text-[#0A0A0A]">Response object explained:</p>
            <pre className="overflow-x-auto rounded-[8px] border border-[#E5E5E5] bg-[#FAFAFA] p-4 text-[13px] leading-6 text-[#0A0A0A]"><code>{`{
  "success": true,
  "principles": [
    {
      "id": "P1-001",
      "principle_name": "Zeigarnik Effect",
      "one_liner": "Incomplete tasks hijack the brain until they're finished.",
      "plain_english": "...",
      "when_to_use": "...",
      "when_NOT_to_use": "...",
      "example_copy": "...",
      "power_level": "High",
      "pillar": "Attention & Pattern Interrupts"
    }
  ],
  "meta": {
    "query_length": 58,
    "latency_ms": 312,
    "credits_remaining": 280
  }
}`}</code></pre>
          </Section>

          <Section id="request-format" title="Request format">
            <p className="text-[14px] leading-7 text-[#0A0A0A]">Send JSON with <code className="rounded-[3px] bg-[#F5F5F5] px-1 py-0.5">query</code> and optional <code className="rounded-[3px] bg-[#F5F5F5] px-1 py-0.5">top_n</code>.</p>
          </Section>

          <Section id="response-format" title="Response format">
            <p className="text-[14px] leading-7 text-[#0A0A0A]">A ranked list of behavioural principles, each with one-liners and implementation detail.</p>
          </Section>

          <Section id="error-codes" title="Error codes">
            <DataTable rows={[
              ["INVALID_KEY", "401", "Key missing or revoked"],
              ["NO_CREDITS", "402", "Credit balance is zero"],
              ["BAD_INPUT", "400", "Query too short or malformed"],
              ["INTERNAL_ERROR", "500", "Contact support"]
            ]} headers={["Code", "HTTP", "Meaning"]} />
          </Section>

          <Section id="limits" title="Limits">
            <DataTable rows={[
              ["Max query length", "10,000 characters"],
              ["Max top_n", "10"],
              ["Rate limit", "60 requests / minute"]
            ]} headers={["", ""]} />
          </Section>
        </article>
      </div>
    </section>
  );
}

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return <section id={id} className="space-y-4"><h2 className="text-[18px] font-semibold text-[#0A0A0A]">{title}</h2>{children}</section>;
}
function InfoBox({ children }: { children: React.ReactNode }) {
  return <div className="rounded-[8px] border border-[#E5E5E5] bg-white p-4 text-[14px] text-[#0A0A0A]">{children}</div>;
}
function CodeBox({ children }: { children: React.ReactNode }) {
  return <pre className="overflow-x-auto rounded-[8px] border border-[#E5E5E5] bg-[#FAFAFA] p-4 text-[13px] leading-6 text-[#0A0A0A]"><code>{children}</code></pre>;
}
function DataTable({ rows, headers }: { rows: string[][]; headers?: string[]; }) {
  const headerRow = headers ?? ["Parameter", "Type", "Required", "Default", "Description"];
  return (
    <div className="overflow-x-auto rounded-[8px] border border-[#E5E5E5] bg-white">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-[#F5F5F5] text-left text-[12px] font-semibold text-[#737373]">
            {headerRow.map((h, index) => <th key={index} className="px-4 py-3">{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index} className="border-t border-[#F5F5F5] text-[13px]">
              {row.map((cell, cellIndex) => <td key={cellIndex} className="px-4 py-3 text-[#0A0A0A]">{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
