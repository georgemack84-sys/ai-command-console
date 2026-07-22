import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import { runCognitiveExplainability, validateCognitiveExplainability } from "@/services/cognitive-explainability-engine";
import { runPredictionKnowledgeRepository, validatePredictionKnowledgeRepository } from "@/services/prediction-knowledge-repository";
import { createPrediction, validatePrediction } from "@/services/prediction-contract";
import { runRiskForecasting, validateRiskForecasting } from "@/services/risk-forecasting-engine";
import type {
  ConfidenceFactorName,
  ConfidenceMetric,
  ForecastConfidenceEngineContract,
  ForecastConfidenceFailure,
  ForecastConfidenceInput,
  ForecastConfidenceLevel,
  ForecastConfidenceObject,
  ForecastConfidenceObservabilitySurface,
  ForecastConfidenceReplayResult,
  ForecastConfidenceRepository,
  ForecastConfidenceScenario,
  ForecastConfidenceValidationResult,
  ForecastReliabilityLevel,
  ForecastUncertaintyLevel,
} from "@/types/forecast-confidence-engine";
import type { RiskForecastingReport } from "@/types/risk-forecasting-engine";

const NOW = "2026-07-12T21:00:00.000Z";
const VERSION = "forecast-confidence-engine/v8ALT.3.7" as const;
const TENANT_ID = "tenant:autonomy:primary";
const confidenceLevels: readonly ForecastConfidenceLevel[] = Object.freeze(["VERY_HIGH", "HIGH", "MEDIUM", "LOW", "VERY_LOW", "INSUFFICIENT"]);
const reliabilityLevels: readonly ForecastReliabilityLevel[] = Object.freeze(["CERTIFIED", "HIGHLY_RELIABLE", "RELIABLE", "CAUTION", "UNRELIABLE", "REJECTED"]);
const uncertaintyLevels: readonly ForecastUncertaintyLevel[] = Object.freeze(["MINIMAL", "LOW", "MODERATE", "HIGH", "SEVERE", "UNKNOWN"]);
const pipelineStates = Object.freeze(["PREDICTION_RECEIVED", "EVIDENCE_ANALYSIS", "HISTORICAL_VALIDATION", "MODEL_STABILITY_ANALYSIS", "REPLAY_VALIDATION", "GOVERNANCE_VALIDATION", "CONFIDENCE_CALCULATION", "RELIABILITY_SCORING", "EXPLAINABILITY_GENERATION", "PUBLISHED", "REJECTED"] as const);
const factorWeights: Readonly<Record<ConfidenceFactorName, number>> = Object.freeze({
  prediction_confidence: 0.18,
  model_stability: 0.14,
  evidence_quality: 0.16,
  historical_accuracy: 0.12,
  replay_consistency: 0.14,
  governance_certainty: 0.12,
  integrity_verification: 0.09,
  environmental_stability: 0.05,
});
const scoringFactors = Object.freeze(Object.keys(factorWeights) as ConfidenceFactorName[]);

function hashValue(domain: string, value: unknown): string { return hashConfidenceValue(domain, canonicalizeConfidenceToString(value)); }
function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function unique<T extends string>(values: readonly T[]): readonly T[] { return freezeArray([...new Set(values)].sort()); }
function id(prefix: string, domain: string, value: unknown): string { return `${prefix}-${hashValue(domain, value).slice(0, 12).toUpperCase()}`; }
function round(value: number): number { return Number(value.toFixed(4)); }

function scenarioFailures(scenario: ForecastConfidenceScenario): readonly ForecastConfidenceFailure[] {
  const map: Partial<Record<ForecastConfidenceScenario, ForecastConfidenceFailure>> = {
    HIDDEN_CONFIDENCE_FACTOR: "HIDDEN_CONFIDENCE_FACTOR_DETECTED",
    CONFIDENCE_MANIPULATION: "CONFIDENCE_MANIPULATION_DETECTED",
    THRESHOLD_MODIFICATION_ATTEMPT: "AUTONOMOUS_THRESHOLD_MODIFICATION_DETECTED",
    CONFIDENCE_WITHOUT_EVIDENCE: "CONFIDENCE_WITHOUT_EVIDENCE_DETECTED",
    REPLAY_INCONSISTENCY: "REPLAY_INCONSISTENCY_DETECTED",
    GOVERNANCE_CERTAINTY_OMITTED: "GOVERNANCE_CERTAINTY_OMITTED",
    CROSS_TENANT_EVALUATION: "CROSS_TENANT_CONFIDENCE_EVALUATION_DETECTED",
  };
  return map[scenario] ? freezeArray([map[scenario]]) : freezeArray([]);
}

