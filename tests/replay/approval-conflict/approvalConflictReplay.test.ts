import { describe, expect, it } from "vitest";
import { simulateApprovalConflictStress } from "@/services/approval-conflict";
import { buildRecommendationIntegrityFixture } from "@/tests/integration/approval-conflict/helpers";

describe("approval conflict replay", () => {
  it("fails closed on replay repair attempts", () => {
    const result = simulateApprovalConflictStress({
      conflictId: "conflict-replay",
      recommendationResult: buildRecommendationIntegrityFixture(),
      deterministicSeed: "seed-r",
      createdAt: "2026-05-17T12:10:00.000Z",
      metadata: Object.freeze({ replayRepair: true, syntheticContinuity: true }),
    });

    expect(result.errors.some((item) => item.code === "APPROVAL_CONFLICT_REPLAY_INCONSISTENT")).toBe(true);
  });
});
