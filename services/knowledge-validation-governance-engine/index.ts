import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import { generateTemplateHeuristicKnowledge } from "@/services/template-heuristic-generation-engine";
import type { CandidateKnowledgeArtifact, CandidateKnowledgeRepository } from "@/types/template-heuristic-generation-engine";
import type {
  KnowledgeValidationAuditRecord,
  KnowledgeValidationFailure,
  KnowledgeValidationGovernanceEngineBundle,
  KnowledgeValidationInput,
  KnowledgeValidationLifecycleState,
  KnowledgeValidationObservabilitySurface,
  KnowledgeValidationRecord,
  KnowledgeValidationRepository,
  KnowledgeValidationResult,
  KnowledgeValidationScenario,
  KnowledgeValidationStatus,
} from "@/types/knowledge-validation-governance-engine";

const VERSION = "knowledge-validation-governance-engine/v8ALT.9.7" as const;
const lifecycleStates = Object.freeze(["RECEIVED", "SCHEMA_VALIDATED", "EVIDENCE_VALIDATED", "REPLAY_VALIDATED", "DETERMINISM_VALIDATED", "GOVERNANCE_VALIDATED", "CONSTITUTION_VALIDATED", "AUTHORITY_VALIDATED", "TENANT_VALIDATED", "INTEGRITY_VALIDATED", "READY_FOR_CERTIFICATION", "REJECTED"] as const);

function hashValue(domain: string, value: unknown): string { return hashConfidenceValue(domain, canonicalizeConfidenceToString(value)); }
function id(prefix: string, domain: string, value: unknown): string { return `${prefix}-${hashValue(domain, value).slice(0, 12).toUpperCase()}`; }
function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function unique<T extends string>(values: readonly T[]): readonly T[] { return freezeArray([...new Set(values)].sort()); }
function status(failed: boolean): KnowledgeValidationStatus { return failed ? "FAIL" : "PASS"; }

function scenarioFailure(scenario: KnowledgeValidationScenario): KnowledgeValidationFailure | null {
  const map: Partial<Record<KnowledgeValidationScenario, KnowledgeValidationFailure>> = {
    INVALID_SCHEMA: "INVALID_SCHEMA_DETECTED",
    MISSING_EVIDENCE: "MISSING_EVIDENCE_DETECTED",
    REPLAY_MISMATCH: "REPLAY_MISMATCH_DETECTED",
    NONDETERMINISTIC_BEHAVIOR: "NONDETERMINISTIC_BEHAVIOR_DETECTED",
    GOVERNANCE_VIOLATION: "GOVERNANCE_VIOLATION_DETECTED",
    CONSTITUTIONAL_VIOLATION: "CONSTITUTIONAL_VIOLATION_DETECTED",
    AUTHORITY_CONFLICT: "AUTHORITY_CONFLICT_DETECTED",
    INTEGRITY_FAILURE: "INTEGRITY_FAILURE_DETECTED",
    LINEAGE_BREAK: "LINEAGE_BREAK_DETECTED",
    TENANT_ISOLATION_FAILURE: "TENANT_ISOLATION_FAILURE_DETECTED",
    INCOMPLETE_EXPLAINABILITY: "INCOMPLETE_EXPLAINABILITY_DETECTED",
    DUPLICATE_CERTIFIED_IDENTIFIER: "DUPLICATE_CERTIFIED_IDENTIFIER_DETECTED",
    CERTIFICATION_ATTEMPTED: "CERTIFICATION_ATTEMPTED",
    ACTIVATION_ATTEMPTED: "ACTIVATION_ATTEMPTED",
    GOVERNANCE_BYPASS_ATTEMPTED: "GOVERNANCE_BYPASS_ATTEMPTED",
    OPERATOR_APPROVAL_BYPASS_ATTEMPTED: "OPERATOR_APPROVAL_BYPASS_ATTEMPTED",
  };
  return map[scenario] ?? null;
}

