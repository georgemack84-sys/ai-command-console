import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import { getConstitutionalBaselineContract, validateConstitutionalBaseline } from "@/services/constitutional-baseline-contract";
import { validateContinuousConstitutionalCompliance } from "@/services/continuous-constitutional-validation";
import { monitorRuntimeConstitutionalCompliance, validateRuntimeConstitutionalMonitoring } from "@/services/runtime-constitutional-monitoring";
import { detectConstitutionalViolations, validateConstitutionalViolationDetection } from "@/services/constitutional-violation-detection";
import { assessConstitutionalResilience, validateConstitutionalResilienceAssessment } from "@/services/constitutional-resilience-assessment";
import type {
  ConstitutionalRecommendationAuditRecord,
  ConstitutionalRecommendationBundle,
  ConstitutionalRecommendationConfidence,
  ConstitutionalRecommendationExplanation,
  ConstitutionalRecommendationFailure,
  ConstitutionalRecommendationInput,
  ConstitutionalRecommendationLedgerRecord,
  ConstitutionalRecommendationObservabilitySurface,
  ConstitutionalRecommendationPriority,
  ConstitutionalRecommendationRecord,
  ConstitutionalRecommendationRepository,
  ConstitutionalRecommendationScenario,
  ConstitutionalRecommendationType,
  ConstitutionalRecommendationValidationResult,
} from "@/types/constitutional-recommendation-engine";
import type { ConstitutionalResilienceScenario } from "@/types/constitutional-resilience-assessment";
import type { ConstitutionalViolationScenario } from "@/types/constitutional-violation-detection";

const VERSION = "constitutional-recommendation-engine/v8ALT.10.6" as const;
const threshold = 0.75 as const;
const domains = Object.freeze(["ADDITIONAL_MONITORING", "ADDITIONAL_EVIDENCE", "OPERATOR_REVIEW", "POLICY_REVIEW", "GOVERNANCE_REVIEW", "REPLAY_VALIDATION", "CONFIDENCE_RECALIBRATION", "OPTIMIZATION_REVIEW", "LEARNING_REVIEW"] as const);

function hashValue(domain: string, value: unknown): string { return hashConfidenceValue(domain, canonicalizeConfidenceToString(value)); }
function id(prefix: string, domain: string, value: unknown): string { return `${prefix}-${hashValue(domain, value).slice(0, 12).toUpperCase()}`; }
function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function unique<T extends string>(values: readonly T[]): readonly T[] { return freezeArray([...new Set(values)].sort()); }
function round(value: number): number { return Math.round(value * 10000) / 10000; }

function scenarioFailure(scenario: ConstitutionalRecommendationScenario): ConstitutionalRecommendationFailure | null {
  const map: Partial<Record<ConstitutionalRecommendationScenario, ConstitutionalRecommendationFailure>> = {
    NONDETERMINISTIC_RECOMMENDATION: "NONDETERMINISTIC_RECOMMENDATION_DETECTED",
    INCOMPLETE_RECOMMENDATION_EVIDENCE: "RECOMMENDATION_EVIDENCE_INCOMPLETE",
    MISSING_RECOMMENDATION_GOVERNANCE: "RECOMMENDATION_GOVERNANCE_REFERENCE_MISSING",
    AUTHORITY_VALIDATION_FAILED: "RECOMMENDATION_AUTHORITY_VALIDATION_FAILED",
    UNVERIFIABLE_REPLAY_REFERENCE: "RECOMMENDATION_REPLAY_REFERENCE_UNVERIFIABLE",
    CONFIDENCE_CALCULATION_UNAVAILABLE: "RECOMMENDATION_CONFIDENCE_UNAVAILABLE",
    INCOMPLETE_RECOMMENDATION_EXPLAINABILITY: "RECOMMENDATION_EXPLAINABILITY_INCOMPLETE",
    AUTONOMOUS_EXECUTION_IMPLIED: "RECOMMENDATION_AUTONOMOUS_EXECUTION_IMPLIED",
    CONSTITUTIONAL_BEHAVIOR_MODIFICATION: "RECOMMENDATION_CONSTITUTIONAL_BEHAVIOR_MODIFICATION",
    RECOMMENDATION_LINEAGE_BROKEN: "RECOMMENDATION_LINEAGE_BROKEN",
    RECOMMENDATION_INTEGRITY_FAILURE: "RECOMMENDATION_INTEGRITY_FAILURE",
    RECOMMENDATION_TENANT_ISOLATION_COMPROMISED: "RECOMMENDATION_TENANT_ISOLATION_COMPROMISED",
  };
  return map[scenario] ?? null;
}

