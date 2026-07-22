import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import { getConstitutionalBaselineContract, validateConstitutionalBaseline } from "@/services/constitutional-baseline-contract";
import { validateConstitutionalReplay, validateConstitutionalReplayRepository } from "@/services/constitutional-replay-validation";
import type {
  ConstitutionalLearningArtifactType,
  ConstitutionalLearningDomain,
  ConstitutionalLearningExplanation,
  ConstitutionalLearningFailure,
  ConstitutionalLearningObservabilitySurface,
  ConstitutionalLearningRejectionRecord,
  ConstitutionalLearningScenario,
  ConstitutionalLearningStatus,
  ConstitutionalLearningValidationBundle,
  ConstitutionalLearningValidationInput,
  ConstitutionalLearningValidationLedgerRecord,
  ConstitutionalLearningValidationRecord,
  ConstitutionalLearningValidationRepository,
  ConstitutionalLearningValidationResult,
  ConstitutionalLearningValidationState,
} from "@/types/constitutional-learning-validation";

const VERSION = "constitutional-learning-validation/v8ALT.10.8" as const;
const domains = Object.freeze(["LEARNING_BOUNDARY", "APPROVED_TEMPLATE", "APPROVED_HEURISTIC", "OPERATOR_APPROVAL", "GOVERNANCE_APPROVAL", "KNOWLEDGE_PROVENANCE", "CONFIDENCE_ADJUSTMENT", "OPTIMIZATION_SAFETY"] as const);

function hashValue(domain: string, value: unknown): string { return hashConfidenceValue(domain, canonicalizeConfidenceToString(value)); }
function id(prefix: string, domain: string, value: unknown): string { return `${prefix}-${hashValue(domain, value).slice(0, 12).toUpperCase()}`; }
function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function unique<T extends string>(values: readonly T[]): readonly T[] { return freezeArray([...new Set(values)].sort()); }

function scenarioFailure(scenario: ConstitutionalLearningScenario): ConstitutionalLearningFailure | null {
  const map: Partial<Record<ConstitutionalLearningScenario, ConstitutionalLearningFailure>> = {
    POLICY_MUTATION: "POLICY_MUTATION_DETECTED",
    CONSTITUTIONAL_MUTATION: "CONSTITUTIONAL_MUTATION_DETECTED",
    AUTHORITY_CHANGES: "AUTHORITY_CHANGE_DETECTED",
    UNAUTHORIZED_HEURISTICS: "UNAUTHORIZED_HEURISTIC_DETECTED",
    HIDDEN_MODEL_UPDATES: "HIDDEN_MODEL_UPDATE_DETECTED",
    SELF_MODIFYING_BEHAVIOR: "SELF_MODIFYING_BEHAVIOR_DETECTED",
    GOVERNANCE_BYPASS: "GOVERNANCE_BYPASS_DETECTED",
    OPERATOR_APPROVAL_BYPASS: "OPERATOR_APPROVAL_BYPASS_DETECTED",
    PROVENANCE_CORRUPTION: "PROVENANCE_CORRUPTION_DETECTED",
    REPLAY_INCONSISTENCY: "LEARNING_REPLAY_INCONSISTENCY_DETECTED",
    NONDETERMINISTIC_VALIDATION: "NONDETERMINISTIC_LEARNING_VALIDATION_DETECTED",
    INTEGRITY_VERIFICATION_FAILURE: "LEARNING_INTEGRITY_VERIFICATION_FAILED",
    TENANT_ISOLATION_VIOLATION: "LEARNING_TENANT_ISOLATION_VIOLATION",
    MISSING_CONSTITUTIONAL_EVIDENCE: "CONSTITUTIONAL_EVIDENCE_MISSING",
    INCOMPLETE_VALIDATION_LINEAGE: "LEARNING_VALIDATION_LINEAGE_INCOMPLETE",
  };
  return map[scenario] ?? null;
}

