import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import { validateKnowledgeGovernance } from "@/services/knowledge-validation-governance-engine";
import type { KnowledgeValidationRecord, KnowledgeValidationRepository } from "@/types/knowledge-validation-governance-engine";
import type {
  EvolutionLedgerEntry,
  KnowledgeLedgerEventType,
  KnowledgeLineageEdge,
  KnowledgeRepositoryAuditRecord,
  KnowledgeRepositoryEvolutionLedgerBundle,
  KnowledgeRepositoryFailure,
  KnowledgeRepositoryInput,
  KnowledgeRepositoryLifecycleState,
  KnowledgeRepositoryObservabilitySurface,
  KnowledgeRepositoryProjection,
  KnowledgeRepositoryRecord,
  KnowledgeRepositoryScenario,
  KnowledgeRepositoryValidationResult,
} from "@/types/knowledge-repository-evolution-ledger";

const VERSION = "knowledge-repository-evolution-ledger/v8ALT.9.8" as const;
const lifecycleStates = Object.freeze(["RECEIVED", "STORED", "VERSIONED", "READY_FOR_OPERATOR_APPROVAL", "SUPERSEDED", "RETIRED", "ARCHIVED", "REJECTED"] as const);
const eventTypes = Object.freeze(["ARTIFACT_RECEIVED", "ARTIFACT_STORED", "VERSION_RECORDED", "READY_FOR_OPERATOR_APPROVAL", "REPOSITORY_OPERATION_REJECTED"] as const);

function hashValue(domain: string, value: unknown): string { return hashConfidenceValue(domain, canonicalizeConfidenceToString(value)); }
function id(prefix: string, domain: string, value: unknown): string { return `${prefix}-${hashValue(domain, value).slice(0, 12).toUpperCase()}`; }
function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function unique<T extends string>(values: readonly T[]): readonly T[] { return freezeArray([...new Set(values)].sort()); }

function scenarioFailure(scenario: KnowledgeRepositoryScenario): KnowledgeRepositoryFailure | null {
  const map: Partial<Record<KnowledgeRepositoryScenario, KnowledgeRepositoryFailure>> = {
    DUPLICATE_IDENTIFIER: "DUPLICATE_IDENTIFIER_DETECTED",
    MISSING_VALIDATION: "VALIDATION_MISSING",
    MISSING_CERTIFICATION_ELIGIBILITY: "CERTIFICATION_ELIGIBILITY_MISSING",
    INCOMPLETE_LINEAGE: "INCOMPLETE_LINEAGE_DETECTED",
    MISSING_REPLAY_REFERENCE: "REPLAY_REFERENCE_MISSING",
    INTEGRITY_FAILURE: "INTEGRITY_FAILURE_DETECTED",
    GOVERNANCE_VIOLATION: "GOVERNANCE_VIOLATION_DETECTED",
    CONSTITUTIONAL_VIOLATION: "CONSTITUTIONAL_VIOLATION_DETECTED",
    AUTHORITY_CONFLICT: "AUTHORITY_CONFLICT_DETECTED",
    CORRUPTED_VERSION: "CORRUPTED_VERSION_DETECTED",
    OVERWRITE_ATTEMPT: "OVERWRITE_ATTEMPT_REJECTED",
    DELETE_ATTEMPT: "DELETE_ATTEMPT_REJECTED",
    HISTORICAL_REWRITE_ATTEMPT: "HISTORICAL_REWRITE_REJECTED",
    ACTIVATION_ATTEMPT: "ACTIVATION_ATTEMPT_REJECTED",
    APPROVAL_BYPASS_ATTEMPT: "APPROVAL_BYPASS_REJECTED",
    CROSS_TENANT_ACCESS_ATTEMPT: "CROSS_TENANT_ACCESS_REJECTED",
  };
  return map[scenario] ?? null;
}

