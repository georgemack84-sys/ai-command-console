import { beforeEach, describe, expect, it } from "vitest";

import { bindValidationSnapshot, createPlan } from "@/services/plans/planPersistence";
import { transition } from "@/services/plans/planLifecycle";
import { resetPlanStore } from "@/services/plans/planStore";
import { validatePlanDraft } from "@/services/validation/planValidator";

describe("validationSnapshotBinding", () => {
  beforeEach(() => {
    resetPlanStore();
  });

  it("blocks queueing without a validation snapshot", () => {
    createPlan({
      planId: "no_snapshot",
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

    expect(() => transition({
      planId: "no_snapshot",
      fromState: "VALIDATED",
      toState: "QUEUED",
      actor: "operator",
    })).toThrow("PLAN_VALIDATION_SNAPSHOT_MISSING");
  });

  it("blocks queueing when approval is required but not approved", () => {
    createPlan({
      planId: "approval_plan",
      schemaVersion: "1",
      intent: "update file",
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
        planId: "approval_plan",
        intent: "update file",
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
    bindValidationSnapshot("approval_plan", validation);

    expect(() => transition({
      planId: "approval_plan",
      fromState: "VALIDATED",
      toState: "QUEUED",
      actor: "operator",
    })).toThrow("PLAN_APPROVAL_REQUIRED");
  });

  it("blocks drifted hash and version mismatches", () => {
    createPlan({
      planId: "drift_plan",
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
        planId: "drift_plan",
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
    bindValidationSnapshot("drift_plan", validation);

    createPlan({
      planId: "version_plan",
      schemaVersion: "2",
      intent: "work",
      source: "ai",
      state: "VALIDATED",
      createdBy: "planner",
      validationPassed: validation.valid,
      validationSnapshotId: validation.snapshotId,
      planHash: validation.planHash,
      governanceDecisionHash: validation.governanceDecisionHash,
      approvalRequired: validation.approvalRequired,
      approvalState: "NONE",
      riskLevel: validation.riskLevel,
      executionBlocked: false,
      cancellationRequested: false,
      validatorVersion: validation.validatorVersion,
      registryVersion: validation.registryVersion,
      governanceVersion: "g2",
    });

    expect(() => transition({
      planId: "drift_plan",
      fromState: "VALIDATED",
      toState: "QUEUED",
      actor: "operator",
    })).not.toThrow();

    expect(() => transition({
      planId: "version_plan",
      fromState: "VALIDATED",
      toState: "QUEUED",
      actor: "operator",
    })).toThrow("PLAN_VALIDATION_SNAPSHOT_MISSING");
  });
});
