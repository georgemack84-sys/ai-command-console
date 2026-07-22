import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import { getConstitutionalBaselineContract, validateConstitutionalBaseline } from "@/services/constitutional-baseline-contract";
import { validateContinuousConstitutionalCompliance, validateContinuousConstitutionalRepository } from "@/services/continuous-constitutional-validation";
import { monitorRuntimeConstitutionalCompliance, validateRuntimeConstitutionalMonitoring } from "@/services/runtime-constitutional-monitoring";
import { detectConstitutionalViolations, validateConstitutionalViolationDetection } from "@/services/constitutional-violation-detection";
import type { ConstitutionalViolationScenario } from "@/types/constitutional-violation-detection";
import type {
  ConstitutionalAssessmentLedgerRecord,
  ConstitutionalAssessmentRecord,
  ConstitutionalHealthState,
  ConstitutionalResilienceAssessmentBundle,
  ConstitutionalResilienceAssessmentInput,
  ConstitutionalResilienceAssessmentObservabilitySurface,
  ConstitutionalResilienceAssessmentRepository,
  ConstitutionalResilienceAssessmentValidationResult,
  ConstitutionalResilienceDomain,
  ConstitutionalResilienceFailure,
  ConstitutionalResilienceScenario,
  ConstitutionalResilienceTrend,
  ConstitutionalRiskLevel,
  ConstitutionalScoreComponent,
  ConstitutionalScoreExplanation,
  ConstitutionalTrendDirection,
} from "@/types/constitutional-resilience-assessment";

const VERSION = "constitutional-resilience-assessment/v8ALT.10.5" as const;
const domains = Object.freeze(["AUTHORITY", "GOVERNANCE", "REPLAY", "INTEGRITY", "OPERATOR_CONTROL", "POLICY", "ISOLATION", "LEARNING_SAFETY", "OPTIMIZATION_SAFETY"] as const);
const weights = Object.freeze({ AUTHORITY: 0.15, GOVERNANCE: 0.15, REPLAY: 0.1, INTEGRITY: 0.15, OPERATOR_CONTROL: 0.15, POLICY: 0.1, ISOLATION: 0.1, LEARNING_SAFETY: 0.05, OPTIMIZATION_SAFETY: 0.05 } as const);

function hashValue(domain: string, value: unknown): string { return hashConfidenceValue(domain, canonicalizeConfidenceToString(value)); }
function id(prefix: string, domain: string, value: unknown): string { return `${prefix}-${hashValue(domain, value).slice(0, 12).toUpperCase()}`; }
function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function unique<T extends string>(values: readonly T[]): readonly T[] { return freezeArray([...new Set(values)].sort()); }
function round(value: number): number { return Math.round(value * 10000) / 10000; }

