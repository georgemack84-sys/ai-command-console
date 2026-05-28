import { describe, expect, it } from "vitest";

import { attachSamChaosScore } from "../../services/sam/chaos/samChaosStabilityScore.ts";

describe("sam chaos stability score", () => {
  it("stability score is deterministic", () => {
    const base = {
      type: "DUPLICATE_REPLAY" as const,
      passed: true,
      recoveryCorrect: true,
      unauthorizedMutationDetected: false,
      duplicateDryRunDetected: false,
      duplicateAuditDetected: false,
      governanceBypassDetected: false,
      findings: ["all good"],
    };

    expect(attachSamChaosScore(base).stabilityScore).toBe(attachSamChaosScore(base).stabilityScore);
  });

  it("recoveryCorrect is false when safety invariants fail", () => {
    const result = attachSamChaosScore({
      type: "DB_FAILURE",
      passed: false,
      recoveryCorrect: false,
      unauthorizedMutationDetected: false,
      duplicateDryRunDetected: true,
      duplicateAuditDetected: true,
      governanceBypassDetected: true,
      findings: ["failed closed incorrectly"],
    });

    expect(result.recoveryCorrect).toBe(false);
    expect(result.stabilityScore).toBeLessThan(100);
  });

  it("recoveryCorrect is true when all safety invariants hold", () => {
    const result = attachSamChaosScore({
      type: "DUPLICATE_REPLAY",
      passed: true,
      recoveryCorrect: true,
      unauthorizedMutationDetected: false,
      duplicateDryRunDetected: false,
      duplicateAuditDetected: false,
      governanceBypassDetected: false,
      findings: ["stable"],
    });

    expect(result.recoveryCorrect).toBe(true);
    expect(result.stabilityScore).toBe(100);
  });
});
