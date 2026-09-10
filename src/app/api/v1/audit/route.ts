import { NextRequest, NextResponse } from "next/server";
import { AuditTrail } from "@/packages/orchestrator/audit-trail";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const toolName = searchParams.get("tool") || undefined;

    let logs = AuditTrail.getAll();
    if (toolName) {
      logs = logs.filter((l) => l.toolName === toolName);
    }

    return NextResponse.json({
      success: true,
      count: logs.length,
      data: logs.slice(0, limit),
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch audit records" },
      { status: 500 }
    );
  }
}

