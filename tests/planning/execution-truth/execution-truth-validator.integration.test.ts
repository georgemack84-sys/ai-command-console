import { describe, expect, it } from "vitest";

import { validateExecutionTruth } from "@/services/planning/execution-truth";

import { buildSafeExecutionTruthPlan } from "./helpers";

describe("execution truth validator", () => {
  it("authorizes a safe local read-only plan and preserves dependency fingerprint", () => {
    const plan = buildSafeExecutionTruthPlan();
    const result = validateExecutionTruth(plan);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.executionTruthPackage.authorized).toBe(true);
    expect(result.executionTruthPackage.dependencyGraphFingerprint).toBe(result.dependencyValidation.dependencyGraphFingerprint);
    expect(result.executionTruthPackage.executionTruthHash).toBeTruthy();
  });
});
