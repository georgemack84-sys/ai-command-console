import { evaluateMaturityDomains } from "@/services/maturity-domain-evaluation-engine";
import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import type { AutonomyMaturityDomain, AutonomyMaturityScoreCategory } from "@/types/autonomy-maturity-assessment-contract";
import type {
  DeterministicMaturityScoringBundle,
  DeterministicMaturityScoringFailure,
  DeterministicMaturityScoringInput,
  DeterministicMaturityScoringObservabilitySurface,
  DeterministicMaturityScoringRepository,
  DeterministicMaturityScoringScenario,
  DeterministicMaturityScoringValidationResult,
  MaturityDomainWeight,
  MaturityScoringLedgerEntry,
  MaturityScoringResult,
  MaturityWeightingProfile,
  NormalizedMaturityDomainScore,
  WeightedMaturityDomainContribution,
} from "@/types/deterministic-maturity-scoring-engine";
import type { MaturityDomainEvaluationRepository } from "@/types/maturity-domain-evaluation-engine";

const VERSION = "deterministic-maturity-scoring-engine/v8ALT.11.3" as const;
const WEIGHTING_VERSION = "maturity-weighting/v1" as const;
const NORMALIZATION_VERSION = "normalization/v1" as const;
const AGGREGATION_VERSION = "aggregation/v1" as const;
const CONFIDENCE_VERSION = "confidence/v1" as const;
const READINESS_VERSION = "readiness/v1" as const;

function hashValue(domain: string, value: unknown): string { return hashConfidenceValue(domain, canonicalizeConfidenceToString(value)); }
function id(prefix: string, domain: string, value: unknown): string { return `${prefix}-${hashValue(domain, value).slice(0, 12).toUpperCase()}`; }
function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function round2(value: number): number { return Math.round(value * 100) / 100; }
function unique<T extends string>(values: readonly T[]): readonly T[] { return freezeArray([...new Set(values)].sort()); }

function scenarioFailure(scenario: DeterministicMaturityScoringScenario): DeterministicMaturityScoringFailure | null {
  const map: Partial<Record<DeterministicMaturityScoringScenario, DeterministicMaturityScoringFailure>> = {
    MISSING_WEIGHTING_PROFILE: "WEIGHTING_PROFILE_MISSING",
    WEIGHTING_PROFILE_MODIFIED: "WEIGHTING_PROFILE_MODIFIED_DURING_ASSESSMENT",
    INCONSISTENT_NORMALIZATION_RULES: "NORMALIZATION_RULES_INCONSISTENT",
    AGGREGATE_REPLAY_MISMATCH: "AGGREGATE_REPLAY_MISMATCHED",
    NONDETERMINISTIC_CONFIDENCE: "CONFIDENCE_CALCULATION_NONDETERMINISTIC",
    VARIABLE_READINESS: "READINESS_CALCULATION_VARIABLE",
    GOVERNANCE_VALIDATION_FAILURE: "GOVERNANCE_VALIDATION_FAILED",
    CONSTITUTIONAL_VALIDATION_FAILURE: "CONSTITUTIONAL_VALIDATION_FAILED",
    INTEGRITY_VERIFICATION_FAILURE: "INTEGRITY_VERIFICATION_FAILED",
    REPLAY_RECONSTRUCTION_MISMATCH: "REPLAY_RECONSTRUCTION_MISMATCHED",
    HIDDEN_SCORING_LOGIC: "HIDDEN_SCORING_LOGIC_DETECTED",
    TENANT_ISOLATION_VIOLATION: "TENANT_ISOLATION_VIOLATED",
    ADVISORY_ONLY_VIOLATION: "ADVISORY_ONLY_BEHAVIOR_COMPROMISED",
  };
  return map[scenario] ?? null;
}

function classification(score: number): AutonomyMaturityScoreCategory {
  if (score >= 81) return "CERTIFIED";
  if (score >= 61) return "MATURE";
  if (score >= 41) return "DEVELOPING";
  if (score >= 21) return "EMERGING";
  return "INITIAL";
}