function scenarioFailure(scenario: ConstitutionalResilienceScenario): ConstitutionalResilienceFailure | null {
  const map: Partial<Record<ConstitutionalResilienceScenario, ConstitutionalResilienceFailure>> = {
    NONDETERMINISTIC_SCORING: "NONDETERMINISTIC_SCORING_DETECTED",
    REPLAY_MISMATCH: "REPLAY_ASSESSMENT_MISMATCH_DETECTED",
    REPLAY_NONDETERMINISM: "REPLAY_ASSESSMENT_MISMATCH_DETECTED",
    WEIGHT_MUTATION: "ASSESSMENT_WEIGHT_MUTATION_DETECTED",
    INTEGRITY_DEGRADATION: "ASSESSMENT_EVIDENCE_INTEGRITY_FAILURE",
    EVIDENCE_TAMPERING: "ASSESSMENT_EVIDENCE_INTEGRITY_FAILURE",
    MISSING_CONSTITUTIONAL_EVIDENCE: "ASSESSMENT_EVIDENCE_INTEGRITY_FAILURE",
    MISSING_CONSTITUTIONAL_REFERENCE: "CONSTITUTIONAL_REFERENCE_MISSING",
    INCOMPLETE_GOVERNANCE_EVIDENCE: "GOVERNANCE_EVIDENCE_INCOMPLETE",
    GOVERNANCE_BYPASS: "GOVERNANCE_EVIDENCE_INCOMPLETE",
    AUTHORITY_VALIDATION_UNAVAILABLE: "AUTHORITY_VALIDATION_UNAVAILABLE",
    AUTHORITY_ESCALATION: "AUTHORITY_VALIDATION_UNAVAILABLE",
    OPERATOR_CONTROL_UNCONFIRMED: "OPERATOR_CONTROL_UNCONFIRMED",
    OPERATOR_AUTHORITY_OVERRIDE: "OPERATOR_CONTROL_UNCONFIRMED",
    TENANT_ISOLATION_EVIDENCE_UNAVAILABLE: "TENANT_ISOLATION_EVIDENCE_UNAVAILABLE",
    TENANT_LEAKAGE: "TENANT_ISOLATION_EVIDENCE_UNAVAILABLE",
    ASSESSMENT_LINEAGE_BROKEN: "ASSESSMENT_LINEAGE_BROKEN",
    MONITORING_FAILURE: "ASSESSMENT_LINEAGE_BROKEN",
    HEALTH_CALCULATION_UNAVAILABLE: "CONSTITUTIONAL_HEALTH_CALCULATION_UNAVAILABLE",
  };
  return map[scenario] ?? null;
}

function violationScenarioFor(scenario: ConstitutionalResilienceScenario): ConstitutionalViolationScenario {
  const assessmentOnly = new Set<ConstitutionalResilienceScenario>(["NONDETERMINISTIC_SCORING", "WEIGHT_MUTATION", "MISSING_CONSTITUTIONAL_REFERENCE", "INCOMPLETE_GOVERNANCE_EVIDENCE", "AUTHORITY_VALIDATION_UNAVAILABLE", "OPERATOR_CONTROL_UNCONFIRMED", "TENANT_ISOLATION_EVIDENCE_UNAVAILABLE", "ASSESSMENT_LINEAGE_BROKEN", "HEALTH_CALCULATION_UNAVAILABLE"]);
  return assessmentOnly.has(scenario) ? "BASELINE" : scenario as ConstitutionalViolationScenario;
}

function domainForFailure(failure: ConstitutionalResilienceFailure | null): ConstitutionalResilienceDomain | "OVERALL" | null {
  const map: Record<ConstitutionalResilienceFailure, ConstitutionalResilienceDomain | "OVERALL"> = {
    NONDETERMINISTIC_SCORING_DETECTED: "OVERALL",
    REPLAY_ASSESSMENT_MISMATCH_DETECTED: "REPLAY",
    ASSESSMENT_WEIGHT_MUTATION_DETECTED: "OVERALL",
    ASSESSMENT_EVIDENCE_INTEGRITY_FAILURE: "INTEGRITY",
    CONSTITUTIONAL_REFERENCE_MISSING: "POLICY",
    GOVERNANCE_EVIDENCE_INCOMPLETE: "GOVERNANCE",
    AUTHORITY_VALIDATION_UNAVAILABLE: "AUTHORITY",
    OPERATOR_CONTROL_UNCONFIRMED: "OPERATOR_CONTROL",
    TENANT_ISOLATION_EVIDENCE_UNAVAILABLE: "ISOLATION",
    ASSESSMENT_LINEAGE_BROKEN: "REPLAY",
    CONSTITUTIONAL_HEALTH_CALCULATION_UNAVAILABLE: "OVERALL",
  };
  return failure ? map[failure] : null;
}

function riskFromScore(score: number, failure: ConstitutionalResilienceFailure | null): ConstitutionalRiskLevel {
  if (failure === "ASSESSMENT_WEIGHT_MUTATION_DETECTED" || failure === "CONSTITUTIONAL_HEALTH_CALCULATION_UNAVAILABLE") return "BLOCKING";
  if (score < 0.5) return "CRITICAL";
  if (score < 0.7) return "HIGH";
  if (score < 0.85) return "MODERATE";
  return "LOW";
}