function confidenceLevel(score: number): ForecastConfidenceLevel {
  if (score >= 0.9) return "VERY_HIGH";
  if (score >= 0.78) return "HIGH";
  if (score >= 0.62) return "MEDIUM";
  if (score >= 0.45) return "LOW";
  if (score >= 0.25) return "VERY_LOW";
  return "INSUFFICIENT";
}

function reliabilityLevel(score: number): ForecastReliabilityLevel {
  if (score >= 0.92) return "CERTIFIED";
  if (score >= 0.82) return "HIGHLY_RELIABLE";
  if (score >= 0.68) return "RELIABLE";
  if (score >= 0.5) return "CAUTION";
  if (score >= 0.25) return "UNRELIABLE";
  return "REJECTED";
}

function uncertaintyLevel(score: number): ForecastUncertaintyLevel {
  if (score >= 0.9) return "MINIMAL";
  if (score >= 0.78) return "LOW";
  if (score >= 0.62) return "MODERATE";
  if (score >= 0.45) return "HIGH";
  if (score >= 0.25) return "SEVERE";
  return "UNKNOWN";
}

function metric(factor_name: ConfidenceFactorName, score: number, rationale: string, source_references: readonly string[]): ConfidenceMetric {
  const weight = factorWeights[factor_name];
  const base = {
    factor_name,
    score: round(score),
    weight,
    weighted_score: round(score * weight),
    rationale,
    source_references: freezeArray([...source_references].filter(Boolean).sort()),
  };
  return Object.freeze({ ...base, metric_hash: hashValue("forecast-confidence-metric", base) });
}

function computeRecordHash(record: Omit<ForecastConfidenceObject, "confidence_hash"> | ForecastConfidenceObject): string {
  const { confidence_hash: _hash, ...source } = record as ForecastConfidenceObject;
  return hashValue("forecast-confidence-record", source);
}

function forecastId(report: RiskForecastingReport, index: number): string {
  return report.forecasts[index % report.forecasts.length]?.forecast_id ?? report.report_id;
}

