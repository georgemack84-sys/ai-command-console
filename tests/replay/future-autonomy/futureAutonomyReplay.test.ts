import { describe, expect, it } from "vitest";
import { buildFutureAutonomyFixture } from "@/tests/integration/future-autonomy/helpers";

describe("future autonomy replay", () => {
  it("fails closed on replay repair and current-state substitution markers", () => {
    const fixture = buildFutureAutonomyFixture({
      metadata: {
        replayRepair: true,
        currentStateSubstitution: true,
      },
    });

    expect(fixture.result.errors.map((item) => item.code)).toContain("FUTURE_AUTONOMY_REPLAY_MISMATCH");
    expect(fixture.result.errors.map((item) => item.code)).toContain("FUTURE_AUTONOMY_CURRENT_STATE_SUBSTITUTION");
    expect(fixture.result.result.status).not.toBe("safe");
  });
});
