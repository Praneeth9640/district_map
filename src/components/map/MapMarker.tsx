"use client";

import type { PointerEvent } from "react";
import { cn } from "@/lib/utils";
import type { MapMarkerData } from "@/types";

interface MapMarkerProps {
  marker: MapMarkerData;
  leftPercent: number;
  topPercent: number;
  selected?: boolean;
  onSelect?: () => void;
  onPointerDown?: (event: PointerEvent) => void;
}

function markerTone(marker: MapMarkerData) {
  if (marker.temporary) {
    return "border-amber-500 bg-amber-400 shadow-amber-200";
  }
  if (marker.pointType === "BLUE") {
    return "border-sky-700 bg-sky-500 shadow-sky-200";
  }
  if (marker.pointType === "RED") {
    return "border-red-700 bg-red-500 shadow-red-200";
  }
  return "border-stone-700 bg-stone-500 shadow-stone-200";
}

export function MapMarker({
  marker,
  leftPercent,
  topPercent,
  selected,
  onSelect,
  onPointerDown,
}: MapMarkerProps) {
  const isBlue = marker.pointType === "BLUE";
  const isRed = marker.pointType === "RED" || (!marker.pointType && !marker.temporary);

  return (
    <button
      type="button"
      className={cn(
        "absolute z-10 -translate-x-1/2 -translate-y-1/2 cursor-grab touch-none focus:outline-none active:cursor-grabbing",
        selected && "z-30",
        marker.temporary && "z-40",
      )}
      style={{ left: `${leftPercent}%`, top: `${topPercent}%` }}
      onClick={(event) => {
        event.stopPropagation();
        onSelect?.();
      }}
      onPointerDown={onPointerDown}
      aria-label={marker.name ?? "Map marker"}
      title={marker.name ?? "New location"}
    >
      {isBlue && !marker.temporary ? (
        <span
          className={cn(
            "block h-4 w-4 rounded-full border-2 shadow-md transition-transform",
            markerTone(marker),
            selected && "scale-125 ring-2 ring-sky-300",
          )}
        />
      ) : isRed && !marker.temporary ? (
        <span
          className={cn(
            "relative block h-5 w-5 rounded-full border-2 bg-white shadow-md transition-transform",
            selected && "scale-125 ring-2 ring-red-300",
            "border-red-600",
          )}
        >
          <span className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-red-600" />
        </span>
      ) : (
        <span
          className={cn(
            "block h-4 w-4 rounded-full border-2 shadow-md transition-transform",
            markerTone(marker),
            selected && "scale-125",
          )}
        />
      )}
    </button>
  );
}
