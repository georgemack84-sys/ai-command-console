import { describe, expect, it } from "vitest";
import { buildEscalationDeterminismFixture } from "@/tests/integration/escalation-determinism/helpers";

describe("escalation determinism replay", () => {
  it("disputes replay mismatch", () => {
    const fixture = buildEscalationDeterminismFixture({
      metadata: Object.freeze({ replayMismatch: true }),
    });

    expect(["disputed", "frozen", "revoked"]).toContain(fixture.result.record.oversightState);
  });
});
