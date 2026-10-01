"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UNCALIBRATED_MESSAGE } from "@/lib/coordinates/coordinateMapper";
import { cn } from "@/lib/utils";
import type { Category, PointType } from "@/types";
import type { LocationFormValues } from "@/components/locations/LocationForm";

interface MapPointPopupProps {
  values: LocationFormValues;
  categories: Category[];
  mapWidth: number;
  mapHeight: number;
  calibrated?: boolean;
  saving?: boolean;
  /** When false, render as Leaflet popup content (no absolute map positioning). */
  anchored?: boolean;
  onChange: (values: LocationFormValues) => void;
  onSave: () => void;
  onCancel: () => void;
}

export function MapPointPopup({
  values,
  categories,
  mapWidth,
  mapHeight,
  calibrated = false,
  saving,
  anchored = true,
  onChange,
  onSave,
  onCancel,
}: MapPointPopupProps) {
  const leftPercent = (values.pixelX / mapWidth) * 100;
  const topPercent = (values.pixelY / mapHeight) * 100;

  // Keep the popup inside the map bounds.
  const anchoredLeft = Math.min(Math.max(leftPercent, 18), 82);
  const anchoredTop = Math.min(Math.max(topPercent, 8), 62);

  const update = <K extends keyof LocationFormValues>(
    key: K,
    value: LocationFormValues[K],
  ) => onChange({ ...values, [key]: value });

  const pointLabel =
    values.pointType === "BLUE"
      ? "Blue tourism point"
      : values.pointType === "RED"
        ? "Red mandal point"
        : "Custom point";

  return (
    <div
      className={cn(
        "pointer-events-auto w-[280px] rounded-lg border border-stone-200 bg-white p-3 shadow-xl",
        anchored && "absolute z-50 -translate-x-1/2",
      )}
      style={
        anchored
          ? {
              left: `${anchoredLeft}%`,
              top: `${anchoredTop}%`,
            }
          : undefined
      }
      data-map-popup
      onPointerDown={(event) => event.stopPropagation()}
      onClick={(event) => event.stopPropagation()}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-stone-900">
            {values.id ? "Edit location" : "Location details"}
          </p>
          <p className="text-xs text-muted-foreground">{pointLabel}</p>
        </div>
        <span
          className={cn(
            "h-3 w-3 rounded-full",
            values.pointType === "BLUE"
              ? "bg-sky-500"
              : values.pointType === "RED"
                ? "bg-red-500"
                : "bg-amber-400",
          )}
        />
      </div>

      <div className="space-y-2">
        <div className="space-y-1">
          <Label htmlFor="popup-name">Location Name</Label>
          <Input
            id="popup-name"
            value={values.name}
            onChange={(event) => update("name", event.target.value)}
            placeholder="Enter name"
          />
        </div>

        <div className="space-y-1">
          <Label>Category</Label>
          <Select
            value={values.categoryId || undefined}
            onValueChange={(value) => update("categoryId", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label>Latitude</Label>
            <Input
              value={values.latitude ?? ""}
              readOnly={!calibrated}
              className={!calibrated ? "bg-stone-50" : undefined}
              placeholder="18.xxxxxx"
              onChange={(event) => {
                if (!calibrated) return;
                update(
                  "latitude",
                  event.target.value === "" ? null : Number(event.target.value),
                );
              }}
            />
          </div>
          <div className="space-y-1">
            <Label>Longitude</Label>
            <Input
              value={values.longitude ?? ""}
              readOnly={!calibrated}
              className={!calibrated ? "bg-stone-50" : undefined}
              placeholder="82.xxxxxx"
              onChange={(event) => {
                if (!calibrated) return;
                update(
                  "longitude",
                  event.target.value === "" ? null : Number(event.target.value),
                );
              }}
            />
          </div>
        </div>

        {!calibrated ? (
          <p className="rounded bg-amber-50 px-2 py-1 text-[11px] leading-snug text-amber-800">
            {UNCALIBRATED_MESSAGE}
          </p>
        ) : null}

        <div className="space-y-1">
          <Label>Point type</Label>
          <Select
            value={values.pointType}
            onValueChange={(value) => update("pointType", value as PointType)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="BLUE">Blue (Tourism)</SelectItem>
              <SelectItem value="RED">Red (Mandal HQ)</SelectItem>
              <SelectItem value="CUSTOM">Custom</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" size="sm" variant="outline" onClick={onCancel} disabled={saving}>
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={onSave}
            disabled={saving || !values.name.trim() || !values.categoryId}
          >
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>
    </div>
  );
}