function resilienceScenarioFor(scenario: ConstitutionalRecommendationScenario): ConstitutionalResilienceScenario {
  const recommendationOnly = new Set<ConstitutionalRecommendationScenario>(["ADDITIONAL_MONITORING", "ADDITIONAL_EVIDENCE", "OPERATOR_REVIEW", "POLICY_REVIEW", "GOVERNANCE_REVIEW", "REPLAY_VALIDATION", "CONFIDENCE_RECALIBRATION", "OPTIMIZATION_REVIEW", "LEARNING_REVIEW", "LOW_CONFIDENCE_RECOMMENDATION", "NONDETERMINISTIC_RECOMMENDATION", "INCOMPLETE_RECOMMENDATION_EVIDENCE", "MISSING_RECOMMENDATION_GOVERNANCE", "AUTHORITY_VALIDATION_FAILED", "UNVERIFIABLE_REPLAY_REFERENCE", "CONFIDENCE_CALCULATION_UNAVAILABLE", "INCOMPLETE_RECOMMENDATION_EXPLAINABILITY", "AUTONOMOUS_EXECUTION_IMPLIED", "CONSTITUTIONAL_BEHAVIOR_MODIFICATION", "RECOMMENDATION_LINEAGE_BROKEN", "RECOMMENDATION_INTEGRITY_FAILURE", "RECOMMENDATION_TENANT_ISOLATION_COMPROMISED"]);
  return recommendationOnly.has(scenario) ? "BASELINE" : scenario as ConstitutionalResilienceScenario;
}

function violationScenarioFor(scenario: ConstitutionalResilienceScenario): ConstitutionalViolationScenario {
  const resilienceOnly = new Set<ConstitutionalResilienceScenario>(["NONDETERMINISTIC_SCORING", "WEIGHT_MUTATION", "MISSING_CONSTITUTIONAL_REFERENCE", "INCOMPLETE_GOVERNANCE_EVIDENCE", "AUTHORITY_VALIDATION_UNAVAILABLE", "OPERATOR_CONTROL_UNCONFIRMED", "TENANT_ISOLATION_EVIDENCE_UNAVAILABLE", "ASSESSMENT_LINEAGE_BROKEN", "HEALTH_CALCULATION_UNAVAILABLE"]);
  return resilienceOnly.has(scenario) ? "BASELINE" : scenario as ConstitutionalViolationScenario;
}

function affectedType(scenario: ConstitutionalRecommendationScenario): ConstitutionalRecommendationType | null {
  return domains.includes(scenario as ConstitutionalRecommendationType) ? scenario as ConstitutionalRecommendationType : null;
}

function priorityFor(type: ConstitutionalRecommendationType, scenario: ConstitutionalRecommendationScenario, failure: ConstitutionalRecommendationFailure | null): ConstitutionalRecommendationPriority {
  if (failure === "RECOMMENDATION_AUTONOMOUS_EXECUTION_IMPLIED" || failure === "RECOMMENDATION_CONSTITUTIONAL_BEHAVIOR_MODIFICATION") return "MANDATORY_REVIEW";
  if (["AUTHORITY_VALIDATION_FAILED", "CONSTITUTIONAL_BYPASS", "GOVERNANCE_BYPASS", "TENANT_LEAKAGE"].includes(scenario)) return "CRITICAL";
  if (["OPERATOR_REVIEW", "GOVERNANCE_REVIEW", "REPLAY_VALIDATION"].includes(type)) return "HIGH";
  if (["POLICY_REVIEW", "CONFIDENCE_RECALIBRATION", "OPTIMIZATION_REVIEW", "LEARNING_REVIEW"].includes(type)) return "MEDIUM";
  if (type === "ADDITIONAL_EVIDENCE") return "LOW";
  return "INFORMATIONAL";
}

