import { describe, expect, it } from "vitest";
import { buildAntiEmergenceFixture } from "@/tests/integration/anti-emergence/helpers";

describe("anti-emergence containment adversarial", () => {
  it("invalidates hidden orchestration injection and execution markers", () => {
    const fixture = buildAntiEmergenceFixture({
      metadata: Object.freeze({ hiddenOrchestrationInjection: true, executionMarkers: true }),
    });

    expect(fixture.result.record.classification).toBe("invalid");
  });
});
