import { describe, expect, it } from "vitest";
import { simulateApprovalConflictStress } from "@/services/approval-conflict";
import { buildRecommendationIntegrityFixture } from "@/tests/integration/approval-conflict/helpers";

describe("approval conflict fail-closed inheritance", () => {
  it("inherits upstream fail-closed state", () => {
    const recommendationResult = buildRecommendationIntegrityFixture({
      record: Object.freeze({
        ...buildRecommendationIntegrityFixture().record,
        failClosed: true,
      }),
    });
    const result = simulateApprovalConflictStress({
      conflictId: "conflict-upstream-fail",
      recommendationResult,
      deterministicSeed: "seed-f",
      createdAt: "2026-05-17T12:14:00.000Z",
    });

    expect(result.record.failClosed).toBe(true);
    expect(result.record.approvalConflictState).toBe("FAIL_CLOSED");
  });
});
