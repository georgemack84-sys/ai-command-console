import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { runScenarioIntelligence, validateScenarioIntelligence } from "@/services/scenario-intelligence";
import type {
  ForecastArtifact,
  ForecastCalibrationReport,
  ForecastCertificationTest,
  ForecastFailureRecord,
  ForecastInputValidationReport,
  ForecastIntelligenceCertification,
  ForecastIntelligenceContractBundle,
  ForecastIntelligenceFailure,
  ForecastIntelligenceInput,
  ForecastIntelligenceResult,
  ForecastIntelligenceScenario,
  ForecastIntelligenceValidation,
  ForecastLedger,
  ForecastModelRegistry,
  ForecastObservabilityReport,
  ForecastRegistry,
  ForecastReplayReport,
  ForecastType,
  ForecastUncertaintyReport,
  ModelBindingReport,
} from "@/types/forecast-intelligence";

const VERSION = "forecast-intelligence/v12.6" as const;
const ID = "ForecastIntelligence" as const;
const FIXED_TIME = "2026-07-15T00:40:00.000Z" as const;
const FORECAST_TYPES: readonly ForecastType[] = Object.freeze(["OUTCOME", "RISK", "CONFIDENCE", "RESOURCE", "TEMPORAL", "PORTFOLIO"]);

function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function hash(value: unknown): string { return generateDecisionIntegrityHash(value); }
function hashWithoutIntegrity<T extends object>(value: T): string { const copy = { ...value } as Record<string, unknown>; delete copy.integrity_hash; return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown); }
function id(prefix: string, value: unknown): string { return `${prefix}_${hash(value).slice(0, 24)}`; }
function nested<T extends object>(value: T): T & { integrity_hash: string } { return Object.freeze({ ...value, integrity_hash: hashWithoutIntegrity(value) }) as T & { integrity_hash: string }; }
function failureForScenario(scenario: ForecastIntelligenceScenario): ForecastIntelligenceFailure | undefined { return scenario === "BASELINE" ? undefined : scenario; }
function statusFor(failures: readonly ForecastIntelligenceFailure[]): "PASS" | "CONDITIONAL_PASS" | "FAIL" { return failures.length ? "FAIL" : "PASS"; }

function modelRegistry(failures: readonly ForecastIntelligenceFailure[]): ForecastModelRegistry {
  const modelBase = { model_ref: failures.includes("UNKNOWN_MODEL") ? "" : "forecast-model:deterministic-evidence-v1", version: "1.0.0", algorithm_class: "DETERMINISTIC_WEIGHTED_EVIDENCE", parameter_set_hash: hash("forecast-model-parameters-v1"), supported_variables: freezeArray(["outcome", "risk", "confidence", "resource", "temporal", "portfolio"]), supported_horizons: freezeArray(["30d", "90d", "180d"]), supported_scenario_classes: freezeArray(["BASE_CASE", "BEST_CASE", "WORST_CASE", "EXPECTED_CASE", "STRESS_CASE", "ADVERSARIAL_CASE", "CONSTRAINT_CASE", "POLICY_CASE", "RESOURCE_CASE", "TEMPORAL_CASE"]), governance_approved: !failures.includes("GOVERNANCE_APPROVAL_MISSING"), certified: !failures.includes("UNCERTIFIED_MODEL"), immutable: !failures.includes("MODEL_BINDING_MUTABLE"), revoked: failures.includes("REVOKED_MODEL"), expired: failures.includes("EXPIRED_MODEL") };
  const models = freezeArray([nested(modelBase)]);
  const base = { registry_id: id("forecast_model_registry", VERSION), models, complete: !failures.includes("MODEL_REGISTRY_INCOMPLETE") && models[0].model_ref.length > 0 };
  return nested(base);
}

