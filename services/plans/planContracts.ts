import type { ExecutionEligibilityResult, GovernanceValidationInput, PlanValidationResult, ValidationSnapshot } from "@/services/validation/validationContracts";

export type PersistedPlanState =
  | "DRAFT"
  | "VALIDATING"
  | "VALIDATED"
  | "AWAITING_APPROVAL"
  | "APPROVED"
  | "REJECTED"
  | "QUEUED"
  | "EXECUTING"
  | "PAUSED"
  | "COMPLETED"
  | "FAILED"
  | "CANCELLED"
  | "FROZEN"
  | "DISPUTED";

export type PlanActor = "system" | "user" | "operator";

export type PersistedPlanStep = {
  stepId: string;
  planId: string;
  order: number;
  type: "tool" | "system";
  tool?: string;
  input: object;
  riskLevel: "low" | "medium" | "high" | "critical";
  requiresApproval: boolean;
  createdAt: number;
};

export type PersistedPlan = {
  planId: string;
  schemaVersion: string;
  intent: string;
  lifecycleState: PersistedPlanState;
  steps: PersistedPlanStep[];
  validation: {
    validationSnapshotId: string;
    validationHash: string;
    governanceHash: string;
    validatorVersion: string;
    registryVersion: string;
    governanceVersion: string;
    valid: boolean;
    executionEligible: boolean;
    validatedAt: number;
  };
  approvals: {
    approvalRequired: boolean;
    approved: boolean;
    approvedBy?: string;
    approvedAt?: number;
  };
  metadata: {
    createdAt: number;
    updatedAt: number;
    plannerVersion: string;
    source: "user" | "ai";
  };
  lineage: {
    parentPlanId?: string;
    replayOf?: string;
    derivedFrom?: string;
  };
  integrity: {
    immutableHash: string;
    replayHash: string;
    lifecycleHash: string;
  };

  // Compatibility mirrors preserved for 4.0D callers.
  source: "ai" | "user";
  state: PersistedPlanState;
  createdAt: number;
  updatedAt: number;
  createdBy: string;
  validationPassed: boolean;
  validationSnapshotId?: string;
  planHash?: string;
  governanceDecisionHash?: string;
  approvalRequired: boolean;
  approvalState: "NONE" | "PENDING" | "APPROVED" | "DENIED";
  riskLevel: "low" | "medium" | "high" | "critical";
  executionBlocked: boolean;
  cancellationRequested: boolean;
  frozenReason?: string;
  disputedReason?: string;
  validatorVersion?: string;
  registryVersion?: string;
  governanceVersion?: string;
};

export type PlanLifecycleEvent = {
  eventId: string;
  planId: string;
  eventType: string;
  previousState?: string;
  nextState: string;
  actor: PlanActor;
  timestamp: number;
  reason?: string;
  metadata?: Record<string, unknown>;

  // Compatibility alias for 4.0D callers/tests.
  createdAt: number;
};

export type PlanValidationBinding = {
  snapshot: ValidationSnapshot;
  validationResult: PlanValidationResult;
  eligibility: ExecutionEligibilityResult;
  governance?: GovernanceValidationInput;
};

export type PlanReplayResult = {
  planId: string;
  deterministic: boolean;
  driftDetected: boolean;
  driftReasons: string[];
  reconstructedState: PersistedPlanState | "MISSING";
  storedState: PersistedPlanState;
  replayedAt: number;
};

export type PlanEvidenceRebuildResult = {
  planId: string;
  deterministic: boolean;
  driftDetected: boolean;
  driftReasons: string[];
  rebuiltPlanHash?: string;
  storedPlanHash?: string;
  storedGovernanceDecisionHash?: string;
  snapshotGovernanceDecisionHash?: string;
  replayedAt: number;
};

export const PLAN_ERROR_CODES = {
  PLAN_NOT_FOUND: "PLAN_NOT_FOUND",
  PLAN_ALREADY_EXISTS: "PLAN_ALREADY_EXISTS",
  PLAN_PERSISTENCE_FAILURE: "PLAN_PERSISTENCE_FAILURE",
  PLAN_STATE_INVALID: "PLAN_STATE_INVALID",
  PLAN_TRANSITION_DENIED: "PLAN_TRANSITION_DENIED",
  INVALID_PLAN_STATE_TRANSITION: "INVALID_PLAN_STATE_TRANSITION",
  PLAN_STATE_MISMATCH: "PLAN_STATE_MISMATCH",
  PLAN_EXECUTION_BLOCKED: "PLAN_EXECUTION_BLOCKED",
  PLAN_APPROVAL_REQUIRED: "PLAN_APPROVAL_REQUIRED",
  PLAN_CANCELLED: "PLAN_CANCELLED",
  PLAN_FROZEN_BY_GOVERNANCE: "PLAN_FROZEN_BY_GOVERNANCE",
  PLAN_DISPUTED: "PLAN_DISPUTED",
  PLAN_VALIDATION_SNAPSHOT_MISSING: "PLAN_VALIDATION_SNAPSHOT_MISSING",
  PLAN_VALIDATION_HASH_DRIFT: "PLAN_VALIDATION_HASH_DRIFT",
  PLAN_GOVERNANCE_HASH_DRIFT: "PLAN_GOVERNANCE_HASH_DRIFT",
  PLAN_VERSION_DRIFT: "PLAN_VERSION_DRIFT",
  PLAN_REPLAY_CONFLICT: "PLAN_REPLAY_CONFLICT",
  PLAN_REPLAY_FAILED: "PLAN_REPLAY_FAILED",
  PLAN_LINEAGE_CORRUPTED: "PLAN_LINEAGE_CORRUPTED",
  PLAN_AUDIT_CORRUPTED: "PLAN_AUDIT_CORRUPTED",
  PLAN_VALIDATION_DRIFT: "PLAN_VALIDATION_DRIFT",
  PLAN_GOVERNANCE_DRIFT: "PLAN_GOVERNANCE_DRIFT",
  PLAN_REPLAY_MISMATCH: "PLAN_REPLAY_MISMATCH",
  PLAN_IMMUTABLE_MUTATION: "PLAN_IMMUTABLE_MUTATION",
  PLAN_INTEGRITY_FAILURE: "PLAN_INTEGRITY_FAILURE",
  PLAN_RECOVERY_FAILED: "PLAN_RECOVERY_FAILED",
  PLAN_AUDIT_FAILURE: "PLAN_AUDIT_FAILURE",
  PLAN_CANCELLATION_NOT_ALLOWED: "PLAN_CANCELLATION_NOT_ALLOWED",
} as const;
