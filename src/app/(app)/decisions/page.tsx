import Link from "next/link";
import { redirect } from "next/navigation";
import { ScrollText } from "lucide-react";
import { prisma } from "@/lib/db";
import { getCurrentTeam, getCurrentUser } from "@/lib/auth";

export default async function DecisionsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const team = await getCurrentTeam(user.id);
  if (!team) redirect("/login");

  const meetings = await prisma.meeting.findMany({
    where: { teamId: team.id, summary: { isNot: null } },
    include: { summary: true },
    orderBy: { endedAt: "desc" },
  });

  const withDecisions = meetings.filter((m) => (m.summary?.keyDecisions as string[])?.length > 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Decision log</h1>
        <p className="text-sm text-[var(--muted)]">Every decision captured across your team&apos;s meetings, newest first.</p>
      </div>

      {withDecisions.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--border)] p-10 text-center text-sm text-[var(--muted)]">
          No decisions recorded yet.
        </div>
      ) : (
        <div className="space-y-4">
          {withDecisions.map((m) => (
            <div key={m.id} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
              <div className="mb-2 flex items-center justify-between">
                <Link href={`/meetings/${m.id}`} className="text-sm font-semibold hover:text-brand">
                  {m.title}
                </Link>
                <span className="text-xs text-[var(--muted)]">
                  {m.endedAt ? new Date(m.endedAt).toLocaleDateString() : ""}
                </span>
              </div>
              <ul className="space-y-1.5">
                {(m.summary!.keyDecisions as string[]).map((d, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <ScrollText size={14} className="mt-0.5 shrink-0 text-brand" />
                    {d}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
