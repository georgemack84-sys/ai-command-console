import { describe, expect, it } from "vitest";
import { simulateApprovalConflictStress } from "@/services/approval-conflict";
import { buildRecommendationIntegrityFixture } from "@/tests/integration/approval-conflict/helpers";

describe("approval conflict security markers", () => {
  it("fails closed on runtime mutation markers", () => {
    const result = simulateApprovalConflictStress({
      conflictId: "conflict-runtime",
      recommendationResult: buildRecommendationIntegrityFixture(),
      deterministicSeed: "seed-s",
      createdAt: "2026-05-17T12:16:00.000Z",
      metadata: Object.freeze({ runtimeMutation: true }),
    });

    expect(result.errors.some((item) => item.code === "APPROVAL_CONFLICT_RUNTIME_MUTATION_ATTEMPT")).toBe(true);
  });
});
