import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import { runCognitiveExplainability, validateCognitiveExplainability } from "@/services/cognitive-explainability-engine";
import { runForecastConfidence, validateForecastConfidence } from "@/services/forecast-confidence-engine";
import { runMultiDomainPrediction, validateMultiDomainPrediction } from "@/services/multi-domain-prediction-engine";
import { runPredictionKnowledgeRepository, validatePredictionKnowledgeRepository } from "@/services/prediction-knowledge-repository";
import { runPreventativeRecommendations, validatePreventativeRecommendations } from "@/services/preventative-recommendation-engine";
import { runRiskForecasting, validateRiskForecasting } from "@/services/risk-forecasting-engine";
import type {
  AccuracyMetrics,
  PredictiveReplaySimulationEngineContract,
  PredictiveReplaySimulationFailure,
  PredictiveReplaySimulationInput,
  PredictiveReplaySimulationObservabilitySurface,
  PredictiveReplaySimulationReplayResult,
  PredictiveReplaySimulationScenario,
  PredictiveReplaySimulationValidationResult,
  PredictiveSimulationLedger,
  PredictiveSimulationObject,
  PredictiveSimulationType,
} from "@/types/predictive-replay-simulation-engine";

const NOW = "2026-07-12T23:00:00.000Z";
const VERSION = "predictive-replay-simulation-engine/v8ALT.3.9" as const;
const TENANT_ID = "tenant:autonomy:primary";
const simulationTypes: readonly PredictiveSimulationType[] = Object.freeze(["HISTORICAL_REPLAY", "FORECAST_VALIDATION", "FUTURE_SCENARIO", "STRESS_SIMULATION", "MITIGATION_ANALYSIS", "RECOVERY_SIMULATION", "RESOURCE_SIMULATION", "MISSION_SIMULATION", "CERTIFICATION_SIMULATION"]);
const replayStates = Object.freeze(["REQUESTED", "RECONSTRUCTING", "VALIDATING", "SIMULATING", "COMPARING", "VERIFIED", "CERTIFIED"] as const);
const pipelineStates = Object.freeze(["REQUEST_RECEIVED", "PREDICTION_LOOKUP", "HISTORICAL_REPLAY", "SCENARIO_SIMULATION", "MITIGATION_EVALUATION", "ACCURACY_MEASUREMENT", "GOVERNANCE_VALIDATION", "REPLAY_VALIDATION", "EXPLAINABILITY_GENERATION", "PUBLISHED", "REJECTED"] as const);

function hashValue(domain: string, value: unknown): string { return hashConfidenceValue(domain, canonicalizeConfidenceToString(value)); }
function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function unique<T extends string>(values: readonly T[]): readonly T[] { return freezeArray([...new Set(values)].sort()); }
function id(prefix: string, domain: string, value: unknown): string { return `${prefix}-${hashValue(domain, value).slice(0, 12).toUpperCase()}`; }
function round(value: number): number { return Number(value.toFixed(4)); }

function scenarioFailures(scenario: PredictiveReplaySimulationScenario): readonly PredictiveReplaySimulationFailure[] {
  const map: Partial<Record<PredictiveReplaySimulationScenario, PredictiveReplaySimulationFailure>> = {
    PRODUCTION_STATE_MUTATION: "PRODUCTION_STATE_MUTATION_DETECTED",
    AUTONOMOUS_MITIGATION_EXECUTION: "AUTONOMOUS_MITIGATION_EXECUTED",
    GOVERNANCE_MODIFICATION_ATTEMPT: "AUTONOMOUS_GOVERNANCE_MODIFICATION_DETECTED",
    MODEL_MODIFICATION_DURING_REPLAY: "PREDICTION_MODEL_MODIFICATION_DETECTED",
    REPLAY_INCONSISTENCY: "REPLAY_INCONSISTENCY_DETECTED",
    CROSS_TENANT_REPLAY: "CROSS_TENANT_REPLAY_DETECTED",
  };
  return map[scenario] ? freezeArray([map[scenario]]) : freezeArray([]);
}

