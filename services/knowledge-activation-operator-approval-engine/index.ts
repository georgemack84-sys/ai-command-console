import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import { storeKnowledgeRepository } from "@/services/knowledge-repository-evolution-ledger";
import type { KnowledgeRepositoryProjection, KnowledgeRepositoryRecord } from "@/types/knowledge-repository-evolution-ledger";
import type {
  KnowledgeActivationAuditRecord,
  KnowledgeActivationFailure,
  KnowledgeActivationInput,
  KnowledgeActivationLedgerEntry,
  KnowledgeActivationLedgerEventType,
  KnowledgeActivationObservabilitySurface,
  KnowledgeActivationOperatorApprovalEngineBundle,
  KnowledgeActivationRecord,
  KnowledgeActivationRepository,
  KnowledgeActivationScenario,
  KnowledgeActivationState,
  KnowledgeActivationValidationResult,
  OperatorApprovalStatus,
} from "@/types/knowledge-activation-operator-approval-engine";

const VERSION = "knowledge-activation-operator-approval-engine/v8ALT.9.9" as const;
const activationStates = Object.freeze(["CANDIDATE", "CERTIFIED", "PENDING_GOVERNANCE", "PENDING_OPERATOR_APPROVAL", "APPROVED", "ACTIVATED", "SUPERSEDED", "ROLLED_BACK", "RETIRED", "ARCHIVED", "REJECTED"] as const);
const eventTypes = Object.freeze(["ACTIVATION_REQUESTED", "GOVERNANCE_AUTHORIZED", "OPERATOR_APPROVED", "OPERATOR_REJECTED", "ACTIVATION_RECORDED", "ROLLBACK_RECORDED", "SUPERSESSION_RECORDED", "RETIREMENT_RECORDED", "ACTIVATION_REJECTED"] as const);

function hashValue(domain: string, value: unknown): string { return hashConfidenceValue(domain, canonicalizeConfidenceToString(value)); }
function id(prefix: string, domain: string, value: unknown): string { return `${prefix}-${hashValue(domain, value).slice(0, 12).toUpperCase()}`; }
function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function unique<T extends string>(values: readonly T[]): readonly T[] { return freezeArray([...new Set(values)].sort()); }

function scenarioFailure(scenario: KnowledgeActivationScenario): KnowledgeActivationFailure | null {
  const map: Partial<Record<KnowledgeActivationScenario, KnowledgeActivationFailure>> = {
    INCOMPLETE_CERTIFICATION: "CERTIFICATION_INCOMPLETE",
    VALIDATION_FAILURE: "VALIDATION_FAILED",
    REPLAY_MISMATCH: "REPLAY_MISMATCH_DETECTED",
    INTEGRITY_FAILURE: "INTEGRITY_FAILURE_DETECTED",
    GOVERNANCE_REJECTION: "GOVERNANCE_REJECTED",
    CONSTITUTIONAL_FAILURE: "CONSTITUTIONAL_VALIDATION_FAILED",
    AUTHORITY_CONFLICT: "AUTHORITY_CONFLICT_DETECTED",
    OPERATOR_REJECTION: "OPERATOR_REJECTED",
    MISSING_OPERATOR_APPROVAL: "OPERATOR_APPROVAL_MISSING",
    UNSATISFIED_DEPENDENCIES: "DEPENDENCIES_UNSATISFIED",
    DUPLICATE_ACTIVATION: "DUPLICATE_ACTIVATION_DETECTED",
    AUTONOMOUS_APPROVAL_ATTEMPT: "AUTONOMOUS_APPROVAL_ATTEMPTED",
    AUTONOMOUS_ACTIVATION_ATTEMPT: "AUTONOMOUS_ACTIVATION_ATTEMPTED",
    REPOSITORY_MUTATION_ATTEMPT: "REPOSITORY_MUTATION_ATTEMPTED",
    HISTORY_REWRITE_ATTEMPT: "HISTORY_REWRITE_ATTEMPTED",
    ACTIVATION_HISTORY_DELETION_ATTEMPT: "ACTIVATION_HISTORY_DELETION_ATTEMPTED",
    CROSS_TENANT_ACTIVATION: "CROSS_TENANT_ACTIVATION_DETECTED",
  };
  return map[scenario] ?? null;
}

