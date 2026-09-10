import { NextRequest, NextResponse } from "next/server";
import { SeatbookingService } from "@/packages/products/seatbooking/data";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { restaurantId, subject, body: emailBody } = body;

    if (!restaurantId || !subject || !emailBody) {
      return NextResponse.json(
        { success: false, error: "restaurantId, subject, and body are required" },
        { status: 400 }
      );
    }

    const result = SeatbookingService.sendManagerCampaignEmail(
      restaurantId,
      subject,
      emailBody
    );

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to dispatch campaign" },
      { status: 500 }
    );
  }
}