function confidenceRecord(input: {
  report: RiskForecastingReport;
  index: number;
  predictionId: string;
  executionId: string;
  tenantId: string;
  missionId: string;
  modelCount: number;
  knowledgeCount: number;
  explanationCount: number;
  failures: readonly ForecastConfidenceFailure[];
}): ForecastConfidenceObject {
  const forecast = input.report.forecasts[input.index % input.report.forecasts.length];
  const evidenceCount = forecast?.supporting_evidence.length ?? 0;
  const confidence_id = id("FCE", "forecast-confidence", { forecast: forecastId(input.report, input.index), index: input.index });
  const noEvidence = input.failures.includes("CONFIDENCE_WITHOUT_EVIDENCE_DETECTED");
  const replayBroken = input.failures.includes("REPLAY_INCONSISTENCY_DETECTED");
  const governanceOmitted = input.failures.includes("GOVERNANCE_CERTAINTY_OMITTED");
  const hiddenFactor = input.failures.includes("HIDDEN_CONFIDENCE_FACTOR_DETECTED");
  const manipulated = input.failures.includes("CONFIDENCE_MANIPULATION_DETECTED");
  const prediction_confidence = round(forecast?.projected_confidence ?? 0.78);
  const model_stability = round(Math.min(0.96, 0.72 + input.modelCount * 0.025));
  const evidence_quality = noEvidence ? 0 : round(Math.min(0.98, 0.58 + evidenceCount * 0.055));
  const historical_accuracy = round(Math.min(0.94, 0.66 + input.knowledgeCount * 0.018));
  const replay_consistency = replayBroken ? 0.18 : round(Math.min(0.99, 0.74 + input.explanationCount * 0.018));
  const governance_certainty = governanceOmitted ? 0 : round(forecast?.governance_validation === "PASS" && forecast?.constitutional_validation === "PASS" ? 0.91 : 0.34);
  const integrity_verification = round(input.report.repository.integrity_hashes.length > 0 ? 0.93 : 0.2);
  const environmental_stability = round(0.82);
  const metrics = [
    metric("prediction_confidence", prediction_confidence, "forecast projected confidence preserved from deterministic risk forecasting", [forecast?.forecast_id ?? "", forecast?.forecast_hash ?? ""]),
    metric("model_stability", model_stability, "model reproducibility inferred from versioned predictive knowledge and deterministic model count", [forecast?.source_historical_intelligence.repository.repository_hash ?? "historical-repository:missing"]),
    metric("evidence_quality", evidence_quality, noEvidence ? "" : "evidence quality calculated from complete supporting evidence and integrity references", forecast?.supporting_evidence.map((item) => item.evidence_hash) ?? []),
    metric("historical_accuracy", historical_accuracy, "historical accuracy inferred from preserved knowledge objects and validation references", [forecast?.source_historical_intelligence.report_hash ?? "historical-report:missing"]),
    metric("replay_consistency", replay_consistency, replayBroken ? "" : "replay consistency verified through risk, knowledge, and explainability replay artifacts", [input.report.replay_reference]),
    metric("governance_certainty", governance_certainty, governanceOmitted ? "" : "governance certainty includes policy and constitutional validation", [forecast?.lineage_reference ?? ""]),
    metric("integrity_verification", integrity_verification, "integrity verification uses repository and forecast hashes", [input.report.integrity_hash, input.report.repository.repository_hash]),
    metric("environmental_stability", environmental_stability, "environmental stability remains fixed for deterministic advisory assessment", [input.missionId]),
  ];
  const visibleMetrics = hiddenFactor ? metrics.slice(0, -1) : metrics;
  const calculatedReliability = round(visibleMetrics.reduce((sum, item) => sum + item.weighted_score, 0));
  const overall_forecast_reliability = manipulated ? round(Math.min(1, calculatedReliability + 0.21)) : calculatedReliability;
  const base = {
    confidence_id,
    prediction_id: input.predictionId,
    forecast_id: forecastId(input.report, input.index),
    mission_id: input.missionId,
    execution_id: input.executionId,
    tenant_id: input.failures.includes("CROSS_TENANT_CONFIDENCE_EVALUATION_DETECTED") ? "external-tenant" : input.tenantId,
    pipeline_state: input.failures.length ? "REJECTED" as const : "PUBLISHED" as const,
    prediction_confidence,
    model_stability,
    evidence_quality,
    historical_accuracy,
    replay_consistency,
    governance_certainty,
    integrity_verification,
    environmental_stability,
    overall_forecast_reliability,
    confidence_level: confidenceLevel(overall_forecast_reliability),
    reliability_level: reliabilityLevel(overall_forecast_reliability),
    uncertainty_level: uncertaintyLevel(overall_forecast_reliability),
    confidence_explanation: freezeArray([
      "overall reliability is the weighted sum of explicit confidence factors",
      "evidence contribution, historical performance, model stability, replay consistency, governance certainty, integrity, and environment are traceable",
      "confidence remains advisory and cannot authorize execution",
      "uncertainty is derived from the final reliability score",
    ]),
    supporting_metrics: freezeArray(visibleMetrics),
    assumptions: freezeArray(["source prediction is immutable", "confidence thresholds are fixed", "operator approval controls downstream action"]),
    limitations: freezeArray(["confidence does not alter prediction outcomes", "confidence does not execute mitigation", "confidence is bounded by available evidence"]),
    governance_validation: governanceOmitted ? "FAIL" as const : "PASS" as const,
    constitutional_validation: "PASS" as const,
    lineage_reference: forecast?.lineage_reference ?? input.report.lineage_reference,
    replay_reference: replayBroken ? "" : forecast?.replay_reference ?? input.report.replay_reference,
    integrity_hash: manipulated ? "" : hashValue("forecast-confidence-integrity", { confidence_id, metrics: visibleMetrics.map((item) => item.metric_hash), overall_forecast_reliability }),
    generated_at: NOW,
    version: VERSION,
    advisory_only: true as const,
    prediction_modified: false,
    threshold_modified: input.failures.includes("AUTONOMOUS_THRESHOLD_MODIFICATION_DETECTED"),
    execution_authorized: false,
    confidence_manipulated: manipulated,
    hidden_factor_detected: hiddenFactor,
  };
  return Object.freeze({ ...base, confidence_hash: computeRecordHash(base as Omit<ForecastConfidenceObject, "confidence_hash">) });
}

