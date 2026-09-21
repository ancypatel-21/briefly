"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { Modal } from "@/components/Modal";
import { StatusBadge } from "@/components/StatusBadge";

type ProviderRow = {
  provider: string;
  label: string;
  description: string;
  id: string | null;
  status: "CONNECTED" | "DISCONNECTED";
  externalAccountLabel: string | null;
  connectedBy: { name: string } | null;
  connectedAt: string | null;
};

export default function IntegrationsPage() {
  const [providers, setProviders] = useState<ProviderRow[] | null>(null);
  const [connecting, setConnecting] = useState<ProviderRow | null>(null);
  const [accountLabel, setAccountLabel] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    const res = await fetch("/api/integrations");
    if (res.ok) setProviders((await res.json()).providers);
  }

  useEffect(() => {
    let ignore = false;
    (async () => {
      const res = await fetch("/api/integrations");
      if (!ignore && res.ok) setProviders((await res.json()).providers);
    })();
    return () => {
      ignore = true;
    };
  }, []);

  async function connect() {
    if (!connecting || !accountLabel.trim()) return;
    setBusy(true);
    try {
      await fetch("/api/integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: connecting.provider, externalAccountLabel: accountLabel }),
      });
      setConnecting(null);
      setAccountLabel("");
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function disconnect(id: string) {
    setBusy(true);
    try {
      await fetch(`/api/integrations/${id}/disconnect`, { method: "POST" });
      await load();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Integrations</h1>
        <p className="text-sm text-[var(--muted)]">Connect the tools your team already uses.</p>
      </div>

      <div className="flex items-start gap-2 rounded-lg bg-brand/10 px-3 py-2 text-xs text-brand">
        <Sparkles size={14} className="mt-0.5 shrink-0" />
        These connections are simulated for now — no real account is contacted. The framework (connection state,
        sync triggers, activity log) is fully wired up so real OAuth + API calls can be dropped in later.
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {providers?.map((p) => (
          <div key={p.provider} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-semibold">{p.label}</h2>
              <StatusBadge status={p.status} />
            </div>
            <p className="mb-4 text-sm text-[var(--muted)]">{p.description}</p>
            {p.status === "CONNECTED" ? (
              <div className="flex items-center justify-between">
                <span className="text-xs text-[var(--muted)]">Connected as {p.externalAccountLabel}</span>
                <button
                  onClick={() => p.id && disconnect(p.id)}
                  disabled={busy}
                  className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-medium hover:bg-black/5 disabled:opacity-60 dark:hover:bg-white/5"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setConnecting(p);
                  setAccountLabel("");
                }}
                className="rounded-lg bg-brand px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-dark"
              >
                Connect
              </button>
            )}
          </div>
        ))}
      </div>

      {connecting && (
        <Modal title={`Connect ${connecting.label}`} onClose={() => setConnecting(null)}>
          <div className="space-y-3">
            <p className="text-sm text-[var(--muted)]">
              This is a simulated connection — enter any workspace/site name to stand in for a real account.
            </p>
            <input
              autoFocus
              value={accountLabel}
              onChange={(e) => setAccountLabel(e.target.value)}
              placeholder={`e.g. "acme-team" or "#general"`}
              className="w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm outline-none focus:border-brand"
            />
            <button
              onClick={connect}
              disabled={busy || !accountLabel.trim()}
              className="w-full rounded-lg bg-brand px-3 py-2 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-60"
            >
              {busy ? "Connecting…" : "Connect"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
