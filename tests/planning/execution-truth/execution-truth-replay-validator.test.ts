import { describe, expect, it } from "vitest";

import { validateExecutionTruth, validateExecutionTruthReplay } from "@/services/planning/execution-truth";

import { buildSafeExecutionTruthPlan } from "./helpers";

describe("execution truth replay validator", () => {
  it("passes for identical package and fails closed on tampering", () => {
    const plan = buildSafeExecutionTruthPlan();
    const built = validateExecutionTruth(plan);
    expect(built.ok).toBe(true);
    if (!built.ok) return;

    const replay = validateExecutionTruthReplay({
      normalizedPlan: plan,
      executionTruthPackage: built.executionTruthPackage,
    });
    expect(replay.ok).toBe(true);

    const tampered = validateExecutionTruthReplay({
      normalizedPlan: plan,
      executionTruthPackage: {
        ...built.executionTruthPackage,
        executionTruthHash: "tampered",
      },
    });
    expect(tampered.ok).toBe(false);
  });
});
