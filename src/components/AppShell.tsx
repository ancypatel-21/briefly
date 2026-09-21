"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Video,
  ListChecks,
  ScrollText,
  Search,
  Plug,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { NewMeetingButton } from "@/components/NewMeetingButton";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/meetings", label: "Meetings", icon: Video },
  { href: "/tasks", label: "Tasks", icon: ListChecks },
  { href: "/decisions", label: "Decisions", icon: ScrollText },
  { href: "/search", label: "Search", icon: Search },
  { href: "/integrations", label: "Integrations", icon: Plug },
];

export function AppShell({
  user,
  team,
  children,
}: {
  user: { name: string; email: string; avatarColor: string };
  team: { name: string };
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const nav = (
    <nav className="flex flex-1 flex-col gap-1 px-3">
      {NAV_ITEMS.map((item) => {
        const active = pathname === item.href || pathname.startsWith(item.href + "/");
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setMobileOpen(false)}
            className={cn(
              "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition",
              active
                ? "bg-brand/10 text-brand"
                : "text-[var(--muted)] hover:bg-black/5 hover:text-[var(--foreground)] dark:hover:bg-white/5",
            )}
          >
            <Icon size={17} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar */}
      <aside className="hidden w-60 flex-col border-r border-[var(--border)] bg-[var(--surface)] py-5 md:flex">
        <div className="mb-6 flex items-center gap-2 px-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-sm font-semibold text-white">
            B
          </div>
          <div>
            <div className="text-sm font-semibold leading-tight">Briefly</div>
            <div className="text-xs leading-tight text-[var(--muted)]">{team.name}</div>
          </div>
        </div>
        <div className="px-3 pb-4">
          <NewMeetingButton />
        </div>
        {nav}
        <div className="mt-auto flex items-center gap-2 border-t border-[var(--border)] px-4 pt-4">
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white"
            style={{ backgroundColor: user.avatarColor }}
          >
            {user.name.slice(0, 1).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium">{user.name}</div>
            <div className="truncate text-xs text-[var(--muted)]">{user.email}</div>
          </div>
          <button
            onClick={handleLogout}
            title="Log out"
            className="rounded-md p-1.5 text-[var(--muted)] hover:bg-black/5 hover:text-[var(--foreground)] dark:hover:bg-white/5"
          >
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      {/* Mobile topbar */}
      <div className="fixed inset-x-0 top-0 z-30 flex h-14 items-center justify-between border-b border-[var(--border)] bg-[var(--surface)] px-4 md:hidden">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand text-xs font-semibold text-white">
            B
          </div>
          <span className="text-sm font-semibold">Briefly</span>
        </div>
        <button onClick={() => setMobileOpen((v) => !v)} className="p-1.5">
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>
      {mobileOpen && (
        <div className="fixed inset-0 top-14 z-20 flex flex-col bg-[var(--surface)] py-4 md:hidden">
          <div className="px-3 pb-4">
            <NewMeetingButton />
          </div>
          {nav}
          <button
            onClick={handleLogout}
            className="mx-3 mt-4 flex items-center gap-2 rounded-lg border-t border-[var(--border)] px-3 py-2 pt-4 text-sm text-[var(--muted)]"
          >
            <LogOut size={16} /> Log out
          </button>
        </div>
      )}

      <main className="flex-1 pt-14 md:pt-0">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">{children}</div>
      </main>
    </div>
  );
}
