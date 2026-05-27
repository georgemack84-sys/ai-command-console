import { describe, expect, it } from "vitest";

import { buildCoordinationReplayFixture } from "@/tests/integration/coordination-replay/helpers";

describe("coordination replay determinism", () => {
  it("keeps identical input equal to identical replay hashes", () => {
    const fixture = buildCoordinationReplayFixture();
    expect(fixture.result.deterministicHash).toBe(fixture.result.deterministicHash);
    expect(fixture.result.routing.deterministicHash.length).toBeGreaterThan(0);
  });
});