function baseConfidence(type: ConstitutionalRecommendationType, scenario: ConstitutionalRecommendationScenario, failure: ConstitutionalRecommendationFailure | null): number {
  if (scenario === "LOW_CONFIDENCE_RECOMMENDATION" && type === "ADDITIONAL_EVIDENCE") return 0.62;
  if (failure === "RECOMMENDATION_CONFIDENCE_UNAVAILABLE") return 0;
  if (failure) return 0.88;
  if (affectedType(scenario) === type) return 0.91;
  return 0.95;
}

function confidenceFor(recommendation_id: string, type: ConstitutionalRecommendationType, scenario: ConstitutionalRecommendationScenario, failure: ConstitutionalRecommendationFailure | null): ConstitutionalRecommendationConfidence {
  const overall = baseConfidence(type, scenario, failure);
  const base = {
    confidence_id: id("CRE-C", "constitutional-recommendation-confidence", recommendation_id),
    recommendation_id,
    evidence_confidence: scenario === "INCOMPLETE_RECOMMENDATION_EVIDENCE" ? 0 : overall,
    constitutional_confidence: scenario === "CONSTITUTIONAL_BEHAVIOR_MODIFICATION" ? 0.4 : overall,
    governance_confidence: scenario === "MISSING_RECOMMENDATION_GOVERNANCE" ? 0 : overall,
    replay_confidence: scenario === "UNVERIFIABLE_REPLAY_REFERENCE" ? 0 : overall,
    historical_confidence: overall,
    trend_confidence: overall,
    overall_recommendation_confidence: overall,
    threshold,
    suppressed: overall < threshold,
  };
  return Object.freeze({ ...base, integrity_hash: hashValue("constitutional-recommendation-confidence", base) });
}

function recommendation(type: ConstitutionalRecommendationType, index: number, scenario: ConstitutionalRecommendationScenario, failure: ConstitutionalRecommendationFailure | null): ConstitutionalRecommendationRecord {
  const recommendation_id = id("CRE", "constitutional-recommendation", { type, scenario, index });
  const confidence = baseConfidence(type, scenario, failure);
  const suppressed = confidence < threshold;
  const base = {
    recommendation_id,
    mission_id: "mission:constitutional-recommendation-engine",
    execution_id: `execution:constitutional-recommendation:${index}`,
    tenant_id: scenario === "RECOMMENDATION_TENANT_ISOLATION_COMPROMISED" ? "tenant:foreign" : "tenant:alpha",
    constitution_version: "constitutional-baseline-contract/v8ALT.10.1" as const,
    recommendation_timestamp: "1970-01-01T00:00:00.000Z" as const,
    recommendation_type: type,
    priority: priorityFor(type, scenario, failure),
    recommendation_summary: `${type.toLowerCase().replaceAll("_", " ")} recommended for constitutional resilience review`,
    constitutional_rationale: scenario === "CONSTITUTIONAL_BEHAVIOR_MODIFICATION" ? "invalid rationale implies constitutional behavior modification" : `strengthen ${type.toLowerCase()} without changing constitutional behavior`,
    supporting_evidence: scenario === "INCOMPLETE_RECOMMENDATION_EVIDENCE" ? freezeArray<string>([]) : freezeArray([`evidence:recommendation:${type.toLowerCase()}`, `resilience:evidence:${index}`]),
    governance_reference: scenario === "MISSING_RECOMMENDATION_GOVERNANCE" ? "" : `governance:recommendation:${type.toLowerCase()}`,
    authority_reference: scenario === "AUTHORITY_VALIDATION_FAILED" ? "" : `authority:recommendation:${type.toLowerCase()}`,
    replay_reference: scenario === "UNVERIFIABLE_REPLAY_REFERENCE" ? "" : `replay:recommendation:${type.toLowerCase()}`,
    confidence_score: confidence,
    expected_benefit: `improve ${type.toLowerCase()} resilience while preserving advisory boundaries`,
    operator_action_required: ["OPERATOR_REVIEW", "OPTIMIZATION_REVIEW", "LEARNING_REVIEW"].includes(type) || failure === "RECOMMENDATION_AUTONOMOUS_EXECUTION_IMPLIED",
    governance_action_required: type !== "ADDITIONAL_MONITORING" || Boolean(failure),
    status: suppressed ? "SUPPRESSED" as const : "PRESENTED" as const,
    lineage_reference: scenario === "RECOMMENDATION_LINEAGE_BROKEN" ? "" : `lineage:recommendation:${type.toLowerCase()}`,
    advisory_only: true as const,
    execution_authorized: false as const,
    policy_modification_authorized: false as const,
    constitutional_modification_authorized: false as const,
    authority_grant_authorized: false as const,
    governance_bypass_authorized: false as const,
    optimization_deployment_authorized: false as const,
    learning_activation_authorized: false as const,
    replay_mutation_authorized: false as const,
    confidence_algorithm_mutation_authorized: false as const,
    production_configuration_write_authorized: false as const,
  };
  return Object.freeze({ ...base, integrity_hash: scenario === "RECOMMENDATION_INTEGRITY_FAILURE" ? "" : hashValue("constitutional-recommendation-record", base) });
}

