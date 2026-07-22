import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { generateRollbackRecoveryReplayReferences, replayRollbackRecoveryReferences } from "@/services/rollback-recovery-replay-references";
import type { RollbackRecoveryReplayResult } from "@/types/rollback-recovery-replay-references";
import type {
  DecisionPackageAuditReport,
  DecisionPackageLedgerFailureReason,
  DecisionPackageLedgerFoundation,
  DecisionPackageLedgerInput,
  DecisionPackageLedgerObservability,
  DecisionPackageLedgerRecord,
  DecisionPackageLedgerReplay,
  DecisionPackageLedgerResult,
  DecisionPackageLedgerState,
  ImmutableLedgerEntry,
  ImmutablePackageRecord,
  LedgerIndexRecord,
  LedgerValidationResult,
  ReplayRegistryRecord,
  VersionHistoryRecord,
} from "@/types/decision-package-ledger";

const LEDGER_VERSION = "decision-package-ledger/v1" as const;
const AUTHORIZED_COMPONENT = "decision-package-ledger";
const NOW = "2026-07-04T01:20:00.000Z";

export const DECISION_PACKAGE_LEDGER_STATES: readonly DecisionPackageLedgerState[] = Object.freeze(["INITIALIZED", "VALIDATING", "VERIFIED", "STORING", "COMMITTED", "INDEXED", "REPLAY_REGISTERED", "FAILED", "FAIL_CLOSED"]);

function hash(value: unknown): string {
  return generateDecisionIntegrityHash(value);
}

function hashWithoutIntegrity(value: object): string {
  const copy = { ...value } as Record<string, unknown>;
  delete copy.integrity_hash;
  delete copy.ledger_integrity_hash;
  return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown);
}

function ledgerRecordHash(record: Omit<DecisionPackageLedgerRecord, "integrity_hash"> | DecisionPackageLedgerRecord): string {
  return hashWithoutIntegrity(record);
}

export function computeDecisionPackageLedgerRecordHash(record: Omit<DecisionPackageLedgerRecord, "integrity_hash"> | DecisionPackageLedgerRecord): string {
  return ledgerRecordHash(record);
}

function storageHash(record: Omit<ImmutablePackageRecord, "integrity_hash"> | ImmutablePackageRecord): string {
  return hashWithoutIntegrity(record);
}

export function computeImmutablePackageRecordHash(record: Omit<ImmutablePackageRecord, "integrity_hash"> | ImmutablePackageRecord): string {
  return storageHash(record);
}

function replayRegistryHash(record: Omit<ReplayRegistryRecord, "integrity_hash"> | ReplayRegistryRecord): string {
  return hashWithoutIntegrity(record);
}

export function computeReplayRegistryRecordHash(record: Omit<ReplayRegistryRecord, "integrity_hash"> | ReplayRegistryRecord): string {
  return replayRegistryHash(record);
}

function versionHash(record: Omit<VersionHistoryRecord, "integrity_hash"> | VersionHistoryRecord): string {
  return hashWithoutIntegrity(record);
}

export function computeVersionHistoryRecordHash(record: Omit<VersionHistoryRecord, "integrity_hash"> | VersionHistoryRecord): string {
  return versionHash(record);
}

function indexHash(record: Omit<LedgerIndexRecord, "integrity_hash"> | LedgerIndexRecord): string {
  return hashWithoutIntegrity(record);
}

export function computeLedgerIndexRecordHash(record: Omit<LedgerIndexRecord, "integrity_hash"> | LedgerIndexRecord): string {
  return indexHash(record);
}

function validationHash(record: Omit<LedgerValidationResult, "integrity_hash"> | LedgerValidationResult): string {
  return hashWithoutIntegrity(record);
}

function auditHash(record: Omit<DecisionPackageAuditReport, "integrity_hash"> | DecisionPackageAuditReport): string {
  return hashWithoutIntegrity(record);
}

function entryHash(record: Omit<ImmutableLedgerEntry, "ledger_integrity_hash"> | ImmutableLedgerEntry): string {
  return hashWithoutIntegrity(record);
}

function operatorPackage(reference: RollbackRecoveryReplayResult) {
  return reference.workflow_result.compliance_result.forecast_result.evidence_result.package_build_result.package;
}

