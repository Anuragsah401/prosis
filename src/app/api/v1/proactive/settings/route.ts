import { NextRequest, NextResponse } from "next/server";
import { ProactiveEngine, AutonomyController } from "@/packages/proactive";

export async function GET() {
  try {
    const settings = ProactiveEngine.getSettings();
    const autonomyInfo = AutonomyController.getLevelInfo();

    return NextResponse.json({
      success: true,
      settings,
      autonomyInfo,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch proactive settings" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const updated = ProactiveEngine.updateSettings(body);
    const autonomyInfo = AutonomyController.getLevelInfo();

    return NextResponse.json({
      success: true,
      settings: updated,
      autonomyInfo,
      message: "Proactive settings successfully updated.",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update proactive settings" },
      { status: 500 }
    );
  }
}

