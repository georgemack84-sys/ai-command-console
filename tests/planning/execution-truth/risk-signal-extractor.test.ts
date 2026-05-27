import { describe, expect, it } from "vitest";

import { extractRiskSignals } from "@/services/planning/execution-truth";

import { buildSafeExecutionTruthPlan } from "./helpers";

describe("risk signal extractor", () => {
  it("extracts deterministic signals from normalized step inputs", () => {
    const plan = buildSafeExecutionTruthPlan();
    plan.steps[1]!.inputs = {
      ...plan.steps[1]!.inputs,
      isDestructive: true,
      targetEnvironment: "production",
      rollbackCapability: "none",
      autonomySensitivity: "critical",
    };

    const result = extractRiskSignals(plan);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.stepSignals[1]).toMatchObject({
      destructive: true,
      targetEnvironment: "production",
      rollbackCapability: "none",
      autonomySensitivity: "critical",
    });
  });
});
