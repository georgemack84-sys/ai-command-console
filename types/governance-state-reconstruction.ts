import type { GovernanceInputValidationResult, GovernanceReplayInputPackage } from "@/types/governance-input-reconstruction";

export type GovernanceStateReconstructionPhase =
  | "INITIALIZED"
  | "POLICY_EVALUATION"
  | "COMPLIANCE_ANALYSIS"
  | "RISK_ANALYSIS"
  | "RECOMMENDATION_GENERATION"
  | "ESCALATION_EVALUATION"
  | "EXPLAINABILITY_GENERATION"
  | "CONFIDENCE_CALCULATION"
  | "CERTIFICATION_VALIDATION"
  | "COMPLETED";

export type GovernanceStateReconstructionStatus = "REQUESTED" | "RECONSTRUCTED" | "VALIDATED" | "REPLAY_READY" | "FAILED";

export type GovernanceStateReconstructionScenario =
  | "BASELINE"
  | "INPUT_PACKAGE_INVALID"
  | "GOVERNANCE_STATE_MISSING"
  | "EXECUTION_ORDERING_DIFFERS"
  | "POLICY_STATE_INCOMPLETE"
  | "COMPLIANCE_STATE_INCONSISTENT"
  | "RISK_CALCULATION_MISMATCH"
  | "RECOMMENDATION_STATE_MISSING"
  | "ESCALATION_STATE_UNRESOLVED"
  | "EXPLAINABILITY_CHAIN_INCOMPLETE"
  | "CONFIDENCE_MISMATCH"
  | "LINEAGE_DISCONTINUITY"
  | "REPLAY_VERSION_MISMATCH"
  | "CONSTITUTIONAL_MISMATCH"
  | "AUTHORITY_MISMATCH"
  | "INTEGRITY_FAILURE"
  | "TENANT_MISMATCH"
  | "HIDDEN_STATE_DETECTED";

export type GovernanceStateFailureReason =
  | "INPUT_PACKAGE_INVALID"
  | "GOVERNANCE_STATE_MISSING"
  | "EXECUTION_ORDERING_DIFFERS"
  | "POLICY_STATE_INCOMPLETE"
  | "COMPLIANCE_STATE_INCONSISTENT"
  | "RISK_CALCULATION_MISMATCH"
  | "RECOMMENDATION_STATE_MISSING"
  | "ESCALATION_STATE_UNRESOLVED"
  | "EXPLAINABILITY_CHAIN_INCOMPLETE"
  | "CONFIDENCE_MISMATCH"
  | "LINEAGE_DISCONTINUITY"
  | "REPLAY_VERSION_MISMATCH"
  | "CONSTITUTIONAL_MISMATCH"
  | "AUTHORITY_MISMATCH"
  | "INTEGRITY_VERIFICATION_FAILURE"
  | "TENANT_MISMATCH"
  | "HIDDEN_STATE_DETECTED"
  | "STATE_PACKAGE_HASH_MISMATCH";

export type GovernanceStateValidationError = Readonly<{
  code: `GSR-${string}`;
  reason: GovernanceStateFailureReason;
  field: string;
  message: string;
}>;

export type GovernanceStateTransition = Readonly<{
  transition_id: string;
  from_phase: GovernanceStateReconstructionPhase | "START";
  to_phase: GovernanceStateReconstructionPhase;
  sequence: number;
  checkpoint_ref: string;
  transition_hash: string;
}>;

export type GovernanceStateSnapshot = Readonly<{
  state_id: string;
  category: "EXECUTION" | "POLICY" | "COMPLIANCE" | "RISK" | "RECOMMENDATION" | "ESCALATION" | "EXPLAINABILITY" | "CONFIDENCE" | "LINEAGE" | "CERTIFICATION";
  phase: GovernanceStateReconstructionPhase;
  tenant_id: string;
  mission_id: string;
  version: string;
  progress: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "FAILED";
  source_context_refs: readonly string[];
  restored_values: readonly string[];
  confidence_value: string;
  integrity_status: "VERIFIED" | "FAILED";
  state_hash: string;
}>;

export type GovernanceStateIntegrityResult = Readonly<{
  integrity_id: string;
  state_id: string;
  category: GovernanceStateSnapshot["category"];
  hash_verified: boolean;
  ordering_verified: boolean;
  lineage_verified: boolean;
  confidence_verified: boolean;
  tenant_verified: boolean;
  integrity_hash: string;
}>;

export type GovernanceStateAuditEntry = Readonly<{
  audit_id: string;
  governance_replay_id: string;
  reconstructed_states: readonly string[];
  validation_outcomes: readonly string[];
  integrity_verification: "VERIFIED" | "FAILED";
  execution_duration_ms: number;
  reconstruction_status: GovernanceStateReconstructionStatus;
  audit_hash: string;
}>;

export type GovernanceReplayStatePackage = Readonly<{
  state_reconstruction_id: string;
  phase_version: "7H.3";
  schema_version: "governance-state-reconstruction/v7H.3";
  status: GovernanceStateReconstructionStatus;
  replay_input_package: GovernanceReplayInputPackage;
  replay_input_validation: GovernanceInputValidationResult;
  replay_metadata: Readonly<{
    governance_replay_id: string;
    governance_execution_id: string;
    governance_session_id: string;
    replay_version: string;
    deterministic_seed: string;
  }>;
  execution_order: readonly GovernanceStateReconstructionPhase[];
  transitions: readonly GovernanceStateTransition[];
  execution_state: GovernanceStateSnapshot;
  policy_state: GovernanceStateSnapshot;
  compliance_state: GovernanceStateSnapshot;
  risk_state: GovernanceStateSnapshot;
  recommendation_state: GovernanceStateSnapshot;
  escalation_state: GovernanceStateSnapshot;
  explainability_state: GovernanceStateSnapshot;
  confidence_state: GovernanceStateSnapshot;
  lineage_state: GovernanceStateSnapshot;
  certification_state: GovernanceStateSnapshot;
  integrity_results: readonly GovernanceStateIntegrityResult[];
  audit_log: readonly GovernanceStateAuditEntry[];
  failures: readonly GovernanceStateFailureReason[];
  state_package_hash: string;
}>;

export type GovernanceStateReconstructionInput = Readonly<{
  scenario?: GovernanceStateReconstructionScenario;
  input_package?: GovernanceReplayInputPackage;
  tenant_id?: string;
  mission_id?: string;
  replay_requestor?: string;
}>;

export type GovernanceStateValidationResult = Readonly<{
  state_reconstruction_id: string | null;
  validation_state: "VALID" | "INVALID";
  replay_ready: boolean;
  input_package_valid: boolean;
  completeness_valid: boolean;
  ordering_valid: boolean;
  integrity_valid: boolean;
  confidence_valid: boolean;
  lineage_valid: boolean;
  explainability_valid: boolean;
  constitutional_valid: boolean;
  authority_valid: boolean;
  tenant_isolated: boolean;
  hidden_state_absent: boolean;
  errors: readonly GovernanceStateValidationError[];
  validation_hash: string;
}>;

export type GovernanceStateObservabilitySurface = Readonly<{
  state_reconstruction_id: string;
  status: GovernanceStateReconstructionStatus;
  replay_ready: boolean;
  state_count: number;
  transition_count: number;
  integrity_passed: number;
  integrity_failed: number;
  failures: readonly GovernanceStateFailureReason[];
  advisory_only_notice: string;
}>;
