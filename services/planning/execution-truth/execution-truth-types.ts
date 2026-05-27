import type { NormalizedPlan } from "../normalization";
import type { SequentialDependencyValidationResult } from "../dependencies";

export type RiskLevel =
  | "R0_SAFE"
  | "R1_LOW"
  | "R2_MODERATE"
  | "R3_ELEVATED"
  | "R4_HIGH"
  | "R5_CRITICAL"
  | "R6_FORBIDDEN";

export type RiskCategory =
  | "execution_risk"
  | "rollback_risk"
  | "concurrency_risk"
  | "governance_risk"
  | "autonomy_risk"
  | "integrity_risk"
  | "escalation_risk"
  | "resource_risk"
  | "dependency_risk"
  | "external_system_risk";

export type ExecutionRiskSignals = {
  stepId: string;
  destructive: boolean;
  externalSideEffect: boolean;
  idempotent: boolean;
  targetEnvironment: "local" | "staging" | "production" | "unknown";
  rollbackCapability: "full" | "partial" | "none" | "unknown";
  autonomySensitivity: "safe" | "restricted" | "critical" | "unknown";
  terminalBranch: boolean;
  failureBranch: boolean;
  rollbackBranch: boolean;
  source: "normalized_step_inputs";
};

export type RiskScore = {
  category: RiskCategory;
  score: number;
  level: RiskLevel;
  reasons: string[];
};

export type DeterministicRiskProfile = {
  overallRisk: RiskLevel;
  scores: RiskScore[];
  stepSignals: ExecutionRiskSignals[];
  failClosed: boolean;
  reasons: string[];
};

export type GovernanceEnvelope = {
  allowed: boolean;
  requiredApprovals: string[];
  blockedReasons: string[];
  escalationRequired: boolean;
};

export type AutonomyEnvelope = {
  maxAutonomyLevel:
    | "none"
    | "manual_only"
    | "approval_required"
    | "supervised"
    | "bounded_autonomous";
  downgradeReasons: string[];
};

export type ReplayEnvelope = {
  replayable: boolean;
  sourceFingerprint: string;
  replayHash: string;
};

export type ExecutionTruthPackage = {
  planId: string;
  dependencyGraphFingerprint: string;
  riskProfile: DeterministicRiskProfile;
  governanceEnvelope: GovernanceEnvelope;
  autonomyEnvelope: AutonomyEnvelope;
  replayEnvelope: ReplayEnvelope;
  executionTruthHash: string;
  authorized: boolean;
};

export type ExecutionTruthErrorCode =
  | "PHASE_4_2E_DEPENDENCY_ARTIFACT_MISSING"
  | "PHASE_4_2E_DEPENDENCY_VALIDATION_FAILED"
  | "PHASE_4_2E_RISK_SIGNAL_EXTRACTION_FAILED"
  | "PHASE_4_2E_FORBIDDEN_RISK"
  | "PHASE_4_2E_GOVERNANCE_BLOCKED"
  | "PHASE_4_2E_REPLAY_MISMATCH"
  | "PHASE_4_2E_EXECUTION_TRUTH_HASH_MISMATCH"
  | "PHASE_4_2E_UNKNOWN_RISK_FAIL_CLOSED";

export type ExecutionTruthError = {
  code: ExecutionTruthErrorCode;
  message: string;
  details?: Record<string, unknown>;
};

export type ExecutionTruthResult =
  | {
      ok: true;
      dependencyValidation: SequentialDependencyValidationResult;
      executionTruthPackage: Readonly<ExecutionTruthPackage>;
    }
  | {
      ok: false;
      error: ExecutionTruthError;
      dependencyValidation?: SequentialDependencyValidationResult;
    };

export type ExecutionTruthReplayValidationResult =
  | {
      ok: true;
      executionTruthPackage: Readonly<ExecutionTruthPackage>;
    }
  | {
      ok: false;
      error: ExecutionTruthError;
    };

export type ExecutionTruthBuildInput = {
  normalizedPlan: NormalizedPlan;
  dependencyValidation?: SequentialDependencyValidationResult;
};