function failureDomain(failure: ConstitutionalLearningFailure | null): ConstitutionalLearningDomain | null {
  const map: Record<ConstitutionalLearningFailure, ConstitutionalLearningDomain> = {
    POLICY_MUTATION_DETECTED: "LEARNING_BOUNDARY",
    CONSTITUTIONAL_MUTATION_DETECTED: "LEARNING_BOUNDARY",
    AUTHORITY_CHANGE_DETECTED: "LEARNING_BOUNDARY",
    UNAUTHORIZED_HEURISTIC_DETECTED: "APPROVED_HEURISTIC",
    HIDDEN_MODEL_UPDATE_DETECTED: "LEARNING_BOUNDARY",
    SELF_MODIFYING_BEHAVIOR_DETECTED: "LEARNING_BOUNDARY",
    GOVERNANCE_BYPASS_DETECTED: "GOVERNANCE_APPROVAL",
    OPERATOR_APPROVAL_BYPASS_DETECTED: "OPERATOR_APPROVAL",
    PROVENANCE_CORRUPTION_DETECTED: "KNOWLEDGE_PROVENANCE",
    LEARNING_REPLAY_INCONSISTENCY_DETECTED: "CONFIDENCE_ADJUSTMENT",
    NONDETERMINISTIC_LEARNING_VALIDATION_DETECTED: "CONFIDENCE_ADJUSTMENT",
    LEARNING_INTEGRITY_VERIFICATION_FAILED: "KNOWLEDGE_PROVENANCE",
    LEARNING_TENANT_ISOLATION_VIOLATION: "LEARNING_BOUNDARY",
    CONSTITUTIONAL_EVIDENCE_MISSING: "KNOWLEDGE_PROVENANCE",
    LEARNING_VALIDATION_LINEAGE_INCOMPLETE: "KNOWLEDGE_PROVENANCE",
  };
  return failure ? map[failure] : null;
}

function rejectionRule(failure: ConstitutionalLearningFailure): ConstitutionalLearningRejectionRecord["rejection_rule"] {
  const map: Record<ConstitutionalLearningFailure, ConstitutionalLearningRejectionRecord["rejection_rule"]> = {
    POLICY_MUTATION_DETECTED: "Policy Mutation",
    CONSTITUTIONAL_MUTATION_DETECTED: "Constitutional Mutation",
    AUTHORITY_CHANGE_DETECTED: "Authority Changes",
    UNAUTHORIZED_HEURISTIC_DETECTED: "Unauthorized Heuristics",
    HIDDEN_MODEL_UPDATE_DETECTED: "Hidden Model Updates",
    SELF_MODIFYING_BEHAVIOR_DETECTED: "Self-Modifying Behavior",
    GOVERNANCE_BYPASS_DETECTED: "Governance Bypass",
    OPERATOR_APPROVAL_BYPASS_DETECTED: "Operator Approval Bypass",
    PROVENANCE_CORRUPTION_DETECTED: "Provenance Corruption",
    LEARNING_REPLAY_INCONSISTENCY_DETECTED: "Replay Inconsistency",
    NONDETERMINISTIC_LEARNING_VALIDATION_DETECTED: "Nondeterministic Validation",
    LEARNING_INTEGRITY_VERIFICATION_FAILED: "Integrity Verification Failure",
    LEARNING_TENANT_ISOLATION_VIOLATION: "Tenant Isolation Violation",
    CONSTITUTIONAL_EVIDENCE_MISSING: "Missing Constitutional Evidence",
    LEARNING_VALIDATION_LINEAGE_INCOMPLETE: "Incomplete Validation Lineage",
  };
  return map[failure];
}

function statusFor(domain: ConstitutionalLearningDomain, failure: ConstitutionalLearningFailure | null, scenario: ConstitutionalLearningScenario): ConstitutionalLearningStatus {
  if (scenario === "PENDING_APPROVALS" && (domain === "OPERATOR_APPROVAL" || domain === "GOVERNANCE_APPROVAL")) return "PENDING";
  return failure && failureDomain(failure) === domain ? "FAIL" : "PASS";
}

function stateFrom(statuses: readonly ConstitutionalLearningStatus[], failure: ConstitutionalLearningFailure | null, scenario: ConstitutionalLearningScenario): ConstitutionalLearningValidationState {
  if (failure) return ["POLICY_MUTATION_DETECTED", "CONSTITUTIONAL_MUTATION_DETECTED", "AUTHORITY_CHANGE_DETECTED", "HIDDEN_MODEL_UPDATE_DETECTED", "SELF_MODIFYING_BEHAVIOR_DETECTED"].includes(failure) ? "BLOCKED" : "REJECTED";
  if (scenario === "PENDING_APPROVALS" || statuses.includes("PENDING")) return "PENDING";
  return "APPROVED_FOR_REVIEW";
}

