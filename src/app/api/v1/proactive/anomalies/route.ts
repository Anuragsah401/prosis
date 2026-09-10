import { NextRequest, NextResponse } from "next/server";
import { AnomalyDetector, ProactiveEngine } from "@/packages/proactive";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const minImportance = searchParams.get("minImportance")
      ? parseFloat(searchParams.get("minImportance")!)
      : undefined;

    const isQuiet = ProactiveEngine.isQuietHoursActive();
    const anomalies = AnomalyDetector.detectAnomalies({ minImportance });

    return NextResponse.json({
      success: true,
      anomalies,
      count: anomalies.length,
      quietHoursActive: isQuiet,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch anomalies" },
      { status: 500 }
    );
  }
}

