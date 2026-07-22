import type { DecisionReplayMode } from "@/types/decision-replay-contract";
import type { OrchestrationTraceBuilderResult } from "@/types/decision-orchestration-trace-builder";

export type DeterministicReplayState =
  | "CREATED"
  | "VALIDATED"
  | "ARTIFACTS_LOADED"
  | "STATE_RESTORED"
  | "REPLAY_RUNNING"
  | "REPLAY_COMPLETED"
  | "REPLAY_MATCHED"
  | "DIVERGENCE_DETECTED"
  | "INTEGRITY_FAILURE"
  | "REPLAY_FAILED"
  | "CERTIFIED"
  | "REJECTED"
  | "ARCHIVED";

export type ReplayEqualityDomain =
  | "input_candidate_set"
  | "normalized_candidate_set"
  | "context_set"
  | "dependency_graph"
  | "priority_scores"
  | "priority_order"
  | "conflict_classifications"
  | "governance_outcomes"
  | "decision_packages"
  | "operator_actions"
  | "final_decision_state";

export type ReplayMatchStatus = "MATCH" | "DIVERGENCE";

export type DeterministicReplayFailure =
  | "REPLAY_CONTRACT_INVALID"
  | "UNKNOWN_REPLAY_STATE"
  | "REQUIRED_ARTIFACT_MISSING"
  | "ARTIFACT_INTEGRITY_MISMATCH"
  | "LINEAGE_BROKEN"
  | "TENANT_MISMATCH"
  | "GOVERNANCE_ARTIFACT_MISSING"
  | "CONSTITUTIONAL_ARTIFACT_MISSING"
  | "OPERATOR_WORKFLOW_ARTIFACT_MISSING"
  | "UNSUPPORTED_REPLAY_VERSION"
  | "UNSUPPORTED_ARTIFACT_VERSION"
  | "NONDETERMINISTIC_VALUE_DETECTED"
  | "REPLAY_OUTPUT_DIVERGENCE"
  | "FINAL_DECISION_REPRODUCTION_FAILED"
  | "ORIGINAL_ORCHESTRATION_MUTATED"
  | "EXTERNAL_EXECUTION_ATTEMPTED"
  | "LIVE_SYSTEM_LOOKUP_ATTEMPTED"
  | "REPLAY_LEDGER_COMMIT_FAILURE";

export type RestoredStateRecord = Readonly<{
  restored_ref: string;
  equality_domain: ReplayEqualityDomain;
  source_snapshot_id: string;
  restored_payload: unknown;
  restored_hash: string;
}>;

export type ReplayValidationResult = Readonly<{
  validation_id: string;
  replay_id: string;
  input_match: boolean;
  context_match: boolean;
  graph_match: boolean;
  priority_match: boolean;
  conflict_match: boolean;
  governance_match: boolean;
  package_match: boolean;
  operator_workflow_match: boolean;
  final_decision_match: boolean;
  overall_match_status: ReplayMatchStatus;
  divergence_detected: boolean;
  divergence_refs: readonly ReplayEqualityDomain[];
  validation_status: "VALID" | "BLOCKED";
  integrity_hash: string;
}>;

export type ReplayReport = Readonly<{
  replay_report_id: string;
  replay_id: string;
  orchestration_id: string;
  mission_id: string;
  tenant_id: string;
  replay_summary: string;
  replay_mode: DecisionReplayMode;
  replay_stage_results: readonly string[];
  restored_artifact_summary: readonly string[];
  equality_check_results: ReplayValidationResult;
  divergence_summary: readonly ReplayEqualityDomain[];
  integrity_summary: string;
  governance_summary: string;
  constitutional_summary: string;
  operator_workflow_summary: string;
  final_replay_status: DeterministicReplayState;
  certification_ready: boolean;
  integrity_hash: string;
}>;

export type ReplayExecutionRecord = Readonly<{
  replay_execution_id: string;
  replay_id: string;
  orchestration_id: string;
  mission_id: string;
  tenant_id: string;
  replay_mode: DecisionReplayMode;
  replay_version: "decision-deterministic-replay/v1";
  replay_engine_version: "decision-replay-engine/v1";
  replay_state: DeterministicReplayState;
  restored_inputs_ref: string;
  restored_contexts_ref: string;
  restored_graph_ref: string;
  restored_priorities_ref: string;
  restored_conflicts_ref: string;
  restored_governance_ref: string;
  restored_packages_ref: string;
  restored_operator_workflow_ref: string;
  replayed_final_decision_ref: string;
  validation_result: ReplayValidationResult;
  match_status: ReplayMatchStatus;
  divergence_refs: readonly ReplayEqualityDomain[];
  integrity_verification_ref: string;
  replay_report_ref: string;
  lineage_refs: readonly string[];
  integrity_hash: string;
}>;

export type ReplayLedgerEntry = Readonly<{
  ledger_entry_id: string;
  replay_execution_id: string;
  replay_id: string;
  sequence: number;
  record_hash: string;
  append_only: true;
  deleted: false;
  integrity_hash: string;
}>;

export type DeterministicReplayEngineResult = Readonly<{
  engine_version: "decision-deterministic-replay-engine/v1";
  trace_builder_result: OrchestrationTraceBuilderResult;
  restored_states: readonly RestoredStateRecord[];
  validation: ReplayValidationResult;
  report: ReplayReport;
  execution_record: ReplayExecutionRecord;
  ledger: readonly ReplayLedgerEntry[];
  failures: readonly DeterministicReplayFailure[];
  deterministic: true;
  advisory_only: true;
  external_calls_blocked: true;
  live_system_lookups_blocked: true;
  mutates_original_orchestration: false;
  integrity_hash: string;
}>;

export type DeterministicReplayEngineFoundation = Readonly<{
  engine_version: "decision-deterministic-replay-engine/v1";
  replay_states: readonly DeterministicReplayState[];
  equality_domains: readonly ReplayEqualityDomain[];
  result: DeterministicReplayEngineResult;
}>;
