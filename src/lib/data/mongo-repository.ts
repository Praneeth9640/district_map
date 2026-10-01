import { Types } from "mongoose";
import { ApiError } from "@/lib/api-error";
import { connectToDatabase } from "@/lib/db";
import { isValidObjectId } from "@/lib/mongo";
import { serializeCategory, serializeDistrict, serializeLocation } from "@/lib/serializers";
import type { DistrictHotspot, DistrictMapView } from "@/lib/maps/types";
import { Category } from "@/models/Category";
import { District } from "@/models/District";
import { Location } from "@/models/Location";
import type {
  CategoryCreateInput,
  CategoryUpdateInput,
  DistrictCreateInput,
  DistrictUpdateInput,
  LocationCreateInput,
  LocationUpdateInput,
} from "@/lib/validations";

async function db() {
  await connectToDatabase();
}

function requireObjectId(id: string, label = "ID") {
  if (!isValidObjectId(id)) {
    throw new ApiError(400, `Invalid ${label}.`);
  }
  return new Types.ObjectId(id);
}

async function locationCountByDistrict(districtId: Types.ObjectId) {
  return Location.countDocuments({ districtId });
}

async function locationCountByCategory(categoryId: Types.ObjectId) {
  return Location.countDocuments({ categoryId });
}

export async function listDistricts(status?: string | null) {
  await db();
  const districts =
    status === "ACTIVE" || status === "INACTIVE"
      ? await District.find({ status }).sort({ name: 1 }).lean()
      : await District.find({}).sort({ name: 1 }).lean();
  return Promise.all(
    districts.map(async (district) =>
      serializeDistrict(district, await locationCountByDistrict(district._id)),
    ),
  );
}

export async function getDistrictById(id: string) {
  await db();
  const _id = requireObjectId(id, "district id");
  const district = await District.findById(_id).lean();
  if (!district) throw new ApiError(404, "District not found.");
  return serializeDistrict(district, await locationCountByDistrict(district._id));
}

export async function createDistrict(input: DistrictCreateInput) {
  await db();
  const code = input.code.toUpperCase();
  const existing = await District.findOne({ code }).lean();
  if (existing) throw new ApiError(409, "A district with this code already exists.");

  const district = await District.create({
    name: input.name,
    code,
    mapImage: input.mapImage ?? "",
    mapWidth: input.mapWidth ?? 1,
    mapHeight: input.mapHeight ?? 1,
    mapView: input.mapView ?? null,
    hotspots: input.hotspots ?? [],
    status: input.status,
  });

  const hotspots = input.hotspots ?? [];
  if (hotspots.length > 0) {
    for (const hotspot of hotspots) {
      const category =
        (await Category.findOne({ name: hotspot.categoryName })) ??
        (await Category.findOne({ name: "Other" }));
      if (!category) continue;
      await Location.create({
        districtId: district._id,
        categoryId: category._id,
        name: hotspot.name,
        pixelX: 0,
        pixelY: 0,
        latitude: hotspot.latitude,
        longitude: hotspot.longitude,
        address: hotspot.address ?? null,
        description: hotspot.description ?? null,
        pointType: hotspot.pointType,
        status: "ACTIVE",
      });
    }
  }

  const lean = district.toObject();
  return serializeDistrict(lean, await locationCountByDistrict(district._id));
}