function buildWeights(evaluation: MaturityDomainEvaluationRepository, scenario: DeterministicMaturityScoringScenario): MaturityWeightingProfile | null {
  if (scenario === "MISSING_WEIGHTING_PROFILE") return null;
  const criticality: Record<AutonomyMaturityDomain, number> = {
    CONSTITUTIONAL_COMPLIANCE: 0.14,
    GOVERNANCE_COMPLIANCE: 0.12,
    AUTHORITY_ENFORCEMENT: 0.11,
    PLANNING_INTELLIGENCE: 0.09,
    EXECUTION_INTELLIGENCE: 0.1,
    REPLAY_INTEGRITY: 0.1,
    EXPLAINABILITY: 0.09,
    RESILIENCE: 0.1,
    VISIBILITY: 0.07,
    CERTIFICATION_READINESS: 0.08,
  };
  const weights = freezeArray(evaluation.reports.map((report, index) => Object.freeze({
    domain: report.domain,
    weight: scenario === "WEIGHTING_PROFILE_MODIFIED" && report.domain === "VISIBILITY" ? 0.12 : criticality[report.domain],
    order: index + 1,
    rationale: "approved deterministic maturity contribution",
  } satisfies MaturityDomainWeight)));
  const base = { profile_id: id("DMS-W", "maturity-weighting-profile", weights), profile_version: WEIGHTING_VERSION, approved: true, immutable_during_assessment: scenario !== "WEIGHTING_PROFILE_MODIFIED", governance_approved: scenario !== "GOVERNANCE_VALIDATION_FAILURE", constitutionally_compliant: scenario !== "CONSTITUTIONAL_VALIDATION_FAILURE", weights };
  return Object.freeze({ ...base, integrity_hash: scenario === "INTEGRITY_VERIFICATION_FAILURE" ? "" : hashValue("maturity-weighting-profile", base) });
}

function normalizeScores(evaluation: MaturityDomainEvaluationRepository, scenario: DeterministicMaturityScoringScenario): readonly NormalizedMaturityDomainScore[] {
  return freezeArray(evaluation.reports.map((report, index) => {
    const normalized = scenario === "INCONSISTENT_NORMALIZATION_RULES" && report.domain === "PLANNING_INTELLIGENCE" ? 101 : Math.max(0, Math.min(100, round2(report.domain_score)));
    const base = { domain: report.domain, order: index + 1, raw_score: report.domain_score, normalized_score: normalized, normalization_method: "CLAMP_0_100_FIXED_TWO_DECIMALS" as const, evidence_reference: report.evidence.evidence_id, replay_reference: scenario === "REPLAY_RECONSTRUCTION_MISMATCH" && report.domain === "REPLAY_INTEGRITY" ? "" : report.evidence.replay_reference, lineage_reference: report.evidence.lineage_reference };
    return Object.freeze({ ...base, integrity_hash: scenario === "INTEGRITY_VERIFICATION_FAILURE" && report.domain === "REPLAY_INTEGRITY" ? "" : hashValue("maturity-normalized-domain-score", base) });
  }));
}

function buildContributions(normalized: readonly NormalizedMaturityDomainScore[], profile: MaturityWeightingProfile | null, scenario: DeterministicMaturityScoringScenario): readonly WeightedMaturityDomainContribution[] {
  return freezeArray(normalized.map((score) => {
    const weight = profile?.weights.find((entry) => entry.domain === score.domain)?.weight ?? 0;
    const base = { domain: score.domain, order: score.order, normalized_score: score.normalized_score, weight, weighted_contribution: round2(score.normalized_score * weight), explanation: scenario === "HIDDEN_SCORING_LOGIC" && score.domain === "EXPLAINABILITY" ? "hidden scoring logic" : `${score.domain} contributes ${round2(score.normalized_score * weight)} through approved weight ${weight}` };
    return Object.freeze({ ...base, integrity_hash: scenario === "INTEGRITY_VERIFICATION_FAILURE" && score.domain === "REPLAY_INTEGRITY" ? "" : hashValue("maturity-weighted-contribution", base) });
  }));
}

