import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import { evaluateAssuranceState, validateAssuranceState } from "@/services/assurance-state-manager";
import type { AssuranceStateRecord, AssuranceStateScenario } from "@/types/assurance-state-manager";
import type {
  RuntimeAssuranceLedgerContract,
  RuntimeLedgerAuditIndex,
  RuntimeLedgerCertification,
  RuntimeLedgerChainRecord,
  RuntimeLedgerEvidenceRecord,
  RuntimeLedgerEvidenceType,
  RuntimeLedgerFailure,
  RuntimeLedgerInput,
  RuntimeLedgerLifecycleStage,
  RuntimeLedgerPackage,
  RuntimeLedgerPublisherSurface,
  RuntimeLedgerReplayResult,
  RuntimeLedgerScenario,
  RuntimeLedgerScenarioMap,
  RuntimeLedgerValidationResult,
} from "@/types/runtime-assurance-ledger";

const NOW = "2026-07-02T18:00:00.000Z";
const VERSION = "runtime-assurance-ledger/v8ALT.1G" as const;
const lifecycle: readonly RuntimeLedgerLifecycleStage[] = Object.freeze(["CREATE_RECORD", "VALIDATE_RECORD", "VERIFY_GOVERNANCE", "VERIFY_CONSTITUTION", "VERIFY_INTEGRITY", "GENERATE_HASH", "APPEND_LEDGER", "VALIDATE_REPLAY", "PUBLISH_RECORD"]);
const evidenceTypes: readonly RuntimeLedgerEvidenceType[] = Object.freeze(["RUNTIME_ASSURANCE", "DRIFT_INTELLIGENCE", "RECOMMENDATION", "GOVERNANCE", "CONSTITUTIONAL", "REPLAY", "INTEGRITY"]);
const scenarioMap: RuntimeLedgerScenarioMap = Object.freeze({
  BASELINE: "BASELINE",
  MISSING_RECORD: "BASELINE",
  ORPHANED_LINEAGE: "BASELINE",
  REPLAY_DIVERGENENCE: "REPLAY_MISMATCH",
  BROKEN_HASH_CHAIN: "INTEGRITY_FAILURE",
  INTEGRITY_MISMATCH: "INTEGRITY_FAILURE",
  DUPLICATE_ENTRY: "BASELINE",
  OUT_OF_ORDER_INSERTION: "BASELINE",
  UNAUTHORIZED_MODIFICATION: "BASELINE",
  CROSS_TENANT_CONTAMINATION: "BASELINE",
  EXECUTION_AUTHORITY_ATTEMPT: "EXECUTION_AUTHORITY_ATTEMPT",
});

function hashValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}
function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function unique<T extends string>(values: readonly T[]): readonly T[] { return freezeArray([...new Set(values)].sort()); }
function id(prefix: string, domain: string, value: unknown): string { return `${prefix}-${hashValue(domain, value).slice(0, 12).toUpperCase()}`; }

function scenarioFailure(scenario: RuntimeLedgerScenario): RuntimeLedgerFailure | null {
  const map: Partial<Record<RuntimeLedgerScenario, RuntimeLedgerFailure>> = {
    MISSING_RECORD: "MISSING_RECORD",
    ORPHANED_LINEAGE: "ORPHANED_LINEAGE",
    REPLAY_DIVERGENENCE: "REPLAY_DIVERGENCE",
    BROKEN_HASH_CHAIN: "BROKEN_HASH_CHAIN",
    INTEGRITY_MISMATCH: "INTEGRITY_MISMATCH",
    DUPLICATE_ENTRY: "DUPLICATE_ENTRY",
    OUT_OF_ORDER_INSERTION: "OUT_OF_ORDER_INSERTION",
    UNAUTHORIZED_MODIFICATION: "UNAUTHORIZED_MODIFICATION",
    CROSS_TENANT_CONTAMINATION: "CROSS_TENANT_CONTAMINATION",
    EXECUTION_AUTHORITY_ATTEMPT: "UNAUTHORIZED_EXECUTION_CAPABILITY",
  };
  return map[scenario] ?? null;
}

