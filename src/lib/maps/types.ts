/**
 * Shared Leaflet district map config shapes.
 * @see https://leafletjs.com/
 */

export interface DistrictMapView {
  centerLat: number;
  centerLng: number;
  zoom: number;
  /** Southwest [lat, lng] and Northeast [lat, lng] */
  bounds: [[number, number], [number, number]];
  minZoom: number;
  maxZoom: number;
}

export type DistrictHotspotPointType = "RED" | "BLUE";

export interface DistrictHotspot {
  name: string;
  pointType: DistrictHotspotPointType;
  latitude: number;
  longitude: number;
  address?: string;
  description?: string;
  categoryName: string;
}
