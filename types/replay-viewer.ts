import type { TruthDashboardAccessLevel, TruthDashboardAccessResult, TruthDashboardIntegrityState, TruthDashboardState } from "@/types/truth-dashboard";
import type { TruthLifecycleState } from "@/services/mission-control";

export type ReplayState = "REPRODUCED" | "MISMATCH" | "INCOMPLETE" | "INVALID" | "NOT_AVAILABLE";
export type ReplayTargetType = "TRUTH_RECORD" | "RECOMMENDATION" | "DECISION" | "EVIDENCE_CHAIN" | "GOVERNANCE_EVENT" | "ESCALATION" | "RUNTIME_EVENT";
export type ReconstructionState = "RECONSTRUCTED" | "PARTIAL" | "MISSING" | "CORRUPTED" | "RESTRICTED" | "INVALID";
export type OutputVerificationState = "MATCH" | "MISMATCH" | "NOT_COMPARABLE" | "MISSING_EXPECTED_OUTPUT" | "MISSING_REPLAY_OUTPUT" | "INVALID";
export type DeterminismState = "DETERMINISTIC" | "NONDETERMINISTIC" | "UNVERIFIED" | "PARTIAL" | "INVALID";

export type ReplayViewerContract = Readonly<{
  replay_viewer_id: string;
  tenant_id: string;
  operator_id: string;
  scope: Readonly<{
    mission_ids?: readonly string[];
    truth_record_ids?: readonly string[];
    replay_ids?: readonly string[];
    time_range?: Readonly<{ from: string; to: string }>;
    access_level: TruthDashboardAccessLevel;
  }>;
  displays: Readonly<{
    replay_summary: boolean;
    input_reconstruction: boolean;
    state_reconstruction: boolean;
    output_verification: boolean;
    mismatch_analysis: boolean;
    evidence_context: boolean;
    lineage_context: boolean;
    governance_context: boolean;
    integrity_context: boolean;
  }>;
  governance: Readonly<{
    tenant_isolation_required: boolean;
    restricted_records_hidden: boolean;
    redaction_required: boolean;
    replay_mutation_blocked: boolean;
    truth_record_mutation_blocked: boolean;
    authority_escalation_blocked: boolean;
  }>;
  replay: Readonly<{
    replay_refs_visible: boolean;
    replay_state_visible: boolean;
    replay_inputs_visible: boolean;
    replay_outputs_visible: boolean;
    determinism_state_visible: boolean;
  }>;
  audit: Readonly<{
    viewer_access_audited: boolean;
    restricted_access_audited: boolean;
    replay_link_access_audited: boolean;
  }>;
}>;

export type ReplayViewerRecord = Readonly<{
  replay_id: string;
  truth_record_id: string;
  tenant_id: string;
  mission_id?: string;
  replay_state: ReplayState;
  replay_target: Readonly<{ target_type: ReplayTargetType; target_id: string }>;
  replay_summary: Readonly<{
    title: string;
    summary: string;
    replay_timestamp: string;
    replay_engine_version: string;
    replay_contract_version: string;
  }>;
  reconstruction: Readonly<{
    input_reconstruction_state: ReconstructionState;
    state_reconstruction_state: ReconstructionState;
    output_verification_state: OutputVerificationState;
    determinism_state: DeterminismState;
  }>;
  integrity: Readonly<{
    integrity_state: TruthDashboardIntegrityState;
    hash_chain_state: "VALID" | "BROKEN" | "UNKNOWN";
    tamper_detection_state: "CLEAR" | "SUSPECTED" | "CONFIRMED" | "UNKNOWN";
  }>;
  references: Readonly<{
    input_refs: readonly string[];
    evidence_refs: readonly string[];
    lineage_refs: readonly string[];
    governance_refs: readonly string[];
    decision_refs: readonly string[];
    recommendation_refs: readonly string[];
    replay_refs: readonly string[];
  }>;
  visibility: Readonly<{
    restricted: boolean;
    redacted: boolean;
    hidden_segments: readonly string[];
    access_result: TruthDashboardAccessResult;
    restriction_reason?: string;
  }>;
}>;

export type ReplaySummaryDisplay = Readonly<{
  replay_id: string;
  truth_record_id: string;
  tenant_id: string;
  mission_id?: string;
  replay_state: ReplayState;
  target_type: ReplayTargetType;
  target_id: string;
  replay_started_at?: string;
  replay_completed_at?: string;
  replay_engine_version: string;
  replay_contract_version: string;
  deterministic: boolean;
  mismatch_count: number;
  missing_dependency_count: number;
  restricted_segment_count: number;
  integrity_state: TruthDashboardIntegrityState;
}>;

