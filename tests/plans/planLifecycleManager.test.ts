import { beforeEach, describe, expect, it } from "vitest";

import { transitionPlanLifecycle } from "@/services/plans/planLifecycleManager";
import { bindValidationSnapshot, createPlan } from "@/services/plans/planPersistence";
import { resetPlanStore } from "@/services/plans/planStore";
import { validatePlanDraft } from "@/services/validation/planValidator";

describe("planLifecycleManager", () => {
  beforeEach(() => {
    resetPlanStore();
  });

  it("enforces approval and eligibility before queueing", () => {
    createPlan({
      planId: "lifecycle_manager_plan",
      schemaVersion: "1",
      intent: "write file",
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

    const validation = validatePlanDraft({
      plan: {
        planId: "lifecycle_manager_plan",
        intent: "write file",
        metadata: { createdBy: "planner", source: "ai" },
        schemaVersion: "1",
        steps: [{ id: "s1", type: "tool", tool: "write_file", input: { path: "a.ts" }, safety: { riskLevel: "high", requiresApproval: true } }],
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
    bindValidationSnapshot("lifecycle_manager_plan", validation);

    expect(() => transitionPlanLifecycle({
      planId: "lifecycle_manager_plan",
      fromState: "VALIDATED",
      toState: "QUEUED",
      actor: "operator",
    })).toThrow("PLAN_APPROVAL_REQUIRED");
  });
});