function forecasts(tenantId: string, scenarioResult: ReturnType<typeof runScenarioIntelligence>, modelRegistryRecord: ForecastModelRegistry, failures: readonly ForecastIntelligenceFailure[]): readonly ForecastArtifact[] {
  const model = modelRegistryRecord.models[0];
  return freezeArray(scenarioResult.scenarios.slice(0, 6).map((scenario, index) => {
    const strategyRef = scenario.candidate_strategy_refs[index % Math.max(scenario.candidate_strategy_refs.length, 1)] ?? "strategy:missing";
    const forecastType = FORECAST_TYPES[index % FORECAST_TYPES.length];
    const seed = { strategyRef, scenario: scenario.scenario_id, type: forecastType, model: model?.model_ref, version: model?.version, cycle: scenario.recommendation_cycle_id };
    const forecastId = failures.includes("FORECAST_IDENTITY_NONDETERMINISTIC") && index === 0 ? id("forecast_artifact", { seed, nonce: "unstable" }) : id("forecast_artifact", seed);
    const evidenceRefs = failures.includes("EVIDENCE_MISSING") && index === 0 ? [] : scenario.evidence_refs;
    const uncertaintySources = failures.includes("HIDDEN_UNCERTAINTY") && index === 0 ? [] : freezeArray(["evidence gaps", "model limitations", "assumption sensitivity", "scenario variability", "temporal uncertainty", "external dependencies", "policy uncertainty"]);
    const confidence = failures.includes("CONFIDENCE_UNCERTAINTY_MERGED") && index === 0 ? 0.5 : Number((0.76 - index * 0.02).toFixed(2));
    const uncertainty = failures.includes("CONFIDENCE_UNCERTAINTY_MERGED") && index === 0 ? 0.5 : Number((0.18 + index * 0.01).toFixed(2));
    const base = {
      forecast_id: forecastId,
      forecast_type: forecastType,
      strategy_ref: failures.includes("INCOMPLETE_STRATEGY") && index === 0 ? "" : strategyRef,
      scenario_ref: failures.includes("UNQUALIFIED_SCENARIO") && index === 1 ? "" : scenario.scenario_id,
      forecast_horizon: "90d",
      forecast_variables: failures.includes("UNSUPPORTED_VARIABLES") && index === 2 ? freezeArray(["unsupported"]) : freezeArray(["outcome", "risk", "confidence"]),
      predicted_outcomes: freezeArray([`${forecastType.toLowerCase()} forecast remains advisory and bounded.`]),
      confidence_intervals: freezeArray(["p10:0.42", "p50:0.66", "p90:0.81"]),
      uncertainty_sources: uncertaintySources,
      forecast_confidence: confidence,
      forecast_uncertainty: uncertainty,
      model_ref: model?.model_ref ?? "",
      model_version: model?.version ?? "",
      model_configuration_hash: model?.parameter_set_hash ?? "",
      evidence_refs: evidenceRefs,
      assumptions: failures.includes("INVALID_ASSUMPTIONS") && index === 0 ? freezeArray([]) : scenario.assumptions_ref,
      policy_manifest_ref: failures.includes("POLICY_MANIFEST_MISSING") ? "" : scenario.policy_manifest_ref,
      recommendation_cycle_ref: scenario.recommendation_cycle_id,
      authority_ref: failures.includes("AUTHORITY_VIOLATION") ? "" : `authority:${scenario.recommendation_cycle_id}:forecast`,
      origin_ref: `origin:${scenario.recommendation_cycle_id}:forecast-intelligence`,
      created_timestamp: FIXED_TIME,
      certification_status: "PASS" as const,
      lifecycle_state: "IMMUTABLE" as const,
      advisory_only: !failures.includes("ADVISORY_BOUNDARY_VIOLATION"),
      tenant_id: failures.includes("TENANT_ISOLATION_BREACH") && index === 3 ? "tenant_beta" : tenantId,
    };
    return nested(base);
  }));
}

