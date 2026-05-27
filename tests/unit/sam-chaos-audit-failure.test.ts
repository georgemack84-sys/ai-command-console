import { describe, expect, it } from "vitest";

import { runSamChaosScenario } from "../../services/sam/chaos/samChaosRunner.ts";

describe("sam chaos audit failure", () => {
  it("AUDIT_APPEND_FAILURE is surfaced", async () => {
    const result = await runSamChaosScenario({
      type: "AUDIT_APPEND_FAILURE",
      executionId: "demo-chaos-audit",
      attemptId: "attempt-audit",
      deterministicSeed: "seed-audit",
      dryRun: true,
    });

    expect(result.passed).toBe(true);
    expect(result.findings.join(" ")).toContain("auditSkipped=true");
  });

  it("AUDIT_APPEND_FAILURE does not bypass governance", async () => {
    const result = await runSamChaosScenario({
      type: "AUDIT_APPEND_FAILURE",
      executionId: "demo-chaos-audit-2",
      attemptId: "attempt-audit-2",
      deterministicSeed: "seed-audit-2",
      dryRun: true,
    });

    expect(result.governanceBypassDetected).toBe(false);
  });
});
