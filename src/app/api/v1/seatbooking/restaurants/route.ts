import { NextRequest, NextResponse } from "next/server";
import { SeatbookingService } from "@/packages/products/seatbooking/data";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const decliningOnly = searchParams.get("declining") === "true";

    const restaurants = decliningOnly
      ? SeatbookingService.getDecliningRestaurants()
      : SeatbookingService.getAllRestaurants();

    return NextResponse.json({
      success: true,
      count: restaurants.length,
      data: restaurants,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch restaurants" },
      { status: 500 }
    );
  }
}

