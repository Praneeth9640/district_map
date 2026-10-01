"use client";

import Link from "next/link";
import { MapPinned, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { logoutAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";

const links = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/locations", label: "Locations" },
  { href: "/dashboard/districts", label: "Districts" },
  { href: "/dashboard/categories", label: "Categories" },
];

interface DashboardNavProps {
  pathname: string;
  userName?: string;
}

export function DashboardNav({ pathname, userName }: DashboardNavProps) {
  return (
    <header className="border-b bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-stone-900 text-white">
            <MapPinned className="h-5 w-5" />
          </div>
          <div>
            <div className="text-lg font-semibold tracking-tight text-stone-900">
              District Location Mapper
            </div>
            <div className="text-xs text-muted-foreground">
              {userName ? `Signed in as ${userName}` : "GIS location pinning console"}
            </div>
          </div>
        </Link>

        <div className="flex flex-wrap items-center gap-2">
          <nav className="flex flex-wrap gap-1">
            {links.map((link) => {
              const active =
                link.href === "/dashboard"
                  ? pathname === "/dashboard"
                  : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-stone-900 text-white"
                      : "text-stone-600 hover:bg-stone-100 hover:text-stone-900",
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
          <form action={logoutAction}>
            <Button type="submit" variant="outline" size="sm" className="gap-1.5">
              <LogOut className="h-3.5 w-3.5" />
              Logout
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}
