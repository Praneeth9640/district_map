import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/api-error";
import { categoryCreateSchema } from "@/lib/validations";
import { createCategory, listCategories } from "@/lib/data/repository";

export async function GET(request: NextRequest) {
  try {
    const status = request.nextUrl.searchParams.get("status");
    const categories = await listCategories(status);
    return NextResponse.json(categories);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = categoryCreateSchema.parse(body);
    const category = await createCategory(data);
    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
