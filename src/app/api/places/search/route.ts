import { NextResponse } from "next/server";
import { getDataProvider } from "@/lib/data/types";
import { readLocalDb } from "@/lib/data/local-db";
import { getDistrictByCode } from "@/lib/data/mongo-repository";
import { searchPlaces } from "@/lib/maps/placeSearch";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";
  const districtCode = searchParams.get("districtCode")?.trim() ?? "";

  if (!q) {
    return NextResponse.json([]);
  }
  if (!districtCode) {
    return NextResponse.json({ error: "districtCode is required" }, { status: 400 });
  }

  try {
    let mapView = null;
    let hotspots = null;

    if (getDataProvider() === "mongodb") {
      const district = await getDistrictByCode(districtCode);
      mapView = district?.mapView ?? null;
      hotspots = district?.hotspots ?? null;
    } else {
      const db = await readLocalDb();
      const district = db.districts.find((item) => item.code === districtCode);
      mapView = district?.mapView ?? null;
      hotspots = district?.hotspots ?? null;
    }

    const results = await searchPlaces(districtCode, q, { mapView, hotspots });
    return NextResponse.json(results);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Place search failed" },
      { status: 502 },
    );
  }
}
