import { describe, expect, it } from "vitest";
import { buildConstitutionalTelemetryFixture } from "@/tests/integration/constitutional-telemetry/helpers";

describe("constitutional telemetry containment", () => {
  it("raises visibility when containment pressure increases", () => {
    const fixture = buildConstitutionalTelemetryFixture({
      metadata: Object.freeze({ recommendationAnomaly: true }),
    });

    expect(fixture.result.events.some((event) => event.domain === "containment_pressure" || event.domain === "recommendation_anomaly")).toBe(true);
  });
});
