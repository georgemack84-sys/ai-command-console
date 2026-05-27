import { describe, expect, it } from "vitest";

import { validateExecutionTruth } from "@/services/planning/execution-truth";

import { buildSafeExecutionTruthPlan } from "./helpers";

describe("execution truth red team", () => {
  it("fails closed on hidden risk mutation, governance bypass, and autonomy escalation attempts", () => {
    const plan = buildSafeExecutionTruthPlan();
    plan.steps[1]!.inputs = {
      ...plan.steps[1]!.inputs,
      isDestructive: true,
      hasExternalSideEffect: true,
      targetEnvironment: "production",
      rollbackCapability: "unknown",
      autonomySensitivity: "critical",
    };

    const result = validateExecutionTruth(plan);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect([
      "PHASE_4_2E_DEPENDENCY_VALIDATION_FAILED",
      "PHASE_4_2E_FORBIDDEN_RISK",
      "PHASE_4_2E_GOVERNANCE_BLOCKED",
      "PHASE_4_2E_UNKNOWN_RISK_FAIL_CLOSED",
    ]).toContain(result.error.code);
  });
});
