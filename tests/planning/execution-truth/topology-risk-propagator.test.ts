import { describe, expect, it } from "vitest";

import { propagateTopologyRisk, scoreRiskDeterministically } from "@/services/planning/execution-truth";
import { validateSequentialDependencies } from "@/services/planning/dependencies";

import { buildSafeExecutionTruthPlan } from "./helpers";

describe("topology risk propagator", () => {
  it("propagates awareness of upstream high-risk steps", () => {
    const plan = buildSafeExecutionTruthPlan();
    plan.steps[0]!.inputs.isDestructive = true;
    plan.steps[0]!.inputs.targetEnvironment = "production";
    plan.steps[0]!.inputs.idempotencyKey = "idem";
    const dependency = validateSequentialDependencies(plan);
    const scored = scoreRiskDeterministically([
      {
        stepId: "step-read",
        destructive: true,
        externalSideEffect: false,
        idempotent: true,
        targetEnvironment: "production",
        rollbackCapability: "full",
        autonomySensitivity: "safe",
        terminalBranch: false,
        failureBranch: false,
        rollbackBranch: false,
        source: "normalized_step_inputs",
      },
      {
        stepId: "step-validate",
        destructive: false,
        externalSideEffect: false,
        idempotent: true,
        targetEnvironment: "local",
        rollbackCapability: "full",
        autonomySensitivity: "safe",
        terminalBranch: false,
        failureBranch: false,
        rollbackBranch: false,
        source: "normalized_step_inputs",
      },
    ]);

    const propagated = propagateTopologyRisk(scored, dependency);
    expect(propagated.reasons.some((reason) => reason.includes("upstream risk propagated"))).toBe(true);
  });
});
