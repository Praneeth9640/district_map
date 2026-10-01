/**
 * District hotspot points for Leaflet geographic map.
 * Red = Mandal HQ, Blue = Tourism.
 *
 * Built-in ASR points are defaults; district records can override via `hotspots`.
 */

import type { DistrictHotspot } from "@/lib/maps/types";

export type MapPointType = "RED" | "BLUE";
export type DistrictMapHotspot = DistrictHotspot;

/** Snap radius in meters when clicking near a point */
export const HOTSPOT_SNAP_METERS = 1200;

export const DISTRICT_HOTSPOTS: Record<string, DistrictMapHotspot[]> = {
  ASR: [
    // Blue tourism points
    {
      name: "Borra Caves",
      pointType: "BLUE",
      latitude: 18.2806,
      longitude: 83.0389,
      address: "Ananthagiri",
      description: "Tourism place — Borra Caves",
      categoryName: "Cave",
    },
    {
      name: "Madagada View Point",
      pointType: "BLUE",
      latitude: 18.3412,
      longitude: 82.8725,
      address: "Araku Valley",
      description: "Tourism place — Madagada view point",
      categoryName: "View Point",
    },
    {
      name: "Chaparai",
      pointType: "BLUE",
      latitude: 18.3125,
      longitude: 82.905,
      address: "Dumbriguda",
      description: "Tourism place — Chaparai",
      categoryName: "Tourism",
    },
    {
      name: "Vanjangi",
      pointType: "BLUE",
      latitude: 18.105,
      longitude: 82.71,
      address: "Paderu",
      description: "Tourism place — Vanjangi",
      categoryName: "Tourism",
    },
    {
      name: "Kothapalli Waterfalls",
      pointType: "BLUE",
      latitude: 17.93,
      longitude: 82.55,
      address: "G Madugula",
      description: "Tourism place — Kothapalli waterfalls",
      categoryName: "Waterfall",
    },
    {
      name: "Lammasingi",
      pointType: "BLUE",
      latitude: 17.82,
      longitude: 82.57,
      address: "Chinthapalli",
      description: "Tourism place — Lammasingi",
      categoryName: "Tourism",
    },
    // Red mandal headquarters
    {
      name: "Munchingiputtu",
      pointType: "RED",
      latitude: 18.36,
      longitude: 82.55,
      address: "Munchingiputtu Mandal",
      description: "Mandal Headquarter",
      categoryName: "Mandal Headquarter",
    },
    {
      name: "Araku Valley",
      pointType: "RED",
      latitude: 18.3273,
      longitude: 82.8775,
      address: "Araku Valley Mandal",
      description: "Mandal Headquarter",
      categoryName: "Mandal Headquarter",
    },
    {
      name: "Dumbriguda",
      pointType: "RED",
      latitude: 18.31,
      longitude: 82.92,
      address: "Dumbriguda Mandal",
      description: "Mandal Headquarter",
      categoryName: "Mandal Headquarter",
    },
    {
      name: "Ananthagiri",
      pointType: "RED",
      latitude: 18.24,
      longitude: 83.01,
      address: "Ananthagiri Mandal",
      description: "Mandal Headquarter",
      categoryName: "Mandal Headquarter",
    },
    {
      name: "Hukumpeta",
      pointType: "RED",
      latitude: 18.17,
      longitude: 82.9,
      address: "Hukumpeta Mandal",
      description: "Mandal Headquarter",
      categoryName: "Mandal Headquarter",
    },
    {
      name: "Paderu",
      pointType: "RED",
      latitude: 18.0833,
      longitude: 82.65,
      address: "Paderu Mandal",
      description: "Mandal Headquarter / District HQ area",
      categoryName: "Mandal Headquarter",
    },
    {
      name: "G Madugula",
      pointType: "RED",
      latitude: 17.92,
      longitude: 82.52,
      address: "G Madugula Mandal",
      description: "Mandal Headquarter",
      categoryName: "Mandal Headquarter",
    },
    {
      name: "Chinthapalli",
      pointType: "RED",
      latitude: 17.87,
      longitude: 82.35,
      address: "Chinthapalli Mandal",
      description: "Mandal Headquarter",
      categoryName: "Mandal Headquarter",
    },
    {
      name: "G K Veedhi",
      pointType: "RED",
      latitude: 17.85,
      longitude: 82.2,
      address: "G K Veedhi Mandal",
      description: "Mandal Headquarter",
      categoryName: "Mandal Headquarter",
    },
    {
      name: "Koyyuru",
      pointType: "RED",
      latitude: 17.65,
      longitude: 82.25,
      address: "Koyyuru Mandal",
      description: "Mandal Headquarter",
      categoryName: "Mandal Headquarter",
    },
  ],
};

export function getDistrictHotspots(districtCode: string): DistrictMapHotspot[] {
  return DISTRICT_HOTSPOTS[districtCode] ?? [];
}

/** Prefer district-stored hotspots; fall back to built-in code defaults. */
export function resolveDistrictHotspots(
  districtCode: string,
  hotspots?: DistrictMapHotspot[] | null,
): DistrictMapHotspot[] {
  if (hotspots && hotspots.length > 0) return hotspots;
  return getDistrictHotspots(districtCode);
}

/** Haversine distance in meters */
export function distanceMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const R = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export function findNearestHotspot(
  districtCode: string,
  latitude: number,
  longitude: number,
  radiusMeters = HOTSPOT_SNAP_METERS,
  hotspotsOverride?: DistrictMapHotspot[] | null,
): DistrictMapHotspot | null {
  const hotspots = resolveDistrictHotspots(districtCode, hotspotsOverride);
  let nearest: DistrictMapHotspot | null = null;
  let best = Number.POSITIVE_INFINITY;

  for (const hotspot of hotspots) {
    const distance = distanceMeters(
      latitude,
      longitude,
      hotspot.latitude,
      hotspot.longitude,
    );
    if (distance <= radiusMeters && distance < best) {
      best = distance;
      nearest = hotspot;
    }
  }

  return nearest;
}
