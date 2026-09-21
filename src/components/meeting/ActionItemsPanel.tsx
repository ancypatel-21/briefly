"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import type { MeetingDetail } from "@/types/meeting";
import { StatusBadge } from "@/components/StatusBadge";

export function ActionItemsPanel({
  meeting,
  onChange,
}: {
  meeting: MeetingDetail;
  onChange: () => void | Promise<void>;
}) {
  const [description, setDescription] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [adding, setAdding] = useState(false);

  async function addItem(e: React.FormEvent) {
    e.preventDefault();
    if (!description.trim()) return;
    setAdding(true);
    try {
      await fetch(`/api/meetings/${meeting.id}/action-items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description,
          ownerName: ownerName || undefined,
          dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
        }),
      });
      setDescription("");
      setOwnerName("");
      setDueDate("");
      await onChange();
    } finally {
      setAdding(false);
    }
  }

  async function updateStatus(id: string, status: string) {
    await fetch(`/api/action-items/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    await onChange();
  }

  async function deleteItem(id: string) {
    await fetch(`/api/action-items/${id}`, { method: "DELETE" });
    await onChange();
  }

  return (
    <div className="space-y-4">
      <form onSubmit={addItem} className="flex flex-wrap items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3">
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="New action item…"
          className="min-w-[200px] flex-1 rounded-lg border border-[var(--border)] bg-transparent px-3 py-1.5 text-sm outline-none focus:border-brand"
        />
        <input
          value={ownerName}
          onChange={(e) => setOwnerName(e.target.value)}
          placeholder="Owner"
          className="w-32 rounded-lg border border-[var(--border)] bg-transparent px-3 py-1.5 text-sm outline-none focus:border-brand"
        />
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="rounded-lg border border-[var(--border)] bg-transparent px-3 py-1.5 text-sm outline-none focus:border-brand"
        />
        <button
          type="submit"
          disabled={adding}
          className="flex items-center gap-1 rounded-lg bg-brand px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-60"
        >
          <Plus size={14} /> Add
        </button>
      </form>

      {meeting.actionItems.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--border)] p-10 text-center text-sm text-[var(--muted)]">
          No action items yet.
        </div>
      ) : (
        <div className="divide-y divide-[var(--border)] overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)]">
          {meeting.actionItems.map((item) => {
            const overdue = item.status !== "DONE" && item.dueDate && new Date(item.dueDate) < new Date();
            return (
              <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className={item.status === "DONE" ? "text-sm line-through text-[var(--muted)]" : "text-sm"}>
                    {item.description}
                  </p>
                  <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-[var(--muted)]">
                    {(item.owner?.name ?? item.ownerName) && <span>{item.owner?.name ?? item.ownerName}</span>}
                    {item.dueDate && (
                      <span className={overdue ? "font-medium text-red-500" : ""}>
                        Due {new Date(item.dueDate).toLocaleDateString()}
                      </span>
                    )}
                    {item.generatedBy === "STUB" && <span>· sample</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={item.status}
                    onChange={(e) => updateStatus(item.id, e.target.value)}
                    className="rounded-lg border border-[var(--border)] bg-transparent px-2 py-1 text-xs outline-none"
                  >
                    <option value="PENDING">Pending</option>
                    <option value="IN_PROGRESS">In progress</option>
                    <option value="DONE">Done</option>
                  </select>
                  <StatusBadge status={item.status} />
                  <button onClick={() => deleteItem(item.id)} className="text-[var(--muted)] hover:text-red-500">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
