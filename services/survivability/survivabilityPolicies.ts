export type SurvivabilityState =
  | "STABLE"
  | "DEGRADED"
  | "CONTAINED"
  | "ISOLATED"
  | "UNSTABLE"
  | "CRITICAL"
  | "COLLAPSING"
  | "SURVIVABILITY_MODE"
  | "EMERGENCY_STABILIZATION"
  | "PARTIAL_RECOVERY"
  | "RECOVERING"
  | "DISPUTED"
  | "FROZEN";

export type ContainmentAction =
  | "ALLOW"
  | "WARN"
  | "REQUIRE_APPROVAL"
  | "ESCALATE"
  | "FREEZE"
  | "CONTAIN"
  | "ISOLATE"
  | "QUARANTINE"
  | "DEGRADE"
  | "DENY";

export type DegradationMode =
  | "FULL_OPERATIONAL"
  | "DEGRADED_OPERATIONAL"
  | "GOVERNANCE_PRIORITY"
  | "CONTAINMENT_PRIORITY"
  | "AUDIT_PRIORITY"
  | "ISOLATED_OPERATION"
  | "EMERGENCY_STABILIZATION"
  | "SURVIVABILITY_MODE";

export type AutonomyDowngradeLevel =
  | "FULL_AUTONOMY"
  | "SUPERVISED"
  | "ASSISTIVE"
  | "ADVISORY_ONLY"
  | "FROZEN";

export const SURVIVABILITY_THRESHOLDS = {
  emergencyIntegrity: 0.32,
  criticalRecoverability: 0.35,
  instabilityHigh: 0.7,
  collapseRiskHigh: 0.78,
  containmentLow: 0.5,
  tenantRiskHigh: 0.72,
  dependencyRiskHigh: 0.72,
} as const;

export function recommendContainmentAction(input: {
  constitutionalIntegrity: number;
  systemicInstability: number;
  survivabilityConfidence: number;
  containmentEffectiveness: number;
  escalationPressure: number;
  dependencyCollapseRisk: number;
  tenantSurvivabilityRisk: number;
  disputed?: boolean;
  freezeActive?: boolean;
}): ContainmentAction {
  if (input.disputed || input.freezeActive) return "FREEZE";
  if (input.constitutionalIntegrity < SURVIVABILITY_THRESHOLDS.emergencyIntegrity) return "DENY";
  if (input.tenantSurvivabilityRisk >= SURVIVABILITY_THRESHOLDS.tenantRiskHigh) return "QUARANTINE";
  if (input.dependencyCollapseRisk >= SURVIVABILITY_THRESHOLDS.dependencyRiskHigh) return "ISOLATE";
  if (input.systemicInstability >= SURVIVABILITY_THRESHOLDS.collapseRiskHigh || input.survivabilityConfidence < SURVIVABILITY_THRESHOLDS.criticalRecoverability) return "CONTAIN";
  if (input.containmentEffectiveness < SURVIVABILITY_THRESHOLDS.containmentLow) return "DEGRADE";
  if (input.escalationPressure >= SURVIVABILITY_THRESHOLDS.instabilityHigh) return "ESCALATE";
  if (input.systemicInstability >= 0.45) return "WARN";
  return "ALLOW";
}

export function determineSurvivabilityState(input: {
  constitutionalIntegrity: number;
  governanceContinuity: number;
  operationalViability: number;
  systemicInstability: number;
  recoverabilityConfidence: number;
  containmentEffectiveness: number;
  disputed?: boolean;
  freezeActive?: boolean;
  emergencyControlsRequired?: boolean;
}) : SurvivabilityState {
  if (input.disputed) return "DISPUTED";
  if (input.freezeActive) return "FROZEN";
  if (input.emergencyControlsRequired && input.systemicInstability >= SURVIVABILITY_THRESHOLDS.collapseRiskHigh) return "EMERGENCY_STABILIZATION";
  if (input.constitutionalIntegrity < SURVIVABILITY_THRESHOLDS.emergencyIntegrity || input.recoverabilityConfidence < SURVIVABILITY_THRESHOLDS.criticalRecoverability) return "COLLAPSING";
  if (input.systemicInstability >= SURVIVABILITY_THRESHOLDS.collapseRiskHigh) return "CRITICAL";
  if (input.containmentEffectiveness < SURVIVABILITY_THRESHOLDS.containmentLow) return "CONTAINED";
  if (input.systemicInstability >= SURVIVABILITY_THRESHOLDS.instabilityHigh || input.governanceContinuity < 0.45) return "SURVIVABILITY_MODE";
  if (input.systemicInstability >= 0.55 || input.operationalViability < 0.5) return "UNSTABLE";
  if (input.systemicInstability >= 0.35) return "DEGRADED";
  return "STABLE";
}