export function computeRuntimeLedgerPackageHash(pkg: Omit<RuntimeLedgerPackage, "ledger_hash"> | RuntimeLedgerPackage): string {
  const { ledger_hash: _hash, ...source } = pkg as RuntimeLedgerPackage;
  return hashValue("runtime-assurance-ledger-package", source);
}

function entryHashSource(state: AssuranceStateRecord, sequence: number, previousHash: string, scenario: RuntimeLedgerScenario) {
  return {
    ledger_entry_id: id("RLE", "runtime-ledger-entry-id", { state: state.assurance_state_id, sequence, scenario }),
    assurance_id: state.assurance_state_id,
    mission_id: state.mission_id,
    execution_id: state.execution_id,
    tenant_id: scenario === "CROSS_TENANT_CONTAMINATION" ? "tenant:other" : state.tenant_id,
    assurance_state: state.current_state,
    confidence_score: state.confidence_score,
    runtime_health_score: state.runtime_health_score,
    detected_drift: freezeArray([state.drift_severity]),
    detected_risks: freezeArray(state.state_history.flatMap((item) => item.triggering_events)),
    recommendations: freezeArray([state.recommended_action]),
    governance_evidence: freezeArray([state.governance_validation, ...state.state_history.map((item) => item.governance_snapshot)]),
    constitutional_evidence: freezeArray([state.constitutional_validation, ...state.state_history.map((item) => item.constitutional_snapshot)]),
    replay_reference: scenario === "REPLAY_DIVERGENENCE" ? "" : state.replay_reference,
    lineage_reference: scenario === "ORPHANED_LINEAGE" ? "" : state.lineage_reference,
    previous_integrity_hash: previousHash,
    ledger_sequence: scenario === "OUT_OF_ORDER_INSERTION" ? 0 : sequence,
    created_timestamp: NOW,
    record_version: VERSION,
    append_only: true as const,
    immutable: scenario !== "UNAUTHORIZED_MODIFICATION",
  };
}

function ledgerEntry(state: AssuranceStateRecord, sequence: number, previousHash: string, scenario: RuntimeLedgerScenario) {
  const source = entryHashSource(state, sequence, previousHash, scenario);
  const integrity_hash = scenario === "INTEGRITY_MISMATCH" ? "mismatch" : hashValue("runtime-ledger-entry-integrity", source);
  const withIntegrity = { ...source, integrity_hash };
  return Object.freeze({ ...withIntegrity, entry_hash: hashValue("runtime-ledger-entry", withIntegrity) });
}

function evidenceRecord(entryId: string, type: RuntimeLedgerEvidenceType, state: AssuranceStateRecord, scenario: RuntimeLedgerScenario): RuntimeLedgerEvidenceRecord {
  const source = {
    evidence_record_id: id("RLEV", "runtime-ledger-evidence-id", { entryId, type }),
    ledger_entry_id: entryId,
    evidence_type: type,
    source_system: `phase-8alt-1g:${type.toLowerCase()}`,
    description: `${type} evidence preserved for runtime assurance ledger.`,
    verification_status: scenario === "INTEGRITY_MISMATCH" ? "FAILED" as const : "VERIFIED" as const,
    governance_reference: `governance:${state.governance_validation}`,
    constitutional_reference: `constitutional:${state.constitutional_validation}`,
    lineage_reference: scenario === "ORPHANED_LINEAGE" ? "" : state.lineage_reference,
    replay_reference: scenario === "REPLAY_DIVERGENENCE" ? "" : state.replay_reference,
    integrity_hash: hashValue("runtime-ledger-evidence-integrity", { entryId, type, state: state.record_hash }),
  };
  return Object.freeze({ ...source, evidence_hash: hashValue("runtime-ledger-evidence", source) });
}

