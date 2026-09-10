import { NextRequest, NextResponse } from "next/server";
import { prosisAgentInstance } from "@/packages/orchestrator/agent";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { approved } = body;

    if (typeof approved !== "boolean") {
      return NextResponse.json(
        { success: false, error: "approved (boolean) is required" },
        { status: 400 }
      );
    }

    const output = await prosisAgentInstance.handleApprovalDecision(id, approved);

    return NextResponse.json({
      success: true,
      data: output,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to resolve approval" },
      { status: 500 }
    );
  }
}