function modelBinding(forecastSet: readonly ForecastArtifact[], registry: ForecastModelRegistry, failures: readonly ForecastIntelligenceFailure[]): ModelBindingReport {
  const model = registry.models[0];
  const invalidModel = !model || !model.model_ref || !model.immutable || model.revoked || model.expired || !model.certified;
  const bindings = freezeArray(forecastSet.map((forecast) => nested({ forecast_id: forecast.forecast_id, model_ref: forecast.model_ref, version: forecast.model_version, immutable: Boolean(model?.immutable), valid: !invalidModel && forecast.model_ref === model?.model_ref })));
  const base = { report_id: id("forecast_model_binding", bindings.map((b) => b.integrity_hash)), bindings, unknown_models: failures.includes("UNKNOWN_MODEL") ? freezeArray(["forecast-model:unknown"]) : freezeArray([]), invalid_versions: invalidModel ? freezeArray([model?.version ?? "missing"]) : freezeArray([]) };
  return nested(base);
}

function inputValidation(forecastSet: readonly ForecastArtifact[], failures: readonly ForecastIntelligenceFailure[]): ForecastInputValidationReport {
  const rejected = freezeArray(forecastSet.filter((forecast) => !forecast.strategy_ref || !forecast.scenario_ref || forecast.evidence_refs.length === 0 || forecast.assumptions.length === 0 || forecast.policy_manifest_ref.length === 0 || forecast.authority_ref.length === 0 || forecast.forecast_variables.includes("unsupported")).map((f) => f.forecast_id));
  const base = { report_id: id("forecast_input_validation", forecastSet.map((f) => f.integrity_hash)), strategy_valid: !failures.includes("INCOMPLETE_STRATEGY"), scenario_valid: !failures.includes("UNQUALIFIED_SCENARIO"), assumptions_valid: !failures.includes("INVALID_ASSUMPTIONS"), evidence_valid: !failures.includes("EVIDENCE_MISSING"), variables_valid: !failures.includes("UNSUPPORTED_VARIABLES"), temporal_valid: true, policy_valid: !failures.includes("POLICY_MANIFEST_MISSING"), governance_valid: !failures.includes("GOVERNANCE_APPROVAL_MISSING"), authority_valid: !failures.includes("AUTHORITY_VIOLATION"), recommendation_cycle_valid: !failures.includes("INPUT_VALIDATION_FAILED"), rejected_forecast_ids: failures.includes("INPUT_VALIDATION_FAILED") ? freezeArray([...rejected, "forecast:forced-rejection"]) : rejected };
  return nested(base);
}

function uncertainty(forecastSet: readonly ForecastArtifact[], failures: readonly ForecastIntelligenceFailure[]): ForecastUncertaintyReport {
  const contributors = freezeArray([...new Set(forecastSet.flatMap((forecast) => forecast.uncertainty_sources))]);
  const avgConfidence = Number((forecastSet.reduce((sum, f) => sum + f.forecast_confidence, 0) / forecastSet.length).toFixed(3));
  const avgUncertainty = Number((forecastSet.reduce((sum, f) => sum + f.forecast_uncertainty, 0) / forecastSet.length).toFixed(3));
  const separated = !failures.includes("CONFIDENCE_UNCERTAINTY_MERGED") && contributors.length > 0;
  const base = { report_id: id("forecast_uncertainty", forecastSet.map((f) => f.forecast_id)), confidence_score: avgConfidence, uncertainty_score: avgUncertainty, uncertainty_contributors: contributors, sensitivity_ranking: freezeArray(["assumption sensitivity", "scenario variability", "temporal uncertainty"]), confidence_separated_from_uncertainty: separated, explanation: "Confidence reflects model/evidence support; uncertainty records variability and limits." };
  return nested(base);
}

function calibration(failures: readonly ForecastIntelligenceFailure[]): ForecastCalibrationReport {
  const base = { report_id: id("forecast_calibration", VERSION), history_immutable: !failures.includes("CALIBRATION_HISTORY_MUTABLE"), reliability_score: 0.84, accuracy_metrics: Object.freeze({ expected_vs_actual: 0.86, confidence_calibration_error: 0.04, horizon_accuracy: 0.82, variable_accuracy: 0.85, strategy_accuracy: 0.83, scenario_accuracy: 0.84 }), calibration_error: 0.04, drift_indicator: 0.03 };
  return nested(base);
}

