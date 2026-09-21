import { cn } from "@/lib/utils";

const MEETING_STYLES: Record<string, string> = {
  SCHEDULED: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
  LIVE: "bg-red-500/10 text-red-600 dark:text-red-400",
  PROCESSING: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  COMPLETED: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  FAILED: "bg-red-500/10 text-red-600 dark:text-red-400",
  PENDING: "bg-slate-500/10 text-slate-600 dark:text-slate-400",
  IN_PROGRESS: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  DONE: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  CONNECTED: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  DISCONNECTED: "bg-slate-500/10 text-slate-600 dark:text-slate-400",
};

const LABELS: Record<string, string> = {
  SCHEDULED: "Scheduled",
  LIVE: "Live",
  PROCESSING: "Processing",
  COMPLETED: "Completed",
  FAILED: "Failed",
  PENDING: "Pending",
  IN_PROGRESS: "In progress",
  DONE: "Done",
  CONNECTED: "Connected",
  DISCONNECTED: "Not connected",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        MEETING_STYLES[status] ?? "bg-slate-500/10 text-slate-600",
      )}
    >
      {status === "LIVE" && (
        <span className="mr-1.5 h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
      )}
      {LABELS[status] ?? status}
    </span>
  );
}
