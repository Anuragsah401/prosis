import { NextRequest, NextResponse } from "next/server";
import { TaskEngine } from "@/packages/orchestrator/task-engine";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const stepIndex = Number(body.stepIndex ?? 0);
    const forceDestructive = Boolean(body.forceDestructive ?? false);

    // 1. Enforce Safe Retry Guard: Never blindly retry destructive operations
    const check = TaskEngine.canRetryStep(id, stepIndex);
    if (!check.allowed && !forceDestructive) {
      return NextResponse.json(
        {
          success: false,
          error: check.reason || "Retry rejected by safety guardrails",
          guardrailBlocked: true,
        },
        { status: 400 }
      );
    }

    const result = TaskEngine.retryStep(id, stepIndex, forceDestructive);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.message,
        },
        { status: 400 }
      );
    }

    const updatedTask = TaskEngine.getTask(id);
    return NextResponse.json({
      success: true,
      message: result.message,
      task: updatedTask,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to retry task step" },
      { status: 500 }
    );
  }
}

