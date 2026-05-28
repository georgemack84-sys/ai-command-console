import { describe, expect, it } from "vitest";

import { buildConstitutionalCoordinationFixture } from "@/tests/integration/constitutional-coordination/helpers";

describe("constitutional replay-safe lineage", () => {
  it("binds replay lineage without repair", () => {
    const fixture = buildConstitutionalCoordinationFixture();
    expect(fixture.record.replayBinding.valid).toBe(true);
    expect(fixture.record.replayBinding.bindingHash.length).toBeGreaterThan(0);
  });
});
