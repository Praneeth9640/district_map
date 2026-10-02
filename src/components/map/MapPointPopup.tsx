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
import type { Category } from "@/types";
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
  onSave: (values: LocationFormValues) => void;
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
        prev.markerColor === values.markerColor &&
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
        markerColor: values.markerColor,
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
        "pointer-events-auto w-full max-w-none rounded-lg border border-stone-200 bg-white p-3 shadow-sm",
        anchored && "absolute z-50 w-[300px] -translate-x-1/2 shadow-xl",
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
                : undefined,
          )}
          style={
            draft.pointType === "CUSTOM"
              ? { backgroundColor: draft.markerColor || "#f59e0b" }
              : undefined
          }
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
          <Label htmlFor="popup-address">Address</Label>
          <Input
            id="popup-address"
            name="location-address"
            value={draft.address}
            onChange={(event) => update("address", event.target.value, { sync: false })}
            onBlur={flushDraft}
            placeholder="Optional address"
            autoComplete="off"
          />
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
          <Label>Point colour</Label>
          <div className="grid grid-cols-3 gap-2">
            {(
              [
                {
                  value: "BLUE" as const,
                  label: "Blue",
                  hint: "Tourism",
                  swatch: "bg-sky-500",
                  ring: "ring-sky-500",
                },
                {
                  value: "RED" as const,
                  label: "Red",
                  hint: "Mandal HQ",
                  swatch: "bg-red-500",
                  ring: "ring-red-500",
                },
                {
                  value: "CUSTOM" as const,
                  label: "Custom",
                  hint: "Pick colour",
                  swatch: "",
                  ring: "ring-stone-400",
                },
              ] as const
            ).map((option) => {
              const selected = draft.pointType === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    const nextType = option.value;
                    const next = {
                      ...draftRef.current,
                      pointType: nextType,
                      markerColor:
                        nextType === "CUSTOM"
                          ? draftRef.current.markerColor || "#f59e0b"
                          : "",
                    };
                    draftRef.current = next;
                    setDraft(next);
                    onChange(next);
                  }}
                  className={cn(
                    "flex flex-col items-center gap-1.5 rounded-md border px-2 py-2 text-center transition",
                    selected
                      ? `border-stone-900 bg-stone-50 ring-2 ring-offset-1 ${option.ring}`
                      : "border-stone-200 bg-white hover:border-stone-300",
                  )}
                  aria-pressed={selected}
                >
                  <span
                    className={cn("h-5 w-5 rounded-full shadow-sm", option.swatch)}
                    style={
                      option.value === "CUSTOM"
                        ? { backgroundColor: draft.markerColor || "#f59e0b" }
                        : undefined
                    }
                  />
                  <span className="text-xs font-medium text-stone-900">{option.label}</span>
                  <span className="text-[10px] leading-tight text-muted-foreground">
                    {option.hint}
                  </span>
                </button>
              );
            })}
          </div>

          {draft.pointType === "CUSTOM" ? (
            <div className="mt-2 space-y-2 rounded-md border border-stone-200 bg-stone-50 p-2">
              <p className="text-[11px] text-muted-foreground">Choose your pin colour</p>
              <div className="flex flex-wrap gap-2">
                {[
                  "#f59e0b",
                  "#22c55e",
                  "#a855f7",
                  "#ec4899",
                  "#14b8a6",
                  "#64748b",
                  "#000000",
                ].map((color) => (
                  <button
                    key={color}
                    type="button"
                    title={color}
                    onClick={() => update("markerColor", color)}
                    className={cn(
                      "h-7 w-7 rounded-full border border-white shadow-sm ring-1 ring-stone-200",
                      draft.markerColor === color && "ring-2 ring-stone-900 ring-offset-1",
                    )}
                    style={{ backgroundColor: color }}
                  />
                ))}
                <label className="flex h-7 cursor-pointer items-center gap-1 rounded-md border border-dashed border-stone-300 bg-white px-2 text-[11px] text-stone-600">
                  More
                  <input
                    type="color"
                    value={draft.markerColor || "#f59e0b"}
                    onChange={(event) => update("markerColor", event.target.value)}
                    className="h-5 w-5 cursor-pointer border-0 bg-transparent p-0"
                    aria-label="Pick custom colour"
                  />
                </label>
              </div>
            </div>
          ) : null}
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" size="sm" variant="outline" onClick={onCancel} disabled={saving}>
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() => {
              const latest = {
                ...draftRef.current,
                markerColor:
                  draftRef.current.pointType === "CUSTOM"
                    ? draftRef.current.markerColor?.trim() || "#f59e0b"
                    : "",
              };
              draftRef.current = latest;
              setDraft(latest);
              onChange(latest);
              onSave(latest);
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
