import { describe, expect, it } from "vitest";
import { simulateApprovalConflictStress } from "@/services/approval-conflict";
import { buildRecommendationIntegrityFixture } from "@/tests/integration/approval-conflict/helpers";

describe("approval conflict isolation", () => {
  it("fails closed on execution import markers", () => {
    const result = simulateApprovalConflictStress({
      conflictId: "conflict-isolation",
      recommendationResult: buildRecommendationIntegrityFixture(),
      deterministicSeed: "seed-x",
      createdAt: "2026-05-17T12:15:00.000Z",
      metadata: Object.freeze({ executionImport: "child_process" }),
    });

    expect(result.errors.some((item) => item.code === "APPROVAL_CONFLICT_ISOLATION_VIOLATION")).toBe(true);
  });
});
