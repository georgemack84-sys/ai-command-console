import { describe, expect, it } from "vitest";

import { resolveCoordinationConflict } from "@/services/coordination/coordinationResolution";

describe("resolveCoordinationConflict", () => {
  it("freezes unresolved replay mismatch", () => {
    const result = resolveCoordinationConflict({
      disputedTruthPresent: false,
      containmentRequired: false,
      raceDetected: false,
      replayMismatch: true,
      approvalBypassAttempted: false,
    });

    expect(result.conflictState).toBe("FROZEN");
  });
});
