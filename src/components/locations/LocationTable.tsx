"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCoordinate } from "@/lib/utils";
import type { Location } from "@/types";

interface LocationTableProps {
  locations: Location[];
  loading?: boolean;
  selectedId?: string | null;
  onView: (location: Location) => void;
  onEdit: (location: Location) => void;
  onDelete: (location: Location) => void;
  onAdd?: () => void;
}

export function LocationTable({
  locations,
  loading,
  selectedId,
  onView,
  onEdit,
  onDelete,
  onAdd,
}: LocationTableProps) {
  if (loading) {
    return (
      <div className="rounded-lg border bg-white p-6 text-sm text-muted-foreground">
        Loading locations...
      </div>
    );
  }

  if (locations.length === 0) {
    return (
      <div className="rounded-lg border border-dashed bg-stone-50 p-8 text-center">
        <p className="text-sm text-muted-foreground">
          No locations have been added to this district yet.
        </p>
        {onAdd ? (
          <Button type="button" className="mt-4" onClick={onAdd}>
            Add Location
          </Button>
        ) : null}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b bg-stone-50 text-xs uppercase tracking-wide text-stone-500">
            <tr>
              <th className="px-4 py-3 font-medium">Location</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Latitude</th>
              <th className="px-4 py-3 font-medium">Longitude</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {locations.map((location) => (
              <tr
                key={location.id}
                className={`border-b last:border-0 hover:bg-stone-50 ${
                  selectedId === location.id ? "bg-amber-50" : ""
                }`}
              >
                <td className="px-4 py-3">
                  <button
                    type="button"
                    className="text-left font-medium text-stone-900 hover:underline"
                    onClick={() => onView(location)}
                  >
                    {location.name}
                  </button>
                  <div className="text-xs text-muted-foreground">
                    {location.district?.name}
                  </div>
                </td>
                <td className="px-4 py-3">{location.category?.name ?? "—"}</td>
                <td className="px-4 py-3 font-mono text-xs">
                  {formatCoordinate(location.latitude)}
                </td>
                <td className="px-4 py-3 font-mono text-xs">
                  {formatCoordinate(location.longitude)}
                </td>
                <td className="px-4 py-3">
                  <Badge variant={location.status === "ACTIVE" ? "success" : "secondary"}>
                    {location.status}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" size="sm" variant="outline" onClick={() => onView(location)}>
                      View
                    </Button>
                    <Button type="button" size="sm" variant="outline" onClick={() => onEdit(location)}>
                      Edit
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      onClick={() => onDelete(location)}
                    >
                      Delete
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
