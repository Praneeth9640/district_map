import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api-error";
import { getDashboardStats } from "@/lib/data/repository";

export async function GET() {
  try {
    const stats = await getDashboardStats();
    return NextResponse.json(stats);
  } catch (error) {
    return handleApiError(error);
  }
}
