import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { replayRecommendationQuality, scoreRecommendationQuality } from "@/services/recommendation-quality-scoring";
import type { RecommendationQualityInput, RecommendationQualityResult } from "@/types/recommendation-quality-scoring";
import type {
  AcceptanceAnalysisApiSurface,
  AcceptanceAnalysisFailure,
  AcceptanceAnalysisFoundation,
  AcceptanceAnalysisInput,
  AcceptanceAnalysisLedgerRecord,
  AcceptanceAnalysisResult,
  AcceptanceAnalysisValidation,
  AcceptanceClassification,
  AcceptancePattern,
  AcceptanceTrendRecord,
  ImplementationStatus,
  OutcomeCorrelation,
  RecommendationAcceptanceRecord,
} from "@/types/recommendation-acceptance-analysis";

const ACCEPTANCE_ANALYSIS_VERSION = "recommendation-acceptance-analysis/v1" as const;

export const ACCEPTANCE_CLASSIFICATIONS: readonly AcceptanceClassification[] = Object.freeze([
  "SUCCESSFUL_ACCEPTANCE",
  "PARTIALLY_SUCCESSFUL_ACCEPTANCE",
  "NEUTRAL_ACCEPTANCE",
  "INEFFECTIVE_ACCEPTANCE",
  "HARMFUL_ACCEPTANCE",
  "PREMATURE_ACCEPTANCE",
  "GOVERNANCE_RESTRICTED_ACCEPTANCE",
  "INSUFFICIENT_EVIDENCE",
]);

type Scenario = NonNullable<AcceptanceAnalysisInput["scenario"]>;

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

function sourceForScenario(input: AcceptanceAnalysisInput, scenario: Scenario): RecommendationQualityResult {
  if (input.quality) return input.quality;
  const qualityScenario: RecommendationQualityInput["scenario"] =
    scenario === "INCOMPLETE_EVIDENCE" || scenario === "INSUFFICIENT_EVIDENCE" ? "INCOMPLETE_EVIDENCE" :
    scenario === "MISSING_GOVERNANCE" ? "MISSING_GOVERNANCE" :
    scenario === "MISSING_REPLAY" ? "MISSING_REPLAY" :
    scenario === "INCOMPLETE_LINEAGE" ? "INCOMPLETE_LINEAGE" :
    scenario === "HASH_MISMATCH" ? "HASH_MISMATCH" :
    scenario === "CROSS_TENANT" ? "CROSS_TENANT" :
    scenario === "RECONSTRUCTION_FAILURE" ? "RECONSTRUCTION_FAILURE" :
    scenario === "GOVERNANCE_FAILURE" || scenario === "GOVERNANCE_RESTRICTED" ? "GOVERNANCE_FAILURE" :
    scenario === "CONSTITUTIONAL_FAILURE" ? "CONSTITUTIONAL_FAILURE" :
    scenario === "REPLAY_DIVERGENCE" ? "REPLAY_DIVERGENCE" :
    scenario === "LEDGER_MUTATION" ? "LEDGER_MUTATION" :
    scenario === "SUCCESSFUL" ? "HIGH" :
    scenario === "PARTIAL" ? "GOOD" :
    scenario === "NEUTRAL" ? "ACCEPTABLE" :
    scenario === "INEFFECTIVE" || scenario === "PREMATURE" ? "POOR" :
    scenario === "HARMFUL" ? "UNACCEPTABLE" :
    "BASELINE";
  return scoreRecommendationQuality({ scenario: qualityScenario });
}