export function createImmutablePackageRecord(reference: RollbackRecoveryReplayResult = generateRollbackRecoveryReplayReferences()): ImmutablePackageRecord {
  const pkg = operatorPackage(reference);
  const base: Omit<ImmutablePackageRecord, "integrity_hash"> = {
    storage_id: `immutable_package_storage_${pkg.package_id}`,
    package_id: pkg.package_id,
    package_payload: reference.package,
    schema_version: pkg.metadata.schema_version,
    storage_timestamp: NOW,
    immutable_status: reference.reference_status === "PASS" ? "IMMUTABLE" : "REJECTED",
    append_only: true,
    deleted: false,
  };
  return Object.freeze({ ...base, integrity_hash: storageHash(base) });
}

export function createVersionHistoryRecord(reference: RollbackRecoveryReplayResult = generateRollbackRecoveryReplayReferences()): VersionHistoryRecord {
  const pkg = operatorPackage(reference);
  const base: Omit<VersionHistoryRecord, "integrity_hash"> = {
    history_id: `version_history_${pkg.package_id}`,
    package_id: pkg.package_id,
    package_versions: Object.freeze([pkg.package_version]),
    parent_version: pkg.lifecycle.previous_state ?? "ORIGINAL",
    successor_versions: Object.freeze([]),
    version_summary: `${pkg.package_id} committed as ${pkg.package_version}; lifecycle=${pkg.lifecycle.current_state}.`,
    append_only: true,
  };
  return Object.freeze({ ...base, integrity_hash: versionHash(base) });
}

export function createReplayRegistryRecord(reference: RollbackRecoveryReplayResult = generateRollbackRecoveryReplayReferences()): ReplayRegistryRecord {
  const pkg = operatorPackage(reference);
  const base: Omit<ReplayRegistryRecord, "integrity_hash"> = {
    replay_registry_id: `replay_registry_${pkg.package_id}`,
    package_id: pkg.package_id,
    replay_reference: reference.package.replay_ref,
    replay_version: "replay-reference/v1",
    replay_timestamp: reference.replay_reference.replay_timestamp,
    replay_validation_status: reference.replay_validation.validation_status,
    append_only: true,
  };
  return Object.freeze({ ...base, integrity_hash: replayRegistryHash(base) });
}

export function createDecisionPackageLedgerRecord(
  reference: RollbackRecoveryReplayResult = generateRollbackRecoveryReplayReferences(),
  versionHistory: VersionHistoryRecord = createVersionHistoryRecord(reference),
): DecisionPackageLedgerRecord {
  const pkg = operatorPackage(reference);
  const base: Omit<DecisionPackageLedgerRecord, "integrity_hash"> = {
    ledger_record_id: `decision_package_ledger_${pkg.package_id}_${pkg.package_version}`,
    package_id: pkg.package_id,
    package_version: pkg.package_version,
    orchestration_id: pkg.orchestration_id,
    mission_id: pkg.mission_id,
    tenant_id: pkg.tenant_id,
    package_reference: reference.package.package_id,
    ledger_timestamp: NOW,
    replay_reference: reference.package.replay_ref,
    lineage_reference: reference.package.lineage_ref,
    version_history_reference: versionHistory.history_id,
    storage_status: reference.reference_status === "PASS" ? "STORED" : "REJECTED",
    append_only: true,
    deleted: false,
  };
  return Object.freeze({ ...base, integrity_hash: ledgerRecordHash(base) });
}

export function createLedgerIndexRecord(ledger: DecisionPackageLedgerRecord): LedgerIndexRecord {
  const base: Omit<LedgerIndexRecord, "integrity_hash"> = {
    index_id: `ledger_index_${ledger.ledger_record_id}`,
    package_id: ledger.package_id,
    mission_id: ledger.mission_id,
    orchestration_id: ledger.orchestration_id,
    replay_reference: ledger.replay_reference,
    lineage_reference: ledger.lineage_reference,
    tenant_id: ledger.tenant_id,
    package_version: ledger.package_version,
    ledger_timestamp: ledger.ledger_timestamp,
    ledger_record_id: ledger.ledger_record_id,
  };
  return Object.freeze({ ...base, integrity_hash: indexHash(base) });
}

