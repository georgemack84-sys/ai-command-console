import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import { analyzeMissionExperience, validatePatternAnalysis } from "@/services/pattern-discovery-experience-analysis";
import type { OperationalPatternRecord, PatternAnalysisRepository } from "@/types/pattern-discovery-experience-analysis";
import type {
  CandidateArtifactLifecycleState,
  CandidateKnowledgeArtifact,
  CandidateKnowledgeArtifactType,
  CandidateKnowledgeRepository,
  TemplateHeuristicAuditRecord,
  TemplateHeuristicGenerationEngineBundle,
  TemplateHeuristicGenerationFailure,
  TemplateHeuristicGenerationInput,
  TemplateHeuristicGenerationObservabilitySurface,
  TemplateHeuristicGenerationScenario,
  TemplateHeuristicGenerationValidationResult,
} from "@/types/template-heuristic-generation-engine";

const VERSION = "template-heuristic-generation-engine/v8ALT.9.4" as const;
const artifactTypes = Object.freeze(["PLANNING_TEMPLATE", "EXECUTION_HEURISTIC", "RECOVERY_TEMPLATE", "DELEGATION_TEMPLATE", "COORDINATION_TEMPLATE", "CONFIDENCE_GUIDANCE", "RECOMMENDATION_GUIDANCE", "OPTIMIZATION_GUIDANCE"] as const);
const lifecycleStates = Object.freeze(["GENERATED", "NORMALIZED", "EVIDENCE_LINKED", "PRE_VALIDATED", "READY_FOR_VALIDATION", "SUPERSEDED", "ARCHIVED", "REJECTED"] as const);

function hashValue(domain: string, value: unknown): string { return hashConfidenceValue(domain, canonicalizeConfidenceToString(value)); }
function id(prefix: string, domain: string, value: unknown): string { return `${prefix}-${hashValue(domain, value).slice(0, 12).toUpperCase()}`; }
function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function unique<T extends string>(values: readonly T[]): readonly T[] { return freezeArray([...new Set(values)].sort()); }

function scenarioFailure(scenario: TemplateHeuristicGenerationScenario): TemplateHeuristicGenerationFailure | null {
  const map: Partial<Record<TemplateHeuristicGenerationScenario, TemplateHeuristicGenerationFailure>> = {
    INVALID_PATTERN_REPOSITORY: "INVALID_PATTERN_REPOSITORY",
    NON_CERTIFIED_PATTERN: "NON_CERTIFIED_PATTERN_REJECTED",
    UNSTABLE_PATTERN: "UNSTABLE_PATTERN_REJECTED",
    MISSING_EVIDENCE: "MISSING_EVIDENCE_DETECTED",
    REPLAY_INCONSISTENCY: "REPLAY_INCONSISTENCY_DETECTED",
    GOVERNANCE_VIOLATION: "GOVERNANCE_VIOLATION_DETECTED",
    CONSTITUTIONAL_VIOLATION: "CONSTITUTIONAL_VIOLATION_DETECTED",
    AUTHORITY_CONFLICT: "AUTHORITY_CONFLICT_DETECTED",
    INTEGRITY_FAILURE: "INTEGRITY_FAILURE_DETECTED",
    DUPLICATE_DETERMINISTIC_ARTIFACT: "DUPLICATE_DETERMINISTIC_ARTIFACT_DETECTED",
    AMBIGUOUS_TEMPLATE_GENERATION: "AMBIGUOUS_TEMPLATE_GENERATION_REJECTED",
    CROSS_TENANT_LEARNING_ATTEMPT: "CROSS_TENANT_LEARNING_DETECTED",
    ACTIVATION_ATTEMPTED: "ACTIVATION_ATTEMPTED",
    RUNTIME_MODIFICATION_ATTEMPTED: "RUNTIME_MODIFICATION_ATTEMPTED",
    PLANNING_MODIFICATION_ATTEMPTED: "PLANNING_MODIFICATION_ATTEMPTED",
    GOVERNANCE_MODIFICATION_ATTEMPTED: "GOVERNANCE_MODIFICATION_ATTEMPTED",
    HISTORICAL_OVERWRITE_ATTEMPTED: "HISTORICAL_OVERWRITE_ATTEMPTED",
    SELF_APPROVAL_ATTEMPTED: "SELF_APPROVAL_ATTEMPTED",
  };
  return map[scenario] ?? null;
}

