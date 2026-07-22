import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { replayRecommendationQuality, scoreRecommendationQuality } from "@/services/recommendation-quality-scoring";
import type { RecommendationQualityInput, RecommendationQualityResult } from "@/types/recommendation-quality-scoring";
import type {
  RejectionAnalysisApiSurface,
  RejectionAnalysisFailure,
  RejectionAnalysisFoundation,
  RejectionAnalysisInput,
  RejectionAnalysisLedgerRecord,
  RejectionAnalysisResult,
  RejectionAnalysisValidation,
  RejectionCategory,
  RejectionOutcomeImpact,
  RejectionPattern,
  RejectionPatternRecord,
  RecommendationRejectionRecord,
} from "@/types/recommendation-rejection-analysis";

const REJECTION_ANALYSIS_VERSION = "recommendation-rejection-analysis/v1" as const;

export const REJECTION_CATEGORIES: readonly RejectionCategory[] = Object.freeze([
  "INSUFFICIENT_EVIDENCE",
  "POOR_EXPLANATION",
  "EXCESSIVE_RISK",
  "LOW_CONFIDENCE",
  "GOVERNANCE_CONCERN",
  "AUTHORITY_CONFLICT",
  "TIMING_ISSUE",
  "INCOMPLETE_CONTEXT",
  "OPERATOR_PREFERENCE",
  "INCORRECT_RECOMMENDATION",
  "MULTIPLE_FACTORS",
  "INSUFFICIENT_INFORMATION",
]);

type Scenario = NonNullable<RejectionAnalysisInput["scenario"]>;

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

function sourceForScenario(input: RejectionAnalysisInput, scenario: Scenario): RecommendationQualityResult {
  if (input.quality) return input.quality;
  const qualityScenario: RecommendationQualityInput["scenario"] =
    scenario === "INSUFFICIENT_EVIDENCE" || scenario === "INCOMPLETE_EVIDENCE" || scenario === "INSUFFICIENT_INFORMATION" ? "INCOMPLETE_EVIDENCE" :
    scenario === "POOR_EXPLANATION" ? "MISSING_EXPLANATION" :
    scenario === "LOW_CONFIDENCE" ? "POOR" :
    scenario === "INCORRECT_RECOMMENDATION" || scenario === "DEGRADED_OUTCOME" ? "UNACCEPTABLE" :
    scenario === "MISSING_GOVERNANCE" ? "MISSING_GOVERNANCE" :
    scenario === "MISSING_REPLAY" ? "MISSING_REPLAY" :
    scenario === "INCOMPLETE_LINEAGE" ? "INCOMPLETE_LINEAGE" :
    scenario === "HASH_MISMATCH" ? "HASH_MISMATCH" :
    scenario === "CROSS_TENANT" ? "CROSS_TENANT" :
    scenario === "RECONSTRUCTION_FAILURE" ? "RECONSTRUCTION_FAILURE" :
    scenario === "GOVERNANCE_FAILURE" || scenario === "GOVERNANCE_CONCERN" ? "GOVERNANCE_FAILURE" :
    scenario === "CONSTITUTIONAL_FAILURE" ? "CONSTITUTIONAL_FAILURE" :
    scenario === "REPLAY_DIVERGENCE" ? "REPLAY_DIVERGENCE" :
    scenario === "LEDGER_MUTATION" ? "LEDGER_MUTATION" :
    scenario === "IMPROVED_OUTCOME" ? "HIGH" :
    "BASELINE";
  return scoreRecommendationQuality({ scenario: qualityScenario });
}

