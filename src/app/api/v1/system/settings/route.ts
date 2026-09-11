import { NextRequest, NextResponse } from "next/server";
import { ProactiveEngine, AutonomyController } from "@/packages/proactive";
import { ProductRegistry } from "@/packages/sdk";
import { AuthService } from "@/packages/orchestrator/auth-service";
import { Memory } from "@/packages/memory";

export async function GET() {
  try {
    const proactiveSettings = ProactiveEngine.getSettings();
    const autonomyInfo = AutonomyController.getLevelInfo();
    const products = ProductRegistry.getAll();
    const demoUsers = AuthService.getDemoUsers();

    // Retrieve any saved system preferences from Memory
    const memories = Memory.query({ type: "user_preference" });
    const configMemory = memories.find((m) => m.key === "system_configuration");
    let systemPrefs: Record<string, any> = {};
    if (configMemory && configMemory.structuredData) {
      systemPrefs = configMemory.structuredData as Record<string, any>;
    }

    return NextResponse.json({
      success: true,
      settings: {
        // Autonomy & Governance
        autonomyLevel: proactiveSettings.autonomyLevel,
        autonomyInfo,
        requireApprovalForDestructive: systemPrefs.requireApprovalForDestructive ?? true,
        requireApprovalForOutbound: systemPrefs.requireApprovalForOutbound ?? true,
        requireApprovalForRosterChanges: systemPrefs.requireApprovalForRosterChanges ?? true,
        quietHours: proactiveSettings.quietHours,
        notificationsEnabled: proactiveSettings.notificationsEnabled,

        // AI & Cognitive Engine
        primaryModel: systemPrefs.primaryModel ?? "gpt-4o",
        cognitiveTone: systemPrefs.cognitiveTone ?? "executive",
        reasoningTemperature: systemPrefs.reasoningTemperature ?? 0.2,
        voiceEngine: systemPrefs.voiceEngine ?? (process.env.VOICE_PROVIDER || "openai"),

        // Product Surveillance
        monitoredProducts: proactiveSettings.monitoredProducts,
        importanceThreshold: proactiveSettings.importanceThreshold,
        automaticActionsAllowed: proactiveSettings.automaticActionsAllowed,

        // Security & Zero Trust
        auditLevel: systemPrefs.auditLevel ?? "strict_compliance",
        tenantIsolationEnforced: true,
      },
      availableProducts: products.map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        version: p.version,
        description: p.description,
        isActive: p.status === "active" || p.enabled !== false,
      })),
      demoUsers,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch system settings" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    // 1. Update Proactive Engine & Autonomy Controller
    const updatedProactive = ProactiveEngine.updateSettings({
      autonomyLevel: body.autonomyLevel,
      notificationsEnabled: body.notificationsEnabled,
      quietHours: body.quietHours,
      monitoredProducts: body.monitoredProducts,
      importanceThreshold: body.importanceThreshold,
      automaticActionsAllowed: body.automaticActionsAllowed,
    });

    if (body.autonomyLevel !== undefined) {
      AutonomyController.setLevel(body.autonomyLevel);
    }

    // 2. Persist extended system preferences to Memory
    Memory.store({
      type: "user_preference",
      key: "system_configuration",
      content: `System settings updated: Autonomy L${updatedProactive.autonomyLevel}, Model: ${body.primaryModel || "default"}, Tone: ${body.cognitiveTone || "executive"}`,
      structuredData: {
        requireApprovalForDestructive: body.requireApprovalForDestructive ?? true,
        requireApprovalForOutbound: body.requireApprovalForOutbound ?? true,
        requireApprovalForRosterChanges: body.requireApprovalForRosterChanges ?? true,
        primaryModel: body.primaryModel ?? "gpt-4o",
        cognitiveTone: body.cognitiveTone ?? "executive",
        reasoningTemperature: body.reasoningTemperature ?? 0.2,
        voiceEngine: body.voiceEngine ?? "openai",
        auditLevel: body.auditLevel ?? "strict_compliance",
      },
      source: "admin_configuration",
      importance: "high",
      confidence: 1.0,
    });

    return NextResponse.json({
      success: true,
      message: "System configuration successfully updated and persisted.",
      settings: {
        ...updatedProactive,
        autonomyInfo: AutonomyController.getLevelInfo(),
        primaryModel: body.primaryModel,
        cognitiveTone: body.cognitiveTone,
        reasoningTemperature: body.reasoningTemperature,
        voiceEngine: body.voiceEngine,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update system settings" },
      { status: 500 }
    );
  }
}
