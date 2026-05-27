import { describe, expect, it } from "vitest";
import { buildAdversarialTelemetryFixture } from "@/tests/integration/adversarial-telemetry/helpers";

describe("adversarial telemetry replay", () => {
  it("detects replay corruption and validator drift deterministically", () => {
    const fixture = buildAdversarialTelemetryFixture({
      metadata: {
        replayCorruption: true,
        validatorDrift: true,
      },
    });

    expect(fixture.result.errors.map((item) => item.code)).toContain("ADVERSARIAL_TELEMETRY_VALIDATOR_DRIFT");
    expect(fixture.result.record.telemetryState).not.toBe("stable");
  });
});
