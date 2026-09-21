"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function JoinByCodeForm() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/meetings/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ joinCode: code.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Couldn't join that meeting");
        return;
      }
      router.push(`/meetings/${data.meetingId}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <input
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="Join with code (e.g. abc-def-ghi)"
        className="w-52 rounded-lg border border-[var(--border)] bg-transparent px-3 py-1.5 text-sm outline-none focus:border-brand"
      />
      <button
        type="submit"
        disabled={loading}
        className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm font-medium hover:bg-black/5 disabled:opacity-60 dark:hover:bg-white/5"
      >
        Join
      </button>
      {error && <span className="text-xs text-red-500">{error}</span>}
    </form>
  );
}
