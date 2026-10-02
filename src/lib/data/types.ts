import { randomBytes } from "crypto";
import type { EntityStatus, PointType } from "@/types";
import type { DistrictHotspot, DistrictMapView } from "@/lib/maps/types";

export type DataProvider = "local" | "mongodb";

export interface StoredDistrict {
  id: string;
  name: string;
  code: string;
  mapImage: string;
  mapWidth: number;
  mapHeight: number;
  /** Leaflet map viewport for this district (OpenStreetMap). */
  mapView: DistrictMapView | null;
  /** Red/blue guide points shown on the district map. */
  hotspots: DistrictHotspot[];
  status: EntityStatus;
  createdAt: string;
  updatedAt: string;
}

export interface StoredCategory {
  id: string;
  name: string;
  description: string | null;
  status: EntityStatus;
  createdAt: string;
  updatedAt: string;
}

export interface StoredLocation {
  id: string;
  districtId: string;
  categoryId: string;
  name: string;
  pixelX: number;
  pixelY: number;
  latitude: number | null;
  longitude: number | null;
  address: string | null;
  description: string | null;
  pointType: PointType;
  markerColor: string | null;
  status: EntityStatus;
  createdAt: string;
  updatedAt: string;
}

export interface LocalDatabase {
  districts: StoredDistrict[];
  categories: StoredCategory[];
  locations: StoredLocation[];
}

export function createId(): string {
  return randomBytes(12).toString("hex");
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function getDataProvider(): DataProvider {
  const provider = process.env.DATA_PROVIDER?.toLowerCase();
  if (provider === "mongodb") return "mongodb";
  return "local";
}