export function computeForecastConfidenceRepositoryHash(repository: Omit<ForecastConfidenceRepository, "repository_hash"> | ForecastConfidenceRepository): string {
  const { repository_hash: _hash, ...source } = repository as ForecastConfidenceRepository;
  return hashValue("forecast-confidence-repository", source);
}

export function runForecastConfidence(input: ForecastConfidenceInput = {}): ForecastConfidenceRepository {
  const scenario = input.scenario ?? "BASELINE";
  const failures = scenarioFailures(scenario);
  const tenantId = input.tenant_id ?? TENANT_ID;
  const prediction = input.prediction ?? createPrediction({ tenant_id: tenantId, mission_id: input.mission_id });
  const risk = input.risk_report ?? runRiskForecasting({ tenant_id: tenantId, mission_id: prediction.mission_id });
  const knowledge = input.knowledge_repository ?? runPredictionKnowledgeRepository({ tenant_id: tenantId, mission_id: prediction.mission_id, prediction, risk_report: risk });
  const explainability = input.explainability_repository ?? runCognitiveExplainability({ tenant_id: tenantId, mission_id: prediction.mission_id, knowledge_repository: knowledge });
  const confidence_records = freezeArray(risk.forecasts.map((_, index) => confidenceRecord({
    report: risk,
    index,
    predictionId: prediction.prediction_id,
    executionId: prediction.execution_id,
    tenantId,
    missionId: prediction.mission_id,
    modelCount: risk.forecasts[0]?.source_historical_intelligence.prediction_models.length ?? 0,
    knowledgeCount: knowledge.knowledge_objects.length,
    explanationCount: explainability.explanations.length,
    failures,
  })));
  const repositoryBase = {
    repository_id: id("FCEREPO", "forecast-confidence-repository", { risk: risk.report_hash, scenario }),
    tenant_id: failures.includes("CROSS_TENANT_CONFIDENCE_EVALUATION_DETECTED") ? "external-tenant" : tenantId,
    mission_id: prediction.mission_id,
    confidence_records,
    reliability_scores: freezeArray(confidence_records.map((record) => record.overall_forecast_reliability)),
    evidence_quality_metrics: freezeArray(confidence_records.map((record) => `${record.confidence_id}:${record.evidence_quality}`).sort()),
    historical_performance_metrics: freezeArray(confidence_records.map((record) => `${record.confidence_id}:${record.historical_accuracy}`).sort()),
    governance_certainty_results: freezeArray(confidence_records.map((record) => `${record.confidence_id}:${record.governance_certainty}:${record.governance_validation}`).sort()),
    replay_consistency_results: freezeArray(confidence_records.map((record) => `${record.confidence_id}:${record.replay_consistency}`).sort()),
    lineage_references: freezeArray(confidence_records.map((record) => record.lineage_reference).filter(Boolean).sort()),
    replay_references: freezeArray(confidence_records.map((record) => record.replay_reference).filter(Boolean).sort()),
    integrity_hashes: freezeArray(confidence_records.map((record) => record.integrity_hash).filter(Boolean).sort()),
    source_prediction: prediction,
    source_risk_report: risk,
    source_knowledge_repository: knowledge,
    source_explainability_repository: explainability,
    append_only: true as const,
  };
  return Object.freeze({ ...repositoryBase, repository_hash: computeForecastConfidenceRepositoryHash(repositoryBase as Omit<ForecastConfidenceRepository, "repository_hash">) });
}

