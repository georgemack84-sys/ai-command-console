import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import {
  establishAdaptiveMemorySecurityIntegrity,
  replayAdaptiveMemorySecurityIntegrity,
} from "@/services/adaptive-memory-security-integrity";
import type { MemorySecurityRecord } from "@/types/adaptive-memory-security-integrity";
import type {
  AdaptiveMemoryLedgerApiSurface,
  AdaptiveMemoryLedgerContract,
  AdaptiveMemoryLedgerInput,
  AdaptiveMemoryLedgerMetrics,
  AdaptiveMemoryLedgerRecord,
  AdaptiveMemoryLedgerResult,
  AdaptiveMemoryLedgerSystem,
  LedgerAuditReport,
  LedgerEventType,
  LedgerFailure,
  LedgerIntegrityValidation,
  LedgerLineageRecord,
  LedgerScenario,
} from "@/types/adaptive-memory-ledger";

const LEDGER_VERSION = "adaptive-memory-ledger/v1" as const;
const LEDGER_IDENTIFIER = "AdaptiveMemoryLedger" as const;
const EVENT_TIMESTAMP = "2026-07-13T00:00:00.000Z" as const;
const GENESIS_HASH = "adaptive-memory-ledger-genesis";

const EVENT_TYPES: readonly LedgerEventType[] = Object.freeze([
  "MEMORY_CREATION",
  "MEMORY_QUALIFICATION",
  "MEMORY_VALIDATION",
  "MEMORY_INDEXING",
  "MEMORY_RETRIEVAL",
  "MEMORY_REUSE",
  "GOVERNANCE_REVIEW",
  "REPLAY_EXECUTION",
  "SUPERSESSION",
  "EXPIRATION",
  "ARCHIVAL",
  "RESTORATION",
  "CERTIFICATION",
  "SECURITY_EVENT",
  "INTEGRITY_VERIFICATION",
]);

type Scenario = NonNullable<AdaptiveMemoryLedgerInput["scenario"]>;

function freezeArray<T>(values: readonly T[]): readonly T[] {
  return Object.freeze([...values]);
}

function hash(value: unknown): string {
  return generateDecisionIntegrityHash(value);
}

function hashWithoutIntegrity<T extends object>(value: T): string {
  const copy = { ...value } as Record<string, unknown>;
  delete copy.integrity_hash;
  return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown);
}

function currentHashFor(value: Omit<AdaptiveMemoryLedgerRecord, "current_hash" | "integrity_hash">): string {
  return hash(value);
}