function sourceRepository(scenario: TemplateHeuristicGenerationScenario, repository?: PatternAnalysisRepository): PatternAnalysisRepository {
  if (repository) return repository;
  if (scenario === "INVALID_PATTERN_REPOSITORY") return analyzeMissionExperience({ scenario: "INCOMPLETE_EVIDENCE" });
  return analyzeMissionExperience();
}

function artifactType(index: number): CandidateKnowledgeArtifactType {
  return artifactTypes[index % artifactTypes.length] ?? "PLANNING_TEMPLATE";
}

function buildArtifact(pattern: OperationalPatternRecord, index: number, scenario: TemplateHeuristicGenerationScenario): CandidateKnowledgeArtifact {
  const type = artifactType(index);
  const duplicate = scenario === "DUPLICATE_DETERMINISTIC_ARTIFACT" && index > 0;
  const nonCertified = scenario === "NON_CERTIFIED_PATTERN" && index === 0;
  const unstable = scenario === "UNSTABLE_PATTERN" && index === 0;
  const ambiguous = scenario === "AMBIGUOUS_TEMPLATE_GENERATION" && index === 0;
  const activationAttempted = scenario === "ACTIVATION_ATTEMPTED" && index === 0;
  const base = {
    artifact_id: duplicate ? id("CKA", "candidate-knowledge-artifact", { first: true }) : id("CKA", "candidate-knowledge-artifact", { pattern: pattern.pattern_id, type, index, scenario }),
    artifact_name: `${type.toLowerCase().replaceAll("_", " ")} candidate ${index + 1}`,
    artifact_type: type,
    version: "0.1.0",
    tenant_id: scenario === "CROSS_TENANT_LEARNING_ATTEMPT" && index === 0 ? "tenant:foreign" : pattern.tenant_id,
    source_patterns: freezeArray([pattern.pattern_id]),
    contributing_missions: pattern.contributing_missions,
    contributing_replays: scenario === "REPLAY_INCONSISTENCY" && index === 0 ? freezeArray(["replay:mismatch"]) : pattern.contributing_replays,
    contributing_knowledge_records: pattern.contributing_knowledge_records,
    template_definition: ambiguous ? freezeArray([]) : freezeArray([`select ${pattern.pattern_category.toLowerCase()}`, "preserve authority boundary", "prepare for governance validation"]),
    heuristic_definition: freezeArray([`use recurrence frequency ${pattern.recurrence_frequency}`, `calibrate confidence ${pattern.confidence_score.toFixed(2)}`, "remain advisory until approval"]),
    intended_usage: "Candidate knowledge for later validation and explicit operator approval.",
    applicability_conditions: ambiguous ? freezeArray([]) : freezeArray(["source pattern certified", "tenant match verified", "evidence replayable"]),
    stability_score: unstable ? 0.42 : pattern.stability_score,
    confidence_score: pattern.confidence_score,
    recurrence_frequency: pattern.recurrence_frequency,
    expected_improvement: 0.11 + index / 100,
    historical_success_rate: pattern.success_rate,
    evidence_chain: scenario === "MISSING_EVIDENCE" && index === 0 ? freezeArray([]) : pattern.evidence_chain,
    lineage_reference: pattern.lineage_references,
    replay_reference: scenario === "REPLAY_INCONSISTENCY" && index === 0 ? freezeArray(["replay:mismatch"]) : pattern.replay_references,
    governance_status: scenario === "GOVERNANCE_VIOLATION" && index === 0 ? "BLOCKED" as const : "PRE_VALIDATED" as const,
    constitutional_status: scenario === "CONSTITUTIONAL_VIOLATION" && index === 0 ? "BLOCKED" as const : "PRE_VALIDATED" as const,
    authority_status: scenario === "AUTHORITY_CONFLICT" && index === 0 ? "CONFLICT" as const : "PRESERVED" as const,
    generation_timestamp: "1970-01-01T00:00:00.000Z" as const,
    lifecycle_state: nonCertified || unstable || ambiguous ? "REJECTED" as const : "READY_FOR_VALIDATION" as const,
    activation_state: activationAttempted ? "PENDING_VALIDATION" as const : "INACTIVE" as const,
    explainability: freezeArray(["created from certified operational pattern", "candidate remains inactive", "governance validation required", "operator approval required", "runtime behavior unchanged"]),
    rejected_generation_alternatives: freezeArray(["direct activation", "runtime planner mutation", "self-approved deployment"]),
    advisory_only: true as const,
    activation_authorized: activationAttempted,
    runtime_modification_authorized: scenario === "RUNTIME_MODIFICATION_ATTEMPTED" && index === 0,
    planning_modification_authorized: scenario === "PLANNING_MODIFICATION_ATTEMPTED" && index === 0,
    governance_modification_authorized: scenario === "GOVERNANCE_MODIFICATION_ATTEMPTED" && index === 0,
    self_approval_authorized: scenario === "SELF_APPROVAL_ATTEMPTED" && index === 0,
    historical_truth_mutable: scenario === "HISTORICAL_OVERWRITE_ATTEMPTED" && index === 0,
  };
  const deterministic_signature = hashValue("candidate-artifact-signature", base);
  return Object.freeze({ ...base, deterministic_signature, integrity_hash: scenario === "INTEGRITY_FAILURE" && index === 0 ? "" : hashValue("candidate-knowledge-artifact", { ...base, deterministic_signature }) });
}

