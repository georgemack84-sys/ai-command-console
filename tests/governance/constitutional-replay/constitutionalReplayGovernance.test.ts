import { describe, expect, it } from "vitest";
import { buildConstitutionalReplayFixture } from "@/tests/integration/constitutional-replay/helpers";

describe("constitutional replay governance", () => {
  it("fails closed on governance substitution attacks", () => {
    const result = buildConstitutionalReplayFixture({
      metadata: Object.freeze({ governanceSubstitution: true }),
    }).result;

    expect(result.record.failClosed).toBe(true);
    expect(result.errors.some((item) =>
      item.code === "CONSTITUTIONAL_REPLAY_GOVERNANCE_DRIFT",
    )).toBe(true);
  });
});