function buildApiSurface(): AcceptanceAnalysisApiSurface {
  const base: Omit<AcceptanceAnalysisApiSurface, "integrity_hash"> = {
    api_id: "recommendation_acceptance_analysis_api",
    analyze_acceptance: "POST /recommendation-acceptance-analysis/analyze",
    classify_acceptance: "POST /recommendation-acceptance-analysis/classify",
    correlate_outcome: "POST /recommendation-acceptance-analysis/correlate",
    validate_analysis: "POST /recommendation-acceptance-analysis/validate",
    replay_analysis: "POST /recommendation-acceptance-analysis/replay",
    retrieve_contract: "GET /recommendation-acceptance-analysis/contract",
    update_supported: false,
    delete_supported: false,
    adaptive_learning_supported: false,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function classificationFor(quality: RecommendationQualityResult, scenario: Scenario): AcceptanceClassification {
  if (scenario === "INSUFFICIENT_EVIDENCE" || scenario === "INCOMPLETE_EVIDENCE") return "INSUFFICIENT_EVIDENCE";
  if (scenario === "GOVERNANCE_RESTRICTED" || scenario === "GOVERNANCE_FAILURE" || scenario === "CONSTITUTIONAL_FAILURE") return "GOVERNANCE_RESTRICTED_ACCEPTANCE";
  if (scenario === "PREMATURE") return "PREMATURE_ACCEPTANCE";
  if (scenario === "HARMFUL") return "HARMFUL_ACCEPTANCE";
  if (scenario === "INEFFECTIVE") return "INEFFECTIVE_ACCEPTANCE";
  if (scenario === "NEUTRAL") return "NEUTRAL_ACCEPTANCE";
  if (scenario === "PARTIAL") return "PARTIALLY_SUCCESSFUL_ACCEPTANCE";
  const composite = quality.quality_score.composite_effectiveness_score;
  if (composite >= 0.82) return "SUCCESSFUL_ACCEPTANCE";
  if (composite >= 0.68) return "PARTIALLY_SUCCESSFUL_ACCEPTANCE";
  if (composite >= 0.55) return "NEUTRAL_ACCEPTANCE";
  if (composite >= 0.35) return "INEFFECTIVE_ACCEPTANCE";
  return "HARMFUL_ACCEPTANCE";
}

function correlationFor(classification: AcceptanceClassification): OutcomeCorrelation {
  if (classification === "SUCCESSFUL_ACCEPTANCE") return "POSITIVE_CORRELATION";
  if (classification === "PARTIALLY_SUCCESSFUL_ACCEPTANCE") return "PARTIAL_CORRELATION";
  if (classification === "NEUTRAL_ACCEPTANCE" || classification === "PREMATURE_ACCEPTANCE") return "NEUTRAL_CORRELATION";
  if (classification === "INEFFECTIVE_ACCEPTANCE" || classification === "GOVERNANCE_RESTRICTED_ACCEPTANCE") return "NEGATIVE_CORRELATION";
  if (classification === "HARMFUL_ACCEPTANCE") return "HARMFUL_CORRELATION";
  return "INSUFFICIENT_EVIDENCE";
}

function patternFor(classification: AcceptanceClassification, scenario: Scenario): AcceptancePattern {
  if (classification === "INSUFFICIENT_EVIDENCE") return "INSUFFICIENT_EVIDENCE_PATTERN";
  if (classification === "PREMATURE_ACCEPTANCE") return "PREMATURE_ACCEPTANCE_PATTERN";
  if (classification === "GOVERNANCE_RESTRICTED_ACCEPTANCE") return "GOVERNANCE_DEPENDENT_ACCEPTANCE";
  if (scenario === "PARTIAL") return "MODIFIED_ACCEPTANCE";
  if (classification === "SUCCESSFUL_ACCEPTANCE") return "QUALITY_ALIGNED_ACCEPTANCE";
  return "CONSISTENT_ACCEPTANCE";
}

function implementationFor(scenario: Scenario): ImplementationStatus {
  if (scenario === "PARTIAL") return "PARTIALLY_IMPLEMENTED";
  if (scenario === "NEUTRAL" || scenario === "PREMATURE") return "MODIFIED_BEFORE_EXECUTION";
  if (scenario === "MISSING_ACCEPTANCE") return "UNKNOWN";
  if (scenario === "INEFFECTIVE" || scenario === "HARMFUL") return "IMPLEMENTED_AS_PROPOSED";
  return "IMPLEMENTED_AS_PROPOSED";
}

function buildTrend(quality: RecommendationQualityResult, pattern: AcceptancePattern, scenario: Scenario): AcceptanceTrendRecord {
  const base: Omit<AcceptanceTrendRecord, "integrity_hash"> = {
    trend_id: `acceptance_trend_${hash(`${quality.quality_score.quality_score_id}:${pattern}`).slice(0, 14)}`,
    tenant_id: quality.quality_score.tenant_id,
    pattern,
    trend_category: pattern.toLowerCase(),
    descriptive_only: true,
    modifies_future_recommendations: false,
    supporting_evidence_refs: scenario === "INCOMPLETE_EVIDENCE" || scenario === "INSUFFICIENT_EVIDENCE" ? freezeArray([]) : quality.quality_score.supporting_evidence_refs,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildAcceptanceRecord(quality: RecommendationQualityResult, trend: AcceptanceTrendRecord, scenario: Scenario): RecommendationAcceptanceRecord {
  const effect = quality.comparator.effectiveness.effectiveness_record;
  const classification = classificationFor(quality, scenario);
  const correlation = correlationFor(classification);
  const implementation = implementationFor(scenario);
  const composite = quality.quality_score.composite_effectiveness_score;
  const governanceScore = quality.quality_score.governance_compliance_score;
  const missionScore = classification === "HARMFUL_ACCEPTANCE" ? 0.12 : classification === "INEFFECTIVE_ACCEPTANCE" ? 0.32 : classification === "NEUTRAL_ACCEPTANCE" ? 0.55 : Math.min(1, composite + 0.02);
  const workflowScore = implementation === "PARTIALLY_IMPLEMENTED" ? Math.max(0, composite - 0.12) : implementation === "MODIFIED_BEFORE_EXECUTION" ? Math.max(0, composite - 0.18) : composite;
  const confidenceScore = quality.quality_score.confidence_quality_score;
  const acceptanceEffectiveness = Number(((missionScore + workflowScore + confidenceScore + governanceScore) / 4).toFixed(4));
  const base: Omit<RecommendationAcceptanceRecord, "integrity_hash"> = {
    acceptance_analysis_id: `acceptance_analysis_${hash(quality.quality_score.quality_score_id).slice(0, 14)}`,
    tenant_id: scenario === "CROSS_TENANT" ? `${quality.quality_score.tenant_id}:foreign` : quality.quality_score.tenant_id,
    mission_id: quality.quality_score.mission_id,
    decision_id: quality.quality_score.decision_id,
    recommendation_id: quality.quality_score.recommendation_id,
    acceptance_state: scenario === "MISSING_ACCEPTANCE" ? "" : effect.acceptance_state,
    operator_action: scenario === "OPERATOR_ACTION_UNVERIFIABLE" ? "" : effect.operator_action_taken,
    implementation_status: implementation,
    expected_outcome_refs: effect.expected_outcome_refs,
    observed_outcome_refs: scenario === "MISSING_OUTCOME" || scenario === "OUTCOME_EVIDENCE_UNAVAILABLE" ? freezeArray([]) : effect.actual_outcome_refs,
    mission_improvement_score: Number(missionScore.toFixed(4)),
    workflow_efficiency_score: Number(workflowScore.toFixed(4)),
    operator_confidence_score: confidenceScore,
    governance_preservation_score: governanceScore,
    acceptance_effectiveness_score: acceptanceEffectiveness,
    acceptance_classification: classification,
    outcome_correlation: correlation,
    acceptance_pattern: trend.pattern,
    trend_refs: freezeArray([trend.trend_id]),
    explanation: scenario === "MISSING_EXPLANATION" ? "" : `${classification.toLowerCase()} derived from recorded acceptance, implementation ${implementation}, quality rating ${quality.quality_score.quality_rating}, and observed outcome correlation ${correlation}`,
    supporting_evidence_refs: scenario === "INCOMPLETE_EVIDENCE" || scenario === "INSUFFICIENT_EVIDENCE" ? freezeArray([]) : quality.quality_score.supporting_evidence_refs,
    governance_refs: scenario === "MISSING_GOVERNANCE" ? freezeArray([]) : quality.quality_score.governance_refs,
    replay_refs: scenario === "MISSING_REPLAY" ? freezeArray([]) : quality.quality_score.replay_refs,
    lineage_refs: scenario === "INCOMPLETE_LINEAGE" ? freezeArray([]) : quality.quality_score.lineage_refs,
    ledger_refs: freezeArray([quality.ledger_record.ledger_record_id]),
    advisory_only: true,
    modifies_recommendation_behavior: false,
  };
  const record = Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
  if (scenario === "HASH_MISMATCH") return Object.freeze({ ...record, integrity_hash: hash({ tampered: record.acceptance_analysis_id }) });
  return record;
}

function collectFailures(quality: RecommendationQualityResult, record: RecommendationAcceptanceRecord, trend: AcceptanceTrendRecord, scenario: Scenario): readonly AcceptanceAnalysisFailure[] {
  const failures: AcceptanceAnalysisFailure[] = [];
  if (scenario === "MISSING_ACCEPTANCE" || !record.acceptance_state) failures.push("OPERATOR_ACCEPTANCE_UNAVAILABLE");
  if (scenario === "MISSING_OUTCOME" || !record.observed_outcome_refs.length) failures.push("OBSERVED_OUTCOMES_MISSING");
  if (scenario === "INCOMPLETE_EVIDENCE" || scenario === "INSUFFICIENT_EVIDENCE" || !record.supporting_evidence_refs.length || !trend.supporting_evidence_refs.length) failures.push("EVIDENCE_INCOMPLETE");
  if (scenario === "MISSING_GOVERNANCE" || !record.governance_refs.length) failures.push("GOVERNANCE_VALIDATION_MISSING");
  if (scenario === "MISSING_REPLAY" || !record.replay_refs.length) failures.push("REPLAY_REFERENCES_MISSING");
  if (scenario === "INCOMPLETE_LINEAGE" || !record.lineage_refs.length) failures.push("LINEAGE_INCOMPLETE");
  if (scenario === "HASH_MISMATCH" || hashWithoutIntegrity(record) !== record.integrity_hash) failures.push("INTEGRITY_MISMATCH_DETECTED");
  if (scenario === "CROSS_TENANT" || record.tenant_id !== quality.ledger_record.tenant_id) failures.push("TENANT_ISOLATION_VIOLATED");
  if (scenario === "RECONSTRUCTION_FAILURE") failures.push("RECOMMENDATION_RECONSTRUCTION_FAILED");
  if (scenario === "OPERATOR_ACTION_UNVERIFIABLE" || !record.operator_action) failures.push("OPERATOR_ACTION_UNVERIFIABLE");
  if (scenario === "OUTCOME_EVIDENCE_UNAVAILABLE") failures.push("OUTCOME_EVIDENCE_UNAVAILABLE");
  if (scenario === "GOVERNANCE_FAILURE" || !quality.validation.governance_validated) failures.push("GOVERNANCE_VALIDATION_FAILED");
  if (scenario === "CONSTITUTIONAL_FAILURE") failures.push("CONSTITUTIONAL_VALIDATION_FAILED");
  if (scenario === "REPLAY_DIVERGENCE" || !quality.validation.replay_validated) failures.push("REPLAY_DIVERGENCE");
  if (scenario === "LEDGER_MUTATION" || !quality.validation.ledger_recorded) failures.push("LEDGER_MUTATION_DETECTED");
  if (scenario === "MISSING_EXPLANATION" || !record.explanation) failures.push("EXPLANATION_MISSING");
  if (scenario === "FAIL_OPEN") failures.push("FAIL_OPEN_BEHAVIOR");
  return freezeArray([...new Set(failures)]);
}

function stateForFailures(failures: readonly AcceptanceAnalysisFailure[]): AcceptanceAnalysisValidation["state"] {
  if (failures.includes("EVIDENCE_INCOMPLETE") || failures.includes("OBSERVED_OUTCOMES_MISSING")) return "PENDING_EVIDENCE";
  return failures.length ? "FAILED" : "CERTIFIED";
}

function buildLedger(record: RecommendationAcceptanceRecord, scenario: Scenario): AcceptanceAnalysisLedgerRecord {
  const base: Omit<AcceptanceAnalysisLedgerRecord, "integrity_hash"> = {
    ledger_record_id: `acceptance_analysis_ledger_${hash(record.acceptance_analysis_id).slice(0, 14)}`,
    tenant_id: record.tenant_id,
    acceptance_analysis_id: record.acceptance_analysis_id,
    recommendation_ref: record.recommendation_id,
    decision_ref: record.decision_id,
    operator_action_ref: record.operator_action,
    observed_outcome_refs: record.observed_outcome_refs,
    trend_refs: record.trend_refs,
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

function buildValidation(quality: RecommendationQualityResult, record: RecommendationAcceptanceRecord, trend: AcceptanceTrendRecord, ledger: AcceptanceAnalysisLedgerRecord, failures: readonly AcceptanceAnalysisFailure[]): AcceptanceAnalysisValidation {
  const recordVerified = hashWithoutIntegrity(record) === record.integrity_hash;
  const trendVerified = hashWithoutIntegrity(trend) === trend.integrity_hash;
  const ledgerVerified = hashWithoutIntegrity(ledger) === ledger.integrity_hash;
  const base: Omit<AcceptanceAnalysisValidation, "integrity_hash"> = {
    validation_id: "recommendation_acceptance_analysis_validation",
    state: stateForFailures(failures),
    certified: failures.length === 0 && recordVerified && trendVerified && ledgerVerified,
    failures,
    acceptance_recorded: !failures.includes("OPERATOR_ACCEPTANCE_UNAVAILABLE"),
    implementation_verified: !failures.includes("OPERATOR_ACTION_UNVERIFIABLE") && record.implementation_status !== "UNKNOWN",
    outcome_observed: !failures.includes("OBSERVED_OUTCOMES_MISSING") && !failures.includes("OUTCOME_EVIDENCE_UNAVAILABLE"),
    governance_validated: !failures.includes("GOVERNANCE_VALIDATION_MISSING") && !failures.includes("GOVERNANCE_VALIDATION_FAILED") && !failures.includes("CONSTITUTIONAL_VALIDATION_FAILED"),
    replay_validated: !failures.includes("REPLAY_REFERENCES_MISSING") && !failures.includes("REPLAY_DIVERGENCE") && replayRecommendationQuality(quality),
    ledger_recorded: ledger.append_only && !ledger.deleted,
    evidence_complete: !failures.includes("EVIDENCE_INCOMPLETE") && !failures.includes("OUTCOME_EVIDENCE_UNAVAILABLE"),
    explanations_complete: !failures.includes("EXPLANATION_MISSING"),
    tenant_isolated: !failures.includes("TENANT_ISOLATION_VIOLATED") && record.tenant_id === quality.ledger_record.tenant_id,
    integrity_verified: recordVerified && trendVerified && ledgerVerified,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function resultReplayHash(result: Omit<AcceptanceAnalysisResult, "integrity_hash" | "replay_hash">): string {
  return hash({
    acceptance_record: result.acceptance_record,
    trend_record: result.trend_record,
    validation: result.validation,
    ledger: result.ledger_record,
    quality_hash: result.quality.replay_hash,
  });
}

function resultIntegrityHash(result: Omit<AcceptanceAnalysisResult, "integrity_hash">): string {
  return hash({
    recommendation_acceptance_analysis_version: result.recommendation_acceptance_analysis_version,
    api_surface_hash: result.api_surface.integrity_hash,
    acceptance_record_hash: result.acceptance_record.integrity_hash,
    trend_hash: result.trend_record.integrity_hash,
    validation_hash: result.validation.integrity_hash,
    ledger_hash: result.ledger_record.integrity_hash,
    quality_hash: result.quality.integrity_hash,
    replay_hash: result.replay_hash,
    deterministic: result.deterministic,
    replayable: result.replayable,
    advisory_only: result.advisory_only,
    acceptance_signal_only: result.acceptance_signal_only,
    infers_operator_intent: result.infers_operator_intent,
    adaptive_learning: result.adaptive_learning,
    modifies_recommendations: result.modifies_recommendations,
    modifies_operator_actions: result.modifies_operator_actions,
  });
}

export function analyzeRecommendationAcceptance(input: AcceptanceAnalysisInput = {}): AcceptanceAnalysisResult {
  const scenario = input.scenario ?? "BASELINE";
  const quality = sourceForScenario(input, scenario);
  const api_surface = buildApiSurface();
  const classification = classificationFor(quality, scenario);
  const trend_record = buildTrend(quality, patternFor(classification, scenario), scenario);
  const acceptance_record = buildAcceptanceRecord(quality, trend_record, scenario);
  const failures = collectFailures(quality, acceptance_record, trend_record, scenario);
  const ledger_record = buildLedger(acceptance_record, scenario);
  const validation = buildValidation(quality, acceptance_record, trend_record, ledger_record, failures);
  const base: Omit<AcceptanceAnalysisResult, "integrity_hash" | "replay_hash"> = {
    recommendation_acceptance_analysis_version: ACCEPTANCE_ANALYSIS_VERSION,
    quality,
    api_surface,
    acceptance_record,
    trend_record,
    validation,
    ledger_record,
    deterministic: true,
    replayable: true,
    advisory_only: true,
    acceptance_signal_only: true,
    infers_operator_intent: false,
    adaptive_learning: false,
    modifies_recommendations: false,
    modifies_operator_actions: false,
  };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function replayRecommendationAcceptance(result: AcceptanceAnalysisResult): boolean {
  return resultReplayHash(result) === result.replay_hash && resultIntegrityHash(result) === result.integrity_hash;
}

export function computeRecommendationAcceptanceHash(record: Omit<RecommendationAcceptanceRecord, "integrity_hash"> | RecommendationAcceptanceRecord): string {
  return hashWithoutIntegrity(record);
}

export function getRecommendationAcceptanceFoundation(): AcceptanceAnalysisFoundation {
  const api_surface = buildApiSurface();
  return Object.freeze({
    recommendation_acceptance_analysis_version: ACCEPTANCE_ANALYSIS_VERSION,
    classifications: ACCEPTANCE_CLASSIFICATIONS,
    api_surface,
    result: analyzeRecommendationAcceptance(),
  });
}

export const RecommendationAcceptanceAnalysis = Object.freeze({
  analyze: analyzeRecommendationAcceptance,
  replay: replayRecommendationAcceptance,
});
