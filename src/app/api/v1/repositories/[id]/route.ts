import { NextRequest, NextResponse } from "next/server";
import { GitHubRepositoryEngine } from "@/packages/knowledge";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const repo = GitHubRepositoryEngine.getRepository(id);

    if (!repo) {
      return NextResponse.json(
        { success: false, error: `Repository not found: ${id}` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      repository: repo,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to get repository" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const repo = GitHubRepositoryEngine.getRepository(id);

    if (!repo) {
      return NextResponse.json(
        { success: false, error: `Repository not found: ${id}` },
        { status: 404 }
      );
    }

    const reindexed = await GitHubRepositoryEngine.connectRepository({
      repoUrl: repo.repoUrl,
      branch: repo.branch,
    });

    return NextResponse.json({
      success: true,
      message: `Repository ${repo.name} successfully re-synced.`,
      repository: reindexed,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to re-sync repository" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const deleted = GitHubRepositoryEngine.disconnectRepository(id);

    return NextResponse.json({
      success: deleted,
      message: deleted
        ? `Repository ${id} successfully disconnected.`
        : `Repository ${id} was not found.`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to disconnect repository" },
      { status: 500 }
    );
  }
}

