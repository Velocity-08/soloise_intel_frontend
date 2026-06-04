"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import type { DashboardSnapshot, DashboardKey, UsageLog } from "@/lib/dashboard";
import { Activity, ArrowRight, Copy, KeyRound, Lock, RefreshCw, ShieldCheck, Sparkles, Trash2, Zap } from "lucide-react";

type Props = { snapshot: DashboardSnapshot | null };

type StoredKey = { id: string; name: string; key_prefix: string; raw_key: string; };

const UTC_DATE_TIME = new Intl.DateTimeFormat("en-GB", {
  timeZone: "UTC",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false
});

const UTC_MONTH_DAY = new Intl.DateTimeFormat("en-GB", {
  timeZone: "UTC",
  month: "short",
  day: "numeric"
});

function fmt(value?: string | null) {
  if (!value) return "—";
  return UTC_DATE_TIME.format(new Date(value));
}

function getStoredKeys(): StoredKey[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.sessionStorage.getItem("soloise.savedKeys");
    if (!raw) return [];
    const parsed = JSON.parse(raw) as StoredKey[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function persistStoredKey(key: StoredKey) {
  if (typeof window === "undefined") return;
  const current = getStoredKeys();
  const next = [key, ...current.filter((item) => item.id !== key.id)].slice(0, 20);
  window.sessionStorage.setItem("soloise.savedKeys", JSON.stringify(next));
}

function collectPoints(values: number[], width = 320, height = 96) {
  if (values.length === 0) return "";
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const span = Math.max(max - min, 1);
  return values
    .map((value, index) => {
      const x = values.length === 1 ? width / 2 : (index / (values.length - 1)) * width;
      const y = height - ((value - min) / span) * (height - 12) - 6;
      return `${x},${y}`;
    })
    .join(" ");
}

function formatShortDate(value: string) {
  return UTC_MONTH_DAY.format(new Date(value));
}

function StatTile({
  label,
  value,
  hint,
  accent = false,
  muted = false
}: {
  label: string;
  value: string | number;
  hint?: string;
  accent?: boolean;
  muted?: boolean;
}) {
  return (
    <div className={`min-w-0 rounded-[24px] border ${accent ? "border-cyan-300/20 bg-cyan-300/10" : "border-white/10 bg-white/5"} p-5 backdrop-blur-xl`}>
      <p className="text-[12px] uppercase tracking-[0.18em] text-white/40">{label}</p>
      <p className={`mt-3 break-words text-3xl font-semibold tracking-tight ${muted ? "text-white/55" : "text-white"}`}>{value}</p>
      {hint ? <p className="mt-2 text-[13px] leading-6 text-white/45">{hint}</p> : null}
    </div>
  );
}

function SectionCard({
  title,
  subtitle,
  children,
  className = ""
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`min-w-0 overflow-hidden rounded-[28px] border border-white/10 bg-white/5 p-5 shadow-soft backdrop-blur-xl sm:p-6 ${className}`}>
      <div className="mb-5">
        <h2 className="text-[18px] font-semibold tracking-tight text-white">{title}</h2>
        {subtitle ? <p className="mt-1 text-[13px] leading-6 text-white/50">{subtitle}</p> : null}
      </div>
      {children}
    </section>
  );
}

function EmptyState({ title, text, action }: { title: string; text: string; action?: ReactNode; }) {
  return (
    <div className="min-w-0 overflow-hidden rounded-[24px] border border-dashed border-white/[0.12] bg-black/25 p-6 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white/70">
        <Lock className="h-5 w-5" />
      </div>
      <p className="mt-4 text-[16px] font-medium text-white">{title}</p>
      <p className="mt-2 text-[13px] leading-6 text-white/45">{text}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export default function DashboardView({ snapshot }: Props) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const authed = Boolean(snapshot);
  const [selectedKeyId, setSelectedKeyId] = useState<string>(snapshot?.keys[0]?.id ?? "");
  const [keys, setKeys] = useState<DashboardKey[]>(snapshot?.keys ?? []);
  const [recentCalls, setRecentCalls] = useState<UsageLog[]>(snapshot?.recentCalls ?? []);
  const [credits, setCredits] = useState<number>(snapshot?.credits ?? 0);
  const [creating, setCreating] = useState(false);
  const [loadingKeys, setLoadingKeys] = useState(false);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [copied, setCopied] = useState(false);
  const [rawKeyReveal, setRawKeyReveal] = useState<StoredKey | null>(null);
  const [storedKeys, setStoredKeys] = useState<StoredKey[]>([]);
  const [copiedSnippet, setCopiedSnippet] = useState(false);

  useEffect(() => {
    if (!authed) return;
    if (!selectedKeyId && keys[0]) setSelectedKeyId(keys[0].id);
  }, [authed, keys, selectedKeyId]);

  useEffect(() => {
    if (snapshot) {
      setKeys(snapshot.keys);
      setRecentCalls(snapshot.recentCalls);
      setCredits(snapshot.credits);
      setSelectedKeyId(snapshot.keys[0]?.id ?? "");
    }
  }, [snapshot]);

  useEffect(() => {
    setStoredKeys(getStoredKeys());
  }, []);

  const selectedKey = keys.find((key) => key.id === selectedKeyId) ?? keys[0] ?? null;
  const selectedKeyRecentCalls = useMemo(() => {
    if (selectedKey?.id) {
      const filtered = recentCalls.filter((call) => call.key_id === selectedKey.id);
      return filtered.length > 0 ? filtered : recentCalls;
    }
    return recentCalls;
  }, [recentCalls, selectedKey?.id]);

  const selectedStoredKey = useMemo(() => {
    if (!selectedKey?.id) return null;
    if (rawKeyReveal?.id === selectedKey.id) return rawKeyReveal;
    const stored = storedKeys.find((key) => key.id === selectedKey.id);
    return stored ?? null;
  }, [rawKeyReveal, selectedKey?.id, storedKeys]);

  const usageSeries = useMemo(() => {
    const points = selectedKeyRecentCalls
      .slice()
      .reverse()
      .map((call, index) => {
        const successBonus = call.success ? 1 : 0;
        return (call.latency_ms ?? 0) / 10 + successBonus * 8 + index;
      });
    return points.length > 0 ? points : [0, 0, 0, 0, 0];
  }, [selectedKeyRecentCalls]);

  const selectedSuccessRate = useMemo(() => {
    if (selectedKeyRecentCalls.length === 0) return 0;
    const ok = selectedKeyRecentCalls.filter((call) => call.success).length;
    return Math.round((ok / selectedKeyRecentCalls.length) * 100);
  }, [selectedKeyRecentCalls]);

  const averageLatency = useMemo(() => {
    if (selectedKeyRecentCalls.length === 0) return null;
    const values = selectedKeyRecentCalls.map((call) => call.latency_ms).filter((v): v is number => typeof v === "number");
    if (values.length === 0) return null;
    return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
  }, [selectedKeyRecentCalls]);

  async function getSessionToken() {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ?? null;
  }

  async function refreshKeys() {
    const token = await getSessionToken();
    setLoadingKeys(true);
    try {
      const response = await fetch("/api/keys", { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      const data = await response.json().catch(() => null);
      if (response.ok && Array.isArray(data)) {
        setKeys(data);
        if (!selectedKeyId && data[0]) setSelectedKeyId(data[0].id);
      }
    } finally {
      setLoadingKeys(false);
    }
  }

  async function createKey() {
    if (!name.trim()) return;
    setCreating(true);
    try {
      const token = await getSessionToken();
      const response = await fetch("/api/keys", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ name })
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) return;
      if (data?.api_key) {
        setKeys((current) => [data.api_key, ...current]);
        setSelectedKeyId(data.api_key.id);
      }
      if (data?.key && data?.api_key) {
        const stored = {
          id: data.api_key.id,
          name: data.api_key.name,
          key_prefix: data.api_key.key_prefix,
          raw_key: data.key
        };
        persistStoredKey(stored);
        setRawKeyReveal(stored);
        setCopied(false);
      }
      setName("");
      await refreshKeys();
    } finally {
      setCreating(false);
    }
  }

  async function revokeKey(id: string) {
    setRevoking(id);
    try {
      const token = await getSessionToken();
      const response = await fetch(`/api/keys/${id}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      const data = await response.json().catch(() => null);
      if (response.ok) {
        setKeys((current) => current.map((key) => key.id === id ? { ...key, is_active: false } : key));
      } else if (data?.error) {
        console.error(data.error);
      }
    } finally {
      setRevoking(null);
    }
  }

  async function copyRawKey() {
    const raw = selectedStoredKey?.raw_key;
    if (!raw) return;
    await navigator.clipboard.writeText(raw);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  }

  async function copySnippet() {
    const keyValue = selectedStoredKey?.raw_key || selectedKey?.key_prefix || "sk-sol-••••••••••••";
    const snippet = `curl -X POST /api/recommend \
  -H "Authorization: Bearer ${keyValue}" \
  -H "Content-Type: application/json" \
  -d '{"query": "help users convert faster", "top_n": 3}'`;
    await navigator.clipboard.writeText(snippet);
    setCopiedSnippet(true);
    window.setTimeout(() => setCopiedSnippet(false), 1400);
  }

  const totalShown = selectedKeyRecentCalls.length;
  const lowCredits = credits < 50;

  if (!authed) {
    return (
      <main className="mx-auto w-full max-w-[1400px] overflow-x-clip px-4 pb-10 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-[32px] border border-white/10 bg-white/5 p-5 shadow-soft backdrop-blur-xl sm:p-7">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1 text-[12px] text-amber-100 w-fit">
                <Lock className="h-3.5 w-3.5" />
                Locked until sign-in
              </div>
              <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                A single premium dashboard for keys, credits, and analytics.
              </h1>
              <p className="max-w-3xl text-[15px] leading-7 text-white/55">
                Open the dashboard, but API key creation stays disabled until you authenticate. After first login, your starter credits are attached automatically and the same page unlocks your key management flow.
              </p>
            </div>

            <div className="grid gap-4 xl:grid-cols-4">
              <StatTile label="Credits" value="—" hint="Unlock after sign-in" muted />
              <StatTile label="API keys" value="—" hint="Create one after auth" muted />
              <StatTile label="Calls" value="—" hint="Analytics will appear here" muted />
              <StatTile label="Latency" value="—" hint="Selected key metrics" muted />
            </div>

            <div className="grid min-w-0 gap-5 lg:grid-cols-[1.05fr_0.95fr]">
              <SectionCard title="Create API key" subtitle="Disabled until authenticated">
                <EmptyState
                  title="Sign in to create keys"
                  text="Your dashboard is visible, but this control stays locked until you log in."
                  action={<Link href="/auth" className="inline-flex h-11 items-center justify-center rounded-2xl bg-white px-4 text-[14px] font-semibold text-black">Go to sign in</Link>}
                />
              </SectionCard>

              <SectionCard title="Analytics" subtitle="Selected-key analytics appear here once you are in">
                <div className="space-y-4">
                  <div className="rounded-[24px] border border-white/10 bg-black/30 p-5">
                    <div className="flex items-center justify-between">
                      <p className="text-[13px] text-white/50">Usage preview</p>
                      <span className="rounded-full border border-white/10 px-2 py-1 text-[11px] text-white/55">Locked</span>
                    </div>
                    <div className="mt-4 h-[160px] rounded-[20px] border border-dashed border-white/[0.12] bg-black/25" />
                  </div>
                  <div className="rounded-[24px] border border-white/10 bg-black/30 p-5">
                    <p className="text-[13px] text-white/50">Recent calls</p>
                    <div className="mt-4 rounded-[18px] border border-dashed border-white/[0.12] bg-black/25 p-6 text-[13px] text-white/45">
                      No usage data available until you log in and create your first key.
                    </div>
                  </div>
                </div>
              </SectionCard>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-[1400px] overflow-x-clip px-4 pb-10 sm:px-6 lg:px-8">
      <section className="overflow-hidden rounded-[32px] border border-white/10 bg-white/5 p-5 shadow-soft backdrop-blur-xl sm:p-7">
        <div className="flex flex-col gap-5">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-[12px] text-cyan-100 w-fit">
                <Sparkles className="h-3.5 w-3.5" />
                Authenticated dashboard
              </div>
              <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                Command center for your API.
              </h1>
              <p className="mt-3 max-w-3xl text-[15px] leading-7 text-white/55">
                Create a key, copy it once, and keep the analytics on this page. No extra sections, no navigation sprawl, no overflow.
              </p>
            </div>

            <div className="flex flex-wrap gap-3 min-w-0">
              <StatTile label="Credits" value={credits} hint={lowCredits ? "Low balance" : "Ready to run"} accent={lowCredits} />
              <StatTile label="API keys" value={keys.filter((key) => key.is_active).length} hint="Active keys" />
            </div>
          </div>

          <div className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatTile label="Total calls" value={snapshot?.totalCalls ?? 0} hint="All-time usage" />
            <StatTile label="Selected key calls" value={totalShown} hint="Recent calls visible" />
            <StatTile label="Success rate" value={`${selectedSuccessRate}%`} hint="On recent sample" accent />
            <StatTile label="Avg latency" value={averageLatency == null ? "—" : `${averageLatency} ms`} hint="Recent sample" />
          </div>

          <div className="grid min-w-0 gap-5 lg:grid-cols-[1.05fr_0.95fr]">
            <SectionCard title="Create API key" subtitle="Keys are created from this page only">
              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Key name"
                    className="h-12 w-full rounded-2xl border border-white/10 bg-black/40 px-4 text-[14px] text-white outline-none placeholder:text-white/30 focus:border-cyan-300/40"
                  />
                  <button
                    type="button"
                    onClick={createKey}
                    disabled={creating || !name.trim()}
                    className="inline-flex h-12 min-w-0 items-center justify-center gap-2 rounded-2xl bg-white px-4 text-[14px] font-semibold text-black transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {creating ? <RefreshCw className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
                    Create key
                  </button>
                </div>

                {rawKeyReveal ? (
                  <div className="rounded-[26px] border border-amber-300/20 bg-amber-300/10 p-4">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <p className="text-[13px] font-medium text-amber-100">Copy now. This full key is shown only once.</p>
                        <code className="mt-3 block break-all rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-[13px] leading-6 text-white">
                          {rawKeyReveal.raw_key}
                        </code>
                      </div>
                      <button
                        type="button"
                        onClick={copyRawKey}
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 text-[13px] font-medium text-white transition hover:bg-white/10"
                      >
                        <Copy className="h-4 w-4" />
                        {copied ? "Copied" : "Copy key"}
                      </button>
                    </div>
                  </div>
                ) : null}

                {selectedStoredKey ? (
                  <div className="rounded-[26px] border border-cyan-300/[0.15] bg-cyan-300/10 p-4">
                    <p className="text-[13px] font-medium text-cyan-100">Selected key preview</p>
                    <p className="mt-2 text-[14px] text-white/75">
                      {selectedStoredKey.name} · {selectedStoredKey.key_prefix}
                    </p>
                  </div>
                ) : null}
              </div>
            </SectionCard>

            <SectionCard title="Selected key analytics" subtitle="Switch the key and the analytics update on this page">
              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                  <div className="rounded-[22px] border border-white/10 bg-black/35 p-4">
                    <label className="block text-[12px] uppercase tracking-[0.18em] text-white/35">Active key</label>
                    <select
                      value={selectedKeyId}
                      onChange={(e) => setSelectedKeyId(e.target.value)}
                      className="mt-2 h-11 w-full rounded-2xl border border-white/10 bg-black/40 px-4 text-[14px] text-white outline-none"
                    >
                      {keys.length === 0 ? <option value="">No keys yet</option> : null}
                      {keys.map((key) => (
                        <option key={key.id} value={key.id} className="bg-black">
                          {key.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="rounded-[22px] border border-white/10 bg-black/35 p-4">
                    <p className="text-[12px] uppercase tracking-[0.18em] text-white/35">Status</p>
                    <div className="mt-2 flex items-center gap-2 text-[14px] text-white">
                      <ShieldCheck className="h-4 w-4 text-emerald-300" />
                      {selectedKey?.is_active ? "Active" : "Revoked"}
                    </div>
                  </div>
                </div>

                <div className="min-w-0 rounded-[24px] border border-white/10 bg-black/35 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[13px] text-white/45">Recent activity</p>
                      <p className="mt-1 text-[18px] font-semibold text-white">{selectedKey?.name ?? "No key selected"}</p>
                    </div>
                    <button
                      type="button"
                      onClick={copySnippet}
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 text-[13px] font-medium text-white transition hover:bg-white/10"
                    >
                      <Copy className="h-4 w-4" />
                      {copiedSnippet ? "Copied" : "Copy snippet"}
                    </button>
                  </div>

                  <div className="mt-5 overflow-hidden rounded-[22px] border border-white/10 bg-black/45 p-4">
                    <svg viewBox="0 0 320 96" className="h-[96px] w-full">
                      <defs>
                        <linearGradient id="line-gradient" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="rgba(34,211,238,0.95)" />
                          <stop offset="100%" stopColor="rgba(16,185,129,0.95)" />
                        </linearGradient>
                      </defs>
                      <polyline
                        points={collectPoints(usageSeries, 320, 96)}
                        fill="none"
                        stroke="url(#line-gradient)"
                        strokeWidth="2.5"
                        strokeLinejoin="round"
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <MiniMetric label="Shown calls" value={totalShown} />
                    <MiniMetric label="Success" value={`${selectedSuccessRate}%`} />
                    <MiniMetric label="Latency" value={averageLatency == null ? "—" : `${averageLatency} ms`} />
                    <MiniMetric label="Last call" value={fmt(selectedKeyRecentCalls[0]?.created_at)} />
                  </div>
                </div>
              </div>
            </SectionCard>
          </div>

          <div className="grid gap-5 xl:grid-cols-[1fr_0.95fr]">
            <SectionCard title="API keys" subtitle="Manage keys without leaving this page">
              <div className="space-y-3">
                {loadingKeys ? (
                  <div className="rounded-[22px] border border-white/10 bg-black/25 p-5 text-[13px] text-white/45">Refreshing keys…</div>
                ) : null}

                {keys.length === 0 ? (
                  <EmptyState
                    title="No API keys yet"
                    text="Create your first key from the panel above to unlock usage analytics and the one-time copy flow."
                  />
                ) : (
                  <div className="space-y-3">
                    {keys.map((key) => {
                      const active = key.is_active;
                      const selected = key.id === selectedKeyId;
                      return (
                        <div
                          key={key.id}
                          className={`rounded-[24px] border p-4 transition ${selected ? "border-cyan-300/20 bg-cyan-300/10" : "border-white/10 bg-black/25"}`}
                        >
                          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="truncate text-[15px] font-medium text-white">{key.name}</p>
                                <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${active ? "bg-emerald-400/10 text-emerald-200" : "bg-red-400/10 text-red-200"}`}>
                                  {active ? "Active" : "Revoked"}
                                </span>
                              </div>
                              <p className="mt-1 text-[13px] text-white/45">Prefix: {key.key_prefix ?? "—"} · Created {fmt(key.created_at)}</p>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setSelectedKeyId(key.id)}
                                className="inline-flex h-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 text-[13px] font-medium text-white transition hover:bg-white/10"
                              >
                                View analytics
                              </button>
                              <button
                                type="button"
                                onClick={() => revokeKey(key.id)}
                                disabled={!active || revoking === key.id}
                                className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl border border-red-400/[0.15] bg-red-500/10 px-4 text-[13px] font-medium text-red-100 transition hover:bg-red-500/[0.15] disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {revoking === key.id ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                Revoke
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </SectionCard>

            <SectionCard title="Recent API calls" subtitle="This sample is drawn from the latest usage logs">
              {selectedKeyRecentCalls.length > 0 ? (
                <div className="overflow-hidden rounded-[24px] border border-white/10 bg-black/25">
                  <div className="max-h-[440px] overflow-auto">
                    <table className="min-w-[720px] w-full border-collapse">
                      <thead className="sticky top-0 z-10 bg-black/90 backdrop-blur">
                        <tr className="text-left text-[11px] uppercase tracking-[0.18em] text-white/35">
                          <th className="px-4 py-3 font-medium">Time</th>
                          <th className="px-4 py-3 font-medium">Key</th>
                          <th className="px-4 py-3 font-medium">Query</th>
                          <th className="px-4 py-3 font-medium">Top_n</th>
                          <th className="px-4 py-3 font-medium">Latency</th>
                          <th className="px-4 py-3 font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedKeyRecentCalls.map((call, index) => (
                          <tr key={call.id} className={index % 2 === 0 ? "bg-white/[0.02]" : "bg-transparent"}>
                            <td className="px-4 py-3 text-[13px] text-white/55">{fmt(call.created_at)}</td>
                            <td className="px-4 py-3 text-[13px] text-white/80">
                              {call.key_id ? keys.find((key) => key.id === call.key_id)?.name ?? call.key_id : "—"}
                            </td>
                            <td className="px-4 py-3 text-[13px] text-white/70">{call.query_length ?? "—"}</td>
                            <td className="px-4 py-3 text-[13px] text-white/70">{call.top_n ?? "—"}</td>
                            <td className="px-4 py-3 text-[13px] text-white/70">{call.latency_ms == null ? "—" : `${call.latency_ms} ms`}</td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-[11px] font-medium ${call.success ? "bg-emerald-400/10 text-emerald-200" : "bg-red-400/10 text-red-200"}`}>
                                <span className="h-1.5 w-1.5 rounded-full bg-current" />
                                {call.success ? "Success" : "Error"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <EmptyState
                  title="No usage yet"
                  text="Once your backend receives traffic, the latest calls will appear here with latency and status."
                />
              )}
            </SectionCard>
          </div>

          <section className="grid min-w-0 gap-5 lg:grid-cols-[0.9fr_1.1fr]">
            <SectionCard
              title="Quick start"
              subtitle="Copy a snippet and call the recommend endpoint"
            >
              <div className="space-y-4">
                <div className="min-w-0 rounded-[24px] border border-white/10 bg-black/35 p-4">
                  <p className="text-[12px] uppercase tracking-[0.18em] text-white/35">Authorization header</p>
                  <code className="mt-3 block break-all rounded-2xl border border-white/10 bg-black/45 px-4 py-3 text-[13px] text-white/80">
                    Authorization: Bearer {selectedStoredKey?.raw_key ?? selectedKey?.key_prefix ?? "sk-sol-••••••••••••"}
                  </code>
                </div>
                <div className="min-w-0 rounded-[24px] border border-white/10 bg-black/35 p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-[12px] uppercase tracking-[0.18em] text-white/35">Example</p>
                    <button
                      type="button"
                      onClick={copySnippet}
                      className="inline-flex h-9 items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-3 text-[12px] font-medium text-white transition hover:bg-white/10"
                    >
                      {copiedSnippet ? "Copied" : "Copy"}
                    </button>
                  </div>
                  <pre className="mt-3 overflow-x-auto rounded-2xl border border-white/10 bg-black/45 p-4 text-[13px] leading-6 text-white/80">
                    <code>{`curl -X POST /api/recommend \
  -H "Authorization: Bearer ${selectedStoredKey?.raw_key ?? selectedKey?.key_prefix ?? "sk-sol-••••••••••••"}" \
  -H "Content-Type: application/json" \
  -d '{"query": "reduce signup drop-off", "top_n": 3}'`}</code>
                  </pre>
                </div>
              </div>
            </SectionCard>

            <SectionCard title="Account status" subtitle="Everything stays on one page">
              <div className="grid gap-3 sm:grid-cols-2">
                <StatusPill icon={<Activity className="h-4 w-4" />} label="Credits" value={credits.toString()} />
                <StatusPill icon={<Zap className="h-4 w-4" />} label="Active keys" value={keys.filter((key) => key.is_active).length.toString()} />
                <StatusPill icon={<ShieldCheck className="h-4 w-4" />} label="Selected key" value={selectedKey?.name ?? "—"} wide />
                <StatusPill icon={<ArrowRight className="h-4 w-4" />} label="Manage" value="Inline actions only" wide />
              </div>
              {lowCredits ? (
                <div className="mt-4 rounded-[24px] border border-amber-300/20 bg-amber-300/10 p-4 text-[13px] text-amber-100">
                  Credits are running low. Top up before the balance reaches zero.
                </div>
              ) : null}
            </SectionCard>
          </section>
        </div>
      </section>
    </main>
  );
}

function MiniMetric({ label, value }: { label: string; value: string | number; }) {
  return (
    <div className="min-w-0 rounded-[18px] border border-white/10 bg-black/35 p-3">
      <p className="text-[11px] uppercase tracking-[0.18em] text-white/35">{label}</p>
      <p className="mt-2 break-words text-[13px] font-medium text-white">{value}</p>
    </div>
  );
}

function StatusPill({ icon, label, value, wide = false }: { icon: ReactNode; label: string; value: string; wide?: boolean; }) {
  return (
    <div className={`min-w-0 rounded-[24px] border border-white/10 bg-black/35 p-4 ${wide ? "sm:col-span-2" : ""}`}>
      <div className="flex items-center gap-2 text-white/70">
        {icon}
        <span className="text-[12px] uppercase tracking-[0.18em] text-white/35">{label}</span>
      </div>
      <p className="mt-3 break-words text-[14px] font-medium text-white">{value}</p>
    </div>
  );
}