function ledgerFailures(input: {
  reference: RollbackRecoveryReplayResult;
  ledger: DecisionPackageLedgerRecord;
  storage: ImmutablePackageRecord;
  replayRegistry: ReplayRegistryRecord;
  versionHistory: VersionHistoryRecord;
  index: LedgerIndexRecord;
  authorized: boolean;
}): readonly DecisionPackageLedgerFailureReason[] {
  const failures: DecisionPackageLedgerFailureReason[] = [];
  const pkg = operatorPackage(input.reference);
  if (!input.authorized) failures.push("UNAUTHORIZED_LEDGER_ACCESS");
  if (!input.reference.package || !input.storage.package_payload) failures.push("PACKAGE_MISSING");
  if (pkg.metadata.schema_version !== "operator-decision-package-schema/v1" || input.storage.schema_version !== "operator-decision-package-schema/v1") failures.push("SCHEMA_INVALID");
  if (input.reference.reference_status !== "PASS" || replayRollbackRecoveryReferences(input.reference).replay_valid === false) failures.push("REFERENCE_PACKAGE_INVALID");
  if (!input.ledger.replay_reference || !input.replayRegistry.replay_reference) failures.push("REPLAY_REFERENCE_MISSING");
  if (!input.ledger.lineage_reference || input.reference.lineage_reference.evidence_lineage.length === 0 || input.reference.lineage_reference.governance_lineage.length === 0) failures.push("LINEAGE_INCOMPLETE");
  if (!input.ledger.append_only || input.ledger.deleted || !input.storage.append_only || input.storage.deleted || !input.replayRegistry.append_only || !input.versionHistory.append_only) failures.push("APPEND_ONLY_VIOLATION");
  if (input.versionHistory.package_versions.length === 0 || !input.versionHistory.package_versions.includes(input.ledger.package_version)) failures.push("VERSION_HISTORY_INCONSISTENT");
  if (input.ledger.tenant_id !== pkg.tenant_id || input.index.tenant_id !== pkg.tenant_id || input.storage.package_payload.tenant_id !== pkg.tenant_id) failures.push("TENANT_MISMATCH");
  if (!input.reference.advisory_only || !input.reference.package.advisory_only) failures.push("ADVISORY_ONLY_VIOLATION");
  if (
    ledgerRecordHash(input.ledger) !== input.ledger.integrity_hash
    || storageHash(input.storage) !== input.storage.integrity_hash
    || replayRegistryHash(input.replayRegistry) !== input.replayRegistry.integrity_hash
    || versionHash(input.versionHistory) !== input.versionHistory.integrity_hash
    || indexHash(input.index) !== input.index.integrity_hash
  ) failures.push("INTEGRITY_VERIFICATION_FAILED");
  return Object.freeze([...new Set(failures)] as DecisionPackageLedgerFailureReason[]);
}

function buildValidation(packageId: string, failures: readonly DecisionPackageLedgerFailureReason[]): LedgerValidationResult {
  const has = (failure: DecisionPackageLedgerFailureReason) => failures.includes(failure);
  const base: Omit<LedgerValidationResult, "integrity_hash"> = {
    validation_id: `decision_package_ledger_validation_${packageId}`,
    package_id: packageId,
    schema_valid: !has("SCHEMA_INVALID") && !has("PACKAGE_MISSING"),
    integrity_valid: !has("INTEGRITY_VERIFICATION_FAILED"),
    replay_valid: !has("REPLAY_REFERENCE_MISSING") && !has("REPLAY_DIVERGENCE") && !has("REFERENCE_PACKAGE_INVALID"),
    lineage_valid: !has("LINEAGE_INCOMPLETE"),
    append_only_verified: !has("APPEND_ONLY_VIOLATION"),
    tenant_valid: !has("TENANT_MISMATCH"),
    version_history_valid: !has("VERSION_HISTORY_INCONSISTENT"),
    validation_status: failures.length === 0 ? "VALID" : "REJECTED",
    validation_timestamp: NOW,
    failures,
  };
  return Object.freeze({ ...base, integrity_hash: validationHash(base) });
}

function createAuditReport(ledger: DecisionPackageLedgerRecord, validation: LedgerValidationResult): DecisionPackageAuditReport {
  const base: Omit<DecisionPackageAuditReport, "integrity_hash"> = {
    audit_report_id: `decision_package_audit_${ledger.ledger_record_id}`,
    ledger_record_id: ledger.ledger_record_id,
    package_id: ledger.package_id,
    storage_timestamp: ledger.ledger_timestamp,
    integrity_verification_status: validation.integrity_valid ? "VERIFIED" : "FAILED",
    replay_registration_status: validation.replay_valid ? "REGISTERED" : "FAILED",
    lineage_verification_status: validation.lineage_valid ? "VERIFIED" : "FAILED",
    version_history_status: validation.version_history_valid ? "UPDATED" : "FAILED",
    validation_outcome: validation.validation_status,
  };
  return Object.freeze({ ...base, integrity_hash: auditHash(base) });
}

