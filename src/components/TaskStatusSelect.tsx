"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

export function TaskStatusSelect({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    await fetch(`/api/action-items/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: e.target.value }),
    });
    startTransition(() => router.refresh());
  }

  return (
    <select
      defaultValue={status}
      onChange={handleChange}
      className="rounded-lg border border-[var(--border)] bg-transparent px-2 py-1 text-xs outline-none"
    >
      <option value="PENDING">Pending</option>
      <option value="IN_PROGRESS">In progress</option>
      <option value="DONE">Done</option>
    </select>
  );
}
