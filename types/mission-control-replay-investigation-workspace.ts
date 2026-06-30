import type { MissionControlGraphVisualizationReport } from "@/types/mission-control-graph-visualization-engine";

export type InvestigationReplayType = "PLANNING_REPLAY" | "EXECUTION_REPLAY" | "DELEGATION_REPLAY" | "ORCHESTRATION_REPLAY" | "SUPERVISION_REPLAY" | "INTERVENTION_REPLAY";
export type InvestigationReplayMode = "LIVE" | "HISTORICAL" | "STEP_BY_STEP" | "CHECKPOINT" | "FORENSIC" | "COMPARISON";
export type InvestigationReplayState = "READY" | "PLAYING" | "PAUSED" | "STEPPING" | "CHECKPOINTED" | "COMPARING" | "ARCHIVED" | "ERROR";
export type InvestigationIntegrityHashType = "EXECUTION_HASH" | "REPLAY_HASH" | "PLANNING_HASH" | "SUPERVISION_HASH" | "DECISION_HASH" | "LINEAGE_HASH";
export type InvestigationIntegrityState = "VERIFIED" | "MISMATCH" | "CORRUPTED" | "MISSING" | "BLOCKED";
export type InvestigationLineageRelationship = "PARENT" | "CHILD" | "DERIVED" | "REPLAY" | "INTERVENTION" | "SUPERVISION" | "DEPENDENCY";
export type InvestigationTimelineEventType = "MISSION_CREATED" | "PLAN_GENERATED" | "EXECUTION_STARTED" | "CHECKPOINT_CREATED" | "TASK_COMPLETED" | "INTERVENTION_OCCURRED" | "POLICY_WARNING" | "AUTHORITY_VALIDATION" | "ROLLBACK_STARTED" | "ROLLBACK_COMPLETED" | "MISSION_COMPLETED";
export type InvestigationMode = "REPLAY_ANALYSIS" | "FAILURE_ANALYSIS" | "FORENSIC_INVESTIGATION" | "GOVERNANCE_REVIEW" | "POLICY_ANALYSIS" | "LINEAGE_ANALYSIS" | "COMPARATIVE_ANALYSIS";
export type InvestigationSearchCategory = "MISSION" | "EXECUTION" | "PLAN" | "TASK" | "DECISION" | "INTERVENTION" | "POLICY" | "AUTHORITY" | "REPLAY" | "LINEAGE" | "CHECKPOINT" | "ROLLBACK";
export type InvestigationValidationOutcome = "VALID" | "WARNING" | "INVALID" | "BLOCKED";

export type ReplayInvestigationScenario =
  | "BASELINE"
  | "REPLAY_DIVERGENCE"
  | "INTEGRITY_UNVERIFIED"
  | "LINEAGE_GAP"
  | "NONDETERMINISTIC_TIMELINE"
  | "INCOMPLETE_EVIDENCE"
  | "GOVERNANCE_HISTORY_GAP"
  | "INCONSISTENT_COMPARISON"
  | "NONDETERMINISTIC_SEARCH"
  | "CROSS_TENANT_HISTORY"
  | "HISTORY_MUTATION_ATTEMPT"
  | "MISSING_REPLAY_REFERENCE"
  | "INTEGRITY_VERIFICATION_FAILED"
  | "HIDDEN_HISTORICAL_STATE"
  | "UNAUTHORIZED_INVESTIGATION_ACCESS";

export type ReplayInvestigationFailure =
  | "REPLAY_RECONSTRUCTION_DIVERGED"
  | "INTEGRITY_HASH_UNVERIFIED"
  | "LINEAGE_RELATIONSHIP_MISSING"
  | "TIMELINE_ORDER_NONDETERMINISTIC"
  | "EVIDENCE_INCOMPLETE"
  | "GOVERNANCE_HISTORY_UNRECONSTRUCTABLE"
  | "HISTORICAL_COMPARISON_INCONSISTENT"
  | "SEARCH_RESULTS_NONDETERMINISTIC"
  | "CROSS_TENANT_HISTORY_EXPOSED"
  | "HISTORICAL_DATA_MUTATION_ATTEMPTED"
  | "REPLAY_REFERENCE_MISSING"
  | "INTEGRITY_VERIFICATION_FAILED"
  | "HIDDEN_HISTORICAL_STATE_VISIBLE"
  | "UNAUTHORIZED_INVESTIGATION_ACCESS";

export type ReplaySessionRecord = Readonly<{
  replay_session_id: string;
  tenant_id: string;
  mission_id: string;
  execution_id: string;
  replay_type: InvestigationReplayType;
  replay_mode: InvestigationReplayMode;
  replay_state: InvestigationReplayState;
  starting_checkpoint: string;
  ending_checkpoint: string;
  current_position: number;
  playback_speed: number;
  controls: readonly string[];
  replay_reference: string;
  lineage_reference: string;
  integrity_hash: string;
  created_at: string;
  replay_hash: string;
}>;

export type InvestigationIntegrityRecord = Readonly<{
  integrity_record_id: string;
  mission_id: string;
  execution_id: string;
  hash_type: InvestigationIntegrityHashType;
  hash_algorithm: "SHA-256";
  hash_value: string;
  verification_status: InvestigationIntegrityState;
  verification_timestamp: string;
  chain_position: number;
  parent_hash: string | null;
  replay_reference: string;
  lineage_reference: string;
  integrity_record_hash: string;
}>;