function buildApiSurface(): AdaptiveMemoryLedgerApiSurface {
  const base: Omit<AdaptiveMemoryLedgerApiSurface, "integrity_hash"> = {
    api_id: "adaptive_memory_ledger_api",
    establish_ledger: "POST /adaptive-memory-ledger/establish",
    retrieve_contract: "GET /adaptive-memory-ledger/contract",
    retrieve_records: "POST /adaptive-memory-ledger/records",
    retrieve_lineage: "POST /adaptive-memory-ledger/lineage",
    retrieve_audit: "POST /adaptive-memory-ledger/audit",
    retrieve_integrity: "POST /adaptive-memory-ledger/integrity",
    retrieve_metrics: "POST /adaptive-memory-ledger/metrics",
    replay_ledger: "POST /adaptive-memory-ledger/replay",
    inspect_ledger: "POST /adaptive-memory-ledger/inspect",
    mutation_supported: false,
    deletion_supported: false,
    non_append_writes_supported: false,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function failureForScenario(scenario: Scenario): LedgerFailure | undefined {
  const map: Partial<Record<LedgerScenario, LedgerFailure>> = {
    SECURITY_FRAMEWORK_UNAVAILABLE: "SECURITY_FRAMEWORK_UNAVAILABLE",
    ENTRY_MODIFIED: "LEDGER_ENTRY_MODIFIED",
    ENTRY_DELETED: "LEDGER_ENTRY_DELETED",
    APPEND_ONLY_VIOLATION: "APPEND_ONLY_VIOLATED",
    HASH_CHAIN_BREAK: "HASH_CHAIN_BROKEN",
    INCOMPLETE_LINEAGE: "LINEAGE_INCOMPLETE",
    REPLAY_UNAVAILABLE: "REPLAY_UNAVAILABLE",
    MISSING_GOVERNANCE: "GOVERNANCE_HISTORY_MISSING",
    ORDERING_INCONSISTENCY: "EVENT_ORDERING_INCONSISTENT",
    INTEGRITY_FAILURE: "INTEGRITY_VERIFICATION_FAILED",
    TENANT_ISOLATION_BREACH: "TENANT_ISOLATION_VIOLATED",
  };
  return map[scenario];
}

function collectFailures(scenario: Scenario, securityReplayable: boolean): readonly LedgerFailure[] {
  const failures: LedgerFailure[] = [];
  const direct = failureForScenario(scenario);
  if (direct) failures.push(direct);
  if (!securityReplayable) failures.push("SECURITY_FRAMEWORK_UNAVAILABLE");
  return freezeArray([...new Set(failures)]);
}

function buildContract(): AdaptiveMemoryLedgerContract {
  const base: Omit<AdaptiveMemoryLedgerContract, "integrity_hash"> = {
    contract_id: "adaptive-memory-ledger-contract",
    version: LEDGER_VERSION,
    architecture: freezeArray(["Adaptive Memory Operation", "Ledger Write Engine", "Lineage Tracker", "Integrity Validator", "Adaptive Memory Ledger", "Replay", "Governance Audit"]),
    event_types: EVENT_TYPES,
    write_rules: freezeArray(["event_timestamp_required", "immutable_identifier_required", "tenant_identifier_required", "mission_identifier_required", "replay_references_required", "governance_references_required", "evidence_references_required", "previous_hash_required", "current_hash_required", "integrity_hash_required"]),
    chain_validation_rules: freezeArray(["previous_hash", "current_hash", "chronological_ordering", "event_consistency", "replay_continuity", "lineage_continuity"]),
    replay_requirements: freezeArray(["complete_event_history", "chronological_ordering", "lineage_evolution", "governance_history", "replay_history", "lifecycle_history", "security_history", "certification_history"]),
    security_requirements: freezeArray(["encrypt_ledger_records", "enforce_tenant_isolation", "authenticate_writes", "authorize_writes", "prevent_modification", "detect_corruption", "detect_tampering", "preserve_immutable_history"]),
    audit_capabilities: freezeArray(["forensic_reconstruction", "governance_auditing", "constitutional_auditing", "replay_auditing", "certification_auditing", "lineage_auditing", "integrity_auditing", "lifecycle_auditing"]),
    ledger_guarantees: freezeArray(["append_only_architecture", "immutable_history", "deterministic_writes", "deterministic_replay", "complete_lineage", "cryptographic_verification", "governance_transparency", "replay_compatibility", "tenant_isolation"]),
    every_memory_event_permanent: true,
    append_only_history: true,
    replay_before_trust: true,
    complete_lineage: true,
    governance_transparency: true,
    deterministic_ledger: true,
    mutation_supported: false,
    deletion_supported: false,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function refs(prefix: string, source: MemorySecurityRecord, count: number): readonly string[] {
  return freezeArray(Array.from({ length: count }, (_, index) => `${prefix}:${source.mission_id}:${source.memory_id}:${index + 1}`));
}

function lifecycleStateFor(event: LedgerEventType): string {
  switch (event) {
    case "MEMORY_CREATION":
      return "CANDIDATE";
    case "MEMORY_QUALIFICATION":
      return "QUALIFIED";
    case "MEMORY_VALIDATION":
    case "GOVERNANCE_REVIEW":
    case "CERTIFICATION":
      return "APPROVED";
    case "MEMORY_INDEXING":
    case "MEMORY_RETRIEVAL":
    case "MEMORY_REUSE":
    case "SECURITY_EVENT":
    case "INTEGRITY_VERIFICATION":
      return "ACTIVE";
    case "REPLAY_EXECUTION":
      return "REFERENCED";
    case "SUPERSESSION":
      return "SUPERSEDED";
    case "EXPIRATION":
      return "EXPIRED";
    case "ARCHIVAL":
    case "RESTORATION":
      return "ARCHIVED";
  }
}

function buildLedgerRecord(
  source: MemorySecurityRecord,
  event: LedgerEventType,
  sequence: number,
  previous_hash: string,
  failures: readonly LedgerFailure[],
): AdaptiveMemoryLedgerRecord {
  const missingLineage = failures.includes("LINEAGE_INCOMPLETE");
  const missingGovernance = failures.includes("GOVERNANCE_HISTORY_MISSING");
  const replayUnavailable = failures.includes("REPLAY_UNAVAILABLE");
  const base: Omit<AdaptiveMemoryLedgerRecord, "current_hash" | "integrity_hash"> = {
    ledger_entry_id: `aml_${String(sequence).padStart(4, "0")}_${hash({ source: source.security_event_id, event, sequence }).slice(0, 24)}`,
    memory_id: source.memory_id,
    tenant_id: failures.includes("TENANT_ISOLATION_VIOLATED") ? "tenant-cross-boundary" : source.tenant_id,
    mission_id: source.mission_id,
    event_type: event,
    lifecycle_state: lifecycleStateFor(event),
    event_timestamp: EVENT_TIMESTAMP,
    actor: "AdaptiveMemoryLedger",
    evidence_refs: source.evidence_refs.length ? source.evidence_refs : refs("evidence", source, 2),
    governance_refs: missingGovernance ? [] : source.evidence_refs.length ? source.evidence_refs : refs("governance", source, 2),
    replay_refs: replayUnavailable ? [] : source.replay_refs.length ? source.replay_refs : refs("replay", source, 2),
    lineage_refs: missingLineage ? [] : refs("lineage", source, 4),
    certification_refs: refs("certification", source, 2),
    previous_hash: failures.includes("HASH_CHAIN_BROKEN") && sequence > 1 ? "broken-chain" : previous_hash,
    append_only: !failures.includes("APPEND_ONLY_VIOLATED"),
    deleted: failures.includes("LEDGER_ENTRY_DELETED"),
    immutable: !failures.includes("LEDGER_ENTRY_MODIFIED"),
    replayable: !replayUnavailable,
    tenant_isolated: !failures.includes("TENANT_ISOLATION_VIOLATED"),
    cryptographically_verified: !failures.includes("INTEGRITY_VERIFICATION_FAILED"),
  };
  const current_hash = failures.includes("LEDGER_ENTRY_MODIFIED") ? "modified-entry" : currentHashFor(base);
  return Object.freeze({ ...base, current_hash, integrity_hash: hashWithoutIntegrity({ ...base, current_hash }) });
}

function buildLedgerRecords(records: readonly MemorySecurityRecord[], failures: readonly LedgerFailure[]): readonly AdaptiveMemoryLedgerRecord[] {
  const out: AdaptiveMemoryLedgerRecord[] = [];
  let previous = GENESIS_HASH;
  let sequence = 1;
  for (const source of records) {
    for (const event of EVENT_TYPES) {
      const record = buildLedgerRecord(source, event, sequence, previous, failures);
      out.push(record);
      previous = record.current_hash;
      sequence += 1;
    }
  }
  return freezeArray(out);
}

function buildLineageRecords(records: readonly MemorySecurityRecord[], ledger: readonly AdaptiveMemoryLedgerRecord[], failures: readonly LedgerFailure[]): readonly LedgerLineageRecord[] {
  return freezeArray(records.map((record) => {
    const related = ledger.filter((entry) => entry.memory_id === record.memory_id);
    const base: Omit<LedgerLineageRecord, "integrity_hash"> = {
      lineage_id: `ledger_lineage_${hash({ memory_id: record.memory_id, tenant_id: record.tenant_id }).slice(0, 24)}`,
      memory_id: record.memory_id,
      tenant_id: failures.includes("TENANT_ISOLATION_VIOLATED") ? "tenant-cross-boundary" : record.tenant_id,
      originating_mission: record.mission_id,
      dependency_refs: failures.includes("LINEAGE_INCOMPLETE") ? [] : refs("dependency", record, 6),
      replay_refs: failures.includes("REPLAY_UNAVAILABLE") ? [] : record.replay_refs.length ? record.replay_refs : refs("replay", record, 2),
      governance_refs: failures.includes("GOVERNANCE_HISTORY_MISSING") ? [] : related.flatMap((entry) => entry.governance_refs).slice(0, 4),
      lifecycle_refs: related.map((entry) => `${entry.event_type}:${entry.lifecycle_state}`).slice(0, 8),
      security_refs: freezeArray([record.security_event_id, record.integrity_hash]),
      complete: !failures.includes("LINEAGE_INCOMPLETE"),
    };
    return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
  }));
}

function buildAuditReport(failures: readonly LedgerFailure[]): LedgerAuditReport {
  const available = !failures.includes("LEDGER_ENTRY_DELETED") && !failures.includes("LEDGER_ENTRY_MODIFIED");
  const base: Omit<LedgerAuditReport, "integrity_hash"> = {
    audit_id: `adaptive_memory_ledger_audit_${hash({ version: LEDGER_VERSION, failures }).slice(0, 24)}`,
    forensic_reconstruction_supported: available,
    governance_audit_supported: !failures.includes("GOVERNANCE_HISTORY_MISSING"),
    constitutional_audit_supported: !failures.includes("GOVERNANCE_HISTORY_MISSING"),
    replay_audit_supported: !failures.includes("REPLAY_UNAVAILABLE"),
    certification_audit_supported: available,
    lineage_audit_supported: !failures.includes("LINEAGE_INCOMPLETE"),
    integrity_audit_supported: !failures.includes("INTEGRITY_VERIFICATION_FAILED"),
    lifecycle_audit_supported: available,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function validateLedgerRecords(records: readonly AdaptiveMemoryLedgerRecord[], failures: readonly LedgerFailure[]): LedgerIntegrityValidation {
  const chainValid = records.every((record, index) => record.previous_hash === (index === 0 ? GENESIS_HASH : records[index - 1].current_hash));
  const hashesValid = records.every((record) => currentHashFor({
    ledger_entry_id: record.ledger_entry_id,
    memory_id: record.memory_id,
    tenant_id: record.tenant_id,
    mission_id: record.mission_id,
    event_type: record.event_type,
    lifecycle_state: record.lifecycle_state,
    event_timestamp: record.event_timestamp,
    actor: record.actor,
    evidence_refs: record.evidence_refs,
    governance_refs: record.governance_refs,
    replay_refs: record.replay_refs,
    lineage_refs: record.lineage_refs,
    certification_refs: record.certification_refs,
    previous_hash: record.previous_hash,
    append_only: record.append_only,
    deleted: record.deleted,
    immutable: record.immutable,
    replayable: record.replayable,
    tenant_isolated: record.tenant_isolated,
    cryptographically_verified: record.cryptographically_verified,
  }) === record.current_hash);
  const collected = freezeArray([...new Set([
    ...failures,
    ...(!hashesValid ? ["LEDGER_ENTRY_MODIFIED" as const] : []),
    ...(!chainValid ? ["HASH_CHAIN_BROKEN" as const] : []),
    ...(records.some((record) => record.deleted) ? ["LEDGER_ENTRY_DELETED" as const] : []),
    ...(records.some((record) => !record.append_only) ? ["APPEND_ONLY_VIOLATED" as const] : []),
    ...(records.some((record) => record.lineage_refs.length === 0) ? ["LINEAGE_INCOMPLETE" as const] : []),
    ...(records.some((record) => record.replay_refs.length === 0) ? ["REPLAY_UNAVAILABLE" as const] : []),
    ...(records.some((record) => record.governance_refs.length === 0) ? ["GOVERNANCE_HISTORY_MISSING" as const] : []),
    ...(records.some((record) => !record.cryptographically_verified) ? ["INTEGRITY_VERIFICATION_FAILED" as const] : []),
    ...(records.some((record) => !record.tenant_isolated) ? ["TENANT_ISOLATION_VIOLATED" as const] : []),
  ])]);
  const base: Omit<LedgerIntegrityValidation, "integrity_hash"> = {
    validation_id: `adaptive_memory_ledger_integrity_${hash({ records: records.map((record) => record.integrity_hash), collected }).slice(0, 24)}`,
    ledger_hashes_valid: hashesValid,
    chain_integrity_valid: chainValid,
    event_ordering_valid: !collected.includes("EVENT_ORDERING_INCONSISTENT"),
    lineage_consistent: !collected.includes("LINEAGE_INCOMPLETE"),
    replay_consistent: !collected.includes("REPLAY_UNAVAILABLE"),
    write_consistent: !collected.includes("APPEND_ONLY_VIOLATED") && !collected.includes("LEDGER_ENTRY_DELETED"),
    cryptographic_verification_valid: !collected.includes("INTEGRITY_VERIFICATION_FAILED"),
    failures: collected,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildMetrics(records: readonly AdaptiveMemoryLedgerRecord[], validation: LedgerIntegrityValidation): AdaptiveMemoryLedgerMetrics {
  const base: Omit<AdaptiveMemoryLedgerMetrics, "integrity_hash"> = {
    ledger_writes: records.length,
    ledger_latency_ms: 7,
    replay_requests: records.filter((record) => record.event_type === "REPLAY_EXECUTION").length,
    replay_success: validation.replay_consistent ? 1 : 0,
    integrity_verification_rate: validation.ledger_hashes_valid && validation.cryptographic_verification_valid ? 1 : 0,
    chain_validation_failures: validation.chain_integrity_valid ? 0 : 1,
    lineage_completeness: validation.lineage_consistent ? 1 : 0,
    governance_events: records.filter((record) => record.event_type === "GOVERNANCE_REVIEW").length,
    lifecycle_events: records.filter((record) => ["SUPERSESSION", "EXPIRATION", "ARCHIVAL", "RESTORATION"].includes(record.event_type)).length,
    security_events: records.filter((record) => record.event_type === "SECURITY_EVENT").length,
    failures: validation.failures,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function resultReplayHash(result: Omit<AdaptiveMemoryLedgerResult, "integrity_hash" | "replay_hash">): string {
  return hash({
    security_hash: result.security_result.integrity_hash,
    contract_hash: result.contract.integrity_hash,
    ledger_hashes: result.ledger_records.map((record) => record.integrity_hash),
    lineage_hashes: result.lineage_records.map((record) => record.integrity_hash),
    audit_hash: result.audit_report.integrity_hash,
    validation_hash: result.integrity_validation.integrity_hash,
    metrics_hash: result.metrics.integrity_hash,
    status: result.status,
    failures: result.failures,
  });
}

function resultIntegrityHash(result: Omit<AdaptiveMemoryLedgerResult, "integrity_hash">): string {
  return hash({
    version: result.adaptive_memory_ledger_version,
    ledger_identifier: result.ledger_identifier,
    api_surface_hash: result.api_surface.integrity_hash,
    replay_hash: result.replay_hash,
    contract_hash: result.contract.integrity_hash,
  });
}

function verifyHashedRecord(value: { integrity_hash: string }): boolean {
  return hashWithoutIntegrity(value) === value.integrity_hash;
}

function verifyLedgerRecord(record: AdaptiveMemoryLedgerRecord): boolean {
  const { current_hash, integrity_hash: _integrityHash, ...base } = record;
  return currentHashFor(base) === current_hash && verifyHashedRecord(record);
}

export function establishAdaptiveMemoryLedger(input: AdaptiveMemoryLedgerInput = {}): AdaptiveMemoryLedgerResult {
  const scenario = input.scenario ?? "BASELINE";
  const api_surface = buildApiSurface();
  const security_result = input.security_result ?? establishAdaptiveMemorySecurityIntegrity();
  const initialFailures = collectFailures(scenario, replayAdaptiveMemorySecurityIntegrity(security_result));
  const contract = buildContract();
  const ledger_records = buildLedgerRecords(security_result.security_records, initialFailures);
  const lineage_records = buildLineageRecords(security_result.security_records, ledger_records, initialFailures);
  const audit_report = buildAuditReport(initialFailures);
  const integrity_validation = validateLedgerRecords(ledger_records, initialFailures);
  const failures = integrity_validation.failures;
  const metrics = buildMetrics(ledger_records, integrity_validation);
  const base: Omit<AdaptiveMemoryLedgerResult, "integrity_hash" | "replay_hash"> = {
    adaptive_memory_ledger_version: LEDGER_VERSION,
    ledger_identifier: LEDGER_IDENTIFIER,
    status: failures.length ? "REJECTED" : "AUTHORITATIVE",
    api_surface,
    security_result,
    contract,
    ledger_records,
    lineage_records,
    audit_report,
    integrity_validation,
    metrics,
    failures,
    deterministic: !failures.includes("EVENT_ORDERING_INCONSISTENT"),
    replayable: !failures.includes("REPLAY_UNAVAILABLE"),
    append_only: !failures.includes("APPEND_ONLY_VIOLATED"),
    immutable: !failures.includes("LEDGER_ENTRY_MODIFIED") && !failures.includes("LEDGER_ENTRY_DELETED"),
    hash_chain_valid: !failures.includes("HASH_CHAIN_BROKEN"),
    lineage_complete: !failures.includes("LINEAGE_INCOMPLETE"),
    governance_history_preserved: !failures.includes("GOVERNANCE_HISTORY_MISSING"),
    tenant_isolation_enforced: !failures.includes("TENANT_ISOLATION_VIOLATED"),
  };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function replayAdaptiveMemoryLedger(result: AdaptiveMemoryLedgerResult): boolean {
  return (
    verifyHashedRecord(result.api_surface) &&
    replayAdaptiveMemorySecurityIntegrity(result.security_result) &&
    verifyHashedRecord(result.contract) &&
    result.ledger_records.every(verifyLedgerRecord) &&
    result.ledger_records.every((record, index) => record.previous_hash === (index === 0 ? GENESIS_HASH : result.ledger_records[index - 1].current_hash)) &&
    result.lineage_records.every(verifyHashedRecord) &&
    verifyHashedRecord(result.audit_report) &&
    verifyHashedRecord(result.integrity_validation) &&
    verifyHashedRecord(result.metrics) &&
    resultReplayHash(result) === result.replay_hash &&
    resultIntegrityHash(result) === result.integrity_hash
  );
}

export function getAdaptiveMemoryLedger(): AdaptiveMemoryLedgerSystem {
  const api_surface = buildApiSurface();
  return Object.freeze({
    adaptive_memory_ledger_version: LEDGER_VERSION,
    supported_event_types: EVENT_TYPES,
    api_surface,
    result: establishAdaptiveMemoryLedger(),
  });
}

export const AdaptiveMemoryLedger = Object.freeze({
  establish: establishAdaptiveMemoryLedger,
  replay: replayAdaptiveMemoryLedger,
});
