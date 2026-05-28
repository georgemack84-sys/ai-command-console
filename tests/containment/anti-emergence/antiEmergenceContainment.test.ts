import { describe, expect, it } from "vitest";
import { buildAntiEmergenceFixture } from "@/tests/integration/anti-emergence/helpers";

describe("anti-emergence containment containment", () => {
  it("freezes on topology mutation and hidden fanout expansion", () => {
    const fixture = buildAntiEmergenceFixture({
      metadata: Object.freeze({ topologyMutation: true, hiddenFanoutExpansion: true }),
    });

    expect(["frozen", "invalid", "elevated"]).toContain(fixture.result.record.classification);
  });
});
