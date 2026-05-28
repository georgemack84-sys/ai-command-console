import { describe, expect, it } from "vitest";

import { assessOperationalStability } from "@/services/stability/operationalStabilityEngine";
import { summarizeStabilityTelemetry } from "@/services/stability/stabilityTelemetry";

describe("summarizeStabilityTelemetry", () => {
  it("is serializable and deterministic", () => {
    const assessment = assessOperationalStability({
      continuity: {
        continuityConfidence: 0.81,
        degradedDependencies: ["workers"],
      },
      timestamp: "2026-05-09T00:00:00.000Z",
    });

    const telemetry = summarizeStabilityTelemetry(assessment);

    expect(JSON.parse(JSON.stringify(telemetry))).toEqual(telemetry);
  });

  it("includes reasons and no unsafe internals", () => {
    const telemetry = summarizeStabilityTelemetry(assessOperationalStability({
      stewardshipSignals: { disputed: true },
    }));

    expect(Array.isArray(telemetry.reasons)).toBe(true);
    expect("stack" in telemetry).toBe(false);
  });
});
