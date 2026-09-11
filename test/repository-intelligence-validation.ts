/**
 * Prosis-IT: GitHub Repository Knowledge Ingestion & Codebase Intelligence Test Suite
 * Validates:
 * 1. URL parsing & Git tree normalization
 * 2. High-fidelity architectural blueprint synthesis
 * 3. Semantic knowledge base & multi-tier memory ingestion
 * 4. Repository tools registration & production gateway execution
 * 5. End-to-end ProsisIt orchestrator reasoning over connected codebases
 */

import { GitHubRepositoryEngine } from "../src/packages/knowledge";
import { ToolExecutionService } from "../src/packages/orchestrator/tool-execution-service";
import { ProsisItOrchestrator } from "../src/packages/orchestrator/prosis-it/prosis-it-orchestrator";
import { AuthService } from "../src/packages/orchestrator/auth-service";
import { Knowledge } from "../src/packages/knowledge";
import { Memory } from "../src/packages/memory";
import "../src/packages/orchestrator/repository-tools";

let totalTests = 0;
let passedTests = 0;

function assert(condition: boolean, testName: string, details?: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✓ [PASS] ${testName}`);
  } else {
    console.error(`  ✗ [FAIL] ${testName}`);
    if (details) console.error(`     Details: ${details}`);
  }
}

export async function runRepoIntelligenceTests(): Promise<boolean> {
  totalTests = 0;
  passedTests = 0;
  console.log("\n=======================================================");
  console.log("PROSIS-IT: GITHUB REPOSITORY KNOWLEDGE TEST SUITE");
  console.log("=======================================================\n");

  // ─────────────────────────────────────────────────────────────────────────
  // PART 1: URL PARSING & NORMALIZATION
  // ─────────────────────────────────────────────────────────────────────────
  console.log("[Test 1] GitHub URL Parsing & Tree Normalization");
  const p1 = GitHubRepositoryEngine.parseGitHubUrl("https://github.com/prosis-ecosystem/seatbooking-core");
  assert(p1.isValid && p1.owner === "prosis-ecosystem" && p1.repo === "seatbooking-core", "Standard HTTPS GitHub URL parsed correctly");

  const p2 = GitHubRepositoryEngine.parseGitHubUrl("github.com/owner/custom-repo.git", "develop");
  assert(p2.isValid && p2.owner === "owner" && p2.repo === "custom-repo" && p2.branch === "develop", "Cleaned .git extension and custom branch");

  const p3 = GitHubRepositoryEngine.parseGitHubUrl("https://github.com/org/repo/tree/staging/subfolder");
  assert(p3.isValid && p3.branch === "staging", "Extracted branch from tree path URL");

  // ─────────────────────────────────────────────────────────────────────────
  // PART 2: SEEDED SEATBOOKING REPOSITORY BLUEPRINT
  // ─────────────────────────────────────────────────────────────────────────
  console.log("\n[Test 2] Default Seeded Repository Architecture Blueprint");
  const repos = GitHubRepositoryEngine.listRepositories();
  const seatbooking = repos.find((r) => r.name === "seatbooking-core");

  assert(!!seatbooking, "Seatbooking core repository is seeded and available");
  assert(seatbooking?.status === "ready", "Seatbooking status is 'ready'");
  assert((seatbooking?.filesIndexed || 0) > 0, `Seatbooking has indexed files (${seatbooking?.filesIndexed})`);
  assert(seatbooking?.blueprint.techStack.length! > 0, `Extracted tech stack (${seatbooking?.blueprint.techStack.join(", ")})`);
  assert(seatbooking?.blueprint.apiEndpoints.length! >= 3, `Discovered ${seatbooking?.blueprint.apiEndpoints.length} API endpoints`);
  assert(seatbooking?.blueprint.domainModels.length! >= 2, `Discovered domain models (${seatbooking?.blueprint.domainModels.map((m) => m.name).join(", ")})`);

  // ─────────────────────────────────────────────────────────────────────────
  // PART 3: CONNECTING NEW REPOSITORY
  // ─────────────────────────────────────────────────────────────────────────
  console.log("\n[Test 3] Connecting & Indexing New Repository");
  const newRepo = await GitHubRepositoryEngine.connectRepository({
    repoUrl: "https://github.com/Anuragsah401/prosis",
    branch: "main",
  });

  assert(newRepo.name === "prosis", "Connected new repository 'prosis'");
  assert(newRepo.status === "ready", "New repository transitioned to ready state");
  assert(newRepo.fileTree.length > 0, `File tree captured ${newRepo.fileTree.length} nodes`);

  // ─────────────────────────────────────────────────────────────────────────
  // PART 4: KNOWLEDGE BASE & MEMORY INGESTION
  // ─────────────────────────────────────────────────────────────────────────
  console.log("\n[Test 4] Knowledge Base & Memory Persistence");
  const kbMatches = Knowledge.query({
    query: "Seatbooking Blueprint",
    orgScope: "org_acme_corp",
    userPermissions: [],
  });
  assert(kbMatches.length > 0, `Knowledge Base contains Seatbooking documents (${kbMatches.length} matches)`);

  const memMatches = Memory.query({ type: "company_memory" });
  const repoMem = memMatches.find((m) => m.key?.includes("repo_blueprint"));
  assert(!!repoMem, "Multi-tier memory contains indexed repository blueprint");

  // ─────────────────────────────────────────────────────────────────────────
  // PART 5: REPOSITORY KNOWLEDGE QUERY RETRIEVAL
  // ─────────────────────────────────────────────────────────────────────────
  console.log("\n[Test 5] Direct Repository Knowledge Query Engine");
  const searchReservations = GitHubRepositoryEngine.queryRepositoryKnowledge("reservations endpoint");
  assert(searchReservations.length > 0, `Search for 'reservations endpoint' returned ${searchReservations.length} matches`);
  assert(searchReservations.some((m) => m.title.includes("reservations")), "Matched reservation route endpoint");

  const searchDeposit = GitHubRepositoryEngine.queryRepositoryKnowledge("deposit escrow");
  assert(searchDeposit.length > 0, `Search for 'deposit escrow' returned ${searchDeposit.length} matches`);

  // ─────────────────────────────────────────────────────────────────────────
  // PART 6: PRODUCTION GATEWAY TOOL EXECUTION
  // ─────────────────────────────────────────────────────────────────────────
  console.log("\n[Test 6] Tool Execution through Production Gateway");
  const director = AuthService.getDemoUsers()[0];
  const session = AuthService.login(director.email, "pass")!;

  // 6A. List repositories tool
  const listResult = await ToolExecutionService.execute({
    toolName: "repo_listConnectedRepositories",
    arguments: {},
    session,
  });
  assert(listResult.success, "repo_listConnectedRepositories executed successfully through gateway", listResult.error?.message);
  assert((listResult.data?.totalRepositories ?? 0) >= 2, `Discovered ${listResult.data?.totalRepositories} connected repositories via gateway`);

  // 6B. Query knowledge tool
  const queryResult = await ToolExecutionService.execute({
    toolName: "repo_queryRepositoryKnowledge",
    arguments: { query: "pacing and capacity bounds", repoId: "repo_seatbooking_core" },
    session,
  });
  assert(queryResult.success, "repo_queryRepositoryKnowledge executed successfully through gateway", queryResult.error?.message);
  assert((queryResult.data?.resultsCount ?? 0) > 0, `Knowledge match returned ${queryResult.data?.resultsCount} items`);

  // 6C. Inspect file tool
  const inspectResult = await ToolExecutionService.execute({
    toolName: "repo_inspectFileOrModule",
    arguments: { repoId: "repo_seatbooking_core", filePath: "reservations.ts" },
    session,
  });
  assert(inspectResult.success, "repo_inspectFileOrModule executed successfully through gateway", inspectResult.error?.message);
  assert(Boolean(inspectResult.data?.file?.path?.includes("reservations.ts")), "Found target file in repository tree");

  // ─────────────────────────────────────────────────────────────────────────
  // PART 7: END-TO-END PROSIS-IT ORCHESTRATOR REASONING
  // ─────────────────────────────────────────────────────────────────────────
  console.log("\n[Test 7] ProsisIt Orchestrator Codebase Query Reasoning");
  const orchestrator = new ProsisItOrchestrator();

  const aiResult = await orchestrator.orchestrate(
    "Explain the architecture of the Seatbooking repository and what endpoints it has",
    {
      user: session.user,
      organization: { ...session.organization, tenantId: session.organization.id },
      sessionId: "sess_test_repo",
      conversationId: "conv_test_repo",
      activeProduct: "seatbooking",
      activeVenue: "cantina_bella",
      autonomyLevel: 1,
      conversationHistory: [],
      previousToolResults: {},
      pendingApprovals: [],
    }
  );

  assert(aiResult.state === "COMPLETED", `Orchestrator completed turn (state: ${aiResult.state})`);
  assert(Boolean(aiResult.plan && aiResult.plan.steps.length > 0), `Plan executed ${aiResult.plan?.steps.length ?? 0} steps`);
  assert(
    Boolean(aiResult.plan?.steps.some((s) => s.toolName === "repo_queryRepositoryKnowledge")),
    "Orchestrator autonomously invoked 'repo_queryRepositoryKnowledge'"
  );
  assert(
    aiResult.response.toLowerCase().includes("seatbooking") || aiResult.response.toLowerCase().includes("reservations"),
    "Synthesized response accurately grounded in repository knowledge"
  );

  console.log("\n=======================================================");
  console.log(`REPOSITORY INTELLIGENCE VALIDATION: ${passedTests}/${totalTests} TESTS PASSED`);
  console.log("=======================================================\n");

  return passedTests === totalTests;
}

if (process.argv[1]?.includes("repository-intelligence-validation")) {
  runRepoIntelligenceTests().catch((err) => {
    console.error("Test execution exception:", err);
    process.exit(1);
  });
}
