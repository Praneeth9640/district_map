"use client";

import { usePathname } from "next/navigation";
import { DashboardNav } from "@/components/layout/DashboardNav";

export function DashboardShellClient({
  children,
  userName,
}: {
  children: React.ReactNode;
  userName?: string;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#f8fafc,_#f5f5f4_45%,_#e7e5e4)]">
      <DashboardNav pathname={pathname} userName={userName} />
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}
