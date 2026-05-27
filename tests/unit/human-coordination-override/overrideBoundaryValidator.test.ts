import { describe, expect, it } from "vitest";

import { buildHumanCoordinationOverrideFixture } from "@/tests/integration/human-coordination-override/helpers";

describe("human override boundary validation", () => {
  it("rejects hidden execution and replay repair markers", () => {
    const fixture = buildHumanCoordinationOverrideFixture({
      metadata: Object.freeze({ execute: true, repairReplay: true }),
    });
    expect(fixture.result.errors.map((error) => error.code)).toEqual(expect.arrayContaining([
      "HUMAN_COORDINATION_OVERRIDE_EXECUTION_FORBIDDEN",
      "HUMAN_COORDINATION_OVERRIDE_REPLAY_REPAIR",
    ]));
  });
});
