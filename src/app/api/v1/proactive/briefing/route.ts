import { NextRequest, NextResponse } from "next/server";
import { ProactiveEngine } from "@/packages/proactive";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const forceBypassQuietHours = searchParams.get("bypassQuietHours") === "true";
    const organizationId = searchParams.get("organizationId") || "org_acme_corp";

    const briefingResult = ProactiveEngine.generateDailyBriefing({
      forceBypassQuietHours,
      organizationId,
    });

    return NextResponse.json({
      success: true,
      briefing: briefingResult.briefing,
      formattedText: briefingResult.formattedText,
      spokenText: briefingResult.spokenText,
      suppressedByQuietHours: briefingResult.suppressedByQuietHours,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to generate proactive briefing" },
      { status: 500 }
    );
  }
}

