import { NextRequest, NextResponse } from "next/server";
import { prosisAgentInstance } from "@/packages/orchestrator/agent";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, source = "web" } = body;

    if (!message || typeof message !== "string" || !message.trim()) {
      return NextResponse.json(
        { success: false, error: "message string is required" },
        { status: 400 }
      );
    }

    const output = await prosisAgentInstance.processInput(
      message.trim(),
      source as "web" | "voice"
    );

    return NextResponse.json({
      success: true,
      data: {
        replyText: output.replyText,
        spokenText: output.spokenText,
        coreState: output.coreState,
        executedTools: output.executedTools,
        pendingApproval: output.pendingApproval,
        suggestedFollowUps: output.suggestedFollowUps,
        workspaceAction: output.workspaceAction,
        turns: prosisAgentInstance.getTurns(),
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process directive" },
      { status: 500 }
    );
  }
}