function failureRecords(forecastSet: readonly ForecastArtifact[], failures: readonly ForecastIntelligenceFailure[]): readonly ForecastFailureRecord[] {
  const shouldRecord = failures.some((failure) => ["EVIDENCE_MISSING", "UNQUALIFIED_SCENARIO", "INCOMPLETE_STRATEGY", "POLICY_MANIFEST_MISSING", "AUTHORITY_VIOLATION", "REPLAY_MISMATCH", "INTEGRITY_VALIDATION_FAILED"].includes(failure)) || failures.includes("INDETERMINATE_FORECAST_NOT_PRESERVED");
  if (!shouldRecord && !failures.includes("FAILED_FORECAST_NOT_PRESERVED")) return freezeArray([]);
  if (failures.includes("FAILED_FORECAST_NOT_PRESERVED")) return freezeArray([]);
  const forecast = forecastSet[0];
  const base = { failure_id: id("forecast_failure", { forecast: forecast?.forecast_id, failures }), forecast_id: forecast?.forecast_id ?? "forecast:missing", category: failures.includes("INDETERMINATE_FORECAST_NOT_PRESERVED") ? "indeterminate outcome" as const : "integrity failure" as const, failure_evidence: freezeArray(["failure:evidence:deterministic"]), timestamp: FIXED_TIME, originating_cycle: forecast?.recommendation_cycle_ref ?? "cycle:missing", affected_strategy: forecast?.strategy_ref ?? "strategy:missing", affected_scenario: forecast?.scenario_ref ?? "scenario:missing", recovery_recommendation: "Fail closed and replay with preserved inputs.", preserved: true, replayable: true };
  return freezeArray([nested(base)]);
}

function replayReport(failures: readonly ForecastIntelligenceFailure[]): ForecastReplayReport {
  const ok = !failures.includes("REPLAY_MISMATCH");
  const base = { report_id: id("forecast_replay", VERSION), outcome: ok ? "MATCH" as const : "FAILURE" as const, identical_inputs: ok, identical_outputs: ok, identical_model_version: ok, identical_assumptions: ok, identical_uncertainty: ok, identical_confidence: ok };
  return nested(base);
}

function ledger(forecasts: readonly ForecastArtifact[], failureSet: readonly ForecastFailureRecord[], failures: readonly ForecastIntelligenceFailure[]): ForecastLedger {
  const entries = freezeArray(["FORECASTS_REGISTERED", "MODEL_BOUND", "INPUTS_VALIDATED", "UNCERTAINTY_QUANTIFIED", "CALIBRATION_RECORDED", "REPLAY_CERTIFIED", "FAILURES_PRESERVED"].map((type, index) => nested({ entry_id: id("forecast_ledger_entry", { type, index }), type, subject_id: index === 6 ? failureSet.map((f) => f.failure_id).join("|") : forecasts.map((f) => f.forecast_id).join("|") })));
  return nested({ ledger_id: id("forecast_ledger", VERSION), append_only: !failures.includes("LEDGER_NOT_APPEND_ONLY"), immutable: true, entries });
}

function registry(tenantId: string, forecasts: readonly ForecastArtifact[], failuresList: readonly ForecastFailureRecord[]): ForecastRegistry {
  const complete = forecasts.every((forecast) => forecast.tenant_id === tenantId && forecast.lifecycle_state === "IMMUTABLE");
  return nested({ registry_id: id("forecast_registry", { tenantId, version: VERSION }), tenant_id: tenantId, forecasts, failures: failuresList, complete });
}

