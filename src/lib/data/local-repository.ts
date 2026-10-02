import { ApiError } from "@/lib/api-error";
import { readLocalDb, writeLocalDb } from "@/lib/data/local-db";
import {
  createId,
  nowIso,
  type StoredCategory,
  type StoredDistrict,
  type StoredLocation,
} from "@/lib/data/types";
import type {
  CategoryCreateInput,
  CategoryUpdateInput,
  DistrictCreateInput,
  DistrictUpdateInput,
  LocationCreateInput,
  LocationUpdateInput,
} from "@/lib/validations";

function withDistrictCount(district: StoredDistrict, locations: StoredLocation[]) {
  return {
    ...district,
    _count: {
      locations: locations.filter((item) => item.districtId === district.id).length,
    },
  };
}

function withCategoryCount(category: StoredCategory, locations: StoredLocation[]) {
  return {
    ...category,
    _count: {
      locations: locations.filter((item) => item.categoryId === category.id).length,
    },
  };
}

function withRelations(
  location: StoredLocation,
  districts: StoredDistrict[],
  categories: StoredCategory[],
) {
  const district = districts.find((item) => item.id === location.districtId);
  const category = categories.find((item) => item.id === location.categoryId);
  return {
    ...location,
    markerColor: location.markerColor ?? null,
    district: district
      ? { id: district.id, name: district.name, code: district.code }
      : undefined,
    category: category ? { id: category.id, name: category.name } : undefined,
  };
}

async function assertLocalProvider() {
  // Local JSON store only — MongoDB calls go through mongo-repository.
}

export async function listDistricts(status?: string | null) {
  await assertLocalProvider();
  const db = await readLocalDb();
  const districts = db.districts
    .filter((item) => !status || item.status === status)
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((item) => withDistrictCount(item, db.locations));
  return districts;
}

export async function getDistrictById(id: string) {
  await assertLocalProvider();
  const db = await readLocalDb();
  const district = db.districts.find((item) => item.id === id);
  if (!district) throw new ApiError(404, "District not found.");
  return withDistrictCount(district, db.locations);
}

export async function createDistrict(input: DistrictCreateInput) {
  await assertLocalProvider();
  const db = await readLocalDb();
  const code = input.code.toUpperCase();
  if (db.districts.some((item) => item.code === code)) {
    throw new ApiError(409, "A district with this code already exists.");
  }
  const stamp = nowIso();
  const district: StoredDistrict = {
    id: createId(),
    name: input.name,
    code,
    mapImage: input.mapImage ?? "",
    mapWidth: input.mapWidth ?? 1,
    mapHeight: input.mapHeight ?? 1,
    mapView: input.mapView ?? null,
    hotspots: input.hotspots ?? [],
    status: input.status,
    createdAt: stamp,
    updatedAt: stamp,
  };
  db.districts.push(district);

  // Seed red/blue points as locations so they appear on the map like ASR.
  if (district.hotspots.length > 0) {
    for (const hotspot of district.hotspots) {
      const category =
        db.categories.find((item) => item.name === hotspot.categoryName) ??
        db.categories.find((item) => item.name === "Other");
      if (!category) continue;
      db.locations.push({
        id: createId(),
        districtId: district.id,
        categoryId: category.id,
        name: hotspot.name,
        pixelX: 0,
        pixelY: 0,
        latitude: hotspot.latitude,
        longitude: hotspot.longitude,
        address: hotspot.address ?? null,
        description: hotspot.description ?? null,
        pointType: hotspot.pointType,
        status: "ACTIVE",
        createdAt: stamp,
        updatedAt: stamp,
      });
    }
  }

  await writeLocalDb(db);
  return withDistrictCount(district, db.locations);
}