function record(scenario: ConstitutionalLearningScenario, artifactType: ConstitutionalLearningArtifactType, failure: ConstitutionalLearningFailure | null): ConstitutionalLearningValidationRecord {
  const statuses = domains.map((domain) => statusFor(domain, failure, scenario));
  const state = stateFrom(statuses, failure, scenario);
  const byDomain = (domain: ConstitutionalLearningDomain) => statusFor(domain, failure, scenario);
  const base = {
    learning_validation_id: id("CLV", "constitutional-learning-validation", { scenario, artifactType }),
    mission_id: "mission:constitutional-learning-validation",
    execution_id: "execution:constitutional-learning:0",
    tenant_id: scenario === "TENANT_ISOLATION_VIOLATION" ? "tenant:foreign" : "tenant:alpha",
    constitution_version: "constitutional-baseline-contract/v8ALT.10.1" as const,
    validation_timestamp: "1970-01-01T00:00:00.000Z" as const,
    learning_artifact_id: id("CLA", "constitutional-learning-artifact", { scenario, artifactType }),
    artifact_type: artifactType,
    boundary_status: byDomain("LEARNING_BOUNDARY"),
    template_status: byDomain("APPROVED_TEMPLATE"),
    heuristic_status: byDomain("APPROVED_HEURISTIC"),
    operator_approval_status: byDomain("OPERATOR_APPROVAL"),
    governance_approval_status: byDomain("GOVERNANCE_APPROVAL"),
    provenance_status: byDomain("KNOWLEDGE_PROVENANCE"),
    confidence_status: byDomain("CONFIDENCE_ADJUSTMENT"),
    optimization_status: byDomain("OPTIMIZATION_SAFETY"),
    overall_validation_status: state,
    rejection_rationale: failure ? `${rejectionRule(failure)} rejected by constitutional learning validation` : null,
    constitutional_reference: scenario === "MISSING_CONSTITUTIONAL_EVIDENCE" ? "" : "constitutional-baseline-contract/v8ALT.10.1",
    governance_reference: scenario === "GOVERNANCE_BYPASS" ? "" : "governance:learning-validation",
    operator_reference: scenario === "OPERATOR_APPROVAL_BYPASS" ? "" : "operator:learning-validation",
    evidence_reference: scenario === "MISSING_CONSTITUTIONAL_EVIDENCE" ? "" : "evidence:learning-validation",
    replay_reference: scenario === "REPLAY_INCONSISTENCY" ? "replay:learning-validation:mismatch" : "replay:learning-validation",
    lineage_reference: scenario === "INCOMPLETE_VALIDATION_LINEAGE" ? "" : "lineage:learning-validation",
    validation_only: true as const,
    advisory_only: true as const,
    learning_activation_authorized: false as const,
    model_update_authorized: false as const,
    heuristic_deployment_authorized: false as const,
    policy_modification_authorized: false as const,
    constitutional_modification_authorized: false as const,
    authority_change_authorized: false as const,
    execution_behavior_change_authorized: false as const,
  };
  return Object.freeze({ ...base, integrity_hash: scenario === "INTEGRITY_VERIFICATION_FAILURE" ? "" : hashValue("constitutional-learning-record", base) });
}

function rejection(item: ConstitutionalLearningValidationRecord, failure: ConstitutionalLearningFailure): ConstitutionalLearningRejectionRecord {
  const base = { rejection_id: id("CLR", "constitutional-learning-rejection", { validation: item.learning_validation_id, failure }), learning_validation_id: item.learning_validation_id, failure, domain: failureDomain(failure) ?? "LEARNING_BOUNDARY", rejection_rule: rejectionRule(failure), fail_closed: true as const, evidence_reference: item.evidence_reference, replay_reference: item.replay_reference };
  return Object.freeze({ ...base, integrity_hash: hashValue("constitutional-learning-rejection", base) });
}

function explanation(item: ConstitutionalLearningValidationRecord): ConstitutionalLearningExplanation {
  const complete = Boolean(item.constitutional_reference && item.evidence_reference && item.replay_reference && item.lineage_reference && item.governance_reference && item.operator_reference);
  const base = {
    explanation_id: id("CLE", "constitutional-learning-explanation", item.learning_validation_id),
    learning_validation_id: item.learning_validation_id,
    constitutional_rules_evaluated: freezeArray(["constitutional-rule:learning-boundary", "constitutional-rule:governance-supremacy", "constitutional-rule:operator-supremacy", "constitutional-rule:replay-fidelity"]),
    learning_boundaries_assessed: freezeArray(["mission", "tenant", "authority", "governance", "replay", "advisory-only"]),
    supporting_evidence: item.evidence_reference ? freezeArray([item.evidence_reference]) : freezeArray<string>([]),
    governance_references: item.governance_reference ? freezeArray([item.governance_reference]) : freezeArray<string>([]),
    operator_approval_references: item.operator_reference ? freezeArray([item.operator_reference]) : freezeArray<string>([]),
    provenance_analysis: item.provenance_status === "PASS" ? "knowledge provenance verified" : "knowledge provenance rejected",
    confidence_calculations: freezeArray([`confidence-status:${item.confidence_status}`]),
    optimization_assessment: item.optimization_status === "PASS" ? "optimization safety validated" : "optimization safety rejected",
    validation_rationale: `${item.artifact_type} validation reached ${item.overall_validation_status}`,
    rejection_rationale: item.rejection_rationale,
    complete,
    deterministic: true as const,
    replayable: true as const,
  };
  return Object.freeze({ ...base, integrity_hash: hashValue("constitutional-learning-explanation", base) });
}

