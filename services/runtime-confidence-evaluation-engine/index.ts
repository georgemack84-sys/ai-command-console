import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import { createAdaptiveRuntimeAssurance, validateAdaptiveRuntimeAssurance } from "@/services/adaptive-runtime-assurance-contract";
import type { AdaptiveAssuranceConfidenceLevel, AdaptiveRuntimeAssuranceRecord, AdaptiveTrend } from "@/types/adaptive-runtime-assurance-contract";
import type {
  RuntimeConfidenceCertification,
  RuntimeConfidenceComponent,
  RuntimeConfidenceEngineContract,
  RuntimeConfidenceFactor,
  RuntimeConfidenceFailure,
  RuntimeConfidenceHistoryEntry,
  RuntimeConfidenceInput,
  RuntimeConfidenceLifecycleStage,
  RuntimeConfidencePublisherSurface,
  RuntimeConfidenceRecord,
  RuntimeConfidenceReplayResult,
  RuntimeConfidenceScenario,
  RuntimeConfidenceValidationResult,
  RuntimeConfidenceWeightedScore,
} from "@/types/runtime-confidence-evaluation-engine";

const NOW = "2026-07-02T13:00:00.000Z";
const VERSION = "runtime-confidence-evaluation-engine/v8ALT.1B" as const;

const lifecycle: readonly RuntimeConfidenceLifecycleStage[] = Object.freeze(["COLLECT_TELEMETRY", "VALIDATE_INPUTS", "CALCULATE_SUBSYSTEM_CONFIDENCE", "NORMALIZE_SCORES", "WEIGHTED_AGGREGATION", "GENERATE_EXPLANATION", "VALIDATE_REPLAY", "STORE_RESULTS", "PUBLISH_CONFIDENCE"]);
const components: readonly RuntimeConfidenceComponent[] = Object.freeze(["EXECUTION", "PLANNING", "ORCHESTRATION", "DELEGATION", "SUPERVISION", "GOVERNANCE", "CONSTITUTIONAL"]);
const weights: Readonly<Record<RuntimeConfidenceComponent, number>> = Object.freeze({
  EXECUTION: 0.25,
  PLANNING: 0.2,
  ORCHESTRATION: 0.15,
  DELEGATION: 0.1,
  SUPERVISION: 0.1,
  GOVERNANCE: 0.1,
  CONSTITUTIONAL: 0.1,
});

const factorNames: Readonly<Record<RuntimeConfidenceComponent, readonly string[]>> = Object.freeze({
  EXECUTION: Object.freeze(["completion success", "retry rate", "rollback frequency", "execution stability"]),
  PLANNING: Object.freeze(["dependency certainty", "plan completeness", "alternative availability", "planning consistency"]),
  ORCHESTRATION: Object.freeze(["dependency satisfaction", "sequencing stability", "checkpoint quality", "workflow integrity"]),
  DELEGATION: Object.freeze(["routing confidence", "authority validation", "delegation success", "workload balance"]),
  SUPERVISION: Object.freeze(["observation quality", "intervention consistency", "anomaly coverage", "recommendation quality"]),
  GOVERNANCE: Object.freeze(["policy compliance", "authority validation", "governance evidence", "escalation correctness"]),
  CONSTITUTIONAL: Object.freeze(["constitutional validation", "boundary enforcement", "operator authority", "tenant isolation"]),
});

function hashValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function freezeArray<T>(values: readonly T[]): readonly T[] {
  return Object.freeze([...values]);
}

function unique<T extends string>(values: readonly T[]): readonly T[] {
  return freezeArray([...new Set(values)].sort());
}

function id(prefix: string, domain: string, value: unknown): string {
  return `${prefix}-${hashValue(domain, value).slice(0, 12).toUpperCase()}`;
}

