import { NextRequest, NextResponse } from "next/server";
import { GitHubRepositoryEngine } from "@/packages/knowledge";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { query, repoId } = body;

    if (!query || typeof query !== "string") {
      return NextResponse.json(
        { success: false, error: "Missing required parameter 'query'" },
        { status: 400 }
      );
    }

    const matches = GitHubRepositoryEngine.queryRepositoryKnowledge(query, repoId);

    return NextResponse.json({
      success: true,
      query,
      results: matches,
      count: matches.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to query repository knowledge" },
      { status: 500 }
    );
  }
}
