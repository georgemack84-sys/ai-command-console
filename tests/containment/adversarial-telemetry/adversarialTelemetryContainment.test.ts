import { describe, expect, it } from "vitest";
import { buildAdversarialTelemetryFixture } from "@/tests/integration/adversarial-telemetry/helpers";

describe("adversarial telemetry containment", () => {
  it("raises containment pressure and freeze recommendation deterministically", () => {
    const fixture = buildAdversarialTelemetryFixture({
      metadata: {
        recursiveCoordinationPressure: true,
        hiddenOrchestrationPressure: true,
        authorityExpansionPressure: true,
      },
    });

    expect(fixture.result.containmentPressure.containmentRiskScore).toBeGreaterThan(0);
    expect(fixture.result.containmentPressure.freezeRecommended).toBe(true);
  });
});
