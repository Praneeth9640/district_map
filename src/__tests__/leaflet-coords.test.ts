import { describe, expect, it } from "vitest";

/**
 * Leaflet CRS.Simple conversion used by DistrictMap:
 * lat = mapHeight - pixelY
 * lng = pixelX
 */
function pixelToLatLng(pixelX: number, pixelY: number, mapHeight: number) {
  return { lat: mapHeight - pixelY, lng: pixelX };
}

function latLngToPixel(lat: number, lng: number, mapHeight: number) {
  return {
    pixelX: Number(lng.toFixed(2)),
    pixelY: Number((mapHeight - lat).toFixed(2)),
  };
}

describe("Leaflet image coordinate conversion", () => {
  it("round-trips image pixels through CRS.Simple latlng", () => {
    const mapHeight = 768;
    const original = { pixelX: 720, pixelY: 410 };
    const latlng = pixelToLatLng(original.pixelX, original.pixelY, mapHeight);
    const back = latLngToPixel(latlng.lat, latlng.lng, mapHeight);
    expect(back).toEqual(original);
  });

  it("places top-left image origin at lat=height, lng=0", () => {
    expect(pixelToLatLng(0, 0, 768)).toEqual({ lat: 768, lng: 0 });
  });
});
