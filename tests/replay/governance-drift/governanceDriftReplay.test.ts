import { describe, expect, it } from "vitest";
import { buildGovernanceDriftFixture } from "@/tests/integration/governance-drift/helpers";

describe("governance drift replay", () => {
  it("fails closed on replay repair attempts", () => {
    const result = buildGovernanceDriftFixture({
      metadata: Object.freeze({ replayRepair: true, syntheticLineageRepair: true }),
    }).result;

    expect(result.errors.some((item) => item.code === "GOVERNANCE_DRIFT_REPLAY_REPAIR")).toBe(true);
  });
});
