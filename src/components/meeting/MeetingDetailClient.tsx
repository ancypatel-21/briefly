"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, Play, Trash2 } from "lucide-react";
import type { MeetingDetail } from "@/types/meeting";
import { StatusBadge } from "@/components/StatusBadge";
import { cn, formatDuration } from "@/lib/utils";
import { UploadRecordingCard } from "@/components/meeting/UploadRecordingCard";
import { SummaryPanel } from "@/components/meeting/SummaryPanel";
import { TranscriptPanel } from "@/components/meeting/TranscriptPanel";
import { ActionItemsPanel } from "@/components/meeting/ActionItemsPanel";
import { ParticipantsPanel } from "@/components/meeting/ParticipantsPanel";
import { IntegrationsPanel } from "@/components/meeting/IntegrationsPanel";

const TABS = ["Overview", "Transcript & Timeline", "Action Items", "Participants", "Integrations"] as const;

export function MeetingDetailClient({
  initialMeeting,
  currentUserId,
}: {
  initialMeeting: MeetingDetail;
  currentUserId: string;
}) {
  const router = useRouter();
  const [meeting, setMeeting] = useState(initialMeeting);
  const [tab, setTab] = useState<(typeof TABS)[number]>("Overview");
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    const res = await fetch(`/api/meetings/${meeting.id}`);
    if (res.ok) {
      const data = await res.json();
      setMeeting(data.meeting);
    }
  }, [meeting.id]);

  async function startLive() {
    setBusy(true);
    try {
      const res = await fetch(`/api/meetings/${meeting.id}/start`, { method: "POST" });
      if (res.ok) router.push(`/meetings/${meeting.id}/live`);
    } finally {
      setBusy(false);
    }
  }

  async function deleteMeeting() {
    if (!confirm("Delete this meeting and all of its data? This can't be undone.")) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/meetings/${meeting.id}`, { method: "DELETE" });
      if (res.ok) router.push("/meetings");
    } finally {
      setBusy(false);
    }
  }

  function copyJoinCode() {
    navigator.clipboard.writeText(meeting.joinCode);
  }

  const needsRecording = meeting.status === "SCHEDULED" || meeting.status === "LIVE";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-semibold">{meeting.title}</h1>
            <StatusBadge status={meeting.status} />
          </div>
          {meeting.description && <p className="mt-1 text-sm text-[var(--muted)]">{meeting.description}</p>}
          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-[var(--muted)]">
            {meeting.scheduledStart && (
              <span>{new Date(meeting.scheduledStart).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}</span>
            )}
            {meeting.recordingDurationSec != null && <span>{formatDuration(meeting.recordingDurationSec)}</span>}
            <button onClick={copyJoinCode} className="flex items-center gap-1 hover:text-[var(--foreground)]">
              <Copy size={12} /> Join code: {meeting.joinCode}
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {meeting.status === "SCHEDULED" && (
            <button
              onClick={startLive}
              disabled={busy}
              className="flex items-center gap-1.5 rounded-lg bg-brand px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-60"
            >
              <Play size={14} /> Go live
            </button>
          )}
          <button
            onClick={deleteMeeting}
            disabled={busy}
            className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm text-[var(--muted)] hover:bg-black/5 disabled:opacity-60 dark:hover:bg-white/5"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {needsRecording && (
        <UploadRecordingCard meetingId={meeting.id} onUploaded={refresh} isLive={meeting.status === "LIVE"} />
      )}

      {meeting.status === "PROCESSING" && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm text-amber-700 dark:text-amber-400">
          Processing recording — generating transcript, speaker labels, and summary…
        </div>
      )}

      <div className="flex gap-1 overflow-x-auto border-b border-[var(--border)]">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium",
              tab === t ? "border-brand text-brand" : "border-transparent text-[var(--muted)] hover:text-[var(--foreground)]",
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Overview" && <SummaryPanel meeting={meeting} onChange={refresh} />}
      {tab === "Transcript & Timeline" && <TranscriptPanel meeting={meeting} onChange={refresh} />}
      {tab === "Action Items" && <ActionItemsPanel meeting={meeting} onChange={refresh} />}
      {tab === "Participants" && <ParticipantsPanel meeting={meeting} currentUserId={currentUserId} onChange={refresh} />}
      {tab === "Integrations" && <IntegrationsPanel meeting={meeting} />}
    </div>
  );
}
