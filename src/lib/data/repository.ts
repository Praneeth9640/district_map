import { getDataProvider } from "@/lib/data/types";
import * as local from "@/lib/data/local-repository";
import * as mongo from "@/lib/data/mongo-repository";
import type {
  CategoryCreateInput,
  CategoryUpdateInput,
  DistrictCreateInput,
  DistrictUpdateInput,
  LocationCreateInput,
  LocationUpdateInput,
} from "@/lib/validations";

function store() {
  return getDataProvider() === "mongodb" ? mongo : local;
}

export async function listDistricts(status?: string | null) {
  return store().listDistricts(status);
}

export async function getDistrictById(id: string) {
  return store().getDistrictById(id);
}

export async function createDistrict(input: DistrictCreateInput) {
  return store().createDistrict(input);
}

export async function updateDistrict(id: string, input: DistrictUpdateInput) {
  return store().updateDistrict(id, input);
}

export async function deleteDistrict(id: string) {
  return store().deleteDistrict(id);
}

export async function listCategories(status?: string | null) {
  return store().listCategories(status);
}

export async function getCategoryById(id: string) {
  return store().getCategoryById(id);
}

export async function createCategory(input: CategoryCreateInput) {
  return store().createCategory(input);
}

export async function updateCategory(id: string, input: CategoryUpdateInput) {
  return store().updateCategory(id, input);
}

export async function deleteCategory(id: string) {
  return store().deleteCategory(id);
}

export async function listLocations(filters: {
  districtId?: string | null;
  categoryId?: string | null;
  status?: string | null;
  search?: string | null;
}) {
  return store().listLocations(filters);
}

export async function getLocationById(id: string) {
  return store().getLocationById(id);
}

export async function createLocation(input: LocationCreateInput) {
  return store().createLocation(input);
}

export async function updateLocation(id: string, input: LocationUpdateInput) {
  return store().updateLocation(id, input);
}

export async function deleteLocation(id: string) {
  return store().deleteLocation(id);
}

export async function getDashboardStats() {
  return store().getDashboardStats();
}
