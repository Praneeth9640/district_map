"use client";

import { Badge } from "@/components/ui/badge";
import { formatCoordinate } from "@/lib/utils";
import type { Location } from "@/types";

interface LocationDetailsProps {
  location: Location | null;
}

export function LocationDetails({ location }: LocationDetailsProps) {
  if (!location) return null;

  return (
    <div className="rounded-lg border bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold">{location.name}</h3>
          <p className="text-sm text-muted-foreground">
            {location.district?.name} · {location.category?.name}
          </p>
        </div>
        <Badge variant={location.status === "ACTIVE" ? "success" : "secondary"}>
          {location.status}
        </Badge>
      </div>
      <dl className="grid gap-2 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-muted-foreground">Latitude</dt>
          <dd className="font-mono">{formatCoordinate(location.latitude)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Longitude</dt>
          <dd className="font-mono">{formatCoordinate(location.longitude)}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-muted-foreground">Address</dt>
          <dd>{location.address || "—"}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-muted-foreground">Description</dt>
          <dd>{location.description || "—"}</dd>
        </div>
      </dl>
    </div>
  );
}
