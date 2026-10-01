import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/api-error";
import { categoryUpdateSchema } from "@/lib/validations";
import {
  deleteCategory,
  getCategoryById,
  updateCategory,
} from "@/lib/data/repository";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const category = await getCategoryById(id);
    return NextResponse.json(category);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const data = categoryUpdateSchema.parse(body);
    const category = await updateCategory(id, data);
    return NextResponse.json(category);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const result = await deleteCategory(id);
    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}
