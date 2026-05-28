import { beforeEach, describe, expect, it } from "vitest";

import { verifyPlanIntegrity } from "@/services/plans/planIntegrity";
import { createPlan } from "@/services/plans/planPersistence";
import { resetPlanStore } from "@/services/plans/planStore";

describe("planIntegrity", () => {
  beforeEach(() => {
    resetPlanStore();
  });

  it("detects orphaned or incomplete lifecycle evidence", () => {
    createPlan({
      planId: "integrity_plan",
      schemaVersion: "1",
      intent: "inspect",
      source: "ai",
      state: "VALIDATED",
      lifecycleState: "VALIDATED",
      steps: [],
      createdBy: "planner",
      validationPassed: false,
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
        valid: false,
        executionEligible: false,
        validatedAt: 0,
      },
      approvals: { approvalRequired: false, approved: false },
      metadata: { createdAt: 0, updatedAt: 0, plannerVersion: "p", source: "ai" },
      lineage: {},
      integrity: { immutableHash: "", replayHash: "", lifecycleHash: "" },
    });

    const integrity = verifyPlanIntegrity("integrity_plan");
    expect(integrity.valid).toBe(false);
    expect(integrity.reasons.length).toBeGreaterThan(0);
  });
});