export type InputReconstructionDisplay = Readonly<{
  replay_id: string;
  truth_record_id: string;
  input_state: ReconstructionState;
  inputs: readonly Readonly<{
    input_id: string;
    input_type: "USER_INPUT" | "SYSTEM_INPUT" | "EVIDENCE" | "SIGNAL" | "OBSERVATION" | "POLICY" | "RUNTIME_STATE" | "CONFIGURATION";
    source_ref: string;
    integrity_state: TruthDashboardIntegrityState;
    visibility: "VISIBLE" | "REDACTED" | "HIDDEN";
    required_for_replay: boolean;
    present: boolean;
  }>[];
  missing_inputs: readonly string[];
  restricted_inputs: readonly string[];
  corrupted_inputs: readonly string[];
}>;

export type StateReconstructionDisplay = Readonly<{
  replay_id: string;
  truth_record_id: string;
  state_reconstruction_state: ReconstructionState;
  reconstructed_state: Readonly<{
    truth_record_state?: TruthLifecycleState;
    governance_state?: string;
    authority_state?: string;
    policy_state?: string;
    mission_state?: string;
    runtime_state?: string;
    decision_state?: string;
    recommendation_state?: string;
    evidence_state?: string;
    lineage_state?: string;
  }>;
  state_dependencies: readonly Readonly<{
    dependency_id: string;
    dependency_type: "TRUTH_RECORD" | "POLICY" | "AUTHORITY" | "EVIDENCE" | "LINEAGE" | "CONFIGURATION" | "RUNTIME" | "MISSION_CONTEXT";
    required: boolean;
    present: boolean;
    integrity_state: TruthDashboardIntegrityState;
    visibility: "VISIBLE" | "REDACTED" | "HIDDEN";
  }>[];
  missing_state_dependencies: readonly string[];
  restricted_state_dependencies: readonly string[];
  corrupted_state_dependencies: readonly string[];
}>;

export type FieldMismatch = Readonly<{
  field_path: string;
  expected_value_summary: string;
  replay_value_summary: string;
  mismatch_type: "VALUE_MISMATCH" | "MISSING_EXPECTED" | "MISSING_REPLAY" | "TYPE_MISMATCH" | "ORDERING_MISMATCH" | "HASH_MISMATCH" | "REDACTION_CONFLICT";
}>;

export type OutputVerificationDisplay = Readonly<{
  replay_id: string;
  truth_record_id: string;
  verification_state: OutputVerificationState;
  expected_output: Readonly<{
    output_ref: string;
    output_type: "RECOMMENDATION" | "DECISION" | "RISK" | "CONFIDENCE" | "GOVERNANCE_RESULT" | "ESCALATION" | "RUNTIME_RESULT" | "TRUTH_RECORD";
    summary: string;
    hash?: string;
    redacted: boolean;
  }>;
  replay_output: Readonly<{
    output_ref?: string;
    output_type?: string;
    summary?: string;
    hash?: string;
    redacted: boolean;
  }>;
  comparison: Readonly<{
    exact_match: boolean;
    semantic_match?: boolean;
    hash_match?: boolean;
    field_mismatches: readonly FieldMismatch[];
    missing_fields: readonly string[];
    extra_fields: readonly string[];
  }>;
}>;

export type ReplayMismatchAnalysis = Readonly<{
  replay_id: string;
  truth_record_id: string;
  mismatch_state: "NO_MISMATCH" | "INPUT_MISMATCH" | "STATE_MISMATCH" | "OUTPUT_MISMATCH" | "GOVERNANCE_MISMATCH" | "LINEAGE_MISMATCH" | "EVIDENCE_MISMATCH" | "INTEGRITY_MISMATCH" | "UNKNOWN_MISMATCH";
  root_cause_candidates: readonly Readonly<{
    cause_type: "MISSING_INPUT" | "RESTRICTED_INPUT" | "CORRUPTED_INPUT" | "POLICY_VERSION_DRIFT" | "AUTHORITY_STATE_DRIFT" | "EVIDENCE_DRIFT" | "LINEAGE_BREAK" | "HASH_CHAIN_BREAK" | "NONDETERMINISTIC_PROCESS" | "RUNTIME_STATE_MISMATCH" | "CONFIGURATION_MISMATCH" | "UNKNOWN";
    confidence: "LOW" | "MEDIUM" | "HIGH";
    supporting_refs: readonly string[];
    summary: string;
  }>[];
  first_detected_mismatch?: Readonly<{
    stage: "INPUT_RECONSTRUCTION" | "STATE_RECONSTRUCTION" | "OUTPUT_VERIFICATION" | "DETERMINISM_GATE" | "INTEGRITY_CHECK";
    field_path?: string;
    reference_id?: string;
    summary: string;
  }>;
}>;

export type IncompleteReplayDisplay = Readonly<{
  replay_id: string;
  truth_record_id: string;
  incomplete_reasons: readonly Readonly<{
    reason_type: "MISSING_INPUT" | "MISSING_EVIDENCE" | "MISSING_LINEAGE" | "MISSING_POLICY_STATE" | "MISSING_AUTHORITY_STATE" | "MISSING_RUNTIME_STATE" | "RESTRICTED_DEPENDENCY" | "CORRUPTED_DEPENDENCY" | "EXPIRED_RETENTION" | "UNAVAILABLE_REFERENCE";
    required_for_replay: boolean;
    reference_id?: string;
    summary: string;
  }>[];
  reconstruction_coverage: Readonly<{
    input_coverage: number;
    state_coverage: number;
    output_coverage: number;
    evidence_coverage: number;
    lineage_coverage: number;
  }>;
}>;

