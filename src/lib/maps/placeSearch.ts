import { resolveDistrictView } from "@/lib/maps/districtViews";
import {
  resolveDistrictHotspots,
  type DistrictMapHotspot,
} from "@/lib/maps/hotspots";
import type { DistrictHotspot, DistrictMapView } from "@/lib/maps/types";

export interface PlaceSearchResult {
  name: string;
  latitude: number;
  longitude: number;
  source: "hotspot" | "geocode" | "location";
  displayName?: string;
  pointType?: "RED" | "BLUE";
}

function matchesQuery(text: string, query: string) {
  return text.toLowerCase().includes(query.toLowerCase());
}

export function searchHotspots(
  districtCode: string,
  query: string,
  hotspotsOverride?: DistrictHotspot[] | null,
): PlaceSearchResult[] {
  const q = query.trim();
  if (!q) return [];

  return resolveDistrictHotspots(districtCode, hotspotsOverride)
    .filter(
      (item) =>
        matchesQuery(item.name, q) ||
        (item.address ? matchesQuery(item.address, q) : false) ||
        (item.description ? matchesQuery(item.description, q) : false),
    )
    .map((item: DistrictMapHotspot) => ({
      name: item.name,
      latitude: item.latitude,
      longitude: item.longitude,
      source: "hotspot" as const,
      displayName: item.address ?? item.name,
      pointType: item.pointType,
    }));
}

/** Degrees to expand Nominatim viewbox so towns on the district edge still match. */
const SEARCH_BOUNDS_PAD = 0.25;

function distanceToBounds(
  lat: number,
  lng: number,
  south: number,
  west: number,
  north: number,
  east: number,
) {
  const clampedLat = Math.min(Math.max(lat, south), north);
  const clampedLng = Math.min(Math.max(lng, west), east);
  return Math.hypot(lat - clampedLat, lng - clampedLng);
}

/**
 * Search OpenStreetMap Nominatim near the district view bounds.
 * Case-insensitive; pads the viewbox so edge towns (e.g. Rampachodavaram) are included.
 * @see https://nominatim.org/release-docs/develop/api/Search/
 */
export async function searchGeocodeInDistrict(
  districtCode: string,
  query: string,
  mapView?: DistrictMapView | null,
): Promise<PlaceSearchResult[]> {
  const q = query.trim();
  if (!q) return [];

  const view = resolveDistrictView(districtCode, mapView);
  if (!view) return [];

  const [[south, west], [north, east]] = view.bounds;
  const paddedSouth = south - SEARCH_BOUNDS_PAD;
  const paddedWest = west - SEARCH_BOUNDS_PAD;
  const paddedNorth = north + SEARCH_BOUNDS_PAD;
  const paddedEast = east + SEARCH_BOUNDS_PAD;
  const viewbox = `${paddedWest},${paddedNorth},${paddedEast},${paddedSouth}`;

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", q);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "8");
  url.searchParams.set("viewbox", viewbox);
  url.searchParams.set("bounded", "1");
  url.searchParams.set("addressdetails", "0");

  const response = await fetch(url.toString(), {
    headers: {
      Accept: "application/json",
      "User-Agent": "DistrictLocationMapper/1.0 (local-dev)",
    },
    next: { revalidate: 0 },
  });

  if (!response.ok) {
    throw new Error("Place search failed. Try again.");
  }

  const rows = (await response.json()) as Array<{
    lat: string;
    lon: string;
    name?: string;
    display_name: string;
  }>;

  const ranked = rows.map((row) => {
    const latitude = Number(row.lat);
    const longitude = Number(row.lon);
    const name = row.name || row.display_name.split(",")[0] || q;
    return {
      result: {
        name,
        latitude,
        longitude,
        source: "geocode" as const,
        displayName: row.display_name,
      } satisfies PlaceSearchResult,
      nameMatch:
        matchesQuery(name, q) || matchesQuery(row.display_name, q),
      dist: distanceToBounds(latitude, longitude, south, west, north, east),
    };
  });

  ranked.sort((a, b) => {
    if (a.nameMatch !== b.nameMatch) return a.nameMatch ? -1 : 1;
    return a.dist - b.dist;
  });

  return ranked.map((item) => item.result);
}

export async function searchPlaces(
  districtCode: string,
  query: string,
  options?: {
    mapView?: DistrictMapView | null;
    hotspots?: DistrictHotspot[] | null;
  },
): Promise<PlaceSearchResult[]> {
  const hotspots = searchHotspots(districtCode, query, options?.hotspots);
  if (hotspots.length > 0) return hotspots;

  try {
    return await searchGeocodeInDistrict(districtCode, query, options?.mapView);
  } catch {
    return [];
  }
}
