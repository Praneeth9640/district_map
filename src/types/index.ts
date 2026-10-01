import type { DistrictHotspot, DistrictMapView } from "@/lib/maps/types";

export type EntityStatus = "ACTIVE" | "INACTIVE";
export type PointType = "RED" | "BLUE" | "CUSTOM";

export type { DistrictHotspot, DistrictMapView };

export interface District {
  id: string;
  name: string;
  code: string;
  mapImage: string;
  mapWidth: number;
  mapHeight: number;
  mapView: DistrictMapView | null;
  hotspots: DistrictHotspot[];
  status: EntityStatus;
  createdAt: string;
  updatedAt: string;
  _count?: {
    locations: number;
  };
}

export interface Category {
  id: string;
  name: string;
  description: string | null;
  status: EntityStatus;
  createdAt: string;
  updatedAt: string;
  _count?: {
    locations: number;
  };
}

export interface Location {
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
  status: EntityStatus;
  createdAt: string;
  updatedAt: string;
  district?: Pick<District, "id" | "name" | "code">;
  category?: Pick<Category, "id" | "name">;
}

export interface DashboardStats {
  totalDistricts: number;
  totalLocations: number;
  activeLocations: number;
  totalCategories: number;
}

export interface MapMarkerData {
  id?: string;
  pixelX: number;
  pixelY: number;
  name?: string;
  categoryName?: string;
  latitude?: number | null;
  longitude?: number | null;
  address?: string | null;
  description?: string | null;
  pointType?: PointType;
  status?: EntityStatus;
  temporary?: boolean;
}
