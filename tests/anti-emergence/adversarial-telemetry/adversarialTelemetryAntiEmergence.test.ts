import { describe, expect, it } from "vitest";
import { buildAdversarialTelemetryFixture } from "@/tests/integration/adversarial-telemetry/helpers";

describe("adversarial telemetry anti-emergence", () => {
  it("detects recursive coordination pressure and adaptive replay mutation", () => {
    const fixture = buildAdversarialTelemetryFixture({
      metadata: {
        recursiveCoordinationPressure: true,
        adaptiveReplayMutation: true,
      },
    });

    expect(fixture.result.errors.map((item) => item.code)).toContain("ADVERSARIAL_TELEMETRY_CONTAINMENT_PRESSURE");
    expect(fixture.result.errors.map((item) => item.code)).toContain("ADVERSARIAL_TELEMETRY_RUNTIME_CONTAMINATION");
  });
});
