export type DecisionReplayState =
  | "CREATED"
  | "VALIDATED"
  | "READY_FOR_REPLAY"
  | "REPLAY_RUNNING"
  | "REPLAY_COMPLETED"
  | "REPLAY_FAILED"
  | "DIVERGENCE_DETECTED"
  | "INTEGRITY_FAILURE"
  | "CERTIFIED"
  | "REJECTED"
  | "ARCHIVED";

export type DecisionReplayMode = "FULL_REPLAY" | "AUDIT_REPLAY" | "CERTIFICATION_REPLAY" | "DIFF_REPLAY" | "FORENSIC_REPLAY";
export type DecisionReplayValidationStatus = "NOT_VALIDATED" | "VALID" | "INVALID" | "BLOCKED" | "INTEGRITY_FAILURE";
export type DecisionReplayCertificationStatus = "NOT_CERTIFIED" | "CERTIFIED" | "CERTIFICATION_FAILED" | "CERTIFICATION_BLOCKED";
export type DecisionReplayMatchStatus = "MATCH" | "DIFF" | "DIVERGENCE" | "NOT_EXECUTED";

export type DecisionReplayArtifactRef = Readonly<{
  ref_id: string;
  tenant_id: string;
  orchestration_id: string;
  lineage_ref: string;
  immutable: true;
}>;

export type DecisionReplayInputs = Readonly<{
  input_candidate_refs: readonly DecisionReplayArtifactRef[];
  normalized_candidate_refs: readonly DecisionReplayArtifactRef[];
  decision_context_refs: readonly DecisionReplayArtifactRef[];
  dependency_graph_ref: DecisionReplayArtifactRef;
  priority_score_refs: readonly DecisionReplayArtifactRef[];
  conflict_classification_refs: readonly DecisionReplayArtifactRef[];
  governance_outcome_refs: readonly DecisionReplayArtifactRef[];
  decision_package_refs: readonly DecisionReplayArtifactRef[];
  operator_action_refs: readonly DecisionReplayArtifactRef[];
  final_decision_state_ref: DecisionReplayArtifactRef;
}>;

export type DecisionReplayOutputs = Readonly<{
  reconstructed_candidate_set: readonly string[];
  reconstructed_context_set: readonly string[];
  reconstructed_dependency_graph: string;
  reconstructed_priority_order: readonly string[];
  reconstructed_conflict_set: readonly string[];
  reconstructed_governance_outcomes: readonly string[];
  reconstructed_decision_packages: readonly string[];
  reconstructed_operator_workflow: string;
  reconstructed_final_decision_state: string;
  replay_match_status: DecisionReplayMatchStatus;
  replay_diff_refs: readonly string[];
  integrity_verification_ref: string;
  audit_report_ref: string;
  immutable: true;
}>;

export type DecisionReplayLineageRefs = Readonly<{
  orchestration_lineage_ref: DecisionReplayArtifactRef;
  candidate_lineage_refs: readonly DecisionReplayArtifactRef[];
  context_lineage_refs: readonly DecisionReplayArtifactRef[];
  dependency_graph_lineage_ref: DecisionReplayArtifactRef;
  priority_lineage_refs: readonly DecisionReplayArtifactRef[];
  conflict_lineage_refs: readonly DecisionReplayArtifactRef[];
  governance_lineage_refs: readonly DecisionReplayArtifactRef[];
  package_lineage_refs: readonly DecisionReplayArtifactRef[];
  operator_workflow_lineage_ref: DecisionReplayArtifactRef;
  final_state_lineage_ref: DecisionReplayArtifactRef;
}>;

export type DecisionReplayGovernanceRefs = Readonly<{
  policy_ref: DecisionReplayArtifactRef;
  authority_ref: DecisionReplayArtifactRef;
  approval_ref: DecisionReplayArtifactRef;
  governance_outcome_ref: DecisionReplayArtifactRef;
}>;

export type DecisionReplayConstitutionalRefs = Readonly<{
  constitution_ref: DecisionReplayArtifactRef;
  constitutional_validation_ref: DecisionReplayArtifactRef;
}>;

export type DecisionReplayAuditRefs = Readonly<{
  audit_ref: DecisionReplayArtifactRef;
  audit_ledger_ref: DecisionReplayArtifactRef;
}>;

export type DecisionReplayCertificationRefs = Readonly<{
  certification_ref: DecisionReplayArtifactRef;
  certification_evidence_ref: DecisionReplayArtifactRef;
}>;

