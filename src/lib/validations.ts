import { z } from "zod";

export const entityStatusSchema = z.enum(["ACTIVE", "INACTIVE"]);
export const pointTypeSchema = z.enum(["RED", "BLUE", "CUSTOM"]);

const objectIdSchema = z
  .string()
  .trim()
  .min(1, "ID is required")
  .regex(/^[a-zA-Z0-9_-]{8,64}$/, "Invalid ID format");

export const districtMapViewSchema = z.object({
  centerLat: z.number().min(-90).max(90),
  centerLng: z.number().min(-180).max(180),
  zoom: z.number().int().min(1).max(22),
  bounds: z.tuple([
    z.tuple([z.number(), z.number()]),
    z.tuple([z.number(), z.number()]),
  ]),
  minZoom: z.number().int().min(1).max(22),
  maxZoom: z.number().int().min(1).max(22),
});

export const districtHotspotSchema = z.object({
  name: z.string().trim().min(1).max(160),
  pointType: z.enum(["RED", "BLUE"]),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  address: z.string().trim().max(300).optional(),
  description: z.string().trim().max(2000).optional(),
  categoryName: z.string().trim().min(1).max(80),
});

export const districtCreateSchema = z.object({
  name: z.string().trim().min(1, "District name is required").max(120),
  code: z
    .string()
    .trim()
    .min(1, "District code is required")
    .max(20)
    .regex(/^[A-Za-z0-9_-]+$/, "Code may only contain letters, numbers, _ and -"),
  mapImage: z.string().trim().optional().default(""),
  mapWidth: z.number().int().positive().optional().default(1),
  mapHeight: z.number().int().positive().optional().default(1),
  mapView: districtMapViewSchema.nullable().optional(),
  hotspots: z.array(districtHotspotSchema).optional().default([]),
  status: entityStatusSchema.default("ACTIVE"),
});

export const districtUpdateSchema = districtCreateSchema.partial();

export const categoryCreateSchema = z.object({
  name: z.string().trim().min(1, "Category name is required").max(80),
  description: z.string().trim().max(500).optional().nullable(),
  status: entityStatusSchema.default("ACTIVE"),
});

export const categoryUpdateSchema = categoryCreateSchema.partial();

export const locationCreateSchema = z.object({
  districtId: objectIdSchema,
  categoryId: objectIdSchema,
  name: z.string().trim().min(1, "Location name is required").max(160),
  pixelX: z.number().finite("Pixel X must be a valid number"),
  pixelY: z.number().finite("Pixel Y must be a valid number"),
  latitude: z
    .number()
    .min(-90, "Latitude must be between -90 and 90")
    .max(90, "Latitude must be between -90 and 90")
    .nullable()
    .optional(),
  longitude: z
    .number()
    .min(-180, "Longitude must be between -180 and 180")
    .max(180, "Longitude must be between -180 and 180")
    .nullable()
    .optional(),
  address: z.string().trim().max(300).optional().nullable(),
  description: z.string().trim().max(2000).optional().nullable(),
  pointType: pointTypeSchema.default("CUSTOM"),
  markerColor: z
    .string()
    .trim()
    .regex(/^#([0-9a-fA-F]{6})$/, "Colour must be a hex value like #22c55e")
    .optional()
    .nullable(),
  status: entityStatusSchema.default("ACTIVE"),
});

export const locationUpdateSchema = locationCreateSchema.partial();

export type DistrictCreateInput = z.infer<typeof districtCreateSchema>;
export type DistrictUpdateInput = z.infer<typeof districtUpdateSchema>;
export type CategoryCreateInput = z.infer<typeof categoryCreateSchema>;
export type CategoryUpdateInput = z.infer<typeof categoryUpdateSchema>;
export type LocationCreateInput = z.infer<typeof locationCreateSchema>;
export type LocationUpdateInput = z.infer<typeof locationUpdateSchema>;
