import type { ConstitutionalResilienceAssessment } from "./resilienceTypes";

export function buildCollapsePreventionRecommendations(assessment: ConstitutionalResilienceAssessment) {
  return [
    ...(assessment.requiresFreeze ? ["freeze_runtime_chain"] : []),
    ...(assessment.requiresContainment ? ["preserve_containment_boundary"] : []),
    ...(assessment.requiresEscalation ? ["escalate_constitutional_risk"] : []),
    ...(assessment.requiresOperatorIntervention ? ["operator_review_required"] : []),
  ];
}

export type CollapsePreventionPlan = {
  preventionEventId: string;
  collapseRisk: number;
  protectedDomains: string[];
  containmentActions: string[];
  escalationActions: string[];
  survivabilityResult: string;
  advisoryOnly: true;
  createdAt: number;
};

export function buildCollapsePreventionPlan(input: {
  survivabilityState: string;
  collapseRisk: number;
  governanceSafe: boolean;
  isolatedDomains: string[];
  escalationPressure: number;
  containmentRequired: boolean;
  createdAt: number;
}) : CollapsePreventionPlan {
  const containmentActions = Array.from(new Set([
    ...(input.collapseRisk >= 0.7 ? ["FREEZE"] : []),
    ...(input.containmentRequired ? ["CONTAIN"] : []),
    ...(input.isolatedDomains.length > 0 ? ["ISOLATE"] : []),
    ...(!input.governanceSafe ? ["DENY"] : []),
  ]));

  return {
    preventionEventId: `collapse-prevention:${input.createdAt}`,
    collapseRisk: input.collapseRisk,
    protectedDomains: input.isolatedDomains,
    containmentActions,
    escalationActions: Array.from(new Set([
      ...(input.escalationPressure >= 0.55 ? ["escalate_constitutional_risk"] : []),
      ...(input.collapseRisk >= 0.7 ? ["operator_review_required"] : []),
    ])),
    survivabilityResult: input.survivabilityState,
    advisoryOnly: true,
    createdAt: input.createdAt,
  };
}