export async function updateDistrict(id: string, input: DistrictUpdateInput) {
  await assertLocalProvider();
  const db = await readLocalDb();
  const index = db.districts.findIndex((item) => item.id === id);
  if (index < 0) throw new ApiError(404, "District not found.");

  if (input.code) {
    const code = input.code.toUpperCase();
    if (db.districts.some((item) => item.code === code && item.id !== id)) {
      throw new ApiError(409, "A district with this code already exists.");
    }
    input = { ...input, code };
  }

  const previous = db.districts[index];
  const stamp = nowIso();
  const updated: StoredDistrict = {
    ...previous,
    ...input,
    mapImage: input.mapImage ?? previous.mapImage,
    mapWidth: input.mapWidth ?? previous.mapWidth,
    mapHeight: input.mapHeight ?? previous.mapHeight,
    mapView: input.mapView !== undefined ? input.mapView : previous.mapView,
    hotspots: input.hotspots !== undefined ? input.hotspots : previous.hotspots,
    updatedAt: stamp,
  };
  db.districts[index] = updated;

  // Add any new hotspot names as locations (do not wipe existing saved pins).
  if (input.hotspots) {
    for (const hotspot of input.hotspots) {
      const exists = db.locations.some(
        (item) =>
          item.districtId === updated.id &&
          item.name.toLowerCase() === hotspot.name.toLowerCase(),
      );
      if (exists) continue;
      const category =
        db.categories.find((item) => item.name === hotspot.categoryName) ??
        db.categories.find((item) => item.name === "Other");
      if (!category) continue;
      db.locations.push({
        id: createId(),
        districtId: updated.id,
        categoryId: category.id,
        name: hotspot.name,
        pixelX: 0,
        pixelY: 0,
        latitude: hotspot.latitude,
        longitude: hotspot.longitude,
        address: hotspot.address ?? null,
        description: hotspot.description ?? null,
        pointType: hotspot.pointType,
        status: "ACTIVE",
        createdAt: stamp,
        updatedAt: stamp,
      });
    }
  }

  await writeLocalDb(db);
  return withDistrictCount(updated, db.locations);
}

export async function deleteDistrict(id: string) {
  await assertLocalProvider();
  const db = await readLocalDb();
  if (!db.districts.some((item) => item.id === id)) {
    throw new ApiError(404, "District not found.");
  }
  db.districts = db.districts.filter((item) => item.id !== id);
  db.locations = db.locations.filter((item) => item.districtId !== id);
  await writeLocalDb(db);
  return { success: true };
}

export async function listCategories(status?: string | null) {
  await assertLocalProvider();
  const db = await readLocalDb();
  return db.categories
    .filter((item) => !status || item.status === status)
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((item) => withCategoryCount(item, db.locations));
}

export async function getCategoryById(id: string) {
  await assertLocalProvider();
  const db = await readLocalDb();
  const category = db.categories.find((item) => item.id === id);
  if (!category) throw new ApiError(404, "Category not found.");
  return withCategoryCount(category, db.locations);
}

export async function createCategory(input: CategoryCreateInput) {
  await assertLocalProvider();
  const db = await readLocalDb();
  if (db.categories.some((item) => item.name === input.name)) {
    throw new ApiError(409, "A category with this name already exists.");
  }
  const stamp = nowIso();
  const category: StoredCategory = {
    id: createId(),
    name: input.name,
    description: input.description ?? null,
    status: input.status,
    createdAt: stamp,
    updatedAt: stamp,
  };
  db.categories.push(category);
  await writeLocalDb(db);
  return withCategoryCount(category, db.locations);
}

export async function updateCategory(id: string, input: CategoryUpdateInput) {
  await assertLocalProvider();
  const db = await readLocalDb();
  const index = db.categories.findIndex((item) => item.id === id);
  if (index < 0) throw new ApiError(404, "Category not found.");

  if (input.name && db.categories.some((item) => item.name === input.name && item.id !== id)) {
    throw new ApiError(409, "A category with this name already exists.");
  }

  const updated: StoredCategory = {
    ...db.categories[index],
    ...input,
    description:
      input.description === undefined ? db.categories[index].description : input.description,
    updatedAt: nowIso(),
  };
  db.categories[index] = updated;
  await writeLocalDb(db);
  return withCategoryCount(updated, db.locations);
}

export async function deleteCategory(id: string) {
  await assertLocalProvider();
  const db = await readLocalDb();
  if (!db.categories.some((item) => item.id === id)) {
    throw new ApiError(404, "Category not found.");
  }
  if (db.locations.some((item) => item.categoryId === id)) {
    throw new ApiError(
      400,
      "Cannot delete a category that is used by locations. Reassign or remove those locations first.",
    );
  }
  db.categories = db.categories.filter((item) => item.id !== id);
  await writeLocalDb(db);
  return { success: true };
}

export async function listLocations(filters: {
  districtId?: string | null;
  categoryId?: string | null;
  status?: string | null;
  search?: string | null;
}) {
  await assertLocalProvider();
  const db = await readLocalDb();
  const search = filters.search?.trim().toLowerCase();

  const locations = db.locations
    .filter((item) => {
      if (filters.districtId && item.districtId !== filters.districtId) return false;
      if (filters.categoryId && item.categoryId !== filters.categoryId) return false;
      if (filters.status && item.status !== filters.status) return false;
      if (!search) return true;

      const district = db.districts.find((d) => d.id === item.districtId);
      const category = db.categories.find((c) => c.id === item.categoryId);
      return (
        item.name.toLowerCase().includes(search) ||
        (item.address ?? "").toLowerCase().includes(search) ||
        (item.description ?? "").toLowerCase().includes(search) ||
        (district?.name.toLowerCase().includes(search) ?? false) ||
        (category?.name.toLowerCase().includes(search) ?? false)
      );
    })
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .map((item) => withRelations(item, db.districts, db.categories));

  return locations;
}

