"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Send, ListPlus } from "lucide-react";
import type { MeetingDetail } from "@/types/meeting";

type ProviderRow = {
  provider: string;
  label: string;
  status: "CONNECTED" | "DISCONNECTED";
};

type Activity = {
  id: string;
  action: string;
  targetLabel: string;
  detail: string | null;
  createdAt: string;
  integration: { provider: string };
};

export function IntegrationsPanel({ meeting }: { meeting: MeetingDetail }) {
  const [providers, setProviders] = useState<ProviderRow[] | null>(null);
  const [activity, setActivity] = useState<Activity[]>([]);
  const [busyProvider, setBusyProvider] = useState<string | null>(null);

  async function load() {
    const [providersRes, activityRes] = await Promise.all([
      fetch("/api/integrations"),
      fetch(`/api/meetings/${meeting.id}/integrations`),
    ]);
    if (providersRes.ok) setProviders((await providersRes.json()).providers);
    if (activityRes.ok) setActivity((await activityRes.json()).activity);
  }

  useEffect(() => {
    let ignore = false;
    (async () => {
      const [providersRes, activityRes] = await Promise.all([
        fetch("/api/integrations"),
        fetch(`/api/meetings/${meeting.id}/integrations`),
      ]);
      if (ignore) return;
      if (providersRes.ok) setProviders((await providersRes.json()).providers);
      if (activityRes.ok) setActivity((await activityRes.json()).activity);
    })();
    return () => {
      ignore = true;
    };
  }, [meeting.id]);

  async function trigger(provider: string, action: "sync_recap" | "create_followup_tasks") {
    setBusyProvider(provider + action);
    try {
      await fetch(`/api/meetings/${meeting.id}/integrations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, action }),
      });
      await load();
    } finally {
      setBusyProvider(null);
    }
  }

  const connected = providers?.filter((p) => p.status === "CONNECTED") ?? [];

  return (
    <div className="space-y-4">
      {providers && connected.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--border)] p-6 text-center text-sm text-[var(--muted)]">
          No integrations connected yet.{" "}
          <Link href="/integrations" className="text-brand hover:underline">
            Connect one
          </Link>{" "}
          to share recaps and push follow-up tasks.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {connected.map((p) => (
            <div key={p.provider} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
              <div className="mb-3 text-sm font-medium">{p.label}</div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => trigger(p.provider, "sync_recap")}
                  disabled={busyProvider === p.provider + "sync_recap" || !meeting.summary}
                  className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] px-2.5 py-1.5 text-xs font-medium hover:bg-black/5 disabled:opacity-50 dark:hover:bg-white/5"
                >
                  <Send size={12} /> Share recap
                </button>
                <button
                  onClick={() => trigger(p.provider, "create_followup_tasks")}
                  disabled={busyProvider === p.provider + "create_followup_tasks" || meeting.actionItems.length === 0}
                  className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] px-2.5 py-1.5 text-xs font-medium hover:bg-black/5 disabled:opacity-50 dark:hover:bg-white/5"
                >
                  <ListPlus size={12} /> Push follow-up tasks
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Activity</h3>
        {activity.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">Nothing sent out for this meeting yet.</p>
        ) : (
          <ul className="space-y-2">
            {activity.map((a) => (
              <li key={a.id} className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{a.targetLabel}</span>
                  <span className="text-xs text-[var(--muted)]">{new Date(a.createdAt).toLocaleString()}</span>
                </div>
                {a.detail && <p className="mt-0.5 text-xs text-[var(--muted)]">{a.detail}</p>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
