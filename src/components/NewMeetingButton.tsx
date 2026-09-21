"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Modal } from "@/components/Modal";

export function NewMeetingButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [scheduledStart, setScheduledStart] = useState("");
  const [loading, setLoading] = useState<"instant" | "scheduled" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function createMeeting(mode: "instant" | "scheduled") {
    setError(null);
    if (!title.trim()) {
      setError("Give the meeting a title first");
      return;
    }
    if (mode === "scheduled" && !scheduledStart) {
      setError("Pick a date and time");
      return;
    }
    setLoading(mode);
    try {
      const res = await fetch("/api/meetings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description: description || undefined,
          mode,
          scheduledStart: mode === "scheduled" ? new Date(scheduledStart).toISOString() : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong");
        return;
      }
      setOpen(false);
      router.push(mode === "instant" ? `/meetings/${data.meeting.id}/live` : `/meetings/${data.meeting.id}`);
      router.refresh();
    } finally {
      setLoading(null);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand px-3 py-2 text-sm font-medium text-white transition hover:bg-brand-dark"
      >
        <Plus size={16} /> New meeting
      </button>
      {open && (
        <Modal title="New meeting" onClose={() => setOpen(false)}>
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-sm font-medium">Title</label>
              <input
                autoFocus
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Weekly sync"
                className="w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm outline-none focus:border-brand"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">
                Description <span className="text-[var(--muted)] font-normal">(optional)</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm outline-none focus:border-brand"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">
                Schedule for later <span className="text-[var(--muted)] font-normal">(optional)</span>
              </label>
              <input
                type="datetime-local"
                value={scheduledStart}
                onChange={(e) => setScheduledStart(e.target.value)}
                className="w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm outline-none focus:border-brand"
              />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => createMeeting("scheduled")}
                disabled={loading !== null}
                className="flex-1 rounded-lg border border-[var(--border)] px-3 py-2 text-sm font-medium hover:bg-black/5 disabled:opacity-60 dark:hover:bg-white/5"
              >
                {loading === "scheduled" ? "Scheduling…" : "Schedule"}
              </button>
              <button
                onClick={() => createMeeting("instant")}
                disabled={loading !== null}
                className="flex-1 rounded-lg bg-brand px-3 py-2 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-60"
              >
                {loading === "instant" ? "Starting…" : "Start now"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
