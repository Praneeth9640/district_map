import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/api-error";
import { locationCreateSchema } from "@/lib/validations";
import { createLocation, listLocations } from "@/lib/data/repository";

export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;
    const locations = await listLocations({
      districtId: params.get("districtId"),
      categoryId: params.get("categoryId"),
      status: params.get("status"),
      search: params.get("search"),
    });
    return NextResponse.json(locations);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = locationCreateSchema.parse(body);
    const location = await createLocation(data);
    return NextResponse.json(location, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
