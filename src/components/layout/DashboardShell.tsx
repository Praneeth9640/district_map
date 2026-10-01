import { DashboardShellClient } from "@/components/layout/DashboardShellClient";
import { getSession } from "@/lib/auth/session";

export async function DashboardShell({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  return (
    <DashboardShellClient userName={session?.name}>{children}</DashboardShellClient>
  );
}
