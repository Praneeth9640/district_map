import type {
  CoordinateMappingResult,
  GeographicBounds,
  LatLng,
  MapCalibration,
  PixelCoordinate,
} from "./types";

const UNCALIBRATED_MESSAGE =
  "Geographic coordinates are not calibrated for this map.";

function hasValidBounds(bounds?: GeographicBounds): bounds is GeographicBounds {
  if (!bounds) return false;
  return (
    bounds.north > bounds.south &&
    bounds.east > bounds.west &&
    bounds.north <= 90 &&
    bounds.south >= -90 &&
    bounds.east <= 180 &&
    bounds.west >= -180
  );
}

/**
 * Convert image pixel coordinates to geographic coordinates.
 *
 * Returns null lat/lng when calibration is not configured.
 * Does NOT invent geographic values from raw pixels.
 */
export function pixelToLatLng(
  pixel: PixelCoordinate,
  calibration?: MapCalibration | null,
): LatLng | null {
  if (!calibration || !hasValidBounds(calibration.geographicBounds)) {
    return null;
  }

  const { imageWidth, imageHeight, geographicBounds } = calibration;
  if (imageWidth <= 0 || imageHeight <= 0) {
    return null;
  }

  const xRatio = pixel.pixelX / imageWidth;
  const yRatio = pixel.pixelY / imageHeight;

  const longitude =
    geographicBounds.west +
    xRatio * (geographicBounds.east - geographicBounds.west);
  const latitude =
    geographicBounds.north -
    yRatio * (geographicBounds.north - geographicBounds.south);

  return { latitude, longitude };
}

/**
 * Convert geographic coordinates back to image pixel coordinates.
 * Returns null when calibration is not configured.
 */
export function latLngToPixel(
  latLng: LatLng,
  calibration?: MapCalibration | null,
): PixelCoordinate | null {
  if (!calibration || !hasValidBounds(calibration.geographicBounds)) {
    return null;
  }

  const { imageWidth, imageHeight, geographicBounds } = calibration;
  if (imageWidth <= 0 || imageHeight <= 0) {
    return null;
  }

  const xRatio =
    (latLng.longitude - geographicBounds.west) /
    (geographicBounds.east - geographicBounds.west);
  const yRatio =
    (geographicBounds.north - latLng.latitude) /
    (geographicBounds.north - geographicBounds.south);

  return {
    pixelX: xRatio * imageWidth,
    pixelY: yRatio * imageHeight,
  };
}

/**
 * Build a mapping result for form display / persistence.
 * Pixel coordinates are always present; geographic values only when calibrated.
 */
export function mapPixelToCoordinates(
  pixel: PixelCoordinate,
  calibration?: MapCalibration | null,
): CoordinateMappingResult {
  const geo = pixelToLatLng(pixel, calibration);

  if (!geo) {
    return {
      pixelX: pixel.pixelX,
      pixelY: pixel.pixelY,
      latitude: null,
      longitude: null,
      calibrated: false,
      message: UNCALIBRATED_MESSAGE,
    };
  }

  return {
    pixelX: pixel.pixelX,
    pixelY: pixel.pixelY,
    latitude: geo.latitude,
    longitude: geo.longitude,
    calibrated: true,
  };
}

/**
 * Clamp a pixel coordinate within image bounds.
 */
export function clampPixel(
  pixel: PixelCoordinate,
  imageWidth: number,
  imageHeight: number,
): PixelCoordinate {
  return {
    pixelX: Math.min(Math.max(pixel.pixelX, 0), imageWidth),
    pixelY: Math.min(Math.max(pixel.pixelY, 0), imageHeight),
  };
}

export { UNCALIBRATED_MESSAGE };
