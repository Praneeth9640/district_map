import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/api-error";
import { districtUpdateSchema } from "@/lib/validations";
import {
  deleteDistrict,
  getDistrictById,
  updateDistrict,
} from "@/lib/data/repository";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const district = await getDistrictById(id);
    return NextResponse.json(district);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const data = districtUpdateSchema.parse(body);
    const district = await updateDistrict(id, data);
    return NextResponse.json(district);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const result = await deleteDistrict(id);
    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}
