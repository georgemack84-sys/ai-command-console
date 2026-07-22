import type {
  ConflictCategory,
  ConflictDetectionRule,
  ConflictFailureReason,
  ConflictRecord,
  ConflictValidationResult,
} from "@/types/decision-conflict-detection-contract";

export type ConflictDetectionCandidateStatus = "VALIDATED" | "REJECTED" | "ARCHIVED";

export type ConflictDetectionCandidate = Readonly<{
  candidate_id: string;
  tenant_id: string;
  mission_id: string;
  status: ConflictDetectionCandidateStatus;
  decision_priority: number;
  proposed_action: string;
  expected_outcome: string;
  execution_path: string;
  governance_refs: readonly string[];
  policy_refs: readonly string[];
  constitutional_refs: readonly string[];
  authority_refs: readonly string[];
  evidence_refs: readonly string[];
  evidence_assertions: readonly string[];
  risk_refs: readonly string[];
  confidence_score: number;
  recovery_strategy: string;
  timing_window: string;
  forecast_outcome: string;
  mission_objective: string;
  certification_refs: readonly string[];
  certification_blockers: readonly string[];
  replay_refs: readonly string[];
}>;

export type CandidateComparisonPair = Readonly<{
  pair_id: string;
  tenant_id: string;
  mission_id: string;
  left_candidate_id: string;
  right_candidate_id: string;
  comparison_order: number;
  integrity_hash: string;
}>;

export type ConflictDetectionRuleId =
  | "duplicate_recommendation_rule"
  | "incompatible_action_rule"
  | "policy_contradiction_rule"
  | "conflicting_evidence_rule"
  | "authority_overlap_rule"
  | "recovery_conflict_rule"
  | "timing_collision_rule"
  | "forecast_divergence_rule"
  | "mission_objective_rule"
  | "certification_blocker_rule";

export type ConflictDetectionSignal = Readonly<{
  pair_id: string;
  rule_id: ConflictDetectionRuleId;
  conflict_category: ConflictCategory;
  detection_reason: string;
  candidate_refs: readonly string[];
  evidence_refs: readonly string[];
  governance_refs: readonly string[];
  constitutional_refs: readonly string[];
  authority_refs: readonly string[];
  policy_refs: readonly string[];
  risk_refs: readonly string[];
  confidence_refs: readonly string[];
  forecast_refs: readonly string[];
  resource_refs: readonly string[];
  recovery_refs: readonly string[];
  certification_refs: readonly string[];
  replay_ref: string;
  lineage_ref: string;
  integrity_hash: string;
}>;

export type ConflictDetectionLedgerRecord = Readonly<{
  detection_id: string;
  conflict_id: string;
  tenant_id: string;
  mission_id: string;
  candidate_refs: readonly string[];
  comparison_pair: string;
  conflict_category: ConflictCategory;
  detection_rule: ConflictDetectionRuleId;
  evidence_refs: readonly string[];
  governance_refs: readonly string[];
  constitutional_refs: readonly string[];
  authority_refs: readonly string[];
  replay_ref: string;
  detection_timestamp: string;
  integrity_hash: string;
}>;

export type ConflictDetectionEngineInput = Readonly<{
  candidates?: readonly ConflictDetectionCandidate[];
  tenant_id?: string;
  mission_id?: string;
  authorized_component?: string;
  replay_expected_hash?: string;
}>;

export type ConflictDetectionEngineFailureReason =
  | ConflictFailureReason
  | "NO_CANDIDATES"
  | "DUPLICATE_CANDIDATE_IDENTIFIER"
  | "CANDIDATE_SCHEMA_INVALID"
  | "CROSS_TENANT_CANDIDATE"
  | "CROSS_MISSION_CANDIDATE"
  | "UNAUTHORIZED_COMPONENT"
  | "INVALID_COMPARISON_ORDERING"
  | "LEDGER_WRITE_FAILED"
  | "ENGINE_REPLAY_MISMATCH";

export type ConflictDetectionEngineResult = Readonly<{
  detection_status: "PASS" | "FAIL";
  fail_closed: boolean;
  candidates_scanned: readonly ConflictDetectionCandidate[];
  comparison_pairs: readonly CandidateComparisonPair[];
  signals: readonly ConflictDetectionSignal[];
  conflicts: readonly ConflictRecord[];
  validations: readonly ConflictValidationResult[];
  ledger_records: readonly ConflictDetectionLedgerRecord[];
  duplicate_conflict_refs: readonly string[];
  replay_hash: string;
  failures: readonly ConflictDetectionEngineFailureReason[];
  advisory_only: true;
  deterministic: true;
  integrity_hash: string;
}>;

export type ConflictDetectionEngineReplay = Readonly<{
  replay_id: string;
  replay_valid: boolean;
  candidate_order: readonly string[];
  comparison_pair_refs: readonly string[];
  signal_refs: readonly string[];
  conflict_refs: readonly string[];
  ledger_refs: readonly string[];
  expected_replay_hash: string;
  reconstructed_replay_hash: string;
  failures: readonly ConflictDetectionEngineFailureReason[];
  integrity_hash: string;
}>;

export type ConflictDetectionEngineObservability = Readonly<{
  candidates_scanned: number;
  candidate_pairs_generated: number;
  comparisons_completed: number;
  conflicts_detected: number;
  conflicts_by_category: Readonly<Record<ConflictCategory, number>>;
  duplicate_recommendation_rate: number;
  authority_conflict_rate: number;
  evidence_conflict_rate: number;
  policy_contradiction_rate: number;
  replay_success_rate: number;
  validation_failures: number;
  integrity_failures: number;
}>;

export type ConflictDetectionEngineFoundation = Readonly<{
  engine_version: "conflict-detection-engine/v1";
  rules: readonly ConflictDetectionRule[];
  result: ConflictDetectionEngineResult;
  replay: ConflictDetectionEngineReplay;
  observability: ConflictDetectionEngineObservability;
}>;
