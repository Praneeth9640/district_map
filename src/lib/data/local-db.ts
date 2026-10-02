import { promises as fs } from "fs";
import path from "path";
import {
  createId,
  nowIso,
  type LocalDatabase,
  type StoredCategory,
  type StoredDistrict,
  type StoredLocation,
} from "@/lib/data/types";
import { APP_DISTRICTS, DISTRICT_VIEWS } from "@/lib/maps/districtViews";
import { getDistrictHotspots } from "@/lib/maps/hotspots";

const DB_PATH = path.join(process.cwd(), "data", "db.json");

let writeQueue: Promise<void> = Promise.resolve();

function buildSeedDatabase(): LocalDatabase {
  const stamp = nowIso();

  const categories: StoredCategory[] = [
    "Tourism",
    "Waterfall",
    "Cave",
    "View Point",
    "Temple",
    "Village",
    "Hospital",
    "School",
    "Government Office",
    "Mandal Headquarter",
    "Police Station",
    "Other",
  ].map((name) => ({
    id: createId(),
    name,
    description: `${name} locations`,
    status: "ACTIVE",
    createdAt: stamp,
    updatedAt: stamp,
  }));

  const categoryByName = new Map(categories.map((item) => [item.name, item]));

  // Fixed district set for this app.
  const districts: StoredDistrict[] = APP_DISTRICTS.map((def) => ({
    id: createId(),
    name: def.name,
    code: def.code,
    mapImage: "",
    mapWidth: 1,
    mapHeight: 1,
    mapView: DISTRICT_VIEWS[def.code] ?? null,
    hotspots: getDistrictHotspots(def.code),
    status: "ACTIVE",
    createdAt: stamp,
    updatedAt: stamp,
  }));

  const asr = districts.find((district) => district.code === "ASR")!;
  const locations: StoredLocation[] = getDistrictHotspots("ASR").map((hotspot) => {
    const category = categoryByName.get(hotspot.categoryName) ?? categoryByName.get("Other")!;
    return {
      id: createId(),
      districtId: asr.id,
      categoryId: category.id,
      name: hotspot.name,
      pixelX: 0,
      pixelY: 0,
      latitude: hotspot.latitude,
      longitude: hotspot.longitude,
      address: hotspot.address ?? null,
      description: hotspot.description ?? null,
      pointType: hotspot.pointType,
      markerColor: null,
      status: "ACTIVE",
      createdAt: stamp,
      updatedAt: stamp,
    };
  });

  return { districts, categories, locations };
}

async function ensureDatabaseFile(): Promise<void> {
  try {
    await fs.access(DB_PATH);
  } catch {
    await fs.mkdir(path.dirname(DB_PATH), { recursive: true });
    await fs.writeFile(DB_PATH, JSON.stringify(buildSeedDatabase(), null, 2), "utf8");
  }
}

export async function readLocalDb(): Promise<LocalDatabase> {
  await ensureDatabaseFile();
  const raw = await fs.readFile(DB_PATH, "utf8");
  const db = JSON.parse(raw) as LocalDatabase;
  let dirty = false;
  db.districts = db.districts.map((district) => {
    const next = {
      ...district,
      mapView: district.mapView ?? DISTRICT_VIEWS[district.code] ?? null,
      hotspots: district.hotspots ?? getDistrictHotspots(district.code),
    };
    if (district.mapView == null && next.mapView != null) dirty = true;
    if (!district.hotspots && next.hotspots.length > 0) dirty = true;
    return next;
  });
  if (dirty) await writeLocalDb(db);
  return db;
}

export async function writeLocalDb(db: LocalDatabase): Promise<void> {
  writeQueue = writeQueue.then(async () => {
    await fs.mkdir(path.dirname(DB_PATH), { recursive: true });
    await fs.writeFile(DB_PATH, JSON.stringify(db, null, 2), "utf8");
  });
  await writeQueue;
}

export async function resetLocalDb(): Promise<LocalDatabase> {
  const seeded = buildSeedDatabase();
  await writeLocalDb(seeded);
  return seeded;
}
