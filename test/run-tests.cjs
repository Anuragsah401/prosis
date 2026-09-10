const path = require("path");
const jiti = require("jiti")(path.join(process.cwd(), "index.js"), {
  alias: {
    "@": path.join(process.cwd(), "src"),
    "@prosis/sdk": path.join(process.cwd(), "src/packages/sdk"),
    "@prosis/tools": path.join(process.cwd(), "src/packages/tools"),
    "@prosis/memory": path.join(process.cwd(), "src/packages/memory"),
    "@prosis/knowledge": path.join(process.cwd(), "src/packages/knowledge"),
    "@prosis/orchestrator": path.join(process.cwd(), "src/packages/orchestrator"),
    "@prosis/proactive": path.join(process.cwd(), "src/packages/proactive"),
    "@prosis/product-seatbooking": path.join(process.cwd(), "src/packages/products/seatbooking"),
    "@prosis/ui": path.join(process.cwd(), "src/packages/ui"),
  },
});

async function runAllTests() {
  const { runScenarioVerification } = jiti("./test/scenario-verification.ts");
  if (typeof runScenarioVerification === "function") {
    await runScenarioVerification();
  }

  const { runPhase2Validation } = jiti("./test/phase2-validation.ts");
  if (typeof runPhase2Validation === "function") {
    await runPhase2Validation();
  }

  const { runPhase3Validation } = jiti("./test/phase3-validation.ts");
  if (typeof runPhase3Validation === "function") {
    await runPhase3Validation();
  }

  const { runProsisItValidation } = jiti("./test/prosis-it-validation.ts");
  if (typeof runProsisItValidation === "function") {
    await runProsisItValidation();
  }
}

runAllTests().catch((err) => {
  console.error("Test Suite Execution Failure:", err);
  process.exit(1);
});
