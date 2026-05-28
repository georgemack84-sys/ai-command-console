import { describe, expect, it } from "vitest";
import { simulateApprovalConflictStress } from "@/services/approval-conflict";
import { buildRecommendationIntegrityFixture } from "@/tests/integration/approval-conflict/helpers";

describe("approval conflict governance", () => {
  it("fails closed when governance linkage is missing", () => {
    const result = simulateApprovalConflictStress({
      conflictId: "conflict-governance",
      recommendationResult: buildRecommendationIntegrityFixture(),
      deterministicSeed: "seed-g",
      createdAt: "2026-05-17T12:11:00.000Z",
      metadata: Object.freeze({ missingGovernanceLinkage: true }),
    });

    expect(result.record.failClosed).toBe(true);
    expect(result.errors.some((item) => item.code === "APPROVAL_CONFLICT_GOVERNANCE_LINKAGE_MISSING")).toBe(true);
  });
});