function chainRecord(previous: string, current: string, status: RuntimeLedgerChainRecord["chain_status"]): RuntimeLedgerChainRecord {
  const source = {
    chain_id: id("RLC", "runtime-ledger-chain-id", { previous, current }),
    previous_entry: previous,
    current_entry: current,
    hash_algorithm: "SHA-256" as const,
    chain_status: status,
    verification_timestamp: NOW,
    verified_by: VERSION,
  };
  return Object.freeze({ ...source, chain_hash: hashValue("runtime-ledger-chain", source) });
}

function auditIndex(ledgerId: string, state: AssuranceStateRecord, entries: RuntimeLedgerPackage["entries"], evidence: readonly RuntimeLedgerEvidenceRecord[]): RuntimeLedgerAuditIndex {
  const source = {
    audit_index_id: id("RLA", "runtime-ledger-audit-id", ledgerId),
    tenant_id: state.tenant_id,
    mission_id: state.mission_id,
    execution_id: state.execution_id,
    ledger_entries: freezeArray(entries.map((entry) => entry.ledger_entry_id)),
    evidence_records: freezeArray(evidence.map((item) => item.evidence_record_id)),
    governance_records: freezeArray(evidence.filter((item) => item.evidence_type === "GOVERNANCE").map((item) => item.evidence_record_id)),
    constitutional_records: freezeArray(evidence.filter((item) => item.evidence_type === "CONSTITUTIONAL").map((item) => item.evidence_record_id)),
    replay_records: freezeArray(evidence.filter((item) => item.evidence_type === "REPLAY").map((item) => item.evidence_record_id)),
    integrity_records: freezeArray(evidence.filter((item) => item.evidence_type === "INTEGRITY").map((item) => item.evidence_record_id)),
  };
  return Object.freeze({ ...source, audit_hash: hashValue("runtime-ledger-audit-index", source) });
}

export function appendRuntimeAssuranceLedger(input: RuntimeLedgerInput = {}): RuntimeLedgerPackage {
  const scenario = input.scenario ?? "BASELINE";
  const state = input.state ?? evaluateAssuranceState({ scenario: scenarioMap[scenario] as AssuranceStateScenario });
  const previousHash = hashValue("runtime-ledger-genesis", { tenant: state.tenant_id, mission: state.mission_id });
  const first = ledgerEntry(state, 1, previousHash, scenario);
  const entries = scenario === "MISSING_RECORD" ? freezeArray([]) : scenario === "DUPLICATE_ENTRY" ? freezeArray([first, first]) : freezeArray([first]);
  const evidence = freezeArray(entries.flatMap((entry) => evidenceTypes.map((type) => evidenceRecord(entry.ledger_entry_id, type, state, scenario))));
  const chainStatus = scenario === "BROKEN_HASH_CHAIN" || scenario === "INTEGRITY_MISMATCH" ? "BROKEN" as const : "VALID" as const;
  const chain = freezeArray(entries.map((entry) => chainRecord(entry.previous_integrity_hash, entry.integrity_hash, chainStatus)));
  const ledgerId = id("RLG", "runtime-assurance-ledger-id", { scenario, state: state.record_hash });
  const base = {
    ledger_id: ledgerId,
    ledger_version: VERSION,
    lifecycle,
    entries,
    evidence_registry: evidence,
    chain,
    audit_index: auditIndex(ledgerId, state, entries, evidence),
    append_only: true as const,
    immutable: scenario !== "UNAUTHORIZED_MODIFICATION",
    deterministic_ordering: scenario !== "OUT_OF_ORDER_INSERTION",
    execution_authorized: scenario === "EXECUTION_AUTHORITY_ATTEMPT",
    execution_modified: false,
    historical_records_modified: scenario === "UNAUTHORIZED_MODIFICATION",
  };
  return Object.freeze({ ...base, ledger_hash: computeRuntimeLedgerPackageHash(base as Omit<RuntimeLedgerPackage, "ledger_hash">) });
}

