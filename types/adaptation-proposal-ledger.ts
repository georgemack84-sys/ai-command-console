import type { ProposalLineageReplayResult, ProposalLineageRecord } from "@/types/proposal-lineage-replay-binder";

export type AdaptationProposalLedgerEventType =
  | "PROPOSAL_CREATED"
  | "PROPOSAL_VALIDATED"
  | "PROPOSAL_SCORED"
  | "PROPOSAL_PRIORITIZED"
  | "PROPOSAL_SUPPRESSED"
  | "PROPOSAL_CONSOLIDATED"
  | "SIMULATION_ROUTED"
  | "GOVERNANCE_REVIEWED"
  | "OPERATOR_REVIEWED"
  | "CERTIFICATION_ROUTED"
  | "APPROVAL_RECORDED"
  | "REJECTION_RECORDED"
  | "ROLLBACK_PLANNED"
  | "ARCHIVED";

export type AdaptationProposalLedgerState = "COMMITTED" | "FAIL_CLOSED";

export type AdaptationProposalLedgerFailure =
  | "PROPOSAL_VALIDATION_FAILED"
  | "INTEGRITY_VERIFICATION_FAILED"
  | "HASH_VERIFICATION_FAILED"
  | "SEQUENCE_CONTINUITY_BROKEN"
  | "REPLAY_REFERENCES_INCOMPLETE"
  | "LINEAGE_REFERENCES_MISSING"
  | "DUPLICATE_EVENT_IDENTIFIER"
  | "DETERMINISTIC_ORDERING_NOT_GUARANTEED"
  | "TENANT_ISOLATION_VIOLATED"
  | "EVENT_AUTHENTICITY_FAILED"
  | "PROPOSAL_CONTENT_MUTATION_ATTEMPT"
  | "HISTORY_REWRITE_ATTEMPT"
  | "HISTORICAL_ENTRY_REMOVAL_ATTEMPT"
  | "INTEGRITY_BYPASS_ATTEMPT"
  | "REPLAY_RECORDING_BYPASS_ATTEMPT"
  | "GOVERNANCE_HISTORY_BYPASS_ATTEMPT"
  | "CERTIFICATION_HISTORY_BYPASS_ATTEMPT"
  | "CROSS_TENANT_RECORD_ATTEMPT"
  | "IMPLEMENTATION_AUTHORIZATION_ATTEMPT";

export type AdaptationProposalLedgerScenario =
  | "BASELINE"
  | "DUPLICATE_CONSOLIDATION"
  | "OVERLAPPING_CONSOLIDATION"
  | "CONFLICTING_RELATIONSHIP"
  | "PROPOSAL_VALIDATION_FAILURE"
  | "INTEGRITY_FAILURE"
  | "HASH_FAILURE"
  | "SEQUENCE_BREAK"
  | "MISSING_REPLAY"
  | "MISSING_LINEAGE"
  | "DUPLICATE_EVENT"
  | "NONDETERMINISTIC_ORDERING"
  | "TENANT_VIOLATION"
  | "EVENT_AUTHENTICITY_FAILURE"
  | "PROPOSAL_MUTATION_ATTEMPT"
  | "HISTORY_REWRITE_ATTEMPT"
  | "ENTRY_REMOVAL_ATTEMPT"
  | "INTEGRITY_BYPASS"
  | "REPLAY_BYPASS"
  | "GOVERNANCE_BYPASS"
  | "CERTIFICATION_BYPASS"
  | "CROSS_TENANT_RECORD"
  | "IMPLEMENTATION_ATTEMPT";

export type AdaptationProposalLedgerEntry = Readonly<{
  ledger_entry_id: string;
  proposal_id: string;
  tenant_id: "tenant_current";
  event_type: AdaptationProposalLedgerEventType;
  event_timestamp: string;
  event_sequence_number: number;
  originating_component: string;
  referenced_proposal_version: string;
  replay_reference: string;
  lineage_reference: string;
  lifecycle_state: string;
  proposal_integrity_hash: string;
  lineage_integrity_hash: string;
  previous_ledger_hash: string;
  ledger_version: "adaptation-proposal-ledger/v1";
  immutable: true;
  append_only: true;
  entry_hash: string;
  integrity_hash: string;
}>;

