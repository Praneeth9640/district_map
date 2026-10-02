import type { Types } from "mongoose";
import { toId } from "@/lib/mongo";
import type { EntityStatus } from "@/models/District";
import type { DistrictHotspot, DistrictMapView } from "@/lib/maps/types";

type LeanDistrict = {
  _id: Types.ObjectId;
  name: string;
  code: string;
  mapImage: string;
  mapWidth: number;
  mapHeight: number;
  mapView?: DistrictMapView | null;
  hotspots?: DistrictHotspot[];
  status: EntityStatus;
  createdAt: Date;
  updatedAt: Date;
};

type LeanCategory = {
  _id: Types.ObjectId;
  name: string;
  description?: string | null;
  status: EntityStatus;
  createdAt: Date;
  updatedAt: Date;
};

type LeanLocation = {
  _id: Types.ObjectId;
  districtId: Types.ObjectId | LeanDistrict;
  categoryId: Types.ObjectId | LeanCategory;
  name: string;
  pixelX: number;
  pixelY: number;
  latitude?: number | null;
  longitude?: number | null;
  address?: string | null;
  description?: string | null;
  pointType?: "RED" | "BLUE" | "CUSTOM";
  markerColor?: string | null;
  status: EntityStatus;
  createdAt: Date;
  updatedAt: Date;
};

function isPopulatedDistrict(
  value: Types.ObjectId | LeanDistrict,
): value is LeanDistrict {
  return typeof value === "object" && value !== null && "name" in value;
}

function isPopulatedCategory(
  value: Types.ObjectId | LeanCategory,
): value is LeanCategory {
  return typeof value === "object" && value !== null && "name" in value;
}

export function serializeDistrict(
  district: LeanDistrict,
  locationCount?: number,
) {
  return {
    id: toId(district._id),
    name: district.name,
    code: district.code,
    mapImage: district.mapImage,
    mapWidth: district.mapWidth,
    mapHeight: district.mapHeight,
    mapView: district.mapView ?? null,
    hotspots: district.hotspots ?? [],
    status: district.status,
    createdAt: new Date(district.createdAt).toISOString(),
    updatedAt: new Date(district.updatedAt).toISOString(),
    ...(locationCount === undefined
      ? {}
      : { _count: { locations: locationCount } }),
  };
}

export function serializeCategory(
  category: LeanCategory,
  locationCount?: number,
) {
  return {
    id: toId(category._id),
    name: category.name,
    description: category.description ?? null,
    status: category.status,
    createdAt: new Date(category.createdAt).toISOString(),
    updatedAt: new Date(category.updatedAt).toISOString(),
    ...(locationCount === undefined
      ? {}
      : { _count: { locations: locationCount } }),
  };
}

export function serializeLocation(location: LeanLocation) {
  const district = isPopulatedDistrict(location.districtId)
    ? {
        id: toId(location.districtId._id),
        name: location.districtId.name,
        code: location.districtId.code,
      }
    : undefined;

  const category = isPopulatedCategory(location.categoryId)
    ? {
        id: toId(location.categoryId._id),
        name: location.categoryId.name,
      }
    : undefined;

  return {
    id: toId(location._id),
    districtId: isPopulatedDistrict(location.districtId)
      ? toId(location.districtId._id)
      : toId(location.districtId),
    categoryId: isPopulatedCategory(location.categoryId)
      ? toId(location.categoryId._id)
      : toId(location.categoryId),
    name: location.name,
    pixelX: location.pixelX,
    pixelY: location.pixelY,
    latitude: location.latitude ?? null,
    longitude: location.longitude ?? null,
    address: location.address ?? null,
    description: location.description ?? null,
    pointType: location.pointType ?? "CUSTOM",
    markerColor: location.markerColor ?? null,
    status: location.status,
    createdAt: new Date(location.createdAt).toISOString(),
    updatedAt: new Date(location.updatedAt).toISOString(),
    ...(district ? { district } : {}),
    ...(category ? { category } : {}),
  };
}