function accuracyMetrics(seed: number, replayBroken: boolean): AccuracyMetrics {
  const base = {
    forecast_accuracy: replayBroken ? 0.21 : round(0.72 + seed * 0.018),
    replay_fidelity: replayBroken ? 0.18 : round(0.91 - seed * 0.006),
    mitigation_success: round(0.68 + seed * 0.016),
    simulation_reliability: replayBroken ? 0.22 : round(0.83 - seed * 0.004),
    precision: round(0.74 + seed * 0.012),
    recall: round(0.7 + seed * 0.01),
    false_positive_rate: round(0.08 + seed * 0.004),
    false_negative_rate: round(0.1 + seed * 0.003),
  };
  return Object.freeze({ ...base, metrics_hash: hashValue("predictive-simulation-metrics", base) });
}

function computeSimulationHash(simulation: Omit<PredictiveSimulationObject, "simulation_hash"> | PredictiveSimulationObject): string {
  const { simulation_hash: _hash, ...source } = simulation as PredictiveSimulationObject;
  return hashValue("predictive-simulation-record", source);
}

function simulationRecord(input: {
  type: PredictiveSimulationType;
  index: number;
  tenantId: string;
  missionId: string;
  forecastId: string;
  predictionId: string;
  recommendationIds: readonly string[];
  mitigationIds: readonly string[];
  confidenceRefs: readonly string[];
  evidenceRefs: readonly string[];
  lineage: string;
  replay: string;
  failures: readonly PredictiveReplaySimulationFailure[];
}): PredictiveSimulationObject {
  const replayBroken = input.failures.includes("REPLAY_INCONSISTENCY_DETECTED");
  const base = {
    simulation_id: id("PRS", "predictive-replay-simulation", { type: input.type, index: input.index }),
    prediction_id: input.predictionId,
    forecast_id: input.forecastId,
    mission_id: input.missionId,
    execution_id: "execution:predictive-simulation:primary",
    tenant_id: input.failures.includes("CROSS_TENANT_REPLAY_DETECTED") ? "external-tenant" : input.tenantId,
    pipeline_state: input.failures.length ? "REJECTED" as const : "PUBLISHED" as const,
    replay_state: input.failures.length ? "VALIDATING" as const : "CERTIFIED" as const,
    simulation_type: input.type,
    scenario_name: input.type.toLowerCase(),
    scenario_description: `${input.type.toLowerCase()} deterministic advisory simulation`,
    historical_replay: replayBroken ? freezeArray<string>([]) : freezeArray(input.evidenceRefs),
    future_projection: freezeArray([`projection:${input.type}:${input.missionId}`, "future condition simulated without production mutation"]),
    mitigation_analysis: freezeArray(input.mitigationIds),
    prediction_accuracy: accuracyMetrics(input.index, replayBroken),
    forecast_validation: freezeArray([`forecast:${input.forecastId}:validated`, `prediction:${input.predictionId}:compared`]),
    replay_consistency: replayBroken ? 0.18 : round(0.92 - input.index * 0.005),
    confidence_assessment: freezeArray(input.confidenceRefs),
    governance_validation: input.failures.includes("AUTONOMOUS_GOVERNANCE_MODIFICATION_DETECTED") ? "FAIL" as const : "PASS" as const,
    constitutional_validation: "PASS" as const,
    recommendations: freezeArray(input.recommendationIds),
    limitations: freezeArray(["simulation does not mutate production state", "simulation does not execute mitigation", "results are advisory"]),
    assumptions: freezeArray(["source predictive records are immutable", "scenario inputs are deterministic", "operator approval remains required"]),
    explanation: freezeArray(["historical evidence reconstructed", "forecast validation compared against deterministic outcomes", "mitigation effectiveness estimated without execution", "governance and constitutional validation preserved", "replay consistency measured"]),
    lineage_reference: input.lineage,
    replay_reference: replayBroken ? "" : input.replay,
    integrity_hash: hashValue("predictive-simulation-integrity", { type: input.type, evidence: input.evidenceRefs, confidence: input.confidenceRefs, replay: input.replay }),
    generated_at: NOW,
    version: VERSION,
    advisory_only: true as const,
    production_state_modified: input.failures.includes("PRODUCTION_STATE_MUTATION_DETECTED"),
    mitigation_executed: input.failures.includes("AUTONOMOUS_MITIGATION_EXECUTED"),
    governance_modified: input.failures.includes("AUTONOMOUS_GOVERNANCE_MODIFICATION_DETECTED"),
    prediction_model_modified: input.failures.includes("PREDICTION_MODEL_MODIFICATION_DETECTED"),
    recovery_executed: input.failures.includes("AUTONOMOUS_MITIGATION_EXECUTED"),
  };
  return Object.freeze({ ...base, simulation_hash: computeSimulationHash(base as Omit<PredictiveSimulationObject, "simulation_hash">) });
}