function sourceRepository(scenario: KnowledgeValidationScenario, repository?: CandidateKnowledgeRepository): CandidateKnowledgeRepository {
  if (repository) return repository;
  if (scenario === "MISSING_EVIDENCE") return generateTemplateHeuristicKnowledge({ scenario: "MISSING_EVIDENCE" });
  if (scenario === "REPLAY_MISMATCH") return generateTemplateHeuristicKnowledge({ scenario: "REPLAY_INCONSISTENCY" });
  if (scenario === "GOVERNANCE_VIOLATION") return generateTemplateHeuristicKnowledge({ scenario: "GOVERNANCE_VIOLATION" });
  if (scenario === "CONSTITUTIONAL_VIOLATION") return generateTemplateHeuristicKnowledge({ scenario: "CONSTITUTIONAL_VIOLATION" });
  if (scenario === "AUTHORITY_CONFLICT") return generateTemplateHeuristicKnowledge({ scenario: "AUTHORITY_CONFLICT" });
  if (scenario === "INTEGRITY_FAILURE") return generateTemplateHeuristicKnowledge({ scenario: "INTEGRITY_FAILURE" });
  if (scenario === "TENANT_ISOLATION_FAILURE") return generateTemplateHeuristicKnowledge({ scenario: "CROSS_TENANT_LEARNING_ATTEMPT" });
  if (scenario === "DUPLICATE_CERTIFIED_IDENTIFIER") return generateTemplateHeuristicKnowledge({ scenario: "DUPLICATE_DETERMINISTIC_ARTIFACT" });
  if (scenario === "ACTIVATION_ATTEMPTED") return generateTemplateHeuristicKnowledge({ scenario: "ACTIVATION_ATTEMPTED" });
  return generateTemplateHeuristicKnowledge();
}

function failureList(artifact: CandidateKnowledgeArtifact, scenario: KnowledgeValidationScenario, index: number): readonly KnowledgeValidationFailure[] {
  return unique([
    ...(scenario === "INVALID_SCHEMA" && index === 0 ? ["INVALID_SCHEMA_DETECTED" as const] : []),
    ...((artifact.evidence_chain.length === 0 || (scenario === "MISSING_EVIDENCE" && index === 0)) ? ["MISSING_EVIDENCE_DETECTED" as const] : []),
    ...((artifact.replay_reference.length === 0 || artifact.replay_reference.some((r) => r.includes("mismatch")) || (scenario === "REPLAY_MISMATCH" && index === 0)) ? ["REPLAY_MISMATCH_DETECTED" as const] : []),
    ...(scenario === "NONDETERMINISTIC_BEHAVIOR" && index === 0 ? ["NONDETERMINISTIC_BEHAVIOR_DETECTED" as const] : []),
    ...((artifact.governance_status === "BLOCKED" || artifact.governance_modification_authorized || (scenario === "GOVERNANCE_VIOLATION" && index === 0)) ? ["GOVERNANCE_VIOLATION_DETECTED" as const] : []),
    ...((artifact.constitutional_status === "BLOCKED" || (scenario === "CONSTITUTIONAL_VIOLATION" && index === 0)) ? ["CONSTITUTIONAL_VIOLATION_DETECTED" as const] : []),
    ...((artifact.authority_status === "CONFLICT" || artifact.runtime_modification_authorized || artifact.planning_modification_authorized || artifact.self_approval_authorized || (scenario === "AUTHORITY_CONFLICT" && index === 0)) ? ["AUTHORITY_CONFLICT_DETECTED" as const] : []),
    ...((!artifact.integrity_hash || !artifact.deterministic_signature || (scenario === "INTEGRITY_FAILURE" && index === 0)) ? ["INTEGRITY_FAILURE_DETECTED" as const] : []),
    ...((artifact.lineage_reference.length === 0 || (scenario === "LINEAGE_BREAK" && index === 0)) ? ["LINEAGE_BREAK_DETECTED" as const] : []),
    ...((artifact.tenant_id !== "tenant:alpha" || (scenario === "TENANT_ISOLATION_FAILURE" && index === 0)) ? ["TENANT_ISOLATION_FAILURE_DETECTED" as const] : []),
    ...((artifact.explainability.length < 3 || (scenario === "INCOMPLETE_EXPLAINABILITY" && index === 0)) ? ["INCOMPLETE_EXPLAINABILITY_DETECTED" as const] : []),
    ...(scenario === "CERTIFICATION_ATTEMPTED" && index === 0 ? ["CERTIFICATION_ATTEMPTED" as const] : []),
    ...((artifact.activation_authorized || scenario === "ACTIVATION_ATTEMPTED") && index === 0 ? ["ACTIVATION_ATTEMPTED" as const] : []),
    ...(scenario === "GOVERNANCE_BYPASS_ATTEMPTED" && index === 0 ? ["GOVERNANCE_BYPASS_ATTEMPTED" as const] : []),
    ...(scenario === "OPERATOR_APPROVAL_BYPASS_ATTEMPTED" && index === 0 ? ["OPERATOR_APPROVAL_BYPASS_ATTEMPTED" as const] : []),
  ]);
}

