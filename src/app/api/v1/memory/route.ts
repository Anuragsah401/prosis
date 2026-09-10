import { NextRequest, NextResponse } from "next/server";
import { Memory, MemoryCategory } from "@/packages/memory";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q");
    const type = searchParams.get("type") as MemoryCategory | null;
    const orgId = searchParams.get("orgId") || "org_acme_corp";
    const enabledOnly = searchParams.get("enabledOnly") === "true";

    // 1. Semantic search if query string provided
    if (q) {
      const searchResults = await Memory.searchSemantic(q, orgId, {
        type: type || undefined,
        limit: 10,
      });

      return NextResponse.json({
        success: true,
        count: searchResults.length,
        data: searchResults.map((r) => ({
          ...r.memory,
          similarityScore: r.similarityScore,
        })),
      });
    }

    // 2. Standard filtered query
    const memories = Memory.query({
      organizationId: orgId,
      type: type || undefined,
      enabledOnly: enabledOnly || undefined,
    });

    return NextResponse.json({
      success: true,
      count: memories.length,
      data: memories,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to query memory" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      content,
      type,
      key,
      source,
      importance,
      orgScope,
      organizationId,
      enabled,
      structuredData,
      usePipeline,
      userUtterance,
    } = body;

    const org = organizationId || orgScope || "org_acme_corp";

    // Optional 4-stage pipeline execution
    if (usePipeline && (userUtterance || content)) {
      const record = await Memory.processTurn({
        userUtterance: userUtterance || content,
        organizationId: org,
      });

      return NextResponse.json({
        success: Boolean(record),
        data: record,
        message: record ? "Memory stored via pipeline" : "Discarded as low-signal or sensitive",
      });
    }

    if (!content) {
      return NextResponse.json(
        { success: false, error: "content is required" },
        { status: 400 }
      );
    }

    const record = Memory.store({
      content,
      type: type || "user_preference",
      key,
      source: source || "user_statement",
      importance: importance || "medium",
      confidence: 1.0,
      enabled: enabled ?? true,
      organizationId: org,
      structuredData,
    });

    return NextResponse.json({
      success: true,
      data: record,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to save memory" },
      { status: 500 }
    );
  }
}
