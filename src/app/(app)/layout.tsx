import { redirect } from "next/navigation";
import { getCurrentTeam, getCurrentUser } from "@/lib/auth";
import { AppShell } from "@/components/AppShell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const team = await getCurrentTeam(user.id);
  if (!team) redirect("/login");

  return (
    <AppShell
      user={{ name: user.name, email: user.email, avatarColor: user.avatarColor }}
      team={{ name: team.name }}
    >
      {children}
    </AppShell>
  );
}
