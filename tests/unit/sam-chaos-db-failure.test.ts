import { describe, expect, it } from "vitest";

import { runSamChaosScenario } from "../../services/sam/chaos/samChaosRunner.ts";

describe("sam chaos db failure", () => {
  it("DB_FAILURE fails closed", async () => {
    const result = await runSamChaosScenario({
      type: "DB_FAILURE",
      executionId: "demo-chaos-db",
      attemptId: "attempt-db",
      deterministicSeed: "seed-db",
      dryRun: true,
    });

    expect(result.passed).toBe(true);
    expect(result.recoveryCorrect).toBe(true);
  });

  it("DB_FAILURE does not create false success", async () => {
    const result = await runSamChaosScenario({
      type: "DB_FAILURE",
      executionId: "demo-chaos-db-2",
      attemptId: "attempt-db-2",
      deterministicSeed: "seed-db-2",
      dryRun: true,
    });

    expect(result.findings.join(" ")).toContain("SAM_IDEMPOTENCY_AMBIGUOUS");
  });
});
