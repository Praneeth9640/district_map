"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { StatCard } from "@/components/layout/StatCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCoordinate, formatDate } from "@/lib/utils";
import type { Location } from "@/types";

interface StatsResponse {
  totalDistricts: number;
  totalLocations: number;
  activeLocations: number;
  totalCategories: number;
  recentLocations: Location[];
}

export function DashboardOverview() {
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch("/api/stats");
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Failed to load dashboard stats");
        setStats(data);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-stone-900">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Overview of districts, locations, and recent map pins.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/locations">Open District Map</Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Districts" value={loading ? "…" : (stats?.totalDistricts ?? 0)} />
        <StatCard title="Locations" value={loading ? "…" : (stats?.totalLocations ?? 0)} />
        <StatCard title="Active" value={loading ? "…" : (stats?.activeLocations ?? 0)} />
        <StatCard title="Categories" value={loading ? "…" : (stats?.totalCategories ?? 0)} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Locations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : !stats?.recentLocations.length ? (
            <p className="text-sm text-muted-foreground">No locations added yet.</p>
          ) : (
            stats.recentLocations.map((location) => (
              <div
                key={location.id}
                className="flex items-start justify-between gap-3 rounded-md border p-3"
              >
                <div>
                  <div className="font-medium">{location.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {location.district?.name} · {location.category?.name}
                  </div>
                  <div className="mt-1 font-mono text-xs text-stone-500">
                    {formatCoordinate(location.latitude)} / {formatCoordinate(location.longitude)}
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant={location.status === "ACTIVE" ? "success" : "secondary"}>
                    {location.status}
                  </Badge>
                  <div className="mt-2 text-xs text-muted-foreground">
                    {formatDate(location.createdAt)}
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
