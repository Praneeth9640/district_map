"use client";

import { useEffect, useRef, useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
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

function pointSessionKey(values: LocationFormValues) {
  return values.sessionKey ?? values.id ?? "temporary";
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
  // Keep typing local so parent/iframe re-renders do not remount the inputs mid-keystroke.
  const [draft, setDraft] = useState<LocationFormValues>(values);
  const sessionKeyRef = useRef(pointSessionKey(values));
  const draftRef = useRef(draft);
  draftRef.current = draft;

  useEffect(() => {
    const nextKey = pointSessionKey(values);
    if (sessionKeyRef.current !== nextKey) {
      sessionKeyRef.current = nextKey;
      setDraft(values);
      return;
    }

    // Same point: accept map drag / external coordinate updates only.
    setDraft((prev) => {
      if (
        prev.latitude === values.latitude &&
        prev.longitude === values.longitude &&
        prev.pixelX === values.pixelX &&
        prev.pixelY === values.pixelY &&
        prev.pointType === values.pointType &&
        prev.categoryId === values.categoryId &&
        prev.status === values.status
      ) {
        return prev;
      }
      return {
        ...prev,
        latitude: values.latitude,
        longitude: values.longitude,
        pixelX: values.pixelX,
        pixelY: values.pixelY,
        pointType: values.pointType,
        categoryId: values.categoryId,
        status: values.status,
      };
    });
  }, [values]);

  const leftPercent = (draft.pixelX / mapWidth) * 100;
  const topPercent = (draft.pixelY / mapHeight) * 100;
  const anchoredLeft = Math.min(Math.max(leftPercent, 18), 82);
  const anchoredTop = Math.min(Math.max(topPercent, 8), 62);

  const update = <K extends keyof LocationFormValues>(
    key: K,
    value: LocationFormValues[K],
    options?: { sync?: boolean },
  ) => {
    const next = { ...draftRef.current, [key]: value };
    draftRef.current = next;
    setDraft(next);
    // Text fields sync on blur/save so iframe/parent re-renders do not steal focus.
    if (options?.sync === false) return;
    onChange(next);
  };

  const flushDraft = () => {
    onChange(draftRef.current);
  };

  const pointLabel =
    draft.pointType === "BLUE"
      ? "Blue tourism point"
      : draft.pointType === "RED"
        ? "Red mandal point"
        : "Custom point";

  return (
    <div
      className={cn(
        "pointer-events-auto w-[300px] rounded-lg border border-stone-200 bg-white p-3 shadow-xl",
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
      onKeyDown={(event) => event.stopPropagation()}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-stone-900">
            {draft.id ? "Edit location" : "Location details"}
          </p>
          <p className="text-xs text-muted-foreground">{pointLabel}</p>
        </div>
        <span
          className={cn(
            "h-3 w-3 rounded-full",
            draft.pointType === "BLUE"
              ? "bg-sky-500"
              : draft.pointType === "RED"
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
            name="location-name"
            value={draft.name}
            onChange={(event) => update("name", event.target.value, { sync: false })}
            onBlur={flushDraft}
            placeholder="Enter name"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
          />
        </div>

        <div className="space-y-1">
          <Label>Category</Label>
          <Select
            value={draft.categoryId || undefined}
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

        <div className="space-y-1">
          <Label htmlFor="popup-description">Description</Label>
          <Textarea
            id="popup-description"
            name="location-description"
            value={draft.description}
            onChange={(event) =>
              update("description", event.target.value, { sync: false })
            }
            onBlur={flushDraft}
            placeholder="Optional description"
            autoComplete="off"
            rows={2}
            className="min-h-[64px] resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label>Latitude</Label>
            <Input
              name="location-latitude"
              value={draft.latitude ?? ""}
              readOnly={!calibrated}
              className={!calibrated ? "bg-stone-50" : undefined}
              placeholder="18.xxxxxx"
              autoComplete="off"
              inputMode="decimal"
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
              name="location-longitude"
              value={draft.longitude ?? ""}
              readOnly={!calibrated}
              className={!calibrated ? "bg-stone-50" : undefined}
              placeholder="82.xxxxxx"
              autoComplete="off"
              inputMode="decimal"
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
            value={draft.pointType}
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
            onClick={() => {
              flushDraft();
              onSave();
            }}
            disabled={saving || !draft.name.trim() || !draft.categoryId}
          >
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>
    </div>
  );
}
