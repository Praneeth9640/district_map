/**
 * Built-in Leaflet views used as defaults / fallbacks.
 * District records can override these via `mapView`.
 * @see https://leafletjs.com/
 */

import type { DistrictMapView } from "@/lib/maps/types";

export type { DistrictMapView };

/** Allowed districts for this app (fixed set). */
export const APP_DISTRICTS = [
  { name: "Srikakulam", code: "SKL" },
  { name: "Parvathipuram Manyam", code: "PMY" },
  { name: "Vizianagaram", code: "VZM" },
  { name: "Alluri Sitharama Raju", code: "ASR" },
  { name: "Visakhapatnam", code: "VSK" },
] as const;

export const DISTRICT_VIEWS: Record<string, DistrictMapView> = {
  // Srikakulam — ~18°20'–19°10'N, 83°50'–84°50'E
  SKL: {
    centerLat: 18.65,
    centerLng: 84.2,
    zoom: 10,
    bounds: [
      [18.3, 83.8],
      [19.2, 84.85],
    ],
    minZoom: 9,
    maxZoom: 16,
  },
  PMY: {
    centerLat: 18.78,
    centerLng: 83.43,
    zoom: 10,
    bounds: [
      [18.4, 83.0],
      [19.2, 83.9],
    ],
    minZoom: 9,
    maxZoom: 16,
  },
  VZM: {
    centerLat: 18.11,
    centerLng: 83.4,
    zoom: 10,
    bounds: [
      [17.85, 83.1],
      [18.55, 83.75],
    ],
    minZoom: 9,
    maxZoom: 16,
  },
  ASR: {
    centerLat: 18.08,
    centerLng: 82.65,
    zoom: 10,
    bounds: [
      [17.45, 81.35],
      [18.65, 83.25],
    ],
    minZoom: 9,
    maxZoom: 16,
  },
  VSK: {
    centerLat: 17.69,
    centerLng: 83.22,
    zoom: 11,
    bounds: [
      [17.5, 83.05],
      [17.9, 83.45],
    ],
    minZoom: 10,
    maxZoom: 16,
  },
};

/** Prefer district-stored mapView; fall back to built-in code defaults. */
export function resolveDistrictView(
  code: string,
  mapView?: DistrictMapView | null,
): DistrictMapView | null {
  if (mapView?.bounds?.length === 2) return mapView;
  return DISTRICT_VIEWS[code] ?? null;
}

export function getDistrictView(code: string): DistrictMapView | null {
  return DISTRICT_VIEWS[code] ?? null;
}

export function hasDistrictMap(code: string, mapView?: DistrictMapView | null): boolean {
  return Boolean(resolveDistrictView(code, mapView));
}

export function emptyMapView(): DistrictMapView {
  return {
    centerLat: 17.7,
    centerLng: 82.8,
    zoom: 10,
    bounds: [
      [17.4, 82.4],
      [18.0, 83.2],
    ],
    minZoom: 9,
    maxZoom: 16,
  };
}
