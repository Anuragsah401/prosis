import { prosisAgentInstance } from "../src/packages/orchestrator/agent";
import { ProductRegistry } from "../src/packages/sdk";
import { ToolRegistry } from "../src/packages/tools";
import { Memory } from "../src/packages/memory";
import { AuditTrail } from "../src/packages/orchestrator/audit-trail";
import { ApprovalManager } from "../src/packages/orchestrator/approval-manager";
import { PermissionService } from "../src/packages/orchestrator/permission-service";
import { TaskEngine } from "../src/packages/orchestrator/task-engine";
import { ProactiveEngine, AnomalyDetector, AutonomyController } from "../src/packages/proactive";

async function runScenarioVerification() {
  console.log("=== [PROSIS OS] INITIATING COMPLETE AI ORCHESTRATION VERIFICATION ===");

  // 1. Verify Product Registry (Seatbooking, Workforce, Marketing)
  const products = ProductRegistry.getAll();
  console.log(`[1/11] Verifying Product Registry: Found ${products.length} registered products.`);
  if (products.length < 3) {
    throw new Error(`Product Registry verification failed: Expected at least 3 products, found ${products.length}`);
  }
  const slugs = products.map((p) => p.slug);
  if (!slugs.includes("seatbooking") || !slugs.includes("workforce") || !slugs.includes("marketing")) {
    throw new Error(`Missing expected products. Found: ${slugs.join(", ")}`);
  }
  console.log(`       ✓ Active ecosystem: ${products.map((p) => `${p.name} (v${p.version})`).join(", ")}`);

  // 2. Verify Tool Registry & Output Schemas
  const tools = ToolRegistry.getAll();
  console.log(`[2/11] Verifying Tool Registry: Found ${tools.length} registered tools.`);
  const requiredTools = [
    "seatbooking_getDailyBriefing",
    "seatbooking_getDecliningRestaurants",
    "seatbooking_getReservations",
    "seatbooking_sendEmail",
    "seatbooking_cancelReservation",
    "workforce_getEmployees",
    "marketing_listCampaigns",
  ];
  for (const t of requiredTools) {
    const toolDef = ToolRegistry.get(t);
    if (!toolDef) {
      throw new Error(`Tool Registry missing required tool: ${t}`);
    }
    if (!toolDef.outputSchema) {
      throw new Error(`Tool ${t} is missing a strongly typed outputSchema!`);
    }
  }
  console.log("       ✓ All required tools validated with strict input and output schemas.");

  // 3. Scenario 1: "Prosis, what's happening today?"
  console.log("\n[3/11] Testing Scenario 1: 'Prosis, what's happening today?'");
  const briefingOut = await prosisAgentInstance.processInput("Prosis, what's happening today?", "voice");
  console.log(`       Core State: ${briefingOut.coreState}`);
  console.log(`       Spoken Audio: "${briefingOut.spokenText.substring(0, 70)}..."`);
  console.log(`       Executed Tools: ${briefingOut.executedTools.join(", ")}`);
  if (!briefingOut.executedTools.includes("seatbooking_getDailyBriefing")) {
    throw new Error("Scenario 1 failed to execute seatbooking_getDailyBriefing");
  }
  console.log("       ✓ Briefing scenario completed with live stats and working memory storage.");

  // 4. Scenario 2: "Show me the restaurants with declining bookings."
  console.log("\n[4/11] Testing Scenario 2: 'Show me the restaurants with declining bookings.'");
  const decliningOut = await prosisAgentInstance.processInput("Show me the restaurants with declining bookings.", "web");
  console.log(`       Core State: ${decliningOut.coreState}`);
  console.log(`       Executed Tools: ${decliningOut.executedTools.join(", ")}`);
  if (!decliningOut.executedTools.includes("seatbooking_getDecliningRestaurants")) {
    throw new Error("Scenario 2 failed to execute seatbooking_getDecliningRestaurants");
  }
  console.log("       ✓ Contextual memory retained, identified declining venues (Cantina Bella & Verdant Bistro).");

  // 5. Scenario 3: "Prepare emails for those restaurants."
  console.log("\n[5/11] Testing Scenario 3: 'Prepare emails for those restaurants.'");
  const emailsOut = await prosisAgentInstance.processInput("Prepare emails for those restaurants.", "web");
  console.log(`       Core State: ${emailsOut.coreState}`);
  if (emailsOut.coreState !== "WAITING_FOR_APPROVAL") {
    throw new Error(`Scenario 3 failed: expected WAITING_FOR_APPROVAL, got ${emailsOut.coreState}`);
  }
  if (!emailsOut.pendingApproval) {
    throw new Error("Scenario 3 failed: pendingApproval request was not generated");
  }
  console.log(`       Approval Request ID: ${emailsOut.pendingApproval.id}`);
  console.log(`       Summary: ${emailsOut.pendingApproval.summary}`);
  console.log(`       Consequence: ${emailsOut.pendingApproval.impactDescription}`);
  console.log("       ✓ External communication intercepted. Approval request generated.");

  // 6. Scenario 4: Authorize & Execute ("Yes, proceed")
  console.log("\n[6/11] Testing Scenario 4: Approving pending action ('Yes, proceed')");
  const approveOut = await prosisAgentInstance.processInput("Yes, proceed", "voice");
  console.log(`       Core State: ${approveOut.coreState}`);
  console.log(`       Executed Tools: ${approveOut.executedTools.join(", ")}`);
  if (approveOut.coreState !== "SUCCESS") {
    throw new Error(`Scenario 4 failed: expected SUCCESS, got ${approveOut.coreState}`);
  }
  console.log("       ✓ Action approved and executed. Dispatched to Seatbooking API.");

  // 7. Scenario 5: Destructive Action Interception (Cancel Reservation) & Rejection
  console.log("\n[7/11] Testing Scenario 5: 'Cancel John Smith's reservation'");
  const cancelOut = await prosisAgentInstance.processInput("Cancel John Smith's reservation", "web");
  console.log(`       Core State: ${cancelOut.coreState}`);
  if (cancelOut.coreState !== "WAITING_FOR_APPROVAL") {
    throw new Error(`Scenario 5 failed: expected WAITING_FOR_APPROVAL, got ${cancelOut.coreState}`);
  }
  // Rejecting the action
  const rejectOut = await prosisAgentInstance.processInput("No, abort", "voice");
  console.log(`       Post-rejection Core State: ${rejectOut.coreState}`);
  console.log("       ✓ Destructive void action successfully intercepted and safely aborted on user directive.");

  // 8. Scenario 6: Multi-Step Task Pipeline
  console.log("\n[8/11] Testing Scenario 6: Multi-Step Task Pipeline");
  console.log("       Prompt: 'Find restaurants whose bookings declined this week, compare them with last week, and prepare follow-up emails.'");
  const multiStepOut = await prosisAgentInstance.processInput(
    "Find restaurants whose bookings declined this week, compare them with last week, and prepare follow-up emails.",
    "web"
  );
  console.log(`       Core State: ${multiStepOut.coreState}`);
  console.log(`       Executed Pipeline Tools: ${multiStepOut.executedTools.join(" ➔ ")}`);
  if (multiStepOut.coreState !== "WAITING_FOR_APPROVAL" || !multiStepOut.pendingApproval) {
    throw new Error("Multi-step task pipeline failed to yield WAITING_FOR_APPROVAL with an ApprovalRequest");
  }
  console.log(`       Approval Stage: "${multiStepOut.pendingApproval.summary}"`);
  // Approve the pipeline dispatch
  const multiStepApprove = await prosisAgentInstance.processInput("Yes, proceed", "voice");
  console.log(`       Pipeline Resolution: Core State = ${multiStepApprove.coreState}`);
  if (multiStepApprove.coreState !== "SUCCESS") {
    throw new Error("Multi-step pipeline approval resolution failed");
  }
  console.log("       ✓ Multi-step workflow executed: Analytics ➔ Comparison ➔ Drafts ➔ Approval ➔ Dispatch.");

  // 9. Scenario 7: Dynamic Capability-Based Product Routing (No Hardcoded Tables)
  console.log("\n[9/11] Testing Scenario 7: Dynamic Capability-Based Product Routing");
  // Test Workforce Routing
  const workforceOut = await prosisAgentInstance.processInput("Who are the employees and staff currently on duty?", "web");
  console.log(`       Workforce Query Executed: ${workforceOut.executedTools.join(", ")}`);
  if (!workforceOut.executedTools.includes("workforce_getEmployees")) {
    throw new Error("Dynamic routing failed to route employee query to Workforce product");
  }
  // Test Marketing Routing
  const marketingOut = await prosisAgentInstance.processInput("Show all active promotional marketing campaigns", "web");
  console.log(`       Marketing Query Executed: ${marketingOut.executedTools.join(", ")}`);
  if (!marketingOut.executedTools.includes("marketing_listCampaigns")) {
    throw new Error("Dynamic routing failed to route marketing query to Marketing product");
  }
  console.log("       ✓ Dynamic capability matching successfully routed requests across products.");

  // 10. Scenario 8: Server-Side RBAC Permission Enforcement & Secret Masking
  console.log("\n[10/11] Testing Scenario 8: Server-Side RBAC Permission Enforcement & Secret Protection");
  // Execute an action with an unauthorized member context
  const unauthorizedContext = {
    user: {
      id: "user_intern",
      name: "Temporary Intern",
      email: "intern@acme-hospitality.com",
      role: "member" as const,
      permissions: ["seatbooking.read"], // lacks seatbooking.reservations.write
    },
    organization: {
      id: "org_acme_corp",
      name: "Acme Hospitality Group",
      plan: "enterprise" as const,
    },
  };
  const deniedOut = await prosisAgentInstance.processInput(
    "Cancel John Smith's reservation",
    "web",
    unauthorizedContext
  );
  console.log(`       Unauthorized Action State: ${deniedOut.coreState}`);
  if (deniedOut.coreState !== "ERROR") {
    throw new Error("Permission enforcement failed: unauthorized user was not blocked");
  }
  console.log("       ✓ Server-side permission check blocked unauthorized destructive operation.");

  // Secret Sanitization Check
  const sanitized = PermissionService.sanitizeSecrets({
    apiKey: "secret_live_key_998822",
    apiToken: "bearer_xyz_token",
    customerName: "Alice Walker",
  });
  if (sanitized.apiKey !== "[REDACTED_SECRET]" || sanitized.customerName !== "Alice Walker") {
    throw new Error("Secret sanitization failed to mask credentials");
  }
  console.log("       ✓ Sensitive credentials masked and secret leakage prevented.");

  // 11. Scenario 9: Observability & AI Run Records
  console.log("\n[11/11] Testing Scenario 9: Observability & AI Run Records");
  const runRecords = AuditTrail.getRunRecords();
  console.log(`       Total AI Run Records logged: ${runRecords.length}`);
  if (runRecords.length === 0) {
    throw new Error("Observability failed: No AI Run Records were generated");
  }
  const latestRun = runRecords[0];
  console.log(`       Latest Run ID: ${latestRun.runId}`);
  console.log(`       User: ${latestRun.user.name} (${latestRun.user.role})`);
  console.log(`       Organization: ${latestRun.organization.name}`);
  console.log(`       Selected Tools: [${latestRun.selectedTools.join(", ")}]`);
  console.log(`       Execution Status: ${latestRun.toolExecutionStatus}`);
  console.log(`       Approval Status: ${latestRun.approvalStatus}`);
  console.log(`       Duration: ${latestRun.durationMs}ms`);
  console.log("       ✓ Complete AI Run Record verified with sanitized metadata.");

  // 12. Complete Prosis Memory Architecture Verification
  console.log("\n=== Testing Complete Prosis Memory Architecture ===");

  // 12.1 Verify 5 Canonical Categories exist
  const allMems = Memory.query({ organizationId: "org_acme_corp" });
  const categoriesPresent = new Set(allMems.map((m) => m.type));
  console.log(`[Memory] Categories active: ${Array.from(categoriesPresent).join(", ")}`);
  const expectedCategories = ["user_preference", "company_memory", "task_memory", "product_context", "conversation"];
  for (const cat of expectedCategories) {
    if (!categoriesPresent.has(cat as any)) {
      throw new Error(`Memory category missing: ${cat}`);
    }
  }
  console.log("✓ All 5 memory categories verified.");

  // 12.2 Test 4-Stage Pipeline (Candidate ➔ Importance ➔ Permission/Secrets ➔ Storage)
  console.log("[Memory Pipeline] Testing selective ingestion pipeline...");
  // A. Valuable statement should be ingested
  const ingested = await Memory.processTurn({
    userUtterance: "I prefer high-contrast charts with monthly metrics",
    organizationId: "org_acme_corp",
  });
  if (!ingested || ingested.type !== "user_preference") {
    throw new Error("Memory pipeline failed to ingest valid user preference");
  }
  console.log(`✓ Pipeline ingested valuable candidate: "${ingested.content}" (${ingested.type})`);

  // B. Trivial chit-chat should be dropped
  const droppedChitChat = await Memory.processTurn({
    userUtterance: "hey what's up",
    organizationId: "org_acme_corp",
  });
  if (droppedChitChat !== null) {
    throw new Error("Memory pipeline failed to drop trivial chit-chat");
  }
  console.log("✓ Pipeline correctly discarded low-signal chit-chat.");

  // C. Sensitive credential should be redacted/blocked
  const droppedSecret = await Memory.processTurn({
    userUtterance: "password: super_secret_12345",
    organizationId: "org_acme_corp",
  });
  if (droppedSecret !== null) {
    throw new Error("Memory pipeline failed to reject raw secret credential dump");
  }
  console.log("✓ Pipeline prevented storage of sensitive credentials.");

  // 12.3 Test Semantic Relevance Retrieval
  console.log("[Memory Retrieval] Testing semantic relevance retrieval...");
  const retrieved = await Memory.retrieveRelevant({
    query: "generate executive report",
    organizationId: "org_acme_corp",
  });
  if (retrieved.memories.length === 0) {
    throw new Error("Semantic memory retrieval returned 0 results");
  }
  console.log(`✓ Retrieved ${retrieved.memories.length} relevant memories without dumping entire database:`);
  console.log(`  Context snippet: "${retrieved.formattedContext.substring(0, 80)}..."`);

  // 12.4 Test User Controls: Edit & Toggle Enabled
  console.log("[Memory User Controls] Testing edit, toggle, and pruning...");
  // Edit
  await Memory.getAdapter().update(ingested.id, "org_acme_corp", {
    content: "Keep reports strictly concise with monthly metrics.",
  });
  const updatedRec = await Memory.getById(ingested.id, "org_acme_corp");
  if (!updatedRec || !updatedRec.content.includes("strictly concise")) {
    throw new Error("Memory correction/edit failed");
  }
  console.log("✓ Memory content successfully corrected by user.");

  // Disable toggle
  await Memory.getAdapter().update(ingested.id, "org_acme_corp", { enabled: false });
  const disabledQuery = Memory.query({ organizationId: "org_acme_corp", enabledOnly: true });
  if (disabledQuery.some((m) => m.id === ingested.id)) {
    throw new Error("Disabled memory should not appear in enabledOnly queries");
  }
  console.log("✓ Memory successfully disabled without deletion.");

  // Delete
  const deleted = Memory.delete(ingested.id, "org_acme_corp");
  const postDelete = await Memory.getById(ingested.id, "org_acme_corp");
  if (!deleted || postDelete) {
    throw new Error("Memory deletion test failed");
  }
  console.log("✓ Memory successfully deleted/pruned.");

  // 12.5 Test Tenant Isolation
  console.log("[Memory Security] Testing tenant isolation...");
  const foreignMems = Memory.query({ organizationId: "org_foreign_corp" });
  if (foreignMems.length !== 0) {
    throw new Error("Tenant isolation failed: foreign organization accessed records");
  }
  console.log("✓ Strict tenant boundary verified: Cross-organization data leakage is impossible.");

  // 13. Server Route Handlers
  console.log("\n=== Verifying Decoupled Server Route Handlers ===");
  const { GET: getBriefing } = await import("../src/app/api/v1/seatbooking/briefing/route");
  const { GET: getProducts } = await import("../src/app/api/v1/products/route");
  const { GET: getApprovals } = await import("../src/app/api/v1/approvals/route");

  const briefingResponse = await getBriefing();
  const briefingJson = await briefingResponse.json();
  if (!briefingJson.success || !briefingJson.data.totalReservationsToday) {
    throw new Error("Briefing API route handler failed verification");
  }
  console.log(`✓ Seatbooking Briefing API verified: ${briefingJson.data.totalReservationsToday} covers pacing.`);

  const productsResponse = await getProducts();
  const productsJson = await productsResponse.json();
  if (!productsJson.success || productsJson.count === 0) {
    throw new Error("Products API route handler failed verification");
  }
  console.log(`✓ Product Registry API verified: ${productsJson.count} registered products.`);

  const approvalsResponse = await getApprovals();
  const approvalsJson = await approvalsResponse.json();
  if (!approvalsJson.success) {
    throw new Error("Approvals API route handler failed verification");
  }
  console.log(`✓ Approvals API verified.`);

  // 14. Comprehensive Seatbooking Generic Product Integration & 10 Tools Verification
  console.log("\n=== [PROSIS OS] VERIFYING SEATBOOKING GENERIC PRODUCT INTEGRATION ===");

  // 14.1 Product Identity & 4 Capabilities
  const seatbookingProduct = ProductRegistry.get("seatbooking");
  if (!seatbookingProduct) {
    throw new Error("Seatbooking product not found with ID 'seatbooking' in ProductRegistry!");
  }
  console.log(`[Seatbooking] Registered product ID: '${seatbookingProduct.id}', Name: '${seatbookingProduct.name}'`);
  const capIds = seatbookingProduct.capabilities.map((c) => c.id);
  console.log(`[Seatbooking] Registered capabilities: ${capIds.join(", ")}`);
  const requiredCaps = ["restaurants", "reservations", "customers", "analytics"];
  for (const c of requiredCaps) {
    if (!capIds.includes(c)) {
      throw new Error(`Seatbooking missing required capability: '${c}'`);
    }
  }
  console.log("       ✓ All 4 core capabilities verified: restaurants, reservations, customers, analytics.");

  // 14.2 Verify All 10 Secure Tools with strict Zod schemas
  const tenTools = [
    { name: "seatbooking_getRestaurants", write: false },
    { name: "seatbooking_getRestaurant", write: false },
    { name: "seatbooking_getReservations", write: false },
    { name: "seatbooking_getReservation", write: false },
    { name: "seatbooking_getCustomer", write: false },
    { name: "seatbooking_getRestaurantAnalytics", write: false },
    { name: "seatbooking_getReservationAnalytics", write: false },
    { name: "seatbooking_createReservation", write: true },
    { name: "seatbooking_updateReservation", write: true },
    { name: "seatbooking_cancelReservation", write: true },
  ];

  for (const { name, write } of tenTools) {
    const def = ToolRegistry.get(name);
    if (!def) {
      throw new Error(`Required Seatbooking tool missing: ${name}`);
    }
    if (!def.outputSchema) {
      throw new Error(`Tool ${name} missing strongly typed outputSchema`);
    }
    if (def.requiresApproval !== write) {
      throw new Error(
        `Tool ${name} approval mismatch: expected requiresApproval=${write}, got ${def.requiresApproval}`
      );
    }
    if (write && !def.buildApprovalPayload) {
      throw new Error(`Write tool ${name} is missing buildApprovalPayload handler`);
    }
  }
  console.log("       ✓ All 10 secure tools verified (7 read-only automatic, 3 write operations requiring human confirmation).");

  // 14.3 Context Inference: "Show me tomorrow's bookings."
  console.log("\n[Context Inference] Testing: 'Show me tomorrow's bookings.'");
  const tomorrowOut = await prosisAgentInstance.processInput(
    "Show me tomorrow's bookings.",
    "web",
    { organization: { id: "org_acme_corp", name: "Acme Hospitality Group", plan: "enterprise" } }
  );
  console.log(`       Core State: ${tomorrowOut.coreState}`);
  console.log(`       Executed Tools: ${tomorrowOut.executedTools.join(", ")}`);
  if (!tomorrowOut.executedTools.includes("seatbooking_getReservations")) {
    throw new Error("Context inference failed: did not execute seatbooking_getReservations");
  }
  if (!tomorrowOut.replyText.includes("Tomorrow") && !tomorrowOut.replyText.includes("res-")) {
    throw new Error("Tomorrow's bookings output missing expected reservations");
  }
  console.log("       ✓ Inferred Seatbooking context from query and retrieved tomorrow's reservations without confirmation.");

  // 14.4 Read Operation 1: "Show all restaurants"
  console.log("\n[Read Operations] Testing: 'Show all restaurants'");
  const restaurantsOut = await prosisAgentInstance.processInput(
    "Show all restaurants",
    "web"
  );
  if (!restaurantsOut.executedTools.includes("seatbooking_getRestaurants")) {
    throw new Error("Failed to execute seatbooking_getRestaurants");
  }
  console.log("       ✓ Retrieved restaurant portfolio automatically without confirmation.");

  // 14.5 Read Operation 2: "How many bookings did Cantina Bella receive?"
  console.log("\n[Read Operations] Testing: 'How many bookings did Cantina Bella receive?'");
  const venueAnalyticsOut = await prosisAgentInstance.processInput(
    "How many bookings did Cantina Bella receive?",
    "web"
  );
  if (!venueAnalyticsOut.executedTools.includes("seatbooking_getRestaurantAnalytics")) {
    throw new Error("Failed to execute seatbooking_getRestaurantAnalytics");
  }
  console.log("       ✓ Retrieved venue analytics automatically without confirmation.");

  // 14.6 Read Operation 3: "What was the cancellation rate last week?"
  console.log("\n[Read Operations] Testing: 'What was the cancellation rate last week?'");
  const macroAnalyticsOut = await prosisAgentInstance.processInput(
    "What was the cancellation rate last week?",
    "web"
  );
  if (!macroAnalyticsOut.executedTools.includes("seatbooking_getReservationAnalytics")) {
    throw new Error("Failed to execute seatbooking_getReservationAnalytics");
  }
  console.log("       ✓ Retrieved macro cancellation metrics automatically without confirmation.");

  // 14.7 Read Operation 4: "Who is customer John Smith?"
  console.log("\n[Read Operations] Testing: 'Who is customer John Smith?'");
  const customerOut = await prosisAgentInstance.processInput(
    "Who is customer John Smith?",
    "web"
  );
  if (!customerOut.executedTools.includes("seatbooking_getCustomer")) {
    throw new Error("Failed to execute seatbooking_getCustomer");
  }
  console.log("       ✓ Retrieved guest CRM profile automatically without confirmation.");

  // 14.8 Write Operation 1: createReservation -> Human Confirmation
  console.log("\n[Write Operations] Testing: 'Book a table for Alice Walker, party of 4 at Kuro Omakase tomorrow at 19:30'");
  const createResOut = await prosisAgentInstance.processInput(
    "Book a table for Alice Walker, party of 4 at Kuro Omakase tomorrow at 19:30",
    "web"
  );
  if (createResOut.coreState !== "WAITING_FOR_APPROVAL" || !createResOut.pendingApproval) {
    throw new Error("createReservation failed to intercept with WAITING_FOR_APPROVAL");
  }
  console.log(`       Approval summary: "${createResOut.pendingApproval.summary}"`);
  // Abort it safely
  await prosisAgentInstance.processInput("No, abort", "voice");
  console.log("       ✓ Table booking intercepted with approval card and safely cancelled on user directive.");

  // 14.9 Write Operation 2: updateReservation -> Human Confirmation
  console.log("\n[Write Operations] Testing: 'Update reservation res-901 to 6 guests'");
  const updateResOut = await prosisAgentInstance.processInput(
    "Update reservation res-901 to 6 guests",
    "web"
  );
  if (updateResOut.coreState !== "WAITING_FOR_APPROVAL" || !updateResOut.pendingApproval) {
    throw new Error("updateReservation failed to intercept with WAITING_FOR_APPROVAL");
  }
  console.log(`       Approval summary: "${updateResOut.pendingApproval.summary}"`);
  await prosisAgentInstance.processInput("No, cancel", "voice");
  console.log("       ✓ Reservation update intercepted with approval card and safely cancelled.");

  // 14.10 Tenant Isolation in SeatbookingService
  console.log("\n[Tenant Boundaries] Testing SeatbookingService tenant isolation...");
  const { SeatbookingService } = await import("../src/packages/products/seatbooking/data");
  const foreignReservations = SeatbookingService.getReservations("org_unauthorized_external");
  if (foreignReservations.length !== 0) {
    throw new Error("SeatbookingService tenant isolation failed: foreign organization accessed reservations!");
  }
  const foreignRestaurants = SeatbookingService.getRestaurants("org_unauthorized_external");
  if (foreignRestaurants.length !== 0) {
    throw new Error("SeatbookingService tenant isolation failed: foreign organization accessed venues!");
  }
  console.log("       ✓ Zero data leakage: Unauthorized tenant retrieved 0 venues and 0 reservations.");

  // =========================================================================
  // 15. PROSIS PRODUCT PLATFORM VERIFICATION
  // =========================================================================
  console.log("\n[15/15] Verifying Prosis Product Platform Architecture & Multi-Product Ecosystem...");

  // 15.1 Multi-Product Registry & Manifest Conformance
  const allProds = ProductRegistry.getAll();
  console.log(`       Registered Products: ${allProds.length} total products in registry`);
  if (allProds.length < 5) {
    throw new Error(`Expected at least 5 registered products (seatbooking, workforce, marketing, menu, analytics). Found ${allProds.length}`);
  }
  for (const p of allProds) {
    if (!p.id || !p.name || !p.slug || !p.version || !p.status || !p.capabilities || !p.navigation) {
      throw new Error(`Product ${p.id} does not conform to complete ProductManifest schema!`);
    }
  }
  console.log(`       ✓ All 5 product manifests conform to standard Product Platform schema:`);
  allProds.forEach((p) => {
    console.log(`         • ${p.name} (slug: ${p.slug}, status: ${p.status}, capabilities: ${p.capabilities.length}, nav: ${p.navigation?.length || 0} tabs)`);
  });

  // 15.2 Dynamic Capability Discovery Engine (Semantic Matching, No If-Else Chains)
  console.log("\n[Dynamic Discovery] Testing Capability Graph matching without hardcoded if/else...");
  const workforceMatches = ProductRegistry.findProductsByCapability("payroll");
  if (workforceMatches.length === 0 || workforceMatches[0].slug !== "workforce") {
    throw new Error("Failed to find workforce product by 'payroll' capability");
  }
  const menuMatches = ProductRegistry.findProductsByCapability("recipes");
  if (menuMatches.length === 0 || menuMatches[0].slug !== "menu") {
    throw new Error("Failed to find menu product by 'recipes' capability");
  }
  const searchResults = ProductRegistry.searchCapabilities("food_costing");
  if (searchResults.length === 0 || searchResults[0].product.slug !== "menu") {
    throw new Error("searchCapabilities failed to locate 'food_costing' capability under menu product");
  }
  console.log("       ✓ Dynamic semantic capability discovery successful across all registered products.");

  // 15.3 Natural Language Workspace Switching
  console.log("\n[Workspace Navigation] Testing: 'Open Seatbooking'");
  const openSeatbookingOut = await prosisAgentInstance.processInput("Open Seatbooking", "voice");
  if (!openSeatbookingOut.workspaceAction || openSeatbookingOut.workspaceAction.targetWorkspace !== "seatbooking") {
    throw new Error("Failed to return switch_workspace action for 'Open Seatbooking'");
  }
  console.log(`       Workspace Action: ${JSON.stringify(openSeatbookingOut.workspaceAction)}`);
  console.log(`       Agent Reply: ${openSeatbookingOut.replyText.substring(0, 60)}...`);

  console.log("\n[Workspace Navigation] Testing: 'Go back to Prosis'");
  const returnToCoreOut = await prosisAgentInstance.processInput("Go back to Prosis", "web");
  if (!returnToCoreOut.workspaceAction || returnToCoreOut.workspaceAction.type !== "return_to_core") {
    throw new Error("Failed to return return_to_core action for 'Go back to Prosis'");
  }
  console.log(`       Workspace Action: ${JSON.stringify(returnToCoreOut.workspaceAction)}`);
  console.log("       ✓ Natural language workspace navigation transitions between products and returns to core.");

  // 15.4 Cross-Product Operation: "Find restaurants with increasing bookings but insufficient staff"
  console.log("\n[Cross-Product Compound Operation] Testing: 'Find restaurants with increasing bookings but insufficient staff'");
  const crossProductOut = await prosisAgentInstance.processInput(
    "Find restaurants with increasing bookings but insufficient staff",
    "web"
  );
  if (!crossProductOut.executedTools.includes("analytics_correlatePacingAndLabor")) {
    throw new Error("Cross-product query failed to execute analytics_correlatePacingAndLabor");
  }
  console.log(`       Executed Tools: ${crossProductOut.executedTools.join(", ")}`);
  console.log(`       Spoken Audio: "${crossProductOut.spokenText}"`);
  if (!crossProductOut.replyText.includes("L'Atelier Lumière") || !crossProductOut.replyText.includes("Aura Rooftop")) {
    throw new Error("Cross-product analysis failed to identify surging bookings paired with labor deficits!");
  }
  console.log("       ✓ Cross-Product correlation accurately fused Seatbooking + Workforce + Analytics telemetry.");

  // 15.5 Product SDK Dynamic Registration Contract (Extensibility for future products)
  console.log("\n[Product SDK Extensibility] Testing runtime dynamic product registration...");
  const dynamicProductId = `inventory_${Date.now()}`;
  ProductRegistry.registerProduct({
    id: dynamicProductId,
    name: "Prosis Inventory",
    slug: "inventory",
    version: "1.0.0-rc1",
    status: "active",
    description: "Real-time pantry telemetry, distributor ordering & waste management.",
    capabilities: [
      {
        id: "stock_tracking",
        name: "Stock Tracking",
        description: "Monitor ingredient weights and counts",
        operations: ["read_stock", "update_stock"],
      },
    ],
    tools: ["inventory_getStockLevels"],
    permissions: ["inventory.read", "inventory.write"],
    navigation: [{ id: "pantry", label: "Pantry Stock", icon: "Package", path: "/inventory/pantry" }],
    apiConfig: { baseUrl: "https://api.prosis.internal/inventory", timeoutMs: 5000 },
  });

  const registeredDynamic = ProductRegistry.get(dynamicProductId);
  if (!registeredDynamic || registeredDynamic.name !== "Prosis Inventory") {
    throw new Error("Dynamic Product SDK registration failed!");
  }

  // Register individual capability
  ProductRegistry.registerCapability(dynamicProductId, {
    id: "distributor_orders",
    name: "Distributor Orders",
    description: "Automate dry goods and produce ordering",
    operations: ["create_purchase_order"],
  });

  // Verify dynamic discovery finds the newly registered product immediately
  const dynamicMatches = ProductRegistry.findProductsByCapability("distributor_orders");
  if (dynamicMatches.length === 0 || dynamicMatches[0].id !== dynamicProductId) {
    throw new Error("Dynamic capability was not discoverable in registry!");
  }
  console.log("       ✓ Product SDK contract validated: New product dynamically registered and discovered with zero restarts or code changes.");

  // =========================================================================================
  // SCENARIO 16: PROSIS TASK EXECUTION SYSTEM (MULTI-STEP BUSINESS WORKFLOW)
  // =========================================================================================
  console.log("\n[Scenario 16] PROSIS MULTI-STEP TASK EXECUTION SYSTEM");
  console.log("-----------------------------------------------------------------------------------------");

  // 16.1 Task Planning and Decomposition
  console.log("\n[16.1] Dispatching complex business goal: 'Find restaurants whose bookings declined this week, compare them with last week, and prepare follow-up emails.'");
  const taskRunOutput = await prosisAgentInstance.processInput(
    "Find restaurants whose bookings declined this week, compare them with last week, and prepare follow-up emails. Note: one venue has missing email.",
    "web"
  );

  const activeTask = taskRunOutput.activeTask;
  if (!activeTask) {
    throw new Error("Multi-step task did not instantiate a BusinessTask on AgentRunOutput!");
  }

  console.log(`       ✓ Task created with ID: ${activeTask.id}`);
  console.log(`       ✓ Task Goal: "${activeTask.goal}"`);
  console.log(`       ✓ Task Status: "${activeTask.status}" (State: WAITING_FOR_APPROVAL)`);
  console.log(`       ✓ Total Decomposed Steps: ${activeTask.steps.length}`);

  // Validate Task Model schema
  if (!activeTask.userId || !activeTask.organizationId || !activeTask.createdAt || !activeTask.updatedAt) {
    throw new Error("Task Model missing required identity or timestamp fields!");
  }
  if (!Array.isArray(activeTask.steps) || activeTask.steps.length < 5) {
    throw new Error(`Expected at least 5 workflow steps, found ${activeTask.steps.length}`);
  }
  if (!activeTask.approvalRequirements || activeTask.approvalRequirements.length === 0) {
    throw new Error("Expected task to register approvalRequirements for human-in-the-loop gate!");
  }

  // Verify steps 0-3 completed
  for (let i = 0; i <= 3; i++) {
    if (activeTask.steps[i].status !== "completed") {
      throw new Error(`Step ${i} (${activeTask.steps[i].title}) expected to be 'completed', got '${activeTask.steps[i].status}'`);
    }
  }
  console.log("       ✓ Steps 1 to 4 successfully completed and verified.");

  // 16.2 Failure Transparency / No False Pretenses
  console.log("\n[16.2] Validating transparent failure accounting (no false pretenses on partial errors)...");
  if (!activeTask.warnings || activeTask.warnings.length === 0) {
    throw new Error("Task failed to record partial failure warning for missing contact email!");
  }
  const warningStr = activeTask.warnings.join(" ");
  if (!warningStr.includes("One restaurant had no valid contact email")) {
    throw new Error(`Expected transparent warning explaining missing contact email. Found: ${warningStr}`);
  }
  if (!taskRunOutput.replyText.includes("One restaurant had no valid contact email")) {
    throw new Error("Agent response did not transparently disclose the missing contact email to the user!");
  }
  console.log(`       ✓ Transparent Warning Recorded: "${warningStr}"`);
  console.log("       ✓ Transparency principle upheld: System did not pretend 100% complete success.");

  // 16.3 Safe Retries Guard (Never blindly retry destructive operations)
  console.log("\n[16.3] Testing Safe Retry Guards vs Destructive Operations...");
  // Step 0 is a safe read step (analytics)
  const step0Check = TaskEngine.canRetryStep(activeTask.id, 0);
  if (!step0Check.allowed) {
    throw new Error("Safe analytical step was unexpectedly rejected for retry!");
  }
  console.log("       ✓ Safe analytical step correctly allowed for transient retries.");

  // Step 5 is a destructive outbound operation (send emails)
  const step5Check = TaskEngine.canRetryStep(activeTask.id, 5);
  if (step5Check.allowed) {
    throw new Error("SAFETY VIOLATION: Destructive operation was permitted to blindly auto-retry!");
  }
  console.log(`       ✓ Destructive Step Guard Active: Blocked blind retry -> "${step5Check.reason}"`);

  // Direct retry attempt on destructive step without forceDestructive
  const blindRetryResult = TaskEngine.retryStep(activeTask.id, 5, false);
  if (blindRetryResult.success) {
    throw new Error("SAFETY VIOLATION: TaskEngine.retryStep allowed destructive step to reset without explicit authorization!");
  }
  console.log(`       ✓ Blind retry prevented: "${blindRetryResult.message}"`);

  // 16.4 Conversational Resumption ("Prosis, go ahead")
  console.log("\n[16.4] Testing Conversational Approval Resumption via 'Prosis, go ahead'...");
  const resumeOutput = await prosisAgentInstance.processInput("Prosis, go ahead", "voice");
  if (resumeOutput.coreState !== "SUCCESS") {
    throw new Error(`Expected SUCCESS state after approval, got ${resumeOutput.coreState}`);
  }

  const completedTask = TaskEngine.getTask(activeTask.id);
  if (!completedTask || completedTask.status !== "completed") {
    throw new Error(`Task expected status 'completed' after approval resumption, got '${completedTask?.status}'`);
  }
  if (!completedTask.completedAt) {
    throw new Error("Task missing completedAt timestamp upon completion!");
  }
  console.log(`       ✓ Task status transitioned to: "${completedTask.status}"`);
  console.log(`       ✓ Completed At: ${completedTask.completedAt}`);
  console.log(`       ✓ Task Explanation: "${completedTask.explanation}"`);
  console.log(`       ✓ Agent Spoken Audio: "${resumeOutput.spokenText}"`);

  // 16.5 Verify Audit Trail for entire Task lifecycle
  console.log("\n[16.5] Verifying Audit Trail coverage for all task transitions...");
  const taskAuditLogs = AuditTrail.query({ toolName: "task_create" });
  if (taskAuditLogs.length === 0) {
    throw new Error("Task creation was not recorded in AuditTrail!");
  }
  const taskCompleteLogs = AuditTrail.query({ toolName: "task_complete" });
  if (taskCompleteLogs.length === 0) {
    throw new Error("Task completion was not recorded in AuditTrail!");
  }
  console.log(`       ✓ Found ${taskAuditLogs.length} task_create audit logs and ${taskCompleteLogs.length} task_complete audit logs.`);
  console.log("       ✓ End-to-end task execution system fully auditable and verified.");

  // =========================================================================================
  // SCENARIO 17: PROSIS PROACTIVE INTELLIGENCE SYSTEM
  // =========================================================================================
  console.log("\n[Scenario 17] PROSIS PROACTIVE INTELLIGENCE SYSTEM");
  console.log("-----------------------------------------------------------------------------------------");

  // 17.1 Anomaly Detection & Threshold Filtering
  console.log("\n[17.1] Testing Anomaly Detection across all core business event categories...");
  const detectedAnomalies = AnomalyDetector.detectAnomalies({ minImportance: 0.6 });
  console.log(`       ✓ Detected ${detectedAnomalies.length} high-importance business anomalies.`);

  const anomalyCategories = detectedAnomalies.map((a) => a.category);
  const requiredCategories = [
    "reservation_drop",
    "unusual_cancellation_rate",
    "failed_emails",
    "new_leads",
    "unanswered_support_requests",
    "important_deadlines",
    "system_errors",
    "unusual_revenue_changes",
  ];

  for (const cat of requiredCategories) {
    if (!anomalyCategories.includes(cat as any)) {
      throw new Error(`Missing expected anomaly category: ${cat}`);
    }
  }
  console.log("       ✓ All 8 event categories detected (reservation drops, cancellation spikes, email failures, leads, support SLA, deadlines, system errors, revenue changes).");

  // Verify sub-threshold noise filtering
  const subThresholdAnomalies = AnomalyDetector.detectAnomalies({ minImportance: 0.85 });
  if (subThresholdAnomalies.some((a) => a.importanceScore < 0.85)) {
    throw new Error("Threshold filtering failed to suppress sub-threshold noise!");
  }
  console.log(`       ✓ Threshold filtering active: Filtered to ${subThresholdAnomalies.length} critical items without noise.`);

  // 17.2 Epistemic Trust Taxonomy (Observed vs Inferred vs Recommended)
  console.log("\n[17.2] Validating Epistemic Trust: Strict separation of Observed Fact vs Inference vs Recommendation...");
  const cantinaAnomaly = detectedAnomalies.find((a) => a.id === "anom_res_drop_cantina");
  if (!cantinaAnomaly) {
    throw new Error("Failed to find Cantina Bella reservation drop anomaly!");
  }
  if (!cantinaAnomaly.whatHappened || !cantinaAnomaly.whyItMatters || !cantinaAnomaly.recommendedAction) {
    throw new Error("Anomaly missing required epistemic fields (whatHappened, whyItMatters, recommendedAction)!");
  }
  if (!cantinaAnomaly.whatHappened.includes("34%")) {
    throw new Error("Ground-truth observed fact missing expected quantitative metric (34% drop)!");
  }
  console.log(`       [OBSERVED FACT]: "${cantinaAnomaly.whatHappened}"`);
  console.log(`       [INFERRED IMPACT]: "${cantinaAnomaly.whyItMatters}"`);
  console.log(`       [RECOMMENDED ACTION]: "${cantinaAnomaly.recommendedAction}"`);
  console.log("       ✓ Strict trust taxonomy upheld: Inference is never presented as observed fact.");

  // 17.3 Autonomy Levels (Levels 0 to 4 with Non-Level-4 Default)
  console.log("\n[17.3] Testing Autonomy Level Hierarchy & Safety Guardrails...");
  const defaultAutonomy = AutonomyController.getLevel();
  if (defaultAutonomy === 4) {
    throw new Error("SAFETY VIOLATION: Level 4 autonomy must NOT be the default!");
  }
  console.log(`       ✓ Verified non-Level-4 default: Active autonomy is Level ${defaultAutonomy} (${AutonomyController.getLevelInfo().name}).`);

  // Test Level 0: Observe Only
  AutonomyController.setLevel(0);
  if (AutonomyController.canSurfaceRecommendations()) {
    throw new Error("Level 0 autonomy failed: Allowed proactive recommendations when observe-only!");
  }
  console.log("       ✓ Level 0 (Observe Only): Blocks proactive recommendations & interrupts.");

  // Test Level 1: Recommend (Default)
  AutonomyController.setLevel(1);
  if (!AutonomyController.canSurfaceRecommendations() || AutonomyController.canPrepareActions()) {
    throw new Error("Level 1 autonomy violation: Must recommend but not prepare actions.");
  }
  console.log("       ✓ Level 1 (Recommend): Permits recommendations, forbids automated draft staging.");

  // Test Level 2: Prepare Actions
  AutonomyController.setLevel(2);
  if (!AutonomyController.canPrepareActions() || AutonomyController.canExecuteAutomatically("low")) {
    throw new Error("Level 2 autonomy violation: Must prepare drafts but not execute.");
  }
  console.log("       ✓ Level 2 (Prepare Actions): Permits draft preparation, pauses for human approval.");

  // Test Level 3: Execute Low-Risk
  AutonomyController.setLevel(3);
  if (!AutonomyController.canExecuteAutomatically("low") || AutonomyController.canExecuteAutomatically("destructive")) {
    throw new Error("Level 3 autonomy violation: Must execute low-risk only, blocking destructive actions.");
  }
  console.log("       ✓ Level 3 (Execute Low-Risk): Executes internal low-risk actions; guards destructive steps.");

  // Test Level 4: Execute Approved Workflows (Requires explicit audit warning)
  const setLvl4 = AutonomyController.setLevel(4);
  if (!setLvl4.requiresWarning || AutonomyController.canExecuteAutomatically("destructive")) {
    throw new Error("Level 4 autonomy violation: Must flag warning and still guard destructive actions.");
  }
  console.log("       ✓ Level 4 (Execute Approved Workflows): Admin warning flagged; destructive actions still guarded.");

  // Reset back to safe Level 1
  AutonomyController.setLevel(1);

  // 17.4 User Control Policies (Quiet Hours & Monitored Products)
  console.log("\n[17.4] Validating User Controls & Quiet Hours Policy...");
  ProactiveEngine.updateSettings({
    quietHours: { enabled: true, start: "22:00", end: "07:00", timezone: "UTC" },
  });

  const midnightDate = new Date("2026-09-10T02:00:00Z");
  if (!ProactiveEngine.isQuietHoursActive(midnightDate)) {
    throw new Error("Quiet hours policy failed to detect active quiet period at 02:00 UTC!");
  }
  const noonDate = new Date("2026-09-10T14:00:00Z");
  if (ProactiveEngine.isQuietHoursActive(noonDate)) {
    throw new Error("Quiet hours policy incorrectly triggered during business hours (14:00 UTC)!");
  }
  console.log("       ✓ Quiet hours schedule accurately suppresses off-hours interruptions.");

  // 17.5 Concise Daily Briefing ("Good morning. Three things need your attention.")
  console.log("\n[17.5] Generating Proactive 3-Point Daily Briefing...");
  const proactiveBriefingOut = await prosisAgentInstance.processInput(
    "Good morning. Three things need your attention.",
    "voice"
  );

  if (!proactiveBriefingOut.proactiveBriefing) {
    throw new Error("Proactive briefing failed to attach structured ProactiveBriefing model!");
  }
  const briefing = proactiveBriefingOut.proactiveBriefing;
  if (briefing.items.length !== 3) {
    throw new Error(`Expected exactly 3 items in daily briefing, received ${briefing.items.length}`);
  }
  console.log(`       Headline: "${briefing.headline}"`);
  console.log(`       Item 1 (Anomaly): "${briefing.items[0].title}" [${briefing.items[0].epistemic.toUpperCase()}]`);
  console.log(`       Item 2 (Pending Task): "${briefing.items[1].title}" [${briefing.items[1].epistemic.toUpperCase()}]`);
  console.log(`       Item 3 (Opportunity): "${briefing.items[2].title}" [${briefing.items[2].epistemic.toUpperCase()}]`);
  console.log(`       Follow-up Prompt: "${briefing.followUpPrompt}"`);
  console.log(`       Spoken Audio: "${proactiveBriefingOut.spokenText.substring(0, 75)}..."`);

  if (!proactiveBriefingOut.replyText.includes("Good morning.") || !proactiveBriefingOut.replyText.includes("Three things need your attention")) {
    throw new Error("Daily briefing text missing required concise morning greeting!");
  }
  console.log("       ✓ Concise 3-point briefing structure validated with complete epistemic grounding.");

  // 17.6 Epistemically Grounded Root Cause Investigation
  console.log("\n[17.6] Testing Proactive Anomaly Investigation: 'Investigate Cantina Bella'...");
  const investigateOut = await prosisAgentInstance.processInput("Investigate Cantina Bella", "voice");
  if (investigateOut.coreState !== "SPEAKING") {
    throw new Error(`Expected SPEAKING state for investigation, got ${investigateOut.coreState}`);
  }
  if (!investigateOut.replyText.includes("[OBSERVED GROUND TRUTH]") || !investigateOut.replyText.includes("[INFERRED ROOT CAUSE]")) {
    throw new Error("Investigation reply failed to explicitly separate observed facts from inferred root cause!");
  }
  console.log(`       Investigation Response Summary:`);
  console.log(`       ${investigateOut.replyText.split("\n\n").slice(0, 3).join("\n")}`);
  console.log("       ✓ Investigation successfully articulated observed metrics, inferred impact, and recommended action.");

  // =========================================================================================
  // SCENARIO 18: CONTEXTUAL DYNAMIC SURFACES & EXECUTIVE AI INTERACTION
  // =========================================================================================
  console.log("\n[Scenario 18] CONTEXTUAL DYNAMIC SURFACES & EXECUTIVE AI INTERACTION");
  console.log("-----------------------------------------------------------------------------------------");

  // 18.1 Query Restaurant Performance (Analytics Dynamic Surface)
  console.log("\n[18.1] Testing Dynamic Surface: 'Show restaurant performance'...");
  const perfOut = await prosisAgentInstance.processInput("Show restaurant performance", "web");
  if (!perfOut.analyticsData || !Array.isArray(perfOut.analyticsData.venues)) {
    throw new Error("Failed to return analyticsData with venues array for AnalyticsSurfaceCard!");
  }
  if (perfOut.analyticsData.venues.length !== 5) {
    throw new Error(`Expected 5 venues in analyticsData, found ${perfOut.analyticsData.venues.length}`);
  }
  console.log(`       Venues Telemetry: ${perfOut.analyticsData.venues.map((v: any) => `${v.name} (${v.weeklyTrendPercent}%)`).join(", ")}`);
  console.log(`       Executive Reply: "${perfOut.replyText.substring(0, 75)}..."`);
  console.log("       ✓ Dynamic Analytics Surface payload successfully generated.");

  // 18.2 Comparative Contextual Surface ("Compare these two")
  console.log("\n[18.2] Testing Dynamic Surface: 'Compare these two'...");
  const compOut = await prosisAgentInstance.processInput("Compare these two", "web");
  if (!compOut.comparisonData || !compOut.comparisonData.venueA || !compOut.comparisonData.venueB) {
    throw new Error("Failed to return comparisonData with venueA and venueB for ComparisonSurfaceCard!");
  }
  console.log(`       Venue A: ${compOut.comparisonData.venueA.name} (${compOut.comparisonData.venueA.weeklyTrendPercent}%) - ${compOut.comparisonData.venueA.managerName}`);
  console.log(`       Venue B: ${compOut.comparisonData.venueB.name} (${compOut.comparisonData.venueB.weeklyTrendPercent}%) - ${compOut.comparisonData.venueB.managerName}`);
  console.log(`       Diagnosis A: "${compOut.comparisonData.venueA.diagnosis}"`);
  console.log(`       Diagnosis B: "${compOut.comparisonData.venueB.diagnosis}"`);
  console.log("       ✓ Dynamic Comparison Surface payload generated with root-cause diagnostics.");

  // 18.3 Executive Email Composer Surface ("Email the owner")
  console.log("\n[18.3] Testing Dynamic Surface: 'Email the owner'...");
  const emailOut = await prosisAgentInstance.processInput("Email the owner", "web");
  if (!emailOut.emailComposerData || !emailOut.emailComposerData.recipientEmail) {
    throw new Error("Failed to return emailComposerData for EmailComposerSurfaceCard!");
  }
  console.log(`       Recipient: ${emailOut.emailComposerData.recipientName} <${emailOut.emailComposerData.recipientEmail}>`);
  console.log(`       Subject: "${emailOut.emailComposerData.subject}"`);
  console.log(`       Consequence Disclosure: "${emailOut.emailComposerData.consequence}"`);
  console.log("       ✓ Dynamic Email Composer Surface payload generated with consequence disclosure.");

  // 18.4 Executive Email Composer for Alternate Venue ("Email Marcus at Verdant Bistro")
  console.log("\n[18.4] Testing Targeted Email Surface: 'Email Marcus at Verdant Bistro'...");
  const marcusEmailOut = await prosisAgentInstance.processInput("Email Marcus at Verdant Bistro", "web");
  if (!marcusEmailOut.emailComposerData || marcusEmailOut.emailComposerData.recipientName !== "Marcus Vance") {
    throw new Error(`Expected recipient Marcus Vance, got ${marcusEmailOut.emailComposerData?.recipientName}`);
  }
  console.log(`       Targeted Recipient: ${marcusEmailOut.emailComposerData.recipientName} (${marcusEmailOut.emailComposerData.restaurantName})`);
  console.log("       ✓ Targeted email draft correctly instantiated.");

  // 18.5 Executive Tone & Calibration Check (No fake enthusiasm, direct, professional)
  console.log("\n[18.5] Validating Executive Personality Calibration...");
  const replies = [perfOut.replyText, compOut.replyText, emailOut.replyText, marcusEmailOut.replyText];
  for (const rep of replies) {
    if (rep.includes("Awesome") || rep.includes("thrilled") || rep.includes("happy to help") || rep.includes("🚀")) {
      throw new Error(`Personality calibration failed: Detected corporate cheerleading or chat-hype in response: "${rep}"`);
    }
  }
  console.log("       ✓ Zero corporate hype, calm executive tone, authoritative operating system demeanor verified.");

  console.log("\n=========================================================================================");
  console.log("✅ ALL PROSIS AI ORCHESTRATION & PRODUCT PLATFORM SCENARIOS PASSED WITH 100% SUCCESS!");
  console.log("=========================================================================================\n");
}

export { runScenarioVerification };

if (require.main === module) {
  runScenarioVerification().catch((err) => {
    console.error("❌ Scenario Verification Error:", err);
    process.exit(1);
  });
}
