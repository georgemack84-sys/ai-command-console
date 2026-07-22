import type { RollbackRecoveryReplayResult, RollbackRecoveryPackage } from "@/types/rollback-recovery-replay-references";

export type DecisionPackageLedgerState = "INITIALIZED" | "VALIDATING" | "VERIFIED" | "STORING" | "COMMITTED" | "INDEXED" | "REPLAY_REGISTERED" | "FAILED" | "FAIL_CLOSED";

export type DecisionPackageLedgerRecord = Readonly<{
  ledger_record_id: string;
  package_id: string;
  package_version: "operator-decision-package/v1";
  orchestration_id: string;
  mission_id: string;
  tenant_id: string;
  package_reference: string;
  ledger_timestamp: string;
  replay_reference: string;
  lineage_reference: string;
  integrity_hash: string;
  version_history_reference: string;
  storage_status: "STORED" | "REJECTED";
  append_only: true;
  deleted: false;
}>;

export type ImmutablePackageRecord = Readonly<{
  storage_id: string;
  package_id: string;
  package_payload: RollbackRecoveryPackage;
  schema_version: "operator-decision-package-schema/v1";
  storage_timestamp: string;
  integrity_hash: string;
  immutable_status: "IMMUTABLE" | "REJECTED";
  append_only: true;
  deleted: false;
}>;

export type ReplayRegistryRecord = Readonly<{
  replay_registry_id: string;
  package_id: string;
  replay_reference: string;
  replay_version: "replay-reference/v1";
  replay_timestamp: string;
  replay_validation_status: "VALID" | "REJECTED";
  integrity_hash: string;
  append_only: true;
}>;

export type VersionHistoryRecord = Readonly<{
  history_id: string;
  package_id: string;
  package_versions: readonly string[];
  parent_version: string;
  successor_versions: readonly string[];
  version_summary: string;
  integrity_hash: string;
  append_only: true;
}>;

export type LedgerIndexRecord = Readonly<{
  index_id: string;
  package_id: string;
  mission_id: string;
  orchestration_id: string;
  replay_reference: string;
  lineage_reference: string;
  tenant_id: string;
  package_version: "operator-decision-package/v1";
  ledger_timestamp: string;
  ledger_record_id: string;
  integrity_hash: string;
}>;

export type LedgerValidationResult = Readonly<{
  validation_id: string;
  package_id: string;
  schema_valid: boolean;
  integrity_valid: boolean;
  replay_valid: boolean;
  lineage_valid: boolean;
  append_only_verified: boolean;
  tenant_valid: boolean;
  version_history_valid: boolean;
  validation_status: "VALID" | "REJECTED";
  validation_timestamp: string;
  failures: readonly DecisionPackageLedgerFailureReason[];
  integrity_hash: string;
}>;

export type DecisionPackageAuditReport = Readonly<{
  audit_report_id: string;
  ledger_record_id: string;
  package_id: string;
  storage_timestamp: string;
  integrity_verification_status: "VERIFIED" | "FAILED";
  replay_registration_status: "REGISTERED" | "FAILED";
  lineage_verification_status: "VERIFIED" | "FAILED";
  version_history_status: "UPDATED" | "FAILED";
  validation_outcome: "VALID" | "REJECTED";
  integrity_hash: string;
}>;

export type ImmutableLedgerEntry = Readonly<{
  entry_id: string;
  ledger_record: DecisionPackageLedgerRecord;
  immutable_package: ImmutablePackageRecord;
  replay_registry: ReplayRegistryRecord;
  version_history: VersionHistoryRecord;
  ledger_index: LedgerIndexRecord;
  audit_report: DecisionPackageAuditReport;
  validation: LedgerValidationResult;
  append_only: true;
  deleted: false;
  ledger_integrity_hash: string;
}>;

export type DecisionPackageLedgerFailureReason =
  | "PACKAGE_MISSING"
  | "SCHEMA_INVALID"
  | "INTEGRITY_VERIFICATION_FAILED"
  | "REPLAY_REFERENCE_MISSING"
  | "LINEAGE_INCOMPLETE"
  | "APPEND_ONLY_VIOLATION"
  | "VERSION_HISTORY_INCONSISTENT"
  | "TENANT_MISMATCH"
  | "REFERENCE_PACKAGE_INVALID"
  | "ADVISORY_ONLY_VIOLATION"
  | "UNAUTHORIZED_LEDGER_ACCESS"
  | "REPLAY_DIVERGENCE";

export type DecisionPackageLedgerInput = Readonly<{
  reference_result?: RollbackRecoveryReplayResult;
  ledger_record?: DecisionPackageLedgerRecord;
  immutable_package?: ImmutablePackageRecord;
  replay_registry?: ReplayRegistryRecord;
  version_history?: VersionHistoryRecord;
  ledger_index?: LedgerIndexRecord;
  audit_report?: DecisionPackageAuditReport;
  authorized_component?: string;
  replay_expected_hash?: string;
}>;

export type DecisionPackageLedgerResult = Readonly<{
  ledger_status: "PASS" | "FAIL";
  fail_closed: boolean;
  reference_result: RollbackRecoveryReplayResult;
  ledger_record: DecisionPackageLedgerRecord;
  immutable_package: ImmutablePackageRecord;
  replay_registry: ReplayRegistryRecord;
  version_history: VersionHistoryRecord;
  ledger_index: LedgerIndexRecord;
  validation: LedgerValidationResult;
  audit_report: DecisionPackageAuditReport;
  immutable_ledger_entries: readonly ImmutableLedgerEntry[];
  replay_hash: string;
  failures: readonly DecisionPackageLedgerFailureReason[];
  deterministic: true;
  advisory_only: true;
  integrity_hash: string;
}>;

export type DecisionPackageLedgerReplay = Readonly<{
  replay_id: string;
  replay_valid: boolean;
  ledger_record_id: string;
  package_id: string;
  replay_reference: string;
  lineage_reference: string;
  version_history_reference: string;
  expected_replay_hash: string;
  reconstructed_replay_hash: string;
  failures: readonly DecisionPackageLedgerFailureReason[];
  integrity_hash: string;
}>;

export type DecisionPackageLedgerObservability = Readonly<{
  packages_committed: number;
  immutable_writes: number;
  replay_registrations: number;
  version_history_updates: number;
  integrity_verification_success: number;
  append_only_violations: number;
  replay_reproducibility: number;
  ledger_lookup_latency_ms: number;
  validation_failures: number;
  fail_closed_activations: number;
}>;

export type DecisionPackageLedgerFoundation = Readonly<{
  ledger_version: "decision-package-ledger/v1";
  ledger_states: readonly DecisionPackageLedgerState[];
  result: DecisionPackageLedgerResult;
  replay: DecisionPackageLedgerReplay;
  observability: DecisionPackageLedgerObservability;
}>;
