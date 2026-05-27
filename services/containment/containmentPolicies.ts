import { recommendContainmentAction, type ContainmentAction } from "../survivability/survivabilityPolicies";

export function buildContainmentPolicies(input: {
  constitutionalIntegrity: number;
  governanceCollapseRisk: number;
  survivabilityConfidence: number;
  containmentEffectiveness: number;
  escalationPressure: number;
  systemicInstability: number;
  dependencyCollapseRisk?: number;
  tenantSurvivabilityRisk?: number;
  disputed?: boolean;
  freezeActive?: boolean;
}) {
  const recommendedAction: ContainmentAction = recommendContainmentAction({
    constitutionalIntegrity: input.constitutionalIntegrity,
    systemicInstability: input.systemicInstability,
    survivabilityConfidence: input.survivabilityConfidence,
    containmentEffectiveness: input.containmentEffectiveness,
    escalationPressure: input.escalationPressure,
    dependencyCollapseRisk: input.dependencyCollapseRisk ?? input.governanceCollapseRisk,
    tenantSurvivabilityRisk: input.tenantSurvivabilityRisk ?? input.governanceCollapseRisk,
    disputed: input.disputed,
    freezeActive: input.freezeActive,
  });

  return {
    recommendedAction,
    containmentRequired: ["FREEZE", "CONTAIN", "ISOLATE", "QUARANTINE", "DEGRADE", "DENY"].includes(recommendedAction),
  };
}