function ledger(item: ConstitutionalLearningValidationRecord): ConstitutionalLearningValidationLedgerRecord {
  const base = { validation_record_id: id("CLL", "constitutional-learning-ledger", item.learning_validation_id), learning_validation_id: item.learning_validation_id, mission_id: item.mission_id, execution_id: item.execution_id, tenant_id: item.tenant_id, timestamp: item.validation_timestamp, artifact_type: item.artifact_type, validation_state: item.overall_validation_status, constitutional_reference: item.constitutional_reference, governance_reference: item.governance_reference, evidence_reference: item.evidence_reference, replay_reference: item.replay_reference, lineage_reference: item.lineage_reference, immutable: true as const, append_only: true as const };
  return Object.freeze({ ...base, integrity_hash: hashValue("constitutional-learning-ledger", base) });
}

function collectFailures(repository: Omit<ConstitutionalLearningValidationRepository, "integrity_hash"> | ConstitutionalLearningValidationRepository): readonly ConstitutionalLearningFailure[] {
  return unique([
    ...repository.failures,
    ...repository.rejections.map((item) => item.failure),
    ...(repository.records.some((item) => item.replay_reference.includes("mismatch")) ? ["LEARNING_REPLAY_INCONSISTENCY_DETECTED" as const] : []),
    ...(repository.records.some((item) => !item.integrity_hash) ? ["LEARNING_INTEGRITY_VERIFICATION_FAILED" as const] : []),
    ...(repository.records.some((item) => item.tenant_id !== "tenant:alpha") ? ["LEARNING_TENANT_ISOLATION_VIOLATION" as const] : []),
    ...(repository.records.some((item) => !item.evidence_reference || !item.constitutional_reference) ? ["CONSTITUTIONAL_EVIDENCE_MISSING" as const] : []),
    ...(repository.records.some((item) => !item.lineage_reference) ? ["LEARNING_VALIDATION_LINEAGE_INCOMPLETE" as const] : []),
    ...(repository.explanations.some((item) => !item.complete) ? ["CONSTITUTIONAL_EVIDENCE_MISSING" as const] : []),
  ]);
}

export function validateConstitutionalLearning(input: ConstitutionalLearningValidationInput = {}): ConstitutionalLearningValidationRepository {
  if (input.repository) return input.repository;
  const scenario = input.scenario ?? "BASELINE";
  const artifactType = input.artifactType ?? "KNOWLEDGE_EVOLUTION";
  const baseline = input.baseline ?? getConstitutionalBaselineContract();
  const replayRepository = input.replayRepository ?? validateConstitutionalReplay({ baseline });
  const failure = scenarioFailure(scenario);
  const validationRecord = record(scenario, artifactType, failure);
  const rejections = freezeArray(failure ? [rejection(validationRecord, failure)] : []);
  const explanations = freezeArray([explanation(validationRecord)]);
  const source = { repository_id: id("CLV", "constitutional-learning-repository", { scenario, artifactType, baseline: baseline.contract_id, replay: replayRepository.repository_id }), baseline_contract_id: baseline.contract_id, replay_validation_repository_id: replayRepository.repository_id, final_state: "CONSTITUTIONAL_LEARNING_VALIDATION_COMPLETE" as const, records: freezeArray([validationRecord]), rejections, explanations, ledger: freezeArray([ledger(validationRecord)]), failures: freezeArray(failure ? [failure] : []), validation_only: true as const, advisory_only: true as const, learning_activation_authorized: false as const, model_update_authorized: false as const, heuristic_deployment_authorized: false as const, policy_modification_authorized: false as const, constitutional_modification_authorized: false as const, authority_change_authorized: false as const, execution_behavior_change_authorized: false as const };
  const failures = unique([...collectFailures(source), ...(!validateConstitutionalBaseline(baseline).valid ? ["CONSTITUTIONAL_EVIDENCE_MISSING" as const] : []), ...(!validateConstitutionalReplayRepository(replayRepository).valid && replayRepository.failures.length > 0 ? ["LEARNING_REPLAY_INCONSISTENCY_DETECTED" as const] : [])]);
  const repository = { ...source, failures, final_state: failures.length ? "CONSTITUTIONAL_LEARNING_VALIDATION_FAIL_CLOSED" as const : source.final_state };
  return Object.freeze({ ...repository, integrity_hash: hashValue("constitutional-learning-repository", repository) });
}

