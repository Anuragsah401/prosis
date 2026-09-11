import { NextRequest, NextResponse } from "next/server";
import { GitHubRepositoryEngine } from "@/packages/knowledge";

export async function GET() {
  try {
    const repos = GitHubRepositoryEngine.listRepositories();
    return NextResponse.json({
      success: true,
      repositories: repos,
      count: repos.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to list repositories" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { repoUrl, branch = "main", accessToken, orgScope } = body;

    if (!repoUrl || typeof repoUrl !== "string") {
      return NextResponse.json(
        { success: false, error: "Missing required parameter 'repoUrl'" },
        { status: 400 }
      );
    }

    const connected = await GitHubRepositoryEngine.connectRepository({
      repoUrl,
      branch,
      accessToken,
      orgScope,
    });

    return NextResponse.json({
      success: true,
      message: `Repository ${connected.name} successfully connected and indexed.`,
      repository: connected,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to connect repository" },
      { status: 500 }
    );
  }
}