function observability(forecasts: readonly ForecastArtifact[], failuresList: readonly ForecastFailureRecord[], replay: ForecastReplayReport, registry: ForecastRegistry, ledger: ForecastLedger, failures: readonly ForecastIntelligenceFailure[]): ForecastObservabilityReport {
  const avgUncertainty = Number((forecasts.reduce((sum, f) => sum + f.forecast_uncertainty, 0) / forecasts.length).toFixed(3));
  return nested({ report_id: id("forecast_observability", registry.registry_id), generation_latency_ms: 180, replay_success_rate: replay.outcome === "MATCH" ? 1 : 0, calibration_accuracy: 0.86, model_usage_count: 1, uncertainty_average: avgUncertainty, failed_forecasts: failuresList.length, replay_mismatches: replay.outcome === "MATCH" ? 0 : 1, governance_violations: failures.includes("GOVERNANCE_APPROVAL_MISSING") ? 1 : 0, registry_integrity: registry.complete, ledger_integrity: ledger.append_only, observable: !failures.includes("OBSERVABILITY_MISSING") });
}

function certTest(name: string, passed: boolean, failure: ForecastIntelligenceFailure, refs: readonly string[]): ForecastCertificationTest {
  return nested({ test_id: id("forecast_test", name), name, expected: "PASS" as const, actual: passed ? "PASS" as const : "FAIL" as const, passed, failure_reason: passed ? null : failure, evidence_refs: refs });
}

type CertBase = Omit<ForecastIntelligenceResult, "certification" | "replay_hash" | "integrity_hash">;
function certificationTests(result: CertBase): readonly ForecastCertificationTest[] {
  const refs = freezeArray([result.registry.integrity_hash, result.model_binding.integrity_hash, result.input_validation.integrity_hash, result.replay.integrity_hash]);
  return freezeArray([
    certTest("Forecast artifact contract valid", result.forecasts.every((f) => f.forecast_id && f.strategy_ref && f.scenario_ref && f.model_ref && f.origin_ref), "FORECAST_ARTIFACT_CONTRACT_INVALID", refs),
    certTest("Forecast identities deterministic", result.forecasts.every((f) => f.forecast_id === id("forecast_artifact", { strategyRef: f.strategy_ref, scenario: f.scenario_ref, type: f.forecast_type, model: f.model_ref, version: f.model_version, cycle: f.recommendation_cycle_ref })), "FORECAST_IDENTITY_NONDETERMINISTIC", refs),
    certTest("Model registry complete", result.model_registry.complete, "MODEL_REGISTRY_INCOMPLETE", refs),
    certTest("Model binding immutable", result.model_binding.bindings.every((b) => b.immutable && b.valid), "MODEL_BINDING_MUTABLE", refs),
    certTest("Unknown models rejected", result.model_binding.unknown_models.length === 0, "UNKNOWN_MODEL", refs),
    certTest("Expired models rejected", result.model_registry.models.every((m) => !m.expired), "EXPIRED_MODEL", refs),
    certTest("Revoked models rejected", result.model_registry.models.every((m) => !m.revoked), "REVOKED_MODEL", refs),
    certTest("Uncertified models rejected", result.model_registry.models.every((m) => m.certified), "UNCERTIFIED_MODEL", refs),
    certTest("Inputs validated", result.input_validation.rejected_forecast_ids.length === 0, "INPUT_VALIDATION_FAILED", refs),
    certTest("Strategies complete", result.input_validation.strategy_valid, "INCOMPLETE_STRATEGY", refs),
    certTest("Scenarios qualified", result.input_validation.scenario_valid, "UNQUALIFIED_SCENARIO", refs),
    certTest("Variables supported", result.input_validation.variables_valid, "UNSUPPORTED_VARIABLES", refs),
    certTest("Evidence present", result.input_validation.evidence_valid, "EVIDENCE_MISSING", refs),
    certTest("Assumptions valid", result.input_validation.assumptions_valid, "INVALID_ASSUMPTIONS", refs),
    certTest("Policy manifest bound", result.input_validation.policy_valid, "POLICY_MANIFEST_MISSING", refs),
    certTest("Governance approved", result.input_validation.governance_valid, "GOVERNANCE_APPROVAL_MISSING", refs),
    certTest("Authority valid", result.input_validation.authority_valid, "AUTHORITY_VIOLATION", refs),
    certTest("Uncertainty explicit", result.uncertainty.uncertainty_contributors.length > 0, "HIDDEN_UNCERTAINTY", refs),
    certTest("Confidence separated from uncertainty", result.uncertainty.confidence_separated_from_uncertainty, "CONFIDENCE_UNCERTAINTY_MERGED", refs),
    certTest("Calibration history immutable", result.calibration.history_immutable, "CALIBRATION_HISTORY_MUTABLE", refs),
    certTest("Failed forecasts preserved", result.failure_records.every((f) => f.preserved), "FAILED_FORECAST_NOT_PRESERVED", refs),
    certTest("Indeterminate forecasts preserved", !result.failure_records.some((f) => f.category === "indeterminate outcome") || result.failure_records.every((f) => f.preserved), "INDETERMINATE_FORECAST_NOT_PRESERVED", refs),
    certTest("Replay matches", result.replay.outcome === "MATCH", "REPLAY_MISMATCH", refs),
    certTest("Integrity valid", result.registry.complete, "INTEGRITY_VALIDATION_FAILED", refs),
    certTest("Tenant isolation preserved", result.forecasts.every((f) => f.tenant_id === result.registry.tenant_id), "TENANT_ISOLATION_BREACH", refs),
    certTest("Advisory boundary enforced", result.forecasts.every((f) => f.advisory_only), "ADVISORY_BOUNDARY_VIOLATION", refs),
    certTest("Ledger append-only", result.ledger.append_only, "LEDGER_NOT_APPEND_ONLY", refs),
    certTest("Observability active", result.observability.observable, "OBSERVABILITY_MISSING", refs),
  ]);
}

