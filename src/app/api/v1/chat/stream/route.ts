import { NextRequest, NextResponse } from "next/server";
import { AuthService } from "@/packages/orchestrator/auth-service";
import { ProsisItOrchestrator, ProsisContext } from "@/packages/orchestrator/prosis-it";

// Shared orchestrator instance for text/chat interactions
const chatOrchestrator = new ProsisItOrchestrator();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { message, source = "web", sessionId = "sess_chat_default", conversationId = "conv_chat_default" } = body;

    if (!message || typeof message !== "string" || !message.trim()) {
      return NextResponse.json(
        { success: false, error: "message string is required" },
        { status: 400 }
      );
    }

    // Resolve authoritative server session
    const authHeader = req.headers.get("authorization");
    const sessionToken = req.headers.get("x-prosis-session");
    const session =
      AuthService.resolveSession({ authorization: authHeader, sessionToken }) ||
      AuthService.resolveSession({ authorization: "Bearer sess_live_director_token" })!;

    const context: ProsisContext = {
      user: {
        id: session.user.id,
        name: session.user.name,
        role: session.user.role,
        permissions: session.user.permissions,
      },
      organization: {
        id: session.organization.id,
        name: session.organization.name,
        tenantId: session.organization.id,
      },
      activeProduct: "analytics",
      activeVenue: session.allowedVenues?.[0] || "cantina_bella",
      conversationId,
      sessionId,
      previousToolResults: {},
      pendingApprovals: [],
      autonomyLevel: 1,
      conversationHistory: [],
    };

    const output = await chatOrchestrator.orchestrate(message.trim(), context);

    const turns = (context.conversationHistory || []).map((t, idx) => ({
      id: `turn_${idx}_${Date.now()}`,
      role: t.role,
      content: t.content,
      timestamp: t.timestamp || new Date().toISOString(),
    }));

    return NextResponse.json({
      success: true,
      data: {
        replyText: output.response,
        spokenText: output.response,
        coreState: output.state,
        reasoningSummary: output.reasoningSummary,
        plan: output.plan,
        pendingApproval: output.pendingApproval,
        toolResults: output.toolResults,
        turns,
      },
    });
  } catch (error: any) {
    console.error("[ChatStreamRoute] Orchestration error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process directive through ProsisIt core" },
      { status: 500 }
    );
  }
}