export type InvalidReplayDisplay = Readonly<{
  replay_id: string;
  truth_record_id: string;
  invalid_reasons: readonly string[];
  trusted_interpretation_blocked: boolean;
  escalation_required: boolean;
}>;

export type DeterminismGateDisplay = Readonly<{
  replay_id: string;
  truth_record_id: string;
  determinism_state: DeterminismState;
  same_inputs_same_hash: boolean;
  stable_ordering: boolean;
  nondeterministic_refs: readonly string[];
}>;

export type ReplayTimelineEvent = Readonly<{
  event_id: string;
  replay_id: string;
  stage: "INPUT_RECONSTRUCTION" | "STATE_RECONSTRUCTION" | "OUTPUT_VERIFICATION" | "DETERMINISM_GATE" | "INTEGRITY_CHECK" | "GOVERNANCE_CHECK";
  state: string;
  timestamp: string;
  refs: readonly string[];
}>;

export type ReplayDiffDisplay = Readonly<{
  replay_id: string;
  truth_record_id: string;
  diff_state: "NO_DIFF" | "DIFF_PRESENT" | "REDACTED_DIFF" | "NOT_COMPARABLE";
  field_mismatches: readonly FieldMismatch[];
  redacted: boolean;
}>;

export type ReplayViewerAuditEvent = Readonly<{
  audit_event_id: string;
  replay_viewer_id: string;
  replay_id?: string;
  truth_record_id?: string;
  tenant_id: string;
  operator_id: string;
  event_type: "REPLAY_VIEWER_OPENED" | "REPLAY_RECORD_VIEWED" | "INPUT_RECONSTRUCTION_VIEWED" | "STATE_RECONSTRUCTION_VIEWED" | "OUTPUT_VERIFICATION_VIEWED" | "MISMATCH_ANALYSIS_VIEWED" | "INCOMPLETE_REPLAY_VIEWED" | "INVALID_REPLAY_VIEWED" | "REPLAY_DIFF_VIEWED" | "GOVERNANCE_REPLAY_CONTEXT_VIEWED" | "RESTRICTED_REPLAY_ATTEMPTED" | "REDACTED_REPLAY_VIEWED" | "REPLAY_LINK_OPENED";
  access_result: TruthDashboardAccessResult;
  timestamp: string;
  governance_context: Readonly<{ policy_id?: string; access_level: string; restriction_reason?: string }>;
  appendOnly: true;
  sourceMutationAllowed: false;
}>;

export type ReplayViewerQuery = Readonly<{
  tenant_id: string;
  operator_id: string;
  filters: Readonly<{
    mission_id?: string;
    replay_id?: string;
    truth_record_id?: string;
    replay_state?: ReplayState;
    target_type?: ReplayTargetType;
    integrity_state?: TruthDashboardIntegrityState;
    search_text?: string;
    restricted?: boolean;
  }>;
  governance_context: Readonly<{ access_level: TruthDashboardAccessLevel; restricted_access_allowed: boolean }>;
}>;

export type ReplayViewerDetail = Readonly<{
  record: ReplayViewerRecord;
  summary: ReplaySummaryDisplay;
  input_reconstruction: InputReconstructionDisplay;
  state_reconstruction: StateReconstructionDisplay;
  output_verification: OutputVerificationDisplay;
  mismatch_analysis: ReplayMismatchAnalysis;
  incomplete_replay: IncompleteReplayDisplay;
  invalid_replay: InvalidReplayDisplay;
  determinism: DeterminismGateDisplay;
  timeline: readonly ReplayTimelineEvent[];
  diff: ReplayDiffDisplay;
  evidence_refs: readonly string[];
  lineage_refs: readonly string[];
  governance_refs: readonly string[];
  warnings: readonly string[];
  access_result: TruthDashboardAccessResult;
}>;

export type ReplayViewerView = Readonly<{
  contract: ReplayViewerContract;
  state: TruthDashboardState;
  records: readonly ReplayViewerRecord[];
  selected_replay: ReplayViewerDetail;
  audit_events: readonly ReplayViewerAuditEvent[];
  available_filters: Readonly<{
    replay_states: readonly ReplayState[];
    target_types: readonly ReplayTargetType[];
    integrity_states: readonly TruthDashboardIntegrityState[];
  }>;
  guardrails: readonly string[];
  query_hash: string;
  generated_at: string;
  readOnly: true;
  replayMutationAllowed: false;
  truthRecordMutationAllowed: false;
  approvalAllowed: false;
  executionAllowed: false;
}>;