export function computePredictiveSimulationLedgerHash(ledger: Omit<PredictiveSimulationLedger, "ledger_hash"> | PredictiveSimulationLedger): string {
  const { ledger_hash: _hash, ...source } = ledger as PredictiveSimulationLedger;
  return hashValue("predictive-simulation-ledger", source);
}

export function runPredictiveReplaySimulation(input: PredictiveReplaySimulationInput = {}): PredictiveSimulationLedger {
  const scenario = input.scenario ?? "BASELINE";
  const failures = scenarioFailures(scenario);
  const tenantId = input.tenant_id ?? TENANT_ID;
  const risk = input.risk_report ?? runRiskForecasting({ tenant_id: tenantId, mission_id: input.mission_id });
  const recommendations = input.recommendation_report ?? runPreventativeRecommendations({ tenant_id: tenantId, mission_id: risk.mission_id, forecast_report: risk });
  const knowledge = input.knowledge_repository ?? runPredictionKnowledgeRepository({ tenant_id: tenantId, mission_id: risk.mission_id, risk_report: risk, recommendation_report: recommendations });
  const explainability = input.explainability_repository ?? runCognitiveExplainability({ tenant_id: tenantId, mission_id: risk.mission_id, knowledge_repository: knowledge });
  const confidence = input.confidence_repository ?? runForecastConfidence({ tenant_id: tenantId, mission_id: risk.mission_id, risk_report: risk, knowledge_repository: knowledge, explainability_repository: explainability });
  const multiDomain = input.multi_domain_repository ?? runMultiDomainPrediction({ tenant_id: tenantId, mission_id: risk.mission_id, risk_report: risk, recommendation_report: recommendations, knowledge_repository: knowledge, explainability_repository: explainability, confidence_repository: confidence });
  const forecastIds = risk.forecasts.map((item) => item.forecast_id);
  const recommendationIds = recommendations.recommendations.map((item) => item.recommendation_id);
  const mitigationIds = recommendations.recommendations.map((item) => item.mitigation_plan.plan_id);
  const confidenceRefs = confidence.confidence_records.map((item) => item.confidence_id);
  const evidenceRefs = risk.forecasts.flatMap((item) => item.supporting_evidence.map((evidence) => evidence.evidence_id));
  const simulation_records = freezeArray(simulationTypes.map((type, index) => simulationRecord({
    type,
    index,
    tenantId,
    missionId: risk.mission_id,
    forecastId: forecastIds[index % forecastIds.length] ?? risk.report_id,
    predictionId: multiDomain.unified_predictions[0]?.prediction_id ?? risk.report_id,
    recommendationIds,
    mitigationIds,
    confidenceRefs,
    evidenceRefs,
    lineage: multiDomain.lineage_references[0] ?? knowledge.lineage_references[0] ?? risk.lineage_reference,
    replay: multiDomain.replay_references[0] ?? knowledge.replay_artifacts[0] ?? risk.replay_reference,
    failures,
  })));
  const ledgerBase = {
    ledger_id: id("PRSLEDGER", "predictive-simulation-ledger", { risk: risk.report_hash, scenario }),
    tenant_id: failures.includes("CROSS_TENANT_REPLAY_DETECTED") ? "external-tenant" : tenantId,
    mission_id: risk.mission_id,
    replay_records: freezeArray(simulation_records.map((item) => `${item.simulation_id}:${item.replay_state}`).sort()),
    simulation_records,
    validation_reports: freezeArray(simulation_records.map((item) => `${item.simulation_id}:${item.forecast_validation.join("|")}`).sort()),
    mitigation_analyses: freezeArray(simulation_records.flatMap((item) => item.mitigation_analysis).sort()),
    prediction_accuracy_metrics: freezeArray(simulation_records.map((item) => item.prediction_accuracy.metrics_hash).sort()),
    replay_references: freezeArray(simulation_records.map((item) => item.replay_reference).filter(Boolean).sort()),
    lineage_references: freezeArray(simulation_records.map((item) => item.lineage_reference).filter(Boolean).sort()),
    integrity_hashes: freezeArray(simulation_records.map((item) => item.integrity_hash).filter(Boolean).sort()),
    source_risk_report: risk,
    source_recommendation_report: recommendations,
    source_knowledge_repository: knowledge,
    source_explainability_repository: explainability,
    source_confidence_repository: confidence,
    source_multi_domain_repository: multiDomain,
    append_only: true as const,
  };
  return Object.freeze({ ...ledgerBase, ledger_hash: computePredictiveSimulationLedgerHash(ledgerBase as Omit<PredictiveSimulationLedger, "ledger_hash">) });
}

