import { NextResponse } from "next/server";
import { ApprovalManager } from "@/packages/orchestrator/approval-manager";

export async function GET() {
  try {
    const pending = ApprovalManager.getPending();
    const all = ApprovalManager.getAll();

    return NextResponse.json({
      success: true,
      pendingCount: pending.length,
      pending,
      recent: all.slice(0, 10),
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch approvals" },
      { status: 500 }
    );
  }
}

