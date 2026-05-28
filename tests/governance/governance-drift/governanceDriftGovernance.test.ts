import { describe, expect, it } from "vitest";
import { buildGovernanceDriftFixture } from "@/tests/integration/governance-drift/helpers";

describe("governance drift governance", () => {
  it("fails closed on current-state substitution", () => {
    const result = buildGovernanceDriftFixture({
      metadata: Object.freeze({ currentStateSubstitution: true }),
    }).result;

    expect(result.errors.some((item) => item.code === "GOVERNANCE_DRIFT_CURRENT_STATE_SUBSTITUTION")).toBe(true);
    expect(result.record.failClosed).toBe(true);
  });
});
