import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  return (
    <div className="flex min-h-screen flex-1 items-center justify-center bg-[var(--background)] px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center justify-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand text-white font-semibold">
            B
          </div>
          <span className="text-lg font-semibold">Briefly</span>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
          {children}
        </div>
      </div>
    </div>
  );
}
