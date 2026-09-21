import type { LucideIcon } from "lucide-react";

export function StatTile({
  label,
  value,
  icon: Icon,
  tone = "default",
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  tone?: "default" | "warning" | "success";
}) {
  const toneClasses =
    tone === "warning"
      ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
      : tone === "success"
        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
        : "bg-brand/10 text-brand";

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
      <div className="flex items-center gap-3">
        <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${toneClasses}`}>
          <Icon size={18} />
        </div>
        <div>
          <div className="text-xl font-semibold leading-tight">{value}</div>
          <div className="text-xs text-[var(--muted)]">{label}</div>
        </div>
      </div>
    </div>
  );
}
