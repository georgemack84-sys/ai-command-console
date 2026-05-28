import type { ContinuityConvergenceResult } from "../convergence/convergenceTypes";
import type { OperationalStabilityAssessment } from "../stability/operationalStabilityEngine";
import type { EscalationCoordinationState } from "../escalation/contracts/escalationTypes";

export type RecoveryPriorityState =
  | "PENDING_EVALUATION"
  | "SCORING"
  | "RANKED"
  | "APPROVED"
  | "ESCALATED"
  | "BLOCKED"
  | "DISPUTED"
  | "CONTAINED"
  | "FROZEN";

export type RecoveryPriorityCategory =
  | "SURVIVABILITY_CRITICAL"
  | "CONSTITUTIONAL_CRITICAL"
  | "GOVERNANCE_CRITICAL"
  | "CONTINUITY_CRITICAL"
  | "DEPENDENCY_CRITICAL"
  | "OPERATIONAL_CRITICAL"
  | "TENANT_CRITICAL"
  | "STANDARD"
  | "DEFERRED";

export type RecoveryPriorityCandidate = {
  executionId: string;
  tenantId?: string;
  createdAt?: string;
  operationalCriticality?: number;
  survivabilityImpact?: number;
  governanceRisk?: number;
  replayConfidence?: number;
  escalationSeverity?: number;
  dependencyImportance?: number;
  continuityStability?: number;
  tenantImpact?: number;
  recoveryComplexity?: number;
  recoveryUrgency?: number;
  operatorDirective?: "PRIORITIZE" | "DEPRIORITIZE" | "NONE";
  evidence: string[];
  tags?: string[];
};

export type RecoveryPrioritizationAssessment = {
  executionId: string;
  prioritizationScore: number;
  category: RecoveryPriorityCategory;
  state: RecoveryPriorityState;
  operationalCriticality: number;
  survivabilityImpact: number;
  governanceRisk: number;
  replayConfidence: number;
  escalationSeverity: number;
  dependencyImportance: number;
  continuityStability: number;
  tenantImpact: number;
  convergenceConfidence: number;
  divergenceScore: number;
  runtimeDriftSeverity: number;
  staleOwnershipRisk: number;
  orphanedOperationRisk: number;
  replayDivergenceRisk: number;
  constitutionalRisk: number;
  containmentPressure: number;
  recoveryComplexity: number;
  recoveryUrgency: number;
  deterministicRank: number;
  governanceReviewRequired: boolean;
  prioritizationReasons: string[];
  prioritizationWarnings: string[];
  timestamp: string;
};

export type RecoveryPrioritizationAuditEvent =
  | "RECOVERY_PRIORITIZED"
  | "PRIORITIZATION_RECALCULATED"
  | "PRIORITY_OVERRIDE_REQUESTED"
  | "PRIORITY_OVERRIDE_DENIED"
  | "PRIORITY_OVERRIDE_APPROVED"
  | "PRIORITIZATION_DISPUTED"
  | "PRIORITIZATION_FROZEN"
  | "SURVIVABILITY_PRIORITY_ESCALATED"
  | "CONSTITUTIONAL_PRIORITY_TRIGGERED";

export type RecoveryPrioritizationAuditRecord = {
  eventType: RecoveryPrioritizationAuditEvent;
  executionId: string;
  score: number;
  category: RecoveryPriorityCategory;
  reasons: string[];
  warnings: string[];
  evidence: string[];
  timestamp: string;
};

export type RecoveryPrioritizationTelemetryEvent = {
  eventType: string;
  executionId?: string;
  value: number;
  timestamp: string;
};

export type RecoveryPrioritizationResult = {
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
  timestamp: string;
  assessments: RecoveryPrioritizationAssessment[];
  starvationWarnings: string[];
  auditRecords: RecoveryPrioritizationAuditRecord[];
  telemetryEvents: RecoveryPrioritizationTelemetryEvent[];
};

export type RecoveryPrioritizationInput = {
  candidates: RecoveryPriorityCandidate[];
  tenantId?: string;
  overrideRequested?: boolean;
  operatorDirective?: "PRIORITIZE" | "DEPRIORITIZE" | "NONE";
  evidence: string[];
  timestamp: string;
  convergence?: ContinuityConvergenceResult | null;
  stability?: OperationalStabilityAssessment | null;
  escalation?: EscalationCoordinationState | null;
  stewardship?: {
    state?: string;
    shouldFreeze?: boolean;
    shouldContain?: boolean;
    shouldEscalate?: boolean;
    governanceBlocked?: boolean;
    verificationBlocked?: boolean;
    confidence?: number;
  } | null;
};

export type ConvergencePrioritySignals = {
  convergenceConfidence: number;
  divergenceScore: number;
  runtimeDriftSeverity: number;
  staleOwnershipRisk: number;
  orphanedOperationRisk: number;
  replayDivergenceRisk: number;
  constitutionalRisk: number;
  containmentPressure: number;
  warnings: string[];
};
