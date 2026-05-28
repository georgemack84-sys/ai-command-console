import type { RecoveryDashboardReadModel } from "../recovery/verification/recoveryVerificationTypes";

export enum ConstitutionalResilienceState {
  STABLE = "STABLE",
  DEGRADED = "DEGRADED",
  STRESSED = "STRESSED",
  UNSTABLE = "UNSTABLE",
  CRITICAL = "CRITICAL",
  COLLAPSING = "COLLAPSING",
  CONTAINED = "CONTAINED",
  CONSTITUTIONALLY_FROZEN = "CONSTITUTIONALLY_FROZEN",
  SURVIVABILITY_DISPUTED = "SURVIVABILITY_DISPUTED",
  RECOVERING = "RECOVERING",
  VERIFIED = "VERIFIED",
}

export type ConstitutionalResilienceAssessment = {
  resilienceState: ConstitutionalResilienceState;
  survivabilityScore: number;
  constitutionalIntegrityScore: number;
  operationalRiskScore: number;
  collapseProbability: number;
  degradationVelocity: number;
  governanceIntegrity: number;
  continuityIntegrity: number;
  escalationPressure: number;
  stabilizationConfidence: number;
  requiresContainment: boolean;
  requiresFreeze: boolean;
  requiresEscalation: boolean;
  requiresOperatorIntervention: boolean;
  disputedConditions: string[];
  resilienceViolations: string[];
  affectedSubsystems: string[];
  generatedAt: string;
};

export type ResilienceThresholds = {
  freezeThreshold: number;
  containmentThreshold: number;
  escalationThreshold: number;
  collapseThreshold: number;
  disputedThreshold: number;
  staleViewMs: number;
};

export type ResilienceAuditRecord = {
  eventType: string;
  resilienceState: ConstitutionalResilienceState;
  evidence: string[];
  violations: string[];
  affectedSubsystems: string[];
  timestamp: string;
};

export type ResilienceTelemetryEvent = {
  eventType: string;
  value: number;
  timestamp: string;
};

export type ResilienceEvaluationInput = {
  dashboard: RecoveryDashboardReadModel;
  nowMs?: number;
};

export type ResilienceLineage = {
  evidence: string[];
  lineageId: string;
  generatedAt: string;
};

export type StabilizationEvaluation = {
  stabilizationConfidence: number;
  activeOperations: string[];
  recommendations: string[];
};
