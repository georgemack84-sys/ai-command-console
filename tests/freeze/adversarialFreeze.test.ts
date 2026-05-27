import { describe, expect, it } from "vitest";
import { freezeUnsafeCoordination } from "@/services/freeze/coordinationFreezeEngine";

describe("adversarial freeze constraints", () => {
  it("does not create resumable coordination", () => {
    const result = freezeUnsafeCoordination({
      proposalId: "proposal-a",
      drifts: Object.freeze([]),
      replayIntegrity: "quarantined",
      freshnessStatus: "expired",
      createdAt: "2026-05-17T06:10:00.000Z",
      metadata: Object.freeze({ pauseToken: "p" }),
    });
    expect(result.errors.map((error) => error.code)).toContain("FRESHNESS_PAUSE_RESUME_REJECTED");
  });
});
