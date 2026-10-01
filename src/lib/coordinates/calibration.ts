/**
 * Future calibration plug-in surface.
 *
 * When you provide ground-control reference points, implement a transform here
 * (e.g. affine from ≥3 points, or thin-plate spline) and wire it into
 * MapCalibration.referencePoints + coordinateMapper.
 *
 * This module intentionally does NOT invent coordinates.
 */

import type { LatLng, MapCalibration, PixelCoordinate } from "./types";

export interface CalibrationAlgorithm {
  name: string;
  isReady(calibration: MapCalibration): boolean;
  pixelToLatLng(pixel: PixelCoordinate, calibration: MapCalibration): LatLng | null;
  latLngToPixel(latLng: LatLng, calibration: MapCalibration): PixelCoordinate | null;
}

/**
 * Placeholder algorithm registry for future plug-in calibration.
 * Currently unused by the mapper until real reference points are provided.
 */
export const calibrationAlgorithms: CalibrationAlgorithm[] = [];

export function getReadyAlgorithm(
  calibration: MapCalibration,
): CalibrationAlgorithm | null {
  return (
    calibrationAlgorithms.find((algorithm) => algorithm.isReady(calibration)) ??
    null
  );
}
