import type { AutonomyDowngradeLevel, DegradationMode, SurvivabilityState } from "./survivabilityPolicies";

function downgradeAutonomy(input: {
  currentAutonomyLevel: AutonomyDowngradeLevel;
  survivabilityState: SurvivabilityState;
  systemicInstability: number;
}) : AutonomyDowngradeLevel {
  if (input.survivabilityState === "FROZEN" || input.survivabilityState === "DISPUTED") return "FROZEN";
  if (["COLLAPSING", "EMERGENCY_STABILIZATION", "CRITICAL"].includes(input.survivabilityState)) return "ADVISORY_ONLY";
  if (["CONTAINED", "ISOLATED", "SURVIVABILITY_MODE", "UNSTABLE"].includes(input.survivabilityState)) return "ASSISTIVE";
  if (input.systemicInstability >= 0.45 && input.currentAutonomyLevel === "FULL_AUTONOMY") return "SUPERVISED";
  return input.currentAutonomyLevel;
}

export function determineDegradationMode(input: {
  survivabilityState: SurvivabilityState;
  systemicInstability: number;
  governancePriorityRequired: boolean;
  containmentPriorityRequired: boolean;
  auditPriorityRequired: boolean;
  currentAutonomyLevel: AutonomyDowngradeLevel;
}) : {
  degradationMode: DegradationMode;
  autonomyLevel: AutonomyDowngradeLevel;
} {
  let degradationMode: DegradationMode = "FULL_OPERATIONAL";
  if (["COLLAPSING", "EMERGENCY_STABILIZATION", "CRITICAL"].includes(input.survivabilityState)) degradationMode = "EMERGENCY_STABILIZATION";
  else if (input.containmentPriorityRequired) degradationMode = "CONTAINMENT_PRIORITY";
  else if (input.governancePriorityRequired) degradationMode = "GOVERNANCE_PRIORITY";
  else if (input.auditPriorityRequired) degradationMode = "AUDIT_PRIORITY";
  else if (input.survivabilityState === "ISOLATED") degradationMode = "ISOLATED_OPERATION";
  else if (["UNSTABLE", "SURVIVABILITY_MODE", "CONTAINED"].includes(input.survivabilityState)) degradationMode = "SURVIVABILITY_MODE";
  else if (input.systemicInstability >= 0.35) degradationMode = "DEGRADED_OPERATIONAL";

  return {
    degradationMode,
    autonomyLevel: downgradeAutonomy(input),
  };
}
