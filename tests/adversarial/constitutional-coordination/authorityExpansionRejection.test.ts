import { describe, expect, it } from "vitest";

import { buildConstitutionalCoordinationFixture } from "@/tests/integration/constitutional-coordination/helpers";

describe("constitutional coordination authority expansion rejection", () => {
  it("fails closed on authority expansion markers", () => {
    const fixture = buildConstitutionalCoordinationFixture({
      metadata: { authorityInheritance: true },
    });
    expect(fixture.record.validation.failClosed).toBe(true);
  });
});