function buildRecord(artifact: CandidateKnowledgeArtifact, scenario: KnowledgeValidationScenario, index: number): KnowledgeValidationRecord {
  const failures = failureList(artifact, scenario, index);
  const has = (failure: KnowledgeValidationFailure) => failures.includes(failure);
  const passed = failures.length === 0;
  const base = {
    validation_id: id("KVR", "knowledge-validation-record", { artifact: artifact.artifact_id, scenario, index }),
    artifact_id: artifact.artifact_id,
    artifact_version: artifact.version,
    validation_version: VERSION,
    tenant_id: artifact.tenant_id,
    lifecycle_state: passed ? "READY_FOR_CERTIFICATION" as const : "REJECTED" as const,
    schema_status: status(has("INVALID_SCHEMA_DETECTED")),
    evidence_status: status(has("MISSING_EVIDENCE_DETECTED")),
    replay_status: status(has("REPLAY_MISMATCH_DETECTED")),
    determinism_status: status(has("NONDETERMINISTIC_BEHAVIOR_DETECTED")),
    governance_status: status(has("GOVERNANCE_VIOLATION_DETECTED") || has("GOVERNANCE_BYPASS_ATTEMPTED")),
    constitution_status: status(has("CONSTITUTIONAL_VIOLATION_DETECTED")),
    authority_status: status(has("AUTHORITY_CONFLICT_DETECTED") || has("CERTIFICATION_ATTEMPTED") || has("ACTIVATION_ATTEMPTED") || has("OPERATOR_APPROVAL_BYPASS_ATTEMPTED")),
    tenant_status: status(has("TENANT_ISOLATION_FAILURE_DETECTED")),
    integrity_status: status(has("INTEGRITY_FAILURE_DETECTED")),
    explainability_status: status(has("INCOMPLETE_EXPLAINABILITY_DETECTED")),
    replay_score: has("REPLAY_MISMATCH_DETECTED") ? 0 : 1,
    evidence_score: has("MISSING_EVIDENCE_DETECTED") ? 0 : 1,
    integrity_score: has("INTEGRITY_FAILURE_DETECTED") ? 0 : 1,
    governance_score: has("GOVERNANCE_VIOLATION_DETECTED") || has("GOVERNANCE_BYPASS_ATTEMPTED") ? 0 : 1,
    confidence_score: artifact.confidence_score,
    evidence_chain: artifact.evidence_chain,
    lineage_reference: artifact.lineage_reference,
    replay_reference: artifact.replay_reference,
    readiness_state: passed ? "READY_FOR_CERTIFICATION" as const : "REJECTED" as const,
    approval_required: true as const,
    validation_timestamp: "1970-01-01T00:00:00.000Z" as const,
    explanation: freezeArray(["candidate artifact inspected", "schema, evidence, replay, governance, constitution, authority, tenant, integrity, and explainability evaluated", "operator approval remains required"]),
    rejected_conditions: failures,
    read_only: true as const,
    advisory_only: true as const,
    certification_authorized: scenario === "CERTIFICATION_ATTEMPTED" && index === 0,
    activation_authorized: scenario === "ACTIVATION_ATTEMPTED" && index === 0,
    operator_approval_bypass_authorized: scenario === "OPERATOR_APPROVAL_BYPASS_ATTEMPTED" && index === 0,
    governance_modification_authorized: scenario === "GOVERNANCE_BYPASS_ATTEMPTED" && index === 0,
    constitutional_modification_authorized: false,
  };
  const deterministic_signature = hashValue("knowledge-validation-signature", base);
  return Object.freeze({ ...base, deterministic_signature, integrity_hash: scenario === "INTEGRITY_FAILURE" && index === 0 ? "" : hashValue("knowledge-validation-record", { ...base, deterministic_signature }) });
}

function audit(failure: KnowledgeValidationFailure, scenario: KnowledgeValidationScenario): KnowledgeValidationAuditRecord {
  const base = { audit_id: id("KVA", "knowledge-validation-audit", { failure, scenario }), artifact_id: null, validation_id: null, rejection_reason: failure, immutable: true as const, append_only: true as const, replay_reference: `replay:knowledge-validation:${failure}` };
  return Object.freeze({ ...base, integrity_hash: hashValue("knowledge-validation-audit", base) });
}

