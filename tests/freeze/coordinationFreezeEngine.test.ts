import { describe, expect, it } from "vitest";
import { freezeUnsafeCoordination } from "@/services/freeze/coordinationFreezeEngine";

describe("coordination freeze engine", () => {
  it("freezes unsafe continuity on replay mismatch", () => {
    const result = freezeUnsafeCoordination({
      proposalId: "proposal-a",
      drifts: Object.freeze([]),
      replayIntegrity: "quarantined",
      freshnessStatus: "stale",
      createdAt: "2026-05-17T06:10:00.000Z",
    });
    expect(result.freeze.frozen).toBe(true);
    expect(result.freeze.terminalContainment).toBe(true);
  });
});
