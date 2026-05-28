import type { ValidationOutcome } from "./types";
import { dedupeReasons } from "./validationPolicies";

export function validateAdvisoryConstraints(input: {
  readiness?: Record<string, unknown>;
  simulationForecast?: Record<string, unknown>;
  decisionIntelligence?: Record<string, unknown>;
  dashboard?: Record<string, unknown>;
}): ValidationOutcome {
  const blockedReasons: string[] = [];

  if (input.readiness?.advisoryOnly !== true) blockedReasons.push("readiness_not_advisory_only");
  if (input.readiness?.liveAutonomyEnabled !== false) blockedReasons.push("advisory_drift_live_autonomy_enabled");
  if (input.readiness?.requiresOperatorApproval !== true) blockedReasons.push("readiness_missing_operator_approval");
  if (input.simulationForecast?.advisoryOnly !== true) blockedReasons.push("simulation_not_advisory_only");
  if (input.decisionIntelligence?.mutable !== false) blockedReasons.push("decision_intelligence_mutable");
  if (input.dashboard?.readOnly !== true) blockedReasons.push("dashboard_not_read_only");

  return {
    valid: blockedReasons.length === 0,
    freezeActivated: blockedReasons.length > 0,
    containmentActivated: false,
    operatorReviewRequired: blockedReasons.length > 0,
    blockedReasons: dedupeReasons(blockedReasons),
  };
}
