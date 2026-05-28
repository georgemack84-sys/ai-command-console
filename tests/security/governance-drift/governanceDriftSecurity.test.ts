import { describe, expect, it } from "vitest";
import { buildGovernanceDriftFixture } from "@/tests/integration/governance-drift/helpers";

describe("governance drift security markers", () => {
  it("fails closed on runtime mutation markers", () => {
    const result = buildGovernanceDriftFixture({
      metadata: Object.freeze({ runtimeMutation: true }),
    }).result;

    expect(result.errors.some((item) => item.code === "GOVERNANCE_DRIFT_RUNTIME_MUTATION")).toBe(true);
  });
});
