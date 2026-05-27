import { describe, expect, it } from "vitest";
import { buildConstitutionalReadinessFixture } from "@/tests/integration/constitutional-readiness/helpers";
import { buildAdversarialTelemetryFixture } from "@/tests/integration/adversarial-telemetry/helpers";

describe("constitutional readiness fail-closed", () => {
  it("inherits frozen containment from upstream telemetry", () => {
    const telemetry = buildAdversarialTelemetryFixture({
      metadata: Object.freeze({ hiddenOrchestration: true }),
    }).result;
    const fixture = buildConstitutionalReadinessFixture({
      adversarialTelemetryResult: telemetry,
    });

    expect(fixture.result.record.failClosed).toBe(true);
    expect(fixture.result.record.readinessClassification).toBe("FROZEN");
  });
});