export type InvestigationLineageRecord = Readonly<{
  lineage_record_id: string;
  tenant_id: string;
  mission_id: string;
  parent_reference: string;
  child_reference: string;
  lineage_depth: number;
  relationship_type: InvestigationLineageRelationship;
  created_at: string;
  replay_reference: string;
  integrity_hash: string;
  lineage_hash: string;
}>;

export type InvestigationTimelineRecord = Readonly<{
  timeline_event_id: string;
  mission_id: string;
  execution_id: string;
  event_type: InvestigationTimelineEventType;
  event_state: string;
  event_timestamp: string;
  sequence_number: number;
  branch_reference: string | null;
  checkpoint_reference: string | null;
  rollback_reference: string | null;
  replay_reference: string;
  lineage_reference: string;
  integrity_hash: string;
  timeline_hash: string;
}>;

export type InvestigationConsoleRecord = Readonly<{
  investigation_id: string;
  operator_id: string;
  tenant_id: string;
  mission_id: string;
  mode: InvestigationMode;
  search_type: InvestigationSearchCategory;
  search_parameters: Readonly<Record<string, string>>;
  results_found: number;
  comparison_mode: boolean;
  generated_at: string;
  console_hash: string;
}>;

export type HistoricalComparisonRecord = Readonly<{
  comparison_id: string;
  comparison_type: string;
  compared_references: readonly string[];
  state_differences: number;
  timeline_differences: number;
  confidence_change: number;
  risk_change: number;
  policy_differences: number;
  authority_differences: number;
  outcome_differences: number;
  deterministic: boolean;
  comparison_hash: string;
}>;

export type InvestigationSearchRecord = Readonly<{
  search_id: string;
  category: InvestigationSearchCategory;
  filters: Readonly<Record<string, string>>;
  result_references: readonly string[];
  deterministic_order: boolean;
  search_hash: string;
}>;

export type EvidenceInspectionRecord = Readonly<{
  evidence_record_id: string;
  mission_id: string;
  execution_id: string;
  evidence_type: string;
  source_reference: string;
  supporting_record: string;
  verification_status: "VERIFIED" | "MISSING";
  timestamp: string;
  evidence_hash: string;
}>;

export type AuditExportRecord = Readonly<{
  export_id: string;
  export_format: string;
  replay_references: readonly string[];
  lineage_references: readonly string[];
  integrity_hashes: readonly string[];
  evidence_references: readonly string[];
  governance_references: readonly string[];
  timestamp: string;
  report_checksum: string;
}>;

export type ReplayInvestigationValidationTest = Readonly<{
  test_id: string;
  name: string;
  expected: "PASS";
  actual: "PASS" | "FAIL";
  passed: boolean;
  failure_reason: ReplayInvestigationFailure | null;
  evidence_refs: readonly string[];
  test_hash: string;
}>;

export type ReplayInvestigationWorkspaceReport = Readonly<{
  phase_version: "8J.4";
  schema_version: "mission-control-replay-investigation-workspace/v8J.4";
  workspace_id: string;
  tenant_id: string;
  mission_id: string;
  validation_outcome: InvestigationValidationOutcome;
  graph_visualization: MissionControlGraphVisualizationReport;
  replay_sessions: readonly ReplaySessionRecord[];
  integrity_records: readonly InvestigationIntegrityRecord[];
  lineage_records: readonly InvestigationLineageRecord[];
  timeline: readonly InvestigationTimelineRecord[];
  investigation_console: InvestigationConsoleRecord;
  comparisons: readonly HistoricalComparisonRecord[];
  searches: readonly InvestigationSearchRecord[];
  evidence_records: readonly EvidenceInspectionRecord[];
  audit_exports: readonly AuditExportRecord[];
  validation_tests: readonly ReplayInvestigationValidationTest[];
  failures: readonly ReplayInvestigationFailure[];
  replay_reference: string;
  lineage_reference: string;
  integrity_hash: string;
  advisory_only: true;
  history_mutation_allowed: false;
  execution_authority_granted: false;
  workspace_hash: string;
}>;

export type ReplayInvestigationWorkspaceInput = Readonly<{
  scenario?: ReplayInvestigationScenario;
  replay_mode?: InvestigationReplayMode;
  investigation_mode?: InvestigationMode;
}>;

export type ReplayInvestigationWorkspaceValidationResult = Readonly<{
  workspace_id: string | null;
  valid: boolean;
  validation_outcome: InvestigationValidationOutcome;
  failures: readonly ReplayInvestigationFailure[];
  workspace_hash_valid: boolean;
  advisory_only: boolean;
  immutable_history: boolean;
  validation_hash: string;
}>;

export type ReplayInvestigationWorkspaceObservabilitySurface = Readonly<{
  workspace_id: string;
  validation_outcome: InvestigationValidationOutcome;
  replay_sessions: number;
  integrity_records: number;
  lineage_records: number;
  timeline_events: number;
  comparisons: number;
  searches: number;
  evidence_records: number;
  audit_exports: number;
  failed_tests: number;
  failures: readonly ReplayInvestigationFailure[];
  advisory_only: boolean;
  history_mutation_allowed: boolean;
  execution_authority_granted: boolean;
  workspace_hash: string;
}>;