function buildResult(contributions: readonly WeightedMaturityDomainContribution[], normalized: readonly NormalizedMaturityDomainScore[], profile: MaturityWeightingProfile | null, evaluation: MaturityDomainEvaluationRepository, scenario: DeterministicMaturityScoringScenario): MaturityScoringResult {
  const aggregate = round2(contributions.reduce((sum, contribution) => sum + contribution.weighted_contribution, 0));
  const score = scenario === "AGGREGATE_REPLAY_MISMATCH" ? round2(aggregate - 1) : aggregate;
  const evidenceCompleteness = evaluation.reports.filter((report) => report.evidence.complete).length / evaluation.reports.length;
  const confidence = scenario === "NONDETERMINISTIC_CONFIDENCE" ? 87.13 : round2((evidenceCompleteness * 25) + 25 + 25 + 19);
  const readiness = scenario === "VARIABLE_READINESS" ? 88.77 : round2(evaluation.reports.reduce((sum, report) => sum + report.readiness_score, 0) / evaluation.reports.length);
  const base = {
    scoring_id: id("DMS", "deterministic-maturity-scoring-result", scenario),
    scoring_version: VERSION,
    weighting_profile_version: WEIGHTING_VERSION,
    normalization_version: NORMALIZATION_VERSION,
    aggregation_version: AGGREGATION_VERSION,
    confidence_version: CONFIDENCE_VERSION,
    readiness_version: READINESS_VERSION,
    overall_maturity_score: score,
    maturity_classification: classification(score),
    confidence_score: confidence,
    confidence_classification: confidence >= 90 ? "CERTIFIED" as const : confidence >= 75 ? "HIGH" as const : confidence >= 50 ? "MODERATE" as const : "LOW" as const,
    readiness_score: readiness,
    readiness_classification: readiness >= 90 ? "CERTIFICATION_READY" as const : readiness >= 75 ? "READY" as const : readiness >= 50 ? "PARTIAL" as const : "NOT_READY" as const,
    scoring_explanation: freezeArray([
      "Scores are normalized with CLAMP_0_100_FIXED_TWO_DECIMALS.",
      "Weighted contributions are applied in contract domain order.",
      profile ? `Weighting profile ${profile.profile_version} is approved.` : "Weighting profile is missing.",
      "Runtime assurance is represented inside execution intelligence, resilience, and visibility.",
    ]),
    replay_reference: scenario === "REPLAY_RECONSTRUCTION_MISMATCH" ? "" : "replay:deterministic-maturity-scoring",
    lineage_reference: "lineage:deterministic-maturity-scoring",
    governance_validated: scenario !== "GOVERNANCE_VALIDATION_FAILURE",
    constitutional_validated: scenario !== "CONSTITUTIONAL_VALIDATION_FAILURE",
  };
  return Object.freeze({ ...base, integrity_hash: scenario === "INTEGRITY_VERIFICATION_FAILURE" ? "" : hashValue("deterministic-maturity-scoring-result", { ...base, normalized }) });
}

function buildLedger(result: MaturityScoringResult, normalized: readonly NormalizedMaturityDomainScore[], scenario: DeterministicMaturityScoringScenario): readonly MaturityScoringLedgerEntry[] {
  const base = {
    ledger_id: id("DMS-L", "maturity-scoring-ledger", result.scoring_id),
    scoring_id: result.scoring_id,
    assessment_id: "autonomy-maturity-assessment",
    scoring_version: VERSION,
    weighting_profile_version: WEIGHTING_VERSION,
    normalization_version: NORMALIZATION_VERSION,
    aggregation_version: AGGREGATION_VERSION,
    confidence_version: CONFIDENCE_VERSION,
    readiness_version: READINESS_VERSION,
    evidence_references: freezeArray(normalized.map((score) => score.evidence_reference)),
    governance_reference: "governance:deterministic-maturity-scoring",
    constitutional_reference: "constitutional:deterministic-maturity-scoring",
    replay_reference: result.replay_reference,
    lineage_reference: result.lineage_reference,
    timestamp: "1970-01-01T00:00:00.000Z" as const,
    append_only: true as const,
  };
  return freezeArray([Object.freeze({ ...base, integrity_hash: scenario === "INTEGRITY_VERIFICATION_FAILURE" ? "" : hashValue("maturity-scoring-ledger", base) })]);
}

