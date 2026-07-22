import type { AdaptiveMemorySecurityResult } from "@/types/adaptive-memory-security-integrity";

export type AdaptiveMemoryLedgerStatus = "AUTHORITATIVE" | "REJECTED";

export type LedgerEventType =
  | "MEMORY_CREATION"
  | "MEMORY_QUALIFICATION"
  | "MEMORY_VALIDATION"
  | "MEMORY_INDEXING"
  | "MEMORY_RETRIEVAL"
  | "MEMORY_REUSE"
  | "GOVERNANCE_REVIEW"
  | "REPLAY_EXECUTION"
  | "SUPERSESSION"
  | "EXPIRATION"
  | "ARCHIVAL"
  | "RESTORATION"
  | "CERTIFICATION"
  | "SECURITY_EVENT"
  | "INTEGRITY_VERIFICATION";

export type LedgerFailure =
  | "SECURITY_FRAMEWORK_UNAVAILABLE"
  | "LEDGER_ENTRY_MODIFIED"
  | "LEDGER_ENTRY_DELETED"
  | "APPEND_ONLY_VIOLATED"
  | "HASH_CHAIN_BROKEN"
  | "LINEAGE_INCOMPLETE"
  | "REPLAY_UNAVAILABLE"
  | "GOVERNANCE_HISTORY_MISSING"
  | "EVENT_ORDERING_INCONSISTENT"
  | "INTEGRITY_VERIFICATION_FAILED"
  | "TENANT_ISOLATION_VIOLATED";

export type LedgerScenario =
  | "BASELINE"
  | "SECURITY_FRAMEWORK_UNAVAILABLE"
  | "ENTRY_MODIFIED"
  | "ENTRY_DELETED"
  | "APPEND_ONLY_VIOLATION"
  | "HASH_CHAIN_BREAK"
  | "INCOMPLETE_LINEAGE"
  | "REPLAY_UNAVAILABLE"
  | "MISSING_GOVERNANCE"
  | "ORDERING_INCONSISTENCY"
  | "INTEGRITY_FAILURE"
  | "TENANT_ISOLATION_BREACH";

export type AdaptiveMemoryLedgerRecord = Readonly<{
  ledger_entry_id: string;
  memory_id: string;
  tenant_id: string;
  mission_id: string;
  event_type: LedgerEventType;
  lifecycle_state: string;
  event_timestamp: string;
  actor: "AdaptiveMemoryLedger";
  evidence_refs: readonly string[];
  governance_refs: readonly string[];
  replay_refs: readonly string[];
  lineage_refs: readonly string[];
  certification_refs: readonly string[];
  previous_hash: string;
  current_hash: string;
  append_only: boolean;
  deleted: boolean;
  immutable: boolean;
  replayable: boolean;
  tenant_isolated: boolean;
  cryptographically_verified: boolean;
  integrity_hash: string;
}>;

export type LedgerLineageRecord = Readonly<{
  lineage_id: string;
  memory_id: string;
  tenant_id: string;
  originating_mission: string;
  dependency_refs: readonly string[];
  replay_refs: readonly string[];
  governance_refs: readonly string[];
  lifecycle_refs: readonly string[];
  security_refs: readonly string[];
  complete: boolean;
  integrity_hash: string;
}>;

export type LedgerAuditReport = Readonly<{
  audit_id: string;
  forensic_reconstruction_supported: boolean;
  governance_audit_supported: boolean;
  constitutional_audit_supported: boolean;
  replay_audit_supported: boolean;
  certification_audit_supported: boolean;
  lineage_audit_supported: boolean;
  integrity_audit_supported: boolean;
  lifecycle_audit_supported: boolean;
  integrity_hash: string;
}>;

