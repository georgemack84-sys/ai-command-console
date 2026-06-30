import type { AssuranceStateRecord, AssuranceStateScenario } from "@/types/assurance-state-manager";

export type RuntimeLedgerLifecycleStage = "CREATE_RECORD" | "VALIDATE_RECORD" | "VERIFY_GOVERNANCE" | "VERIFY_CONSTITUTION" | "VERIFY_INTEGRITY" | "GENERATE_HASH" | "APPEND_LEDGER" | "VALIDATE_REPLAY" | "PUBLISH_RECORD";
export type RuntimeLedgerEvidenceType = "RUNTIME_ASSURANCE" | "DRIFT_INTELLIGENCE" | "RECOMMENDATION" | "GOVERNANCE" | "CONSTITUTIONAL" | "REPLAY" | "INTEGRITY";
export type RuntimeLedgerChainStatus = "VALID" | "BROKEN" | "MISMATCH";
export type RuntimeLedgerScenario = "BASELINE" | "MISSING_RECORD" | "ORPHANED_LINEAGE" | "REPLAY_DIVERGENENCE" | "BROKEN_HASH_CHAIN" | "INTEGRITY_MISMATCH" | "DUPLICATE_ENTRY" | "OUT_OF_ORDER_INSERTION" | "UNAUTHORIZED_MODIFICATION" | "CROSS_TENANT_CONTAMINATION" | "EXECUTION_AUTHORITY_ATTEMPT";
export type RuntimeLedgerFailure = "LEDGER_CORRUPTION" | "MISSING_RECORD" | "ORPHANED_LINEAGE" | "REPLAY_DIVERGENCE" | "BROKEN_HASH_CHAIN" | "INTEGRITY_MISMATCH" | "DUPLICATE_ENTRY" | "OUT_OF_ORDER_INSERTION" | "UNAUTHORIZED_MODIFICATION" | "CROSS_TENANT_CONTAMINATION" | "GOVERNANCE_VALIDATION_FAILURE" | "CONSTITUTIONAL_VALIDATION_FAILURE" | "UNAUTHORIZED_EXECUTION_CAPABILITY";

export type RuntimeLedgerEntry = Readonly<{
  ledger_entry_id: string;
  assurance_id: string;
  mission_id: string;
  execution_id: string;
  tenant_id: string;
  assurance_state: string;
  confidence_score: number;
  runtime_health_score: number;
  detected_drift: readonly string[];
  detected_risks: readonly string[];
  recommendations: readonly string[];
  governance_evidence: readonly string[];
  constitutional_evidence: readonly string[];
  replay_reference: string;
  lineage_reference: string;
  integrity_hash: string;
  previous_integrity_hash: string;
  ledger_sequence: number;
  created_timestamp: string;
  record_version: "runtime-assurance-ledger/v8ALT.1G";
  append_only: true;
  immutable: boolean;
  entry_hash: string;
}>;

export type RuntimeLedgerEvidenceRecord = Readonly<{
  evidence_record_id: string;
  ledger_entry_id: string;
  evidence_type: RuntimeLedgerEvidenceType;
  source_system: string;
  description: string;
  verification_status: "VERIFIED" | "FAILED";
  governance_reference: string;
  constitutional_reference: string;
  lineage_reference: string;
  replay_reference: string;
  integrity_hash: string;
  evidence_hash: string;
}>;

export type RuntimeLedgerChainRecord = Readonly<{
  chain_id: string;
  previous_entry: string;
  current_entry: string;
  hash_algorithm: "SHA-256";
  chain_status: RuntimeLedgerChainStatus;
  verification_timestamp: string;
  verified_by: "runtime-assurance-ledger/v8ALT.1G";
  chain_hash: string;
}>;

export type RuntimeLedgerAuditIndex = Readonly<{
  audit_index_id: string;
  tenant_id: string;
  mission_id: string;
  execution_id: string;
  ledger_entries: readonly string[];
  evidence_records: readonly string[];
  governance_records: readonly string[];
  constitutional_records: readonly string[];
  replay_records: readonly string[];
  integrity_records: readonly string[];
  audit_hash: string;
}>;

export type RuntimeLedgerPackage = Readonly<{
  ledger_id: string;
  ledger_version: "runtime-assurance-ledger/v8ALT.1G";
  lifecycle: readonly RuntimeLedgerLifecycleStage[];
  entries: readonly RuntimeLedgerEntry[];
  evidence_registry: readonly RuntimeLedgerEvidenceRecord[];
  chain: readonly RuntimeLedgerChainRecord[];
  audit_index: RuntimeLedgerAuditIndex;
  append_only: true;
  immutable: boolean;
  deterministic_ordering: boolean;
  execution_authorized: boolean;
  execution_modified: boolean;
  historical_records_modified: boolean;
  ledger_hash: string;
}>;

export type RuntimeLedgerInput = Readonly<{
  scenario?: RuntimeLedgerScenario;
  state?: AssuranceStateRecord;
}>;

export type RuntimeLedgerReplayResult = Readonly<{
  replay_id: string;
  ledger_id: string;
  deterministic: boolean;
  reconstructed_entry_order: readonly string[];
  reconstructed_ledger_hash: string;
  reconstructed_chain_hashes: readonly string[];
  replay_failures: readonly RuntimeLedgerFailure[];
  replay_hash: string;
}>;

export type RuntimeLedgerValidationResult = Readonly<{
  ledger_id: string | null;
  valid: boolean;
  records_complete: boolean;
  append_only: boolean;
  immutable: boolean;
  ordering_valid: boolean;
  evidence_valid: boolean;
  lineage_valid: boolean;
  integrity_chain_valid: boolean;
  replay_valid: boolean;
  governance_valid: boolean;
  constitutional_valid: boolean;
  tenant_isolated: boolean;
  execution_safe: boolean;
  failures: readonly RuntimeLedgerFailure[];
  validation_hash: string;
}>;

export type RuntimeLedgerCertification = Readonly<{
  certification_id: string;
  ledger_id: string;
  certified: boolean;
  validation: RuntimeLedgerValidationResult;
  authoritative_historical_record: boolean;
  certification_hash: string;
}>;

export type RuntimeLedgerPublisherSurface = Readonly<{
  ledger_id: string;
  entries: number;
  evidence_records: number;
  chain_status: RuntimeLedgerChainStatus;
  audit_ready: boolean;
  deterministic_ordering: true;
  append_only: true;
  ledger_hash: string;
}>;

export type RuntimeAssuranceLedgerContract = Readonly<{
  doctrine: Readonly<{
    ledger_version: "runtime-assurance-ledger/v8ALT.1G";
    principles: readonly string[];
    lifecycle: readonly RuntimeLedgerLifecycleStage[];
    evidence_types: readonly RuntimeLedgerEvidenceType[];
    restrictions: readonly string[];
  }>;
  package: RuntimeLedgerPackage;
  validation: RuntimeLedgerValidationResult;
  replay: RuntimeLedgerReplayResult;
  certification: RuntimeLedgerCertification;
}>;

export type RuntimeLedgerScenarioMap = Readonly<Record<RuntimeLedgerScenario, AssuranceStateScenario>>;