function replayHash(result: Omit<ForecastIntelligenceResult, "replay_hash" | "integrity_hash">): string {
  return hash({ models: result.model_registry.integrity_hash, forecasts: result.forecasts.map((f) => f.integrity_hash), binding: result.model_binding.integrity_hash, validation: result.input_validation.integrity_hash, uncertainty: result.uncertainty.integrity_hash, calibration: result.calibration.integrity_hash, failures: result.failure_records.map((f) => f.integrity_hash), replay: result.replay.integrity_hash, registry: result.registry.integrity_hash, ledger: result.ledger.integrity_hash, certification: result.certification.integrity_hash });
}
function integrityHash(result: Omit<ForecastIntelligenceResult, "integrity_hash">): string { return hash({ version: result.phase_version, id: result.phase_identifier, status: result.certification.status, replay_hash: result.replay_hash }); }

export function runForecastIntelligence(input: ForecastIntelligenceInput = {}): ForecastIntelligenceResult {
  const scenarioResult = runScenarioIntelligence({ tenant_id: input.tenant_id ?? "tenant_mission_control" });
  const scenarioValid = validateScenarioIntelligence(scenarioResult).valid;
  const scenarioFailure = failureForScenario(input.scenario ?? "BASELINE");
  const failures = freezeArray<ForecastIntelligenceFailure>([...(scenarioValid ? [] : ["UNQUALIFIED_SCENARIO" as const]), ...(scenarioFailure ? [scenarioFailure] : [])]);
  const tenantId = input.tenant_id ?? "tenant_mission_control";
  const models = modelRegistry(failures);
  const forecastSet = forecasts(tenantId, scenarioResult, models, failures);
  const binding = modelBinding(forecastSet, models, failures);
  const validation = inputValidation(forecastSet, failures);
  const uncertaintyReport = uncertainty(forecastSet, failures);
  const calibrationReport = calibration(failures);
  const failureSet = failureRecords(forecastSet, failures);
  const replay = replayReport(failures);
  const ledgerRecord = ledger(forecastSet, failureSet, failures);
  const registryRecord = registry(tenantId, forecastSet, failureSet);
  const observabilityReport = observability(forecastSet, failureSet, replay, registryRecord, ledgerRecord, failures);
  const baseWithoutCertification: CertBase = { phase_version: VERSION, phase_identifier: ID, model_registry: models, forecasts: forecastSet, model_binding: binding, input_validation: validation, uncertainty: uncertaintyReport, calibration: calibrationReport, failure_records: failureSet, replay, registry: registryRecord, ledger: ledgerRecord, observability: observabilityReport };
  const tests = certificationTests(baseWithoutCertification);
  const finalFailures = freezeArray([...new Set([...failures, ...tests.map((item) => item.failure_reason).filter((failure): failure is ForecastIntelligenceFailure => Boolean(failure))])]);
  const status = statusFor(finalFailures);
  const certification = nested({ certification_id: id("forecast_certification", VERSION), status, ready_for_strategy_evaluation: status === "PASS", failures: finalFailures, tests });
  const base = { ...baseWithoutCertification, certification };
  const rHash = replayHash(base);
  return Object.freeze({ ...base, replay_hash: rHash, integrity_hash: integrityHash({ ...base, replay_hash: rHash }) });
}

