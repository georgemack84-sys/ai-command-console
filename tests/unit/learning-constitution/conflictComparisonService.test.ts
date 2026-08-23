import { describe, expect, it } from "vitest";

import { ConflictComparisonService } from "@/services/learning-constitution";

const scope = { type: "PROJECT", id: "noesis" } as const;

describe("ConflictComparisonService", () => {
  it("keeps authority, evidence, confidence, scope, and time as separate facts", () => {
    const comparisons = new ConflictComparisonService().compare({
      existing: { scope, evidence: [], confidence: 0.95, effectiveUntil: "2026-08-24T00:00:00.000Z" },
      candidate: { scope, evidence: [], confidence: 0.7, effectiveFrom: "2026-08-25T00:00:00.000Z" },
    });
    expect(comparisons).toMatchObject({
      scope: { outcome: "EQUIVALENT" },
      authority: { outcome: "UNKNOWN", rationaleCode: "AUTHORITY_RECORD_MISSING" },
      evidence: { outcome: "EQUIVALENT" },
      confidence: { outcome: "EXISTING_STRONGER" },
      temporal: { outcome: "CANDIDATE_STRONGER", rationaleCode: "EXISTING_TEMPORAL_APPLICABILITY_ENDED" },
      authorityEffect: "UNCHANGED",
      executionPermissionGranted: false,
    });
  });
});