function sourceRepository(scenario: KnowledgeRepositoryScenario, repository?: KnowledgeValidationRepository): KnowledgeValidationRepository {
  if (repository) return repository;
  if (scenario === "MISSING_VALIDATION") return validateKnowledgeGovernance({ scenario: "INVALID_SCHEMA" });
  if (scenario === "INCOMPLETE_LINEAGE") return validateKnowledgeGovernance({ scenario: "LINEAGE_BREAK" });
  if (scenario === "MISSING_REPLAY_REFERENCE") return validateKnowledgeGovernance({ scenario: "REPLAY_MISMATCH" });
  if (scenario === "INTEGRITY_FAILURE") return validateKnowledgeGovernance({ scenario: "INTEGRITY_FAILURE" });
  if (scenario === "GOVERNANCE_VIOLATION") return validateKnowledgeGovernance({ scenario: "GOVERNANCE_VIOLATION" });
  if (scenario === "CONSTITUTIONAL_VIOLATION") return validateKnowledgeGovernance({ scenario: "CONSTITUTIONAL_VIOLATION" });
  if (scenario === "AUTHORITY_CONFLICT") return validateKnowledgeGovernance({ scenario: "AUTHORITY_CONFLICT" });
  if (scenario === "CROSS_TENANT_ACCESS_ATTEMPT") return validateKnowledgeGovernance({ scenario: "TENANT_ISOLATION_FAILURE" });
  return validateKnowledgeGovernance();
}

function buildRecord(record: KnowledgeValidationRecord, index: number, scenario: KnowledgeRepositoryScenario): KnowledgeRepositoryRecord {
  const duplicate = scenario === "DUPLICATE_IDENTIFIER" && index > 0;
  const corruptedVersion = scenario === "CORRUPTED_VERSION" && index === 0;
  const base = {
    knowledge_id: duplicate ? id("KNO", "knowledge-repository-record", { first: true }) : id("KNO", "knowledge-repository-record", { validation: record.validation_id, index, scenario }),
    source_validation_id: record.validation_id,
    artifact_name: `Stored knowledge ${index + 1}`,
    artifact_type: "CANDIDATE_KNOWLEDGE_ARTIFACT",
    semantic_version: corruptedVersion ? "corrupted" : `1.0.${index}`,
    tenant_id: scenario === "CROSS_TENANT_ACCESS_ATTEMPT" && index === 0 ? "tenant:foreign" : record.tenant_id,
    lifecycle_state: "READY_FOR_OPERATOR_APPROVAL" as const,
    certification_state: "READY_FOR_CERTIFICATION" as const,
    approval_state: "OPERATOR_APPROVAL_REQUIRED" as const,
    activation_state: "INACTIVE" as const,
    contributing_missions: freezeArray([`mission:${record.artifact_id}`]),
    contributing_patterns: freezeArray([record.artifact_id]),
    contributing_replays: record.replay_reference,
    parent_version: null,
    evidence_chain: record.evidence_chain,
    replay_reference: scenario === "MISSING_REPLAY_REFERENCE" && index === 0 ? freezeArray([]) : record.replay_reference,
    lineage_reference: scenario === "INCOMPLETE_LINEAGE" && index === 0 ? freezeArray([]) : record.lineage_reference,
    governance_validation: scenario === "GOVERNANCE_VIOLATION" && index === 0 ? "FAIL" as const : "PASS" as const,
    constitutional_validation: scenario === "CONSTITUTIONAL_VIOLATION" && index === 0 ? "FAIL" as const : "PASS" as const,
    authority_validation: scenario === "AUTHORITY_CONFLICT" && index === 0 ? "FAIL" as const : "PASS" as const,
    creation_timestamp: "1970-01-01T00:00:00.000Z" as const,
    certification_timestamp: null,
    approval_timestamp: null,
    activation_timestamp: null,
    explanation: freezeArray(["validated artifact stored as append-only projection", "operator approval remains required", "activation is blocked in repository phase"]),
    append_only: true as const,
    immutable: true as const,
    activation_authorized: scenario === "ACTIVATION_ATTEMPT" && index === 0,
    operator_approval_bypass_authorized: scenario === "APPROVAL_BYPASS_ATTEMPT" && index === 0,
    governance_modification_authorized: false,
    historical_rewrite_authorized: scenario === "HISTORICAL_REWRITE_ATTEMPT" && index === 0,
    delete_authorized: scenario === "DELETE_ATTEMPT" && index === 0,
  };
  const deterministic_signature = hashValue("knowledge-repository-signature", base);
  return Object.freeze({ ...base, deterministic_signature, integrity_hash: scenario === "INTEGRITY_FAILURE" && index === 0 ? "" : hashValue("knowledge-repository-record", { ...base, deterministic_signature }) });
}

