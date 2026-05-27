import { beforeEach, describe, expect, it } from "vitest";

import { enforceFreezeProtection, freezePlan, isPlanFrozen } from "@/services/plans/planFreeze";
import { createPlan } from "@/services/plans/planPersistence";
import { resetPlanStore } from "@/services/plans/planStore";

describe("planFreeze", () => {
  beforeEach(() => {
    resetPlanStore();
  });

  it("supports ANY to FROZEN and blocks protected operations", () => {
    createPlan({
      planId: "freeze_plan",
      schemaVersion: "1",
      intent: "inspect",
      source: "ai",
      state: "QUEUED",
      lifecycleState: "QUEUED",
      steps: [],
      createdBy: "planner",
      validationPassed: true,
      approvalRequired: false,
      approvalState: "NONE",
      riskLevel: "low",
      executionBlocked: false,
      cancellationRequested: false,
      validation: {
        validationSnapshotId: "",
        validationHash: "",
        governanceHash: "",
        validatorVersion: "v",
        registryVersion: "r",
        governanceVersion: "g",
        valid: true,
        executionEligible: true,
        validatedAt: 0,
      },
      approvals: { approvalRequired: false, approved: false },
      metadata: { createdAt: 0, updatedAt: 0, plannerVersion: "p", source: "ai" },
      lineage: {},
      integrity: { immutableHash: "x", replayHash: "y", lifecycleHash: "z" },
    });

    freezePlan("freeze_plan", "governance freeze");
    expect(isPlanFrozen("freeze_plan")).toBe(true);
    expect(() => enforceFreezeProtection("freeze_plan")).toThrow("PLAN_FROZEN_BY_GOVERNANCE");
  });
});
