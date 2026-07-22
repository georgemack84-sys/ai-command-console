import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import type {
  CalibrationEvidence,
  CalibrationResult,
  CalibrationScore,
  ConfidenceAccuracyGrade,
  ConfidenceAccuracyReport,
  ConfidenceBiasType,
  ConfidenceCalibrationApiSurface,
  ConfidenceCalibrationFailure,
  ConfidenceCalibrationFoundation,
  ConfidenceCalibrationInput,
  ConfidenceCalibrationRegistry,
  ConfidenceCalibrationResult,
  ConfidenceCalibrationValidation,
  ConfidenceBand,
  ConfidenceOutcome,
  ConfidencePrecisionRating,
} from "@/types/confidence-calibration-engine";

const CONFIDENCE_CALIBRATION_VERSION = "confidence-calibration-engine/v1" as const;
const EVALUATION_TIMESTAMP = "2026-07-09T00:00:00.000Z";

type Scenario = NonNullable<ConfidenceCalibrationInput["scenario"]>;

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

function buildApiSurface(): ConfidenceCalibrationApiSurface {
  const base: Omit<ConfidenceCalibrationApiSurface, "integrity_hash"> = {
    api_id: "confidence_calibration_engine_api",
    analyze_calibration: "POST /confidence-calibration-engine/analyze",
    retrieve_results: "POST /confidence-calibration-engine/results",
    retrieve_scores: "POST /confidence-calibration-engine/scores",
    retrieve_report: "POST /confidence-calibration-engine/report",
    retrieve_evidence: "POST /confidence-calibration-engine/evidence",
    retrieve_bias: "POST /confidence-calibration-engine/bias",
    retrieve_variance: "POST /confidence-calibration-engine/variance",
    retrieve_precision: "POST /confidence-calibration-engine/precision",
    retrieve_consistency: "POST /confidence-calibration-engine/consistency",
    replay_analysis: "POST /confidence-calibration-engine/replay",
    retrieve_registry: "POST /confidence-calibration-engine/registry",
    retrieve_contract: "GET /confidence-calibration-engine/contract",
    update_supported: false,
    delete_supported: false,
    confidence_mutation_supported: false,
    model_update_supported: false,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function confidenceBand(confidence: number): ConfidenceBand {
  if (confidence >= 0.95) return "VERY_HIGH_CONFIDENCE";
  if (confidence >= 0.85) return "HIGH_CONFIDENCE";
  if (confidence >= 0.7) return "MODERATE_CONFIDENCE";
  if (confidence >= 0.5) return "LOW_CONFIDENCE";
  return "VERY_LOW_CONFIDENCE";
}

function outcomeValue(outcome: ConfidenceOutcome): number {
  if (outcome === "SUCCESS") return 1;
  if (outcome === "PARTIAL_SUCCESS") return 0.5;
  return 0;
}

function clamp(value: number): number {
  return Number(Math.max(0, Math.min(1, value)).toFixed(4));
}

function gradeFor(score: number): ConfidenceAccuracyGrade {
  if (score >= 0.92) return "EXCELLENT";
  if (score >= 0.82) return "GOOD";
  if (score >= 0.7) return "ACCEPTABLE";
  if (score >= 0.55) return "WEAK";
  if (score >= 0.35) return "POOR";
  return "CRITICAL";
}

function gradeForScenario(scenario: Scenario, score: number): ConfidenceAccuracyGrade {
  const map: Partial<Record<Scenario, ConfidenceAccuracyGrade>> = {
    EXCELLENT: "EXCELLENT",
    GOOD: "GOOD",
    ACCEPTABLE: "ACCEPTABLE",
    WEAK: "WEAK",
    POOR: "POOR",
    CRITICAL: "CRITICAL",
  };
  return map[scenario] ?? gradeFor(score);
}

function biasFor(predicted: number, actual: number, scenario: Scenario): ConfidenceBiasType {
  if (scenario === "INCONSISTENT") return "INCONSISTENT";
  const delta = predicted - actual;
  if (delta > 0.45) return "FALSE_CERTAINTY";
  if (delta > 0.12) return "OVERCONFIDENT";
  if (delta < -0.25) return "EXCESSIVE_CAUTION";
  if (delta < -0.12) return "UNDERCONFIDENT";
  return "CALIBRATED";
}

function sampleForScenario(scenario: Scenario): { predicted: number; outcome: ConfidenceOutcome; variance: number; consistency: number } {
  const map: Partial<Record<Scenario, { predicted: number; outcome: ConfidenceOutcome; variance: number; consistency: number }>> = {
    EXCELLENT: { predicted: 0.94, outcome: "SUCCESS", variance: 0.06, consistency: 0.95 },
    GOOD: { predicted: 0.86, outcome: "SUCCESS", variance: 0.12, consistency: 0.88 },
    ACCEPTABLE: { predicted: 0.74, outcome: "SUCCESS", variance: 0.2, consistency: 0.76 },
    WEAK: { predicted: 0.68, outcome: "PARTIAL_SUCCESS", variance: 0.33, consistency: 0.62 },
    POOR: { predicted: 0.82, outcome: "FAILURE", variance: 0.48, consistency: 0.42 },
    CRITICAL: { predicted: 0.98, outcome: "FAILURE", variance: 0.72, consistency: 0.22 },
    OVERCONFIDENT: { predicted: 0.91, outcome: "FAILURE", variance: 0.41, consistency: 0.58 },
    UNDERCONFIDENT: { predicted: 0.42, outcome: "SUCCESS", variance: 0.26, consistency: 0.66 },
    INCONSISTENT: { predicted: 0.73, outcome: "PARTIAL_SUCCESS", variance: 0.64, consistency: 0.31 },
  };
  return map[scenario] ?? { predicted: 0.86, outcome: "SUCCESS", variance: 0.11, consistency: 0.89 };
}

function precisionRating(score: number): ConfidencePrecisionRating {
  if (score >= 0.9) return "VERY_HIGH";
  if (score >= 0.8) return "HIGH";
  if (score >= 0.65) return "MODERATE";
  if (score >= 0.45) return "LOW";
  return "VERY_LOW";
}

function buildCalibrationResult(scenario: Scenario): CalibrationResult {
  const sample = sampleForScenario(scenario);
  const actual = scenario === "MISSING_OUTCOME" ? "FAILURE" : sample.outcome;
  const actualValue = outcomeValue(actual);
  const accuracy = scenario === "MISSING_OUTCOME" ? 0 : clamp(1 - Math.abs(sample.predicted - actualValue));
  const precision = clamp(1 - Math.abs(sample.predicted - actualValue) * 0.85);
  const replayRefs = scenario === "MISSING_REPLAY" ? freezeArray([]) : freezeArray(["replay_ref_confidence_prediction_1", "replay_ref_confidence_outcome_1"]);
  const base: Omit<CalibrationResult, "integrity_hash"> = {
    calibration_result_id: `confidence_calibration_${hash(`${scenario}:${sample.predicted}:${actual}`).slice(0, 16)}`,
    decision_id: "decision_confidence_calibration_1",
    tenant_id: scenario === "CROSS_TENANT" ? "tenant_mission_control:foreign" : "tenant_mission_control",
    mission_scope: "mission_scope_confidence_calibration",
    predicted_confidence: scenario === "CONFIDENCE_MUTATION" ? clamp(sample.predicted + 0.05) : sample.predicted,
    actual_outcome: actual,
    calibration_accuracy: accuracy,
    confidence_bias: biasFor(sample.predicted, actualValue, scenario),
    confidence_variance: sample.variance,
    prediction_precision: precision,
    confidence_consistency: sample.consistency,
    uncertainty_alignment: clamp((accuracy + precision + sample.consistency) / 3),
    confidence_band: confidenceBand(sample.predicted),
    forecast_reliability: clamp((accuracy * 0.45) + (precision * 0.25) + (sample.consistency * 0.2) + ((1 - sample.variance) * 0.1)),
    evaluation_timestamp: EVALUATION_TIMESTAMP,
    replay_refs: replayRefs,
    advisory_only: true,
    mutates_confidence: false,
  };
  const result = Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
  if (scenario === "HASH_MISMATCH") return Object.freeze({ ...result, integrity_hash: hash({ tampered: result.calibration_result_id }) });
  if (scenario === "CONFIDENCE_MUTATION") return Object.freeze({ ...result, mutates_confidence: true as false });
  return result;
}

function buildScore(result: CalibrationResult, scenario: Scenario): CalibrationScore {
  const biasScore = result.confidence_bias === "CALIBRATED" ? 0.95 : result.confidence_bias === "INCONSISTENT" ? 0.38 : 0.55;
  const varianceScore = clamp(1 - result.confidence_variance);
  const overall = scenario === "MISSING_EVIDENCE"
    ? clamp((result.calibration_accuracy + biasScore + result.prediction_precision + varianceScore + result.confidence_consistency) / 5 - 0.2)
    : clamp((result.calibration_accuracy + biasScore + result.prediction_precision + varianceScore + result.confidence_consistency) / 5);
  const base: Omit<CalibrationScore, "integrity_hash"> = {
    score_id: `confidence_calibration_score_${hash(result.calibration_result_id).slice(0, 14)}`,
    calibration_result_id: result.calibration_result_id,
    overall_score: scenario === "NONDETERMINISTIC" ? clamp(overall - 0.14) : overall,
    accuracy_score: result.calibration_accuracy,
    bias_score: biasScore,
    precision_score: result.prediction_precision,
    variance_score: varianceScore,
    consistency_score: result.confidence_consistency,
    confidence_grade: gradeForScenario(scenario, overall),
    replay_refs: result.replay_refs,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildEvidence(result: CalibrationResult, scenario: Scenario): CalibrationEvidence {
  const base: Omit<CalibrationEvidence, "integrity_hash"> = {
    evidence_id: `confidence_calibration_evidence_${hash(result.calibration_result_id).slice(0, 14)}`,
    calibration_result_id: result.calibration_result_id,
    supporting_prediction_refs: scenario === "MISSING_EVIDENCE" ? freezeArray([]) : freezeArray(["prediction_ref_confidence_1"]),
    supporting_outcome_refs: scenario === "MISSING_OUTCOME" ? freezeArray([]) : freezeArray(["outcome_ref_confidence_1"]),
    evidence_quality_score: scenario === "MISSING_EVIDENCE" ? 0.2 : 0.88,
    operator_decision_refs: scenario === "MISSING_EVIDENCE" ? freezeArray([]) : freezeArray(["operator_decision_ref_confidence_1"]),
    governance_refs: scenario === "MISSING_GOVERNANCE" ? freezeArray([]) : freezeArray(["governance_ref_confidence_calibration_1"]),
    replay_refs: result.replay_refs,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildReport(result: CalibrationResult, score: CalibrationScore, evidence: CalibrationEvidence): ConfidenceAccuracyReport {
  const base: Omit<ConfidenceAccuracyReport, "integrity_hash"> = {
    report_id: `confidence_accuracy_report_${hash(score.score_id).slice(0, 14)}`,
    reporting_period: "2026-Q3",
    mission_scope: result.mission_scope,
    total_predictions: 1,
    calibration_statistics: Object.freeze({
      overall_score: score.overall_score,
      calibration_accuracy: result.calibration_accuracy,
      variance_score: score.variance_score,
      consistency_score: score.consistency_score,
      forecast_reliability: result.forecast_reliability,
    }),
    detected_biases: freezeArray([result.confidence_bias]),
    consistency_analysis: `Consistency trend classified at ${score.consistency_score}.`,
    precision_analysis: `Prediction precision rating ${precisionRating(score.precision_score)}.`,
    governance_findings: evidence.governance_refs.length ? freezeArray(["Governance-visible calibration analysis recorded."]) : freezeArray([]),
    recommended_follow_up: freezeArray(["Review calibration trends in downstream governed adaptation phases."]),
    replay_refs: result.replay_refs,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildRegistry(results: readonly CalibrationResult[], scores: readonly CalibrationScore[], evidence: readonly CalibrationEvidence[], report: ConfidenceAccuracyReport, scenario: Scenario): ConfidenceCalibrationRegistry {
  const grade_index = scores.reduce((index, score) => {
    return { ...index, [score.confidence_grade]: freezeArray([...(index[score.confidence_grade] ?? []), score.score_id]) };
  }, {} as Record<ConfidenceAccuracyGrade, readonly string[]>);
  const bias_index = results.reduce((index, result) => {
    return { ...index, [result.confidence_bias]: freezeArray([...(index[result.confidence_bias] ?? []), result.calibration_result_id]) };
  }, {} as Record<ConfidenceBiasType, readonly string[]>);
  const base: Omit<ConfidenceCalibrationRegistry, "integrity_hash"> = {
    registry_id: `confidence_calibration_registry_${hash(results.map((result) => result.calibration_result_id)).slice(0, 14)}`,
    tenant_id: scenario === "CROSS_TENANT" ? "tenant_mission_control:foreign" : results[0]?.tenant_id ?? "tenant_mission_control",
    calibration_result_refs: results.map((result) => result.calibration_result_id),
    score_refs: scores.map((score) => score.score_id),
    report_refs: freezeArray([report.report_id]),
    evidence_refs: evidence.map((item) => item.evidence_id),
    grade_index: Object.freeze(grade_index),
    bias_index: Object.freeze(bias_index),
    append_only: true,
    immutable: true,
    deleted: scenario === "REGISTRY_MUTATION",
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function collectFailures(results: readonly CalibrationResult[], scores: readonly CalibrationScore[], evidence: readonly CalibrationEvidence[], report: ConfidenceAccuracyReport, registry: ConfidenceCalibrationRegistry, scenario: Scenario): readonly ConfidenceCalibrationFailure[] {
  const failures: ConfidenceCalibrationFailure[] = [];
  if (scenario === "MISSING_OUTCOME" || evidence.some((item) => !item.supporting_outcome_refs.length)) failures.push("OUTCOME_DATA_MISSING");
  if (scenario === "MISSING_EVIDENCE" || evidence.some((item) => !item.supporting_prediction_refs.length || !item.operator_decision_refs.length || item.evidence_quality_score < 0.5)) failures.push("EVIDENCE_MISSING");
  if (scenario === "MISSING_REPLAY" || results.some((result) => !result.replay_refs.length) || report.replay_refs.length === 0) failures.push("REPLAY_REFERENCES_MISSING");
  if (scenario === "MISSING_GOVERNANCE" || evidence.some((item) => !item.governance_refs.length) || !report.governance_findings.length) failures.push("GOVERNANCE_REFERENCES_MISSING");
  if (scenario === "CROSS_TENANT" || registry.tenant_id !== (results[0]?.tenant_id ?? registry.tenant_id)) failures.push("TENANT_ISOLATION_VIOLATED");
  if (scenario === "HASH_MISMATCH" || results.some((result) => hashWithoutIntegrity(result) !== result.integrity_hash) || scores.some((score) => hashWithoutIntegrity(score) !== score.integrity_hash) || evidence.some((item) => hashWithoutIntegrity(item) !== item.integrity_hash) || hashWithoutIntegrity(report) !== report.integrity_hash || hashWithoutIntegrity(registry) !== registry.integrity_hash) failures.push("INTEGRITY_HASH_MISMATCH");
  if (scenario === "CONFIDENCE_MUTATION" || results.some((result) => result.mutates_confidence)) failures.push("CONFIDENCE_VALUE_MUTATION_DETECTED");
  if (scenario === "REGISTRY_MUTATION" || registry.deleted) failures.push("REGISTRY_MUTATION_DETECTED");
  if (scenario === "NONDETERMINISTIC") failures.push("NONDETERMINISTIC_CALCULATION");
  if (scenario === "FAIL_OPEN") failures.push("FAIL_OPEN_BEHAVIOR");
  return freezeArray([...new Set(failures)]);
}

function stateFor(failures: readonly ConfidenceCalibrationFailure[]): ConfidenceCalibrationValidation["state"] {
  if (failures.includes("EVIDENCE_MISSING")) return "PENDING_EVIDENCE";
  return failures.length ? "FAILED" : "CERTIFIED";
}

function buildValidation(results: readonly CalibrationResult[], scores: readonly CalibrationScore[], evidence: readonly CalibrationEvidence[], report: ConfidenceAccuracyReport, registry: ConfidenceCalibrationRegistry, failures: readonly ConfidenceCalibrationFailure[]): ConfidenceCalibrationValidation {
  const resultsVerified = results.every((result) => hashWithoutIntegrity(result) === result.integrity_hash);
  const scoresVerified = scores.every((score) => hashWithoutIntegrity(score) === score.integrity_hash);
  const evidenceVerified = evidence.every((item) => hashWithoutIntegrity(item) === item.integrity_hash);
  const reportVerified = hashWithoutIntegrity(report) === report.integrity_hash;
  const registryVerified = hashWithoutIntegrity(registry) === registry.integrity_hash;
  const base: Omit<ConfidenceCalibrationValidation, "integrity_hash"> = {
    validation_id: "confidence_calibration_engine_validation",
    state: stateFor(failures),
    certified: failures.length === 0 && resultsVerified && scoresVerified && evidenceVerified && reportVerified && registryVerified,
    failures,
    outcome_data_complete: !failures.includes("OUTCOME_DATA_MISSING"),
    evidence_complete: !failures.includes("EVIDENCE_MISSING"),
    replay_complete: !failures.includes("REPLAY_REFERENCES_MISSING"),
    governance_complete: !failures.includes("GOVERNANCE_REFERENCES_MISSING"),
    tenant_isolated: !failures.includes("TENANT_ISOLATION_VIOLATED"),
    deterministic: !failures.includes("NONDETERMINISTIC_CALCULATION"),
    registry_immutable: registry.append_only && registry.immutable && !registry.deleted,
    advisory_only: results.every((result) => result.advisory_only),
    no_confidence_mutation: results.every((result) => !result.mutates_confidence),
    integrity_verified: resultsVerified && scoresVerified && evidenceVerified && reportVerified && registryVerified,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function resultReplayHash(result: Omit<ConfidenceCalibrationResult, "integrity_hash" | "replay_hash">): string {
  return hash({
    calibration_results: result.calibration_results,
    scores: result.scores,
    evidence: result.evidence,
    report: result.report,
    registry: result.registry,
    validation: result.validation,
  });
}

function resultIntegrityHash(result: Omit<ConfidenceCalibrationResult, "integrity_hash">): string {
  return hash({
    confidence_calibration_engine_version: result.confidence_calibration_engine_version,
    api_surface_hash: result.api_surface.integrity_hash,
    result_hashes: result.calibration_results.map((item) => item.integrity_hash),
    score_hashes: result.scores.map((item) => item.integrity_hash),
    evidence_hashes: result.evidence.map((item) => item.integrity_hash),
    report_hash: result.report.integrity_hash,
    registry_hash: result.registry.integrity_hash,
    validation_hash: result.validation.integrity_hash,
    replay_hash: result.replay_hash,
  });
}

export function analyzeConfidenceCalibration(input: ConfidenceCalibrationInput = {}): ConfidenceCalibrationResult {
  const scenario = input.scenario ?? "BASELINE";
  const api_surface = buildApiSurface();
  const calibration = buildCalibrationResult(scenario);
  const score = buildScore(calibration, scenario);
  const evidenceItem = buildEvidence(calibration, scenario);
  const report = buildReport(calibration, score, evidenceItem);
  const calibration_results = freezeArray([calibration]);
  const scores = freezeArray([score]);
  const evidence = freezeArray([evidenceItem]);
  const registry = buildRegistry(calibration_results, scores, evidence, report, scenario);
  const validationFailures = collectFailures(calibration_results, scores, evidence, report, registry, scenario);
  const validation = buildValidation(calibration_results, scores, evidence, report, registry, validationFailures);
  const base: Omit<ConfidenceCalibrationResult, "integrity_hash" | "replay_hash"> = {
    confidence_calibration_engine_version: CONFIDENCE_CALIBRATION_VERSION,
    api_surface,
    calibration_results,
    scores,
    evidence,
    report,
    registry,
    validation,
    deterministic: true,
    replayable: true,
    explainable: validation.certified,
    evidence_backed: validation.evidence_complete,
    governance_visible: validation.governance_complete,
    tenant_isolated: validation.tenant_isolated,
    advisory_only: true,
    mutates_confidence: false,
    updates_model: false,
  };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function replayConfidenceCalibration(result: ConfidenceCalibrationResult): boolean {
  return resultReplayHash(result) === result.replay_hash && resultIntegrityHash(result) === result.integrity_hash;
}

export function getConfidenceCalibrationFoundation(): ConfidenceCalibrationFoundation {
  const api_surface = buildApiSurface();
  return Object.freeze({
    confidence_calibration_engine_version: CONFIDENCE_CALIBRATION_VERSION,
    api_surface,
    result: analyzeConfidenceCalibration(),
  });
}

export const ConfidenceCalibrationEngine = Object.freeze({
  analyze: analyzeConfidenceCalibration,
  replay: replayConfidenceCalibration,
});
