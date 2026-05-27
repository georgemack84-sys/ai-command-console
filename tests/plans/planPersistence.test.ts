import { beforeEach, describe, expect, it } from "vitest";

import { bindValidationSnapshot, createPlan, appendPlanStep, getPlan, listPlanSteps } from "@/services/plans/planPersistence";
import { resetPlanStore, readValidationBinding } from "@/services/plans/planStore";
import { validatePlanDraft } from "@/services/validation/planValidator";

describe("planPersistence", () => {
  beforeEach(() => {
    resetPlanStore();
  });

  it("creates and retrieves plans deterministically", () => {
    createPlan({
      planId: "plan_a",
      schemaVersion: "1",
      intent: "inspect file",
      source: "ai",
      state: "DRAFT",
      createdBy: "planner",
      validationPassed: false,
      approvalRequired: false,
      approvalState: "NONE",
      riskLevel: "low",
      executionBlocked: false,
      cancellationRequested: false,
      createdAt: 10,
    });

    const plan = getPlan("plan_a");
    expect(plan.createdAt).toBe(10);
    expect(plan.updatedAt).toBe(10);
    expect(plan.state).toBe("DRAFT");
  });

  it("rejects duplicate plan ids", () => {
    createPlan({
      planId: "plan_dup",
      schemaVersion: "1",
      intent: "inspect file",
      source: "ai",
      state: "DRAFT",
      createdBy: "planner",
      validationPassed: false,
      approvalRequired: false,
      approvalState: "NONE",
      riskLevel: "low",
      executionBlocked: false,
      cancellationRequested: false,
    });

    expect(() => createPlan({
      planId: "plan_dup",
      schemaVersion: "1",
      intent: "inspect file",
      source: "ai",
      state: "DRAFT",
      createdBy: "planner",
      validationPassed: false,
      approvalRequired: false,
      approvalState: "NONE",
      riskLevel: "low",
      executionBlocked: false,
      cancellationRequested: false,
    })).toThrow("PLAN_ALREADY_EXISTS");
  });

  it("appends steps and binds immutable validation snapshots", () => {
    createPlan({
      planId: "plan_bind",
      schemaVersion: "1",
      intent: "inspect file",
      source: "ai",
      state: "DRAFT",
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
      planId: "plan_bind",
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
        planId: "plan_bind",
        intent: "inspect file",
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

    const bound = bindValidationSnapshot("plan_bind", validation);
    const steps = listPlanSteps("plan_bind");
    const binding = readValidationBinding("plan_bind");

    expect(steps).toHaveLength(1);
    expect(bound.snapshot.snapshotId).toBe(validation.snapshotId);
    expect(binding?.snapshot.snapshotId).toBe(bound.snapshot.snapshotId);
    expect(Object.isFrozen(bound.snapshot)).toBe(true);
  });
});