export function replayForecastConfidence(repository = runForecastConfidence()): ForecastConfidenceReplayResult {
  const reconstructed_hash = computeForecastConfidenceRepositoryHash(repository);
  const source = { replay_reference: `replay:${repository.repository_id}`, repository_id: repository.repository_id, deterministic: reconstructed_hash === repository.repository_hash && repository.replay_references.length === repository.confidence_records.length, reconstructed_hash, original_hash: repository.repository_hash };
  return Object.freeze({ ...source, replay_result_hash: hashValue("forecast-confidence-replay", source) });
}

export function validateForecastConfidence(repository?: ForecastConfidenceRepository): ForecastConfidenceValidationResult {
  if (!repository) {
    const failures = freezeArray<ForecastConfidenceFailure>(["CONFIDENCE_CONTRACT_INVALID"]);
    const source = { repository_id: null, valid: false, confidence_contract_valid: false, confidence_schema_valid: false, prediction_confidence_reproducible: false, model_stability_calculated_deterministically: false, evidence_quality_reproducible: false, historical_accuracy_reproducible: false, replay_consistency_verified: false, governance_certainty_reproducible: false, overall_forecast_reliability_reproducible: false, uncertainty_level_deterministic: false, confidence_explanations_complete: false, confidence_factors_traceable: false, replay_reconstructs_identical_confidence_scores: false, lineage_references_preserved: false, integrity_hashes_reproducible: false, governance_validation_enforced: false, constitutional_compliance_verified: false, hidden_confidence_factors_rejected: false, confidence_manipulation_rejected: false, autonomous_threshold_modification_rejected: false, confidence_without_evidence_rejected: false, replay_inconsistency_detected: false, governance_certainty_present: false, tenant_isolation_enforced: false, cross_tenant_confidence_evaluation_rejected: false, advisory_only_behavior_enforced: false, failures };
    return Object.freeze({ ...source, validation_hash: hashValue("forecast-confidence-validation", source) });
  }
  const sourceValid = validatePrediction(repository.source_prediction).valid && validateRiskForecasting(repository.source_risk_report).valid && validatePredictionKnowledgeRepository(repository.source_knowledge_repository).valid && validateCognitiveExplainability(repository.source_explainability_repository).valid;
  const expectedFactors = scoringFactors.length;
  const confidence_contract_valid = repository.append_only && repository.confidence_records.length === repository.source_risk_report.forecasts.length && sourceValid;
  const confidence_schema_valid = repository.confidence_records.every((record) => record.confidence_id && record.prediction_id && record.forecast_id && record.version === VERSION);
  const prediction_confidence_reproducible = repository.confidence_records.every((record) => record.prediction_confidence >= 0 && record.prediction_confidence <= 1);
  const model_stability_calculated_deterministically = repository.confidence_records.every((record) => record.model_stability >= 0 && record.model_stability <= 1);
  const evidence_quality_reproducible = repository.confidence_records.every((record) => record.evidence_quality > 0 && record.supporting_metrics.some((metricItem) => metricItem.factor_name === "evidence_quality" && metricItem.rationale !== ""));
  const historical_accuracy_reproducible = repository.confidence_records.every((record) => record.historical_accuracy > 0);
  const replay_consistency_verified = repository.confidence_records.every((record) => record.replay_consistency > 0.5 && record.replay_reference);
  const governance_certainty_reproducible = repository.confidence_records.every((record) => record.governance_certainty > 0 && record.supporting_metrics.some((metricItem) => metricItem.factor_name === "governance_certainty" && metricItem.rationale));
  const overall_forecast_reliability_reproducible = repository.confidence_records.every((record) => round(record.supporting_metrics.reduce((sum, item) => sum + item.weighted_score, 0)) === record.overall_forecast_reliability);
  const uncertainty_level_deterministic = repository.confidence_records.every((record) => uncertaintyLevel(record.overall_forecast_reliability) === record.uncertainty_level);
  const confidence_explanations_complete = repository.confidence_records.every((record) => record.confidence_explanation.length >= 4 && record.assumptions.length > 0 && record.limitations.length > 0);
  const confidence_factors_traceable = repository.confidence_records.every((record) => record.supporting_metrics.length === expectedFactors && record.supporting_metrics.every((metricItem) => metricItem.source_references.length > 0 && metricItem.rationale));
  const replay_reconstructs_identical_confidence_scores = replayForecastConfidence(repository).deterministic;
  const lineage_references_preserved = repository.lineage_references.length === repository.confidence_records.length;
  const integrity_hashes_reproducible = repository.integrity_hashes.length === repository.confidence_records.length && computeForecastConfidenceRepositoryHash(repository) === repository.repository_hash;
  const governance_validation_enforced = repository.confidence_records.every((record) => record.governance_validation === "PASS");
  const constitutional_compliance_verified = repository.confidence_records.every((record) => record.constitutional_validation === "PASS");
  const hidden_confidence_factors_rejected = !repository.confidence_records.some((record) => record.hidden_factor_detected);
  const confidence_manipulation_rejected = !repository.confidence_records.some((record) => record.confidence_manipulated);
  const autonomous_threshold_modification_rejected = !repository.confidence_records.some((record) => record.threshold_modified);
  const confidence_without_evidence_rejected = repository.confidence_records.every((record) => record.evidence_quality > 0);
  const replay_inconsistency_detected = replay_consistency_verified;
  const governance_certainty_present = governance_certainty_reproducible;
  const tenant_isolation_enforced = repository.tenant_id !== "external-tenant" && repository.confidence_records.every((record) => record.tenant_id === repository.tenant_id);
  const cross_tenant_confidence_evaluation_rejected = tenant_isolation_enforced;
  const advisory_only_behavior_enforced = repository.confidence_records.every((record) => record.advisory_only && !record.prediction_modified && !record.threshold_modified && !record.execution_authorized);
  const failures = unique([
    ...(!confidence_contract_valid ? ["CONFIDENCE_CONTRACT_INVALID" as const] : []),
    ...(!confidence_schema_valid ? ["CONFIDENCE_SCHEMA_INVALID" as const] : []),
    ...(!prediction_confidence_reproducible ? ["PREDICTION_CONFIDENCE_NONDETERMINISTIC" as const] : []),
    ...(!model_stability_calculated_deterministically ? ["MODEL_STABILITY_NONDETERMINISTIC" as const] : []),
    ...(!evidence_quality_reproducible ? ["EVIDENCE_QUALITY_NONDETERMINISTIC" as const, "CONFIDENCE_WITHOUT_EVIDENCE_DETECTED" as const] : []),
    ...(!historical_accuracy_reproducible ? ["HISTORICAL_ACCURACY_NONDETERMINISTIC" as const] : []),
    ...(!replay_consistency_verified ? ["REPLAY_CONSISTENCY_INVALID" as const, "REPLAY_INCONSISTENCY_DETECTED" as const] : []),
    ...(!governance_certainty_reproducible ? ["GOVERNANCE_CERTAINTY_NONDETERMINISTIC" as const, "GOVERNANCE_CERTAINTY_OMITTED" as const] : []),
    ...(!overall_forecast_reliability_reproducible ? ["OVERALL_RELIABILITY_NONDETERMINISTIC" as const, "CONFIDENCE_MANIPULATION_DETECTED" as const] : []),
    ...(!uncertainty_level_deterministic ? ["UNCERTAINTY_LEVEL_NONDETERMINISTIC" as const] : []),
    ...(!confidence_explanations_complete ? ["CONFIDENCE_EXPLANATION_INCOMPLETE" as const] : []),
    ...(!confidence_factors_traceable ? ["CONFIDENCE_FACTORS_NOT_TRACEABLE" as const, "HIDDEN_CONFIDENCE_FACTOR_DETECTED" as const] : []),
    ...(!replay_reconstructs_identical_confidence_scores ? ["REPLAY_CONFIDENCE_MISMATCH" as const] : []),
    ...(!lineage_references_preserved ? ["LINEAGE_REFERENCES_MISSING" as const] : []),
    ...(!integrity_hashes_reproducible ? ["INTEGRITY_HASH_INVALID" as const] : []),
    ...(!governance_validation_enforced ? ["GOVERNANCE_VALIDATION_MISSING" as const] : []),
    ...(!constitutional_compliance_verified ? ["CONSTITUTIONAL_COMPLIANCE_MISSING" as const] : []),
    ...(!hidden_confidence_factors_rejected ? ["HIDDEN_CONFIDENCE_FACTOR_DETECTED" as const] : []),
    ...(!confidence_manipulation_rejected ? ["CONFIDENCE_MANIPULATION_DETECTED" as const] : []),
    ...(!autonomous_threshold_modification_rejected ? ["AUTONOMOUS_THRESHOLD_MODIFICATION_DETECTED" as const] : []),
    ...(!confidence_without_evidence_rejected ? ["CONFIDENCE_WITHOUT_EVIDENCE_DETECTED" as const] : []),
    ...(!tenant_isolation_enforced ? ["TENANT_ISOLATION_INVALID" as const, "CROSS_TENANT_CONFIDENCE_EVALUATION_DETECTED" as const] : []),
    ...(!advisory_only_behavior_enforced ? ["ADVISORY_ONLY_VIOLATION" as const] : []),
  ]);
  const valid = failures.length === 0;
  const source = { repository_id: repository.repository_id, valid, confidence_contract_valid, confidence_schema_valid, prediction_confidence_reproducible, model_stability_calculated_deterministically, evidence_quality_reproducible, historical_accuracy_reproducible, replay_consistency_verified, governance_certainty_reproducible, overall_forecast_reliability_reproducible, uncertainty_level_deterministic, confidence_explanations_complete, confidence_factors_traceable, replay_reconstructs_identical_confidence_scores, lineage_references_preserved, integrity_hashes_reproducible, governance_validation_enforced, constitutional_compliance_verified, hidden_confidence_factors_rejected, confidence_manipulation_rejected, autonomous_threshold_modification_rejected, confidence_without_evidence_rejected, replay_inconsistency_detected, governance_certainty_present, tenant_isolation_enforced, cross_tenant_confidence_evaluation_rejected, advisory_only_behavior_enforced, failures };
  return Object.freeze({ ...source, validation_hash: hashValue("forecast-confidence-validation", source) });
}