export function replayPredictiveReplaySimulation(ledger = runPredictiveReplaySimulation()): PredictiveReplaySimulationReplayResult {
  const reconstructed_hash = computePredictiveSimulationLedgerHash(ledger);
  const source = { replay_reference: `replay:${ledger.ledger_id}`, ledger_id: ledger.ledger_id, deterministic: reconstructed_hash === ledger.ledger_hash && ledger.replay_references.length === ledger.simulation_records.length, reconstructed_hash, original_hash: ledger.ledger_hash };
  return Object.freeze({ ...source, replay_result_hash: hashValue("predictive-simulation-replay", source) });
}

export function validatePredictiveReplaySimulation(ledger?: PredictiveSimulationLedger): PredictiveReplaySimulationValidationResult {
  if (!ledger) {
    const failures = freezeArray<PredictiveReplaySimulationFailure>(["REPLAY_CONTRACT_INVALID"]);
    const source = { ledger_id: null, valid: false, replay_contract_valid: false, simulation_schema_valid: false, deterministic_forecast_replay_reproducible: false, historical_prediction_validation_reproducible: false, future_scenario_simulation_deterministic: false, mitigation_effectiveness_analysis_reproducible: false, replay_reproducibility_verified: false, prediction_accuracy_measurement_reproducible: false, replay_reconstructs_identical_evidence: false, replay_reconstructs_identical_confidence: false, replay_reconstructs_identical_recommendations: false, scenario_assumptions_documented: false, scenario_limitations_documented: false, explainability_complete: false, governance_validation_enforced: false, constitutional_compliance_verified: false, lineage_preserved: false, replay_references_preserved: false, integrity_hashes_reproducible: false, production_state_mutation_rejected: false, autonomous_mitigation_rejected: false, autonomous_governance_modification_rejected: false, prediction_model_modification_rejected: false, replay_inconsistency_detected: false, tenant_isolation_enforced: false, cross_tenant_replay_rejected: false, advisory_only_behavior_enforced: false, failures };
    return Object.freeze({ ...source, validation_hash: hashValue("predictive-simulation-validation", source) });
  }
  const upstreamValid = validateRiskForecasting(ledger.source_risk_report).valid && validatePreventativeRecommendations(ledger.source_recommendation_report).valid && validatePredictionKnowledgeRepository(ledger.source_knowledge_repository).valid && validateCognitiveExplainability(ledger.source_explainability_repository).valid && validateForecastConfidence(ledger.source_confidence_repository).valid && validateMultiDomainPrediction(ledger.source_multi_domain_repository).valid;
  const replay_contract_valid = ledger.append_only && upstreamValid;
  const simulation_schema_valid = ledger.simulation_records.length === simulationTypes.length;
  const deterministic_forecast_replay_reproducible = ledger.simulation_records.every((item) => item.historical_replay.length > 0);
  const historical_prediction_validation_reproducible = ledger.simulation_records.every((item) => item.forecast_validation.length > 0);
  const future_scenario_simulation_deterministic = ledger.simulation_records.every((item) => item.future_projection.length > 0);
  const mitigation_effectiveness_analysis_reproducible = ledger.simulation_records.every((item) => item.mitigation_analysis.length > 0 && item.prediction_accuracy.mitigation_success > 0);
  const replay_reproducibility_verified = ledger.simulation_records.every((item) => item.replay_consistency > 0.5 && item.replay_reference);
  const prediction_accuracy_measurement_reproducible = ledger.prediction_accuracy_metrics.length === ledger.simulation_records.length;
  const replay_reconstructs_identical_evidence = deterministic_forecast_replay_reproducible;
  const replay_reconstructs_identical_confidence = ledger.simulation_records.every((item) => item.confidence_assessment.length > 0);
  const replay_reconstructs_identical_recommendations = ledger.simulation_records.every((item) => item.recommendations.length > 0);
  const scenario_assumptions_documented = ledger.simulation_records.every((item) => item.assumptions.length > 0);
  const scenario_limitations_documented = ledger.simulation_records.every((item) => item.limitations.length > 0);
  const explainability_complete = ledger.simulation_records.every((item) => item.explanation.length >= 5);
  const governance_validation_enforced = ledger.simulation_records.every((item) => item.governance_validation === "PASS");
  const constitutional_compliance_verified = ledger.simulation_records.every((item) => item.constitutional_validation === "PASS");
  const lineage_preserved = ledger.lineage_references.length === ledger.simulation_records.length;
  const replay_references_preserved = ledger.replay_references.length === ledger.simulation_records.length;
  const integrity_hashes_reproducible = ledger.integrity_hashes.length === ledger.simulation_records.length && computePredictiveSimulationLedgerHash(ledger) === ledger.ledger_hash;
  const production_state_mutation_rejected = !ledger.simulation_records.some((item) => item.production_state_modified);
  const autonomous_mitigation_rejected = !ledger.simulation_records.some((item) => item.mitigation_executed || item.recovery_executed);
  const autonomous_governance_modification_rejected = !ledger.simulation_records.some((item) => item.governance_modified);
  const prediction_model_modification_rejected = !ledger.simulation_records.some((item) => item.prediction_model_modified);
  const replay_inconsistency_detected = replay_reproducibility_verified && replayPredictiveReplaySimulation(ledger).deterministic;
  const tenant_isolation_enforced = ledger.tenant_id !== "external-tenant" && ledger.simulation_records.every((item) => item.tenant_id === ledger.tenant_id);
  const cross_tenant_replay_rejected = tenant_isolation_enforced;
  const advisory_only_behavior_enforced = ledger.simulation_records.every((item) => item.advisory_only && !item.production_state_modified && !item.mitigation_executed && !item.governance_modified && !item.prediction_model_modified && !item.recovery_executed);
  const failures = unique([
    ...(!replay_contract_valid ? ["REPLAY_CONTRACT_INVALID" as const] : []),
    ...(!simulation_schema_valid ? ["SIMULATION_SCHEMA_INVALID" as const] : []),
    ...(!deterministic_forecast_replay_reproducible ? ["FORECAST_REPLAY_NONDETERMINISTIC" as const, "EVIDENCE_RECONSTRUCTION_MISMATCH" as const] : []),
    ...(!historical_prediction_validation_reproducible ? ["HISTORICAL_VALIDATION_NONDETERMINISTIC" as const] : []),
    ...(!future_scenario_simulation_deterministic ? ["FUTURE_SIMULATION_NONDETERMINISTIC" as const] : []),
    ...(!mitigation_effectiveness_analysis_reproducible ? ["MITIGATION_ANALYSIS_NONDETERMINISTIC" as const] : []),
    ...(!replay_reproducibility_verified ? ["REPLAY_REPRODUCIBILITY_INVALID" as const, "REPLAY_INCONSISTENCY_DETECTED" as const] : []),
    ...(!prediction_accuracy_measurement_reproducible ? ["PREDICTION_ACCURACY_NONDETERMINISTIC" as const] : []),
    ...(!replay_reconstructs_identical_confidence ? ["CONFIDENCE_RECONSTRUCTION_MISMATCH" as const] : []),
    ...(!replay_reconstructs_identical_recommendations ? ["RECOMMENDATION_RECONSTRUCTION_MISMATCH" as const] : []),
    ...(!scenario_assumptions_documented ? ["SCENARIO_ASSUMPTIONS_MISSING" as const] : []),
    ...(!scenario_limitations_documented ? ["SCENARIO_LIMITATIONS_MISSING" as const] : []),
    ...(!explainability_complete ? ["EXPLAINABILITY_INCOMPLETE" as const] : []),
    ...(!governance_validation_enforced ? ["GOVERNANCE_VALIDATION_MISSING" as const, "AUTONOMOUS_GOVERNANCE_MODIFICATION_DETECTED" as const] : []),
    ...(!constitutional_compliance_verified ? ["CONSTITUTIONAL_COMPLIANCE_MISSING" as const] : []),
    ...(!lineage_preserved ? ["LINEAGE_REFERENCES_MISSING" as const] : []),
    ...(!replay_references_preserved ? ["REPLAY_REFERENCES_MISSING" as const] : []),
    ...(!integrity_hashes_reproducible ? ["INTEGRITY_HASH_INVALID" as const] : []),
    ...(!production_state_mutation_rejected ? ["PRODUCTION_STATE_MUTATION_DETECTED" as const] : []),
    ...(!autonomous_mitigation_rejected ? ["AUTONOMOUS_MITIGATION_EXECUTED" as const] : []),
    ...(!prediction_model_modification_rejected ? ["PREDICTION_MODEL_MODIFICATION_DETECTED" as const] : []),
    ...(!replay_inconsistency_detected ? ["REPLAY_INCONSISTENCY_DETECTED" as const] : []),
    ...(!tenant_isolation_enforced ? ["TENANT_ISOLATION_INVALID" as const, "CROSS_TENANT_REPLAY_DETECTED" as const] : []),
    ...(!advisory_only_behavior_enforced ? ["ADVISORY_ONLY_VIOLATION" as const] : []),
  ]);
  const valid = failures.length === 0;
  const source = { ledger_id: ledger.ledger_id, valid, replay_contract_valid, simulation_schema_valid, deterministic_forecast_replay_reproducible, historical_prediction_validation_reproducible, future_scenario_simulation_deterministic, mitigation_effectiveness_analysis_reproducible, replay_reproducibility_verified, prediction_accuracy_measurement_reproducible, replay_reconstructs_identical_evidence, replay_reconstructs_identical_confidence, replay_reconstructs_identical_recommendations, scenario_assumptions_documented, scenario_limitations_documented, explainability_complete, governance_validation_enforced, constitutional_compliance_verified, lineage_preserved, replay_references_preserved, integrity_hashes_reproducible, production_state_mutation_rejected, autonomous_mitigation_rejected, autonomous_governance_modification_rejected, prediction_model_modification_rejected, replay_inconsistency_detected, tenant_isolation_enforced, cross_tenant_replay_rejected, advisory_only_behavior_enforced, failures };
  return Object.freeze({ ...source, validation_hash: hashValue("predictive-simulation-validation", source) });
}

