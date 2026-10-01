import { getDataProvider } from "@/lib/data/types";
import { resetLocalDb } from "@/lib/data/local-db";
import { resetMongoDatabase } from "@/lib/data/mongo-repository";
import { APP_DISTRICTS, DISTRICT_VIEWS } from "@/lib/maps/districtViews";
import { getDistrictHotspots } from "@/lib/maps/hotspots";
import { readFileSync } from "fs";
import { resolve } from "path";

function loadEnvFile() {
  try {
    const raw = readFileSync(resolve(process.cwd(), ".env"), "utf8");
    for (const line of raw.split("\n")) {
      const match = line.match(/^([^#=]+)=(.*)$/);
      if (!match) continue;
      const key = match[1].trim();
      const value = match[2].trim().replace(/^["']|["']$/g, "");
      if (!process.env[key]) process.env[key] = value;
    }
  } catch {
    // ignore
  }
}

loadEnvFile();

async function seed() {
  const provider = getDataProvider();

  if (provider === "mongodb") {
    if (!process.env.MONGODB_URI) {
      console.error("Missing MONGODB_URI in .env");
      process.exit(1);
    }

    const counts = await resetMongoDatabase({
      categories: [
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
        name,
        description: `${name} locations`,
        status: "ACTIVE" as const,
      })),
      districts: APP_DISTRICTS.map((def) => ({
        name: def.name,
        code: def.code,
        status: "ACTIVE" as const,
        mapView: DISTRICT_VIEWS[def.code] ?? null,
        hotspots: getDistrictHotspots(def.code),
      })),
    });

    console.log("MongoDB Atlas seeded:");
    console.log(`  districts: ${counts.districts}`);
    console.log(`  categories: ${counts.categories}`);
    console.log(`  locations: ${counts.locations}`);
    console.log("  users: create your own on /login (first visit) or run npm run db:seed-admin");
    process.exit(0);
  }

  const db = await resetLocalDb();
  console.log("Local data seeded:");
  console.log(`  districts: ${db.districts.length}`);
  console.log(`  categories: ${db.categories.length}`);
  console.log(`  locations: ${db.locations.length}`);
  console.log("File: data/db.json");
  process.exit(0);
}

seed().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