function sourceRepository(scenario: KnowledgeActivationScenario, repository?: KnowledgeRepositoryProjection): KnowledgeRepositoryProjection {
  if (repository) return repository;
  if (scenario === "INCOMPLETE_CERTIFICATION" || scenario === "VALIDATION_FAILURE") return storeKnowledgeRepository({ scenario: "MISSING_CERTIFICATION_ELIGIBILITY" });
  if (scenario === "REPLAY_MISMATCH") return storeKnowledgeRepository({ scenario: "MISSING_REPLAY_REFERENCE" });
  if (scenario === "INTEGRITY_FAILURE") return storeKnowledgeRepository({ scenario: "INTEGRITY_FAILURE" });
  if (scenario === "GOVERNANCE_REJECTION") return storeKnowledgeRepository({ scenario: "GOVERNANCE_VIOLATION" });
  if (scenario === "CONSTITUTIONAL_FAILURE") return storeKnowledgeRepository({ scenario: "CONSTITUTIONAL_VIOLATION" });
  if (scenario === "AUTHORITY_CONFLICT") return storeKnowledgeRepository({ scenario: "AUTHORITY_CONFLICT" });
  if (scenario === "CROSS_TENANT_ACTIVATION") return storeKnowledgeRepository({ scenario: "CROSS_TENANT_ACCESS_ATTEMPT" });
  return storeKnowledgeRepository();
}

function approvalStatus(scenario: KnowledgeActivationScenario): OperatorApprovalStatus {
  if (scenario === "OPERATOR_REJECTION") return "REJECTED";
  if (scenario === "MISSING_OPERATOR_APPROVAL") return "MISSING";
  return "APPROVED";
}

function activationState(scenario: KnowledgeActivationScenario): KnowledgeActivationState {
  if (scenario === "OPERATOR_REJECTION" || scenario === "MISSING_OPERATOR_APPROVAL") return "REJECTED";
  if (scenario === "UNSATISFIED_DEPENDENCIES") return "PENDING_OPERATOR_APPROVAL";
  if (scenario === "AUTONOMOUS_ACTIVATION_ATTEMPT") return "REJECTED";
  return "ACTIVATED";
}

function buildActivation(record: KnowledgeRepositoryRecord, index: number, scenario: KnowledgeActivationScenario, operatorId: string): KnowledgeActivationRecord {
  const duplicate = scenario === "DUPLICATE_ACTIVATION" && index > 0;
  const base = {
    activation_id: duplicate ? id("KAA", "knowledge-activation", { first: true }) : id("KAA", "knowledge-activation", { knowledge: record.knowledge_id, index, scenario }),
    knowledge_id: duplicate ? "knowledge:duplicate-active" : record.knowledge_id,
    artifact_version: record.semantic_version,
    activation_version: VERSION,
    artifact_type: record.artifact_type,
    artifact_category: "AUTONOMOUS_KNOWLEDGE",
    repository_reference: record.source_validation_id,
    tenant_id: scenario === "CROSS_TENANT_ACTIVATION" && index === 0 ? "tenant:foreign" : record.tenant_id,
    operator_id: scenario === "AUTONOMOUS_APPROVAL_ATTEMPT" && index === 0 ? "system:autonomous" : operatorId,
    approval_status: approvalStatus(scenario),
    approval_timestamp: "1970-01-01T00:00:00.000Z" as const,
    approval_reason: "deterministic operator fixture approval for validation-ready knowledge",
    governance_reference: `governance:activation:${record.knowledge_id}`,
    constitutional_reference: `constitution:activation:${record.knowledge_id}`,
    authority_reference: `authority:operator:${operatorId}`,
    replay_validation: scenario === "REPLAY_MISMATCH" && index === 0 ? "FAIL" as const : "PASS" as const,
    integrity_validation: scenario === "INTEGRITY_FAILURE" && index === 0 ? "FAIL" as const : "PASS" as const,
    dependency_validation: scenario === "UNSATISFIED_DEPENDENCIES" && index === 0 ? "FAIL" as const : "PASS" as const,
    activation_state: activationState(scenario),
    supersession_state: index === 0 ? "NONE" as const : "SUPERSEDED" as const,
    rollback_reference: index === 0 ? null : id("RLB", "knowledge-rollback", record.knowledge_id),
    replay_reference: record.replay_reference,
    lineage_reference: record.lineage_reference,
    evidence_chain: record.evidence_chain,
    explanation: freezeArray(["activation recorded only in governance ledger", "operator approval required", "runtime behavior remains unchanged", "repository history remains immutable"]),
    human_authorized: scenario !== "MISSING_OPERATOR_APPROVAL" && scenario !== "AUTONOMOUS_APPROVAL_ATTEMPT" && scenario !== "AUTONOMOUS_ACTIVATION_ATTEMPT",
    autonomous_activation_authorized: false as const,
    autonomous_approval_authorized: false as const,
    runtime_behavior_modification_authorized: false as const,
    repository_mutation_authorized: scenario === "REPOSITORY_MUTATION_ATTEMPT" && index === 0,
    history_rewrite_authorized: scenario === "HISTORY_REWRITE_ATTEMPT" && index === 0,
    activation_history_deletion_authorized: scenario === "ACTIVATION_HISTORY_DELETION_ATTEMPT" && index === 0,
  };
  return Object.freeze({ ...base, integrity_hash: hashValue("knowledge-activation-record", base) });
}