function collectFailures(repository: Omit<KnowledgeValidationRepository, "integrity_hash"> | KnowledgeValidationRepository): readonly KnowledgeValidationFailure[] {
  const ids = repository.validation_records.map((record) => record.artifact_id);
  return unique([
    ...repository.failures,
    ...(repository.validation_records.some((r) => r.schema_status === "FAIL") ? ["INVALID_SCHEMA_DETECTED" as const] : []),
    ...(repository.validation_records.some((r) => r.evidence_status === "FAIL") ? ["MISSING_EVIDENCE_DETECTED" as const] : []),
    ...(repository.validation_records.some((r) => r.replay_status === "FAIL") ? ["REPLAY_MISMATCH_DETECTED" as const] : []),
    ...(repository.validation_records.some((r) => r.determinism_status === "FAIL") ? ["NONDETERMINISTIC_BEHAVIOR_DETECTED" as const] : []),
    ...(repository.validation_records.some((r) => r.governance_status === "FAIL") ? ["GOVERNANCE_VIOLATION_DETECTED" as const] : []),
    ...(repository.validation_records.some((r) => r.constitution_status === "FAIL") ? ["CONSTITUTIONAL_VIOLATION_DETECTED" as const] : []),
    ...(repository.validation_records.some((r) => r.authority_status === "FAIL") ? ["AUTHORITY_CONFLICT_DETECTED" as const] : []),
    ...(repository.validation_records.some((r) => r.integrity_status === "FAIL" || !r.integrity_hash) ? ["INTEGRITY_FAILURE_DETECTED" as const] : []),
    ...(repository.validation_records.some((r) => r.lineage_reference.length === 0) ? ["LINEAGE_BREAK_DETECTED" as const] : []),
    ...(repository.validation_records.some((r) => r.tenant_status === "FAIL") ? ["TENANT_ISOLATION_FAILURE_DETECTED" as const] : []),
    ...(repository.validation_records.some((r) => r.explainability_status === "FAIL") ? ["INCOMPLETE_EXPLAINABILITY_DETECTED" as const] : []),
    ...(new Set(ids).size !== ids.length ? ["DUPLICATE_CERTIFIED_IDENTIFIER_DETECTED" as const] : []),
    ...(repository.validation_records.some((r) => r.certification_authorized) ? ["CERTIFICATION_ATTEMPTED" as const] : []),
    ...(repository.validation_records.some((r) => r.activation_authorized) ? ["ACTIVATION_ATTEMPTED" as const] : []),
    ...(repository.validation_records.some((r) => r.governance_modification_authorized) ? ["GOVERNANCE_BYPASS_ATTEMPTED" as const] : []),
    ...(repository.validation_records.some((r) => r.operator_approval_bypass_authorized) ? ["OPERATOR_APPROVAL_BYPASS_ATTEMPTED" as const] : []),
  ]);
}

export function validateKnowledgeGovernance(input: KnowledgeValidationInput = {}): KnowledgeValidationRepository {
  if (input.repository) return input.repository;
  const scenario = input.scenario ?? "BASELINE";
  const candidateRepository = sourceRepository(scenario, input.candidateRepository);
  const injected = scenarioFailure(scenario);
  const validation_records = freezeArray(candidateRepository.artifacts.map((artifact, index) => buildRecord(artifact, scenario, index)));
  const duplicateInjected = scenario === "DUPLICATE_CERTIFIED_IDENTIFIER" ? ["DUPLICATE_CERTIFIED_IDENTIFIER_DETECTED" as const] : [];
  const source = { repository_id: id("KVG", "knowledge-validation-governance", { source: candidateRepository.repository_id, scenario }), source_candidate_repository_id: candidateRepository.repository_id, final_state: "KNOWLEDGE_VALIDATION_COMPLETE" as const, validation_records, readiness_records: freezeArray(validation_records.filter((record) => record.readiness_state === "READY_FOR_CERTIFICATION")), audit_records: freezeArray<KnowledgeValidationAuditRecord>([]), failures: unique([...(injected ? [injected] : []), ...duplicateInjected]), read_only: true as const, advisory_only: true as const, certification_authorized: false as const, activation_authorized: false as const, operator_approval_bypass_authorized: false as const, governance_modification_authorized: false as const, constitutional_modification_authorized: false as const };
  const failures = collectFailures(source);
  const audit_records = freezeArray(failures.map((failure) => audit(failure, scenario)));
  const repository = { ...source, failures, audit_records, final_state: failures.length ? "KNOWLEDGE_VALIDATION_REJECTED" as const : source.final_state };
  return Object.freeze({ ...repository, integrity_hash: scenario === "INTEGRITY_FAILURE" ? "" : hashValue("knowledge-validation-repository", repository) });
}

