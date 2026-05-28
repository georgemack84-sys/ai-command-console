import { beforeEach, describe, expect, it } from "vitest";

import { detectGovernanceDrift, detectLifecycleDrift, detectValidationDrift, verifyReplayIntegrity } from "@/services/plans/planReplayInspector";
import { appendPlanStep, bindValidationSnapshot, createPlan } from "@/services/plans/planPersistence";
import { resetPlanStore } from "@/services/plans/planStore";
import { validatePlanDraft } from "@/services/validation/planValidator";

describe("planReplayInspector", () => {
  beforeEach(() => {
    resetPlanStore();
  });

  it("detects lifecycle, validation, and governance drift deterministically", () => {
    createPlan({
      planId: "replay_inspector_plan",
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
    appendPlanStep({
      stepId: "s1",
      planId: "replay_inspector_plan",
      order: 0,
      type: "tool",
      tool: "read_file",
      input: { path: "a.ts" },
      riskLevel: "low",
      requiresApproval: false,
      createdAt: 0,
    });
    const governance = {
      policiesAttached: true,
      constitutionalSafe: true,
      containmentActive: false,
      freezeActive: false,
      operatorSupremacyPreserved: true,
      governanceVersion: "g1",
    } as const;

    const validation = validatePlanDraft({
      plan: {
        planId: "replay_inspector_plan",
        intent: "inspect",
        metadata: { createdBy: "planner", source: "ai" },
        schemaVersion: "1",
        steps: [{ id: "s1", type: "tool", tool: "read_file", input: { path: "a.ts" }, safety: { riskLevel: "low", requiresApproval: false } }],
      },
      governance,
    });
    bindValidationSnapshot("replay_inspector_plan", validation, governance);

    expect(detectLifecycleDrift("replay_inspector_plan").driftDetected).toBe(true);
    expect(detectValidationDrift("replay_inspector_plan").driftDetected).toBe(false);
    expect(detectGovernanceDrift("replay_inspector_plan").driftDetected).toBe(false);
    expect(verifyReplayIntegrity("replay_inspector_plan").driftDetected).toBe(true);
  });
});
