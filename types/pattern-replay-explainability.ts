import type { PatternLedgerResult } from "@/types/pattern-intelligence-ledger";

export type PatternReplayStatus = "REPLAY_PASS" | "REPLAY_FAIL" | "PENDING_EVIDENCE";

export type PatternReplayValidationState =
  | "LEDGER_INPUT_VALIDATED"
  | "PATTERN_RECONSTRUCTED"
  | "TIMELINE_RECONSTRUCTED"
  | "EVIDENCE_NAVIGATED"
  | "EXPLAINABILITY_GENERATED"
  | "REPLAY_VERIFIED"
  | "CERTIFIED"
  | "FAILED"
  | "PENDING_EVIDENCE";

export type PatternReplayFailure =
  | "LEDGER_INPUT_MISSING"
  | "LEDGER_INPUT_UNCERTIFIED"
  | "REPLAY_REFERENCES_MISSING"
  | "EVIDENCE_UNAVAILABLE"
  | "RECURRENCE_MISMATCH"
  | "SCORING_MISMATCH"
  | "GOVERNANCE_MISMATCH"
  | "TIMELINE_INCONSISTENCY"
  | "INTEGRITY_VERIFICATION_FAILED"
  | "REPLAY_DIVERGENCE_DETECTED"
  | "TENANT_BOUNDARY_VIOLATED"
  | "EXPLANATION_MISSING"
  | "OPAQUE_ARTIFACT_DETECTED"
  | "REGISTRY_MUTATION_DETECTED"
  | "HISTORICAL_MUTATION_DETECTED"
  | "AUTONOMOUS_LEARNING_DETECTED"
  | "FAIL_OPEN_BEHAVIOR";

export type PatternReplayScenario =
  | "BASELINE"
  | "MISSING_LEDGER_INPUT"
  | "UNCERTIFIED_LEDGER_INPUT"
  | "MISSING_REPLAY"
  | "MISSING_EVIDENCE"
  | "RECURRENCE_MISMATCH"
  | "SCORING_MISMATCH"
  | "GOVERNANCE_MISMATCH"
  | "TIMELINE_INCONSISTENCY"
  | "HASH_MISMATCH"
  | "REPLAY_DIVERGENCE"
  | "CROSS_TENANT"
  | "MISSING_EXPLANATION"
  | "OPAQUE_ARTIFACT"
  | "REGISTRY_MUTATION"
  | "HISTORICAL_MUTATION"
  | "AUTONOMOUS_LEARNING"
  | "FAIL_OPEN";

export type PatternReplayRecord = Readonly<{
  replay_id: string;
  pattern_id: string;
  tenant_id: string;
  mission_scope: string;
  replay_timestamp: string;
  replay_version: "pattern-replay/v1";
  replay_status: PatternReplayStatus;
  replay_summary: string;
  reconstructed_pattern_refs: readonly string[];
  reconstructed_evidence_refs: readonly string[];
  reconstructed_scoring_refs: readonly string[];
  reconstructed_governance_refs: readonly string[];
  reconstructed_recurrence_refs: readonly string[];
  reconstructed_ledger_sequence: number;
  reconstructed_ledger_hash: string;
  timeline_refs: readonly string[];
  explainability_refs: readonly string[];
  replay_integrity_result: "VERIFIED" | "FAILED";
  replay_divergence_detected: boolean;
  integrity_hash: string;
  advisory_only: true;
  immutable: true;
  mutates_history: false;
  mutates_patterns: false;
  autonomous_learning: false;
}>;

export type PatternExplainabilityArtifact = Readonly<{
  explainability_id: string;
  replay_id: string;
  pattern_id: string;
  tenant_id: string;
  why_detected: string;
  why_validated: string;
  why_scored: string;
  why_governance_reviewed: string;
  why_escalation_recommended: string;
  why_replay_succeeded: string;
  why_integrity_verified: string;
  evidence_refs: readonly string[];
  scoring_refs: readonly string[];
  governance_refs: readonly string[];
  replay_refs: readonly string[];
  complete: boolean;
  opaque: boolean;
  integrity_hash: string;
}>;

export type PatternTimelineEvent = Readonly<{
  timeline_event_id: string;
  pattern_id: string;
  tenant_id: string;
  sequence: number;
  event_type: "DETECTION" | "VALIDATION" | "SCORING" | "GOVERNANCE" | "LEDGER_APPEND" | "REPLAY";
  event_ref: string;
  event_summary: string;
  integrity_hash: string;
}>;

