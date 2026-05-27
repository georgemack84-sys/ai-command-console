import { describe, expect, it } from "vitest";

import {
  clampMetric,
  computeDependencyInstabilityScore,
  computeEscalationPressure,
  computeOperatorInterventionPressure,
  computeRecoveryPressure,
  computeRecoverySuccessConfidence,
  computeReplayInstabilityScore,
  computeStaleExecutionSpread,
} from "@/services/stability/stabilityMetrics";

describe("stabilityMetrics", () => {
  it("clamps metrics between 0 and 1", () => {
    expect(clampMetric(4)).toBe(1);
    expect(clampMetric(-1)).toBe(0);
  });

  it("avoids NaN on missing values", () => {
    expect(clampMetric(undefined)).toBeGreaterThanOrEqual(0);
    expect(Number.isNaN(computeReplayInstabilityScore({}))).toBe(false);
  });

  it("caps extreme values safely", () => {
    expect(computeRecoveryPressure({ activeRecoveries: 99, failedRecoveries: 99, repeatedFailures: 99 })).toBe(1);
    expect(computeEscalationPressure({ escalationCount: 99, unresolvedEscalations: 99 })).toBe(1);
  });

  it("applies conservative defaults", () => {
    expect(computeRecoverySuccessConfidence({})).toBeLessThan(0.5);
    expect(computeDependencyInstabilityScore([])).toBeLessThanOrEqual(0.1);
    expect(computeOperatorInterventionPressure()).toBeLessThanOrEqual(0.1);
    expect(computeStaleExecutionSpread()).toBeLessThanOrEqual(0.15);
  });
});