function scenarioFailures(scenario: RuntimeConfidenceScenario): readonly RuntimeConfidenceFailure[] {
  const map: Partial<Record<RuntimeConfidenceScenario, RuntimeConfidenceFailure>> = {
    MISSING_TELEMETRY: "MISSING_TELEMETRY",
    CORRUPTED_OBSERVATION: "CORRUPTED_OBSERVATION",
    INVALID_CONFIDENCE_VALUE: "INVALID_CONFIDENCE_VALUE",
    STALE_RUNTIME_DATA: "STALE_RUNTIME_DATA",
    RAPID_DEGRADATION: "RAPID_CONFIDENCE_DEGRADATION",
    CONFIDENCE_OSCILLATION: "CONFIDENCE_OSCILLATION",
    UNSTABLE_SCORING: "UNSTABLE_SCORING",
    INCONSISTENT_WEIGHTING: "INCONSISTENT_WEIGHTING",
    MISSING_EVIDENCE: "MISSING_EVIDENCE",
    GOVERNANCE_UNCERTAINTY: "GOVERNANCE_UNCERTAINTY",
    CONSTITUTIONAL_UNCERTAINTY: "CONSTITUTIONAL_UNCERTAINTY",
    REPLAY_DIVERGENCE: "REPLAY_DIVERGENCE",
    TENANT_ISOLATION_FAILURE: "TENANT_ISOLATION_FAILURE",
    EXECUTION_AUTHORITY_ATTEMPT: "UNAUTHORIZED_EXECUTION_CAPABILITY",
  };
  return map[scenario] ? freezeArray([map[scenario]]) : freezeArray([]);
}

function assuranceForScenario(scenario: RuntimeConfidenceScenario): AdaptiveRuntimeAssuranceRecord {
  if (scenario === "MISSING_EVIDENCE") return createAdaptiveRuntimeAssurance({ scenario: "MISSING_EVIDENCE" });
  if (scenario === "GOVERNANCE_UNCERTAINTY") return createAdaptiveRuntimeAssurance({ scenario: "GOVERNANCE_BYPASS" });
  if (scenario === "CONSTITUTIONAL_UNCERTAINTY") return createAdaptiveRuntimeAssurance({ scenario: "CONSTITUTIONAL_VIOLATION" });
  if (scenario === "REPLAY_DIVERGENCE") return createAdaptiveRuntimeAssurance({ scenario: "REPLAY_MISMATCH" });
  if (scenario === "TENANT_ISOLATION_FAILURE") return createAdaptiveRuntimeAssurance({ scenario: "TENANT_ISOLATION_FAILURE" });
  if (scenario === "EXECUTION_AUTHORITY_ATTEMPT") return createAdaptiveRuntimeAssurance({ scenario: "EXECUTION_AUTHORITY_ATTEMPT" });
  return createAdaptiveRuntimeAssurance();
}

function scorePenalty(component: RuntimeConfidenceComponent, failures: readonly RuntimeConfidenceFailure[]): number {
  let penalty = 0;
  if (failures.includes("MISSING_TELEMETRY")) penalty += 35;
  if (failures.includes("CORRUPTED_OBSERVATION")) penalty += 40;
  if (failures.includes("INVALID_CONFIDENCE_VALUE")) penalty += 100;
  if (failures.includes("STALE_RUNTIME_DATA")) penalty += 20;
  if (failures.includes("RAPID_CONFIDENCE_DEGRADATION")) penalty += component === "EXECUTION" ? 45 : 20;
  if (failures.includes("CONFIDENCE_OSCILLATION")) penalty += 30;
  if (failures.includes("UNSTABLE_SCORING")) penalty += 35;
  if (failures.includes("MISSING_EVIDENCE")) penalty += 35;
  if (failures.includes("GOVERNANCE_UNCERTAINTY")) penalty += component === "GOVERNANCE" ? 65 : 15;
  if (failures.includes("CONSTITUTIONAL_UNCERTAINTY")) penalty += component === "CONSTITUTIONAL" ? 65 : 15;
  if (failures.includes("REPLAY_DIVERGENCE")) penalty += 45;
  if (failures.includes("TENANT_ISOLATION_FAILURE")) penalty += component === "CONSTITUTIONAL" ? 80 : 20;
  if (failures.includes("UNAUTHORIZED_EXECUTION_CAPABILITY")) penalty += 100;
  return penalty;
}

function normalizeScore(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Number(value.toFixed(4))));
}

