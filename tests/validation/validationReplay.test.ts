import { describe, expect, it } from "vitest";

import { replayPlanValidation } from "@/services/validation/validationReplay";
import { createValidationSnapshot } from "@/services/validation/validationSnapshot";
import { validatePlanDraft } from "@/services/validation/planValidator";

describe("validationReplay", () => {
  it("detects deterministic replay matches", () => {
    const plan = {
      planId: "replay_plan",
      intent: "inspect file",
      metadata: { actor: "user" },
      schemaVersion: "1",
      steps: [{ id: "s1", type: "tool", tool: "read_file", input: { path: "a.ts" }, safety: { riskLevel: "low", requiresApproval: false } }],
    } as const;
    const governance = {
      policiesAttached: true,
      constitutionalSafe: true,
      containmentActive: false,
      freezeActive: false,
      operatorSupremacyPreserved: true,
      governanceVersion: "g1",
    } as const;

    const result = validatePlanDraft({ plan, governance });
    const snapshot = createValidationSnapshot({ result, schemaVersion: "1", executionEligible: result.executionEligible });
    const replay = replayPlanValidation({ plan, governance, originalSnapshot: snapshot });

    expect(replay.deterministic).toBe(true);
    expect(replay.driftDetected).toBe(false);
  });

  it("detects replay drift", () => {
    const originalPlan = {
      planId: "replay_drift",
      intent: "inspect file",
      metadata: { actor: "user" },
      schemaVersion: "1",
      steps: [{ id: "s1", type: "tool", tool: "read_file", input: { path: "a.ts" }, safety: { riskLevel: "low", requiresApproval: false } }],
    } as const;
    const governance = {
      policiesAttached: true,
      constitutionalSafe: true,
      containmentActive: false,
      freezeActive: false,
      operatorSupremacyPreserved: true,
      governanceVersion: "g1",
    } as const;

    const result = validatePlanDraft({ plan: originalPlan, governance });
    const snapshot = createValidationSnapshot({ result, schemaVersion: "1", executionEligible: result.executionEligible });
    const replay = replayPlanValidation({
      plan: {
        ...originalPlan,
        steps: [{ ...originalPlan.steps[0], input: { path: "b.ts" } }],
      },
      governance,
      originalSnapshot: snapshot,
    });

    expect(replay.driftDetected).toBe(true);
    expect(replay.driftReasons).toContain("VALIDATION_PLAN_HASH_MISMATCH");
  });
});
