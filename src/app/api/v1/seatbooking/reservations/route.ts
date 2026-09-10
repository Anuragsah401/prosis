import { NextRequest, NextResponse } from "next/server";
import { SeatbookingService } from "@/packages/products/seatbooking/data";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const restaurantId = searchParams.get("restaurantId") || undefined;

    const reservations = SeatbookingService.getReservations("org_acme_corp", { restaurantId });

    return NextResponse.json({
      success: true,
      count: reservations.length,
      data: reservations,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch reservations" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { reservationId, reason } = body;

    if (!reservationId) {
      return NextResponse.json(
        { success: false, error: "reservationId is required" },
        { status: 400 }
      );
    }

    const result = SeatbookingService.cancelReservation(
      "org_acme_corp",
      reservationId,
      reason || "Cancelled via Prosis OS"
    );

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to void reservation" },
      { status: 400 }
    );
  }
}