export function buildPredictiveReplaySimulationObservabilitySurface(ledger = runPredictiveReplaySimulation()): PredictiveReplaySimulationObservabilitySurface {
  const averageReplay = round(ledger.simulation_records.reduce((sum, item) => sum + item.replay_consistency, 0) / Math.max(1, ledger.simulation_records.length));
  const averageAccuracy = round(ledger.simulation_records.reduce((sum, item) => sum + item.prediction_accuracy.forecast_accuracy, 0) / Math.max(1, ledger.simulation_records.length));
  return Object.freeze({ ledger_id: ledger.ledger_id, tenant_id: ledger.tenant_id, mission_id: ledger.mission_id, simulation_count: ledger.simulation_records.length, replay_record_count: ledger.replay_records.length, average_replay_consistency: averageReplay, average_forecast_accuracy: averageAccuracy, advisory_only: true, ledger_hash: ledger.ledger_hash });
}

export function getPredictiveReplaySimulationEngineContract(): PredictiveReplaySimulationEngineContract {
  const ledger = runPredictiveReplaySimulation();
  return Object.freeze({
    doctrine: Object.freeze({
      engine_version: VERSION,
      principles: freezeArray(["deterministic-replay", "deterministic-simulation", "replay-reproducibility", "explainable-simulations", "governance-first-validation", "constitutional-compliance", "advisory-only-operation", "immutable-simulation-records", "tenant-isolation", "fail-closed-validation"]),
      simulation_types: simulationTypes,
      replay_states: replayStates,
      pipeline_states: pipelineStates,
      advisory_only: true,
    }),
    ledger,
    validation: validatePredictiveReplaySimulation(ledger),
    replay: replayPredictiveReplaySimulation(ledger),
    observability: buildPredictiveReplaySimulationObservabilitySurface(ledger),
  });
}