function levelFor(score: number): AdaptiveAssuranceConfidenceLevel {
  if (score >= 90) return "VERY_HIGH";
  if (score >= 75) return "HIGH";
  if (score >= 60) return "MEDIUM";
  if (score >= 40) return "LOW";
  if (score > 0) return "VERY_LOW";
  return "INSUFFICIENT";
}

function trendFor(failures: readonly RuntimeConfidenceFailure[]): AdaptiveTrend {
  if (failures.includes("RAPID_CONFIDENCE_DEGRADATION") || failures.includes("CONFIDENCE_OSCILLATION")) return "DECLINING";
  if (failures.length === 0) return "STABLE";
  return "UNKNOWN";
}

function factor(component: RuntimeConfidenceComponent, name: string, raw: number, confidenceId: string): RuntimeConfidenceFactor {
  const source = {
    factor_id: id("RCF", "runtime-confidence-factor-id", { component, name, confidenceId }),
    component,
    name,
    raw_value: raw,
    normalized_value: normalizeScore(raw),
    evidence_reference: `evidence:${confidenceId}:${component.toLowerCase()}:${name.replace(/\s+/g, "-")}`,
  };
  return Object.freeze({ ...source, factor_hash: hashValue("runtime-confidence-factor", source) });
}

function componentScore(component: RuntimeConfidenceComponent, factors: readonly RuntimeConfidenceFactor[]): number {
  const componentFactors = factors.filter((item) => item.component === component);
  return normalizeScore(componentFactors.reduce((sum, item) => sum + item.normalized_value, 0) / componentFactors.length);
}

function weightedScore(component: RuntimeConfidenceComponent, score: number, confidenceId: string): RuntimeConfidenceWeightedScore {
  const source = {
    component,
    weight: weights[component],
    score,
    weighted_score: normalizeScore(score * weights[component]),
    confidence_level: levelFor(score),
    explanation_reference: `explanation:${confidenceId}:${component.toLowerCase()}`,
  };
  return Object.freeze({ ...source, score_hash: hashValue("runtime-confidence-weighted-score", source) });
}

function buildFactors(confidenceId: string, failures: readonly RuntimeConfidenceFailure[]): readonly RuntimeConfidenceFactor[] {
  return freezeArray(components.flatMap((component) => {
    const base = normalizeScore(98 - scorePenalty(component, failures));
    return factorNames[component].map((name, index) => factor(component, name, normalizeScore(base - index), confidenceId));
  }));
}

function buildExplanation(confidenceId: string, weighted_scores: readonly RuntimeConfidenceWeightedScore[], factors: readonly RuntimeConfidenceFactor[], failures: readonly RuntimeConfidenceFailure[], assurance: AdaptiveRuntimeAssuranceRecord) {
  const source = {
    explanation_id: id("RCE", "runtime-confidence-explanation-id", confidenceId),
    contributing_factors: freezeArray(factors.map((item) => item.factor_hash)),
    supporting_evidence: freezeArray([...assurance.evidence.map((item) => item.evidence_hash), ...factors.map((item) => item.evidence_reference)]),
    subsystem_scores: weighted_scores,
    weighting_rationale: "Governance-controlled v8ALT.1B weights: execution 25, planning 20, orchestration 15, delegation 10, supervision 10, governance 10, constitutional 10.",
    detected_risks: failures,
    governance_influences: freezeArray([assurance.governance_status, assurance.authority_validation]),
    constitutional_influences: freezeArray([assurance.constitutional_status, assurance.operator_visibility]),
    historical_comparison: failures.length === 0 ? "current confidence matches certified baseline history" : "current confidence diverges from certified baseline history",
    trend_interpretation: trendFor(failures) === "DECLINING" ? "confidence degradation requires operator awareness" : "confidence trend is deterministic and stable",
  };
  return Object.freeze({ ...source, explanation_hash: hashValue("runtime-confidence-explanation", source) });
}

