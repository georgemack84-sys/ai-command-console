import { describe, expect, it } from "vitest";
import { buildAdversarialTelemetryFixture } from "@/tests/integration/adversarial-telemetry/helpers";

describe("adversarial telemetry unit", () => {
  it("is deterministic for identical inputs", () => {
    const first = buildAdversarialTelemetryFixture();
    const second = buildAdversarialTelemetryFixture();

    expect(first.result.deterministicHash).toBe(second.result.deterministicHash);
    expect(first.result.metrics).toEqual(second.result.metrics);
  });

  it("records immutable metrics", () => {
    const fixture = buildAdversarialTelemetryFixture();

    expect(fixture.result.metrics.replay_stability_score).toBeGreaterThanOrEqual(0);
    expect(fixture.result.metrics.forensic_reconstruction_success_rate).toBeGreaterThanOrEqual(0);
  });
});
