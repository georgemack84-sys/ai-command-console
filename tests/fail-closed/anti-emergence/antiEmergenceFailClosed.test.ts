import { describe, expect, it } from "vitest";
import { buildAntiEmergenceFixture } from "@/tests/integration/anti-emergence/helpers";

describe("anti-emergence containment fail-closed", () => {
  it("freezes on containment mutation", () => {
    const fixture = buildAntiEmergenceFixture({
      metadata: Object.freeze({ containmentMutation: true }),
    });

    expect(["frozen", "invalid", "revoked"]).toContain(fixture.result.record.classification);
  });
});