function buildHistory(confidenceId: string, overall: number, weighted_scores: readonly RuntimeConfidenceWeightedScore[], evidence: readonly string[], trend: AdaptiveTrend, replay_reference: string, lineage_reference: string): readonly RuntimeConfidenceHistoryEntry[] {
  const source = {
    history_id: id("RCH", "runtime-confidence-history-id", confidenceId),
    confidence_id: confidenceId,
    evaluation_timestamp: NOW,
    overall_confidence: overall,
    subsystem_confidence: weighted_scores,
    trend_snapshot: trend,
    evidence_references: evidence,
    replay_reference,
    lineage_reference,
    integrity_hash: hashValue("runtime-confidence-history-integrity", { confidenceId, overall, weighted_scores, evidence, trend }),
    append_only: true as const,
  };
  return freezeArray([Object.freeze({ ...source, history_hash: hashValue("runtime-confidence-history", source) })]);
}

export function computeRuntimeConfidenceRecordHash(record: Omit<RuntimeConfidenceRecord, "record_hash"> | RuntimeConfidenceRecord): string {
  const { record_hash: _hash, ...source } = record as RuntimeConfidenceRecord;
  return hashValue("runtime-confidence-record", source);
}

export function evaluateRuntimeConfidence(input: RuntimeConfidenceInput = {}): RuntimeConfidenceRecord {
  const scenario = input.scenario ?? "BASELINE";
  const assurance = input.assurance ?? assuranceForScenario(scenario);
  const assuranceValidation = validateAdaptiveRuntimeAssurance(assurance);
  const confidenceId = id("RCEV", "runtime-confidence-id", { scenario, assurance: assurance.assurance_hash });
  const failures = unique([
    ...scenarioFailures(scenario),
    ...(!assuranceValidation.evidence_complete ? ["MISSING_EVIDENCE" as const] : []),
    ...(!assuranceValidation.governance_valid || !assuranceValidation.authority_valid ? ["GOVERNANCE_UNCERTAINTY" as const] : []),
    ...(!assuranceValidation.constitutional_valid ? ["CONSTITUTIONAL_UNCERTAINTY" as const] : []),
    ...(!assuranceValidation.replay_valid ? ["REPLAY_DIVERGENCE" as const] : []),
    ...(!assuranceValidation.tenant_isolated ? ["TENANT_ISOLATION_FAILURE" as const] : []),
    ...(!assuranceValidation.advisory_only ? ["UNAUTHORIZED_EXECUTION_CAPABILITY" as const] : []),
  ]);
  const factors = buildFactors(confidenceId, failures);
  const weighted_scores = freezeArray(components.map((component) => weightedScore(component, componentScore(component, factors), confidenceId)));
  const totalWeight = scenario === "INCONSISTENT_WEIGHTING" ? 0.9 : Object.values(weights).reduce((sum, item) => sum + item, 0);
  const overall = normalizeScore(weighted_scores.reduce((sum, item) => sum + item.weighted_score, 0) / totalWeight);
  const trend = trendFor(failures);
  const replay_reference = `replay:${confidenceId}:v8alt-1b`;
  const lineage_reference = `lineage:${assurance.lineage_reference.assurance_lineage_id}:${confidenceId}`;
  const evidence = scenario === "MISSING_EVIDENCE" ? freezeArray([]) : freezeArray([...assurance.evidence.map((item) => item.evidence_hash), ...factors.map((item) => item.factor_hash)]);
  const explanation = buildExplanation(confidenceId, weighted_scores, factors, failures, assurance);
  const history = buildHistory(confidenceId, overall, weighted_scores, evidence, trend, replay_reference, lineage_reference);
  const base = {
    confidence_id: confidenceId,
    tenant_id: assurance.tenant_id,
    mission_id: assurance.mission_id,
    execution_id: assurance.execution_id,
    engine_version: VERSION,
    evaluation_timestamp: NOW,
    lifecycle,
    overall_confidence: overall,
    execution_confidence: weighted_scores.find((item) => item.component === "EXECUTION")?.score ?? 0,
    planning_confidence: weighted_scores.find((item) => item.component === "PLANNING")?.score ?? 0,
    orchestration_confidence: weighted_scores.find((item) => item.component === "ORCHESTRATION")?.score ?? 0,
    delegation_confidence: weighted_scores.find((item) => item.component === "DELEGATION")?.score ?? 0,
    supervision_confidence: weighted_scores.find((item) => item.component === "SUPERVISION")?.score ?? 0,
    governance_confidence: weighted_scores.find((item) => item.component === "GOVERNANCE")?.score ?? 0,
    constitutional_confidence: weighted_scores.find((item) => item.component === "CONSTITUTIONAL")?.score ?? 0,
    confidence_level: levelFor(overall),
    trend,
    trend_velocity: trend === "DECLINING" ? -0.35 : failures.length === 0 ? 0 : -0.1,
    degradation_detected: failures.some((failure) => ["RAPID_CONFIDENCE_DEGRADATION", "CONFIDENCE_OSCILLATION", "UNSTABLE_SCORING"].includes(failure)),
    recovery_detected: false,
    confidence_factors: factors,
    weighted_scores,
    confidence_explanation: explanation,
    evidence,
    history,
    lineage_reference,
    replay_reference,
    integrity_hash: hashValue("runtime-confidence-integrity", { confidenceId, overall, weighted_scores: weighted_scores.map((item) => item.score_hash), explanation: explanation.explanation_hash, history: history.map((item) => item.history_hash), evidence }),
    advisory_only: true as const,
    execution_authorized: scenario === "EXECUTION_AUTHORITY_ATTEMPT",
    execution_modified: false,
    governance_modified: false,
  };
  return Object.freeze({ ...base, record_hash: computeRuntimeConfidenceRecordHash(base as Omit<RuntimeConfidenceRecord, "record_hash">) });
}

