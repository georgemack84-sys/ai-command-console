import { describe, expect, it } from "vitest";

import { buildConstitutionalCoordinationFixture } from "@/tests/integration/constitutional-coordination/helpers";

describe("constitutional governance binding", () => {
  it("binds governance snapshot and lineage deterministically", () => {
    const fixture = buildConstitutionalCoordinationFixture();
    expect(fixture.record.governanceBinding.valid).toBe(true);
    expect(fixture.record.governanceBinding.governanceLineageId.length).toBeGreaterThan(0);
  });
});
