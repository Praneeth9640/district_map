"use client";

import { Minus, Plus, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MapToolbarProps {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
}

export function MapToolbar({ zoom, onZoomIn, onZoomOut, onReset }: MapToolbarProps) {
  return (
    <div className="absolute right-3 top-3 z-40 flex flex-col gap-2 rounded-md border bg-white/95 p-1 shadow-sm">
      <Button type="button" size="icon" variant="ghost" onClick={onZoomIn} aria-label="Zoom in">
        <Plus className="h-4 w-4" />
      </Button>
      <div className="px-2 text-center text-xs text-muted-foreground">{Math.round(zoom * 100)}%</div>
      <Button type="button" size="icon" variant="ghost" onClick={onZoomOut} aria-label="Zoom out">
        <Minus className="h-4 w-4" />
      </Button>
      <Button type="button" size="icon" variant="ghost" onClick={onReset} aria-label="Reset view">
        <RotateCcw className="h-4 w-4" />
      </Button>
    </div>
  );
}