export function listKnowledgeValidationRecords(input: KnowledgeValidationInput = {}) { return validateKnowledgeGovernance(input).validation_records; }
export function listCertificationReadinessRecords(input: KnowledgeValidationInput = {}) { return validateKnowledgeGovernance(input).readiness_records; }
export function listKnowledgeValidationAuditRecords(input: KnowledgeValidationInput = {}) { return validateKnowledgeGovernance(input).audit_records; }

export function validateKnowledgeValidationRepository(repository = validateKnowledgeGovernance()): KnowledgeValidationResult {
  const failures = unique([...collectFailures(repository), ...(!repository.integrity_hash ? ["INTEGRITY_FAILURE_DETECTED" as const] : [])]);
  const has = (failure: KnowledgeValidationFailure) => failures.includes(failure);
  const valid = failures.length === 0 && repository.final_state === "KNOWLEDGE_VALIDATION_COMPLETE" && repository.read_only && repository.advisory_only && !repository.certification_authorized && !repository.activation_authorized;
  const source = { repository_id: repository.repository_id, valid, schema_valid: !has("INVALID_SCHEMA_DETECTED"), evidence_complete: !has("MISSING_EVIDENCE_DETECTED"), replay_reproducible: !has("REPLAY_MISMATCH_DETECTED"), deterministic: !has("NONDETERMINISTIC_BEHAVIOR_DETECTED"), governance_valid: !has("GOVERNANCE_VIOLATION_DETECTED") && !has("GOVERNANCE_BYPASS_ATTEMPTED"), constitution_valid: !has("CONSTITUTIONAL_VIOLATION_DETECTED"), authority_preserved: !has("AUTHORITY_CONFLICT_DETECTED") && !has("CERTIFICATION_ATTEMPTED") && !has("ACTIVATION_ATTEMPTED") && !has("OPERATOR_APPROVAL_BYPASS_ATTEMPTED"), tenant_isolated: !has("TENANT_ISOLATION_FAILURE_DETECTED"), integrity_verified: !has("INTEGRITY_FAILURE_DETECTED"), explainability_complete: !has("INCOMPLETE_EXPLAINABILITY_DETECTED"), duplicate_certified_identifiers_absent: !has("DUPLICATE_CERTIFIED_IDENTIFIER_DETECTED"), certification_blocked: !has("CERTIFICATION_ATTEMPTED"), activation_blocked: !has("ACTIVATION_ATTEMPTED"), operator_approval_required: !has("OPERATOR_APPROVAL_BYPASS_ATTEMPTED"), read_only: true as const, advisory_only: true as const, fail_closed: valid || failures.length > 0 || repository.final_state !== "KNOWLEDGE_VALIDATION_COMPLETE", failures };
  return Object.freeze({ ...source, validation_hash: hashValue("knowledge-validation-result", source) });
}

export function buildKnowledgeValidationObservabilitySurface(repository = validateKnowledgeGovernance()): KnowledgeValidationObservabilitySurface {
  return Object.freeze({ repository_id: repository.repository_id, final_state: repository.final_state, validation_count: repository.validation_records.length, readiness_count: repository.readiness_records.length, rejected_count: repository.validation_records.filter((record) => record.readiness_state === "REJECTED").length, audit_count: repository.audit_records.length, failure_count: repository.failures.length, read_only: true, advisory_only: true, certification_authorized: false, activation_authorized: false, integrity_hash: repository.integrity_hash });
}

export function getKnowledgeValidationGovernanceEngine(): KnowledgeValidationGovernanceEngineBundle {
  const repository = validateKnowledgeGovernance();
  return Object.freeze({ doctrine: Object.freeze({ engine_version: VERSION, final_state: "KNOWLEDGE_VALIDATION_GOVERNANCE_READY", lifecycle_states: lifecycleStates, principles: freezeArray(["read-only-validation", "advisory-only", "certification-readiness-only", "operator-approval-required", "deterministic-validation", "replay-verified", "tenant-isolated", "no-activation", "no-governance-bypass"]) }), repository, validation: validateKnowledgeValidationRepository(repository), observability: buildKnowledgeValidationObservabilitySurface(repository) });
}
