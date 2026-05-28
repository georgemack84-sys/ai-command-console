import { describe, expect, it } from "vitest";
import { buildFutureAutonomyFixture } from "@/tests/integration/future-autonomy/helpers";

describe("future autonomy governance", () => {
  it("fails closed when governance ambiguity propagates into simulation", () => {
    const fixture = buildFutureAutonomyFixture({
      metadata: {
        governanceAmbiguity: true,
        latestGovernanceState: true,
      },
    });

    expect(fixture.result.result.status).not.toBe("safe");
    expect(fixture.result.result.governanceBound).toBe(true);
  });
});
