"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type DashboardKey = {
  id: string;
  name: string;
  key_prefix: string | null;
  is_active: boolean;
  created_at: string;
};

type ResultItem = {
  id?: string;
  principle_name?: string;
  one_liner?: string;
  power_level?: string;
  powerLevel?: string;
  when_to_use?: string;
  when_NOT_to_use?: string;
  example_copy?: string;
  whenToUse?: string;
  whenNotToUse?: string;
  exampleCopy?: string;
  plain_english?: string;
};

type SavedKey = { id: string; name: string; key_prefix: string; raw_key: string; };

type Props = {
  creditsRemaining: number;
  initialKeys: DashboardKey[];
};

async function safeReadJson(response: Response) {
  const text = await response.text();
  if (!text) return null;
  try { return JSON.parse(text) as any; } catch { return { message: text }; }
}

function readSavedKeys(): SavedKey[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.sessionStorage.getItem("soloise.savedKeys");
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SavedKey[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function codeForLanguage(language: "python" | "curl" | "node", keyLabel: string) {
  const prefix = keyLabel || "sk-sol-••••••••••••";
  if (language === "curl") {
    return `curl -X POST /api/recommend \\
  -H "Authorization: Bearer ${prefix}" \\
  -H "Content-Type: application/json" \\
  -d '{"query": "your query here", "top_n": 3}'`;
  }
  if (language === "node") {
    return `const res = await fetch("/api/recommend", {
  method: "POST",
  headers: {
    "Authorization": "Bearer ${prefix}",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({ query: "your query here", top_n: 3 })
});
const data = await res.json();
console.log(data.results?.[0]?.principle_name ?? data.principles?.[0]?.principle_name);`;
  }
  return `import requests

res = requests.post(
    "/api/recommend",
    headers={"Authorization": f"Bearer ${prefix}"},
    json={"query": "your query here", "top_n": 3}
)
print(res.json())`;
}

export default function PlaygroundClient({ creditsRemaining, initialKeys }: Props) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [query, setQuery] = useState("reduce signup drop-off");
  const [topN, setTopN] = useState<1 | 3 | 5 | 10>(3);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<ResultItem[]>([]);
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});
  const [language, setLanguage] = useState<"python" | "curl" | "node">("python");
  const [copyLabel, setCopyLabel] = useState("Copy");
  const [availableKeys, setAvailableKeys] = useState<DashboardKey[]>(initialKeys);
  const [selectedKeyId, setSelectedKeyId] = useState(initialKeys[0]?.id ?? "");

  useEffect(() => { setAvailableKeys(initialKeys); if (!selectedKeyId && initialKeys[0]) setSelectedKeyId(initialKeys[0].id); }, [initialKeys, selectedKeyId]);

  const savedKeys = readSavedKeys();
  const selectedRawKey = savedKeys.find((key) => key.id === selectedKeyId)?.raw_key ?? "";
  const codeBlock = codeForLanguage(language, selectedRawKey || availableKeys.find((k) => k.id === selectedKeyId)?.key_prefix || "");
  const canRun = Boolean(query.trim()) && running === false && creditsRemaining > 0;

  async function loadKeys() {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    const response = await fetch("/api/keys", { headers: token ? { Authorization: `Bearer ${token}` } : {} });
    const data = await safeReadJson(response);
    if (response.ok && Array.isArray(data)) {
      setAvailableKeys(data);
      if (!selectedKeyId && data[0]) setSelectedKeyId(data[0].id);
    }
  }

  useEffect(() => { loadKeys(); }, []);

  async function runQuery() {
    setRunning(true);
    setError(null);
    setResults([]);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const response = await fetch("/api/recommend", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ query, top_n: topN })
      });

      const data = await safeReadJson(response);
      if (!response.ok) {
        setError(data?.error || data?.message || "Request failed.");
        return;
      }

      const items = Array.isArray(data?.principles) ? data.principles : Array.isArray(data?.results) ? data.results : [];
      setResults(items);
    } catch {
      setError("Network error.");
    } finally {
      setRunning(false);
    }
  }

  async function copyCode() {
    await navigator.clipboard.writeText(codeBlock);
    setCopyLabel("Copied ✓");
    setTimeout(() => setCopyLabel("Copy"), 1500);
  }

  return (
    <section className="space-y-6">
      {creditsRemaining < 50 ? (
        <div className="border-b border-[#FDE68A] bg-[#FFFBEB] px-6 py-3 text-[13px] text-[#D97706]">
          You&apos;re running low on credits. Contact us to top up.
        </div>
      ) : null}

      <div className="grid min-h-[calc(100vh-200px)] grid-cols-1 overflow-hidden rounded-[8px] border border-[#E5E5E5] bg-white lg:grid-cols-2">
        <div className="border-r border-[#E5E5E5] p-6">
          <p className="text-[13px] font-medium text-[#737373]">Try the API</p>

          <div className="mt-4">
            <label className="mb-2 block text-[12px] font-medium text-[#0A0A0A]">Query</label>
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Describe your use case, copy goal, or product problem."
              className="h-[140px] w-full rounded-[6px] border border-[#E5E5E5] bg-white p-3.5 text-[14px] text-[#0A0A0A] outline-none placeholder:text-[#A3A3A3] focus:border-[#0A0A0A]"
            />
          </div>

          <div className="mt-4">
            <p className="mb-2 text-[12px] font-medium text-[#0A0A0A]">Results (top_n)</p>
            <div className="flex gap-2">
              {[1, 3, 5, 10].map((value) => {
                const active = topN === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setTopN(value as 1 | 3 | 5 | 10)}
                    className={`h-7 w-8 rounded-[4px] text-[13px] font-medium transition ${active ? "bg-[#0A0A0A] text-white" : "bg-[#F5F5F5] text-[#0A0A0A]"}`}
                  >
                    {value}
                  </button>
                );
              })}
            </div>
          </div>

          {error ? <div className="mt-4 rounded-[8px] border border-[#FCA5A5] bg-[#FEF2F2] px-4 py-3 text-[13px] text-[#DC2626]">{error}</div> : null}

          <button
            type="button"
            onClick={runQuery}
            disabled={!canRun}
            className="mt-5 inline-flex h-10 w-full items-center justify-center rounded-[6px] bg-[#0A0A0A] px-4 text-[15px] font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {running ? (
              <span className="inline-flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Running...
              </span>
            ) : creditsRemaining > 0 ? (
              "Run →"
            ) : (
              "No credits remaining. Contact us →"
            )}
          </button>

          {!selectedRawKey ? (
            <div className="mt-4 text-[13px] text-[#737373]">
              No usable key selected. <Link href="/dashboard/keys" className="text-[#2563EB]">Create a key first →</Link>
            </div>
          ) : null}

          <div className="mt-6 space-y-4">
            {results.length > 0 ? (
              results.map((item, index) => {
                const isOpen = Boolean(expanded[index]);
                return (
                  <article key={`${item.id ?? index}-${index}`} className="rounded-[8px] border border-[#E5E5E5] bg-white p-5">
                    <div className="flex items-start justify-between gap-4">
                      <p className="text-[11px] font-semibold text-[#737373]">#{index + 1}</p>
                      <span className="rounded-[4px] border border-[#DCFCE7] bg-[#F0FDF4] px-2 py-1 text-[11px] font-medium text-[#16A34A]">
                        {item.power_level ?? item.powerLevel ?? "High power"}
                      </span>
                    </div>

                    <h3 className="mt-3 text-[16px] font-semibold text-[#0A0A0A]">{item.principle_name ?? "Principle"}</h3>
                    <p className="mt-2 text-[14px] leading-6 text-[#737373]">{item.one_liner ?? item.plain_english ?? ""}</p>

                    <button type="button" onClick={() => setExpanded((current) => ({ ...current, [index]: !current[index] }))} className="mt-4 text-[12px] font-medium text-[#2563EB]">
                      {isOpen ? "− Hide detail" : "+ Show detail"}
                    </button>

                    {isOpen ? (
                      <div className="mt-4 space-y-3 border-t border-[#F5F5F5] pt-4">
                        <DetailRow label="When to use" value={item.when_to_use ?? item.whenToUse ?? "—"} />
                        <DetailRow label="When NOT to use" value={item.when_NOT_to_use ?? item.whenNotToUse ?? "—"} />
                        <DetailRow label="Example copy" value={item.example_copy ?? item.exampleCopy ?? "—"} />
                      </div>
                    ) : null}
                  </article>
                );
              })
            ) : (
              <div className="flex min-h-[240px] items-center justify-center rounded-[8px] border border-dashed border-[#E5E5E5] bg-white text-[13px] text-[#A3A3A3]">
                Run a query to see results here.
              </div>
            )}
          </div>
        </div>

        <div className="p-6">
          <div className="flex items-center justify-between gap-4">
            <label className="block flex-1">
              <span className="mb-2 block text-[12px] font-medium text-[#737373]">Your API key</span>
              {availableKeys.length > 0 ? (
                <select value={selectedKeyId} onChange={(e) => setSelectedKeyId(e.target.value)} className="h-10 w-full rounded-[6px] border border-[#E5E5E5] bg-white px-3.5 text-[13px] text-[#0A0A0A] outline-none focus:border-[#0A0A0A]">
                  {availableKeys.map((key) => (
                    <option key={key.id} value={key.id}>
                      {key.name} · {key.key_prefix || "saved"}
                    </option>
                  ))}
                </select>
              ) : (
                <Link href="/dashboard/keys" className="text-[13px] text-[#2563EB]">
                  Create a key first →
                </Link>
              )}
            </label>
          </div>

          <div className="mt-4 border-b border-[#E5E5E5]">
            <div className="flex gap-6">
              {[
                ["Python", "python"],
                ["cURL", "curl"],
                ["Node.js", "node"]
              ].map(([label, value]) => {
                const active = language === value;
                return (
                  <button key={value} type="button" onClick={() => setLanguage(value as "python" | "curl" | "node")} className={`border-b-2 px-0 pb-3 text-[13px] font-medium ${active ? "border-[#0A0A0A] text-[#0A0A0A]" : "border-transparent text-[#737373]"}`}>
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="relative mt-4">
            <button type="button" onClick={copyCode} className="absolute right-3 top-3 rounded-[4px] border border-[#E5E5E5] bg-white px-2.5 py-1 text-[11px] font-medium text-[#0A0A0A]">
              {copyLabel}
            </button>
            <pre className="overflow-x-auto rounded-[8px] border border-[#E5E5E5] bg-[#FAFAFA] p-4 text-[13px] leading-6 text-[#0A0A0A]">
              <code>{codeBlock}</code>
            </pre>
          </div>

          <p className="mt-3 text-[12px] text-[#A3A3A3]">The key prefix shown is for reference. Use the full key from API Keys page.</p>
        </div>
      </div>
    </section>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[12px] font-medium text-[#737373]">{label}</p>
      <p className="mt-1 text-[13px] leading-6 text-[#0A0A0A]">{value}</p>
    </div>
  );
}
