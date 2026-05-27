import type { DriftRecord } from "@/types/freshness";
import { resolveFreshnessSeverity } from "./freshnessSeverityResolver";

export function classifyCoordinationRisk(drifts: readonly DriftRecord[]): Readonly<{
  severity: "low" | "moderate" | "high" | "critical";
  requiresEscalation: boolean;
  freezeRequired: boolean;
}> {
  const severity = resolveFreshnessSeverity(drifts);
  return Object.freeze({
    severity,
    requiresEscalation: drifts.some((drift) => drift.requiresEscalation),
    freezeRequired: drifts.some((drift) => drift.freezeRequired),
  });
}