function audit(failure: TemplateHeuristicGenerationFailure, scenario: TemplateHeuristicGenerationScenario): TemplateHeuristicAuditRecord {
  const base = { audit_id: id("THA", "template-heuristic-audit", { failure, scenario }), artifact_id: null, rejection_reason: failure, immutable: true as const, append_only: true as const, replay_reference: `replay:generation:${failure}` };
  return Object.freeze({ ...base, integrity_hash: hashValue("template-heuristic-audit", base) });
}

function collectFailures(repository: Omit<CandidateKnowledgeRepository, "integrity_hash"> | CandidateKnowledgeRepository): readonly TemplateHeuristicGenerationFailure[] {
  const ids = repository.artifacts.map((artifact) => artifact.artifact_id);
  return unique([
    ...repository.failures,
    ...(repository.source_pattern_repository_state !== "PATTERN_ANALYSIS_COMPLETE" ? ["INVALID_PATTERN_REPOSITORY" as const] : []),
    ...(repository.artifacts.some((a) => a.lifecycle_state === "REJECTED") ? ["NON_CERTIFIED_PATTERN_REJECTED" as const] : []),
    ...(repository.artifacts.some((a) => a.stability_score < 0.7) ? ["UNSTABLE_PATTERN_REJECTED" as const] : []),
    ...(repository.artifacts.some((a) => a.evidence_chain.length === 0) ? ["MISSING_EVIDENCE_DETECTED" as const] : []),
    ...(repository.artifacts.some((a) => a.replay_reference.some((r) => r.includes("mismatch"))) ? ["REPLAY_INCONSISTENCY_DETECTED" as const] : []),
    ...(repository.artifacts.some((a) => a.governance_status === "BLOCKED") ? ["GOVERNANCE_VIOLATION_DETECTED" as const] : []),
    ...(repository.artifacts.some((a) => a.constitutional_status === "BLOCKED") ? ["CONSTITUTIONAL_VIOLATION_DETECTED" as const] : []),
    ...(repository.artifacts.some((a) => a.authority_status === "CONFLICT") ? ["AUTHORITY_CONFLICT_DETECTED" as const] : []),
    ...(repository.artifacts.some((a) => !a.integrity_hash || !a.deterministic_signature) ? ["INTEGRITY_FAILURE_DETECTED" as const] : []),
    ...(new Set(ids).size !== ids.length ? ["DUPLICATE_DETERMINISTIC_ARTIFACT_DETECTED" as const] : []),
    ...(repository.artifacts.some((a) => a.template_definition.length === 0 || a.applicability_conditions.length === 0) ? ["AMBIGUOUS_TEMPLATE_GENERATION_REJECTED" as const] : []),
    ...(repository.artifacts.some((a) => a.tenant_id !== "tenant:alpha") ? ["CROSS_TENANT_LEARNING_DETECTED" as const] : []),
    ...(repository.artifacts.some((a) => a.activation_authorized) ? ["ACTIVATION_ATTEMPTED" as const] : []),
    ...(repository.artifacts.some((a) => a.runtime_modification_authorized) ? ["RUNTIME_MODIFICATION_ATTEMPTED" as const] : []),
    ...(repository.artifacts.some((a) => a.planning_modification_authorized) ? ["PLANNING_MODIFICATION_ATTEMPTED" as const] : []),
    ...(repository.artifacts.some((a) => a.governance_modification_authorized) ? ["GOVERNANCE_MODIFICATION_ATTEMPTED" as const] : []),
    ...(repository.artifacts.some((a) => a.historical_truth_mutable) ? ["HISTORICAL_OVERWRITE_ATTEMPTED" as const] : []),
    ...(repository.artifacts.some((a) => a.self_approval_authorized) ? ["SELF_APPROVAL_ATTEMPTED" as const] : []),
  ]);
}

