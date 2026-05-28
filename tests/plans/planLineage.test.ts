import { beforeEach, describe, expect, it } from "vitest";

import { rebuildPlanLineage } from "@/services/plans/planLineage";
import { createPlan } from "@/services/plans/planPersistence";
import { resetPlanStore } from "@/services/plans/planStore";

describe("planLineage", () => {
  beforeEach(() => {
    resetPlanStore();
  });

  it("detects self-referential lineage corruption", () => {
    createPlan({
      planId: "lineage_plan",
      schemaVersion: "1",
      intent: "inspect",
      source: "ai",
      state: "DRAFT",
      lifecycleState: "DRAFT",
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
      lineage: { parentPlanId: "lineage_plan" },
      integrity: { immutableHash: "", replayHash: "", lifecycleHash: "" },
    });

    const lineage = rebuildPlanLineage("lineage_plan");
    expect(lineage.valid).toBe(false);
    expect(lineage.issues).toContain("PLAN_LINEAGE_CORRUPTED");
  });
});
