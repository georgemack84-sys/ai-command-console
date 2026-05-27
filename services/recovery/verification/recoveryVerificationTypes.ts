import type { RecoverySimulationResult } from "../simulation/recoverySimulationTypes";
import type { RuntimeContinuityState } from "../../runtime/runtimeContinuityTypes";

export type RecoveryVerificationStatus =
  | "VERIFIED"
  | "PARTIALLY_VERIFIED"
  | "DISPUTED"
  | "DIVERGED"
  | "UNVERIFIABLE"
  | "FAILED";

export type RecoveryCertificationDecision =
  | "CERTIFIED"
  | "CERTIFIED_WITH_WARNINGS"
  | "REQUIRES_OPERATOR_REVIEW"
  | "ESCALATED"
  | "QUARANTINED"
  | "REJECTED";

export type TruthReconciliationState =
  | "RECONCILED"
  | "PARTIALLY_RECONCILED"
  | "DISPUTED"
  | "DIVERGED"
  | "UNVERIFIABLE"
  | "QUARANTINED";

export type RecoveryVerificationResult = {
  verificationId: string;
  executionId: string;
  recoveryId?: string;
  status: RecoveryVerificationStatus;
  reconciliationState: TruthReconciliationState;
  certificationDecision: RecoveryCertificationDecision;
  verified: boolean;
  disputed: boolean;
  divergenceDetected: boolean;
  requiresOperatorReview: boolean;
  evidence: string[];
  errors: string[];
  warnings: string[];
  timestamp: string;
};

export type TruthReconciliationResult = {
  executionId: string;
  reconciliationState: TruthReconciliationState;
  replayConsistent: boolean;
  governanceConsistent: boolean;
  continuityConsistent: boolean;
  simulationConsistent: boolean;
  immutableEvidenceValid: boolean;
  mismatches: string[];
  disputed: boolean;
  divergenceDetected: boolean;
  confidenceScore: number;
  timestamp: string;
};

export type RecoveryDashboardReadModel = {
  runtimeContinuityState: string;
  continuityConfidence: number;
  operationalStability: string;
  degradedSystems: string[];
  activeRecoveries: Array<Record<string, unknown>>;
  pendingApprovals: Array<Record<string, unknown>>;
  blockedRecoveries: Array<Record<string, unknown>>;
  quarantinedExecutions: Array<Record<string, unknown>>;
  replayVerificationState: string;
  replayDivergenceCount: number;
  leaseConflicts: Array<Record<string, unknown>>;
  auditHistory: Array<Record<string, unknown>>;
  governanceDisputes: Array<Record<string, unknown>>;
  certificationState: string;
  simulationOutcomes: Array<Record<string, unknown>>;
  continuityRiskScore: number;
  stewardship: {
    state: string;
    confidence: number;
    shouldFreeze: boolean;
    shouldContain: boolean;
    shouldEscalate: boolean;
    governanceBlocked: boolean;
    verificationBlocked: boolean;
    stabilizationStatus: string;
    survivabilityScore: number;
    collapseRisk: string;
    reasoning: string[];
    evidence: string[];
  } | null;
  operationalStabilityAssessment: {
    operationalState: string;
    survivabilityScore: number;
    degradationRate: number;
    recoveryPressure: number;
    escalationPressure: number;
    continuityConfidence: number;
    unstableSubsystems: string[];
    stabilizationRequired: boolean;
    containmentRecommended: boolean;
    lockdownRecommended: boolean;
    replayInstabilityScore: number;
    staleExecutionSpread: number;
    dependencyInstabilityScore: number;
    operatorInterventionPressure: number;
    recoverySuccessConfidence: number;
    trend: "IMPROVING" | "STABLE" | "DECLINING" | "COLLAPSING";
    confidence: number;
    reasons: string[];
    disputed: boolean;
    timestamp: string;
  } | null;
  escalationCoordination: {
    escalationId: string;
    escalationType: string;
    escalationState: string;
    escalationSeverity: string;
    escalationLineageId: string;
    parentEscalationId?: string;
    conflictingEscalations: string[];
    requiresContainment: boolean;
    requiresOperatorVisibility: boolean;
    frozen: boolean;
    blocked: boolean;
    blockReason?: string;
    recommendedActions: string[];
    confidence: number;
    evidenceCount: number;
    reason: string;
    source: string;
    timestamp: string;
  } | null;
  continuityConvergence: {
    converged: boolean;
    state: string;
    divergenceScore: number;
    divergenceReasons: string[];
    requiresContainment: boolean;
    requiresEscalation: boolean;
    requiresFreeze: boolean;
    continuityConfidence: number;
    replayConfidence: number;
    survivabilityConfidence: number;
    escalationStabilityConfidence: number;
    affectedExecutions: string[];
    affectedSubsystems: string[];
    orphanedOperations: string[];
    staleOwnershipClaims: string[];
    unresolvedDisputes: string[];
    unstableDependencies: string[];
    evidence: string[];
    timestamp: string;
  } | null;
  recoveryPrioritization: {
    prioritizationApproved: boolean;
    deterministicOrderingVerified: boolean;
    governanceReviewRequired: boolean;
    containmentPriorityRequired: boolean;
    survivabilityPriorityRequired: boolean;
    recoveryQueue: string[];
    blockedRecoveries: string[];
    disputedRecoveries: string[];
    prioritizationConfidence: number;
    prioritizationReasons: string[];
    starvationWarnings: string[];
    assessments: Array<{
      executionId: string;
      prioritizationScore: number;
      category: string;
      state: string;
      deterministicRank: number;
      governanceReviewRequired: boolean;
      prioritizationReasons: string[];
      prioritizationWarnings: string[];
    }>;
    timestamp: string;
  } | null;
  generatedAt: string;
};

export type StoredSimulationSummary = Pick<
  RecoverySimulationResult,
  | "simulationId"
  | "executionId"
  | "scenarioType"
  | "state"
  | "outcome"
  | "warnings"
  | "disputes"
  | "evidenceIds"
  | "auditEventIds"
  | "timestamp"
  | "recommendedAction"
> & {
  dryRun: true;
};

export type RecoveryVerificationEvidenceBundle = {
  replayVerification: Record<string, unknown> | null;
  simulationResult: RecoverySimulationResult | StoredSimulationSummary | null;
  continuityState: (RuntimeContinuityState & { degradation?: Record<string, unknown> }) | null;
  immutableEvidenceValid: boolean;
  governanceDenied?: boolean;
  auditEvents?: Array<Record<string, unknown>>;
};
