export type ConvergenceState =
  | "CONVERGED"
  | "DRIFTING"
  | "DESYNCHRONIZED"
  | "UNSTABLE"
  | "DISPUTED"
  | "CONTAINMENT_REQUIRED"
  | "ESCALATED"
  | "SYSTEMIC_RISK"
  | "FROZEN"
  | "FAILED";

export type DivergenceCategory =
  | "CONTINUITY_DRIFT"
  | "REPLAY_DIVERGENCE"
  | "ESCALATION_DIVERGENCE"
  | "RECOVERY_DIVERGENCE"
  | "RUNTIME_DESYNCHRONIZATION"
  | "OWNERSHIP_DIVERGENCE"
  | "DEPENDENCY_PROPAGATION_DIVERGENCE"
  | "GOVERNANCE_DIVERGENCE"
  | "CONTAINMENT_DIVERGENCE"
  | "SYSTEMIC_DIVERGENCE";

export type ContinuityConvergenceResult = {
  converged: boolean;
  state: ConvergenceState;
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
};

export type ConvergenceThresholds = {
  driftWarningThreshold: number;
  escalationThreshold: number;
  containmentThreshold: number;
  freezeThreshold: number;
  systemicRiskThreshold: number;
  replayDivergenceThreshold: number;
  orphanedOperationThreshold: number;
  dependencyPropagationThreshold: number;
};

export type ContinuityConvergenceInput = {
  executionId?: string;
  timestamp: string;
  continuity?: {
    runtimeState?: string;
    continuityConfidence?: number;
    degradedDependencies?: string[];
    staleExecutions?: number;
    replayDivergenceDetected?: boolean;
  };
  verification?: {
    status?: string;
    disputed?: boolean;
    divergenceDetected?: boolean;
    warnings?: string[];
    errors?: string[];
    evidence?: string[];
  };
  stewardship?: {
    state?: string;
    shouldFreeze?: boolean;
    shouldContain?: boolean;
    shouldEscalate?: boolean;
    governanceBlocked?: boolean;
    verificationBlocked?: boolean;
    stabilizationStatus?: string;
    survivabilityScore?: number;
    collapseRisk?: string;
    reasoning?: string[];
    evidence?: string[];
  } | null;
  stability?: {
    operationalState?: string;
    survivabilityScore?: number;
    degradationRate?: number;
    recoveryPressure?: number;
    escalationPressure?: number;
    continuityConfidence?: number;
    unstableSubsystems?: string[];
    stabilizationRequired?: boolean;
    containmentRecommended?: boolean;
    lockdownRecommended?: boolean;
    replayInstabilityScore?: number;
    staleExecutionSpread?: number;
    dependencyInstabilityScore?: number;
    operatorInterventionPressure?: number;
    recoverySuccessConfidence?: number;
    trend?: string;
    confidence?: number;
    reasons?: string[];
    disputed?: boolean;
  } | null;
  escalation?: {
    escalationId?: string;
    escalationType?: string;
    escalationState?: string;
    escalationSeverity?: string;
    escalationLineageId?: string;
    conflictingEscalations?: string[];
    requiresContainment?: boolean;
    requiresOperatorVisibility?: boolean;
    frozen?: boolean;
    blocked?: boolean;
    blockReason?: string;
    recommendedActions?: string[];
    confidence?: number;
    evidenceCount?: number;
    reason?: string;
    source?: string;
  } | null;
  activeRecoveries?: Array<Record<string, unknown>>;
  blockedRecoveries?: Array<Record<string, unknown>>;
  quarantinedExecutions?: Array<Record<string, unknown>>;
  governanceDisputes?: Array<Record<string, unknown>>;
  leaseConflicts?: Array<Record<string, unknown>>;
  auditHistory?: Array<Record<string, unknown>>;
};

export type ConvergenceAuditRecord = {
  auditId: string;
  state: ConvergenceState;
  divergenceScore: number;
  divergenceCategories: DivergenceCategory[];
  evidence: string[];
  affectedExecutions: string[];
  affectedSubsystems: string[];
  recommendations: string[];
  freezeReason?: string;
  timestamp: string;
};

export type ConvergenceTelemetryEvent = {
  eventType: string;
  value: number;
  timestamp: string;
};
