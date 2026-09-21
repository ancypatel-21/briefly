import Link from "next/link";
import { CalendarClock, CheckCircle2, ListTodo, AlertTriangle, Video } from "lucide-react";
import { prisma } from "@/lib/db";
import { getCurrentTeam, getCurrentUser } from "@/lib/auth";
import { StatTile } from "@/components/StatTile";
import { StatusBadge } from "@/components/StatusBadge";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const team = await getCurrentTeam(user.id);
  if (!team) redirect("/login");

  const [totalMeetings, upcomingMeetings, openActionItems, overdueActionItems, recentMeetings] = await Promise.all([
    prisma.meeting.count({ where: { teamId: team.id } }),
    prisma.meeting.findMany({
      where: { teamId: team.id, status: "SCHEDULED", scheduledStart: { gte: new Date() } },
      orderBy: { scheduledStart: "asc" },
      take: 5,
    }),
    prisma.actionItem.count({ where: { meeting: { teamId: team.id }, status: { not: "DONE" } } }),
    prisma.actionItem.count({
      where: { meeting: { teamId: team.id }, status: { not: "DONE" }, dueDate: { lt: new Date() } },
    }),
    prisma.meeting.findMany({
      where: { teamId: team.id, status: "COMPLETED" },
      orderBy: { endedAt: "desc" },
      take: 5,
      include: { summary: true, _count: { select: { actionItems: true } } },
    }),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold">Welcome back, {user.name.split(" ")[0]}</h1>
        <p className="text-sm text-[var(--muted)]">Here&apos;s what&apos;s happening across {team.name}.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Total meetings" value={totalMeetings} icon={Video} />
        <StatTile label="Upcoming" value={upcomingMeetings.length} icon={CalendarClock} />
        <StatTile label="Open action items" value={openActionItems} icon={ListTodo} />
        <StatTile label="Overdue" value={overdueActionItems} icon={AlertTriangle} tone={overdueActionItems > 0 ? "warning" : "default"} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Upcoming meetings</h2>
            <Link href="/meetings" className="text-xs text-brand hover:underline">
              View all
            </Link>
          </div>
          {upcomingMeetings.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">Nothing scheduled. Create a meeting to get started.</p>
          ) : (
            <ul className="space-y-3">
              {upcomingMeetings.map((m) => (
                <li key={m.id}>
                  <Link href={`/meetings/${m.id}`} className="flex items-center justify-between gap-3 group">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium group-hover:text-brand">{m.title}</div>
                      <div className="text-xs text-[var(--muted)]">
                        {m.scheduledStart?.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
                      </div>
                    </div>
                    <StatusBadge status={m.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Recently completed</h2>
            <Link href="/decisions" className="text-xs text-brand hover:underline">
              Decision log
            </Link>
          </div>
          {recentMeetings.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">No meetings processed yet.</p>
          ) : (
            <ul className="space-y-3">
              {recentMeetings.map((m) => (
                <li key={m.id}>
                  <Link href={`/meetings/${m.id}`} className="flex items-center justify-between gap-3 group">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium group-hover:text-brand">{m.title}</div>
                      <div className="truncate text-xs text-[var(--muted)]">
                        {m._count.actionItems} action item{m._count.actionItems === 1 ? "" : "s"}
                      </div>
                    </div>
                    <CheckCircle2 size={16} className="shrink-0 text-emerald-500" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
