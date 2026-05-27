import { describe, expect, it } from "vitest";
import { simulateApprovalConflictStress } from "@/services/approval-conflict";
import { buildRecommendationIntegrityFixture } from "@/tests/integration/approval-conflict/helpers";

describe("approval conflict adversarial markers", () => {
  it("escalates on invalid inheritance", () => {
    const result = simulateApprovalConflictStress({
      conflictId: "conflict-inheritance",
      recommendationResult: buildRecommendationIntegrityFixture(),
      deterministicSeed: "seed-i",
      createdAt: "2026-05-17T12:12:00.000Z",
      metadata: Object.freeze({ authorityInheritance: true, transitiveApproval: true }),
    });

    expect(result.errors.some((item) => item.code === "APPROVAL_CONFLICT_INVALID_INHERITANCE")).toBe(true);
    expect(result.inheritanceInspection.inheritanceBlocked).toBe(true);
  });

  it("freezes on conflicting operators", () => {
    const result = simulateApprovalConflictStress({
      conflictId: "conflict-operators",
      recommendationResult: buildRecommendationIntegrityFixture(),
      deterministicSeed: "seed-o",
      createdAt: "2026-05-17T12:13:00.000Z",
      metadata: Object.freeze({ contradictoryApproval: true }),
    });

    expect(result.record.approvalConflictState).toBe("ESCALATED");
    expect(result.escalationRecord.escalationAmplified).toBe(true);
  });
});
