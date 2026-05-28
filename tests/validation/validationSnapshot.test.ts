import { describe, expect, it } from "vitest";

import { createValidationSnapshot } from "@/services/validation/validationSnapshot";
import { validatePlanDraft } from "@/services/validation/planValidator";

describe("validationSnapshot", () => {
  it("creates an immutable snapshot from a valid validation result", () => {
    const result = validatePlanDraft({
      plan: {
        planId: "snapshot_plan",
        intent: "inspect file",
        metadata: { actor: "user" },
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

    const snapshot = createValidationSnapshot({
      result,
      schemaVersion: "1",
      executionEligible: result.executionEligible,
    });

    expect(snapshot.planId).toBe("snapshot_plan");
    expect(snapshot.planHash).toBe(result.planHash);
    expect(snapshot.immutableAuditId).toBe(result.immutableAuditId);
    expect(Object.isFrozen(snapshot)).toBe(true);
  });
});
