import { describe, expect, it } from "vitest";
import { buildAntiEmergenceFixture } from "@/tests/integration/anti-emergence/helpers";

describe("anti-emergence containment replay", () => {
  it("disputes replay-hidden transitions", () => {
    const fixture = buildAntiEmergenceFixture({
      metadata: Object.freeze({ replayHiddenTransitions: true }),
    });

    expect(["disputed", "invalid", "frozen", "revoked"]).toContain(fixture.result.record.classification);
  });
});