export function generateTemplateHeuristicKnowledge(input: TemplateHeuristicGenerationInput = {}): CandidateKnowledgeRepository {
  if (input.repository) return input.repository;
  const scenario = input.scenario ?? "BASELINE";
  const patternRepository = sourceRepository(scenario, input.patternRepository);
  const patternValidation = validatePatternAnalysis(patternRepository);
  const injected = scenarioFailure(scenario);
  const artifacts = freezeArray(patternRepository.patterns.slice(0, 8).map((pattern, index) => buildArtifact(pattern, index, scenario)));
  const source = {
    repository_id: id("THG", "template-heuristic-generation", { source: patternRepository.repository_id, scenario }),
    source_pattern_repository_id: patternRepository.repository_id,
    source_pattern_repository_state: patternRepository.final_state,
    final_state: "CANDIDATE_KNOWLEDGE_GENERATED" as const,
    artifacts,
    audit_records: freezeArray<TemplateHeuristicAuditRecord>([]),
    failures: unique([...(injected ? [injected] : []), ...(!patternValidation.valid ? ["INVALID_PATTERN_REPOSITORY" as const] : [])]),
    advisory_only: true as const,
    activation_authorized: false as const,
    runtime_modification_authorized: false as const,
    planning_modification_authorized: false as const,
    governance_modification_authorized: false as const,
    self_approval_authorized: false as const,
    historical_truth_mutable: false as const,
  };
  const failures = collectFailures(source);
  const audit_records = freezeArray(failures.map((failure) => audit(failure, scenario)));
  const repository = { ...source, failures, audit_records, final_state: failures.length ? "CANDIDATE_KNOWLEDGE_REJECTED" as const : source.final_state };
  return Object.freeze({ ...repository, integrity_hash: scenario === "INTEGRITY_FAILURE" ? "" : hashValue("candidate-knowledge-repository", repository) });
}

export function listCandidateKnowledgeArtifacts(input: TemplateHeuristicGenerationInput = {}) { return generateTemplateHeuristicKnowledge(input).artifacts; }
export function listPlanningTemplates(input: TemplateHeuristicGenerationInput = {}) { return generateTemplateHeuristicKnowledge(input).artifacts.filter((artifact) => artifact.artifact_type.includes("TEMPLATE")); }
export function listExecutionHeuristics(input: TemplateHeuristicGenerationInput = {}) { return generateTemplateHeuristicKnowledge(input).artifacts.filter((artifact) => artifact.artifact_type.includes("HEURISTIC") || artifact.artifact_type.includes("GUIDANCE")); }
export function listTemplateHeuristicAuditRecords(input: TemplateHeuristicGenerationInput = {}) { return generateTemplateHeuristicKnowledge(input).audit_records; }

