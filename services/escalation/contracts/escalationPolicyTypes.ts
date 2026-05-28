import type { EscalationSeverity, EscalationType } from "./escalationTypes";

export type EscalationPolicyDecision = {
  escalationType: EscalationType;
  escalationSeverity: EscalationSeverity;
  requiresContainment: boolean;
  requiresOperatorVisibility: boolean;
  governanceRequired: boolean;
  emergency: boolean;
  recommendedActions: string[];
};
