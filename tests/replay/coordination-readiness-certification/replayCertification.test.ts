import { describe, expect, it } from "vitest";

import { buildCoordinationReadinessFixture } from "@/tests/integration/coordination-readiness-certification/helpers";

describe("coordination readiness replay", () => {
  it("preserves deterministic replay-safe certification evidence", () => {
    const fixture = buildCoordinationReadinessFixture();
    expect(fixture.result.record.replaySafe).toBe(true);
    expect(fixture.result.replayInspection.replayDeterministic).toBe(true);
  });
});
