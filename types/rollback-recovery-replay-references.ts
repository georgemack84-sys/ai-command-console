import type { OperatorActionApprovalResult } from "@/types/operator-action-approval-path";

export type RollbackRecoveryReplayState = "INITIALIZED" | "GENERATING" | "VALIDATING" | "COMPLETE" | "VERIFIED" | "FAILED" | "FAIL_CLOSED";

export type RollbackRecoveryPackage = Readonly<{
  package_id: string;
  orchestration_id: string;
  mission_id: string;
  tenant_id: string;
  rollback_plan: RollbackPlanRecord;
  recovery_guidance: RecoveryGuidanceRecord;
  replay_reference: ReplayReferenceRecord;
  lineage_reference: LineageReferenceRecord;
  replay_validation: ReplayValidationResult;
  replay_ref: string;
  lineage_ref: string;
  advisory_only: true;
  integrity_hash: string;
}>;

export type RollbackPlanRecord = Readonly<{
  rollback_id: string;
  package_id: string;
  rollback_steps: readonly string[];
  rollback_prerequisites: readonly string[];
  rollback_limitations: readonly string[];
  rollback_risks: readonly string[];
  rollback_summary: string;
  integrity_hash: string;
}>;

export type RecoveryGuidanceRecord = Readonly<{
  recovery_id: string;
  package_id: string;
  recovery_recommendations: readonly string[];
  recovery_dependencies: readonly string[];
  recovery_constraints: readonly string[];
  recovery_priority: "LOW" | "MEDIUM" | "HIGH";
  recovery_summary: string;
  integrity_hash: string;
}>;

export type ReplayReferenceRecord = Readonly<{
  replay_reference_id: string;
  package_id: string;
  orchestration_replay: string;
  simulation_replay: string;
  governance_replay: string;
  decision_replay: string;
  replay_timestamp: string;
  integrity_hash: string;
}>;

export type LineageReferenceRecord = Readonly<{
  lineage_reference_id: string;
  package_id: string;
  parent_decisions: readonly string[];
  child_decisions: readonly string[];
  evidence_lineage: readonly string[];
  governance_lineage: readonly string[];
  dependency_lineage: readonly string[];
  lineage_summary: string;
  integrity_hash: string;
}>;

export type ReplayValidationResult = Readonly<{
  validation_id: string;
  package_id: string;
  replay_available: boolean;
  replay_complete: boolean;
  replay_reproducible: boolean;
  lineage_complete: boolean;
  integrity_verified: boolean;
  validation_status: "VALID" | "REJECTED";
  validation_timestamp: string;
  failures: readonly RollbackRecoveryReplayFailureReason[];
  integrity_hash: string;
}>;

export type ReplayReferenceLedgerEntry = Readonly<{
  ledger_id: string;
  package_id: string;
  orchestration_id: string;
  rollback_plan_id: string;
  recovery_guidance_id: string;
  replay_reference_id: string;
  lineage_reference_id: string;
  validation_timestamp: string;
  replay_validation_status: "VALID" | "REJECTED";
  replay_ref: string;
  lineage_ref: string;
  integrity_hash: string;
  append_only: true;
  deleted: false;
  ledger_integrity_hash: string;
}>;

export type RollbackRecoveryReplayFailureReason =
  | "ROLLBACK_GUIDANCE_MISSING"
  | "RECOVERY_GUIDANCE_UNAVAILABLE"
  | "REPLAY_REFERENCES_MISSING"
  | "REPLAY_RECONSTRUCTION_FAILED"
  | "LINEAGE_INCOMPLETE"
  | "LINEAGE_REFERENCE_MISSING"
  | "REPLAY_VALIDATION_FAILED"
  | "INTEGRITY_VERIFICATION_FAILED"
  | "TENANT_MISMATCH"
  | "OPERATOR_WORKFLOW_INVALID"
  | "ADVISORY_ONLY_VIOLATION"
  | "UNAUTHORIZED_ROLLBACK_RECOVERY_ACCESS"
  | "REPLAY_DIVERGENCE";

export type RollbackRecoveryReplayInput = Readonly<{
  workflow_result?: OperatorActionApprovalResult;
  rollback_plan?: RollbackPlanRecord;
  recovery_guidance?: RecoveryGuidanceRecord;
  replay_reference?: ReplayReferenceRecord;
  lineage_reference?: LineageReferenceRecord;
  package?: RollbackRecoveryPackage;
  authorized_component?: string;
  replay_expected_hash?: string;
}>;

export type RollbackRecoveryReplayResult = Readonly<{
  reference_status: "PASS" | "FAIL";
  fail_closed: boolean;
  workflow_result: OperatorActionApprovalResult;
  package: RollbackRecoveryPackage;
  rollback_plan: RollbackPlanRecord;
  recovery_guidance: RecoveryGuidanceRecord;
  replay_reference: ReplayReferenceRecord;
  lineage_reference: LineageReferenceRecord;
  replay_validation: ReplayValidationResult;
  replay_ledger: readonly ReplayReferenceLedgerEntry[];
  replay_hash: string;
  failures: readonly RollbackRecoveryReplayFailureReason[];
  deterministic: true;
  advisory_only: true;
  integrity_hash: string;
}>;

export type RollbackRecoveryReplayCheck = Readonly<{
  replay_id: string;
  replay_valid: boolean;
  package_id: string;
  rollback_plan_id: string;
  recovery_guidance_id: string;
  replay_reference_id: string;
  lineage_reference_id: string;
  expected_replay_hash: string;
  reconstructed_replay_hash: string;
  failures: readonly RollbackRecoveryReplayFailureReason[];
  integrity_hash: string;
}>;

export type RollbackRecoveryReplayObservability = Readonly<{
  rollback_plans_generated: number;
  recovery_guides_generated: number;
  replay_references_attached: number;
  lineage_references_attached: number;
  replay_validation_success: number;
  lineage_completeness: number;
  validation_failures: number;
  replay_latency_ms: number;
  integrity_verification_success: number;
  fail_closed_activations: number;
}>;

export type RollbackRecoveryReplayFoundation = Readonly<{
  reference_version: "rollback-recovery-replay-references/v1";
  reference_states: readonly RollbackRecoveryReplayState[];
  result: RollbackRecoveryReplayResult;
  replay: RollbackRecoveryReplayCheck;
  observability: RollbackRecoveryReplayObservability;
}>;