function healthFromScore(score: number, failures: readonly ConstitutionalResilienceFailure[]): ConstitutionalHealthState {
  if (failures.includes("ASSESSMENT_WEIGHT_MUTATION_DETECTED") || failures.includes("CONSTITUTIONAL_HEALTH_CALCULATION_UNAVAILABLE")) return "NON_COMPLIANT";
  if (score < 0.5) return "NON_COMPLIANT";
  if (score < 0.7) return "CRITICAL";
  if (score < 0.82) return "DEGRADED";
  if (score < 0.92) return "WATCH";
  if (score < 0.99) return "RESILIENT";
  return "FULLY_RESILIENT";
}

function trendFromScore(score: number): ConstitutionalTrendDirection {
  if (score < 0.82) return "DEGRADING";
  if (score > 0.98) return "IMPROVING";
  return "STABLE";
}

function basePenalty(domain: ConstitutionalResilienceDomain, failure: ConstitutionalResilienceFailure | null): number {
  const affected = domainForFailure(failure);
  if (!failure) return 0;
  if (affected === "OVERALL") return 0.35;
  if (affected === domain) return failure.includes("UNAVAILABLE") || failure.includes("INCOMPLETE") ? 0.42 : 0.5;
  return 0.06;
}

function component(domain: ConstitutionalResilienceDomain, failure: ConstitutionalResilienceFailure | null, index: number): ConstitutionalScoreComponent {
  const penalty = basePenalty(domain, failure);
  const score = round(Math.max(0, 1 - penalty));
  const base = {
    domain,
    score,
    weight: weights[domain],
    weighted_score: round(score * weights[domain]),
    confidence: round(failure ? Math.max(0.5, score - 0.05) : 0.99),
    stability_index: score,
    trend_direction: trendFromScore(score),
    risk_level: riskFromScore(score, domainForFailure(failure) === domain || domainForFailure(failure) === "OVERALL" ? failure : null),
    contributing_evidence: freezeArray([`evidence:resilience:${domain.toLowerCase()}`, `validation:resilience:${index}`, `runtime:resilience:${index}`, `violation:resilience:${index}`]),
  };
  return Object.freeze({ ...base, integrity_hash: hashValue("constitutional-resilience-score", base) });
}

function explanation(assessment_id: string, item: ConstitutionalScoreComponent, failure: ConstitutionalResilienceFailure | null): ConstitutionalScoreExplanation {
  const base = {
    explanation_id: id("CRA-E", "constitutional-resilience-explanation", { assessment_id, domain: item.domain }),
    assessment_id,
    domain: item.domain,
    constitutional_rules_evaluated: freezeArray([`constitutional-rule:${item.domain.toLowerCase()}`, "constitutional-rule:governance-supremacy", "constitutional-rule:operator-supremacy"]),
    governance_references: freezeArray([`governance:resilience:${item.domain.toLowerCase()}`]),
    authority_references: freezeArray([`authority:resilience:${item.domain.toLowerCase()}`]),
    replay_references: freezeArray([`replay:resilience:${item.domain.toLowerCase()}`]),
    integrity_validation: item.integrity_hash && failure !== "ASSESSMENT_EVIDENCE_INTEGRITY_FAILURE" ? "VERIFIED" as const : "FAILED" as const,
    weighting_calculation: `${item.score} * ${item.weight} = ${item.weighted_score}`,
    trend_justification: `${item.domain} trend is ${item.trend_direction} from deterministic score ${item.score}`,
    confidence_rationale: `confidence ${item.confidence} derived from evidence completeness and failure state`,
    historical_comparison: item.trend_direction === "DEGRADING" ? "current cycle is below prior resilient baseline" : "current cycle matches resilient baseline",
    deterministic: true as const,
    replayable: true as const,
  };
  return Object.freeze({ ...base, integrity_hash: hashValue("constitutional-resilience-explanation", base) });
}

