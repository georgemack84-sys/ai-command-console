export type ReplayArtifactType = "MISSION" | "PLANNING" | "DELEGATION" | "COMMUNICATION" | "GOVERNANCE" | "AUTHORITY" | "SHARED_STATE" | "INTERVENTION" | "MISSION_COMPLETION";
export type ReplayState = "REPRODUCED" | "MISMATCH" | "INCOMPLETE" | "INVALID";
export type ReplayMachineState = "INITIALIZING" | "LOADING_EVIDENCE" | "VERIFYING_HASHES" | "RECONSTRUCTING" | "VALIDATING" | "COMPARING" | "REPRODUCED" | "MISMATCH" | "INCOMPLETE" | "INVALID" | "CERTIFIED";
export type InterventionType = "OPERATOR" | "GOVERNANCE" | "SUPERVISOR" | "CERTIFICATION" | "RUNTIME" | "RECOVERY";
export type ReplayConsistencyScenario = "BASELINE" | "PLANNING_MISMATCH" | "DELEGATION_MISMATCH" | "MISSING_COMMUNICATION" | "GOVERNANCE_MISMATCH" | "AUTHORITY_MISMATCH" | "SHARED_STATE_MISMATCH" | "INTERVENTION_MISMATCH" | "ORDERING_MISMATCH" | "INCOMPLETE_REPLAY" | "INCONSISTENT_AGENT_STATE" | "INTEGRITY_FAILURE" | "CROSS_TENANT_REPLAY";
export type ReplayConsistencyFailure = "PLANNING_REPLAY_MISMATCH_DETECTED" | "DELEGATION_REPLAY_MISMATCH_DETECTED" | "MISSING_COMMUNICATION_DETECTED" | "GOVERNANCE_REPLAY_MISMATCH_DETECTED" | "AUTHORITY_REPLAY_MISMATCH_DETECTED" | "SHARED_STATE_REPLAY_MISMATCH_DETECTED" | "INTERVENTION_REPLAY_MISMATCH_DETECTED" | "ORDERING_MISMATCH_DETECTED" | "INCOMPLETE_REPLAY_DETECTED" | "INCONSISTENT_AGENT_STATE_RECONSTRUCTION_DETECTED" | "REPLAY_INTEGRITY_VERIFICATION_FAILED" | "CROSS_TENANT_REPLAY_CONTAMINATION_DETECTED";

export type ReplayConsistencyContract = Readonly<{
  replay_contract_id: string;
  coordination_session_id: string;
  mission_id: string;
  tenant_id: string;
  planning_reference: string;
  delegation_reference: string;
  communication_reference: string;
  governance_reference: string;
  authority_reference: string;
  shared_state_reference: string;
  intervention_reference: string;
  integrity_reference: string;
  replay_policy_version: "replay-consistency-policy/v8ALT.7.7";
  created_timestamp: string;
  immutable: true;
  append_only: true;
  governance_bound: true;
  tenant_isolated: true;
  integrity_hash: string;
}>;

export type ReplayLedgerEntry = Readonly<{
  replay_entry_id: string;
  coordination_session_id: string;
  artifact_type: ReplayArtifactType;
  artifact_reference: string;
  hash_reference: string;
  lineage_reference: string;
  replay_state: ReplayState;
  verification_result: "MATCH" | "MISMATCH" | "MISSING" | "INVALID";
  timestamp: string;
}>;

export type ReplayTimeline = Readonly<{
  timeline_id: string;
  event_sequence: readonly ReplayArtifactType[];
  planning_reference: string;
  delegation_reference: string;
  communication_reference: string;
  governance_reference: string;
  authority_reference: string;
  shared_state_reference: string;
  timestamp: string;
  integrity_hash: string;
}>;

export type AgentReplayTrace = Readonly<{
  agent_replay_trace_id: string;
  agent_id: string;
  replayed_actions: readonly string[];
  state_transitions: readonly string[];
  authority_validations: readonly string[];
  communication_events: readonly string[];
  delegation_events: readonly string[];
  verification_result: "REPRODUCED" | "MISMATCH";
  integrity_hash: string;
}>;

