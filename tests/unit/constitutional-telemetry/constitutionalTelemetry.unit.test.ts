import { describe, expect, it } from "vitest";
import { buildConstitutionalTelemetryFixture } from "@/tests/integration/constitutional-telemetry/helpers";

describe("constitutional telemetry unit", () => {
  it("is deterministic for identical inputs", () => {
    const first = buildConstitutionalTelemetryFixture();
    const second = buildConstitutionalTelemetryFixture();

    expect(first.result.deterministicHash).toBe(second.result.deterministicHash);
    expect(first.result.forensicExport.exportHash).toBe(second.result.forensicExport.exportHash);
    expect(first.result.correlation.correlationHash).toBe(second.result.correlation.correlationHash);
  });

  it("elevates visibility for recommendation anomalies without gaining authority", () => {
    const fixture = buildConstitutionalTelemetryFixture({
      metadata: Object.freeze({ recommendationAnomaly: true }),
    });

    expect(fixture.result.events.some((event) => event.domain === "recommendation_anomaly" && event.triggered)).toBe(true);
    expect(["elevated", "disputed", "frozen", "invalid"]).toContain(fixture.result.record.telemetryState);
  });
});
