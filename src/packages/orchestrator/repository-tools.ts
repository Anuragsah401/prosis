/**
 * @prosis/orchestrator - Repository Knowledge & Codebase Intelligence Tools
 * Equips the Prosis LLM Reasoning Engine with operations to search, inspect,
 * and reason over connected GitHub repositories (e.g. Seatbooking, Workforce, Prosis).
 */

import { z } from "zod";
import { ToolDefinition, ToolRegistry } from "../tools";
import { GitHubRepositoryEngine } from "../knowledge";
import { ToolExecutionService } from "./tool-execution-service";

export const queryRepositoryKnowledgeTool: ToolDefinition = {
  name: "repo_queryRepositoryKnowledge",
  productId: "prod_repositories",
  description:
    "Query and search code, architectural blueprints, endpoints, database schemas, and algorithms across connected GitHub repositories (e.g. Seatbooking). Use this whenever the user asks how a system works, what APIs exist, or asks about repository code.",
  inputSchema: z.object({
    query: z.string().describe("The search query or concept, e.g. 'reservations endpoint', 'table pacing algorithm', 'deposit escrow', 'database models'"),
    repoId: z.string().optional().describe("Optional repository identifier (e.g. 'repo_seatbooking_core')"),
  }),
  permissionsRequired: [],
  requiresApproval: false,
  auditMetadata: {
    category: "query",
    impactLevel: "low",
    reversible: true,
    resourceType: "repository_knowledge",
  },
  execute: async (rawInput: any) => {
    const input = rawInput as { query: string; repoId?: string };
    const results = GitHubRepositoryEngine.queryRepositoryKnowledge(input.query, input.repoId);
    return {
      query: input.query,
      resultsCount: results.length,
      knowledgeMatches: results,
    };
  },
};

export const listConnectedRepositoriesTool: ToolDefinition = {
  name: "repo_listConnectedRepositories",
  productId: "prod_repositories",
  description:
    "Lists all connected GitHub repositories, their tech stack, key capabilities, endpoints count, and indexing status.",
  inputSchema: z.object({}),
  permissionsRequired: [],
  requiresApproval: false,
  auditMetadata: {
    category: "query",
    impactLevel: "low",
    reversible: true,
    resourceType: "repository_list",
  },
  execute: async () => {
    const repos = GitHubRepositoryEngine.listRepositories();
    return {
      totalRepositories: repos.length,
      repositories: repos.map((r) => ({
        id: r.id,
        name: r.name,
        url: r.repoUrl,
        branch: r.branch,
        status: r.status,
        filesIndexed: r.filesIndexed,
        techStack: r.blueprint.techStack,
        keyCapabilities: r.blueprint.keyCapabilities,
        endpoints: r.blueprint.apiEndpoints,
        domainModels: r.blueprint.domainModels.map((m) => m.name),
      })),
    };
  },
};

export const inspectFileOrModuleTool: ToolDefinition = {
  name: "repo_inspectFileOrModule",
  productId: "prod_repositories",
  description:
    "Inspects a specific file or module path within a connected GitHub repository to view its summary and role in the architecture.",
  inputSchema: z.object({
    repoId: z.string().describe("Repository ID, e.g. 'repo_seatbooking_core'"),
    filePath: z.string().describe("Relative file path inside the repository, e.g. 'src/server/routes/reservations.ts'"),
  }),
  permissionsRequired: [],
  requiresApproval: false,
  auditMetadata: {
    category: "query",
    impactLevel: "low",
    reversible: true,
    resourceType: "repository_file",
  },
  execute: async (rawInput: any) => {
    const input = rawInput as { repoId: string; filePath: string };
    const repo = GitHubRepositoryEngine.getRepository(input.repoId);
    if (!repo) {
      return { error: `Repository '${input.repoId}' not found.` };
    }
    const file = repo.fileTree.find((f) => f.path.toLowerCase().includes(input.filePath.toLowerCase()));
    if (!file) {
      return {
        repoName: repo.name,
        error: `File '${input.filePath}' not found in repository tree.`,
        availableFiles: repo.fileTree.map((f) => f.path),
      };
    }
    return {
      repoName: repo.name,
      file,
      blueprint: repo.blueprint,
    };
  },
};

/**
 * Register tools into ToolRegistry and allowlist them in ToolExecutionService.
 */
export function initializeRepositoryTools(): void {
  ToolRegistry.register(queryRepositoryKnowledgeTool);
  ToolRegistry.register(listConnectedRepositoriesTool);
  ToolRegistry.register(inspectFileOrModuleTool);

  ToolExecutionService.allowTool("repo_queryRepositoryKnowledge");
  ToolExecutionService.allowTool("repo_listConnectedRepositories");
  ToolExecutionService.allowTool("repo_inspectFileOrModule");
}

// Auto-initialize on module load
initializeRepositoryTools();