export type ReplayMismatchAnalysis = Readonly<{
  analysis_id: string;
  artifact_reference: string;
  expected_value: string;
  observed_value: string;
  difference_summary: string;
  root_cause: ReplayConsistencyFailure;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  recommended_action: string;
}>;

export type ReplayOperationEvent = Readonly<{
  event_id: string;
  coordination_session_id: string;
  artifact_reference: string;
  replay_operation: "START" | "REPLAY_PLANNING" | "REPLAY_DELEGATION" | "REPLAY_COMMUNICATION" | "REPLAY_SHARED_STATE" | "COMPARE" | "REPORT";
  previous_state: ReplayMachineState;
  current_state: ReplayMachineState;
  verification_result: "PASS" | "FAIL";
  timestamp: string;
  integrity_signature: string;
}>;

export type ReplayConsistencyEvidence = Readonly<{
  replay_validation_id: string;
  coordination_session_id: string;
  mission_id: string;
  planning_references: readonly string[];
  delegation_references: readonly string[];
  communication_references: readonly string[];
  governance_references: readonly string[];
  authority_references: readonly string[];
  shared_state_references: readonly string[];
  intervention_references: readonly string[];
  verification_results: readonly string[];
  lineage_reference: string;
  integrity_hash: string;
  timestamp: string;
}>;

export type ReplayConsistencySession = Readonly<{
  contract: ReplayConsistencyContract;
  ledger: readonly ReplayLedgerEntry[];
  timeline: ReplayTimeline;
  agent_traces: readonly AgentReplayTrace[];
  mismatch_analysis: readonly ReplayMismatchAnalysis[];
  events: readonly ReplayOperationEvent[];
  evidence: ReplayConsistencyEvidence;
  state: ReplayState;
  version: "replay-consistency-assurance/v8ALT.7.7";
  contract_hash: string;
}>;

export type ReplayConsistencyInput = Readonly<{
  scenario?: ReplayConsistencyScenario;
  tenant_id?: string;
  mission_id?: string;
  session?: ReplayConsistencySession;
}>;

export type ReplayConsistencyValidationResult = Readonly<{
  replay_contract_id: string | null;
  valid: boolean;
  contract_valid: boolean;
  planning_reproduced: boolean;
  delegation_reproduced: boolean;
  communication_reproduced: boolean;
  governance_reproduced: boolean;
  authority_reproduced: boolean;
  shared_state_reproduced: boolean;
  intervention_reproduced: boolean;
  ordering_deterministic: boolean;
  evidence_complete: boolean;
  agent_state_identical: boolean;
  integrity_verified: boolean;
  hash_chain_verified: boolean;
  lineage_preserved: boolean;
  operator_visible: boolean;
  tenant_isolated: boolean;
  fail_closed: boolean;
  failures: readonly ReplayConsistencyFailure[];
  validation_hash: string;
}>;

export type ReplayConsistencyObservabilitySurface = Readonly<{
  replay_contract_id: string;
  tenant_id: string;
  mission_id: string;
  replay_entry_count: number;
  agent_trace_count: number;
  mismatch_count: number;
  state: ReplayState;
  contract_hash: string;
}>;

export type ReplayConsistencyAssuranceBundle = Readonly<{
  doctrine: Readonly<{
    contract_version: "replay-consistency-assurance/v8ALT.7.7";
    final_state: "REPLAY_CONSISTENCY_ASSURANCE_CERTIFIED";
    states: readonly ReplayMachineState[];
    artifact_types: readonly ReplayArtifactType[];
    intervention_types: readonly InterventionType[];
    principles: readonly string[];
  }>;
  session: ReplayConsistencySession;
  validation: ReplayConsistencyValidationResult;
  observability: ReplayConsistencyObservabilitySurface;
}>;
