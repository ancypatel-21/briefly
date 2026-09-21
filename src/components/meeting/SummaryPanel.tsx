"use client";

import { useState } from "react";
import { Pencil, Sparkles } from "lucide-react";
import type { MeetingDetail } from "@/types/meeting";

function ListEditor({
  label,
  items,
  onChange,
}: {
  label: string;
  items: string[];
  onChange: (items: string[]) => void;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-[var(--muted)]">{label}</label>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex gap-2">
            <input
              value={item}
              onChange={(e) => {
                const next = [...items];
                next[i] = e.target.value;
                onChange(next);
              }}
              className="w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-1.5 text-sm outline-none focus:border-brand"
            />
            <button
              onClick={() => onChange(items.filter((_, idx) => idx !== i))}
              className="px-2 text-xs text-[var(--muted)] hover:text-red-500"
            >
              Remove
            </button>
          </div>
        ))}
        <button onClick={() => onChange([...items, ""])} className="text-xs text-brand hover:underline">
          + Add item
        </button>
      </div>
    </div>
  );
}

export function SummaryPanel({ meeting, onChange }: { meeting: MeetingDetail; onChange: () => void | Promise<void> }) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const summary = meeting.summary;

  const [overview, setOverview] = useState(summary?.overview ?? "");
  const [keyDecisions, setKeyDecisions] = useState<string[]>(summary?.keyDecisions ?? []);
  const [openQuestions, setOpenQuestions] = useState<string[]>(summary?.openQuestions ?? []);
  const [nextSteps, setNextSteps] = useState<string[]>(summary?.nextSteps ?? []);

  function startEditing() {
    setOverview(summary?.overview ?? "");
    setKeyDecisions(summary?.keyDecisions ?? []);
    setOpenQuestions(summary?.openQuestions ?? []);
    setNextSteps(summary?.nextSteps ?? []);
    setEditing(true);
  }

  async function save() {
    setSaving(true);
    try {
      await fetch(`/api/meetings/${meeting.id}/summary`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          overview,
          keyDecisions: keyDecisions.filter((s) => s.trim()),
          openQuestions: openQuestions.filter((s) => s.trim()),
          nextSteps: nextSteps.filter((s) => s.trim()),
        }),
      });
      setEditing(false);
      await onChange();
    } finally {
      setSaving(false);
    }
  }

  if (!summary) {
    return (
      <div className="rounded-xl border border-dashed border-[var(--border)] p-10 text-center text-sm text-[var(--muted)]">
        No summary yet — add a recording to generate one.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {summary.generatedBy === "STUB" && (
        <div className="flex items-center gap-2 rounded-lg bg-brand/10 px-3 py-2 text-xs text-brand">
          <Sparkles size={14} />
          Placeholder content from Briefly&apos;s stub pipeline — real AI-generated summaries are coming soon. Feel
          free to edit this by hand for now.
        </div>
      )}

      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold">Summary</h2>
          {!editing && (
            <button onClick={startEditing} className="flex items-center gap-1 text-xs text-brand hover:underline">
              <Pencil size={12} /> Edit
            </button>
          )}
        </div>

        {!editing ? (
          <div className="space-y-5">
            <div>
              <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Overview</h3>
              <p className="text-sm leading-relaxed">{summary.overview}</p>
            </div>
            <SummarySection title="Key decisions" items={summary.keyDecisions} />
            <SummarySection title="Open questions" items={summary.openQuestions} />
            <SummarySection title="Next steps" items={summary.nextSteps} />
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-[var(--muted)]">Overview</label>
              <textarea
                value={overview}
                onChange={(e) => setOverview(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm outline-none focus:border-brand"
              />
            </div>
            <ListEditor label="Key decisions" items={keyDecisions} onChange={setKeyDecisions} />
            <ListEditor label="Open questions" items={openQuestions} onChange={setOpenQuestions} />
            <ListEditor label="Next steps" items={nextSteps} onChange={setNextSteps} />
            <div className="flex gap-2 pt-2">
              <button
                onClick={save}
                disabled={saving}
                className="rounded-lg bg-brand px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-60"
              >
                {saving ? "Saving…" : "Save"}
              </button>
              <button
                onClick={() => setEditing(false)}
                className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm hover:bg-black/5 dark:hover:bg-white/5"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SummarySection({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">{title}</h3>
      {items.length === 0 ? (
        <p className="text-sm text-[var(--muted)]">None</p>
      ) : (
        <ul className="list-disc space-y-1 pl-5 text-sm leading-relaxed">
          {items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