function ledger(record: KnowledgeActivationRecord, sequence: number, event_type: KnowledgeActivationLedgerEventType): KnowledgeActivationLedgerEntry {
  const base = { activation_ledger_entry_id: id("KAL", "knowledge-activation-ledger", { activation: record.activation_id, sequence, event_type }), activation_id: record.activation_id, knowledge_id: record.knowledge_id, event_type, event_sequence: sequence, operator_id: record.operator_id, governance_reference: record.governance_reference, replay_reference: record.replay_reference[0] ?? "", timestamp: "1970-01-01T00:00:00.000Z" as const, immutable: true as const, append_only: true as const };
  return Object.freeze({ ...base, integrity_hash: hashValue("knowledge-activation-ledger", base) });
}

function audit(failure: KnowledgeActivationFailure, scenario: KnowledgeActivationScenario): KnowledgeActivationAuditRecord {
  const base = { audit_id: id("KAAUD", "knowledge-activation-audit", { failure, scenario }), activation_id: null, rejection_reason: failure, immutable: true as const, append_only: true as const, replay_reference: `replay:activation:${failure}` };
  return Object.freeze({ ...base, integrity_hash: hashValue("knowledge-activation-audit", base) });
}

function collectFailures(repository: Omit<KnowledgeActivationRepository, "integrity_hash"> | KnowledgeActivationRepository): readonly KnowledgeActivationFailure[] {
  const ids = repository.activation_records.filter((r) => r.activation_state === "ACTIVATED").map((record) => record.knowledge_id);
  return unique([
    ...repository.failures,
    ...(repository.activation_records.some((r) => r.artifact_version === "corrupted" || r.artifact_version.length === 0) ? ["CERTIFICATION_INCOMPLETE" as const] : []),
    ...(repository.activation_records.length === 0 ? ["VALIDATION_FAILED" as const] : []),
    ...(repository.activation_records.some((r) => r.replay_validation === "FAIL" || r.replay_reference.length === 0) ? ["REPLAY_MISMATCH_DETECTED" as const] : []),
    ...(repository.activation_records.some((r) => r.integrity_validation === "FAIL" || !r.integrity_hash) ? ["INTEGRITY_FAILURE_DETECTED" as const] : []),
    ...(repository.activation_records.some((r) => r.governance_reference.includes("rejected")) ? ["GOVERNANCE_REJECTED" as const] : []),
    ...(repository.activation_records.some((r) => r.constitutional_reference.includes("rejected")) ? ["CONSTITUTIONAL_VALIDATION_FAILED" as const] : []),
    ...(repository.activation_records.some((r) => r.authority_reference.includes("conflict")) ? ["AUTHORITY_CONFLICT_DETECTED" as const] : []),
    ...(repository.activation_records.some((r) => r.approval_status === "REJECTED") ? ["OPERATOR_REJECTED" as const] : []),
    ...(repository.activation_records.some((r) => r.approval_status === "MISSING" || !r.human_authorized) ? ["OPERATOR_APPROVAL_MISSING" as const] : []),
    ...(repository.activation_records.some((r) => r.dependency_validation === "FAIL") ? ["DEPENDENCIES_UNSATISFIED" as const] : []),
    ...(new Set(ids).size !== ids.length ? ["DUPLICATE_ACTIVATION_DETECTED" as const] : []),
    ...(repository.activation_records.some((r) => r.operator_id === "system:autonomous") ? ["AUTONOMOUS_APPROVAL_ATTEMPTED" as const] : []),
    ...(repository.failures.includes("AUTONOMOUS_ACTIVATION_ATTEMPTED") ? ["AUTONOMOUS_ACTIVATION_ATTEMPTED" as const] : []),
    ...(repository.activation_records.some((r) => r.repository_mutation_authorized) ? ["REPOSITORY_MUTATION_ATTEMPTED" as const] : []),
    ...(repository.activation_records.some((r) => r.history_rewrite_authorized) ? ["HISTORY_REWRITE_ATTEMPTED" as const] : []),
    ...(repository.activation_records.some((r) => r.activation_history_deletion_authorized) ? ["ACTIVATION_HISTORY_DELETION_ATTEMPTED" as const] : []),
    ...(repository.activation_records.some((r) => r.tenant_id !== "tenant:alpha") ? ["CROSS_TENANT_ACTIVATION_DETECTED" as const] : []),
  ]);
}

