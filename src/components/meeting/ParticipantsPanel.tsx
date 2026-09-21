"use client";

import { useState } from "react";
import { UserPlus } from "lucide-react";
import type { MeetingDetail } from "@/types/meeting";

export function ParticipantsPanel({
  meeting,
  currentUserId,
  onChange,
}: {
  meeting: MeetingDetail;
  currentUserId: string;
  onChange: () => void | Promise<void>;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function addParticipant(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setAdding(true);
    setError(null);
    try {
      const res = await fetch(`/api/meetings/${meeting.id}/participants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email: email || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Couldn't add participant");
        return;
      }
      setName("");
      setEmail("");
      await onChange();
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={addParticipant} className="flex flex-wrap items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name"
          className="w-40 rounded-lg border border-[var(--border)] bg-transparent px-3 py-1.5 text-sm outline-none focus:border-brand"
        />
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email (optional)"
          className="w-52 rounded-lg border border-[var(--border)] bg-transparent px-3 py-1.5 text-sm outline-none focus:border-brand"
        />
        <button
          type="submit"
          disabled={adding}
          className="flex items-center gap-1 rounded-lg bg-brand px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-60"
        >
          <UserPlus size={14} /> Invite
        </button>
        {error && <span className="text-xs text-red-500">{error}</span>}
      </form>

      <div className="divide-y divide-[var(--border)] overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)]">
        {meeting.participants.map((p) => (
          <div key={p.id} className="flex items-center justify-between px-4 py-3">
            <div>
              <span className="text-sm font-medium">
                {p.name}
                {p.userId === currentUserId && <span className="ml-1 text-xs text-[var(--muted)]">(you)</span>}
              </span>
              {p.email && <span className="ml-2 text-xs text-[var(--muted)]">{p.email}</span>}
            </div>
            <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
              {p.role === "HOST" && <span className="rounded-full bg-brand/10 px-2 py-0.5 text-brand">Host</span>}
              {p.joinedAt ? "Joined" : "Invited"}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