function trend(item: ConstitutionalScoreComponent): ConstitutionalResilienceTrend {
  const prior_score = item.trend_direction === "DEGRADING" ? 0.98 : item.score === 1 ? 0.99 : item.score;
  const delta = round(item.score - prior_score);
  const base = {
    trend_id: id("CRA-T", "constitutional-resilience-trend", item.domain),
    domain: item.domain,
    current_score: item.score,
    prior_score,
    delta,
    trend_direction: item.trend_direction,
    certification_readiness: item.risk_level === "LOW" ? "READY" as const : item.risk_level === "MODERATE" ? "WATCH" as const : item.risk_level === "BLOCKING" ? "BLOCKED" as const : "REVIEW_REQUIRED" as const,
    weakening_detected: item.trend_direction === "DEGRADING",
    evidence_reference: `evidence:resilience-trend:${item.domain.toLowerCase()}`,
    replay_reference: `replay:resilience-trend:${item.domain.toLowerCase()}`,
  };
  return Object.freeze({ ...base, integrity_hash: hashValue("constitutional-resilience-trend", base) });
}

function overallTrend(assessment: ConstitutionalAssessmentRecord): ConstitutionalResilienceTrend {
  const prior_score = assessment.trend_direction === "DEGRADING" ? 0.98 : assessment.overall_constitutional_score === 1 ? 0.99 : assessment.overall_constitutional_score;
  const base = { trend_id: id("CRA-T", "constitutional-resilience-trend", "OVERALL"), domain: "OVERALL" as const, current_score: assessment.overall_constitutional_score, prior_score, delta: round(assessment.overall_constitutional_score - prior_score), trend_direction: assessment.trend_direction, certification_readiness: assessment.fail_closed_required ? "BLOCKED" as const : assessment.health_state === "WATCH" ? "WATCH" as const : "READY" as const, weakening_detected: assessment.trend_direction === "DEGRADING", evidence_reference: assessment.evidence_reference, replay_reference: assessment.replay_reference };
  return Object.freeze({ ...base, integrity_hash: hashValue("constitutional-resilience-overall-trend", base) });
}

