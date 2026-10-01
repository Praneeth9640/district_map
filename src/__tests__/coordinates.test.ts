import { describe, expect, it } from "vitest";
import {
  clampPixel,
  latLngToPixel,
  mapPixelToCoordinates,
  pixelToLatLng,
  UNCALIBRATED_MESSAGE,
} from "@/lib/coordinates/coordinateMapper";
import {
  locationCreateSchema,
  districtCreateSchema,
} from "@/lib/validations";

describe("coordinateMapper", () => {
  it("does not invent geographic coordinates without calibration", () => {
    const result = mapPixelToCoordinates({ pixelX: 530, pixelY: 284 });
    expect(result.pixelX).toBe(530);
    expect(result.pixelY).toBe(284);
    expect(result.latitude).toBeNull();
    expect(result.longitude).toBeNull();
    expect(result.calibrated).toBe(false);
    expect(result.message).toBe(UNCALIBRATED_MESSAGE);
  });

  it("maps pixels to lat/lng when geographic bounds are configured", () => {
    const calibration = {
      imageWidth: 1000,
      imageHeight: 500,
      geographicBounds: {
        north: 19,
        south: 17,
        east: 84,
        west: 82,
      },
    };

    const geo = pixelToLatLng({ pixelX: 500, pixelY: 250 }, calibration);
    expect(geo).not.toBeNull();
    expect(geo?.latitude).toBeCloseTo(18);
    expect(geo?.longitude).toBeCloseTo(83);

    const pixel = latLngToPixel({ latitude: 18, longitude: 83 }, calibration);
    expect(pixel?.pixelX).toBeCloseTo(500);
    expect(pixel?.pixelY).toBeCloseTo(250);
  });

  it("clamps pixel coordinates within image bounds", () => {
    expect(clampPixel({ pixelX: -10, pixelY: 900 }, 1006, 768)).toEqual({
      pixelX: 0,
      pixelY: 768,
    });
  });
});

describe("validation", () => {
  it("requires location name and pixel coordinates", () => {
    const result = locationCreateSchema.safeParse({
      districtId: "507f1f77bcf86cd799439011",
      categoryId: "507f1f77bcf86cd799439012",
      name: "",
      pixelX: 10,
      pixelY: 20,
    });
    expect(result.success).toBe(false);
  });

  it("accepts nullable geographic coordinates", () => {
    const result = locationCreateSchema.safeParse({
      districtId: "507f1f77bcf86cd799439011",
      categoryId: "507f1f77bcf86cd799439012",
      name: "Borra Caves",
      pixelX: 720,
      pixelY: 410,
      latitude: null,
      longitude: null,
      pointType: "BLUE",
      status: "ACTIVE",
    });
    expect(result.success).toBe(true);
  });

  it("validates latitude range", () => {
    const result = locationCreateSchema.safeParse({
      districtId: "507f1f77bcf86cd799439011",
      categoryId: "507f1f77bcf86cd799439012",
      name: "Invalid",
      pixelX: 1,
      pixelY: 1,
      latitude: 120,
      longitude: 83,
    });
    expect(result.success).toBe(false);
  });

  it("requires valid IDs for relations", () => {
    const result = locationCreateSchema.safeParse({
      districtId: "d1",
      categoryId: "c1",
      name: "Test",
      pixelX: 10,
      pixelY: 20,
    });
    expect(result.success).toBe(false);
  });

  it("validates district create payload", () => {
    const result = districtCreateSchema.safeParse({
      name: "Alluri Sitharama Raju",
      code: "ASR",
      mapImage: "/maps/unused.png",
      mapWidth: 1006,
      mapHeight: 768,
    });
    expect(result.success).toBe(true);
  });
});