export type PatternEvidenceNavigationMap = Readonly<{
  evidence_map_id: string;
  pattern_id: string;
  tenant_id: string;
  decision_evidence_refs: readonly string[];
  recommendation_evidence_refs: readonly string[];
  outcome_evidence_refs: readonly string[];
  governance_evidence_refs: readonly string[];
  operator_evidence_refs: readonly string[];
  simulation_evidence_refs: readonly string[];
  replay_evidence_refs: readonly string[];
  truth_ledger_refs: readonly string[];
  integrity_verified: boolean;
  integrity_hash: string;
}>;

export type PatternReplayComparison = Readonly<{
  comparison_id: string;
  pattern_id: string;
  tenant_id: string;
  identity_match: boolean;
  evidence_match: boolean;
  recurrence_match: boolean;
  scoring_match: boolean;
  governance_match: boolean;
  ledger_sequence_match: boolean;
  integrity_hash_match: boolean;
  replay_pass: boolean;
  integrity_hash: string;
}>;

export type PatternExplainabilityRegistry = Readonly<{
  registry_id: string;
  tenant_id: string;
  replay_refs: readonly string[];
  explainability_refs: readonly string[];
  timeline_refs: readonly string[];
  evidence_map_refs: readonly string[];
  comparison_refs: readonly string[];
  append_only: true;
  immutable: true;
  deleted: boolean;
  integrity_hash: string;
}>;

export type PatternReplayValidation = Readonly<{
  validation_id: string;
  state: PatternReplayValidationState;
  certified: boolean;
  failures: readonly PatternReplayFailure[];
  ledger_input_accepted: boolean;
  replay_references_complete: boolean;
  evidence_available: boolean;
  recurrence_reconstructed: boolean;
  scoring_reconstructed: boolean;
  governance_reconstructed: boolean;
  timeline_ordering_valid: boolean;
  integrity_verified: boolean;
  replay_divergence_absent: boolean;
  tenant_isolated: boolean;
  explanations_complete: boolean;
  registry_immutable: boolean;
  advisory_only: boolean;
  no_historical_mutation: boolean;
  no_autonomous_learning: boolean;
  integrity_hash: string;
}>;

export type PatternReplayApiSurface = Readonly<{
  api_id: string;
  replay_pattern: "POST /pattern-replay-explainability/replay";
  generate_explanation: "POST /pattern-replay-explainability/explain";
  retrieve_timeline: "POST /pattern-replay-explainability/timeline";
  navigate_evidence: "POST /pattern-replay-explainability/evidence";
  verify_replay: "POST /pattern-replay-explainability/verify";
  compare_replay: "POST /pattern-replay-explainability/compare";
  retrieve_registry: "POST /pattern-replay-explainability/registry";
  retrieve_contract: "GET /pattern-replay-explainability/contract";
  update_supported: false;
  delete_supported: false;
  historical_mutation_supported: false;
  autonomous_learning_supported: false;
  integrity_hash: string;
}>;

export type PatternReplayInput = Readonly<{
  ledger_result?: PatternLedgerResult;
  scenario?: PatternReplayScenario;
}>;

export type PatternReplayResult = Readonly<{
  pattern_replay_explainability_version: "pattern-replay-explainability/v1";
  ledger_result: PatternLedgerResult;
  api_surface: PatternReplayApiSurface;
  replay_records: readonly PatternReplayRecord[];
  explainability_artifacts: readonly PatternExplainabilityArtifact[];
  timeline_events: readonly PatternTimelineEvent[];
  evidence_navigation_maps: readonly PatternEvidenceNavigationMap[];
  comparisons: readonly PatternReplayComparison[];
  registry: PatternExplainabilityRegistry;
  validation: PatternReplayValidation;
  deterministic: true;
  replayable: true;
  explainable: true;
  evidence_based: true;
  governance_first: true;
  tenant_isolated: true;
  advisory_only: true;
  immutable: true;
  mutates_history: false;
  mutates_patterns: false;
  autonomous_learning: false;
  replay_hash: string;
  integrity_hash: string;
}>;

export type PatternReplayFoundation = Readonly<{
  pattern_replay_explainability_version: "pattern-replay-explainability/v1";
  api_surface: PatternReplayApiSurface;
  result: PatternReplayResult;
}>;
