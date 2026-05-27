import { beforeEach, describe, expect, it } from "vitest";

import { bindValidationSnapshot, createPlan } from "@/services/plans/planPersistence";
import { transition } from "@/services/plans/planLifecycle";
import { resetPlanStore } from "@/services/plans/planStore";
import { validatePlanDraft } from "@/services/validation/planValidator";

function createValidatedPlan(planId = "plan_lifecycle", approvalTool = "read_file") {
  createPlan({
    planId,
    schemaVersion: "1",
    intent: "work",
    source: "ai",
    state: "VALIDATED",
    createdBy: "planner",
    validationPassed: false,
    approvalRequired: false,
    approvalState: "NONE",
    riskLevel: "low",
    executionBlocked: false,
    cancellationRequested: false,
  });

  const validation = validatePlanDraft({
    plan: {
      planId,
      intent: "work",
      metadata: { createdBy: "planner", source: "ai" },
      schemaVersion: "1",
      steps: [{ id: "s1", type: "tool", tool: approvalTool, input: { path: "a.ts" }, safety: { riskLevel: approvalTool === "write_file" ? "high" : "low", requiresApproval: approvalTool === "write_file" } }],
    },
    governance: {
      policiesAttached: true,
      constitutionalSafe: true,
      containmentActive: false,
      freezeActive: false,
      operatorSupremacyPreserved: true,
      governanceVersion: "g1",
    },
  });
  bindValidationSnapshot(planId, validation);
}

describe("planLifecycle", () => {
  beforeEach(() => {
    resetPlanStore();
  });

  it("queues validated eligible plans", () => {
    createValidatedPlan();
    const result = transition({
      planId: "plan_lifecycle",
      fromState: "VALIDATED",
      toState: "QUEUED",
      actor: "operator",
    });

    expect(result.plan.state).toBe("QUEUED");
  });

  it("blocks invalid transitions and stale fromState", () => {
    createValidatedPlan("plan_invalid");

    expect(() => transition({
      planId: "plan_invalid",
      fromState: "DRAFT",
      toState: "QUEUED",
      actor: "operator",
    })).toThrow("PLAN_STATE_MISMATCH");

    expect(() => transition({
      planId: "plan_invalid",
      fromState: "VALIDATED",
      toState: "COMPLETED",
      actor: "operator",
    })).toThrow("INVALID_PLAN_STATE_TRANSITION");
  });

  it("supports freeze and dispute recovery transitions", () => {
    createValidatedPlan("plan_freeze");
    const frozen = transition({
      planId: "plan_freeze",
      fromState: "VALIDATED",
      toState: "FROZEN",
      actor: "operator",
      reason: "freeze",
    });
    const disputed = transition({
      planId: "plan_freeze",
      fromState: "FROZEN",
      toState: "DISPUTED",
      actor: "operator",
      reason: "dispute",
    });
    const revalidate = transition({
      planId: "plan_freeze",
      fromState: "DISPUTED",
      toState: "VALIDATING",
      actor: "operator",
      reason: "retry",
    });

    expect(frozen.plan.state).toBe("FROZEN");
    expect(disputed.plan.state).toBe("DISPUTED");
    expect(revalidate.plan.state).toBe("VALIDATING");
  });
});
