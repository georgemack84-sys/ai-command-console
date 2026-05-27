import type { DriftRecord } from "@/types/freshness";

export function resolveFreshnessSeverity(drifts: readonly DriftRecord[]): "low" | "moderate" | "high" | "critical" {
  if (drifts.some((drift) => drift.severity === "critical")) {
    return "critical";
  }
  if (drifts.some((drift) => drift.severity === "high")) {
    return "high";
  }
  if (drifts.some((drift) => drift.severity === "moderate")) {
    return "moderate";
  }
  return "low";
}
