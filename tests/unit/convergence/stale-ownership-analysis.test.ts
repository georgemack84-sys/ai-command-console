import { describe, expect, it } from "vitest";

import { analyzeStaleOwnership } from "@/services/convergence/staleOwnershipAnalysis";

describe("analyzeStaleOwnership", () => {
  it("detects stale ownership claims", () => {
    const result = analyzeStaleOwnership({
      leaseConflicts: [{ executionId: "execution_1", ownerId: "worker_1" }],
      escalationFrozen: true,
    });

    expect(result.staleOwnershipClaims).toContain("execution_1:worker_1");
  });
});
