import { describe, expect, it } from "vitest";
import { buildAdversarialTelemetryFixture } from "@/tests/integration/adversarial-telemetry/helpers";

describe("adversarial telemetry governance", () => {
  it("detects governance suppression and mismatch", () => {
    const fixture = buildAdversarialTelemetryFixture({
      metadata: {
        governanceSuppression: true,
      },
    });

    expect(fixture.result.errors.map((item) => item.code)).toContain("ADVERSARIAL_TELEMETRY_GOVERNANCE_MISMATCH");
  });
});