function explanation(item: ConstitutionalRecommendationRecord, scenario: ConstitutionalRecommendationScenario): ConstitutionalRecommendationExplanation {
  const complete = scenario !== "INCOMPLETE_RECOMMENDATION_EXPLAINABILITY" && item.supporting_evidence.length > 0 && Boolean(item.governance_reference && item.authority_reference && item.replay_reference);
  const base = {
    explanation_id: id("CRE-E", "constitutional-recommendation-explanation", item.recommendation_id),
    recommendation_id: item.recommendation_id,
    constitutional_objective: "strengthen constitutional resilience while preserving immutability",
    reason_for_recommendation: item.recommendation_summary,
    supporting_evidence: item.supporting_evidence,
    affected_subsystem: `subsystem:${item.recommendation_type.toLowerCase()}`,
    constitutional_rules_referenced: freezeArray(["constitutional-rule:advisory-only", "constitutional-rule:operator-supremacy", "constitutional-rule:governance-supremacy"]),
    governance_rationale: item.governance_reference ? "governance review remains required before implementation planning" : "",
    authority_rationale: item.authority_reference ? "recommendation grants no authority" : "",
    replay_references: item.replay_reference ? freezeArray([item.replay_reference]) : freezeArray<string>([]),
    confidence_calculation: `${item.confidence_score} compared to threshold ${threshold}`,
    projected_constitutional_benefit: item.expected_benefit,
    known_limitations: freezeArray(["advisory guidance only", "requires governance and operator review before any future action"]),
    implementation_prerequisites: freezeArray(["operator authorization", "governance approval", "replay verification"]),
    complete,
    deterministic: true as const,
    replayable: true as const,
  };
  return Object.freeze({ ...base, integrity_hash: hashValue("constitutional-recommendation-explanation", base) });
}

function ledger(item: ConstitutionalRecommendationRecord): ConstitutionalRecommendationLedgerRecord {
  const base = { recommendation_record_id: id("CRE-L", "constitutional-recommendation-ledger", item.recommendation_id), recommendation_id: item.recommendation_id, mission_id: item.mission_id, execution_id: item.execution_id, tenant_id: item.tenant_id, timestamp: item.recommendation_timestamp, priority: item.priority, confidence: item.confidence_score, status: item.status, constitutional_reference: item.constitution_version, evidence_reference: item.supporting_evidence[0] ?? "", replay_reference: item.replay_reference, lineage_reference: item.lineage_reference, operator_response: item.operator_action_required ? "PENDING_REVIEW" as const : "NONE" as const, governance_response: item.governance_action_required ? "PENDING_REVIEW" as const : "NONE" as const, immutable: true as const, append_only: true as const };
  return Object.freeze({ ...base, integrity_hash: hashValue("constitutional-recommendation-ledger", base) });
}