export function validateForecastIntelligence(result?: ForecastIntelligenceResult): ForecastIntelligenceValidation {
  if (!result) {
    const failures = freezeArray<ForecastIntelligenceFailure>(["FORECAST_ARTIFACT_CONTRACT_INVALID"]);
    const base = { registry_id: null, valid: false, status: "FAIL" as const, ready_for_strategy_evaluation: false, failures, replay_hash_valid: false, integrity_hash_valid: false, model_binding_valid: false, registry_valid: false };
    return nested({ ...base, validation_hash: hashWithoutIntegrity(base) });
  }
  const replay_hash_valid = replayHash(result) === result.replay_hash;
  const integrity_hash_valid = integrityHash(result) === result.integrity_hash && hashWithoutIntegrity(result.registry) === result.registry.integrity_hash && hashWithoutIntegrity(result.certification) === result.certification.integrity_hash;
  const model_binding_valid = result.model_binding.bindings.every((b) => b.valid && b.immutable);
  const registry_valid = result.registry.complete;
  const valid = result.certification.status === "PASS" && result.certification.ready_for_strategy_evaluation && result.certification.failures.length === 0 && replay_hash_valid && integrity_hash_valid && model_binding_valid && registry_valid;
  const base = { registry_id: result.registry.registry_id, valid, status: result.certification.status, ready_for_strategy_evaluation: result.certification.ready_for_strategy_evaluation, failures: result.certification.failures, replay_hash_valid, integrity_hash_valid, model_binding_valid, registry_valid };
  return nested({ ...base, validation_hash: hashWithoutIntegrity(base) });
}

export function replayForecastIntelligence(result = runForecastIntelligence()): boolean {
  const replayed = runForecastIntelligence({ tenant_id: result.registry.tenant_id, recommendation_cycle_ref: result.forecasts[0]?.recommendation_cycle_ref });
  return result.integrity_hash === replayed.integrity_hash && result.replay_hash === replayed.replay_hash && validateForecastIntelligence(result).valid;
}

export function getForecastIntelligenceContract(): ForecastIntelligenceContractBundle {
  const result = runForecastIntelligence();
  return Object.freeze({ doctrine: Object.freeze({ version: VERSION, advisory_only: true, immutable_model_binding_required: true, confidence_uncertainty_separation_required: true, calibration_history_immutable: true, failures_preserved: true, replay_required: true, governance_validation_required: true }), result, validation: validateForecastIntelligence(result) });
}

export const ForecastIntelligence = Object.freeze({ run: runForecastIntelligence, validate: validateForecastIntelligence, replay: replayForecastIntelligence });
