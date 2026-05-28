import { describe, expect, it } from "vitest";
import { buildAdversarialTelemetryFixture } from "@/tests/integration/adversarial-telemetry/helpers";

describe("adversarial telemetry boundary", () => {
  it("detects hidden orchestration markers", () => {
    const fixture = buildAdversarialTelemetryFixture({
      metadata: {
        hiddenOrchestration: true,
      },
    });

    expect(fixture.result.errors.map((item) => item.code)).toContain("ADVERSARIAL_TELEMETRY_HIDDEN_ORCHESTRATION");
  });
});
