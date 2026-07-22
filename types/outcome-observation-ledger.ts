import type { VisibilityRole } from "@/types/decision-observability-contract";
import type { GovernanceOperatorOutcomeRecorderResult } from "@/types/governance-operator-outcome-recorder";

export type OutcomeLedgerLifecycleState = "VALIDATED" | "HASHED" | "APPENDED" | "INDEXED" | "REPLAYABLE";

export type OutcomeLedgerOperation = "APPEND" | "READ" | "QUERY" | "VERIFY";

export type OutcomeLedgerQueryDomain = "TENANT" | "MISSION" | "DECISION" | "OUTCOME" | "OPERATOR" | "GOVERNANCE" | "REPLAY" | "EVIDENCE";

export type OutcomeLedgerCheck =
  | "SOURCE_VALIDATION"
  | "APPEND_ONLY_STORAGE"
  | "IMMUTABLE_RECORDS"
  | "HASH_GENERATION"
  | "CHAIN_VALIDATION"
  | "REPLAY_INDEX"
  | "REPLAY_RECONSTRUCTION"
  | "GOVERNANCE_LINEAGE"
  | "REPLAY_REFERENCES"
  | "TENANT_ISOLATION"
  | "QUERY_PURITY"
  | "HISTORICAL_COMPATIBILITY"
  | "INTEGRITY_VALIDATION";

export type OutcomeLedgerFailure =
  | "SOURCE_RECORD_NOT_VALIDATED"
  | "LEDGER_PERMITS_RECORD_MODIFICATION"
  | "LEDGER_PERMITS_RECORD_DELETION"
  | "APPEND_ONLY_BEHAVIOR_VIOLATED"
  | "INTEGRITY_HASH_NOT_REPRODUCIBLE"
  | "HASH_CHAIN_BROKEN"
  | "REPLAY_RECONSTRUCTION_DIFFERS"
  | "GOVERNANCE_REFERENCES_MISSING"
  | "REPLAY_REFERENCES_MISSING"
  | "DUPLICATE_LEDGER_SEQUENCE_ACCEPTED"
  | "LEDGER_ORDERING_NONDETERMINISTIC"
  | "UNAUTHORIZED_TENANT_ACCESS_PERMITTED"
  | "INTEGRITY_VERIFICATION_BYPASSED"
  | "INFERRED_OBSERVATION_ACCEPTED"
  | "QUERY_MUTATED_LEDGER_STATE"
  | "HISTORICAL_REPLAY_COMPATIBILITY_BROKEN"
  | "AUTHORIZATION_FAILURE"
  | "FAIL_OPEN_LEDGER_BEHAVIOR";

export type OutcomeLedgerRecord = Readonly<{
  ledger_record_id: string;
  tenant_id: string;
  mission_id: string;
  outcome_id: string;
  decision_id: string;
  observation_timestamp: string;
  observation_refs: readonly string[];
  evidence_refs: readonly string[];
  mission_impact_refs: readonly string[];
  governance_outcome_refs: readonly string[];
  operator_action_refs: readonly string[];
  replay_refs: readonly string[];
  previous_record_hash: string;
  ledger_sequence: number;
  committed_timestamp: string;
  schema_version: "outcome-observation-ledger/v1";
  append_only: true;
  deleted: false;
  integrity_hash: string;
}>;

export type OutcomeLedgerReplayIndex = Readonly<{
  replay_index_id: string;
  by_tenant: readonly string[];
  by_mission: readonly string[];
  by_decision: readonly string[];
  by_outcome: readonly string[];
  by_governance_event: readonly string[];
  by_operator_action: readonly string[];
  by_replay_sequence: readonly string[];
  by_evidence: readonly string[];
  reconstruction_order: readonly string[];
  reconstruction_hash: string;
  integrity_hash: string;
}>;

export type OutcomeLedgerApiSurface = Readonly<{
  api_id: string;
  supported_operations: readonly OutcomeLedgerOperation[];
  unsupported_operations: readonly ("UPDATE" | "DELETE")[];
  append_supported: true;
  read_supported: true;
  query_supported: true;
  verify_supported: true;
  update_supported: false;
  delete_supported: false;
  query_domains: readonly OutcomeLedgerQueryDomain[];
  deterministic_access: true;
  integrity_hash: string;
}>;

export type OutcomeLedgerValidation = Readonly<{
  validation_id: string;
  validation_status: "VALID" | "BLOCKED";
  source_validated: boolean;
  structural_valid: boolean;
  append_only_enforced: boolean;
  immutable_storage_enforced: boolean;
  integrity_hashes_reproducible: boolean;
  hash_chain_valid: boolean;
  replay_reconstruction_identical: boolean;
  governance_lineage_preserved: boolean;
  replay_references_complete: boolean;
  tenant_isolated: boolean;
  query_purity_preserved: boolean;
  historical_compatibility_preserved: boolean;
  integrity_verification_enforced: boolean;
  failures: readonly OutcomeLedgerFailure[];
  integrity_hash: string;
}>;