export type AdaptationProposalLedgerQueryIndex = Readonly<{
  proposal_ids: readonly string[];
  tenant_ids: readonly string[];
  event_types: readonly AdaptationProposalLedgerEventType[];
  lifecycle_states: readonly string[];
  proposal_versions: readonly string[];
  governance_decisions: readonly string[];
  certification_statuses: readonly string[];
  simulation_identifiers: readonly string[];
  replay_identifiers: readonly string[];
  lineage_identifiers: readonly string[];
  time_range: Readonly<{ start: string; end: string }>;
  tenant_isolated: true;
  deterministic: true;
  integrity_hash: string;
}>;

export type AdaptationProposalLedgerMetrics = Readonly<{
  ledger_entries_committed: number;
  proposal_lifecycle_events: Readonly<Record<AdaptationProposalLedgerEventType, number>>;
  hash_verification_success: boolean;
  replay_reconstruction_success: boolean;
  lineage_completeness: boolean;
  append_latency_ms: number;
  sequence_validation_failures: number;
  integrity_violations: number;
  archival_events: number;
  tenant_isolation_violations: number;
  deterministic_replay_success: boolean;
  validation_failures: readonly AdaptationProposalLedgerFailure[];
  integrity_hash: string;
}>;

export type AdaptationProposalLedgerApiSurface = Readonly<{
  api_id: string;
  commit_ledger: "POST /adaptation-proposal-ledger/commit";
  retrieve_entries: "POST /adaptation-proposal-ledger/entries";
  query_ledger: "POST /adaptation-proposal-ledger/query";
  retrieve_metrics: "POST /adaptation-proposal-ledger/metrics";
  replay_ledger: "POST /adaptation-proposal-ledger/replay";
  inspect_ledger: "POST /adaptation-proposal-ledger/inspect";
  retrieve_contract: "GET /adaptation-proposal-ledger/contract";
  proposal_mutation_supported: false;
  history_rewrite_supported: false;
  entry_deletion_supported: false;
  implementation_authorization_supported: false;
  advisory_only: true;
  fail_open_supported: false;
  integrity_hash: string;
}>;

export type AdaptationProposalLedgerInput = Readonly<{
  scenario?: AdaptationProposalLedgerScenario;
  lineage_result?: ProposalLineageReplayResult;
}>;

export type AdaptationProposalLedgerResult = Readonly<{
  adaptation_proposal_ledger_version: "adaptation-proposal-ledger/v1";
  ledger_rule_version: "adaptation-proposal-ledger-rules/v1";
  api_surface: AdaptationProposalLedgerApiSurface;
  lineage_result: ProposalLineageReplayResult;
  ledger_entries: readonly AdaptationProposalLedgerEntry[];
  query_index: AdaptationProposalLedgerQueryIndex;
  metrics: AdaptationProposalLedgerMetrics;
  ledger_state: AdaptationProposalLedgerState;
  failures: readonly AdaptationProposalLedgerFailure[];
  deterministic: true;
  replayable: boolean;
  hash_chain_valid: boolean;
  append_only: boolean;
  immutable_storage_verified: boolean;
  tenant_isolated: boolean;
  advisory_only: true;
  modifies_proposals: false;
  rewrites_history: false;
  removes_historical_entries: false;
  authorizes_implementation: false;
  changes_production_behavior: false;
  replay_hash: string;
  integrity_hash: string;
}>;

export type AdaptationProposalLedgerFoundation = Readonly<{
  adaptation_proposal_ledger_version: "adaptation-proposal-ledger/v1";
  supported_event_types: readonly AdaptationProposalLedgerEventType[];
  api_surface: AdaptationProposalLedgerApiSurface;
  result: AdaptationProposalLedgerResult;
}>;

export type LedgerBindableLineageRecord = ProposalLineageRecord;