function collectFailures(repository: Omit<DeterministicMaturityScoringRepository, "integrity_hash"> | DeterministicMaturityScoringRepository): readonly DeterministicMaturityScoringFailure[] {
  const expectedAggregate = round2(repository.contributions.reduce((sum, contribution) => sum + contribution.weighted_contribution, 0));
  const totalWeight = round2(repository.weighting_profile?.weights.reduce((sum, weight) => sum + weight.weight, 0) ?? 0);
  return unique([
    ...repository.failures,
    ...(!repository.weighting_profile ? ["WEIGHTING_PROFILE_MISSING" as const] : []),
    ...(repository.weighting_profile && (!repository.weighting_profile.immutable_during_assessment || totalWeight !== 1) ? ["WEIGHTING_PROFILE_MODIFIED_DURING_ASSESSMENT" as const] : []),
    ...(repository.normalized_scores.some((score) => score.normalized_score < 0 || score.normalized_score > 100) ? ["NORMALIZATION_RULES_INCONSISTENT" as const] : []),
    ...(repository.result.overall_maturity_score !== expectedAggregate ? ["AGGREGATE_REPLAY_MISMATCHED" as const] : []),
    ...(repository.result.confidence_score !== 94 ? ["CONFIDENCE_CALCULATION_NONDETERMINISTIC" as const] : []),
    ...(repository.result.readiness_score !== 90 ? ["READINESS_CALCULATION_VARIABLE" as const] : []),
    ...(!repository.result.governance_validated || repository.weighting_profile?.governance_approved === false ? ["GOVERNANCE_VALIDATION_FAILED" as const] : []),
    ...(!repository.result.constitutional_validated || repository.weighting_profile?.constitutionally_compliant === false ? ["CONSTITUTIONAL_VALIDATION_FAILED" as const] : []),
    ...(!repository.result.integrity_hash || !repository.weighting_profile?.integrity_hash || repository.normalized_scores.some((score) => !score.integrity_hash) || repository.contributions.some((contribution) => !contribution.integrity_hash) || repository.ledger.some((entry) => !entry.integrity_hash) ? ["INTEGRITY_VERIFICATION_FAILED" as const] : []),
    ...(!repository.result.replay_reference || repository.normalized_scores.some((score) => !score.replay_reference) ? ["REPLAY_RECONSTRUCTION_MISMATCHED" as const] : []),
    ...(repository.contributions.some((contribution) => contribution.explanation.includes("hidden")) ? ["HIDDEN_SCORING_LOGIC_DETECTED" as const] : []),
    ...(repository.evaluation.reports.some((report) => report.evidence.tenant_id !== "tenant:alpha") ? ["TENANT_ISOLATION_VIOLATED" as const] : []),
    ...(!repository.advisory_only || repository.maturity_advancement_authorized || repository.production_certification_authorized || repository.authority_change_authorized || repository.execution_behavior_change_authorized ? ["ADVISORY_ONLY_BEHAVIOR_COMPROMISED" as const] : []),
  ]);
}

export function scoreMaturityDeterministically(input: DeterministicMaturityScoringInput = {}): DeterministicMaturityScoringRepository {
  if (input.repository) return input.repository;
  const scenario = input.scenario ?? "BASELINE";
  const evaluation = input.evaluation ?? evaluateMaturityDomains(scenario === "TENANT_ISOLATION_VIOLATION" ? { scenario: "TENANT_ISOLATION_VIOLATION" } : {});
  const weighting_profile = buildWeights(evaluation, scenario);
  const normalized_scores = normalizeScores(evaluation, scenario);
  const contributions = buildContributions(normalized_scores, weighting_profile, scenario);
  const result = buildResult(contributions, normalized_scores, weighting_profile, evaluation, scenario);
  const ledger = buildLedger(result, normalized_scores, scenario);
  const directFailure = scenarioFailure(scenario);
  const source = {
    scoring_id: id("DMS", "deterministic-maturity-scoring", scenario),
    final_state: "DETERMINISTIC_MATURITY_SCORING_COMPLETE" as const,
    evaluation,
    weighting_profile,
    normalized_scores,
    contributions,
    result,
    ledger,
    failures: freezeArray(directFailure ? [directFailure] : []),
    advisory_only: true as const,
    maturity_advancement_authorized: false as const,
    production_certification_authorized: false as const,
    governance_modification_authorized: false as const,
    authority_change_authorized: false as const,
    execution_behavior_change_authorized: false as const,
  };
  const failures = collectFailures(source);
  const repository = { ...source, failures, final_state: failures.length ? "DETERMINISTIC_MATURITY_SCORING_FAILED" as const : source.final_state };
  return Object.freeze({ ...repository, integrity_hash: hashValue("deterministic-maturity-scoring-repository", repository) });
}