function ledger(record: KnowledgeRepositoryRecord, sequence: number, event_type: KnowledgeLedgerEventType): EvolutionLedgerEntry {
  const base = { ledger_entry_id: id("KLE", "knowledge-ledger-entry", { knowledge: record.knowledge_id, sequence, event_type }), knowledge_id: record.knowledge_id, event_type, event_sequence: sequence, previous_version: null, new_version: record.semantic_version, governance_reference: `governance:${record.knowledge_id}`, replay_reference: record.replay_reference[0] ?? "", operator_reference: "OPERATOR_APPROVAL_REQUIRED" as const, timestamp: "1970-01-01T00:00:00.000Z" as const };
  return Object.freeze({ ...base, integrity_hash: hashValue("knowledge-ledger-entry", base) });
}

function lineage(record: KnowledgeRepositoryRecord): KnowledgeLineageEdge {
  const base = { lineage_edge_id: id("KLG", "knowledge-lineage-edge", record.knowledge_id), knowledge_id: record.knowledge_id, source_validation_id: record.source_validation_id, evidence_chain: record.evidence_chain, replay_reference: record.replay_reference, parent_version: record.parent_version };
  return Object.freeze({ ...base, integrity_hash: hashValue("knowledge-lineage-edge", base) });
}

function audit(failure: KnowledgeRepositoryFailure, scenario: KnowledgeRepositoryScenario): KnowledgeRepositoryAuditRecord {
  const base = { audit_id: id("KRA", "knowledge-repository-audit", { failure, scenario }), knowledge_id: null, rejection_reason: failure, immutable: true as const, append_only: true as const, replay_reference: `replay:repository:${failure}` };
  return Object.freeze({ ...base, integrity_hash: hashValue("knowledge-repository-audit", base) });
}

function collectFailures(repository: Omit<KnowledgeRepositoryProjection, "integrity_hash"> | KnowledgeRepositoryProjection): readonly KnowledgeRepositoryFailure[] {
  const ids = repository.records.map((record) => record.knowledge_id);
  return unique([
    ...repository.failures,
    ...(new Set(ids).size !== ids.length ? ["DUPLICATE_IDENTIFIER_DETECTED" as const] : []),
    ...(repository.records.length === 0 ? ["VALIDATION_MISSING" as const] : []),
    ...(repository.records.some((r) => r.certification_state !== "READY_FOR_CERTIFICATION") ? ["CERTIFICATION_ELIGIBILITY_MISSING" as const] : []),
    ...(repository.records.some((r) => r.lineage_reference.length === 0) ? ["INCOMPLETE_LINEAGE_DETECTED" as const] : []),
    ...(repository.records.some((r) => r.replay_reference.length === 0) ? ["REPLAY_REFERENCE_MISSING" as const] : []),
    ...(repository.records.some((r) => !r.integrity_hash || !r.deterministic_signature) ? ["INTEGRITY_FAILURE_DETECTED" as const] : []),
    ...(repository.records.some((r) => r.governance_validation === "FAIL" || r.governance_modification_authorized) ? ["GOVERNANCE_VIOLATION_DETECTED" as const] : []),
    ...(repository.records.some((r) => r.constitutional_validation === "FAIL") ? ["CONSTITUTIONAL_VIOLATION_DETECTED" as const] : []),
    ...(repository.records.some((r) => r.authority_validation === "FAIL") ? ["AUTHORITY_CONFLICT_DETECTED" as const] : []),
    ...(repository.records.some((r) => !/^\d+\.\d+\.\d+$/.test(r.semantic_version)) ? ["CORRUPTED_VERSION_DETECTED" as const] : []),
    ...(repository.records.some((r) => r.historical_rewrite_authorized) ? ["HISTORICAL_REWRITE_REJECTED" as const] : []),
    ...(repository.records.some((r) => r.delete_authorized) ? ["DELETE_ATTEMPT_REJECTED" as const] : []),
    ...(repository.records.some((r) => r.activation_authorized) ? ["ACTIVATION_ATTEMPT_REJECTED" as const] : []),
    ...(repository.records.some((r) => r.operator_approval_bypass_authorized) ? ["APPROVAL_BYPASS_REJECTED" as const] : []),
    ...(repository.records.some((r) => r.tenant_id !== "tenant:alpha") ? ["CROSS_TENANT_ACCESS_REJECTED" as const] : []),
  ]);
}