function audit(item: ConstitutionalRecommendationRecord, reason: "BELOW_CONFIDENCE_THRESHOLD" | ConstitutionalRecommendationFailure): ConstitutionalRecommendationAuditRecord {
  const base = { audit_id: id("CRE-A", "constitutional-recommendation-audit", { recommendation: item.recommendation_id, reason }), recommendation_id: item.recommendation_id, reason, immutable: true as const, append_only: true as const, evidence_reference: item.supporting_evidence[0] ?? "evidence:recommendation:suppressed", replay_reference: item.replay_reference || "replay:recommendation:missing" };
  return Object.freeze({ ...base, integrity_hash: hashValue("constitutional-recommendation-audit", base) });
}

function collectFailures(repository: Omit<ConstitutionalRecommendationRepository, "integrity_hash"> | ConstitutionalRecommendationRepository): readonly ConstitutionalRecommendationFailure[] {
  const all = [...repository.recommendations, ...repository.suppressed_recommendations];
  return unique([
    ...repository.failures,
    ...("integrity_hash" in repository && !repository.integrity_hash ? ["RECOMMENDATION_INTEGRITY_FAILURE" as const] : []),
    ...(all.some((item) => item.supporting_evidence.length === 0) ? ["RECOMMENDATION_EVIDENCE_INCOMPLETE" as const] : []),
    ...(all.some((item) => !item.governance_reference) ? ["RECOMMENDATION_GOVERNANCE_REFERENCE_MISSING" as const] : []),
    ...(all.some((item) => !item.authority_reference) ? ["RECOMMENDATION_AUTHORITY_VALIDATION_FAILED" as const] : []),
    ...(all.some((item) => !item.replay_reference) ? ["RECOMMENDATION_REPLAY_REFERENCE_UNVERIFIABLE" as const] : []),
    ...(repository.confidence.some((item) => item.overall_recommendation_confidence === 0) ? ["RECOMMENDATION_CONFIDENCE_UNAVAILABLE" as const] : []),
    ...(repository.explanations.some((item) => !item.complete) ? ["RECOMMENDATION_EXPLAINABILITY_INCOMPLETE" as const] : []),
    ...(all.some((item) => !item.lineage_reference) ? ["RECOMMENDATION_LINEAGE_BROKEN" as const] : []),
    ...(all.some((item) => !item.integrity_hash) ? ["RECOMMENDATION_INTEGRITY_FAILURE" as const] : []),
    ...(all.some((item) => item.tenant_id !== "tenant:alpha") ? ["RECOMMENDATION_TENANT_ISOLATION_COMPROMISED" as const] : []),
    ...(all.some((item) => item.constitutional_rationale.includes("constitutional behavior modification")) ? ["RECOMMENDATION_CONSTITUTIONAL_BEHAVIOR_MODIFICATION" as const] : []),
  ]);
}

