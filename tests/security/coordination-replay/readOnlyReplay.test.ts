import { describe, expect, it } from "vitest";

import { buildCoordinationReplayFixture } from "@/tests/integration/coordination-replay/helpers";

describe("coordination replay security", () => {
  it("remains reconstructive-only and read-only", () => {
    const fixture = buildCoordinationReplayFixture();
    expect(fixture.result.warnings[0]).toContain("reconstructive-only");
    expect(fixture.result.derivedOnly).toBe(true);
  });
});