export function replayRuntimeAssuranceLedger(pkg = appendRuntimeAssuranceLedger()): RuntimeLedgerReplayResult {
  const deterministic = computeRuntimeLedgerPackageHash(pkg) === pkg.ledger_hash && pkg.deterministic_ordering;
  const source = {
    replay_id: id("RLR", "runtime-ledger-replay-id", pkg.ledger_id),
    ledger_id: pkg.ledger_id,
    deterministic,
    reconstructed_entry_order: freezeArray(pkg.entries.map((entry) => entry.ledger_entry_id)),
    reconstructed_ledger_hash: computeRuntimeLedgerPackageHash(pkg),
    reconstructed_chain_hashes: freezeArray(pkg.chain.map((item) => item.chain_hash)),
    replay_failures: deterministic ? freezeArray<RuntimeLedgerFailure>([]) : freezeArray<RuntimeLedgerFailure>(["REPLAY_DIVERGENCE"]),
  };
  return Object.freeze({ ...source, replay_hash: hashValue("runtime-ledger-replay", source) });
}

export function validateRuntimeAssuranceLedger(pkg?: RuntimeLedgerPackage): RuntimeLedgerValidationResult {
  if (!pkg) {
    const failures = freezeArray<RuntimeLedgerFailure>(["MISSING_RECORD"]);
    const source = { ledger_id: null, valid: false, records_complete: false, append_only: false, immutable: false, ordering_valid: false, evidence_valid: false, lineage_valid: false, integrity_chain_valid: false, replay_valid: false, governance_valid: false, constitutional_valid: false, tenant_isolated: false, execution_safe: false, failures };
    return Object.freeze({ ...source, validation_hash: hashValue("runtime-ledger-validation", source) });
  }
  const records_complete = pkg.entries.length > 0 && pkg.entries.every((entry) => entry.assurance_id && entry.mission_id && entry.execution_id && entry.tenant_id && entry.replay_reference && entry.lineage_reference && entry.integrity_hash && entry.created_timestamp);
  const append_only = pkg.append_only && pkg.entries.every((entry) => entry.append_only);
  const immutable = pkg.immutable && pkg.entries.every((entry) => entry.immutable) && !pkg.historical_records_modified;
  const ordering_valid = pkg.deterministic_ordering && pkg.entries.every((entry, index) => entry.ledger_sequence === index + 1);
  const evidence_valid = pkg.evidence_registry.length >= pkg.entries.length * evidenceTypes.length && pkg.evidence_registry.every((item) => item.verification_status === "VERIFIED" && item.integrity_hash && item.replay_reference && item.lineage_reference);
  const lineage_valid = pkg.entries.every((entry) => entry.lineage_reference) && pkg.evidence_registry.every((item) => item.lineage_reference);
  const integrity_chain_valid = pkg.chain.length === pkg.entries.length && pkg.chain.every((item) => item.chain_status === "VALID") && pkg.entries.every((entry) => entry.integrity_hash !== "mismatch");
  const replay_valid = replayRuntimeAssuranceLedger(pkg).deterministic;
  const governance_valid = pkg.evidence_registry.some((item) => item.evidence_type === "GOVERNANCE");
  const constitutional_valid = pkg.evidence_registry.some((item) => item.evidence_type === "CONSTITUTIONAL");
  const tenantIds = new Set(pkg.entries.map((entry) => entry.tenant_id));
  const tenant_isolated = tenantIds.size <= 1 && [...tenantIds].every((tenant) => tenant.startsWith("tenant:")) && (!pkg.audit_index.tenant_id || tenantIds.has(pkg.audit_index.tenant_id));
  const execution_safe = !pkg.execution_authorized && !pkg.execution_modified;
  const duplicate = new Set(pkg.entries.map((entry) => entry.ledger_entry_id)).size !== pkg.entries.length;
  const failures = unique([
    ...(!records_complete ? ["MISSING_RECORD" as const] : []),
    ...(!append_only ? ["LEDGER_CORRUPTION" as const] : []),
    ...(!immutable ? ["UNAUTHORIZED_MODIFICATION" as const] : []),
    ...(!ordering_valid ? ["OUT_OF_ORDER_INSERTION" as const] : []),
    ...(!evidence_valid ? ["INTEGRITY_MISMATCH" as const] : []),
    ...(!lineage_valid ? ["ORPHANED_LINEAGE" as const] : []),
    ...(!integrity_chain_valid ? ["BROKEN_HASH_CHAIN" as const] : []),
    ...(!replay_valid || computeRuntimeLedgerPackageHash(pkg) !== pkg.ledger_hash ? ["REPLAY_DIVERGENCE" as const] : []),
    ...(!governance_valid ? ["GOVERNANCE_VALIDATION_FAILURE" as const] : []),
    ...(!constitutional_valid ? ["CONSTITUTIONAL_VALIDATION_FAILURE" as const] : []),
    ...(!tenant_isolated ? ["CROSS_TENANT_CONTAMINATION" as const] : []),
    ...(!execution_safe ? ["UNAUTHORIZED_EXECUTION_CAPABILITY" as const] : []),
    ...(duplicate ? ["DUPLICATE_ENTRY" as const] : []),
  ]);
  const valid = records_complete && append_only && immutable && ordering_valid && evidence_valid && lineage_valid && integrity_chain_valid && replay_valid && governance_valid && constitutional_valid && tenant_isolated && execution_safe && !duplicate && failures.length === 0;
  const source = { ledger_id: pkg.ledger_id, valid, records_complete, append_only, immutable, ordering_valid, evidence_valid, lineage_valid, integrity_chain_valid, replay_valid, governance_valid, constitutional_valid, tenant_isolated, execution_safe, failures };
  return Object.freeze({ ...source, validation_hash: hashValue("runtime-ledger-validation", source) });
}

