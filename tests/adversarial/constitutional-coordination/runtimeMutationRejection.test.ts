import { describe, expect, it } from "vitest";

import { buildConstitutionalCoordinationFixture } from "@/tests/integration/constitutional-coordination/helpers";

describe("constitutional coordination runtime mutation rejection", () => {
  it("fails closed on runtime mutation markers", () => {
    const fixture = buildConstitutionalCoordinationFixture({
      metadata: { mutateRuntime: true },
    });
    expect(fixture.record.validation.failClosed).toBe(true);
  });
});
