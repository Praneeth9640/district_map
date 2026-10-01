import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/api-error";
import { districtCreateSchema } from "@/lib/validations";
import { createDistrict, listDistricts } from "@/lib/data/repository";

export async function GET(request: NextRequest) {
  try {
    const status = request.nextUrl.searchParams.get("status");
    const districts = await listDistricts(status);
    return NextResponse.json(districts);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = districtCreateSchema.parse(body);
    const district = await createDistrict(data);
    return NextResponse.json(district, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
