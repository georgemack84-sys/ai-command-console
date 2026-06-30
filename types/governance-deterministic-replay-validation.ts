export type GovernanceReplayValidationState =
  | "REQUESTED"
  | "VALIDATING"
  | "RECONSTRUCTING"
  | "REPLAYING"
  | "COMPARING"
  | "VALIDATED"
  | "REPLAY_FAILED"
  | "COMPARISON_FAILED"
  | "LINEAGE_FAILED"
  | "STATE_FAILED"
  | "INTEGRITY_FAILED";

export type GovernanceReplayValidationResultState = "PASS" | "FAIL";

export type GovernanceReplayValidationComponent =
  | "POLICY"
  | "RECOMMENDATION"
  | "COMPLIANCE"
  | "RISK"
  | "ESCALATION"
  | "LINEAGE"
  | "GOVERNANCE_STATE"
  | "OUTPUT"
  | "ORDERING"
  | "CONFIDENCE";

export type GovernanceReplayDifferenceType =
  | "NONE"
  | "OUTPUT_MISMATCH"
  | "ORDERING_MISMATCH"
  | "CONFIDENCE_MISMATCH"
  | "LINEAGE_MISMATCH"
  | "POLICY_RECONSTRUCTION_MISMATCH"
  | "RECOMMENDATION_RECONSTRUCTION_MISMATCH"
  | "COMPLIANCE_RECONSTRUCTION_MISMATCH"
  | "RISK_RECONSTRUCTION_MISMATCH"
  | "ESCALATION_RECONSTRUCTION_MISMATCH"
  | "GOVERNANCE_STATE_MISMATCH"
  | "REPLAY_EVIDENCE_MISSING"
  | "INTEGRITY_VERIFICATION_FAILURE"
  | "TENANT_ISOLATION_VIOLATION"
  | "HIDDEN_REPLAY_STATE";

export type GovernanceDeterministicReplayScenario =
  | "BASELINE"
  | "POLICY_MISMATCH"
  | "RECOMMENDATION_MISMATCH"
  | "COMPLIANCE_MISMATCH"
  | "RISK_MISMATCH"
  | "ESCALATION_MISMATCH"
  | "LINEAGE_MISMATCH"
  | "GOVERNANCE_STATE_MISMATCH"
  | "OUTPUT_MISMATCH"
  | "ORDERING_MISMATCH"
  | "CONFIDENCE_MISMATCH"
  | "REPLAY_EVIDENCE_MISSING"
  | "INTEGRITY_VERIFICATION_FAILURE"
  | "TENANT_ISOLATION_VIOLATION"
  | "HIDDEN_REPLAY_STATE";

export type GovernanceReplayValidationRun = Readonly<{
  replay_validation_id: string;
  tenant_id: string;
  mission_id: string;
  replay_id: string;
  original_execution_id: string;
  replay_execution_id: string;
  validation_timestamp: string;
  validation_result: GovernanceReplayValidationResultState;
  overall_confidence: number;
  integrity_hash: string;
  run_hash: string;
}>;

export type GovernanceReplayComparison = Readonly<{
  comparison_id: string;
  replay_validation_id: string;
  component: GovernanceReplayValidationComponent;
  original_hash: string;
  replay_hash: string;
  comparison_result: GovernanceReplayValidationResultState;
  difference_type: GovernanceReplayDifferenceType;
  difference_location: string | null;
  comparison_hash: string;
}>;

export type GovernanceReplayValidationOutcome = Readonly<{
  validation_result_id: string;
  overall_result: GovernanceReplayValidationResultState;
  policy_result: GovernanceReplayValidationResultState;
  recommendation_result: GovernanceReplayValidationResultState;
  compliance_result: GovernanceReplayValidationResultState;
  risk_result: GovernanceReplayValidationResultState;
  escalation_result: GovernanceReplayValidationResultState;
  lineage_result: GovernanceReplayValidationResultState;
  governance_state_result: GovernanceReplayValidationResultState;
  failure_count: number;
  warning_count: number;
  outcome_hash: string;
}>;

export type GovernanceReplayValidationTimelineEvent = Readonly<{
  event_id: string;
  stage: "VALIDATE_REPLAY_CONTRACT" | "LOAD_IMMUTABLE_EVIDENCE" | "RECONSTRUCT_GOVERNANCE_STATE" | "REPLAY_GOVERNANCE_INTELLIGENCE" | "COMPARE_ORIGINAL_REPLAY" | "VALIDATE_DETERMINISM" | "STORE_REPLAY_EVIDENCE";
  timestamp: string;
  state: GovernanceReplayValidationState;
  summary: string;
  event_hash: string;
}>;

export type GovernanceReplayValidationLedgerRecord = Readonly<{
  ledger_record_id: string;
  replay_validation_id: string;
  tenant_id: string;
  mission_id: string;
  comparison_hashes: readonly string[];
  outcome_hash: string;
  evidence_hash: string;
  integrity_hash: string;
  append_only: true;
  recorded_at: string;
  ledger_hash: string;
}>;

export type GovernanceDeterministicReplayValidationReport = Readonly<{
  validator_id: string;
  phase_version: "7L.2";
  schema_version: "governance-deterministic-replay-validation/v7L.2";
  generated_at: string;
  read_only: true;
  advisory_only: true;
  replay_mutation_allowed: false;
  governance_execution_allowed: false;
  tenant_isolated: boolean;
  replay_lineage_preserved: boolean;
  replay_validation_run: GovernanceReplayValidationRun;
  comparisons: readonly GovernanceReplayComparison[];
  validation_outcome: GovernanceReplayValidationOutcome;
  timeline: readonly GovernanceReplayValidationTimelineEvent[];
  evidence_package: Readonly<{
    evidence_package_id: string;
    immutable_evidence_refs: readonly string[];
    replay_refs: readonly string[];
    lineage_refs: readonly string[];
    integrity_hashes: readonly string[];
    evidence_hash: string;
  }>;
  truth_ledger_record: GovernanceReplayValidationLedgerRecord;
  observability: Readonly<{
    replay_success_rate: number;
    replay_duration_ms: number;
    reconstruction_latency_ms: number;
    comparison_accuracy: number;
    mismatch_frequency: number;
    replay_confidence: number;
    lineage_reconstruction_rate: number;
  }>;
  report_hash: string;
}>;

export type GovernanceDeterministicReplayValidationInput = Readonly<{
  scenario?: GovernanceDeterministicReplayScenario;
  tenant_id?: string;
  mission_id?: string;
  replay_requestor?: string;
}>;

export type GovernanceDeterministicReplayValidationObservabilitySurface = Readonly<{
  replay_validation_id: string;
  validation_result: GovernanceReplayValidationResultState;
  validation_state: GovernanceReplayValidationState;
  comparison_count: number;
  mismatch_count: number;
  replay_success_rate: number;
  replay_confidence: number;
  report_hash: string;
}>;
