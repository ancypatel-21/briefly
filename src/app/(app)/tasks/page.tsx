import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentTeam, getCurrentUser } from "@/lib/auth";
import { StatusBadge } from "@/components/StatusBadge";
import { cn } from "@/lib/utils";
import { TaskStatusSelect } from "@/components/TaskStatusSelect";

const TABS = [
  { key: "all", label: "All" },
  { key: "PENDING", label: "Pending" },
  { key: "IN_PROGRESS", label: "In progress" },
  { key: "DONE", label: "Done" },
] as const;

export default async function TasksPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const team = await getCurrentTeam(user.id);
  if (!team) redirect("/login");

  const { status } = await searchParams;
  const activeTab = status && TABS.some((t) => t.key === status) ? status : "all";

  const actionItems = await prisma.actionItem.findMany({
    where: { meeting: { teamId: team.id }, ...(activeTab !== "all" ? { status: activeTab as never } : {}) },
    include: { meeting: { select: { id: true, title: true } }, owner: { select: { id: true, name: true } } },
    orderBy: [{ status: "asc" }, { dueDate: "asc" }],
  });

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Tasks</h1>

      <div className="flex gap-1 border-b border-[var(--border)]">
        {TABS.map((tab) => (
          <Link
            key={tab.key}
            href={tab.key === "all" ? "/tasks" : `/tasks?status=${tab.key}`}
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

      {actionItems.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--border)] p-10 text-center text-sm text-[var(--muted)]">
          No tasks here.
        </div>
      ) : (
        <div className="divide-y divide-[var(--border)] overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)]">
          {actionItems.map((item) => {
            const overdue = item.status !== "DONE" && item.dueDate && new Date(item.dueDate) < new Date();
            return (
              <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className={item.status === "DONE" ? "text-sm line-through text-[var(--muted)]" : "text-sm"}>
                    {item.description}
                  </p>
                  <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-[var(--muted)]">
                    <Link href={`/meetings/${item.meeting.id}`} className="hover:text-brand hover:underline">
                      {item.meeting.title}
                    </Link>
                    {(item.owner?.name ?? item.ownerName) && <span>· {item.owner?.name ?? item.ownerName}</span>}
                    {item.dueDate && (
                      <span className={overdue ? "font-medium text-red-500" : ""}>
                        · Due {new Date(item.dueDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <TaskStatusSelect id={item.id} status={item.status} />
                  <StatusBadge status={item.status} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