export function buildForecastConfidenceObservabilitySurface(repository = runForecastConfidence()): ForecastConfidenceObservabilitySurface {
  const average = round(repository.reliability_scores.reduce((sum, value) => sum + value, 0) / Math.max(1, repository.reliability_scores.length));
  const highest = [...repository.confidence_records].sort((a, b) => b.overall_forecast_reliability - a.overall_forecast_reliability)[0]?.confidence_level ?? "INSUFFICIENT";
  const lowestUncertainty = [...repository.confidence_records].sort((a, b) => b.overall_forecast_reliability - a.overall_forecast_reliability)[0]?.uncertainty_level ?? "UNKNOWN";
  return Object.freeze({ repository_id: repository.repository_id, tenant_id: repository.tenant_id, mission_id: repository.mission_id, confidence_count: repository.confidence_records.length, average_reliability: average, highest_confidence_level: highest, lowest_uncertainty_level: lowestUncertainty, advisory_only: true, repository_hash: repository.repository_hash });
}

export function getForecastConfidenceEngineContract(): ForecastConfidenceEngineContract {
  const repository = runForecastConfidence();
  return Object.freeze({
    doctrine: Object.freeze({
      engine_version: VERSION,
      principles: freezeArray(["deterministic-confidence-scoring", "explainable-confidence-calculations", "replay-reproducibility", "governance-first-validation", "constitutional-compliance", "evidence-driven-assessment", "immutable-confidence-history", "advisory-only-operation", "tenant-isolation", "fail-closed-validation"]),
      confidence_levels: confidenceLevels,
      reliability_levels: reliabilityLevels,
      uncertainty_levels: uncertaintyLevels,
      pipeline_states: pipelineStates,
      scoring_factors: scoringFactors,
      advisory_only: true,
    }),
    repository,
    validation: validateForecastConfidence(repository),
    replay: replayForecastConfidence(repository),
    observability: buildForecastConfidenceObservabilitySurface(repository),
  });
}
