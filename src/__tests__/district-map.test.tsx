import { describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import { DistrictMap } from "@/components/map/DistrictMap";

describe("DistrictMap (iframe wrapper)", () => {
  it("embeds the district map in an iframe", () => {
    const { container } = render(
      <DistrictMap
        districtCode="ASR"
        districtName="Alluri Sitharama Raju"
        markers={[]}
        onMapClick={vi.fn()}
        onMarkerSelect={vi.fn()}
        onMarkerDrag={vi.fn()}
      />,
    );

    const iframe = container.querySelector("iframe");
    expect(iframe).toBeTruthy();
    expect(iframe?.getAttribute("src")).toBe("/embed/map");
    expect(iframe?.getAttribute("title")).toContain("Alluri Sitharama Raju");
  });
});