export async function updateDistrict(id: string, input: DistrictUpdateInput) {
  await db();
  const _id = requireObjectId(id, "district id");
  const current = await District.findById(_id);
  if (!current) throw new ApiError(404, "District not found.");

  if (input.code) {
    const code = input.code.toUpperCase();
    const clash = await District.findOne({ code, _id: { $ne: _id } }).lean();
    if (clash) throw new ApiError(409, "A district with this code already exists.");
    current.code = code;
  }

  if (input.name !== undefined) current.name = input.name;
  if (input.mapImage !== undefined) current.mapImage = input.mapImage;
  if (input.mapWidth !== undefined) current.mapWidth = input.mapWidth;
  if (input.mapHeight !== undefined) current.mapHeight = input.mapHeight;
  if (input.mapView !== undefined) current.mapView = input.mapView;
  if (input.hotspots !== undefined) current.hotspots = input.hotspots;
  if (input.status !== undefined) current.status = input.status;

  await current.save();

  if (input.hotspots) {
    for (const hotspot of input.hotspots) {
      const exists = await Location.findOne({
        districtId: current._id,
        name: new RegExp(`^${hotspot.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i"),
      }).lean();
      if (exists) continue;
      const category =
        (await Category.findOne({ name: hotspot.categoryName })) ??
        (await Category.findOne({ name: "Other" }));
      if (!category) continue;
      await Location.create({
        districtId: current._id,
        categoryId: category._id,
        name: hotspot.name,
        pixelX: 0,
        pixelY: 0,
        latitude: hotspot.latitude,
        longitude: hotspot.longitude,
        address: hotspot.address ?? null,
        description: hotspot.description ?? null,
        pointType: hotspot.pointType,
        status: "ACTIVE",
      });
    }
  }

  const lean = current.toObject();
  return serializeDistrict(lean, await locationCountByDistrict(current._id));
}

export async function deleteDistrict(id: string) {
  await db();
  const _id = requireObjectId(id, "district id");
  const district = await District.findById(_id);
  if (!district) throw new ApiError(404, "District not found.");
  await Location.deleteMany({ districtId: _id });
  await District.deleteOne({ _id });
  return { success: true };
}

export async function listCategories(status?: string | null) {
  await db();
  const categories =
    status === "ACTIVE" || status === "INACTIVE"
      ? await Category.find({ status }).sort({ name: 1 }).lean()
      : await Category.find({}).sort({ name: 1 }).lean();
  return Promise.all(
    categories.map(async (category) =>
      serializeCategory(category, await locationCountByCategory(category._id)),
    ),
  );
}

export async function getCategoryById(id: string) {
  await db();
  const _id = requireObjectId(id, "category id");
  const category = await Category.findById(_id).lean();
  if (!category) throw new ApiError(404, "Category not found.");
  return serializeCategory(category, await locationCountByCategory(category._id));
}

export async function createCategory(input: CategoryCreateInput) {
  await db();
  const existing = await Category.findOne({ name: input.name }).lean();
  if (existing) throw new ApiError(409, "A category with this name already exists.");
  const category = await Category.create({
    name: input.name,
    description: input.description ?? null,
    status: input.status,
  });
  return serializeCategory(category.toObject(), 0);
}

export async function updateCategory(id: string, input: CategoryUpdateInput) {
  await db();
  const _id = requireObjectId(id, "category id");
  const current = await Category.findById(_id);
  if (!current) throw new ApiError(404, "Category not found.");

  if (input.name) {
    const clash = await Category.findOne({ name: input.name, _id: { $ne: _id } }).lean();
    if (clash) throw new ApiError(409, "A category with this name already exists.");
    current.name = input.name;
  }
  if (input.description !== undefined) current.description = input.description;
  if (input.status !== undefined) current.status = input.status;
  await current.save();
  return serializeCategory(
    current.toObject(),
    await locationCountByCategory(current._id),
  );
}

export async function deleteCategory(id: string) {
  await db();
  const _id = requireObjectId(id, "category id");
  const category = await Category.findById(_id);
  if (!category) throw new ApiError(404, "Category not found.");
  const inUse = await Location.exists({ categoryId: _id });
  if (inUse) {
    throw new ApiError(
      400,
      "Cannot delete a category that is used by locations. Reassign or remove those locations first.",
    );
  }
  await Category.deleteOne({ _id });
  return { success: true };
}

export async function listLocations(filters: {
  districtId?: string | null;
  categoryId?: string | null;
  status?: string | null;
  search?: string | null;
}) {
  await db();
  const query: Record<string, unknown> = {};
  if (filters.districtId) query.districtId = requireObjectId(filters.districtId, "district id");
  if (filters.categoryId) query.categoryId = requireObjectId(filters.categoryId, "category id");
  if (filters.status) query.status = filters.status;

  const search = filters.search?.trim();
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { address: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
    ];
  }

  const locations = await Location.find(query)
    .populate("districtId", "name code")
    .populate("categoryId", "name")
    .sort({ updatedAt: -1 })
    .lean();

  return locations.map((item) => serializeLocation(item));
}

export async function getLocationById(id: string) {
  await db();
  const _id = requireObjectId(id, "location id");
  const location = await Location.findById(_id)
    .populate("districtId", "name code")
    .populate("categoryId", "name")
    .lean();
  if (!location) throw new ApiError(404, "Location not found.");
  return serializeLocation(location);
}

export async function createLocation(input: LocationCreateInput) {
  await db();
  const districtId = requireObjectId(input.districtId, "district id");
  const categoryId = requireObjectId(input.categoryId, "category id");

  const district = await District.findById(districtId).lean();
  if (!district) throw new ApiError(400, "Selected district does not exist.");
  const category = await Category.findById(categoryId).lean();
  if (!category) throw new ApiError(400, "Selected category does not exist.");
  if (input.pixelX < 0 || input.pixelY < 0) {
    throw new ApiError(400, "Pixel coordinates cannot be negative.");
  }

  const location = await Location.create({
    districtId,
    categoryId,
    name: input.name,
    pixelX: input.pixelX,
    pixelY: input.pixelY,
    latitude: input.latitude ?? null,
    longitude: input.longitude ?? null,
    address: input.address ?? null,
    description: input.description ?? null,
    pointType: input.pointType ?? "CUSTOM",
    status: input.status,
  });

  const populated = await Location.findById(location._id)
    .populate("districtId", "name code")
    .populate("categoryId", "name")
    .lean();
  return serializeLocation(populated!);
}

export async function updateLocation(id: string, input: LocationUpdateInput) {
  await db();
  const _id = requireObjectId(id, "location id");
  const current = await Location.findById(_id);
  if (!current) throw new ApiError(404, "Location not found.");

  if (input.districtId) {
    const districtId = requireObjectId(input.districtId, "district id");
    const district = await District.findById(districtId).lean();
    if (!district) throw new ApiError(400, "Selected district does not exist.");
    current.districtId = districtId;
  }
  if (input.categoryId) {
    const categoryId = requireObjectId(input.categoryId, "category id");
    const category = await Category.findById(categoryId).lean();
    if (!category) throw new ApiError(400, "Selected category does not exist.");
    current.categoryId = categoryId;
  }

  if (input.name !== undefined) current.name = input.name;
  if (input.pixelX !== undefined) current.pixelX = input.pixelX;
  if (input.pixelY !== undefined) current.pixelY = input.pixelY;
  if (input.latitude !== undefined) current.latitude = input.latitude;
  if (input.longitude !== undefined) current.longitude = input.longitude;
  if (input.address !== undefined) current.address = input.address;
  if (input.description !== undefined) current.description = input.description;
  if (input.pointType !== undefined) current.pointType = input.pointType;
  if (input.status !== undefined) current.status = input.status;

  if (current.pixelX < 0 || current.pixelY < 0) {
    throw new ApiError(400, "Pixel coordinates cannot be negative.");
  }

  await current.save();
  const populated = await Location.findById(current._id)
    .populate("districtId", "name code")
    .populate("categoryId", "name")
    .lean();
  return serializeLocation(populated!);
}

export async function deleteLocation(id: string) {
  await db();
  const _id = requireObjectId(id, "location id");
  const result = await Location.deleteOne({ _id });
  if (result.deletedCount === 0) throw new ApiError(404, "Location not found.");
  return { success: true };
}

export async function getDashboardStats() {
  await db();
  const [totalDistricts, totalLocations, activeLocations, totalCategories, recent] =
    await Promise.all([
      District.countDocuments(),
      Location.countDocuments(),
      Location.countDocuments({ status: "ACTIVE" }),
      Category.countDocuments(),
      Location.find()
        .populate("districtId", "name code")
        .populate("categoryId", "name")
        .sort({ createdAt: -1 })
        .limit(8)
        .lean(),
    ]);

  return {
    totalDistricts,
    totalLocations,
    activeLocations,
    totalCategories,
    recentLocations: recent.map((item) => serializeLocation(item)),
  };
}

export async function getDistrictByCode(code: string) {
  await db();
  const district = await District.findOne({ code: code.toUpperCase() }).lean();
  if (!district) return null;
  return serializeDistrict(district);
}

/** Used by seed — wipe collections then insert defaults. */
export async function resetMongoDatabase(seed: {
  categories: Array<{ name: string; description: string; status: "ACTIVE" | "INACTIVE" }>;
  districts: Array<{
    name: string;
    code: string;
    status: "ACTIVE" | "INACTIVE";
    mapView: DistrictMapView | null;
    hotspots: DistrictHotspot[];
  }>;
}) {
  await db();
  await Promise.all([
    Location.deleteMany({}),
    District.deleteMany({}),
    Category.deleteMany({}),
  ]);

  const categories = await Category.insertMany(
    seed.categories.map((item) => ({
      name: item.name,
      description: item.description,
      status: item.status,
    })),
  );
  const categoryByName = new Map(
    categories.map((item) => [item.name, item] as const),
  );

  for (const def of seed.districts) {
    const district = await District.create({
      name: def.name,
      code: def.code,
      mapImage: "",
      mapWidth: 1,
      mapHeight: 1,
      mapView: def.mapView ?? null,
      hotspots: def.hotspots ?? [],
      status: def.status,
    });

    for (const hotspot of def.hotspots ?? []) {
      const category =
        categoryByName.get(hotspot.categoryName) ?? categoryByName.get("Other");
      if (!category) continue;
      await Location.create({
        districtId: district._id,
        categoryId: category._id,
        name: hotspot.name,
        pixelX: 0,
        pixelY: 0,
        latitude: hotspot.latitude,
        longitude: hotspot.longitude,
        address: hotspot.address ?? null,
        description: hotspot.description ?? null,
        pointType: hotspot.pointType,
        status: "ACTIVE",
      });
    }
  }

  return {
    districts: await District.countDocuments(),
    categories: await Category.countDocuments(),
    locations: await Location.countDocuments(),
  };
}
