import type { ExecutionTruthPackage } from "../execution-truth";
import type { NormalizedPlan } from "../normalization";

export type ExecutionSafetyState =
  | "SAFE"
  | "RESTRICTED"
  | "APPROVAL_REQUIRED"
  | "ROLLBACK_REQUIRED"
  | "FROZEN"
  | "DISPUTED"
  | "BLOCKED";

export type ContainmentZone =
  | "LOCAL_ONLY"
  | "SANDBOX"
  | "READ_ONLY"
  | "NON_PRODUCTION"
  | "PRODUCTION_RESTRICTED"
  | "CROSS_TENANT_FORBIDDEN";

export type ExecutionFreezeReason =
  | "GOVERNANCE_BLOCKED"
  | "ROLLBACK_MISSING"
  | "REPLAY_DIVERGENCE"
  | "POLICY_LOCK_MISSING"
  | "DISPUTED_STATE"
  | "CONTAINMENT_VIOLATION";

export type ExecutionEscalationLevel =
  | "NONE"
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "CRITICAL";

export type PolicyLockSnapshot = {
  policyId: string;
  policyVersion: string;
  policyHash: string;
  enforcementMode: "advisory" | "enforced";
};

export type RollbackInvariant = {
  code:
    | "ROLLBACK_CAPABILITY_REQUIRED"
    | "ROLLBACK_GOVERNANCE_INHERITED"
    | "ROLLBACK_CONTAINMENT_PRESERVED"
    | "ROLLBACK_AUTONOMY_NOT_ELEVATED";
  satisfied: boolean;
  reason: string;
};

export type GovernanceSafetyContract = {
  allowed: boolean;
  requiredApprovals: string[];
  blockedReasons: string[];
  escalationRequired: boolean;
  policyLocks: PolicyLockSnapshot[];
  containmentZone: ContainmentZone;
};

export type ApprovalSafetyRequirement = {
  required: boolean;
  approvalTypes: string[];
  reason: string;
};

export type AutonomySafetyBoundary = {
  maxAutonomyLevel:
    | "none"
    | "manual_only"
    | "approval_required"
    | "supervised"
    | "bounded_autonomous";
  downgradeReasons: string[];
  selfElevationBlocked: boolean;
};

export type RollbackSafetyContract = {
  required: boolean;
  rollbackCapability: "full" | "partial" | "none" | "unknown";
  invariants: RollbackInvariant[];
  governanceInherited: boolean;
};

export type ExecutionSafetyContract = {
  planId: string;
  executionTruthHash: string;
  dependencyGraphFingerprint: string;
  executionSafetyState: ExecutionSafetyState;
  governance: GovernanceSafetyContract;
  rollback: RollbackSafetyContract;
  approvals: ApprovalSafetyRequirement[];
  autonomy: AutonomySafetyBoundary;
  freezeReasons: ExecutionFreezeReason[];
  escalationLevel: ExecutionEscalationLevel;
  containmentZone: ContainmentZone;
  policyLocks: PolicyLockSnapshot[];
  replaySourceHash: string;
  executionSafetyHash?: string;
};

export type ExecutionSafetyViolation = {
  code:
    | "EXECUTION_SAFETY_INPUT_INVALID"
    | "EXECUTION_TRUTH_REQUIRED"
    | "EXECUTION_TRUTH_HASH_MISSING"
    | "EXECUTION_GOVERNANCE_MISSING"
    | "EXECUTION_ROLLBACK_MISSING"
    | "EXECUTION_APPROVAL_REQUIRED"
    | "EXECUTION_AUTONOMY_BOUNDARY_VIOLATION"
    | "EXECUTION_POLICY_LOCK_MISSING"
    | "EXECUTION_POLICY_HASH_MISMATCH"
    | "EXECUTION_ROLLBACK_GOVERNANCE_WEAKENED"
    | "EXECUTION_ROLLBACK_INVARIANT_MISSING"
    | "EXECUTION_CONTAINMENT_VIOLATION"
    | "EXECUTION_FREEZE_REQUIRED"
    | "EXECUTION_SAFETY_HASH_MISMATCH"
    | "EXECUTION_SAFETY_REPLAY_DIVERGENCE"
    | "EXECUTION_SAFETY_STATE_TRANSITION_INVALID";
  message: string;
  path?: string[];
};

export type ExecutionSafetyValidationResult =
  | {
      ok: true;
      contract: Readonly<ExecutionSafetyContract>;
      executionSafetyHash: string;
      violations: ExecutionSafetyViolation[];
      state: ExecutionSafetyState;
      replayValidated: true;
    }
  | {
      ok: false;
      contract?: Readonly<ExecutionSafetyContract>;
      executionSafetyHash?: string;
      violations: ExecutionSafetyViolation[];
      state: ExecutionSafetyState;
      replayValidated: false;
    };

export type ExecutionSafetyHashInput = {
  contract: Omit<ExecutionSafetyContract, "executionSafetyHash">;
};

export type ExecutionSafetyBuildInput = {
  normalizedPlan: NormalizedPlan;
  executionTruthPackage?: ExecutionTruthPackage;
};
