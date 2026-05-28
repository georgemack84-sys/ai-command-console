import { beforeEach, describe, expect, it } from "vitest";

import { bindValidationSnapshot, createPlan, appendPlanStep, updatePlanState } from "@/services/plans/planPersistence";
import { transition } from "@/services/plans/planLifecycle";
import { rebuildPlanEvidence, reconstructPlanLifecycle } from "@/services/plans/planReplay";
import { resetPlanStore } from "@/services/plans/planStore";
import { validatePlanDraft } from "@/services/validation/planValidator";

describe("planReplay", () => {
  beforeEach(() => {
    resetPlanStore();
  });

  it("reconstructs lifecycle deterministically and detects state mismatch", () => {
    createPlan({
      planId: "replay_plan",
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
    appendPlanStep({
      stepId: "s1",
      planId: "replay_plan",
      order: 0,
      type: "tool",
      tool: "read_file",
      input: { path: "a.ts" },
      riskLevel: "low",
      requiresApproval: false,
      createdAt: 0,
    });
    const validation = validatePlanDraft({
      plan: {
        planId: "replay_plan",
        intent: "work",
        metadata: { createdBy: "planner", source: "ai" },
        schemaVersion: "1",
        steps: [{ id: "s1", type: "tool", tool: "read_file", input: { path: "a.ts" }, safety: { riskLevel: "low", requiresApproval: false } }],
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
    bindValidationSnapshot("replay_plan", validation);
    transition({ planId: "replay_plan", fromState: "VALIDATED", toState: "QUEUED", actor: "operator" });

    const lifecycle = reconstructPlanLifecycle("replay_plan");
    expect(lifecycle.driftDetected).toBe(false);

    updatePlanState("replay_plan", "FAILED", 0);
    const mismatch = reconstructPlanLifecycle("replay_plan");
    expect(mismatch.driftDetected).toBe(true);
  });

  it("rebuilds evidence and detects drift without mutating state", () => {
    createPlan({
      planId: "evidence_plan",
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
    appendPlanStep({
      stepId: "s1",
      planId: "evidence_plan",
      order: 0,
      type: "tool",
      tool: "read_file",
      input: { path: "a.ts" },
      riskLevel: "low",
      requiresApproval: false,
      createdAt: 0,
    });
    const validation = validatePlanDraft({
      plan: {
        planId: "evidence_plan",
        intent: "work",
        metadata: { createdBy: "planner", source: "ai" },
        schemaVersion: "1",
        steps: [{ id: "s1", type: "tool", tool: "read_file", input: { path: "a.ts" }, safety: { riskLevel: "low", requiresApproval: false } }],
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
    bindValidationSnapshot("evidence_plan", validation);

    const clean = rebuildPlanEvidence("evidence_plan");
    expect(clean.driftDetected).toBe(false);

    appendPlanStep({
      stepId: "s2",
      planId: "evidence_plan",
      order: 1,
      type: "tool",
      tool: "read_file",
      input: { path: "b.ts" },
      riskLevel: "low",
      requiresApproval: false,
      createdAt: 0,
    });

    const drift = rebuildPlanEvidence("evidence_plan");
    expect(drift.driftDetected).toBe(true);
    expect(drift.driftReasons).toContain("PLAN_VALIDATION_HASH_DRIFT");
  });
});