function assessment(scores: readonly ConstitutionalScoreComponent[], failure: ConstitutionalResilienceFailure | null, scenario: ConstitutionalResilienceScenario): ConstitutionalAssessmentRecord {
  const failures = freezeArray(failure ? [failure] : []);
  const overall = round(scores.reduce((sum, item) => sum + item.weighted_score, 0));
  const health = scenario === "HEALTH_CALCULATION_UNAVAILABLE" ? "NON_COMPLIANT" : healthFromScore(overall, failures);
  const fail_closed_required = health === "NON_COMPLIANT" || health === "CRITICAL" || failures.length > 0;
  const byDomain = (domain: ConstitutionalResilienceDomain) => scores.find((item) => item.domain === domain)?.score ?? 0;
  const base = {
    assessment_id: id("CRA", "constitutional-resilience-assessment", { scenario, scores: scores.map((item) => item.integrity_hash) }),
    mission_id: "mission:constitutional-resilience-assessment",
    execution_id: "execution:constitutional-resilience:0",
    tenant_id: scenario === "TENANT_LEAKAGE" || scenario === "TENANT_ISOLATION_EVIDENCE_UNAVAILABLE" ? "tenant:foreign" : "tenant:alpha",
    constitution_version: "constitutional-baseline-contract/v8ALT.10.1" as const,
    assessment_timestamp: "1970-01-01T00:00:00.000Z" as const,
    authority_score: byDomain("AUTHORITY"),
    governance_score: byDomain("GOVERNANCE"),
    replay_score: byDomain("REPLAY"),
    integrity_score: byDomain("INTEGRITY"),
    operator_control_score: byDomain("OPERATOR_CONTROL"),
    policy_score: byDomain("POLICY"),
    isolation_score: byDomain("ISOLATION"),
    learning_safety_score: byDomain("LEARNING_SAFETY"),
    optimization_safety_score: byDomain("OPTIMIZATION_SAFETY"),
    overall_constitutional_score: overall,
    health_state: health,
    confidence_level: round(scores.reduce((sum, item) => sum + item.confidence, 0) / scores.length),
    trend_direction: trendFromScore(overall),
    risk_level: riskFromScore(overall, failure),
    recommendations: fail_closed_required ? freezeArray(["require governance review", "preserve assessment evidence", "maintain operator visibility"]) : freezeArray(["continue constitutional resilience assessment"]),
    lineage_reference: scenario === "ASSESSMENT_LINEAGE_BROKEN" || scenario === "MONITORING_FAILURE" ? "" : "lineage:constitutional-resilience-assessment",
    evidence_reference: scenario === "MISSING_CONSTITUTIONAL_EVIDENCE" ? "" : "evidence:constitutional-resilience-assessment",
    replay_reference: scenario === "REPLAY_MISMATCH" || scenario === "REPLAY_NONDETERMINISM" ? "replay:constitutional-resilience:mismatch" : "replay:constitutional-resilience-assessment",
    fail_closed_required,
    observational_only: true as const,
    advisory_only: true as const,
    execution_modification_authorized: false as const,
    policy_modification_authorized: false as const,
    authority_grant_authorized: false as const,
    autonomous_remediation_authorized: false as const,
  };
  return Object.freeze({ ...base, integrity_hash: scenario === "INTEGRITY_DEGRADATION" || scenario === "EVIDENCE_TAMPERING" ? "" : hashValue("constitutional-resilience-assessment-record", base) });
}

function ledger(item: ConstitutionalAssessmentRecord): ConstitutionalAssessmentLedgerRecord {
  const base = { assessment_record_id: id("CRA-L", "constitutional-resilience-ledger", item.assessment_id), assessment_id: item.assessment_id, timestamp: item.assessment_timestamp, mission_id: item.mission_id, execution_id: item.execution_id, tenant_id: item.tenant_id, overall_score: item.overall_constitutional_score, health_state: item.health_state, trend: item.trend_direction, confidence: item.confidence_level, risk: item.risk_level, constitutional_reference: item.constitution_version, evidence_reference: item.evidence_reference, lineage_reference: item.lineage_reference, immutable: true as const, append_only: true as const };
  return Object.freeze({ ...base, integrity_hash: hashValue("constitutional-resilience-ledger", base) });
}

function collectFailures(repository: Omit<ConstitutionalResilienceAssessmentRepository, "integrity_hash"> | ConstitutionalResilienceAssessmentRepository): readonly ConstitutionalResilienceFailure[] {
  const weightTotal = round(Object.values(repository.weights).reduce((sum, value) => sum + value, 0));
  return unique([
    ...repository.failures,
    ...(weightTotal !== 1 ? ["ASSESSMENT_WEIGHT_MUTATION_DETECTED" as const] : []),
    ...(repository.assessment.replay_reference.includes("mismatch") ? ["REPLAY_ASSESSMENT_MISMATCH_DETECTED" as const] : []),
    ...(!repository.assessment.evidence_reference ? ["ASSESSMENT_EVIDENCE_INTEGRITY_FAILURE" as const] : []),
    ...(!repository.assessment.lineage_reference ? ["ASSESSMENT_LINEAGE_BROKEN" as const] : []),
    ...(!repository.assessment.integrity_hash ? ["ASSESSMENT_EVIDENCE_INTEGRITY_FAILURE" as const] : []),
    ...(repository.assessment.tenant_id !== "tenant:alpha" ? ["TENANT_ISOLATION_EVIDENCE_UNAVAILABLE" as const] : []),
    ...(repository.explanations.length !== repository.scores.length || repository.explanations.some((item) => item.integrity_validation === "FAILED") ? ["ASSESSMENT_EVIDENCE_INTEGRITY_FAILURE" as const] : []),
    ...(repository.assessment.health_state === "NON_COMPLIANT" && repository.assessment.overall_constitutional_score === 0 ? ["CONSTITUTIONAL_HEALTH_CALCULATION_UNAVAILABLE" as const] : []),
  ]);
}

