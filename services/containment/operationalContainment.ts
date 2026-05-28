import type { SurvivabilityState } from "../survivability/survivabilityPolicies";
import { buildContainmentPolicies } from "./containmentPolicies";
import { determineIsolationBoundaries } from "../survivability/survivabilityIsolation";

export type OperationalContainmentAssessment = {
  containmentState: SurvivabilityState;
  recommendedAction: import("../survivability/survivabilityPolicies").ContainmentAction;
  systemicInstability: number;
  governanceCollapseRisk: number;
  survivabilityConfidence: number;
  containmentEffectiveness: number;
  escalationPressure: number;
  operationalDivergenceRisk: number;
  dependencyCollapseRisk: number;
  constitutionalConflictSpreadRisk: number;
  tenantSurvivabilityRisk: number;
  isolatedDomains: string[];
  quarantinedDomains: string[];
  degradedDomains: string[];
  containmentRequired: boolean;
  operatorInterventionRequired: boolean;
  emergencyStabilizationRequired: boolean;
  createdAt: number;
};

export function assessOperationalContainment(input: {
  survivabilityState: SurvivabilityState;
  systemicInstability: number;
  governanceCollapseRisk: number;
  survivabilityConfidence: number;
  containmentEffectiveness: number;
  escalationPressure: number;
  operationalDivergenceRisk: number;
  dependencyCollapseRisk: number;
  constitutionalConflictSpreadRisk: number;
  tenantSurvivabilityRisk: number;
  unstableDomains: string[];
  nowMs: number;
}) : OperationalContainmentAssessment {
  const isolation = determineIsolationBoundaries({
    unstableDomains: input.unstableDomains,
    failingDomains: input.unstableDomains.filter((_, index) => index < Math.max(1, Math.floor(input.unstableDomains.length / 2))),
    dependencyCollapseRisk: input.dependencyCollapseRisk,
    tenantSurvivabilityRisk: input.tenantSurvivabilityRisk,
  });
  const policies = buildContainmentPolicies({
    constitutionalIntegrity: 1 - input.governanceCollapseRisk,
    governanceCollapseRisk: input.governanceCollapseRisk,
    survivabilityConfidence: input.survivabilityConfidence,
    containmentEffectiveness: input.containmentEffectiveness,
    escalationPressure: input.escalationPressure,
    systemicInstability: input.systemicInstability,
    dependencyCollapseRisk: input.dependencyCollapseRisk,
    tenantSurvivabilityRisk: input.tenantSurvivabilityRisk,
    disputed: input.survivabilityState === "DISPUTED",
    freezeActive: input.survivabilityState === "FROZEN",
  });

  const containmentState = policies.recommendedAction === "QUARANTINE"
    ? "ISOLATED"
    : policies.recommendedAction === "ISOLATE"
      ? "ISOLATED"
      : policies.recommendedAction === "CONTAIN"
        ? "CONTAINED"
        : input.survivabilityState;

  return {
    containmentState,
    recommendedAction: policies.recommendedAction,
    systemicInstability: input.systemicInstability,
    governanceCollapseRisk: input.governanceCollapseRisk,
    survivabilityConfidence: input.survivabilityConfidence,
    containmentEffectiveness: input.containmentEffectiveness,
    escalationPressure: input.escalationPressure,
    operationalDivergenceRisk: input.operationalDivergenceRisk,
    dependencyCollapseRisk: input.dependencyCollapseRisk,
    constitutionalConflictSpreadRisk: input.constitutionalConflictSpreadRisk,
    tenantSurvivabilityRisk: input.tenantSurvivabilityRisk,
    isolatedDomains: isolation.isolatedDomains,
    quarantinedDomains: isolation.quarantinedDomains,
    degradedDomains: isolation.degradedDomains,
    containmentRequired: policies.containmentRequired,
    operatorInterventionRequired: input.systemicInstability >= 0.55 || input.governanceCollapseRisk >= 0.6,
    emergencyStabilizationRequired: ["COLLAPSING", "CRITICAL", "EMERGENCY_STABILIZATION"].includes(input.survivabilityState),
    createdAt: input.nowMs,
  };
}