export function storeKnowledgeRepository(input: KnowledgeRepositoryInput = {}): KnowledgeRepositoryProjection {
  if (input.repository) return input.repository;
  const scenario = input.scenario ?? "BASELINE";
  const validationRepository = sourceRepository(scenario, input.validationRepository);
  const injected = scenarioFailure(scenario);
  const ready = validationRepository.readiness_records.filter((record) => record.readiness_state === "READY_FOR_CERTIFICATION");
  const records = freezeArray(ready.map((record, index) => buildRecord(record, index, scenario)));
  const ledger_entries = freezeArray(records.flatMap((record, index) => [
    ledger(record, index * 4 + 1, "ARTIFACT_RECEIVED"),
    ledger(record, index * 4 + 2, "ARTIFACT_STORED"),
    ledger(record, index * 4 + 3, "VERSION_RECORDED"),
    ledger(record, index * 4 + 4, "READY_FOR_OPERATOR_APPROVAL"),
  ]));
  const source = { repository_id: id("KRL", "knowledge-repository-ledger", { source: validationRepository.repository_id, scenario }), source_validation_repository_id: validationRepository.repository_id, final_state: "KNOWLEDGE_REPOSITORY_STORED" as const, records, ledger_entries, lineage_graph: freezeArray(records.map(lineage)), audit_records: freezeArray<KnowledgeRepositoryAuditRecord>([]), failures: unique([...(injected ? [injected] : []), ...(validationRepository.final_state !== "KNOWLEDGE_VALIDATION_COMPLETE" ? ["VALIDATION_MISSING" as const] : [])]), append_only: true as const, read_only_queries: true as const, activation_authorized: false as const, operator_approval_bypass_authorized: false as const, governance_modification_authorized: false as const, historical_rewrite_authorized: false as const, delete_authorized: false as const };
  const failures = collectFailures(source);
  const audit_records = freezeArray(failures.map((failure) => audit(failure, scenario)));
  const rejected = failures.length > 0;
  const repository = { ...source, failures, audit_records, ledger_entries: rejected ? freezeArray([...ledger_entries, ...failures.map((failure, index) => Object.freeze({ ledger_entry_id: id("KLE", "knowledge-ledger-rejection", { failure, scenario, index }), knowledge_id: null, event_type: "REPOSITORY_OPERATION_REJECTED" as const, event_sequence: ledger_entries.length + index + 1, previous_version: null, new_version: null, governance_reference: `governance:rejected:${failure}`, replay_reference: `replay:repository:${failure}`, operator_reference: "OPERATOR_APPROVAL_REQUIRED" as const, timestamp: "1970-01-01T00:00:00.000Z" as const, integrity_hash: hashValue("knowledge-ledger-rejection", { failure, scenario, index }) }))]) : ledger_entries, final_state: rejected ? "KNOWLEDGE_REPOSITORY_REJECTED" as const : source.final_state };
  return Object.freeze({ ...repository, integrity_hash: scenario === "INTEGRITY_FAILURE" ? "" : hashValue("knowledge-repository-projection", repository) });
}