export function listConstitutionalLearningRecords(input: ConstitutionalLearningValidationInput = {}) { return validateConstitutionalLearning(input).records; }
export function listConstitutionalLearningRejections(input: ConstitutionalLearningValidationInput = {}) { return validateConstitutionalLearning(input).rejections; }
export function listConstitutionalLearningExplanations(input: ConstitutionalLearningValidationInput = {}) { return validateConstitutionalLearning(input).explanations; }
export function listConstitutionalLearningLedger(input: ConstitutionalLearningValidationInput = {}) { return validateConstitutionalLearning(input).ledger; }

export function validateConstitutionalLearningRepository(repository = validateConstitutionalLearning()): ConstitutionalLearningValidationResult {
  const failures = unique([...collectFailures(repository), ...(!repository.integrity_hash ? ["LEARNING_INTEGRITY_VERIFICATION_FAILED" as const] : [])]);
  const has = (failure: ConstitutionalLearningFailure) => failures.includes(failure);
  const valid = failures.length === 0 && repository.final_state === "CONSTITUTIONAL_LEARNING_VALIDATION_COMPLETE" && repository.validation_only && !repository.learning_activation_authorized;
  const result = { repository_id: repository.repository_id, valid, deterministic_validation: !has("NONDETERMINISTIC_LEARNING_VALIDATION_DETECTED"), replay_identical: !has("LEARNING_REPLAY_INCONSISTENCY_DETECTED"), evidence_complete: !has("CONSTITUTIONAL_EVIDENCE_MISSING"), explainability_complete: repository.explanations.every((item) => item.complete), lineage_complete: !has("LEARNING_VALIDATION_LINEAGE_INCOMPLETE"), integrity_verified: !has("LEARNING_INTEGRITY_VERIFICATION_FAILED"), tenant_isolated: !has("LEARNING_TENANT_ISOLATION_VIOLATION"), governance_compliant: !has("GOVERNANCE_BYPASS_DETECTED"), operator_authorized: !has("OPERATOR_APPROVAL_BYPASS_DETECTED"), validation_only: true as const, fail_closed_ready: valid || failures.length > 0 || repository.final_state !== "CONSTITUTIONAL_LEARNING_VALIDATION_COMPLETE", no_learning_activation: !repository.learning_activation_authorized && !repository.model_update_authorized && !repository.heuristic_deployment_authorized, no_constitutional_mutation: !repository.constitutional_modification_authorized && !repository.policy_modification_authorized && !repository.authority_change_authorized, failures };
  return Object.freeze({ ...result, validation_hash: hashValue("constitutional-learning-validation-result", result) });
}

export function buildConstitutionalLearningObservabilitySurface(repository = validateConstitutionalLearning()): ConstitutionalLearningObservabilitySurface {
  return Object.freeze({ repository_id: repository.repository_id, final_state: repository.final_state, record_count: repository.records.length, rejection_count: repository.rejections.length, explanation_count: repository.explanations.length, ledger_count: repository.ledger.length, failure_count: repository.failures.length, validation_state: repository.records[0]?.overall_validation_status ?? "RESTRICTED", validation_only: true, learning_activation_authorized: false, model_update_authorized: false, integrity_hash: repository.integrity_hash });
}

export function getConstitutionalLearningValidationEngine(): ConstitutionalLearningValidationBundle {
  const repository = validateConstitutionalLearning();
  return Object.freeze({ doctrine: Object.freeze({ engine_version: VERSION, final_state: "CONSTITUTIONAL_LEARNING_VALIDATION_READY", validation_domains: domains, principles: freezeArray(["validation-before-activation", "advisory-only", "no-artifact-mutation", "no-model-update", "no-policy-change", "no-authority-change", "deterministic-replay", "immutable-learning-ledger"]) }), repository, validation: validateConstitutionalLearningRepository(repository), observability: buildConstitutionalLearningObservabilitySurface(repository) });
}