export type DecisionReplayRecord = Readonly<{
  replay_id: string;
  orchestration_id: string;
  mission_id: string;
  tenant_id: string;
  replay_version: "decision-replay-contract/v1";
  schema_version: "decision-replay-schema/v1";
  replay_engine_version: "decision-replay-engine/v1";
  validation_rules_version: "decision-replay-validation-rules/v1";
  replay_timestamp: string;
  replay_requested_by: string;
  replay_reason: string;
  replay_mode: DecisionReplayMode;
  replay_state: DecisionReplayState;
  replay_inputs: DecisionReplayInputs;
  replay_outputs: DecisionReplayOutputs | null;
  lineage_refs: DecisionReplayLineageRefs;
  governance_refs: DecisionReplayGovernanceRefs;
  constitutional_refs: DecisionReplayConstitutionalRefs;
  audit_refs: DecisionReplayAuditRefs | null;
  certification_refs: DecisionReplayCertificationRefs | null;
  validation_status: DecisionReplayValidationStatus;
  certification_status: DecisionReplayCertificationStatus;
  integrity_hash: string;
}>;

export type DecisionReplayFailure =
  | "REPLAY_CONTRACT_MISSING"
  | "REPLAY_SCHEMA_INVALID"
  | "REPLAY_ID_MISSING"
  | "ORCHESTRATION_ID_MISSING"
  | "MISSION_ID_MISSING"
  | "TENANT_ID_MISSING"
  | "REPLAY_VERSION_MISSING"
  | "REPLAY_TIMESTAMP_MISSING"
  | "REPLAY_STATE_MISSING"
  | "REPLAY_INPUTS_MISSING"
  | "LINEAGE_REFS_MISSING"
  | "INTEGRITY_HASH_MISSING"
  | "UNKNOWN_REPLAY_STATE"
  | "UNSUPPORTED_CONTRACT_VERSION"
  | "UNSUPPORTED_SCHEMA_VERSION"
  | "UNSUPPORTED_ENGINE_VERSION"
  | "UNSUPPORTED_VALIDATION_RULE_VERSION"
  | "MISSING_INPUT_REFS"
  | "MISSING_GOVERNANCE_REFS"
  | "MISSING_CONSTITUTIONAL_REFS"
  | "CROSS_TENANT_REFS"
  | "CROSS_ORCHESTRATION_REFS"
  | "MALFORMED_HASH"
  | "INTEGRITY_HASH_MISMATCH"
  | "REPLAY_OUTPUT_MUTATION"
  | "ORIGINAL_ORCHESTRATION_MUTATION_ATTEMPT"
  | "REPLAY_VALIDATION_SKIPPED"
  | "REPLAY_OUTSIDE_CONTRACT";

export type DecisionReplayValidationResult = Readonly<{
  validation_id: string;
  replay_id: string;
  validation_status: DecisionReplayValidationStatus;
  ready_for_replay: boolean;
  schema_valid: boolean;
  versions_supported: boolean;
  tenant_boundary_valid: boolean;
  lineage_complete: boolean;
  governance_refs_present: boolean;
  constitutional_refs_present: boolean;
  replay_inputs_complete: boolean;
  integrity_hash_reproducible: boolean;
  replay_state_valid: boolean;
  replay_outputs_valid: boolean;
  failures: readonly DecisionReplayFailure[];
  integrity_hash: string;
}>;

export type DecisionReplayExecutionGuard = Readonly<{
  guard_id: string;
  replay_id: string;
  execution_allowed: boolean;
  blocked_reason: DecisionReplayFailure | null;
  advisory_only: true;
  mutates_original_orchestration: false;
  integrity_hash: string;
}>;

export type DecisionReplayContractFoundation = Readonly<{
  contract_version: "decision-replay-contract/v1";
  supported_schema_versions: readonly "decision-replay-schema/v1"[];
  supported_engine_versions: readonly "decision-replay-engine/v1"[];
  supported_validation_rule_versions: readonly "decision-replay-validation-rules/v1"[];
  replay_states: readonly DecisionReplayState[];
  terminal_states: readonly DecisionReplayState[];
  replay_modes: readonly DecisionReplayMode[];
  record: DecisionReplayRecord;
  validation: DecisionReplayValidationResult;
  guard: DecisionReplayExecutionGuard;
}>;
