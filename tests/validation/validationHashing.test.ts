import { describe, expect, it } from "vitest";

import { hashGovernanceDecision, hashPlanDraft } from "@/services/validation/validationHashing";

describe("validationHashing", () => {
  const plan = {
    planId: "plan_hash",
    intent: "inspect project",
    metadata: { actor: "user" },
    schemaVersion: "1",
    steps: [{ id: "s1", type: "tool", tool: "read_file", input: { path: "a.ts" }, safety: { riskLevel: "low", requiresApproval: false } }],
  } as const;

  it("creates the same hash for the same plan", () => {
    expect(hashPlanDraft(plan)).toBe(hashPlanDraft(plan));
  });

  it("creates a different hash for a mutated plan", () => {
    expect(hashPlanDraft(plan)).not.toBe(hashPlanDraft({
      ...plan,
      steps: [{ ...plan.steps[0], input: { path: "b.ts" } }],
    }));
  });

  it("creates the same governance hash for the same decision", () => {
    const left = hashGovernanceDecision({
      governance: {
        policiesAttached: true,
        constitutionalSafe: true,
        containmentActive: false,
        freezeActive: false,
        operatorSupremacyPreserved: true,
        governanceVersion: "g1",
      },
      decision: "ALLOW",
      blockedReasons: [],
    });

    const right = hashGovernanceDecision({
      governance: {
        policiesAttached: true,
        constitutionalSafe: true,
        containmentActive: false,
        freezeActive: false,
        operatorSupremacyPreserved: true,
        governanceVersion: "g1",
      },
      decision: "ALLOW",
      blockedReasons: [],
    });

    expect(left).toBe(right);
  });

  it("creates a distinct blocking hash for disputed governance", () => {
    const allowHash = hashGovernanceDecision({
      governance: {
        policiesAttached: true,
        constitutionalSafe: true,
        containmentActive: false,
        freezeActive: false,
        operatorSupremacyPreserved: true,
        governanceVersion: "g1",
      },
      decision: "ALLOW",
      blockedReasons: [],
    });

    const disputedHash = hashGovernanceDecision({
      governance: {
        policiesAttached: true,
        constitutionalSafe: true,
        containmentActive: false,
        freezeActive: false,
        operatorSupremacyPreserved: true,
        governanceVersion: "g1",
        disputed: true,
      },
      decision: "DISPUTED",
      blockedReasons: ["GOVERNANCE_VALIDATION_FAILED"],
    });

    expect(disputedHash).not.toBe(allowHash);
  });
});
