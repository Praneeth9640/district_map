import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/api-error";
import { locationUpdateSchema } from "@/lib/validations";
import {
  deleteLocation,
  getLocationById,
  updateLocation,
} from "@/lib/data/repository";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const location = await getLocationById(id);
    return NextResponse.json(location);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const data = locationUpdateSchema.parse(body);
    const location = await updateLocation(id, data);
    return NextResponse.json(location);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const result = await deleteLocation(id);
    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}
