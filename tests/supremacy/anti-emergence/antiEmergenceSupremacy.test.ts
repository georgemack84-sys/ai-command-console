import { describe, expect, it } from "vitest";
import { buildAntiEmergenceFixture } from "@/tests/integration/anti-emergence/helpers";

describe("anti-emergence containment supremacy", () => {
  it("revokes on containment becoming orchestration under operator supremacy", () => {
    const fixture = buildAntiEmergenceFixture({
      metadata: Object.freeze({ containmentBecomingOrchestration: true }),
    });

    expect(["invalid", "revoked", "frozen"]).toContain(fixture.result.record.classification);
  });
});
