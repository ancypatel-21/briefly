"use client";

import { useMemo, useState } from "react";
import { Star, Pencil, Check } from "lucide-react";
import type { MeetingDetail } from "@/types/meeting";
import { formatTimestamp } from "@/lib/utils";

function SpeakerName({
  meetingId,
  speakerId,
  label,
  displayName,
  color,
  onChange,
}: {
  meetingId: string;
  speakerId: string;
  label: string;
  displayName: string | null;
  color: string;
  onChange: () => void | Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(displayName ?? label);

  async function save() {
    await fetch(`/api/meetings/${meetingId}/speakers/${speakerId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ displayName: value }),
    });
    setEditing(false);
    await onChange();
  }

  if (editing) {
    return (
      <span className="inline-flex items-center gap-1">
        <input
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && save()}
          className="w-28 rounded border border-[var(--border)] bg-transparent px-1.5 py-0.5 text-xs outline-none focus:border-brand"
        />
        <button onClick={save}>
          <Check size={12} className="text-emerald-500" />
        </button>
      </span>
    );
  }

  return (
    <button onClick={() => setEditing(true)} className="group inline-flex items-center gap-1.5 font-medium">
      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
      {displayName ?? label}
      <Pencil size={10} className="opacity-0 group-hover:opacity-60" />
    </button>
  );
}

export function TranscriptPanel({ meeting, onChange }: { meeting: MeetingDetail; onChange: () => void | Promise<void> }) {
  const [highlightsOnly, setHighlightsOnly] = useState(false);

  const segments = useMemo(
    () => (highlightsOnly ? meeting.segments.filter((s) => s.isHighlight) : meeting.segments),
    [meeting.segments, highlightsOnly],
  );

  async function toggleHighlight(segmentId: string, current: boolean) {
    await fetch(`/api/meetings/${meeting.id}/segments/${segmentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isHighlight: !current }),
    });
    await onChange();
  }

  if (meeting.segments.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-[var(--border)] p-10 text-center text-sm text-[var(--muted)]">
        No transcript yet — add a recording to generate one.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-[var(--muted)]">Click a speaker name to rename them. Star a line to highlight it on the timeline.</p>
        <label className="flex items-center gap-1.5 text-xs text-[var(--muted)]">
          <input type="checkbox" checked={highlightsOnly} onChange={(e) => setHighlightsOnly(e.target.checked)} />
          Highlights only
        </label>
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-2">
        <ol className="relative ml-3 space-y-4 border-l border-[var(--border)] pl-5 py-3">
          {segments.map((seg) => (
            <li key={seg.id} className="relative">
              <span
                className="absolute -left-[27px] top-1 h-2.5 w-2.5 rounded-full ring-4 ring-[var(--surface)]"
                style={{ backgroundColor: seg.speaker.color }}
              />
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
                    <SpeakerName
                      meetingId={meeting.id}
                      speakerId={seg.speaker.id}
                      label={seg.speaker.label}
                      displayName={seg.speaker.displayName}
                      color={seg.speaker.color}
                      onChange={onChange}
                    />
                    <span>·</span>
                    <span>{formatTimestamp(seg.startMs)}</span>
                  </div>
                  <p className="mt-0.5 text-sm leading-relaxed">{seg.text}</p>
                </div>
                <button
                  onClick={() => toggleHighlight(seg.id, seg.isHighlight)}
                  className="shrink-0 pt-0.5"
                  title={seg.isHighlight ? "Remove highlight" : "Mark as highlight"}
                >
                  <Star
                    size={16}
                    className={seg.isHighlight ? "fill-amber-400 text-amber-400" : "text-[var(--muted)]"}
                  />
                </button>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