export function requestKnowledgeActivation(input: KnowledgeActivationInput = {}): KnowledgeActivationRepository {
  if (input.repository) return input.repository;
  const scenario = input.scenario ?? "BASELINE";
  const source = sourceRepository(scenario, input.knowledgeRepository);
  const operatorId = input.operatorId ?? "operator:authorized:alpha";
  const injected = scenarioFailure(scenario);
  const activation_records = freezeArray(source.records.map((record, index) => buildActivation(record, index, scenario, operatorId)));
  const baseLedger = freezeArray(activation_records.flatMap((record, index) => {
    const start = index * 6;
    const approvalEvent: KnowledgeActivationLedgerEventType = record.approval_status === "REJECTED" ? "OPERATOR_REJECTED" : "OPERATOR_APPROVED";
    return [
      ledger(record, start + 1, "ACTIVATION_REQUESTED"),
      ledger(record, start + 2, "GOVERNANCE_AUTHORIZED"),
      ledger(record, start + 3, approvalEvent),
      ledger(record, start + 4, record.activation_state === "ACTIVATED" ? "ACTIVATION_RECORDED" : "ACTIVATION_REJECTED"),
      ledger(record, start + 5, "SUPERSESSION_RECORDED"),
      ledger(record, start + 6, "ROLLBACK_RECORDED"),
    ];
  }));
  const sourceStateFailures: readonly KnowledgeActivationFailure[] = source.final_state !== "KNOWLEDGE_REPOSITORY_STORED" ? ["VALIDATION_FAILED"] : [];
  const draft = { repository_id: id("KAO", "knowledge-activation-operator-approval", { source: source.repository_id, scenario, operatorId }), source_repository_id: source.repository_id, final_state: "KNOWLEDGE_ACTIVATION_RECORDED" as const, activation_records, active_records: freezeArray(activation_records.filter((record) => record.activation_state === "ACTIVATED")), approval_records: freezeArray(activation_records.filter((record) => record.approval_status === "APPROVED")), rollback_records: freezeArray(activation_records.filter((record) => record.rollback_reference !== null)), ledger_entries: baseLedger, audit_records: freezeArray<KnowledgeActivationAuditRecord>([]), failures: unique([...(injected ? [injected] : []), ...sourceStateFailures]), human_authorization_required: true as const, autonomous_activation_authorized: false as const, autonomous_approval_authorized: false as const, runtime_behavior_modification_authorized: false as const, repository_mutation_authorized: false as const, history_rewrite_authorized: false as const };
  const failures = collectFailures(draft);
  const audit_records = freezeArray(failures.map((failure) => audit(failure, scenario)));
  const rejectedEvents = failures.map((failure, index) => Object.freeze({ activation_ledger_entry_id: id("KAL", "knowledge-activation-rejection", { failure, scenario, index }), activation_id: null, knowledge_id: null, event_type: "ACTIVATION_REJECTED" as const, event_sequence: baseLedger.length + index + 1, operator_id: operatorId, governance_reference: `governance:activation:rejected:${failure}`, replay_reference: `replay:activation:${failure}`, timestamp: "1970-01-01T00:00:00.000Z" as const, immutable: true as const, append_only: true as const, integrity_hash: hashValue("knowledge-activation-rejection", { failure, scenario, index }) }));
  const repository = { ...draft, failures, audit_records, ledger_entries: failures.length ? freezeArray([...baseLedger, ...rejectedEvents]) : baseLedger, final_state: failures.length ? "KNOWLEDGE_ACTIVATION_REJECTED" as const : draft.final_state };
  return Object.freeze({ ...repository, integrity_hash: scenario === "INTEGRITY_FAILURE" ? "" : hashValue("knowledge-activation-repository", repository) });
}

