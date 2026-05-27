import { beforeEach, describe, expect, it } from "vitest";

import { createPlan } from "@/services/plans/planPersistence";
import { transition } from "@/services/plans/planLifecycle";
import { resetPlanStore } from "@/services/plans/planStore";

describe("transitionMatrix", () => {
  beforeEach(() => {
    resetPlanStore();
  });

  it("allows documented freeze and dispute matrix transitions", () => {
    createPlan({
      planId: "matrix_plan",
      schemaVersion: "1",
      intent: "work",
      source: "ai",
      state: "QUEUED",
      createdBy: "planner",
      validationPassed: true,
      approvalRequired: false,
      approvalState: "NONE",
      riskLevel: "low",
      executionBlocked: false,
      cancellationRequested: false,
    });

    const frozen = transition({ planId: "matrix_plan", fromState: "QUEUED", toState: "FROZEN", actor: "operator" });
    const disputed = transition({ planId: "matrix_plan", fromState: "FROZEN", toState: "DISPUTED", actor: "operator" });
    const validating = transition({ planId: "matrix_plan", fromState: "DISPUTED", toState: "VALIDATING", actor: "operator" });

    expect(frozen.plan.state).toBe("FROZEN");
    expect(disputed.plan.state).toBe("DISPUTED");
    expect(validating.plan.state).toBe("VALIDATING");
  });
});