export type LedgerIntegrityValidation = Readonly<{
  validation_id: string;
  ledger_hashes_valid: boolean;
  chain_integrity_valid: boolean;
  event_ordering_valid: boolean;
  lineage_consistent: boolean;
  replay_consistent: boolean;
  write_consistent: boolean;
  cryptographic_verification_valid: boolean;
  failures: readonly LedgerFailure[];
  integrity_hash: string;
}>;

export type AdaptiveMemoryLedgerContract = Readonly<{
  contract_id: "adaptive-memory-ledger-contract";
  version: "adaptive-memory-ledger/v1";
  architecture: readonly string[];
  event_types: readonly LedgerEventType[];
  write_rules: readonly string[];
  chain_validation_rules: readonly string[];
  replay_requirements: readonly string[];
  security_requirements: readonly string[];
  audit_capabilities: readonly string[];
  ledger_guarantees: readonly string[];
  every_memory_event_permanent: true;
  append_only_history: true;
  replay_before_trust: true;
  complete_lineage: true;
  governance_transparency: true;
  deterministic_ledger: true;
  mutation_supported: false;
  deletion_supported: false;
  integrity_hash: string;
}>;

export type AdaptiveMemoryLedgerMetrics = Readonly<{
  ledger_writes: number;
  ledger_latency_ms: number;
  replay_requests: number;
  replay_success: number;
  integrity_verification_rate: number;
  chain_validation_failures: number;
  lineage_completeness: number;
  governance_events: number;
  lifecycle_events: number;
  security_events: number;
  failures: readonly LedgerFailure[];
  integrity_hash: string;
}>;

export type AdaptiveMemoryLedgerApiSurface = Readonly<{
  api_id: string;
  establish_ledger: "POST /adaptive-memory-ledger/establish";
  retrieve_contract: "GET /adaptive-memory-ledger/contract";
  retrieve_records: "POST /adaptive-memory-ledger/records";
  retrieve_lineage: "POST /adaptive-memory-ledger/lineage";
  retrieve_audit: "POST /adaptive-memory-ledger/audit";
  retrieve_integrity: "POST /adaptive-memory-ledger/integrity";
  retrieve_metrics: "POST /adaptive-memory-ledger/metrics";
  replay_ledger: "POST /adaptive-memory-ledger/replay";
  inspect_ledger: "POST /adaptive-memory-ledger/inspect";
  mutation_supported: false;
  deletion_supported: false;
  non_append_writes_supported: false;
  integrity_hash: string;
}>;

export type AdaptiveMemoryLedgerInput = Readonly<{
  scenario?: LedgerScenario;
  security_result?: AdaptiveMemorySecurityResult;
}>;

export type AdaptiveMemoryLedgerResult = Readonly<{
  adaptive_memory_ledger_version: "adaptive-memory-ledger/v1";
  ledger_identifier: "AdaptiveMemoryLedger";
  status: AdaptiveMemoryLedgerStatus;
  api_surface: AdaptiveMemoryLedgerApiSurface;
  security_result: AdaptiveMemorySecurityResult;
  contract: AdaptiveMemoryLedgerContract;
  ledger_records: readonly AdaptiveMemoryLedgerRecord[];
  lineage_records: readonly LedgerLineageRecord[];
  audit_report: LedgerAuditReport;
  integrity_validation: LedgerIntegrityValidation;
  metrics: AdaptiveMemoryLedgerMetrics;
  failures: readonly LedgerFailure[];
  deterministic: boolean;
  replayable: boolean;
  append_only: boolean;
  immutable: boolean;
  hash_chain_valid: boolean;
  lineage_complete: boolean;
  governance_history_preserved: boolean;
  tenant_isolation_enforced: boolean;
  replay_hash: string;
  integrity_hash: string;
}>;

export type AdaptiveMemoryLedgerSystem = Readonly<{
  adaptive_memory_ledger_version: "adaptive-memory-ledger/v1";
  supported_event_types: readonly LedgerEventType[];
  api_surface: AdaptiveMemoryLedgerApiSurface;
  result: AdaptiveMemoryLedgerResult;
}>;