export function validateRuntimeConfidence(record?: RuntimeConfidenceRecord): RuntimeConfidenceValidationResult {
  if (!record) {
    const failures = freezeArray<RuntimeConfidenceFailure>(["MISSING_TELEMETRY"]);
    const source = { confidence_id: null, validation_state: "FAIL" as const, valid: false, inputs_valid: false, scores_normalized: false, weights_valid: false, evidence_complete: false, governance_valid: false, constitutional_valid: false, replay_valid: false, tenant_isolated: false, advisory_only: false, failures };
    return Object.freeze({ ...source, validation_hash: hashValue("runtime-confidence-validation", source) });
  }
  const inputs_valid = Boolean(record.confidence_id && record.tenant_id && record.mission_id && record.execution_id && record.lifecycle.length === lifecycle.length);
  const scores = [record.overall_confidence, record.execution_confidence, record.planning_confidence, record.orchestration_confidence, record.delegation_confidence, record.supervision_confidence, record.governance_confidence, record.constitutional_confidence];
  const scores_normalized = scores.every((score) => Number.isFinite(score) && score >= 0 && score <= 100);
  const weights_valid = Math.abs(record.weighted_scores.reduce((sum, item) => sum + item.weight, 0) - 1) < 0.0001;
  const evidence_complete = record.evidence.length > 0 && record.confidence_explanation.supporting_evidence.length > 0;
  const governance_valid = record.governance_confidence >= 60;
  const constitutional_valid = record.constitutional_confidence >= 60;
  const replay_valid = replayRuntimeConfidence(record).deterministic;
  const tenant_isolated = record.tenant_id.startsWith("tenant:");
  const advisory_only = record.advisory_only && !record.execution_authorized && !record.execution_modified && !record.governance_modified;
  const hash_valid = computeRuntimeConfidenceRecordHash(record) === record.record_hash;
  const failures = unique([
    ...record.confidence_explanation.detected_risks,
    ...(!inputs_valid ? ["MISSING_TELEMETRY" as const] : []),
    ...(!scores_normalized ? ["INVALID_CONFIDENCE_VALUE" as const] : []),
    ...(!weights_valid ? ["INCONSISTENT_WEIGHTING" as const] : []),
    ...(!evidence_complete ? ["MISSING_EVIDENCE" as const] : []),
    ...(!governance_valid ? ["GOVERNANCE_UNCERTAINTY" as const] : []),
    ...(!constitutional_valid ? ["CONSTITUTIONAL_UNCERTAINTY" as const] : []),
    ...(!replay_valid || !hash_valid ? ["REPLAY_DIVERGENCE" as const] : []),
    ...(!tenant_isolated ? ["TENANT_ISOLATION_FAILURE" as const] : []),
    ...(!advisory_only ? ["UNAUTHORIZED_EXECUTION_CAPABILITY" as const] : []),
    ...(record.degradation_detected ? ["RAPID_CONFIDENCE_DEGRADATION" as const] : []),
  ]);
  const valid = failures.length === 0;
  const source = { confidence_id: record.confidence_id, validation_state: valid ? "PASS" as const : "FAIL" as const, valid, inputs_valid, scores_normalized, weights_valid, evidence_complete, governance_valid, constitutional_valid, replay_valid, tenant_isolated, advisory_only, failures };
  return Object.freeze({ ...source, validation_hash: hashValue("runtime-confidence-validation", source) });
}

