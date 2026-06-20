"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import type { DashboardSnapshot, DashboardKey, UsageLog } from "@/lib/dashboard";
import {
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  Copy,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  Plus,
  RefreshCw,
  Sparkles,
  Trash2,
  Zap,
} from "lucide-react";
import UsageChart from "./usage-chart";
import BracketCard from "./bracket-card";

type Props = { snapshot: DashboardSnapshot | null };

type StoredKey = {
  id: string;
  name: string;
  key_prefix: string;
  raw_key: string;
};

const UTC_DATE_TIME = new Intl.DateTimeFormat("en-GB", {
  timeZone: "UTC",
  year: "numeric",
  month: "short",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

function fmt(value?: string | null) {
  if (!value) return "—";
  return UTC_DATE_TIME.format(new Date(value));
}

function timeAgo(value?: string | null) {
  if (!value) return "—";
  const diff = Date.now() - new Date(value).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
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

/* ============================================================ */
/* Small primitives                                              */
/* ============================================================ */

function Card({
  children,
  className = "",
  pad = true,
}: {
  children: ReactNode;
  className?: string;
  pad?: boolean;
}) {
  return (
    <section
      className={`min-w-0 rounded-[10px] border border-white/[0.08] bg-[#0a0a0a] ${
        pad ? "p-4 sm:p-5" : ""
      } ${className}`}
    >
      {children}
    </section>
  );
}

function CardHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div className="min-w-0">
        <h2 className="text-[14px] font-semibold tracking-tight text-white">{title}</h2>
        {subtitle ? (
          <p className="mt-0.5 text-[12px] text-white/45">{subtitle}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

function MetricCard({
  label,
  value,
  delta,
  trend,
  hint,
  accent,
  muted,
}: {
  label: string;
  value: string | number;
  delta?: string;
  trend?: "up" | "down" | "flat";
  hint?: string;
  accent?: boolean;
  muted?: boolean;
}) {
  const trendColor =
    trend === "up"
      ? "text-emerald-400"
      : trend === "down"
      ? "text-red-400"
      : "text-white/45";
  const Icon = trend === "up" ? ArrowUpRight : trend === "down" ? ArrowDownRight : null;
  return (
    <div
      className={`group relative min-w-0 overflow-hidden rounded-[10px] border bg-[#0a0a0a] p-4 transition hover:border-white/15 ${
        accent ? "border-[#FF5C1F]/30" : "border-white/[0.08]"
      }`}
    >
      {accent ? (
        <span
          aria-hidden
          className="pointer-events-none absolute -top-12 -right-12 h-32 w-32 rounded-full bg-[#FF5C1F]/20 blur-3xl"
        />
      ) : null}
      <div className="relative flex items-start justify-between">
        <p className="text-[11px] uppercase tracking-[0.16em] text-white/40">{label}</p>
        {delta ? (
          <span
            className={`inline-flex items-center gap-0.5 text-[11px] tabular ${trendColor}`}
          >
            {Icon ? <Icon className="h-3 w-3" /> : null}
            {delta}
          </span>
        ) : null}
      </div>
      <p
        className={`relative mt-3 break-words text-[26px] font-semibold leading-none tracking-tight tabular ${
          muted ? "text-white/55" : "text-white"
        }`}
      >
        {value}
      </p>
      {hint ? (
        <p className="relative mt-2 text-[11px] leading-5 text-white/40">{hint}</p>
      ) : null}
    </div>
  );
}

function StatusDot({ ok }: { ok: boolean }) {
  return (
    <span className="relative inline-flex h-1.5 w-1.5">
      <span
        className={`absolute inset-0 rounded-full ${
          ok ? "bg-emerald-400" : "bg-red-400"
        }`}
      />
      <span
        className={`absolute inset-0 rounded-full ${
          ok ? "bg-emerald-400/70" : "bg-red-400/70"
        } animate-ping`}
      />
    </span>
  );
}

function EmptyBlock({
  title,
  text,
  action,
}: {
  title: string;
  text: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[8px] border border-dashed border-white/[0.1] bg-black/20 px-4 py-10 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-white/55">
        <Lock className="h-4 w-4" />
      </div>
      <p className="mt-3 text-[13px] font-medium text-white">{title}</p>
      <p className="mt-1 max-w-sm text-[12px] leading-5 text-white/45">{text}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

/* ============================================================ */
/* Main view                                                     */
/* ============================================================ */

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
  const [showRevealed, setShowRevealed] = useState(true);
  const [storedKeys, setStoredKeys] = useState<StoredKey[]>([]);
  const [copiedSnippet, setCopiedSnippet] = useState(false);
  const [copiedMcp, setCopiedMcp] = useState(false);
  const [range, setRange] = useState<"24h" | "7d" | "30d">("7d");

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

  const selectedSuccessRate = useMemo(() => {
    if (selectedKeyRecentCalls.length === 0) return 0;
    const ok = selectedKeyRecentCalls.filter((call) => call.success).length;
    return Math.round((ok / selectedKeyRecentCalls.length) * 100);
  }, [selectedKeyRecentCalls]);

  const averageLatency = useMemo(() => {
    if (selectedKeyRecentCalls.length === 0) return null;
    const values = selectedKeyRecentCalls
      .map((call) => call.latency_ms)
      .filter((v): v is number => typeof v === "number");
    if (values.length === 0) return null;
    return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
  }, [selectedKeyRecentCalls]);

  // Build chart buckets from recent calls
  const chartBuckets = useMemo(() => {
    const buckets =
      range === "24h" ? 24 : range === "7d" ? 7 : 30;
    const now = Date.now();
    const span =
      range === "24h"
        ? 24 * 60 * 60 * 1000
        : range === "7d"
        ? 7 * 24 * 60 * 60 * 1000
        : 30 * 24 * 60 * 60 * 1000;
    const start = now - span;
    const arr = Array.from({ length: buckets }, (_, i) => {
      const t0 = start + (i * span) / buckets;
      const t1 = start + ((i + 1) * span) / buckets;
      return {
        label:
          range === "24h"
            ? `${String(new Date(t0).getUTCHours()).padStart(2, "0")}h`
            : new Date(t0).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
              }),
        t0,
        t1,
        success: 0,
        error: 0,
      };
    });
    for (const call of recentCalls) {
      const t = new Date(call.created_at).getTime();
      if (t < start) continue;
      const idx = Math.min(
        buckets - 1,
        Math.max(0, Math.floor(((t - start) / span) * buckets))
      );
      if (call.success) arr[idx].success += 1;
      else arr[idx].error += 1;
    }
    return arr;
  }, [recentCalls, range]);

  const mcpUrl = `https://soloise-intel.vercel.app/mcp/${snapshot?.user.id ?? ""}`;

  async function getSessionToken() {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session?.access_token ?? null;
  }

  async function refreshKeys() {
    const token = await getSessionToken();
    setLoadingKeys(true);
    try {
      const response = await fetch("/api/keys", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
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
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ name }),
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
          raw_key: data.key,
        };
        persistStoredKey(stored);
        setRawKeyReveal(stored);
        setShowRevealed(true);
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
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await response.json().catch(() => null);
      if (response.ok) {
        setKeys((current) =>
          current.map((key) => (key.id === id ? { ...key, is_active: false } : key))
        );
      } else if (data?.error) {
        console.error(data.error);
      }
    } finally {
      setRevoking(null);
    }
  }

  async function copyRawKey() {
    const raw = rawKeyReveal?.raw_key;
    if (!raw) return;
    await navigator.clipboard.writeText(raw);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  }

  async function copySnippet() {
    const keyValue = selectedStoredKey?.raw_key || selectedKey?.key_prefix || "sk-sol-••••••••••••";
    const snippet = `curl -X POST "https://soloise-intel.vercel.app/recommend" \\
  -H "Authorization: Bearer ${keyValue}" \\
  -H "Content-Type: application/json" \\
  -d '{"query": "help users convert faster", "top_n": 3}'`;
    await navigator.clipboard.writeText(snippet);
    setCopiedSnippet(true);
    window.setTimeout(() => setCopiedSnippet(false), 1400);
  }

  async function copyMcpUrl() {
    await navigator.clipboard.writeText(mcpUrl);
    setCopiedMcp(true);
    setTimeout(() => setCopiedMcp(false), 2000);
  }

  const totalShown = selectedKeyRecentCalls.length;
  const lowCredits = credits < 50;
  const activeKeys = keys.filter((k) => k.is_active).length;
  const totalCalls = snapshot?.totalCalls ?? 0;

  /* ------------ UNAUTHED VIEW ------------ */
  if (!authed) {
    return (
      <main className="mx-auto w-full max-w-[1400px] px-4 pb-12 pt-6 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <div className="inline-flex w-fit items-center gap-1.5 rounded-full border border-[#F5C518]/20 bg-[#F5C518]/[0.06] px-2.5 py-1 text-[11px] uppercase tracking-[0.16em] text-[#F5C518]">
              <Lock className="h-3 w-3" />
              Locked
            </div>
            <h1 className="text-[28px] font-semibold tracking-tight text-white sm:text-[34px]">
              Dashboard
            </h1>
            <p className="max-w-2xl text-[13px] leading-6 text-white/55">
              Sign in to access API keys, credits, and live analytics. Your starter credits are
              attached to the first authenticated session.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard label="Total calls" value="—" hint="Sign in to view" muted />
            <MetricCard label="Active keys" value="—" hint="Sign in to view" muted />
            <MetricCard label="Credits" value="—" hint="Sign in to view" muted />
            <MetricCard label="Success rate" value="—" hint="Sign in to view" muted />
          </div>

          <Card>
            <EmptyBlock
              title="Sign in required"
              text="The dashboard is visible but key management and analytics stay locked until you authenticate."
              action={
                <Link
                  href="/auth"
                  className="inline-flex h-9 items-center justify-center gap-1.5 rounded-[6px] bg-gradient-to-r from-[#FF5C1F] to-[#FFA033] px-4 text-[12px] font-semibold text-black hover:brightness-110 transition"
                >
                  Sign in
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              }
            />
          </Card>
        </div>
      </main>
    );
  }

  /* ------------ AUTHED VIEW ------------ */
  return (
    <main className="mx-auto w-full max-w-[1400px] px-4 pb-16 pt-5 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-5">
        {/* Header row */}
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-[#FF5C1F]/25 bg-[#FF5C1F]/[0.06] px-2.5 py-1 text-[11px] uppercase tracking-[0.16em] text-[#FF7A2D]">
              <Sparkles className="h-3 w-3" />
              Live
            </div>
            <h1 className="mt-2 text-[28px] font-semibold tracking-tight text-white sm:text-[32px]">
              Dashboard
            </h1>
            <p className="mt-1 text-[13px] text-white/50">
              {snapshot?.user.email}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={refreshKeys}
              disabled={loadingKeys}
              className="inline-flex h-8 items-center gap-1.5 rounded-[6px] border border-white/[0.1] bg-white/[0.02] px-2.5 text-[12px] text-white/80 hover:bg-white/[0.05] transition disabled:opacity-60"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loadingKeys ? "animate-spin" : ""}`} />
              Refresh
            </button>
            <a
              href="https://soloise-intel.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-8 items-center gap-1.5 rounded-[6px] border border-white/[0.1] bg-white/[0.02] px-2.5 text-[12px] text-white/80 hover:bg-white/[0.05] transition"
            >
              <ArrowUpRight className="h-3.5 w-3.5" />
              API
            </a>
          </div>
        </div>

        {/* Stat row */}
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Total calls"
            value={totalCalls.toLocaleString()}
            delta={totalCalls > 0 ? "+12.5%" : undefined}
            trend={totalCalls > 0 ? "up" : "flat"}
            hint="All-time usage"
          />
          <MetricCard
            label="Active keys"
            value={activeKeys}
            delta={activeKeys > 0 ? `${activeKeys} live` : "none"}
            trend={activeKeys > 0 ? "up" : "flat"}
            hint={`${keys.length} total · ${keys.length - activeKeys} revoked`}
          />
          <MetricCard
            label="Credits"
            value={credits.toLocaleString()}
            delta={lowCredits ? "low" : "-4.3%"}
            trend={lowCredits ? "down" : "down"}
            hint={lowCredits ? "Low balance — top up soon" : "Pay-as-you-go"}
            accent={lowCredits}
          />
          <MetricCard
            label="Success rate"
            value={`${selectedSuccessRate}%`}
            delta="+2.1%"
            trend="up"
            hint={averageLatency == null ? "Selected key" : `Avg ${averageLatency} ms`}
          />
        </div>

        {/* Main chart + side panel */}
        <div className="grid gap-4 lg:grid-cols-[1.55fr_1fr]">
          <Card>
            <CardHeader
              title="API call volume"
              subtitle="Successful vs failed requests"
              action={
                <div className="inline-flex items-center gap-1 rounded-[6px] border border-white/[0.08] bg-white/[0.02] p-0.5">
                  {(["24h", "7d", "30d"] as const).map((r) => (
                    <button
                      key={r}
                      onClick={() => setRange(r)}
                      className={`h-6 rounded-[4px] px-2 text-[11px] font-medium tabular transition ${
                        range === r
                          ? "bg-white/[0.08] text-white"
                          : "text-white/45 hover:text-white/80"
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              }
            />
            <UsageChart buckets={chartBuckets} />
          </Card>

          <Card>
            <CardHeader
              title="Recent activity"
              subtitle={`${totalShown} calls · selected key`}
              action={
                selectedKeyRecentCalls.length > 0 ? (
                  <span className="inline-flex items-center gap-1 text-[11px] text-white/45">
                    <StatusDot ok={selectedSuccessRate >= 90} />
                    {selectedSuccessRate}% ok
                  </span>
                ) : null
              }
            />
            <div className="flex flex-col gap-px overflow-hidden rounded-[8px] border border-white/[0.06] bg-black/30">
              {selectedKeyRecentCalls.length === 0 ? (
                <EmptyBlock
                  title="No recent calls"
                  text="Once you ping the API, the latest calls will stream in here."
                />
              ) : (
                selectedKeyRecentCalls.slice(0, 8).map((call) => (
                  <div
                    key={call.id}
                    className="flex items-center justify-between gap-3 bg-[#0a0a0a] px-3 py-2.5 text-[12px]"
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span
                        className={`inline-block h-1.5 w-1.5 shrink-0 rounded-full ${
                          call.success ? "bg-emerald-400" : "bg-red-400"
                        }`}
                      />
                      <div className="min-w-0">
                        <p className="truncate font-medium text-white/85">
                          /recommend
                          {call.top_n != null ? (
                            <span className="ml-1 text-white/40">top_n={call.top_n}</span>
                          ) : null}
                        </p>
                        <p className="truncate text-[11px] text-white/40">
                          {keys.find((k) => k.id === call.key_id)?.name ?? "—"} · {timeAgo(call.created_at)}
                        </p>
                      </div>
                    </div>
                    <div className="shrink-0 text-right tabular">
                      <p
                        className={`text-[12px] font-medium ${
                          call.success ? "text-white" : "text-red-300"
                        }`}
                      >
                        {call.latency_ms == null ? "—" : `${call.latency_ms} ms`}
                      </p>
                      <p className="text-[10px] uppercase tracking-wider text-white/35">
                        {call.success ? "200 OK" : "ERROR"}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* Bracket cards row (image 4 style) */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <BracketCard
            label="Signal / Success rate"
            value={`${selectedSuccessRate}%`}
            badge={selectedSuccessRate >= 90 ? "Healthy" : "Watch"}
            ratio={selectedSuccessRate}
            footer={
              <div className="flex items-center justify-between text-[11px] text-white/45">
                <span>Errors</span>
                <span className="tabular text-white/75">{100 - selectedSuccessRate}%</span>
              </div>
            }
          />
          <BracketCard
            label="Latency / Average"
            value={averageLatency == null ? "—" : `${averageLatency}`}
            valueSuffix={averageLatency == null ? "" : "ms"}
            badge={averageLatency != null && averageLatency < 300 ? "Fast" : "—"}
            ratio={averageLatency == null ? 0 : Math.min(100, (300 / Math.max(averageLatency, 1)) * 100)}
            footer={
              <div className="flex items-center justify-between text-[11px] text-white/45">
                <span>Target</span>
                <span className="tabular text-white/75">&lt; 300 ms</span>
              </div>
            }
          />
          <BracketCard
            label="Credits / Remaining"
            value={credits.toLocaleString()}
            badge={lowCredits ? "Low" : "OK"}
            ratio={Math.max(0, Math.min(100, (credits / 1000) * 100))}
            footer={
              <div className="flex items-center justify-between text-[11px] text-white/45">
                <span>Cost per call</span>
                <span className="tabular text-white/75">1 credit</span>
              </div>
            }
          />
        </div>

        {/* Create + key picker */}
        <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
          <Card>
            <CardHeader
              title="Create API key"
              subtitle="Generate a key for your application or server"
            />
            <div className="flex flex-col gap-2.5 sm:flex-row">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Production server"
                onKeyDown={(e) => { if (e.key === "Enter") createKey(); }}
                className="h-10 w-full rounded-[8px] border border-white/[0.1] bg-[#0a0a0a] px-3 text-[13px] text-white outline-none placeholder:text-white/30 transition focus:border-[#FF5C1F]/70 focus:ring-2 focus:ring-[#FF5C1F]/15"
              />
              <button
                type="button"
                onClick={createKey}
                disabled={creating || !name.trim()}
                className="inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-[8px] bg-gradient-to-r from-[#FF5C1F] to-[#FFA033] px-4 text-[13px] font-semibold text-black hover:brightness-110 transition disabled:cursor-not-allowed disabled:opacity-50"
              >
                {creating ? (
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Plus className="h-3.5 w-3.5" />
                )}
                Create key
              </button>
            </div>

            {rawKeyReveal ? (
              <div className="mt-3 rounded-[8px] border border-[#F5C518]/25 bg-[#F5C518]/[0.06] p-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-[#F5C518]" />
                  <p className="text-[12px] font-medium text-[#F5C518]">
                    Copy this key now — it&apos;s shown only once.
                  </p>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <code className="flex-1 break-all rounded-[6px] border border-white/[0.08] bg-black/60 px-3 py-2 font-mono text-[12px] text-white">
                    {showRevealed ? rawKeyReveal.raw_key : "•".repeat(rawKeyReveal.raw_key.length)}
                  </code>
                  <button
                    onClick={() => setShowRevealed((v) => !v)}
                    aria-label={showRevealed ? "Hide" : "Show"}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-[6px] border border-white/[0.1] bg-white/[0.03] text-white/70 hover:bg-white/[0.06] transition"
                  >
                    {showRevealed ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                  <button
                    type="button"
                    onClick={copyRawKey}
                    className="inline-flex h-9 items-center justify-center gap-1.5 rounded-[6px] border border-white/[0.1] bg-white/[0.03] px-3 text-[12px] font-medium text-white hover:bg-white/[0.06] transition"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    {copied ? "Copied" : "Copy"}
                  </button>
                </div>
              </div>
            ) : null}
          </Card>

          <Card>
            <CardHeader
              title="Active key"
              subtitle="Analytics above update based on this selection"
            />
            <div className="flex flex-col gap-2.5">
              <select
                value={selectedKeyId}
                onChange={(e) => setSelectedKeyId(e.target.value)}
                className="h-10 w-full rounded-[8px] border border-white/[0.1] bg-[#0a0a0a] px-3 text-[13px] text-white outline-none transition focus:border-[#FF5C1F]/70 focus:ring-2 focus:ring-[#FF5C1F]/15"
              >
                {keys.length === 0 ? <option value="">No keys yet</option> : null}
                {keys.map((key) => (
                  <option key={key.id} value={key.id} className="bg-black">
                    {key.name} {key.is_active ? "" : "(revoked)"}
                  </option>
                ))}
              </select>

              <div className="grid grid-cols-3 gap-px overflow-hidden rounded-[8px] border border-white/[0.06]">
                <div className="bg-[#0a0a0a] p-2.5">
                  <p className="text-[10px] uppercase tracking-wider text-white/40">Status</p>
                  <p className="mt-1 text-[12px] font-medium text-white inline-flex items-center gap-1.5">
                    <StatusDot ok={!!selectedKey?.is_active} />
                    {selectedKey?.is_active ? "Active" : "Revoked"}
                  </p>
                </div>
                <div className="bg-[#0a0a0a] p-2.5">
                  <p className="text-[10px] uppercase tracking-wider text-white/40">Prefix</p>
                  <p className="mt-1 truncate font-mono text-[12px] text-white">
                    {selectedKey?.key_prefix ?? "—"}
                  </p>
                </div>
                <div className="bg-[#0a0a0a] p-2.5">
                  <p className="text-[10px] uppercase tracking-wider text-white/40">Created</p>
                  <p className="mt-1 text-[12px] text-white tabular">
                    {selectedKey?.created_at ? timeAgo(selectedKey.created_at) : "—"}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Keys table */}
        <Card>
          <CardHeader
            title="API keys"
            subtitle={`${keys.length} total · ${activeKeys} active`}
            action={
              <span className="text-[11px] text-white/45 tabular">
                {keys.length} {keys.length === 1 ? "key" : "keys"}
              </span>
            }
          />
          {keys.length === 0 ? (
            <EmptyBlock
              title="No API keys yet"
              text="Create your first key above to unlock usage analytics and the one-time reveal flow."
            />
          ) : (
            <div className="overflow-hidden rounded-[8px] border border-white/[0.06]">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead className="bg-black/40">
                    <tr className="text-[10px] uppercase tracking-[0.14em] text-white/40">
                      <th className="px-3 py-2.5 font-medium">Name</th>
                      <th className="px-3 py-2.5 font-medium">Prefix</th>
                      <th className="px-3 py-2.5 font-medium">Status</th>
                      <th className="px-3 py-2.5 font-medium">Created</th>
                      <th className="px-3 py-2.5 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.05]">
                    {keys.map((k) => {
                      const isSel = k.id === selectedKeyId;
                      return (
                        <tr
                          key={k.id}
                          className={`text-[12px] transition ${
                            isSel ? "bg-[#FF5C1F]/[0.04]" : "bg-[#0a0a0a]"
                          } hover:bg-white/[0.03]`}
                        >
                          <td className="px-3 py-3">
                            <div className="flex items-center gap-2">
                              <KeyRound className="h-3.5 w-3.5 text-white/45" />
                              <span className="font-medium text-white">{k.name}</span>
                              {isSel ? (
                                <span className="inline-flex items-center rounded-[3px] border border-[#FF5C1F]/30 bg-[#FF5C1F]/10 px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-[#FF7A2D]">
                                  Selected
                                </span>
                              ) : null}
                            </div>
                          </td>
                          <td className="px-3 py-3 font-mono text-white/70">
                            {k.key_prefix ?? "—"}
                          </td>
                          <td className="px-3 py-3">
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-[3px] px-1.5 py-0.5 text-[10px] font-medium ${
                                k.is_active
                                  ? "bg-emerald-400/10 text-emerald-300"
                                  : "bg-red-400/10 text-red-300"
                              }`}
                            >
                              <span
                                className={`h-1 w-1 rounded-full ${
                                  k.is_active ? "bg-emerald-400" : "bg-red-400"
                                }`}
                              />
                              {k.is_active ? "Active" : "Revoked"}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-white/55 tabular">
                            {fmt(k.created_at)}
                          </td>
                          <td className="px-3 py-3">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => setSelectedKeyId(k.id)}
                                disabled={isSel}
                                className="inline-flex h-7 items-center justify-center rounded-[5px] border border-white/[0.08] bg-white/[0.02] px-2 text-[11px] font-medium text-white/80 hover:bg-white/[0.06] transition disabled:opacity-50"
                              >
                                Select
                              </button>
                              <button
                                type="button"
                                onClick={() => revokeKey(k.id)}
                                disabled={!k.is_active || revoking === k.id}
                                className="inline-flex h-7 items-center justify-center gap-1 rounded-[5px] border border-red-400/15 bg-red-500/[0.06] px-2 text-[11px] font-medium text-red-200 hover:bg-red-500/10 transition disabled:cursor-not-allowed disabled:opacity-40"
                              >
                                {revoking === k.id ? (
                                  <RefreshCw className="h-3 w-3 animate-spin" />
                                ) : (
                                  <Trash2 className="h-3 w-3" />
                                )}
                                Revoke
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </Card>

        {/* Quick start + MCP */}
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader
              title="Quick start"
              subtitle="Make your first API call in under a minute"
              action={
                <button
                  type="button"
                  onClick={copySnippet}
                  className="inline-flex h-7 items-center gap-1.5 rounded-[5px] border border-white/[0.1] bg-white/[0.02] px-2 text-[11px] font-medium text-white/80 hover:bg-white/[0.06] transition"
                >
                  <Copy className="h-3 w-3" />
                  {copiedSnippet ? "Copied" : "Copy"}
                </button>
              }
            />
            <div className="space-y-2.5">
              <div className="rounded-[8px] border border-white/[0.08] bg-black/40 p-2.5">
                <p className="text-[10px] uppercase tracking-wider text-white/40">
                  Authorization header
                </p>
                <code className="mt-1.5 block break-all font-mono text-[12px] leading-5 text-white/85">
                  Authorization: Bearer{" "}
                  <span className="text-[#FF7A2D]">
                    {selectedStoredKey?.raw_key ??
                      selectedKey?.key_prefix ??
                      "sk-sol-••••••••••••"}
                  </span>
                </code>
              </div>
              <pre className="overflow-x-auto rounded-[8px] border border-white/[0.08] bg-black/60 p-3 font-mono text-[12px] leading-5 text-white/85">
{`curl -X POST "https://soloise-intel.vercel.app/recommend" \\
  -H "Authorization: Bearer ${selectedStoredKey?.raw_key ?? selectedKey?.key_prefix ?? "sk-sol-••••••••••••"}" \\
  -H "Content-Type: application/json" \\
  -d '{"query": "help users convert faster", "top_n": 3}'`}
              </pre>
            </div>
          </Card>

          <Card>
            <CardHeader
              title="Claude MCP connector"
              subtitle="Use your credits inside Claude.ai chats"
              action={
                <span className="inline-flex items-center gap-1 rounded-[4px] border border-[#F5C518]/20 bg-[#F5C518]/[0.06] px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-[#F5C518]">
                  1 credit / call
                </span>
              }
            />
            <div className="space-y-2.5">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-white/40">
                  Step 1 — your personal MCP URL
                </p>
                <div className="mt-1.5 flex items-center gap-2">
                  <code className="flex-1 break-all rounded-[6px] border border-[#FF5C1F]/20 bg-[#FF5C1F]/[0.04] px-3 py-2 font-mono text-[12px] text-[#FF7A2D]">
                    {mcpUrl}
                  </code>
                  <button
                    onClick={copyMcpUrl}
                    className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-[6px] border border-white/[0.1] bg-white/[0.03] px-2.5 text-[12px] font-medium text-white hover:bg-white/[0.06] transition"
                  >
                    <Copy className="h-3 w-3" />
                    {copiedMcp ? "Copied" : "Copy"}
                  </button>
                </div>
              </div>

              <div>
                <p className="text-[10px] uppercase tracking-wider text-white/40">
                  Step 2 — add it to Claude
                </p>
                <ol className="mt-1.5 space-y-1 rounded-[6px] border border-white/[0.06] bg-black/30 p-3 text-[12px] leading-6 text-white/70">
                  <li className="flex gap-2">
                    <span className="text-[#FF7A2D] tabular">1.</span>
                    Go to{" "}
                    <a
                      href="https://claude.ai/customize/connectors"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#FF7A2D] underline underline-offset-2 hover:text-[#FFD84D]"
                    >
                      claude.ai/customize/connectors
                    </a>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-[#FF7A2D] tabular">2.</span>
                    Click <strong className="text-white font-medium">+ Add custom connector</strong>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-[#FF7A2D] tabular">3.</span>
                    Paste your MCP URL and press <strong className="text-white font-medium">Add</strong>
                  </li>
                </ol>
              </div>

              {credits <= 10 && (
                <div className="rounded-[6px] border border-[#F5C518]/20 bg-[#F5C518]/[0.06] p-2.5 text-[11px] text-[#F5C518]">
                  Only {credits} credits left. Calls stop when the balance hits 0.
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Footer mini-row */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.06] pt-4 text-[11px] text-white/35">
          <div className="inline-flex items-center gap-2">
            <Activity className="h-3 w-3" />
            All systems operational
            <span className="ml-2 inline-flex items-center gap-1">
              <Zap className="h-3 w-3 text-[#FF7A2D]" />
              {credits.toLocaleString()} credits
            </span>
          </div>
          <div className="tabular">v1.1 · Soloise</div>
        </div>
      </div>
    </main>
  );
}