export function generateConstitutionalRecommendations(input: ConstitutionalRecommendationInput = {}): ConstitutionalRecommendationRepository {
  if (input.repository) return input.repository;
  const scenario = input.scenario ?? "BASELINE";
  const baseline = input.baseline ?? getConstitutionalBaselineContract();
  const validationRepository = validateContinuousConstitutionalCompliance({ baseline });
  const runtimeRepository = input.runtimeRepository ?? monitorRuntimeConstitutionalCompliance({ baseline, validationRepository });
  const resilienceScenario = resilienceScenarioFor(scenario);
  const violationRepository = input.violationRepository ?? detectConstitutionalViolations({ baseline, validationRepository, runtimeRepository, scenario: violationScenarioFor(resilienceScenario) });
  const resilienceRepository = input.resilienceRepository ?? assessConstitutionalResilience({ baseline, validationRepository, runtimeRepository, violationRepository, scenario: resilienceScenario });
  const failure = scenarioFailure(scenario);
  const candidates = freezeArray(domains.map((type, index) => recommendation(type, index, scenario, failure)));
  const confidence = freezeArray(candidates.map((item) => confidenceFor(item.recommendation_id, item.recommendation_type, scenario, failure)));
  const recommendations = freezeArray(candidates.filter((item) => item.status !== "SUPPRESSED"));
  const suppressed = freezeArray(candidates.filter((item) => item.status === "SUPPRESSED"));
  const explanations = freezeArray(candidates.map((item) => explanation(item, scenario)));
  const failureAudits = failure ? candidates.map((item) => audit(item, failure)) : [];
  const source = {
    repository_id: id("CRE", "constitutional-recommendation-repository", { scenario, baseline: baseline.contract_id, runtime: runtimeRepository.repository_id, violation: violationRepository.repository_id, resilience: resilienceRepository.repository_id }),
    baseline_contract_id: baseline.contract_id,
    runtime_monitoring_repository_id: runtimeRepository.repository_id,
    violation_detection_repository_id: violationRepository.repository_id,
    resilience_assessment_repository_id: resilienceRepository.repository_id,
    final_state: "CONSTITUTIONAL_RECOMMENDATION_ENGINE_COMPLETE" as const,
    confidence_threshold: threshold,
    recommendations,
    suppressed_recommendations: suppressed,
    confidence,
    explanations,
    ledger: freezeArray(candidates.map(ledger)),
    audit_records: freezeArray([...suppressed.map((item) => audit(item, "BELOW_CONFIDENCE_THRESHOLD")), ...failureAudits]),
    failures: freezeArray(failure ? [failure] : []),
    advisory_only: true as const,
    execution_authorized: false as const,
    policy_modification_authorized: false as const,
    constitutional_modification_authorized: false as const,
    authority_grant_authorized: false as const,
    governance_bypass_authorized: false as const,
    optimization_deployment_authorized: false as const,
    learning_activation_authorized: false as const,
    replay_mutation_authorized: false as const,
    confidence_algorithm_mutation_authorized: false as const,
    production_configuration_write_authorized: false as const,
  };
  const failures = unique([...collectFailures(source), ...(!validateConstitutionalBaseline(baseline).valid ? ["RECOMMENDATION_EVIDENCE_INCOMPLETE" as const] : []), ...(!validateRuntimeConstitutionalMonitoring(runtimeRepository).valid ? ["RECOMMENDATION_EVIDENCE_INCOMPLETE" as const] : []), ...(!validateConstitutionalViolationDetection(violationRepository).valid && violationRepository.failures.length > 0 ? ["RECOMMENDATION_EVIDENCE_INCOMPLETE" as const] : []), ...(!validateConstitutionalResilienceAssessment(resilienceRepository).valid && resilienceRepository.failures.length > 0 ? ["RECOMMENDATION_EVIDENCE_INCOMPLETE" as const] : [])]);
  const repository = { ...source, failures, final_state: failures.length ? "CONSTITUTIONAL_RECOMMENDATION_ENGINE_FAIL_CLOSED" as const : source.final_state };
  return Object.freeze({ ...repository, integrity_hash: hashValue("constitutional-recommendation-repository", repository) });
}

export function listConstitutionalRecommendations(input: ConstitutionalRecommendationInput = {}) { return generateConstitutionalRecommendations(input).recommendations; }
export function listConstitutionalRecommendationConfidence(input: ConstitutionalRecommendationInput = {}) { return generateConstitutionalRecommendations(input).confidence; }
export function listConstitutionalRecommendationExplanations(input: ConstitutionalRecommendationInput = {}) { return generateConstitutionalRecommendations(input).explanations; }
export function listSuppressedConstitutionalRecommendations(input: ConstitutionalRecommendationInput = {}) { return generateConstitutionalRecommendations(input).suppressed_recommendations; }
export function listConstitutionalRecommendationLedger(input: ConstitutionalRecommendationInput = {}) { return generateConstitutionalRecommendations(input).ledger; }

