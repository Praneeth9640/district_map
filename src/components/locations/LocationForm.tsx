"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UNCALIBRATED_MESSAGE } from "@/lib/coordinates/coordinateMapper";
import type { Category, EntityStatus, Location, PointType } from "@/types";

export interface LocationFormValues {
  id?: string;
  /** Bumps whenever a new pin/edit session is opened (keeps popup typing stable). */
  sessionKey?: string;
  districtId: string;
  categoryId: string;
  name: string;
  pixelX: number;
  pixelY: number;
  latitude: number | null;
  longitude: number | null;
  address: string;
  description: string;
  pointType: PointType;
  markerColor: string;
  status: EntityStatus;
}

interface LocationFormProps {
  districtId: string;
  districtName: string;
  categories: Category[];
  values: LocationFormValues | null;
  calibrated: boolean;
  saving?: boolean;
  onChange: (values: LocationFormValues) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

export function LocationForm({
  districtId,
  districtName,
  categories,
  values,
  calibrated,
  saving,
  onChange,
  onSubmit,
  onCancel,
}: LocationFormProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!values) {
    return (
      <div className="rounded-lg border border-dashed bg-stone-50 p-6 text-sm text-muted-foreground">
        Click on the map to place a pin and add a location.
      </div>
    );
  }

  const update = <K extends keyof LocationFormValues>(
    key: K,
    value: LocationFormValues[K],
  ) => {
    onChange({ ...values, [key]: value });
  };

  const validate = () => {
    const next: Record<string, string> = {};
    if (!values.name.trim()) next.name = "Location name is required.";
    if (!values.categoryId) next.categoryId = "Category is required.";
    if (!Number.isFinite(values.pixelX) || !Number.isFinite(values.pixelY)) {
      next.pixel = "Pixel coordinates are required.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  return (
    <form
      className="space-y-4 rounded-lg border bg-white p-4 shadow-sm"
      onSubmit={(event) => {
        event.preventDefault();
        if (validate()) onSubmit();
      }}
    >
      <div>
        <h3 className="text-lg font-semibold text-stone-900">Location Details</h3>
        <p className="text-sm text-muted-foreground">
          {values.id ? "Edit location" : "New location"} · {districtName}
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="location-name">Location Name</Label>
        <Input
          id="location-name"
          value={values.name}
          onChange={(event) => update("name", event.target.value)}
          placeholder="Enter location name"
        />
        {errors.name ? <p className="text-sm text-red-600">{errors.name}</p> : null}
      </div>

      <div className="space-y-2">
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
        {errors.categoryId ? (
          <p className="text-sm text-red-600">{errors.categoryId}</p>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Latitude</Label>
          <Input
            value={
              values.latitude === null || values.latitude === undefined
                ? ""
                : String(values.latitude)
            }
            readOnly={!calibrated}
            className={!calibrated ? "bg-stone-50" : undefined}
            placeholder="18.xxxxxx"
            onChange={(event) => {
              if (!calibrated) return;
              const next = event.target.value === "" ? null : Number(event.target.value);
              update("latitude", next);
            }}
          />
        </div>
        <div className="space-y-2">
          <Label>Longitude</Label>
          <Input
            value={
              values.longitude === null || values.longitude === undefined
                ? ""
                : String(values.longitude)
            }
            readOnly={!calibrated}
            className={!calibrated ? "bg-stone-50" : undefined}
            placeholder="82.xxxxxx"
            onChange={(event) => {
              if (!calibrated) return;
              const next = event.target.value === "" ? null : Number(event.target.value);
              update("longitude", next);
            }}
          />
        </div>
      </div>

      {!calibrated ? (
        <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {UNCALIBRATED_MESSAGE}
        </p>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="address">Address</Label>
        <Input
          id="address"
          value={values.address}
          onChange={(event) => update("address", event.target.value)}
          placeholder="Optional address"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={values.description}
          onChange={(event) => update("description", event.target.value)}
          placeholder="Optional description"
        />
      </div>

      <div className="space-y-2">
        <Label>Status</Label>
        <Select
          value={values.status}
          onValueChange={(value) => update("status", value as EntityStatus)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="INACTIVE">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <input type="hidden" value={districtId} readOnly />

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? "Saving..." : values.id ? "Update Location" : "Save Location"}
        </Button>
      </div>
    </form>
  );
}

export function locationToFormValues(location: Location): LocationFormValues {
  return {
    id: location.id,
    sessionKey: `edit-${location.id}`,
    districtId: location.districtId,
    categoryId: location.categoryId,
    name: location.name,
    pixelX: location.pixelX,
    pixelY: location.pixelY,
    latitude: location.latitude,
    longitude: location.longitude,
    address: location.address ?? "",
    description: location.description ?? "",
    pointType: location.pointType ?? "CUSTOM",
    markerColor: location.markerColor ?? "#f59e0b",
    status: location.status,
  };
}