export function listKnowledgeActivationApprovals(input: KnowledgeActivationInput = {}) { return requestKnowledgeActivation(input).approval_records; }
export function listActiveKnowledgeRecords(input: KnowledgeActivationInput = {}) { return requestKnowledgeActivation(input).active_records; }
export function listKnowledgeActivationLedger(input: KnowledgeActivationInput = {}) { return requestKnowledgeActivation(input).ledger_entries; }
export function listKnowledgeRollbackRecords(input: KnowledgeActivationInput = {}) { return requestKnowledgeActivation(input).rollback_records; }
export function listKnowledgeActivationAudits(input: KnowledgeActivationInput = {}) { return requestKnowledgeActivation(input).audit_records; }

export function validateKnowledgeActivation(repository = requestKnowledgeActivation()): KnowledgeActivationValidationResult {
  const failures = unique([...collectFailures(repository), ...(!repository.integrity_hash ? ["INTEGRITY_FAILURE_DETECTED" as const] : [])]);
  const has = (failure: KnowledgeActivationFailure) => failures.includes(failure);
  const valid = failures.length === 0 && repository.final_state === "KNOWLEDGE_ACTIVATION_RECORDED" && repository.activation_records.every((record) => record.human_authorized && record.approval_status === "APPROVED" && record.activation_state === "ACTIVATED") && !repository.autonomous_activation_authorized && !repository.runtime_behavior_modification_authorized;
  const result = { repository_id: repository.repository_id, valid, certification_complete: !has("CERTIFICATION_INCOMPLETE"), validation_passed: !has("VALIDATION_FAILED"), replay_valid: !has("REPLAY_MISMATCH_DETECTED"), integrity_verified: !has("INTEGRITY_FAILURE_DETECTED"), governance_authorized: !has("GOVERNANCE_REJECTED"), constitutional_valid: !has("CONSTITUTIONAL_VALIDATION_FAILED"), authority_preserved: !has("AUTHORITY_CONFLICT_DETECTED"), operator_approved: !has("OPERATOR_REJECTED") && !has("OPERATOR_APPROVAL_MISSING"), dependencies_satisfied: !has("DEPENDENCIES_UNSATISFIED"), duplicate_activations_absent: !has("DUPLICATE_ACTIVATION_DETECTED"), tenant_isolated: !has("CROSS_TENANT_ACTIVATION_DETECTED"), autonomous_activation_blocked: !has("AUTONOMOUS_ACTIVATION_ATTEMPTED"), autonomous_approval_blocked: !has("AUTONOMOUS_APPROVAL_ATTEMPTED"), runtime_behavior_unchanged: !has("REPOSITORY_MUTATION_ATTEMPTED"), repository_immutable: !has("HISTORY_REWRITE_ATTEMPTED") && !has("ACTIVATION_HISTORY_DELETION_ATTEMPTED"), fail_closed: valid || failures.length > 0 || repository.final_state !== "KNOWLEDGE_ACTIVATION_RECORDED", failures };
  return Object.freeze({ ...result, validation_hash: hashValue("knowledge-activation-validation", result) });
}

export function buildKnowledgeActivationObservabilitySurface(repository = requestKnowledgeActivation()): KnowledgeActivationObservabilitySurface {
  return Object.freeze({ repository_id: repository.repository_id, final_state: repository.final_state, activation_count: repository.activation_records.length, active_count: repository.active_records.length, approval_count: repository.approval_records.length, rollback_count: repository.rollback_records.length, ledger_count: repository.ledger_entries.length, audit_count: repository.audit_records.length, failure_count: repository.failures.length, human_authorization_required: true, autonomous_activation_authorized: false, runtime_behavior_modification_authorized: false, integrity_hash: repository.integrity_hash });
}

export function getKnowledgeActivationOperatorApprovalEngine(): KnowledgeActivationOperatorApprovalEngineBundle {
  const repository = requestKnowledgeActivation();
  return Object.freeze({ doctrine: Object.freeze({ engine_version: VERSION, final_state: "KNOWLEDGE_ACTIVATION_OPERATOR_APPROVAL_READY", activation_states: activationStates, event_types: eventTypes, principles: freezeArray(["explicit-operator-approval", "human-authorized-only", "governance-authorized", "deterministic-activation-ledger", "append-only-history", "tenant-isolated", "no-runtime-modification", "no-autonomous-approval", "no-autonomous-activation"]) }), repository, validation: validateKnowledgeActivation(repository), observability: buildKnowledgeActivationObservabilitySurface(repository) });
}