export function listKnowledgeRepositoryRecords(input: KnowledgeRepositoryInput = {}) { return storeKnowledgeRepository(input).records; }
export function listEvolutionLedgerEntries(input: KnowledgeRepositoryInput = {}) { return storeKnowledgeRepository(input).ledger_entries; }
export function listKnowledgeLineageGraph(input: KnowledgeRepositoryInput = {}) { return storeKnowledgeRepository(input).lineage_graph; }
export function listKnowledgeRepositoryAudits(input: KnowledgeRepositoryInput = {}) { return storeKnowledgeRepository(input).audit_records; }
export function queryKnowledgeRepository(input: KnowledgeRepositoryInput = {}) { const repository = storeKnowledgeRepository(input); return Object.freeze({ repository_id: repository.repository_id, records: repository.records, ledger_entries: repository.ledger_entries, lineage_graph: repository.lineage_graph, read_only_queries: true as const, integrity_hash: repository.integrity_hash }); }

export function validateKnowledgeRepository(repository = storeKnowledgeRepository()): KnowledgeRepositoryValidationResult {
  const failures = unique([...collectFailures(repository), ...(!repository.integrity_hash ? ["INTEGRITY_FAILURE_DETECTED" as const] : [])]);
  const has = (failure: KnowledgeRepositoryFailure) => failures.includes(failure);
  const valid = failures.length === 0 && repository.final_state === "KNOWLEDGE_REPOSITORY_STORED" && repository.append_only && repository.read_only_queries && !repository.activation_authorized && !repository.delete_authorized;
  const source = { repository_id: repository.repository_id, valid, identifiers_unique: !has("DUPLICATE_IDENTIFIER_DETECTED"), validation_present: !has("VALIDATION_MISSING"), certification_eligible: !has("CERTIFICATION_ELIGIBILITY_MISSING"), lineage_complete: !has("INCOMPLETE_LINEAGE_DETECTED"), replay_ready: !has("REPLAY_REFERENCE_MISSING"), integrity_verified: !has("INTEGRITY_FAILURE_DETECTED"), governance_valid: !has("GOVERNANCE_VIOLATION_DETECTED"), constitutional_valid: !has("CONSTITUTIONAL_VIOLATION_DETECTED"), authority_preserved: !has("AUTHORITY_CONFLICT_DETECTED") && !has("OVERWRITE_ATTEMPT_REJECTED") && !has("DELETE_ATTEMPT_REJECTED") && !has("HISTORICAL_REWRITE_REJECTED"), tenant_isolated: !has("CROSS_TENANT_ACCESS_REJECTED"), append_only: true as const, read_only_queries: true as const, activation_blocked: !has("ACTIVATION_ATTEMPT_REJECTED"), operator_approval_required: !has("APPROVAL_BYPASS_REJECTED"), fail_closed: valid || failures.length > 0 || repository.final_state !== "KNOWLEDGE_REPOSITORY_STORED", failures };
  return Object.freeze({ ...source, validation_hash: hashValue("knowledge-repository-validation", source) });
}

export function buildKnowledgeRepositoryObservabilitySurface(repository = storeKnowledgeRepository()): KnowledgeRepositoryObservabilitySurface {
  return Object.freeze({ repository_id: repository.repository_id, final_state: repository.final_state, record_count: repository.records.length, ledger_count: repository.ledger_entries.length, lineage_edge_count: repository.lineage_graph.length, audit_count: repository.audit_records.length, failure_count: repository.failures.length, append_only: true, read_only_queries: true, activation_authorized: false, integrity_hash: repository.integrity_hash });
}

export function getKnowledgeRepositoryEvolutionLedger(): KnowledgeRepositoryEvolutionLedgerBundle {
  const repository = storeKnowledgeRepository();
  return Object.freeze({ doctrine: Object.freeze({ engine_version: VERSION, final_state: "KNOWLEDGE_REPOSITORY_LEDGER_READY", lifecycle_states: lifecycleStates, event_types: eventTypes, principles: freezeArray(["append-only", "immutable-records", "read-only-queries", "deterministic-version-history", "tenant-isolated", "operator-approval-required", "no-activation", "no-overwrite", "no-delete"]) }), repository, validation: validateKnowledgeRepository(repository), observability: buildKnowledgeRepositoryObservabilitySurface(repository) });
}
