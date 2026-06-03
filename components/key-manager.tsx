"use client";

import { useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import type { DashboardKey } from "@/lib/dashboard";

type Props = { initialKeys: DashboardKey[] };

async function readJson(response: Response) {
  const text = await response.text();
  if (!text) return null;
  try { return JSON.parse(text); } catch { return { error: text }; }
}

export default function KeyManager({ initialKeys }: Props) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [keys, setKeys] = useState(initialKeys);
  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [copyState, setCopyState] = useState<"idle" | "copied">("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { setKeys(initialKeys); }, [initialKeys]);

  async function refreshKeys() {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    const response = await fetch("/api/keys", { headers: token ? { Authorization: `Bearer ${token}` } : {} });
    const data = await readJson(response);
    if (response.ok && Array.isArray(data)) setKeys(data);
  }

  async function createKey() {
    setLoading(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const response = await fetch("/api/keys", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ name })
      });
      const data = await readJson(response);
      if (!response.ok) {
        setError(data?.error || "Failed to create key.");
        return;
      }
      setCreatedKey(data.key);
      setIsCreating(false);
      setName("");
      await refreshKeys();
    } catch {
      setError("Network error.");
    } finally {
      setLoading(false);
    }
  }

  async function revokeKey(id: string) {
    setLoading(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const response = await fetch(`/api/keys/${id}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      const data = await readJson(response);
      if (!response.ok) {
        setError(data?.error || "Failed to revoke key.");
        return;
      }
      await refreshKeys();
    } catch {
      setError("Network error.");
    } finally {
      setLoading(false);
    }
  }

  async function copyKey() {
    if (!createdKey) return;
    await navigator.clipboard.writeText(createdKey);
    setCopyState("copied");
    setTimeout(() => setCopyState("idle"), 1500);
  }

  return (
    <section className="space-y-6">
      <div className="rounded-[8px] border border-[#E5E5E5] bg-white p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[14px] text-[#737373]">Create and manage API keys for your app.</p>
          <button type="button" onClick={() => setIsCreating((v) => !v)} className="inline-flex h-9 items-center justify-center rounded-[6px] bg-[#0A0A0A] px-4 text-[13px] font-medium text-white">
            {isCreating ? "Cancel" : "+ Create key"}
          </button>
        </div>

        {isCreating ? (
          <div className="mt-4 rounded-[8px] border border-[#E5E5E5] bg-white p-4">
            <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Key name" className="h-10 w-full rounded-[6px] border border-[#E5E5E5] px-3.5 text-[14px] text-[#0A0A0A] outline-none placeholder:text-[#A3A3A3] focus:border-[#0A0A0A]" />
              <button type="button" onClick={createKey} disabled={loading} className="inline-flex h-10 items-center justify-center rounded-[6px] bg-[#0A0A0A] px-4 text-[13px] font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60">
                {loading ? "Creating..." : "Create"}
              </button>
            </div>
            {error ? <p className="mt-3 text-[13px] text-[#DC2626]">{error}</p> : null}
          </div>
        ) : null}

        {createdKey ? (
          <div className="mt-4 rounded-[8px] border border-[#D97706] bg-[#FFFBEB] p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[14px] font-medium text-[#0A0A0A]">⚠ Copy your key now. It will not be shown again.</p>
                <code className="mt-3 block break-all text-[14px] text-[#0A0A0A]">{createdKey}</code>
              </div>
              <button type="button" onClick={copyKey} className="inline-flex h-9 items-center justify-center rounded-[6px] border border-[#E5E5E5] bg-white px-3 text-[12px] font-medium text-[#0A0A0A] transition hover:bg-[#FAFAFA]">
                {copyState === "copied" ? "Copied ✓" : "Copy"}
              </button>
            </div>
          </div>
        ) : null}
      </div>

      <div className="rounded-[8px] border border-[#E5E5E5] bg-white">
        {keys.length === 0 ? (
          <div className="flex min-h-[260px] flex-col items-center justify-center gap-3 px-6 text-center text-[#737373]">
            <p className="text-[14px]">No API keys yet.</p>
            <button type="button" onClick={() => setIsCreating(true)} className="text-[13px] font-medium text-[#2563EB]">
              + Create your first key
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-[#F5F5F5] text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-[#737373]">
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Prefix</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Created</th>
                  <th className="px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {keys.map((key, index) => (
                  <tr key={key.id} className={`border-t border-[#F5F5F5] text-[13px] ${index % 2 === 1 ? "bg-[#FAFAFA]" : "bg-white"}`}>
                    <td className="px-4 py-3 text-[#0A0A0A]">{key.name}</td>
                    <td className="px-4 py-3 text-[#737373]">{key.key_prefix ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-1 text-[11px] font-medium ${key.is_active ? "bg-[#F0FDF4] text-[#16A34A]" : "bg-[#FEF2F2] text-[#DC2626]"}`}>
                        {key.is_active ? "Active" : "Revoked"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[#737373]">{new Date(key.created_at).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      {key.is_active ? (
                        <button type="button" disabled={loading} onClick={() => revokeKey(key.id)} className="text-[13px] font-medium text-[#DC2626] disabled:opacity-60">
                          Revoke
                        </button>
                      ) : (
                        <span className="text-[13px] text-[#737373]">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
