import type { SamDegradedMode } from "../scaling/samScalingTypes";
import type { SamLoadScenarioMetrics, SamLoadScenarioResult, SamLoadScenarioType } from "./samLoadTypes";

export function createSamLoadMetrics(overrides: Partial<SamLoadScenarioMetrics> = {}): SamLoadScenarioMetrics {
  return {
    duplicateDryRunDetected: false,
    duplicateAuditDetected: false,
    governanceBypassDetected: false,
    finalMode: "NORMAL",
    ...overrides,
  };
}

export function createSamLoadResult({
  type,
  passed,
  findings,
  metrics,
}: {
  type: SamLoadScenarioType;
  passed: boolean;
  findings: string[];
  metrics: SamLoadScenarioMetrics;
}): SamLoadScenarioResult {
  return {
    type,
    passed,
    findings,
    metrics,
  };
}
