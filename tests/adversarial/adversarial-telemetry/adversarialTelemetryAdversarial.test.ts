import { describe, expect, it } from "vitest";
import { buildAdversarialTelemetryFixture } from "@/tests/integration/adversarial-telemetry/helpers";

describe("adversarial telemetry adversarial", () => {
  it("detects synthetic authority and hidden orchestration pressure", () => {
    const fixture = buildAdversarialTelemetryFixture({
      metadata: {
        syntheticAuthorityInjection: true,
        hiddenOrchestrationPressure: true,
      },
    });

    expect(fixture.result.errors.map((item) => item.code)).toContain("ADVERSARIAL_TELEMETRY_SYNTHETIC_AUTHORITY");
    expect(fixture.result.record.telemetryState).toBe("blocked");
  });
});
