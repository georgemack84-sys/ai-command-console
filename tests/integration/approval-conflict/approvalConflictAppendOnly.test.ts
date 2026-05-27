import { describe, expect, it } from "vitest";
import { simulateApprovalConflictStress } from "@/services/approval-conflict";
import { buildRecommendationIntegrityFixture } from "./helpers";

describe("approval conflict append-only lineage", () => {
  it("appends lineage and replay ledger entries", () => {
    const first = simulateApprovalConflictStress({
      conflictId: "conflict-append",
      recommendationResult: buildRecommendationIntegrityFixture(),
      deterministicSeed: "seed-a",
      createdAt: "2026-05-17T12:00:00.000Z",
    });
    const second = simulateApprovalConflictStress({
      conflictId: "conflict-append",
      recommendationResult: buildRecommendationIntegrityFixture(),
      deterministicSeed: "seed-a",
      createdAt: "2026-05-17T12:01:00.000Z",
      existingLineage: first.lineage,
      existingReplayLedger: first.replayLedger,
    });

    expect(second.lineage.entries).toHaveLength(2);
    expect(second.replayLedger.length).toBeGreaterThan(first.replayLedger.length);
  });
});
