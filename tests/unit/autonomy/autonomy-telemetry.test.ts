import { describe, expect, it } from "vitest";

import { buildSupervisionTelemetry } from "@/services/autonomy/autonomyTelemetry";

describe("buildSupervisionTelemetry", () => {
  it("emits deterministic supervision telemetry", () => {
    const result = buildSupervisionTelemetry({
      runtimeHealth: 0.42,
      operationalRisk: 0.71,
      escalationPressure: 0.74,
      stabilizationSignal: 1,
      timestamp: "2026-05-09T00:00:00.000Z",
    });

    expect(result).toHaveLength(4);
    expect(result[0]?.metric).toBe("runtime_health");
  });
});