export function assessConstitutionalResilience(input: ConstitutionalResilienceAssessmentInput = {}): ConstitutionalResilienceAssessmentRepository {
  if (input.repository) return input.repository;
  const scenario = input.scenario ?? "BASELINE";
  const baseline = input.baseline ?? getConstitutionalBaselineContract();
  const validationRepository = input.validationRepository ?? validateContinuousConstitutionalCompliance({ baseline });
  const runtimeRepository = input.runtimeRepository ?? monitorRuntimeConstitutionalCompliance({ baseline, validationRepository });
  const violationScenario = violationScenarioFor(scenario);
  const violationRepository = input.violationRepository ?? detectConstitutionalViolations({ baseline, validationRepository, runtimeRepository, scenario: violationScenario });
  const failure = scenarioFailure(scenario);
  const scoreComponents = freezeArray(domains.map((domain, index) => component(domain, failure, index)));
  const assessmentRecord = assessment(scoreComponents, failure, scenario);
  const explanations = freezeArray(scoreComponents.map((item) => explanation(assessmentRecord.assessment_id, item, failure)));
  const source = {
    repository_id: id("CRA", "constitutional-resilience-repository", { scenario, baseline: baseline.contract_id, validation: validationRepository.repository_id, runtime: runtimeRepository.repository_id, violation: violationRepository.repository_id }),
    baseline_contract_id: baseline.contract_id,
    validation_repository_id: validationRepository.repository_id,
    runtime_monitoring_repository_id: runtimeRepository.repository_id,
    violation_detection_repository_id: violationRepository.repository_id,
    final_state: "CONSTITUTIONAL_RESILIENCE_ASSESSMENT_COMPLETE" as const,
    weights,
    scores: scoreComponents,
    assessment: assessmentRecord,
    explanations,
    trends: freezeArray([...scoreComponents.map(trend), overallTrend(assessmentRecord)]),
    ledger: freezeArray([ledger(assessmentRecord)]),
    failures: freezeArray(failure ? [failure] : []),
    observational_only: true as const,
    advisory_only: true as const,
    execution_modification_authorized: false as const,
    policy_modification_authorized: false as const,
    authority_grant_authorized: false as const,
    autonomous_remediation_authorized: false as const,
  };
  const failures = unique([...collectFailures(source), ...(!validateConstitutionalBaseline(baseline).valid ? ["CONSTITUTIONAL_REFERENCE_MISSING" as const] : []), ...(!validateContinuousConstitutionalRepository(validationRepository).valid ? ["GOVERNANCE_EVIDENCE_INCOMPLETE" as const] : []), ...(!validateRuntimeConstitutionalMonitoring(runtimeRepository).valid ? ["ASSESSMENT_LINEAGE_BROKEN" as const] : []), ...(!validateConstitutionalViolationDetection(violationRepository).valid && violationRepository.failures.length > 0 ? ["ASSESSMENT_EVIDENCE_INTEGRITY_FAILURE" as const] : [])]);
  const repository = { ...source, failures, final_state: failures.length ? "CONSTITUTIONAL_RESILIENCE_ASSESSMENT_FAIL_CLOSED" as const : source.final_state };
  return Object.freeze({ ...repository, integrity_hash: hashValue("constitutional-resilience-repository", repository) });
}