export type OutcomeLedgerReplayReport = Readonly<{
  replay_report_id: string;
  record_hashes: readonly string[];
  chain_tip_hash: string;
  replay_index_hash: string;
  ledger_reconstruction_hash: string;
  replay_reconstruction_identical: boolean;
  historical_compatibility_preserved: boolean;
  deterministic_serialization: boolean;
  integrity_hash: string;
}>;

export type OutcomeLedgerQueryResult = Readonly<{
  query_id: string;
  query_domain: OutcomeLedgerQueryDomain;
  query_ref: string;
  matched_record_ids: readonly string[];
  query_mutated_state: false;
  latency_ms: number;
  integrity_hash: string;
}>;

export type OutcomeLedgerMetrics = Readonly<{
  metrics_id: string;
  ledger_records_committed: number;
  append_operations: number;
  replay_operations: number;
  integrity_verification_success_rate: number;
  hash_chain_validation_status: "VALID" | "BROKEN";
  replay_reconstruction_success_rate: number;
  ledger_growth: number;
  tenant_isolation_violations_detected: number;
  query_latency_ms: number;
  append_latency_ms: number;
  tamper_detection_events: number;
  advisory_only: true;
  integrity_hash: string;
}>;

export type OutcomeLedgerAuditReport = Readonly<{
  report_id: string;
  tenant_id: string;
  checks: readonly OutcomeLedgerCheck[];
  outcome_ledger_operational: boolean;
  ledger_api_operational: boolean;
  hash_generator_operational: boolean;
  replay_index_operational: boolean;
  integrity_validator_operational: boolean;
  query_engine_operational: boolean;
  append_only_verified: boolean;
  update_delete_absent: boolean;
  tamper_detection_operational: boolean;
  constitutional_compliance_maintained: boolean;
  failure_analysis: readonly OutcomeLedgerFailure[];
  certification_decision: "PASS" | "FAIL";
  integrity_hash: string;
}>;

export type OutcomeObservationLedgerInput = Readonly<{
  governance_operator_recorder?: GovernanceOperatorOutcomeRecorderResult;
  role?: VisibilityRole;
  query_domain?: OutcomeLedgerQueryDomain;
  scenario?:
    | "BASELINE"
    | "RECORD_MODIFICATION"
    | "RECORD_DELETION"
    | "APPEND_ONLY_VIOLATION"
    | "HASH_MISMATCH"
    | "CHAIN_BROKEN"
    | "REPLAY_MISMATCH"
    | "MISSING_GOVERNANCE"
    | "MISSING_REPLAY"
    | "DUPLICATE_SEQUENCE"
    | "NONDETERMINISTIC_ORDERING"
    | "UNAUTHORIZED_TENANT_ACCESS"
    | "INTEGRITY_BYPASS"
    | "INFERRED_OBSERVATION"
    | "QUERY_MUTATION"
    | "HISTORICAL_COMPATIBILITY_BROKEN"
    | "INVALID_SOURCE"
    | "FAIL_OPEN";
}>;

export type OutcomeObservationLedgerResult = Readonly<{
  outcome_observation_ledger_version: "outcome-observation-ledger/v1";
  governance_operator_recorder: GovernanceOperatorOutcomeRecorderResult;
  api_surface: OutcomeLedgerApiSurface;
  ledger_records: readonly OutcomeLedgerRecord[];
  replay_index: OutcomeLedgerReplayIndex;
  query_result: OutcomeLedgerQueryResult;
  validation: OutcomeLedgerValidation;
  replay_report: OutcomeLedgerReplayReport;
  metrics: OutcomeLedgerMetrics;
  audit_report: OutcomeLedgerAuditReport;
  lifecycle: readonly OutcomeLedgerLifecycleState[];
  deterministic: true;
  replayable: true;
  historical_record_only: true;
  execution_engine: false;
  analytics_engine: false;
  update_supported: false;
  delete_supported: false;
  replay_hash: string;
  integrity_hash: string;
}>;

export type OutcomeObservationLedgerFoundation = Readonly<{
  outcome_observation_ledger_version: "outcome-observation-ledger/v1";
  checks: readonly OutcomeLedgerCheck[];
  lifecycle: readonly OutcomeLedgerLifecycleState[];
  api_surface: OutcomeLedgerApiSurface;
  result: OutcomeObservationLedgerResult;
}>;
