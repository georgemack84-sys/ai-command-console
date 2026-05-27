import { describe, expect, it } from "vitest";

import { buildSovereigntyTelemetrySnapshot } from "@/services/sovereignty/sovereigntyTelemetry";

describe("buildSovereigntyTelemetrySnapshot", () => {
  it("forces advisory-only telemetry snapshots", () => {
    const snapshot = buildSovereigntyTelemetrySnapshot({
      createdAt: "2026-05-09T00:00:00.000Z",
      assessment: {
        sovereigntyState: "STABLE",
        governanceIntegrity: 0.8,
        survivabilityConfidence: 0.76,
        systemicRisk: 0.22,
        containmentEffectiveness: 0.81,
        escalationPressure: 0.18,
        emergencyControlsRequired: false,
        unstableDomains: [],
      },
    });

    expect(snapshot.advisoryOnly).toBe(true);
    expect(snapshot.snapshotId).toContain("sovereignty:");
  });
});
