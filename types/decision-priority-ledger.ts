import type { DecisionPriorityFactorName, DecisionPriorityState } from "@/types/decision-priority-contract";
import type { PriorityExplanationEngineResult } from "@/types/decision-priority-explanation-engine";

export type PriorityLedgerFailureReason =
  | "PRIORITY_SCORE_MISSING"
  | "RANKING_INFORMATION_INCOMPLETE"
  | "EVIDENCE_REFERENCES_MISSING"
  | "GOVERNANCE_REFERENCES_MISSING"
  | "EXPLANATION_REFERENCE_MISSING"
  | "REPLAY_REFERENCES_MISSING"
  | "INTEGRITY_VERIFICATION_FAILED"
  | "CANONICAL_ORDERING_FAILED"
  | "CROSS_TENANT_REFERENCE_DETECTED"
  | "DUPLICATE_LEDGER_SEQUENCE"
  | "LEDGER_REPLAY_MISMATCH"
  | "LEDGER_MUTATION_DETECTED"
  | "LEDGER_DELETION_DETECTED";

export type PriorityLedgerWriteInput = Readonly<{
  explanation_result?: PriorityExplanationEngineResult;
  existing_records?: readonly PriorityLedgerRecord[];
  canonical_ordering_reproducible?: boolean;
  attempted_mutation_refs?: readonly string[];
  attempted_deletion_refs?: readonly string[];
  expected_replay_hash?: string;
}>;

export type PriorityLedgerRecord = Readonly<{
  ledger_record_id: string;
  tenant_id: string;
  mission_id: string;
  decision_candidate_id: string;
  overall_priority_score: number;
  priority_state: DecisionPriorityState;
  ranking_order: number | null;
  factor_score_refs: readonly string[];
  evidence_refs: readonly string[];
  governance_refs: readonly string[];
  explanation_ref: string;
  replay_refs: readonly string[];
  scoring_profile_ref: string;
  recorded_timestamp: string;
  ledger_sequence_number: number;
  integrity_hash: string;
}>;

export type PriorityHistoryRecord = Readonly<{
  history_id: string;
  decision_candidate_id: string;
  previous_priority_state: DecisionPriorityState | null;
  current_priority_state: DecisionPriorityState;
  previous_score: number | null;
  current_score: number;
  previous_ranking: number | null;
  current_ranking: number | null;
  change_reason: string;
  replay_refs: readonly string[];
  recorded_timestamp: string;
  integrity_hash: string;
}>;

export type PriorityReplayIndex = Readonly<{
  replay_index_id: string;
  decision_candidate_id: string;
  priority_record_refs: readonly string[];
  explanation_refs: readonly string[];
  governance_refs: readonly string[];
  evidence_refs: readonly string[];
  replay_sequence: readonly number[];
  reconstruction_hash: string;
  integrity_hash: string;
}>;

export type PriorityRankingTimelineRecord = Readonly<{
  timeline_id: string;
  tenant_id: string;
  mission_id: string;
  ordered_record_refs: readonly string[];
  active_ranking_order: readonly string[];
  blocked_record_refs: readonly string[];
  rejected_record_refs: readonly string[];
  sequence_valid: boolean;
  recorded_timestamp: string;
  integrity_hash: string;
}>;

export type PriorityLedgerMetadataRecord = Readonly<{
  metadata_id: string;
  ledger_version: "priority-ledger/v1";
  schema_version: "priority-ledger-schema/v1";
  serialization_version: "canonical-json/v1";
  hash_algorithm: "decision-integrity-hash/v1";
  replay_algorithm: "priority-ledger-replay/v1";
  migration_history: readonly string[];
  certification_history: readonly string[];
  integrity_hash: string;
}>;

export type PriorityAuditReport = Readonly<{
  audit_report_id: string;
  tenant_id: string;
  mission_id: string;
  priority_record_refs: readonly string[];
  ranking_history_refs: readonly string[];
  governance_refs: readonly string[];
  evidence_refs: readonly string[];
  replay_refs: readonly string[];
  audit_summary: string;
  integrity_hash: string;
}>;

export type PriorityLedgerReplayRecord = Readonly<{
  replay_id: string;
  expected_hash: string;
  reconstructed_hash: string;
  replay_valid: boolean;
  ledger_sequence: readonly number[];
  failures: readonly PriorityLedgerFailureReason[];
  integrity_hash: string;
}>;

export type PriorityLedgerResult = Readonly<{
  ledger_status: "PASS" | "FAIL";
  certificationStatus: "PASS" | "FAIL";
  failures: readonly PriorityLedgerFailureReason[];
  ledger_records: readonly PriorityLedgerRecord[];
  history_records: readonly PriorityHistoryRecord[];
  replay_indexes: readonly PriorityReplayIndex[];
  ranking_timeline: PriorityRankingTimelineRecord;
  metadata_record: PriorityLedgerMetadataRecord;
  audit_report: PriorityAuditReport;
  replay_record: PriorityLedgerReplayRecord;
  deterministic: true;
  advisoryOnly: true;
  appendOnly: true;
  immutable: true;
  failClosed: true;
  replay_hash: string;
  integrity_hash: string;
}>;

export type PriorityLedgerObservability = Readonly<{
  evaluations: number;
  pass_count: number;
  fail_count: number;
  ledger_records_written: number;
  replay_failures: number;
  integrity_failures: number;
  tenant_failures: number;
  duplicate_sequence_failures: number;
  state_distribution: Readonly<Record<DecisionPriorityState, number>>;
  factor_ref_distribution: Readonly<Record<DecisionPriorityFactorName, number>>;
}>;