export async function getLocationById(id: string) {
  await assertLocalProvider();
  const db = await readLocalDb();
  const location = db.locations.find((item) => item.id === id);
  if (!location) throw new ApiError(404, "Location not found.");
  return withRelations(location, db.districts, db.categories);
}

export async function createLocation(input: LocationCreateInput) {
  await assertLocalProvider();
  const db = await readLocalDb();

  const district = db.districts.find((item) => item.id === input.districtId);
  if (!district) throw new ApiError(400, "Selected district does not exist.");

  const category = db.categories.find((item) => item.id === input.categoryId);
  if (!category) throw new ApiError(400, "Selected category does not exist.");

  if (input.pixelX < 0 || input.pixelY < 0) {
    throw new ApiError(400, "Pixel coordinates cannot be negative.");
  }

  const stamp = nowIso();
  const location: StoredLocation = {
    id: createId(),
    districtId: input.districtId,
    categoryId: input.categoryId,
    name: input.name,
    pixelX: input.pixelX,
    pixelY: input.pixelY,
    latitude: input.latitude ?? null,
    longitude: input.longitude ?? null,
    address: input.address ?? null,
    description: input.description ?? null,
    pointType: input.pointType ?? "CUSTOM",
    markerColor:
      (input.pointType ?? "CUSTOM") === "CUSTOM"
        ? (input.markerColor ?? "#f59e0b")
        : null,
    status: input.status,
    createdAt: stamp,
    updatedAt: stamp,
  };

  db.locations.push(location);
  await writeLocalDb(db);
  return withRelations(location, db.districts, db.categories);
}

export async function updateLocation(id: string, input: LocationUpdateInput) {
  await assertLocalProvider();
  const db = await readLocalDb();
  const index = db.locations.findIndex((item) => item.id === id);
  if (index < 0) throw new ApiError(404, "Location not found.");

  const current = db.locations[index];
  const districtId = input.districtId ?? current.districtId;
  const categoryId = input.categoryId ?? current.categoryId;

  const district = db.districts.find((item) => item.id === districtId);
  if (!district) throw new ApiError(400, "Selected district does not exist.");

  const category = db.categories.find((item) => item.id === categoryId);
  if (!category) throw new ApiError(400, "Selected category does not exist.");

  const pixelX = input.pixelX ?? current.pixelX;
  const pixelY = input.pixelY ?? current.pixelY;
  if (pixelX < 0 || pixelY < 0) {
    throw new ApiError(400, "Pixel coordinates cannot be negative.");
  }

  const updated: StoredLocation = {
    ...current,
    ...input,
    districtId,
    categoryId,
    pixelX,
    pixelY,
    latitude: input.latitude === undefined ? current.latitude : input.latitude,
    longitude: input.longitude === undefined ? current.longitude : input.longitude,
    address: input.address === undefined ? current.address : input.address,
    description: input.description === undefined ? current.description : input.description,
    pointType: input.pointType ?? current.pointType,
    markerColor: (() => {
      const nextType = input.pointType ?? current.pointType;
      if (nextType === "RED" || nextType === "BLUE") return null;
      if (input.markerColor !== undefined) return input.markerColor;
      return current.markerColor ?? "#f59e0b";
    })(),
    updatedAt: nowIso(),
  };

  db.locations[index] = updated;
  await writeLocalDb(db);
  return withRelations(updated, db.districts, db.categories);
}

export async function deleteLocation(id: string) {
  await assertLocalProvider();
  const db = await readLocalDb();
  if (!db.locations.some((item) => item.id === id)) {
    throw new ApiError(404, "Location not found.");
  }
  db.locations = db.locations.filter((item) => item.id !== id);
  await writeLocalDb(db);
  return { success: true };
}

export async function getDashboardStats() {
  await assertLocalProvider();
  const db = await readLocalDb();
  const recentLocations = [...db.locations]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 8)
    .map((item) => withRelations(item, db.districts, db.categories));

  return {
    totalDistricts: db.districts.length,
    totalLocations: db.locations.length,
    activeLocations: db.locations.filter((item) => item.status === "ACTIVE").length,
    totalCategories: db.categories.length,
    recentLocations,
  };
}
