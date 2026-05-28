import { describe, expect, it } from "vitest";
import { buildAntiEmergenceFixture } from "@/tests/integration/anti-emergence/helpers";

describe("anti-emergence containment governance", () => {
  it("fails closed on governance detachment", () => {
    const fixture = buildAntiEmergenceFixture({
      metadata: Object.freeze({ governanceDetachment: true }),
    });

    expect(["disputed", "invalid", "frozen"]).toContain(fixture.result.record.classification);
    expect(fixture.result.record.failClosed).toBe(true);
  });
});