export function validateTemplateHeuristicGeneration(repository = generateTemplateHeuristicKnowledge()): TemplateHeuristicGenerationValidationResult {
  const failures = unique([...collectFailures(repository), ...(!repository.integrity_hash ? ["INTEGRITY_FAILURE_DETECTED" as const] : [])]);
  const has = (failure: TemplateHeuristicGenerationFailure) => failures.includes(failure);
  const inactive = repository.artifacts.every((artifact) => artifact.activation_state === "INACTIVE" && !artifact.activation_authorized);
  const valid = failures.length === 0 && repository.final_state === "CANDIDATE_KNOWLEDGE_GENERATED" && repository.advisory_only && inactive && !repository.runtime_modification_authorized && !repository.planning_modification_authorized;
  const source = { repository_id: repository.repository_id, valid, source_patterns_valid: !has("INVALID_PATTERN_REPOSITORY") && !has("NON_CERTIFIED_PATTERN_REJECTED") && !has("UNSTABLE_PATTERN_REJECTED"), evidence_complete: !has("MISSING_EVIDENCE_DETECTED"), replay_compatible: !has("REPLAY_INCONSISTENCY_DETECTED"), lineage_complete: repository.artifacts.every((artifact) => artifact.lineage_reference.length > 0), integrity_verified: !has("INTEGRITY_FAILURE_DETECTED"), governance_compatible: !has("GOVERNANCE_VIOLATION_DETECTED") && !has("GOVERNANCE_MODIFICATION_ATTEMPTED"), constitutional_compatible: !has("CONSTITUTIONAL_VIOLATION_DETECTED"), authority_preserved: !has("AUTHORITY_CONFLICT_DETECTED") && !has("RUNTIME_MODIFICATION_ATTEMPTED") && !has("PLANNING_MODIFICATION_ATTEMPTED") && !has("SELF_APPROVAL_ATTEMPTED"), deterministic_generation: !has("AMBIGUOUS_TEMPLATE_GENERATION_REJECTED"), duplicate_artifacts_absent: !has("DUPLICATE_DETERMINISTIC_ARTIFACT_DETECTED"), tenant_isolated: !has("CROSS_TENANT_LEARNING_DETECTED"), inactive_until_approved: inactive && !has("ACTIVATION_ATTEMPTED"), historical_truth_preserved: !has("HISTORICAL_OVERWRITE_ATTEMPTED"), advisory_only: true as const, fail_closed: valid || failures.length > 0 || repository.final_state !== "CANDIDATE_KNOWLEDGE_GENERATED", failures };
  return Object.freeze({ ...source, validation_hash: hashValue("template-heuristic-validation", source) });
}

export function buildTemplateHeuristicGenerationObservabilitySurface(repository = generateTemplateHeuristicKnowledge()): TemplateHeuristicGenerationObservabilitySurface {
  return Object.freeze({ repository_id: repository.repository_id, final_state: repository.final_state, artifact_count: repository.artifacts.length, template_count: repository.artifacts.filter((artifact) => artifact.artifact_type.includes("TEMPLATE")).length, heuristic_count: repository.artifacts.filter((artifact) => artifact.artifact_type.includes("HEURISTIC") || artifact.artifact_type.includes("GUIDANCE")).length, audit_count: repository.audit_records.length, failure_count: repository.failures.length, ready_for_validation_count: repository.artifacts.filter((artifact) => artifact.lifecycle_state === "READY_FOR_VALIDATION").length, advisory_only: true, activation_authorized: false, integrity_hash: repository.integrity_hash });
}

export function getTemplateHeuristicGenerationEngine(): TemplateHeuristicGenerationEngineBundle {
  const repository = generateTemplateHeuristicKnowledge();
  return Object.freeze({ doctrine: Object.freeze({ engine_version: VERSION, final_state: "TEMPLATE_HEURISTIC_GENERATION_READY", artifact_types: artifactTypes, lifecycle_states: lifecycleStates, principles: freezeArray(["candidate-only", "advisory-only", "operator-approval-required", "deterministic-generation", "evidence-linked", "replay-compatible", "tenant-isolated", "no-runtime-modification", "no-self-approval"]) }), repository, validation: validateTemplateHeuristicGeneration(repository), observability: buildTemplateHeuristicGenerationObservabilitySurface(repository) });
}
