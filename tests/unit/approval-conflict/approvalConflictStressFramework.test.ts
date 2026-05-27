import { describe, expect, it } from "vitest";
import { simulateApprovalConflictStress } from "@/services/approval-conflict";
import { buildRecommendationIntegrityFixture } from "@/tests/integration/approval-conflict/helpers";

describe("approvalConflictStressFramework", () => {
  it("is deterministic for the same input", () => {
    const recommendationResult = buildRecommendationIntegrityFixture();
    const input = {
      conflictId: "conflict-1",
      recommendationResult,
      deterministicSeed: "seed-1",
      createdAt: "2026-05-17T12:00:00.000Z",
      metadata: Object.freeze({ mode: "baseline" }),
    } as const;

    const first = simulateApprovalConflictStress(input);
    const second = simulateApprovalConflictStress(input);

    expect(first.deterministicHash).toBe(second.deterministicHash);
    expect(first.record.approvalConflictState).toBe("SIMULATED");
    expect(first.authorityContract.executionAuthority).toBe(false);
  });

  it("fails closed on circular approval chains", () => {
    const result = simulateApprovalConflictStress({
      conflictId: "conflict-circular",
      recommendationResult: buildRecommendationIntegrityFixture(),
      deterministicSeed: "seed-2",
      createdAt: "2026-05-17T12:05:00.000Z",
      metadata: Object.freeze({ circularApproval: true }),
    });

    expect(result.record.failClosed).toBe(true);
    expect(result.errors.some((item) => item.code === "APPROVAL_CONFLICT_CIRCULAR_CHAIN")).toBe(true);
  });
});