function createImmutableLedgerEntry(input: {
  ledger: DecisionPackageLedgerRecord;
  storage: ImmutablePackageRecord;
  replayRegistry: ReplayRegistryRecord;
  versionHistory: VersionHistoryRecord;
  index: LedgerIndexRecord;
  audit: DecisionPackageAuditReport;
  validation: LedgerValidationResult;
}): ImmutableLedgerEntry {
  const base: Omit<ImmutableLedgerEntry, "ledger_integrity_hash"> = {
    entry_id: `immutable_ledger_entry_${input.ledger.ledger_record_id}`,
    ledger_record: input.ledger,
    immutable_package: input.storage,
    replay_registry: input.replayRegistry,
    version_history: input.versionHistory,
    ledger_index: input.index,
    audit_report: input.audit,
    validation: input.validation,
    append_only: true,
    deleted: false,
  };
  return Object.freeze({ ...base, ledger_integrity_hash: entryHash(base) });
}

function resultReplayHash(result: Omit<DecisionPackageLedgerResult, "integrity_hash" | "replay_hash">): string {
  return hash({
    reference_result: result.reference_result,
    ledger_record: result.ledger_record,
    immutable_package: result.immutable_package,
    replay_registry: result.replay_registry,
    version_history: result.version_history,
    ledger_index: result.ledger_index,
    validation: result.validation,
    audit_report: result.audit_report,
    immutable_ledger_entries: result.immutable_ledger_entries,
    failures: result.failures,
  });
}

export function commitDecisionPackageLedger(input: DecisionPackageLedgerInput = {}): DecisionPackageLedgerResult {
  const reference_result = input.reference_result ?? generateRollbackRecoveryReplayReferences();
  const version_history = input.version_history ?? createVersionHistoryRecord(reference_result);
  const ledger_record = input.ledger_record ?? createDecisionPackageLedgerRecord(reference_result, version_history);
  const immutable_package = input.immutable_package ?? createImmutablePackageRecord(reference_result);
  const replay_registry = input.replay_registry ?? createReplayRegistryRecord(reference_result);
  const ledger_index = input.ledger_index ?? createLedgerIndexRecord(ledger_record);
  const failures = ledgerFailures({
    reference: reference_result,
    ledger: ledger_record,
    storage: immutable_package,
    replayRegistry: replay_registry,
    versionHistory: version_history,
    index: ledger_index,
    authorized: !input.authorized_component || input.authorized_component === AUTHORIZED_COMPONENT,
  });
  const validation = buildValidation(ledger_record.package_id, failures);
  const audit_report = input.audit_report ?? createAuditReport(ledger_record, validation);
  const entry = createImmutableLedgerEntry({ ledger: ledger_record, storage: immutable_package, replayRegistry: replay_registry, versionHistory: version_history, index: ledger_index, audit: audit_report, validation });
  const entryFailures: readonly DecisionPackageLedgerFailureReason[] = entryHash(entry) === entry.ledger_integrity_hash && entry.append_only && !entry.deleted ? [] : ["INTEGRITY_VERIFICATION_FAILED"];
  const finalFailures = Object.freeze([...new Set([...failures, ...entryFailures])] as DecisionPackageLedgerFailureReason[]);
  const finalValidation = finalFailures.length === failures.length ? validation : buildValidation(ledger_record.package_id, finalFailures);
  const finalAudit = finalValidation === validation ? audit_report : createAuditReport(ledger_record, finalValidation);
  const finalEntry = finalValidation === validation ? entry : createImmutableLedgerEntry({ ledger: ledger_record, storage: immutable_package, replayRegistry: replay_registry, versionHistory: version_history, index: ledger_index, audit: finalAudit, validation: finalValidation });
  const base: Omit<DecisionPackageLedgerResult, "integrity_hash" | "replay_hash"> = {
    ledger_status: finalValidation.validation_status === "VALID" ? "PASS" : "FAIL",
    fail_closed: finalValidation.failures.length > 0,
    reference_result,
    ledger_record,
    immutable_package,
    replay_registry,
    version_history,
    ledger_index,
    validation: finalValidation,
    audit_report: finalAudit,
    immutable_ledger_entries: Object.freeze([finalEntry]),
    failures: finalValidation.failures,
    deterministic: true,
    advisory_only: true,
  };
  const replay_hash = resultReplayHash(base);
  if (input.replay_expected_hash && input.replay_expected_hash !== replay_hash) {
    const replayFailures: readonly DecisionPackageLedgerFailureReason[] = Object.freeze(["REPLAY_DIVERGENCE"]);
    const replayValidation = buildValidation(ledger_record.package_id, replayFailures);
    const replayAudit = createAuditReport(ledger_record, replayValidation);
    const replayBase: Omit<DecisionPackageLedgerResult, "integrity_hash" | "replay_hash"> = {
      ...base,
      ledger_status: "FAIL",
      fail_closed: true,
      validation: replayValidation,
      audit_report: replayAudit,
      immutable_ledger_entries: Object.freeze([]),
      failures: replayFailures,
    };
    const mismatchHash = resultReplayHash(replayBase);
    return Object.freeze({ ...replayBase, replay_hash: mismatchHash, integrity_hash: hashWithoutIntegrity({ ...replayBase, replay_hash: mismatchHash }) });
  }
  return Object.freeze({ ...base, replay_hash, integrity_hash: hashWithoutIntegrity({ ...base, replay_hash }) });
}

