import { NextResponse } from "next/server";
import { SeatbookingService } from "@/packages/products/seatbooking/data";

export async function GET() {
  try {
    const briefing = SeatbookingService.getDailyBriefing();
    return NextResponse.json({
      success: true,
      data: briefing,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch briefing" },
      { status: 500 }
    );
  }
}

