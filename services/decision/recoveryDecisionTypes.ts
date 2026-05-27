export type ConstitutionalEnforcementAction =
  | "ALLOW"
  | "WARN"
  | "REQUIRE_APPROVAL"
  | "ESCALATE"
  | "FREEZE"
  | "CONTAIN"
  | "DENY";

export type RecoveryDecisionIntelligenceResult = {
  decisionId: string;
  executionId: string;
  recommendedAction:
    | "REPLAY"
    | "ROLLBACK"
    | "REASSIGN"
    | "ESCALATE"
    | "CONTAIN"
    | "CONTINUE_DEGRADED"
    | "HOLD"
    | "OPERATOR_INTERVENTION"
    | "GOVERNANCE_REVIEW"
    | "FREEZE";
  constitutionalAction: ConstitutionalEnforcementAction;
  constitutionallyAllowed: boolean;
  requiresApproval: boolean;
  requiresEscalation: boolean;
  requiresContainment: boolean;
  decisionConfidence: number;
  governanceRisk: number;
  continuityImpact: number;
  riskScore: number;
  uncertaintyLevel: "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
  reasons: string[];
  blockedReasons: string[];
  constitutionalViolations: string[];
  forecastLineageIds: string[];
  mutable: false;
  generatedAt: string;
};

export type RecoveryDecisionEvidence = {
  dashboard: Record<string, any>;
  forecasting: Record<string, any>;
  evidenceSources: string[];
  forecastLineageIds: string[];
  immutableEvidenceValid: boolean;
};
