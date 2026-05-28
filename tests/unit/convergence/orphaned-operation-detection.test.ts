import { describe, expect, it } from "vitest";

import { detectOrphanedOperations } from "@/services/convergence/orphanedOperationDetection";

describe("detectOrphanedOperations", () => {
  it("detects orphaned operations", () => {
    const result = detectOrphanedOperations({
      blockedRecoveries: [{ executionId: "execution_1" }],
      leaseConflicts: [{ executionId: "execution_2" }],
    });

    expect(result.orphanedOperations.length).toBeGreaterThan(0);
  });
});
