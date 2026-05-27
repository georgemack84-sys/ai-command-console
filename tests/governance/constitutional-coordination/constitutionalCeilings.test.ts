import { describe, expect, it } from "vitest";

import { buildConstitutionalCoordinationFixture } from "@/tests/integration/constitutional-coordination/helpers";

describe("constitutional ceilings", () => {
  it("inherits restricted containment ceilings upward", () => {
    const fixture = buildConstitutionalCoordinationFixture({
      metadata: { schedule: true },
    });
    expect(fixture.record.constitutionalCeilingLevel).toBe("frozen");
  });
});
