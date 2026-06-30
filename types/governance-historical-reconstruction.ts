import type { GovernanceQueryContract, GovernanceQueryValidationIssue, GovernanceQueryValidationResult } from "@/types/governance-query-contract";
import type { GovernanceSearchDomain, GovernanceSearchRecord, GovernanceSearchResponse } from "@/types/governance-search-engine";

export type GovernanceHistoricalReconstructionErrorState =
  | "TIMESTAMP_NOT_FOUND"
  | "LEDGER_RECORDS_INCOMPLETE"
  | "POLICY_HISTORY_INCOMPLETE"
  | "REPLAY_HASH_MISMATCH"
  | "RECONSTRUCTION_HASH_MISMATCH"
  | "LINEAGE_INCONSISTENT"
  | "VERSION_INCOMPATIBLE"
  | "TENANT_ISOLATION_VIOLATION"
  | "CONSTITUTIONAL_VIOLATION";

export type GovernanceHistoricalReconstructionState =
  | "SNAPSHOT_RECONSTRUCTED"
  | GovernanceHistoricalReconstructionErrorState;

export type GovernanceHistoricalReconstructionScenario =
  | "BASELINE"
  | "TIMESTAMP_NOT_FOUND"
  | "LEDGER_RECORDS_INCOMPLETE"
  | "POLICY_HISTORY_INCOMPLETE"
  | "REPLAY_HASH_MISMATCH"
  | "RECONSTRUCTION_HASH_MISMATCH"
  | "LINEAGE_INCONSISTENT"
  | "VERSION_INCOMPATIBLE"
  | "TENANT_ISOLATION_VIOLATION"
  | "CONSTITUTIONAL_VIOLATION";

export type GovernanceHistoricalLedgerVersion = "governance-ledger/v7J.3";

export type GovernanceHistoricalLedgerRecord = GovernanceSearchRecord & Readonly<{
  valid_from: string;
  valid_to: string | null;
  ledger_version: GovernanceHistoricalLedgerVersion;
  checkpoint_id: string;
  historical_event_type: "CREATED" | "UPDATED" | "SUPERSEDED" | "CERTIFIED";
}>;

export type GovernanceHistoricalTimelineEvent = Readonly<{
  event_id: string;
  timestamp: string;
  ledger_sequence: number;
  domain: GovernanceSearchDomain;
  immutable_identifier: string;
  event_type: GovernanceHistoricalLedgerRecord["historical_event_type"];
  parent_refs: readonly string[];
  child_refs: readonly string[];
  event_hash: string;
}>;

export type GovernanceHistoricalSnapshotSection = Readonly<{
  domain: GovernanceSearchDomain;
  records: readonly GovernanceHistoricalLedgerRecord[];
  record_count: number;
  section_hash: string;
}>;

export type HistoricalGovernanceSnapshot = Readonly<{
  snapshot_id: string;
  tenant_id: string;
  mission_id: string;
  historical_timestamp: string;
  governance_state: "ACTIVE" | "DEGRADED" | "BLOCKED";
  active_policies: GovernanceHistoricalSnapshotSection;
  recommendations: GovernanceHistoricalSnapshotSection;
  risks: GovernanceHistoricalSnapshotSection;
  compliance: GovernanceHistoricalSnapshotSection;
  escalations: GovernanceHistoricalSnapshotSection;
  authority_assignments: GovernanceHistoricalSnapshotSection;
  evidence: GovernanceHistoricalSnapshotSection;
  lineage: GovernanceHistoricalSnapshotSection;
  replay_reference: string;
  reconstruction_hash: string;
  snapshot_version: "historical-governance-snapshot/v7J.3";
}>;

export type GovernanceHistoricalReplayValidation = Readonly<{
  replay_id: string;
  replay_hash: string;
  expected_reconstruction_hash: string;
  actual_reconstruction_hash: string;
  ledger_integrity_verified: boolean;
  snapshot_consistent: boolean;
  object_version_compatible: boolean;
  replay_valid: boolean;
  validation_hash: string;
}>;

export type GovernanceHistoricalReconstructionInput = Readonly<{
  scenario?: GovernanceHistoricalReconstructionScenario;
  query_contract?: GovernanceQueryContract;
  historical_timestamp?: string;
  expected_reconstruction_hash?: string;
  ledger_records?: readonly GovernanceHistoricalLedgerRecord[];
}>;

export type GovernanceHistoricalReconstructionResponse = Readonly<{
  phase_version: "7J.3";
  schema_version: "governance-historical-reconstruction/v7J.3";
  reconstruction_id: string;
  tenant_id: string;
  mission_id: string;
  historical_timestamp: string | null;
  reconstruction_state: GovernanceHistoricalReconstructionState;
  query_validation: GovernanceQueryValidationResult;
  search_response: GovernanceSearchResponse;
  ledger_records: readonly GovernanceHistoricalLedgerRecord[];
  timeline: readonly GovernanceHistoricalTimelineEvent[];
  snapshot: HistoricalGovernanceSnapshot | null;
  replay_validation: GovernanceHistoricalReplayValidation | null;
  failures: readonly GovernanceQueryValidationIssue[];
  reconstruction_hash: string | null;
  read_only: true;
  advisory_only_notice: "Historical governance reconstruction is deterministic, immutable, read-only, replay-verifiable, and audit-backed.";
}>;

export type GovernanceHistoricalReconstructionObservabilitySurface = Readonly<{
  reconstruction_id: string;
  reconstruction_state: GovernanceHistoricalReconstructionState;
  historical_timestamp: string | null;
  ledger_record_count: number;
  timeline_event_count: number;
  replay_valid: boolean;
  errors: readonly GovernanceHistoricalReconstructionErrorState[];
  reconstruction_hash: string | null;
}>;