export function replayRuntimeConfidence(record = evaluateRuntimeConfidence()): RuntimeConfidenceReplayResult {
  const reconstructed = computeRuntimeConfidenceRecordHash(record);
  const deterministic = reconstructed === record.record_hash && record.confidence_explanation.explanation_hash === hashValue("runtime-confidence-explanation", {
    explanation_id: record.confidence_explanation.explanation_id,
    contributing_factors: record.confidence_explanation.contributing_factors,
    supporting_evidence: record.confidence_explanation.supporting_evidence,
    subsystem_scores: record.confidence_explanation.subsystem_scores,
    weighting_rationale: record.confidence_explanation.weighting_rationale,
    detected_risks: record.confidence_explanation.detected_risks,
    governance_influences: record.confidence_explanation.governance_influences,
    constitutional_influences: record.confidence_explanation.constitutional_influences,
    historical_comparison: record.confidence_explanation.historical_comparison,
    trend_interpretation: record.confidence_explanation.trend_interpretation,
  });
  const source = {
    replay_id: id("RCR", "runtime-confidence-replay-id", record.confidence_id),
    confidence_id: record.confidence_id,
    deterministic,
    reconstructed_overall_confidence: record.overall_confidence,
    reconstructed_explanation_hash: record.confidence_explanation.explanation_hash,
    reconstructed_integrity_hash: record.integrity_hash,
    replay_failures: deterministic ? freezeArray<RuntimeConfidenceFailure>([]) : freezeArray<RuntimeConfidenceFailure>(["REPLAY_DIVERGENCE"]),
  };
  return Object.freeze({ ...source, replay_hash: hashValue("runtime-confidence-replay", source) });
}

export function certifyRuntimeConfidence(record = evaluateRuntimeConfidence()): RuntimeConfidenceCertification {
  const validation = validateRuntimeConfidence(record);
  const source = {
    certification_id: id("RCC", "runtime-confidence-certification-id", record.confidence_id),
    confidence_id: record.confidence_id,
    certified: validation.valid && record.confidence_level !== "INSUFFICIENT",
    validation,
    ready_for_runtime_health_engine: validation.valid && record.overall_confidence >= 90,
  };
  return Object.freeze({ ...source, certification_hash: hashValue("runtime-confidence-certification", source) });
}

export function publishRuntimeConfidence(record = evaluateRuntimeConfidence()): RuntimeConfidencePublisherSurface {
  return Object.freeze({
    confidence_id: record.confidence_id,
    overall_confidence: record.overall_confidence,
    confidence_level: record.confidence_level,
    trend: record.trend,
    trend_velocity: record.trend_velocity,
    degradation_detected: record.degradation_detected,
    recovery_detected: record.recovery_detected,
    risks: record.confidence_explanation.detected_risks,
    weighted_scores: record.weighted_scores,
    replay_reference: record.replay_reference,
    integrity_hash: record.integrity_hash,
    advisory_only: true,
  });
}

export function getRuntimeConfidenceEvaluationEngineContract(): RuntimeConfidenceEngineContract {
  const confidence = evaluateRuntimeConfidence();
  return Object.freeze({
    doctrine: Object.freeze({
      engine_version: VERSION,
      principles: freezeArray(["deterministic", "explainable", "replayable", "governance-aware", "constitutionally-compliant", "tenant-isolated", "immutable", "certification-ready", "advisory-only"]),
      lifecycle,
      components,
      weights,
      advisory_only: true,
    }),
    confidence,
    validation: validateRuntimeConfidence(confidence),
    replay: replayRuntimeConfidence(confidence),
    certification: certifyRuntimeConfidence(confidence),
  });
}
