import { beforeEach, describe, expect, it } from "vitest";

import { preparePlanRecovery } from "@/services/plans/planRecovery";
import { createPlan } from "@/services/plans/planPersistence";
import { resetPlanStore } from "@/services/plans/planStore";

describe("planRecovery", () => {
  beforeEach(() => {
    resetPlanStore();
  });

  it("fails closed when integrity evidence is insufficient", () => {
    createPlan({
      planId: "recovery_plan",
      schemaVersion: "1",
      intent: "recover",
      source: "ai",
      state: "FAILED",
      lifecycleState: "FAILED",
      steps: [],
      createdBy: "planner",
      validationPassed: false,
      approvalRequired: false,
      approvalState: "NONE",
      riskLevel: "low",
      executionBlocked: true,
      cancellationRequested: false,
      validation: {
        validationSnapshotId: "",
        validationHash: "",
        governanceHash: "",
        validatorVersion: "v",
        registryVersion: "r",
        governanceVersion: "g",
        valid: false,
        executionEligible: false,
        validatedAt: 0,
      },
      approvals: { approvalRequired: false, approved: false },
      metadata: { createdAt: 0, updatedAt: 0, plannerVersion: "p", source: "ai" },
      lineage: {},
      integrity: { immutableHash: "", replayHash: "", lifecycleHash: "" },
    });

    const recovery = preparePlanRecovery("recovery_plan");
    expect(recovery.recoverable).toBe(false);
    expect(recovery.requiresOperatorReview).toBe(true);
  });
});
