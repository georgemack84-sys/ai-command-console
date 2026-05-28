import { describe, expect, it } from "vitest";

import { containCoordinationConflict } from "@/services/coordination/conflictContainment";

describe("containCoordinationConflict", () => {
  it("freezes unsafe coordination conflicts", () => {
    const result = containCoordinationConflict({
      conflictState: "CONFLICT",
      disputedTruthPresent: false,
      replayMismatch: false,
    });

    expect(result.frozen).toBe(true);
    expect(result.containmentRequired).toBe(true);
  });
});
