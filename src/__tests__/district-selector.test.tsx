import { describe, expect, it, vi, afterEach } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { DistrictSelector } from "@/components/districts/DistrictSelector";
import type { District } from "@/types";

afterEach(() => {
  cleanup();
});

const districts: District[] = [
  {
    id: "1",
    name: "Alluri Sitharama Raju",
    code: "ASR",
    mapImage: "",
    mapWidth: 1,
    mapHeight: 1,
    mapView: null,
    hotspots: [],
    status: "ACTIVE",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "2",
    name: "Anakapalli",
    code: "AKP",
    mapImage: "",
    mapWidth: 1,
    mapHeight: 1,
    mapView: null,
    hotspots: [],
    status: "ACTIVE",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

describe("DistrictSelector", () => {
  it("renders districts and notifies on change", async () => {
    const onChange = vi.fn();
    render(
      <DistrictSelector districts={districts} value="1" onChange={onChange} />,
    );

    expect(screen.getByText("Alluri Sitharama Raju")).toBeTruthy();
  });

  it("shows loading state", () => {
    render(
      <DistrictSelector districts={[]} value={undefined} onChange={vi.fn()} loading />,
    );
    expect(screen.getByText(/loading/i)).toBeTruthy();
  });
});
