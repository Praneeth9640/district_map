import mongoose, { Schema, model, type Model, type Types } from "mongoose";
import { ENTITY_STATUSES, type EntityStatus } from "@/models/District";

export const POINT_TYPES = ["RED", "BLUE", "CUSTOM"] as const;
export type PointType = (typeof POINT_TYPES)[number];

export interface LocationDocument {
  _id: Types.ObjectId;
  districtId: Types.ObjectId;
  categoryId: Types.ObjectId;
  name: string;
  pixelX: number;
  pixelY: number;
  latitude: number | null;
  longitude: number | null;
  address: string | null;
  description: string | null;
  /** RED = mandal HQ style, BLUE = tourism style, CUSTOM = user-chosen colour */
  pointType: PointType;
  /** Hex colour for CUSTOM pins */
  markerColor: string | null;
  status: EntityStatus;
  createdAt: Date;
  updatedAt: Date;
}

const LocationSchema = new Schema<LocationDocument>(
  {
    districtId: {
      type: Schema.Types.ObjectId,
      ref: "District",
      required: true,
      index: true,
    },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    pixelX: { type: Number, required: true },
    pixelY: { type: Number, required: true },
    latitude: { type: Number, default: null },
    longitude: { type: Number, default: null },
    address: { type: String, default: null, trim: true },
    description: { type: String, default: null, trim: true },
    pointType: {
      type: String,
      enum: POINT_TYPES,
      default: "CUSTOM",
      index: true,
    },
    markerColor: { type: String, default: null, trim: true },
    status: {
      type: String,
      enum: ENTITY_STATUSES,
      default: "ACTIVE",
    },
  },
  { timestamps: true },
);

LocationSchema.index({ status: 1 });
LocationSchema.index({ name: 1 });
LocationSchema.index({ districtId: 1, name: 1 });

// Next.js HMR can keep an old compiled model that strips new fields like markerColor.
if (mongoose.models.Location) {
  delete mongoose.models.Location;
}

export const Location: Model<LocationDocument> = model<LocationDocument>(
  "Location",
  LocationSchema,
);

export type { Types };
export { mongoose };
