import { NextRequest, NextResponse } from "next/server";
import { TaskEngine } from "@/packages/orchestrator/task-engine";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get("conversationId");

    const allTasks = TaskEngine.getAllTasks();
    const activeTask = conversationId ? TaskEngine.getActiveTask(conversationId) : undefined;

    return NextResponse.json({
      success: true,
      tasks: allTasks,
      activeTask: activeTask || null,
      count: allTasks.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch tasks" },
      { status: 500 }
    );
  }
}