export function replayDecisionPackageLedger(result: DecisionPackageLedgerResult): DecisionPackageLedgerReplay {
  const reconstructed = resultReplayHash(result);
  const replay_valid = reconstructed === result.replay_hash
    && ledgerRecordHash(result.ledger_record) === result.ledger_record.integrity_hash
    && storageHash(result.immutable_package) === result.immutable_package.integrity_hash
    && replayRegistryHash(result.replay_registry) === result.replay_registry.integrity_hash
    && versionHash(result.version_history) === result.version_history.integrity_hash
    && indexHash(result.ledger_index) === result.ledger_index.integrity_hash
    && validationHash(result.validation) === result.validation.integrity_hash
    && auditHash(result.audit_report) === result.audit_report.integrity_hash
    && result.immutable_ledger_entries.every((entry) => entryHash(entry) === entry.ledger_integrity_hash);
  const failures: DecisionPackageLedgerFailureReason[] = replay_valid ? [] : ["REPLAY_DIVERGENCE"];
  const base: Omit<DecisionPackageLedgerReplay, "integrity_hash"> = {
    replay_id: "replay_decision_package_ledger",
    replay_valid,
    ledger_record_id: result.ledger_record.ledger_record_id,
    package_id: result.ledger_record.package_id,
    replay_reference: result.ledger_record.replay_reference,
    lineage_reference: result.ledger_record.lineage_reference,
    version_history_reference: result.ledger_record.version_history_reference,
    expected_replay_hash: result.replay_hash,
    reconstructed_replay_hash: reconstructed,
    failures: Object.freeze(failures),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

export function buildDecisionPackageLedgerObservability(result: DecisionPackageLedgerResult): DecisionPackageLedgerObservability {
  return Object.freeze({
    packages_committed: result.ledger_status === "PASS" ? 1 : 0,
    immutable_writes: result.immutable_package.immutable_status === "IMMUTABLE" ? 1 : 0,
    replay_registrations: result.replay_registry.replay_validation_status === "VALID" ? 1 : 0,
    version_history_updates: result.validation.version_history_valid ? 1 : 0,
    integrity_verification_success: result.validation.integrity_valid ? 1 : 0,
    append_only_violations: result.failures.includes("APPEND_ONLY_VIOLATION") ? 1 : 0,
    replay_reproducibility: replayDecisionPackageLedger(result).replay_valid ? 1 : 0,
    ledger_lookup_latency_ms: 0,
    validation_failures: result.failures.length,
    fail_closed_activations: result.fail_closed ? 1 : 0,
  });
}

export function getDecisionPackageLedgerFoundation(): DecisionPackageLedgerFoundation {
  const result = commitDecisionPackageLedger();
  const replay = replayDecisionPackageLedger(result);
  return Object.freeze({
    ledger_version: LEDGER_VERSION,
    ledger_states: DECISION_PACKAGE_LEDGER_STATES,
    result,
    replay,
    observability: buildDecisionPackageLedgerObservability(result),
  });
}

export const DecisionPackageLedger = Object.freeze({
  commit: commitDecisionPackageLedger,
  replay: replayDecisionPackageLedger,
});