export function certifyRuntimeAssuranceLedger(pkg = appendRuntimeAssuranceLedger()): RuntimeLedgerCertification {
  const validation = validateRuntimeAssuranceLedger(pkg);
  const source = { certification_id: id("RLCERT", "runtime-ledger-certification-id", pkg.ledger_id), ledger_id: pkg.ledger_id, certified: validation.valid, validation, authoritative_historical_record: validation.valid };
  return Object.freeze({ ...source, certification_hash: hashValue("runtime-ledger-certification", source) });
}

export function publishRuntimeAssuranceLedger(pkg = appendRuntimeAssuranceLedger()): RuntimeLedgerPublisherSurface {
  return Object.freeze({
    ledger_id: pkg.ledger_id,
    entries: pkg.entries.length,
    evidence_records: pkg.evidence_registry.length,
    chain_status: pkg.chain.every((item) => item.chain_status === "VALID") ? "VALID" : "BROKEN",
    audit_ready: validateRuntimeAssuranceLedger(pkg).valid,
    deterministic_ordering: true,
    append_only: true,
    ledger_hash: pkg.ledger_hash,
  });
}

export function getRuntimeAssuranceLedgerContract(): RuntimeAssuranceLedgerContract {
  const pkg = appendRuntimeAssuranceLedger();
  return Object.freeze({
    doctrine: Object.freeze({
      ledger_version: VERSION,
      principles: freezeArray(["append-only", "immutable", "deterministically-ordered", "replay-compatible", "cryptographically-verifiable", "tenant-isolated", "governance-protected", "certification-ready"]),
      lifecycle,
      evidence_types: evidenceTypes,
      restrictions: freezeArray(["cannot modify runtime execution", "cannot alter committed historical records", "cannot reorder committed records", "cannot delete committed records"]),
    }),
    package: pkg,
    validation: validateRuntimeAssuranceLedger(pkg),
    replay: replayRuntimeAssuranceLedger(pkg),
    certification: certifyRuntimeAssuranceLedger(pkg),
  });
}
