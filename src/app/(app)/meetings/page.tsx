import Link from "next/link";
import { redirect } from "next/navigation";
import { Users } from "lucide-react";
import { prisma } from "@/lib/db";
import { getCurrentTeam, getCurrentUser } from "@/lib/auth";
import { StatusBadge } from "@/components/StatusBadge";
import { JoinByCodeForm } from "@/components/JoinByCodeForm";
import { cn } from "@/lib/utils";

const TABS = [
  { key: "all", label: "All" },
  { key: "SCHEDULED", label: "Scheduled" },
  { key: "LIVE", label: "Live" },
  { key: "COMPLETED", label: "Completed" },
] as const;

export default async function MeetingsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const team = await getCurrentTeam(user.id);
  if (!team) redirect("/login");

  const { status } = await searchParams;
  const activeTab = status && TABS.some((t) => t.key === status) ? status : "all";

  const meetings = await prisma.meeting.findMany({
    where: { teamId: team.id, ...(activeTab !== "all" ? { status: activeTab as never } : {}) },
    include: { participants: true, _count: { select: { actionItems: true } } },
    orderBy: [{ scheduledStart: "desc" }, { createdAt: "desc" }],
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Meetings</h1>
        <JoinByCodeForm />
      </div>

      <div className="flex gap-1 border-b border-[var(--border)]">
        {TABS.map((tab) => (
          <Link
            key={tab.key}
            href={tab.key === "all" ? "/meetings" : `/meetings?status=${tab.key}`}
            className={cn(
              "border-b-2 px-3 py-2 text-sm font-medium",
              activeTab === tab.key
                ? "border-brand text-brand"
                : "border-transparent text-[var(--muted)] hover:text-[var(--foreground)]",
            )}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {meetings.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--border)] p-10 text-center text-sm text-[var(--muted)]">
          No meetings here yet.
        </div>
      ) : (
        <div className="divide-y divide-[var(--border)] overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)]">
          {meetings.map((m) => (
            <Link
              key={m.id}
              href={`/meetings/${m.id}`}
              className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 hover:bg-black/[0.02] dark:hover:bg-white/[0.03]"
            >
              <div className="min-w-0">
                <div className="truncate text-sm font-medium">{m.title}</div>
                <div className="mt-0.5 flex items-center gap-3 text-xs text-[var(--muted)]">
                  <span>
                    {m.scheduledStart
                      ? m.scheduledStart.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })
                      : new Date(m.createdAt).toLocaleDateString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users size={12} /> {m.participants.length}
                  </span>
                  {m._count.actionItems > 0 && <span>{m._count.actionItems} action items</span>}
                </div>
              </div>
              <StatusBadge status={m.status} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