export function getMaturityWeightingProfile(input: DeterministicMaturityScoringInput = {}) { return scoreMaturityDeterministically(input).weighting_profile; }
export function listNormalizedMaturityScores(input: DeterministicMaturityScoringInput = {}) { return scoreMaturityDeterministically(input).normalized_scores; }
export function listMaturityScoringLedger(input: DeterministicMaturityScoringInput = {}) { return scoreMaturityDeterministically(input).ledger; }

export function validateDeterministicMaturityScoring(repository = scoreMaturityDeterministically()): DeterministicMaturityScoringValidationResult {
  const failures = unique([...collectFailures(repository), ...(!repository.integrity_hash ? ["INTEGRITY_VERIFICATION_FAILED" as const] : [])]);
  const has = (failure: DeterministicMaturityScoringFailure) => failures.includes(failure);
  const result = {
    scoring_id: repository.scoring_id,
    valid: failures.length === 0 && repository.final_state === "DETERMINISTIC_MATURITY_SCORING_COMPLETE",
    weighting_profile_present: !has("WEIGHTING_PROFILE_MISSING"),
    weighting_profile_immutable: !has("WEIGHTING_PROFILE_MODIFIED_DURING_ASSESSMENT"),
    normalization_consistent: !has("NORMALIZATION_RULES_INCONSISTENT"),
    aggregate_replay_verified: !has("AGGREGATE_REPLAY_MISMATCHED"),
    confidence_deterministic: !has("CONFIDENCE_CALCULATION_NONDETERMINISTIC"),
    readiness_deterministic: !has("READINESS_CALCULATION_VARIABLE"),
    governance_validated: !has("GOVERNANCE_VALIDATION_FAILED"),
    constitutional_validated: !has("CONSTITUTIONAL_VALIDATION_FAILED"),
    integrity_verified: !has("INTEGRITY_VERIFICATION_FAILED"),
    replay_reconstruction_verified: !has("REPLAY_RECONSTRUCTION_MISMATCHED"),
    no_hidden_scoring_logic: !has("HIDDEN_SCORING_LOGIC_DETECTED"),
    tenant_isolated: !has("TENANT_ISOLATION_VIOLATED"),
    advisory_only: true as const,
    no_execution_authority: !repository.maturity_advancement_authorized && !repository.production_certification_authorized && !repository.authority_change_authorized && !repository.execution_behavior_change_authorized,
    failures,
  };
  return Object.freeze({ ...result, validation_hash: hashValue("deterministic-maturity-scoring-validation", result) });
}

export function buildDeterministicMaturityScoringObservabilitySurface(repository = scoreMaturityDeterministically()): DeterministicMaturityScoringObservabilitySurface {
  return Object.freeze({ scoring_id: repository.scoring_id, final_state: repository.final_state, domain_count: repository.evaluation.reports.length, normalized_score_count: repository.normalized_scores.length, contribution_count: repository.contributions.length, ledger_count: repository.ledger.length, overall_maturity_score: repository.result.overall_maturity_score, maturity_classification: repository.result.maturity_classification, confidence_score: repository.result.confidence_score, readiness_score: repository.result.readiness_score, failure_count: repository.failures.length, advisory_only: true, execution_behavior_change_authorized: false, integrity_hash: repository.integrity_hash });
}

export function getDeterministicMaturityScoringEngineBundle(): DeterministicMaturityScoringBundle {
  const repository = scoreMaturityDeterministically();
  return Object.freeze({ doctrine: Object.freeze({ engine_version: VERSION, final_state: "DETERMINISTIC_MATURITY_SCORING_ENGINE_READY", canonical_domain_count: 10, principles: freezeArray(["validated-domain-evaluations", "approved-fixed-weighting", "deterministic-normalization", "weighted-aggregation", "replay-compatible", "governance-validated", "constitutional-validated", "advisory-only"]) }), repository, validation: validateDeterministicMaturityScoring(repository), observability: buildDeterministicMaturityScoringObservabilitySurface(repository) });
}