function buildApiSurface(): RejectionAnalysisApiSurface {
  const base: Omit<RejectionAnalysisApiSurface, "integrity_hash"> = {
    api_id: "recommendation_rejection_analysis_api",
    analyze_rejection: "POST /recommendation-rejection-analysis/analyze",
    classify_failure: "POST /recommendation-rejection-analysis/classify",
    assess_context: "POST /recommendation-rejection-analysis/context",
    evaluate_outcome_impact: "POST /recommendation-rejection-analysis/outcome-impact",
    validate_analysis: "POST /recommendation-rejection-analysis/validate",
    replay_analysis: "POST /recommendation-rejection-analysis/replay",
    retrieve_contract: "GET /recommendation-rejection-analysis/contract",
    update_supported: false,
    delete_supported: false,
    adaptive_learning_supported: false,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function categoriesFor(quality: RecommendationQualityResult, scenario: Scenario): readonly RejectionCategory[] {
  const explicit: Partial<Record<Scenario, readonly RejectionCategory[]>> = {
    INSUFFICIENT_EVIDENCE: ["INSUFFICIENT_EVIDENCE"],
    POOR_EXPLANATION: ["POOR_EXPLANATION"],
    EXCESSIVE_RISK: ["EXCESSIVE_RISK"],
    LOW_CONFIDENCE: ["LOW_CONFIDENCE"],
    GOVERNANCE_CONCERN: ["GOVERNANCE_CONCERN"],
    AUTHORITY_CONFLICT: ["AUTHORITY_CONFLICT"],
    TIMING_ISSUE: ["TIMING_ISSUE"],
    INCOMPLETE_CONTEXT: ["INCOMPLETE_CONTEXT"],
    OPERATOR_PREFERENCE: ["OPERATOR_PREFERENCE"],
    INCORRECT_RECOMMENDATION: ["INCORRECT_RECOMMENDATION"],
    MULTIPLE_FACTORS: ["INSUFFICIENT_EVIDENCE", "LOW_CONFIDENCE", "TIMING_ISSUE", "MULTIPLE_FACTORS"],
    INSUFFICIENT_INFORMATION: ["INSUFFICIENT_INFORMATION"],
  };
  if (explicit[scenario]) return freezeArray(explicit[scenario]);
  const score = quality.quality_score;
  const categories: RejectionCategory[] = [];
  if (score.evidence_quality_score < 0.6) categories.push("INSUFFICIENT_EVIDENCE");
  if (score.explainability_score < 0.6) categories.push("POOR_EXPLANATION");
  if (score.confidence_quality_score < 0.6) categories.push("LOW_CONFIDENCE");
  if (score.governance_compliance_score < 0.6) categories.push("GOVERNANCE_CONCERN");
  if (score.correctness_score < 0.6) categories.push("INCORRECT_RECOMMENDATION");
  return freezeArray(categories.length ? categories : ["OPERATOR_PREFERENCE"]);
}

function patternFor(categories: readonly RejectionCategory[]): RejectionPattern {
  if (categories.includes("INSUFFICIENT_INFORMATION")) return "INSUFFICIENT_EVIDENCE_PATTERN";
  if (categories.includes("INSUFFICIENT_EVIDENCE")) return "RECURRING_EVIDENCE_DEFICIENCY";
  if (categories.includes("POOR_EXPLANATION")) return "REPEATED_EXPLANATION_ISSUE";
  if (categories.includes("GOVERNANCE_CONCERN")) return "COMMON_GOVERNANCE_CONFLICT";
  if (categories.includes("AUTHORITY_CONFLICT")) return "AUTHORITY_RELATED_REJECTION";
  if (categories.includes("TIMING_ISSUE")) return "TIMING_RELATED_REJECTION";
  if (categories.includes("MULTIPLE_FACTORS")) return "MULTI_FACTOR_REJECTION";
  return "MISSION_SPECIFIC_REJECTION";
}

function outcomeImpactFor(quality: RecommendationQualityResult, categories: readonly RejectionCategory[], scenario: Scenario): RejectionOutcomeImpact {
  if (scenario === "INSUFFICIENT_EVIDENCE" || scenario === "INSUFFICIENT_INFORMATION" || scenario === "INCOMPLETE_EVIDENCE") return "INSUFFICIENT_EVIDENCE";
  if (scenario === "IMPROVED_OUTCOME") return "IMPROVED_OUTCOME";
  if (scenario === "DEGRADED_OUTCOME") return "DEGRADED_OUTCOME";
  if (categories.includes("GOVERNANCE_CONCERN") || categories.includes("AUTHORITY_CONFLICT")) return "GOVERNANCE_PRESERVED";
  if (categories.includes("EXCESSIVE_RISK")) return "INCREASED_RISK";
  if (quality.quality_score.composite_effectiveness_score >= 0.85) return "MISSED_OPPORTUNITY";
  if (quality.quality_score.composite_effectiveness_score >= 0.55) return "EQUIVALENT_OUTCOME";
  return "IMPROVED_OUTCOME";
}

function buildPattern(quality: RecommendationQualityResult, categories: readonly RejectionCategory[], scenario: Scenario): RejectionPatternRecord {
  const pattern = patternFor(categories);
  const base: Omit<RejectionPatternRecord, "integrity_hash"> = {
    pattern_id: `rejection_pattern_${hash(`${quality.quality_score.quality_score_id}:${pattern}`).slice(0, 14)}`,
    tenant_id: quality.quality_score.tenant_id,
    pattern,
    categories,
    descriptive_only: true,
    modifies_future_recommendations: false,
    supporting_evidence_refs: scenario === "INCOMPLETE_EVIDENCE" || scenario === "INSUFFICIENT_EVIDENCE" || scenario === "INSUFFICIENT_INFORMATION" ? freezeArray([]) : quality.quality_score.supporting_evidence_refs,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildRejectionRecord(quality: RecommendationQualityResult, pattern: RejectionPatternRecord, scenario: Scenario): RecommendationRejectionRecord {
  const categories = pattern.categories;
  const primary = categories[0] ?? "INSUFFICIENT_INFORMATION";
  const outcome = outcomeImpactFor(quality, categories, scenario);
  const missionScore = outcome === "IMPROVED_OUTCOME" || outcome === "GOVERNANCE_PRESERVED" ? 0.82 : outcome === "EQUIVALENT_OUTCOME" ? 0.62 : outcome === "DEGRADED_OUTCOME" || outcome === "MISSED_OPPORTUNITY" ? 0.28 : outcome === "INCREASED_RISK" ? 0.22 : 0.4;
  const governanceScore = quality.quality_score.governance_compliance_score;
  const rejectionEffectiveness = Number(((missionScore + governanceScore + (1 - quality.quality_score.composite_effectiveness_score)) / 3).toFixed(4));
  const base: Omit<RecommendationRejectionRecord, "integrity_hash"> = {
    rejection_analysis_id: `rejection_analysis_${hash(quality.quality_score.quality_score_id).slice(0, 14)}`,
    tenant_id: scenario === "CROSS_TENANT" ? `${quality.quality_score.tenant_id}:foreign` : quality.quality_score.tenant_id,
    mission_id: quality.quality_score.mission_id,
    decision_id: quality.quality_score.decision_id,
    recommendation_id: quality.quality_score.recommendation_id,
    rejection_state: scenario === "MISSING_REASON" ? "" : "REJECTED",
    operator_action: scenario === "OPERATOR_REJECTION_UNVERIFIABLE" ? "" : "operator rejected recommendation and recorded rationale",
    rejection_reason: scenario === "MISSING_REASON" ? "" : `${primary.toLowerCase()} recorded as rejection rationale`,
    rejection_categories: categories,
    primary_rejection_category: primary,
    context_assessment: `context evaluated for ${pattern.pattern.toLowerCase()} with quality rating ${quality.quality_score.quality_rating}`,
    outcome_after_rejection: scenario === "OUTCOME_EVIDENCE_UNAVAILABLE" ? "INSUFFICIENT_EVIDENCE" : outcome,
    mission_impact_score: Number(missionScore.toFixed(4)),
    governance_impact_score: governanceScore,
    recommendation_quality_assessment: `quality score ${quality.quality_score.composite_effectiveness_score} rated ${quality.quality_score.quality_rating}`,
    rejection_effectiveness_score: rejectionEffectiveness,
    pattern_refs: freezeArray([pattern.pattern_id]),
    explanation: scenario === "MISSING_EXPLANATION" ? "" : `${primary.toLowerCase()} rejection classified from recorded rationale, context, quality evidence, and post-rejection outcome ${outcome}`,
    supporting_evidence_refs: scenario === "INCOMPLETE_EVIDENCE" || scenario === "INSUFFICIENT_EVIDENCE" || scenario === "INSUFFICIENT_INFORMATION" ? freezeArray([]) : quality.quality_score.supporting_evidence_refs,
    governance_refs: scenario === "MISSING_GOVERNANCE" ? freezeArray([]) : quality.quality_score.governance_refs,
    replay_refs: scenario === "MISSING_REPLAY" ? freezeArray([]) : quality.quality_score.replay_refs,
    lineage_refs: scenario === "INCOMPLETE_LINEAGE" ? freezeArray([]) : quality.quality_score.lineage_refs,
    ledger_refs: freezeArray([quality.ledger_record.ledger_record_id]),
    advisory_only: true,
    infers_operator_intent: false,
    modifies_recommendation_behavior: false,
  };
  const record = Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
  if (scenario === "HASH_MISMATCH") return Object.freeze({ ...record, integrity_hash: hash({ tampered: record.rejection_analysis_id }) });
  return record;
}

function collectFailures(quality: RecommendationQualityResult, record: RecommendationRejectionRecord, pattern: RejectionPatternRecord, scenario: Scenario): readonly RejectionAnalysisFailure[] {
  const failures: RejectionAnalysisFailure[] = [];
  if (scenario === "MISSING_REASON" || !record.rejection_reason || !record.rejection_state) failures.push("REJECTION_REASON_UNAVAILABLE");
  if (scenario === "MISSING_OUTCOME" || !quality.ledger_record.outcome_refs.length) failures.push("OBSERVED_OUTCOMES_MISSING");
  if (scenario === "INCOMPLETE_EVIDENCE" || scenario === "INSUFFICIENT_EVIDENCE" || !record.supporting_evidence_refs.length || !pattern.supporting_evidence_refs.length) failures.push("EVIDENCE_INCOMPLETE");
  if (scenario === "MISSING_GOVERNANCE" || !record.governance_refs.length) failures.push("GOVERNANCE_VALIDATION_MISSING");
  if (scenario === "MISSING_REPLAY" || !record.replay_refs.length) failures.push("REPLAY_REFERENCES_MISSING");
  if (scenario === "INCOMPLETE_LINEAGE" || !record.lineage_refs.length) failures.push("LINEAGE_INCOMPLETE");
  if (scenario === "HASH_MISMATCH" || hashWithoutIntegrity(record) !== record.integrity_hash) failures.push("INTEGRITY_MISMATCH_DETECTED");
  if (scenario === "CROSS_TENANT" || record.tenant_id !== quality.ledger_record.tenant_id) failures.push("TENANT_ISOLATION_VIOLATED");
  if (scenario === "RECONSTRUCTION_FAILURE") failures.push("RECOMMENDATION_RECONSTRUCTION_FAILED");
  if (scenario === "OPERATOR_REJECTION_UNVERIFIABLE" || !record.operator_action) failures.push("OPERATOR_REJECTION_UNVERIFIABLE");
  if (scenario === "OUTCOME_EVIDENCE_UNAVAILABLE") failures.push("OUTCOME_EVIDENCE_UNAVAILABLE");
  if (scenario === "GOVERNANCE_FAILURE" || !quality.validation.governance_validated) failures.push("GOVERNANCE_VALIDATION_FAILED");
  if (scenario === "CONSTITUTIONAL_FAILURE") failures.push("CONSTITUTIONAL_VALIDATION_FAILED");
  if (scenario === "REPLAY_DIVERGENCE" || !quality.validation.replay_validated) failures.push("REPLAY_DIVERGENCE");
  if (scenario === "LEDGER_MUTATION" || !quality.validation.ledger_recorded) failures.push("LEDGER_MUTATION_DETECTED");
  if (scenario === "MISSING_EXPLANATION" || !record.explanation) failures.push("EXPLANATION_MISSING");
  if (scenario === "FAIL_OPEN") failures.push("FAIL_OPEN_BEHAVIOR");
  return freezeArray([...new Set(failures)]);
}

function stateForFailures(failures: readonly RejectionAnalysisFailure[]): RejectionAnalysisValidation["state"] {
  if (failures.includes("EVIDENCE_INCOMPLETE") || failures.includes("OBSERVED_OUTCOMES_MISSING")) return "PENDING_EVIDENCE";
  return failures.length ? "FAILED" : "CERTIFIED";
}

function buildLedger(record: RecommendationRejectionRecord, scenario: Scenario): RejectionAnalysisLedgerRecord {
  const base: Omit<RejectionAnalysisLedgerRecord, "integrity_hash"> = {
    ledger_record_id: `rejection_analysis_ledger_${hash(record.rejection_analysis_id).slice(0, 14)}`,
    tenant_id: record.tenant_id,
    rejection_analysis_id: record.rejection_analysis_id,
    recommendation_ref: record.recommendation_id,
    decision_ref: record.decision_id,
    operator_rejection_ref: record.operator_action,
    observed_outcome_refs: record.ledger_refs,
    pattern_refs: record.pattern_refs,
    evidence_refs: record.supporting_evidence_refs,
    governance_refs: record.governance_refs,
    replay_refs: record.replay_refs,
    append_only: true,
    deleted: false,
    ledger_sequence: 1,
  };
  const ledger = Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
  if (scenario === "LEDGER_MUTATION") return Object.freeze({ ...ledger, deleted: true, integrity_hash: ledger.integrity_hash });
  return ledger;
}

function buildValidation(quality: RecommendationQualityResult, record: RecommendationRejectionRecord, pattern: RejectionPatternRecord, ledger: RejectionAnalysisLedgerRecord, failures: readonly RejectionAnalysisFailure[]): RejectionAnalysisValidation {
  const recordVerified = hashWithoutIntegrity(record) === record.integrity_hash;
  const patternVerified = hashWithoutIntegrity(pattern) === pattern.integrity_hash;
  const ledgerVerified = hashWithoutIntegrity(ledger) === ledger.integrity_hash;
  const base: Omit<RejectionAnalysisValidation, "integrity_hash"> = {
    validation_id: "recommendation_rejection_analysis_validation",
    state: stateForFailures(failures),
    certified: failures.length === 0 && recordVerified && patternVerified && ledgerVerified,
    failures,
    rejection_recorded: !failures.includes("REJECTION_REASON_UNAVAILABLE"),
    context_collected: Boolean(record.context_assessment),
    failure_classified: record.rejection_categories.length > 0,
    outcome_evaluated: !failures.includes("OBSERVED_OUTCOMES_MISSING") && !failures.includes("OUTCOME_EVIDENCE_UNAVAILABLE"),
    governance_validated: !failures.includes("GOVERNANCE_VALIDATION_MISSING") && !failures.includes("GOVERNANCE_VALIDATION_FAILED") && !failures.includes("CONSTITUTIONAL_VALIDATION_FAILED"),
    replay_validated: !failures.includes("REPLAY_REFERENCES_MISSING") && !failures.includes("REPLAY_DIVERGENCE") && replayRecommendationQuality(quality),
    ledger_recorded: ledger.append_only && !ledger.deleted,
    evidence_complete: !failures.includes("EVIDENCE_INCOMPLETE") && !failures.includes("OUTCOME_EVIDENCE_UNAVAILABLE"),
    explanations_complete: !failures.includes("EXPLANATION_MISSING"),
    tenant_isolated: !failures.includes("TENANT_ISOLATION_VIOLATED") && record.tenant_id === quality.ledger_record.tenant_id,
    integrity_verified: recordVerified && patternVerified && ledgerVerified,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function resultReplayHash(result: Omit<RejectionAnalysisResult, "integrity_hash" | "replay_hash">): string {
  return hash({
    rejection_record: result.rejection_record,
    pattern_record: result.pattern_record,
    validation: result.validation,
    ledger: result.ledger_record,
    quality_hash: result.quality.replay_hash,
  });
}

function resultIntegrityHash(result: Omit<RejectionAnalysisResult, "integrity_hash">): string {
  return hash({
    recommendation_rejection_analysis_version: result.recommendation_rejection_analysis_version,
    api_surface_hash: result.api_surface.integrity_hash,
    rejection_record_hash: result.rejection_record.integrity_hash,
    pattern_hash: result.pattern_record.integrity_hash,
    validation_hash: result.validation.integrity_hash,
    ledger_hash: result.ledger_record.integrity_hash,
    quality_hash: result.quality.integrity_hash,
    replay_hash: result.replay_hash,
    deterministic: result.deterministic,
    replayable: result.replayable,
    advisory_only: result.advisory_only,
    rejection_signal_only: result.rejection_signal_only,
    infers_operator_intent: result.infers_operator_intent,
    adaptive_learning: result.adaptive_learning,
    modifies_recommendations: result.modifies_recommendations,
    modifies_operator_actions: result.modifies_operator_actions,
  });
}

export function analyzeRecommendationRejection(input: RejectionAnalysisInput = {}): RejectionAnalysisResult {
  const scenario = input.scenario ?? "BASELINE";
  const quality = sourceForScenario(input, scenario);
  const api_surface = buildApiSurface();
  const categories = categoriesFor(quality, scenario);
  const pattern_record = buildPattern(quality, categories, scenario);
  const rejection_record = buildRejectionRecord(quality, pattern_record, scenario);
  const failures = collectFailures(quality, rejection_record, pattern_record, scenario);
  const ledger_record = buildLedger(rejection_record, scenario);
  const validation = buildValidation(quality, rejection_record, pattern_record, ledger_record, failures);
  const base: Omit<RejectionAnalysisResult, "integrity_hash" | "replay_hash"> = {
    recommendation_rejection_analysis_version: REJECTION_ANALYSIS_VERSION,
    quality,
    api_surface,
    rejection_record,
    pattern_record,
    validation,
    ledger_record,
    deterministic: true,
    replayable: true,
    advisory_only: true,
    rejection_signal_only: true,
    infers_operator_intent: false,
    adaptive_learning: false,
    modifies_recommendations: false,
    modifies_operator_actions: false,
  };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function replayRecommendationRejection(result: RejectionAnalysisResult): boolean {
  return resultReplayHash(result) === result.replay_hash && resultIntegrityHash(result) === result.integrity_hash;
}

export function computeRecommendationRejectionHash(record: Omit<RecommendationRejectionRecord, "integrity_hash"> | RecommendationRejectionRecord): string {
  return hashWithoutIntegrity(record);
}

export function getRecommendationRejectionFoundation(): RejectionAnalysisFoundation {
  const api_surface = buildApiSurface();
  return Object.freeze({
    recommendation_rejection_analysis_version: REJECTION_ANALYSIS_VERSION,
    categories: REJECTION_CATEGORIES,
    api_surface,
    result: analyzeRecommendationRejection(),
  });
}

export const RecommendationRejectionAnalysis = Object.freeze({
  analyze: analyzeRecommendationRejection,
  replay: replayRecommendationRejection,
});
