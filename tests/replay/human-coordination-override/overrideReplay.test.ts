import { describe, expect, it } from "vitest";

import { buildHumanCoordinationOverrideFixture } from "@/tests/integration/human-coordination-override/helpers";

describe("human override replay", () => {
  it("preserves deterministic replay-safe inspection", () => {
    const fixture = buildHumanCoordinationOverrideFixture();
    expect(fixture.result.replayInspection.replayDeterministic).toBe(true);
    expect(fixture.result.record.replaySafe).toBe(true);
  });
});
