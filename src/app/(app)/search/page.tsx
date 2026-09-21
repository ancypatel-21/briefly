"use client";

import { useState } from "react";
import Link from "next/link";
import { Search as SearchIcon, Sparkles } from "lucide-react";

type Meeting = { id: string; title: string; summary: { overview: string } | null };
type Segment = {
  id: string;
  text: string;
  meeting: { id: string; title: string };
  speaker: { displayName: string | null; label: string };
};

export function highlight(text: string, query: string) {
  if (!query) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="rounded bg-amber-300/50 px-0.5">{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  );
}

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  async function runSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setMeetings(data.meetings ?? []);
      setSegments(data.segments ?? []);
      setSearched(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Search your knowledge base</h1>
        <p className="text-sm text-[var(--muted)]">Search meeting titles, summaries, and transcripts.</p>
      </div>

      <div className="flex items-start gap-2 rounded-lg bg-brand/10 px-3 py-2 text-xs text-brand">
        <Sparkles size={14} className="mt-0.5 shrink-0" />
        This is keyword search for now — ask natural-language questions like &quot;what did we decide about
        authentication?&quot; once the LLM-powered search is wired up.
      </div>

      <form onSubmit={runSearch} className="flex items-center gap-2">
        <div className="relative flex-1">
          <SearchIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search meetings and transcripts…"
            className="w-full rounded-lg border border-[var(--border)] bg-transparent py-2 pl-9 pr-3 text-sm outline-none focus:border-brand"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-60"
        >
          Search
        </button>
      </form>

      {searched && meetings.length === 0 && segments.length === 0 && (
        <p className="text-sm text-[var(--muted)]">No results for &quot;{query}&quot;.</p>
      )}

      {meetings.length > 0 && (
        <div>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Meetings</h2>
          <div className="divide-y divide-[var(--border)] overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)]">
            {meetings.map((m) => (
              <Link key={m.id} href={`/meetings/${m.id}`} className="block px-4 py-3 hover:bg-black/[0.02] dark:hover:bg-white/[0.03]">
                <div className="text-sm font-medium">{highlight(m.title, query)}</div>
                {m.summary?.overview && (
                  <p className="mt-0.5 line-clamp-2 text-xs text-[var(--muted)]">{m.summary.overview}</p>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}

      {segments.length > 0 && (
        <div>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Transcript mentions</h2>
          <div className="divide-y divide-[var(--border)] overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)]">
            {segments.map((s) => (
              <Link key={s.id} href={`/meetings/${s.meeting.id}`} className="block px-4 py-3 hover:bg-black/[0.02] dark:hover:bg-white/[0.03]">
                <div className="text-xs text-[var(--muted)]">
                  {s.meeting.title} · {s.speaker.displayName ?? s.speaker.label}
                </div>
                <p className="mt-0.5 text-sm">{highlight(s.text, query)}</p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
