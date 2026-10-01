import { Schema, models, model, type Model, type Types } from "mongoose";
import type { DistrictHotspot, DistrictMapView } from "@/lib/maps/types";

export const ENTITY_STATUSES = ["ACTIVE", "INACTIVE"] as const;
export type EntityStatus = (typeof ENTITY_STATUSES)[number];

export interface DistrictDocument {
  _id: Types.ObjectId;
  name: string;
  code: string;
  mapImage: string;
  mapWidth: number;
  mapHeight: number;
  mapView: DistrictMapView | null;
  hotspots: DistrictHotspot[];
  status: EntityStatus;
  createdAt: Date;
  updatedAt: Date;
}

const HotspotSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    pointType: { type: String, enum: ["RED", "BLUE"], required: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    address: { type: String, trim: true },
    description: { type: String, trim: true },
    categoryName: { type: String, required: true, trim: true },
  },
  { _id: false },
);

const MapViewSchema = new Schema(
  {
    centerLat: { type: Number, required: true },
    centerLng: { type: Number, required: true },
    zoom: { type: Number, required: true },
    bounds: { type: [[Number]], required: true },
    minZoom: { type: Number, required: true },
    maxZoom: { type: Number, required: true },
  },
  { _id: false },
);

const DistrictSchema = new Schema<DistrictDocument>(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    mapImage: { type: String, required: false, trim: true, default: "" },
    mapWidth: { type: Number, required: false, min: 1, default: 1 },
    mapHeight: { type: Number, required: false, min: 1, default: 1 },
    mapView: { type: MapViewSchema, default: null },
    hotspots: { type: [HotspotSchema], default: [] },
    status: {
      type: String,
      enum: ENTITY_STATUSES,
      default: "ACTIVE",
    },
  },
  { timestamps: true },
);

DistrictSchema.index({ status: 1 });
DistrictSchema.index({ name: 1 });

export const District: Model<DistrictDocument> =
  (models.District as Model<DistrictDocument>) ||
  model<DistrictDocument>("District", DistrictSchema);
