/**
 * Pixel coordinates relative to the original map image dimensions.
 * These are the authoritative coordinates for image-based maps.
 */
export interface PixelCoordinate {
  pixelX: number;
  pixelY: number;
}

/**
 * Geographic coordinates (WGS84).
 * Only available when a district map has been calibrated.
 */
export interface LatLng {
  latitude: number;
  longitude: number;
}

export interface GeographicBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

/**
 * Calibration configuration for a district map image.
 * When null/undefined, geographic conversion is unavailable.
 */
export interface MapCalibration {
  imageWidth: number;
  imageHeight: number;
  /**
   * Simple affine bounds mapping.
   * Replace with multi-point calibration when reference points are provided.
   */
  geographicBounds?: GeographicBounds;
  /**
   * Future: ground control points for affine/polynomial transforms.
   */
  referencePoints?: Array<PixelCoordinate & LatLng>;
}

export interface CoordinateMappingResult {
  pixelX: number;
  pixelY: number;
  latitude: number | null;
  longitude: number | null;
  calibrated: boolean;
  message?: string;
}