export function listConstitutionalResilienceScores(input: ConstitutionalResilienceAssessmentInput = {}) { return assessConstitutionalResilience(input).scores; }
export function listConstitutionalResilienceTrends(input: ConstitutionalResilienceAssessmentInput = {}) { return assessConstitutionalResilience(input).trends; }
export function listConstitutionalResilienceExplanations(input: ConstitutionalResilienceAssessmentInput = {}) { return assessConstitutionalResilience(input).explanations; }
export function listConstitutionalAssessmentLedger(input: ConstitutionalResilienceAssessmentInput = {}) { return assessConstitutionalResilience(input).ledger; }

export function validateConstitutionalResilienceAssessment(repository = assessConstitutionalResilience()): ConstitutionalResilienceAssessmentValidationResult {
  const failures = unique([...collectFailures(repository), ...(!repository.integrity_hash ? ["ASSESSMENT_EVIDENCE_INTEGRITY_FAILURE" as const] : [])]);
  const has = (failure: ConstitutionalResilienceFailure) => failures.includes(failure);
  const valid = failures.length === 0 && repository.final_state === "CONSTITUTIONAL_RESILIENCE_ASSESSMENT_COMPLETE" && repository.observational_only && repository.advisory_only && !repository.execution_modification_authorized && !repository.autonomous_remediation_authorized;
  const result = { repository_id: repository.repository_id, valid, deterministic_scoring: !has("NONDETERMINISTIC_SCORING_DETECTED"), replay_identical: !has("REPLAY_ASSESSMENT_MISMATCH_DETECTED"), immutable_weights: !has("ASSESSMENT_WEIGHT_MUTATION_DETECTED"), evidence_complete: !has("ASSESSMENT_EVIDENCE_INTEGRITY_FAILURE"), explanations_complete: repository.explanations.length === repository.scores.length, lineage_complete: !has("ASSESSMENT_LINEAGE_BROKEN"), integrity_verified: !has("ASSESSMENT_EVIDENCE_INTEGRITY_FAILURE"), tenant_isolated: !has("TENANT_ISOLATION_EVIDENCE_UNAVAILABLE"), health_calculated: !has("CONSTITUTIONAL_HEALTH_CALCULATION_UNAVAILABLE"), observational_only: true as const, advisory_only: true as const, fail_closed_ready: valid || failures.length > 0 || repository.final_state !== "CONSTITUTIONAL_RESILIENCE_ASSESSMENT_COMPLETE", no_execution_influence: !repository.execution_modification_authorized && !repository.policy_modification_authorized && !repository.authority_grant_authorized, failures };
  return Object.freeze({ ...result, validation_hash: hashValue("constitutional-resilience-validation", result) });
}

export function buildConstitutionalResilienceAssessmentObservabilitySurface(repository = assessConstitutionalResilience()): ConstitutionalResilienceAssessmentObservabilitySurface {
  return Object.freeze({ repository_id: repository.repository_id, final_state: repository.final_state, overall_score: repository.assessment.overall_constitutional_score, health_state: repository.assessment.health_state, score_count: repository.scores.length, explanation_count: repository.explanations.length, trend_count: repository.trends.length, ledger_count: repository.ledger.length, failure_count: repository.failures.length, observational_only: true, advisory_only: true, execution_modification_authorized: false, autonomous_remediation_authorized: false, integrity_hash: repository.integrity_hash });
}

export function getConstitutionalResilienceAssessmentEngine(): ConstitutionalResilienceAssessmentBundle {
  const repository = assessConstitutionalResilience();
  return Object.freeze({ doctrine: Object.freeze({ engine_version: VERSION, final_state: "CONSTITUTIONAL_RESILIENCE_ASSESSMENT_READY", score_domains: domains, principles: freezeArray(["deterministic-scoring", "immutable-weights", "fully-explainable", "replay-identical", "assessment-ledger", "trend-analysis", "observational-only", "no-execution-influence", "no-authority-grants"]) }), repository, validation: validateConstitutionalResilienceAssessment(repository), observability: buildConstitutionalResilienceAssessmentObservabilitySurface(repository) });
}
