import { describe, expect, it } from "vitest";
import { findNearestHotspot, getDistrictHotspots } from "@/lib/maps/hotspots";

describe("district hotspots", () => {
  it("loads ASR red and blue points", () => {
    const hotspots = getDistrictHotspots("ASR");
    expect(hotspots.some((item) => item.pointType === "BLUE")).toBe(true);
    expect(hotspots.some((item) => item.pointType === "RED")).toBe(true);
    expect(hotspots.find((item) => item.name === "Borra Caves")).toBeTruthy();
  });

  it("snaps clicks near a geographic point", () => {
    const nearest = findNearestHotspot("ASR", 18.2806, 83.0389);
    expect(nearest?.name).toBe("Borra Caves");
    expect(nearest?.pointType).toBe("BLUE");
  });

  it("returns empty hotspots for districts without map calibration yet", () => {
    expect(getDistrictHotspots("AKP")).toEqual([]);
  });
});