export function validateConstitutionalRecommendationEngine(repository = generateConstitutionalRecommendations()): ConstitutionalRecommendationValidationResult {
  const failures = unique([...collectFailures(repository), ...(!repository.integrity_hash ? ["RECOMMENDATION_INTEGRITY_FAILURE" as const] : [])]);
  const has = (failure: ConstitutionalRecommendationFailure) => failures.includes(failure);
  const valid = failures.length === 0 && repository.final_state === "CONSTITUTIONAL_RECOMMENDATION_ENGINE_COMPLETE" && repository.advisory_only && !repository.execution_authorized && !repository.constitutional_modification_authorized;
  const result = { repository_id: repository.repository_id, valid, deterministic_recommendations: !has("NONDETERMINISTIC_RECOMMENDATION_DETECTED"), evidence_complete: !has("RECOMMENDATION_EVIDENCE_INCOMPLETE"), governance_references_complete: !has("RECOMMENDATION_GOVERNANCE_REFERENCE_MISSING"), authority_validated: !has("RECOMMENDATION_AUTHORITY_VALIDATION_FAILED"), replay_verified: !has("RECOMMENDATION_REPLAY_REFERENCE_UNVERIFIABLE"), confidence_calculated: !has("RECOMMENDATION_CONFIDENCE_UNAVAILABLE"), explainability_complete: !has("RECOMMENDATION_EXPLAINABILITY_INCOMPLETE"), lineage_complete: !has("RECOMMENDATION_LINEAGE_BROKEN"), integrity_verified: !has("RECOMMENDATION_INTEGRITY_FAILURE"), tenant_isolated: !has("RECOMMENDATION_TENANT_ISOLATION_COMPROMISED"), advisory_only: true as const, fail_closed_ready: valid || failures.length > 0 || repository.final_state !== "CONSTITUTIONAL_RECOMMENDATION_ENGINE_COMPLETE", no_autonomous_execution: !repository.execution_authorized && !repository.optimization_deployment_authorized && !repository.learning_activation_authorized, no_constitutional_mutation: !repository.constitutional_modification_authorized && !repository.policy_modification_authorized && !repository.authority_grant_authorized, failures };
  return Object.freeze({ ...result, validation_hash: hashValue("constitutional-recommendation-validation", result) });
}

export function buildConstitutionalRecommendationObservabilitySurface(repository = generateConstitutionalRecommendations()): ConstitutionalRecommendationObservabilitySurface {
  return Object.freeze({ repository_id: repository.repository_id, final_state: repository.final_state, recommendation_count: repository.recommendations.length, suppressed_count: repository.suppressed_recommendations.length, confidence_count: repository.confidence.length, explanation_count: repository.explanations.length, ledger_count: repository.ledger.length, audit_count: repository.audit_records.length, failure_count: repository.failures.length, advisory_only: true, execution_authorized: false, constitutional_modification_authorized: false, integrity_hash: repository.integrity_hash });
}

export function getConstitutionalRecommendationEngine(): ConstitutionalRecommendationBundle {
  const repository = generateConstitutionalRecommendations();
  return Object.freeze({ doctrine: Object.freeze({ engine_version: VERSION, final_state: "CONSTITUTIONAL_RECOMMENDATION_ENGINE_READY", recommendation_domains: domains, principles: freezeArray(["strictly-advisory", "deterministic-recommendations", "confidence-threshold-suppression", "complete-explainability", "append-only-ledger", "governance-dashboard-ready", "no-execution", "no-policy-change", "no-authority-grant", "no-learning-activation"]) }), repository, validation: validateConstitutionalRecommendationEngine(repository), observability: buildConstitutionalRecommendationObservabilitySurface(repository) });
}
