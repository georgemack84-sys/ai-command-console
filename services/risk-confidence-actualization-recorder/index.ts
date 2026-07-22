import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { runMissionImpactRecorder } from "@/services/mission-impact-recorder";
import type { OutcomeValidationState } from "@/types/actual-result-capture-contract";
import type { VisibilityRole } from "@/types/decision-observability-contract";
import type { MissionImpactRecorderResult } from "@/types/mission-impact-recorder";
import type {
  ActualizationAuditReport,
  ActualizationCheck,
  ActualizationClassification,
  ActualizationFailure,
  ActualizationLedgerRecord,
  ActualizationLifecycleState,
  ActualizationMetrics,
  ActualizationRecord,
  ActualizationReplayReport,
  ActualizationValidation,
  ConfidenceActualizationState,
  ForecastActualizationState,
  PredictionLinkage,
  RiskActualizationState,
  RiskConfidenceActualizationRecorderFoundation,
  RiskConfidenceActualizationRecorderInput,
  RiskConfidenceActualizationRecorderResult,
} from "@/types/risk-confidence-actualization-recorder";

const ACTUALIZATION_RECORDER_VERSION = "risk-confidence-actualization-recorder/v1" as const;

export const ACTUALIZATION_CHECKS: readonly ActualizationCheck[] = Object.freeze(["MISSION_IMPACT_VALIDATION", "PREDICTION_LINKAGE", "RISK_ACTUALIZATION", "CONFIDENCE_ACTUALIZATION", "FORECAST_ACTUALIZATION", "STRUCTURAL_VALIDATION", "EVIDENCE_VALIDATION", "GOVERNANCE_VALIDATION", "REPLAY_VALIDATION", "INTEGRITY_VALIDATION", "HISTORICAL_IMMUTABILITY", "TENANT_ISOLATION", "CONSTITUTIONAL_GOVERNANCE"]);
export const ACTUALIZATION_LIFECYCLE: readonly ActualizationLifecycleState[] = Object.freeze(["PREDICTION_LINKED", "OBSERVATION_CAPTURED", "ACTUALIZATION_CLASSIFIED", "VALIDATED", "RECORDED", "REPLAYABLE"]);

type Scenario = NonNullable<RiskConfidenceActualizationRecorderInput["scenario"]>;

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

function pass(value: boolean): OutcomeValidationState {
  return value ? "PASS" : "FAIL";
}

function sourceForScenario(input: RiskConfidenceActualizationRecorderInput, scenario: Scenario): MissionImpactRecorderResult {
  if (input.mission_impact_recorder) return input.mission_impact_recorder;
  if (scenario === "INSUFFICIENT_EVIDENCE" || scenario === "MISSING_EVIDENCE") return runMissionImpactRecorder({ scenario: "MISSING_EVIDENCE" });
  if (scenario === "MISSING_GOVERNANCE") return runMissionImpactRecorder({ scenario: "MISSING_GOVERNANCE" });
  if (scenario === "TENANT_VIOLATION") return runMissionImpactRecorder({ scenario: "TENANT_VIOLATION" });
  if (scenario === "INTEGRITY_FAILURE") return runMissionImpactRecorder({ scenario: "INTEGRITY_FAILURE" });
  return runMissionImpactRecorder();
}

function visibleToRole(source: MissionImpactRecorderResult, role: VisibilityRole): boolean {
  return source.completeness_validator.evidence_registry.observation_engine.intake_adapter.capture_contract.architecture_certification.security_boundaries.adaptive_ledger.approval_framework.replay_traceability.authority_binding.adaptation_state.learning_permission.boundary_model.contract_foundation.final_certification.production_readiness.security_certification.observability_certification.ledger_certification.operator_workflow_certification.intelligence_certification.governance_certification.replay_certification.deterministic_certification.foundation_certification.certification_framework.analytics_result.operator_dashboard.replay_monitoring.governance_visibility.priority_dashboard.conflict_visualization.timeline_result.dashboard_result.observability_result.authorizations.some((auth) => auth.role === role && auth.permissions.includes("VIEW_DECISIONS"));
}

function buildLinkage(source: MissionImpactRecorderResult, scenario: Scenario): PredictionLinkage {
  const observation = source.completeness_validator.evidence_registry.observation_engine.observation_record;
  const packageId = observation.decision_package_id;
  const base: Omit<PredictionLinkage, "integrity_hash"> = {
    linkage_id: "prediction_actualization_linkage",
    decision_package_id: packageId,
    mission_id: observation.mission_id,
    outcome_id: observation.outcome_id,
    original_risk_refs: scenario === "MISSING_PREDICTION" || scenario === "MISSING_RISK_REF" ? freezeArray([]) : freezeArray([`${packageId}:risk-assessment`]),
    original_confidence_refs: scenario === "MISSING_PREDICTION" || scenario === "MISSING_CONFIDENCE_REF" ? freezeArray([]) : freezeArray([`${packageId}:confidence-estimate`]),
    original_forecast_refs: scenario === "MISSING_PREDICTION" || scenario === "MISSING_FORECAST_REF" ? freezeArray([]) : freezeArray([`${packageId}:mission-forecast`]),
    observed_outcome_refs: freezeArray([observation.outcome_id, source.impact_record.impact_id]),
    prediction_immutable: scenario !== "PREDICTION_MODIFIED",
    historical_records_unchanged: scenario !== "HISTORICAL_CHANGE" && scenario !== "RECALIBRATION_ATTEMPTED",
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function riskState(source: MissionImpactRecorderResult, scenario: Scenario): RiskActualizationState {
  if (scenario === "RISK_MATERIALIZED") return "MATERIALIZED";
  if (scenario === "RISK_AVOIDED") return "AVOIDED";
  if (scenario === "RISK_UNDERESTIMATED") return "UNDERESTIMATED";
  if (scenario === "RISK_OVERESTIMATED") return "OVERESTIMATED";
  if (scenario === "UNKNOWN") return "UNKNOWN";
  if (scenario === "INSUFFICIENT_EVIDENCE" || scenario === "MISSING_EVIDENCE") return "INSUFFICIENT_EVIDENCE";
  const actual = source.completeness_validator.evidence_registry.observation_engine.observation_record.risk_actualization;
  if (actual.realized_risks.length) return "MATERIALIZED";
  if (actual.avoided_risks.length) return "AVOIDED";
  if (actual.underestimated_risks.length) return "UNDERESTIMATED";
  if (actual.overestimated_risks.length) return "OVERESTIMATED";
  return "UNKNOWN";
}

function confidenceState(source: MissionImpactRecorderResult, scenario: Scenario): ConfidenceActualizationState {
  if (scenario === "CONFIDENCE_ACCURATE") return "ACCURATE";
  if (scenario === "CONFIDENCE_OPTIMISTIC") return "OPTIMISTIC";
  if (scenario === "CONFIDENCE_PESSIMISTIC") return "PESSIMISTIC";
  if (scenario === "CONFIDENCE_INVALID") return "INVALID";
  if (scenario === "UNKNOWN") return "UNKNOWN";
  if (scenario === "INSUFFICIENT_EVIDENCE" || scenario === "MISSING_EVIDENCE") return "INSUFFICIENT_EVIDENCE";
  const actual = source.completeness_validator.evidence_registry.observation_engine.observation_record.confidence_actualization;
  if (actual.accurate_confidence.length) return "ACCURATE";
  if (actual.overconfidence.length) return "OPTIMISTIC";
  if (actual.underconfidence.length) return "PESSIMISTIC";
  if (actual.invalid_confidence.length) return "INVALID";
  return "UNKNOWN";
}

function forecastState(source: MissionImpactRecorderResult, scenario: Scenario): ForecastActualizationState {
  if (scenario === "FORECAST_CORRECT") return "CORRECT";
  if (scenario === "FORECAST_PARTIAL") return "PARTIALLY_CORRECT";
  if (scenario === "FORECAST_INCORRECT") return "INCORRECT";
  if (scenario === "UNKNOWN") return "UNKNOWN";
  if (scenario === "INSUFFICIENT_EVIDENCE" || scenario === "MISSING_EVIDENCE") return "INSUFFICIENT_EVIDENCE";
  if (source.impact_record.achieved_objectives.length && !source.impact_record.missed_objectives.length) return "CORRECT";
  if (source.impact_record.achieved_objectives.length && source.impact_record.missed_objectives.length) return "PARTIALLY_CORRECT";
  if (source.impact_record.missed_objectives.length) return "INCORRECT";
  return "UNKNOWN";
}

function buildClassification(source: MissionImpactRecorderResult, linkage: PredictionLinkage, scenario: Scenario): ActualizationClassification {
  const basis = freezeArray([...linkage.original_risk_refs, ...linkage.original_confidence_refs, ...linkage.original_forecast_refs, ...linkage.observed_outcome_refs, ...source.impact_record.supporting_evidence_refs]);
  const base: Omit<ActualizationClassification, "integrity_hash"> = {
    classification_id: "actualization_classification",
    risk_actualization: riskState(source, scenario),
    confidence_actualization: confidenceState(source, scenario),
    forecast_actualization: forecastState(source, scenario),
    classification_basis_refs: basis,
    deterministic_classification: scenario !== "NONDETERMINISTIC_CLASSIFICATION" && scenario !== "REPLAY_MISMATCH",
    inferred_comparisons_absent: scenario !== "INFERRED_COMPARISON",
    recalibration_absent: scenario !== "RECALIBRATION_ATTEMPTED",
    validation_result: "PASS",
  };
  const normalized = { ...base, validation_result: pass(base.deterministic_classification && base.inferred_comparisons_absent && base.recalibration_absent && basis.length > 0) };
  return Object.freeze({ ...normalized, integrity_hash: hashWithoutIntegrity(normalized) });
}

function buildRecord(source: MissionImpactRecorderResult, linkage: PredictionLinkage, classification: ActualizationClassification, scenario: Scenario): ActualizationRecord {
  const observation = source.completeness_validator.evidence_registry.observation_engine.observation_record;
  const base: Omit<ActualizationRecord, "integrity_hash"> = {
    actualization_id: `actualization_${hash(`${observation.outcome_id}:${classification.risk_actualization}:${classification.confidence_actualization}:${classification.forecast_actualization}`).slice(0, 16)}`,
    tenant_id: scenario === "TENANT_VIOLATION" ? `${observation.tenant_id}:foreign` : observation.tenant_id,
    mission_id: observation.mission_id,
    outcome_id: observation.outcome_id,
    decision_id: observation.decision_id,
    decision_package_id: observation.decision_package_id,
    prediction_timestamp: "2026-01-01T00:00:00.000Z",
    observation_timestamp: observation.observed_timestamp,
    original_risk_refs: linkage.original_risk_refs,
    original_confidence_refs: linkage.original_confidence_refs,
    original_forecast_refs: linkage.original_forecast_refs,
    observed_outcome_refs: linkage.observed_outcome_refs,
    risk_actualization: classification.risk_actualization,
    confidence_actualization: classification.confidence_actualization,
    forecast_actualization: classification.forecast_actualization,
    supporting_evidence_refs: scenario === "MISSING_EVIDENCE" ? freezeArray([]) : source.impact_record.supporting_evidence_refs,
    governance_refs: scenario === "MISSING_GOVERNANCE" ? freezeArray([]) : source.impact_record.governance_refs,
    replay_refs: source.impact_record.replay_refs,
    original_prediction_immutable: true,
    historical_decision_records_unchanged: true,
  };
  const built = Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
  if (scenario === "INTEGRITY_FAILURE") return Object.freeze({ ...built, integrity_hash: hash({ tampered: built.actualization_id }) });
  return built;
}

function collectFailures(input: {
  source: MissionImpactRecorderResult;
  linkage: PredictionLinkage;
  classification: ActualizationClassification;
  record: ActualizationRecord;
  role: VisibilityRole;
  scenario: Scenario;
}): readonly ActualizationFailure[] {
  const failures: ActualizationFailure[] = [];
  if (input.source.validation.validation_status !== "VALID") failures.push("MISSION_IMPACT_NOT_VALIDATED");
  if (!input.linkage.original_risk_refs.length && !input.linkage.original_confidence_refs.length && !input.linkage.original_forecast_refs.length) failures.push("PREDICTION_CANNOT_BE_LINKED");
  if (!input.record.supporting_evidence_refs.length || input.scenario === "MISSING_EVIDENCE") failures.push("EVIDENCE_MISSING");
  if (!input.classification.inferred_comparisons_absent || input.scenario === "INFERRED_COMPARISON") failures.push("INFERRED_COMPARISON_ACCEPTED");
  if (!input.linkage.prediction_immutable || input.scenario === "PREDICTION_MODIFIED") failures.push("ORIGINAL_PREDICTION_MODIFIED");
  if (!input.linkage.historical_records_unchanged || input.scenario === "HISTORICAL_CHANGE") failures.push("HISTORICAL_PREDICTION_CHANGED");
  if (input.scenario === "DUPLICATE_ACTUALIZATION") failures.push("DUPLICATE_ACTUALIZATION_CREATED");
  if (input.scenario === "REPLAY_MISMATCH") failures.push("REPLAY_RECONSTRUCTION_DIFFERS");
  if (!input.record.governance_refs.length || input.scenario === "MISSING_GOVERNANCE") failures.push("GOVERNANCE_REFERENCES_MISSING");
  if (hashWithoutIntegrity(input.record) !== input.record.integrity_hash || input.scenario === "INTEGRITY_FAILURE") failures.push("INTEGRITY_VERIFICATION_FAILED");
  if (input.record.tenant_id !== input.source.impact_record.tenant_id || input.scenario === "TENANT_VIOLATION") failures.push("TENANT_ISOLATION_VIOLATED");
  if (!input.classification.deterministic_classification || input.scenario === "NONDETERMINISTIC_CLASSIFICATION") failures.push("NONDETERMINISTIC_CLASSIFICATION_DETECTED");
  if (!input.classification.recalibration_absent || input.scenario === "RECALIBRATION_ATTEMPTED") failures.push("RECALIBRATION_ATTEMPTED");
  if (!input.linkage.original_forecast_refs.length) failures.push("FORECAST_REFERENCE_MISSING");
  if (!input.linkage.original_confidence_refs.length) failures.push("CONFIDENCE_REFERENCE_MISSING");
  if (!input.linkage.original_risk_refs.length) failures.push("RISK_REFERENCE_MISSING");
  if (!visibleToRole(input.source, input.role)) failures.push("AUTHORIZATION_FAILURE");
  if (input.scenario === "FAIL_OPEN") failures.push("FAIL_OPEN_ACTUALIZATION_BEHAVIOR");
  return freezeArray([...new Set(failures)]);
}

function buildValidation(failures: readonly ActualizationFailure[]): ActualizationValidation {
  const has = (failure: ActualizationFailure) => failures.includes(failure);
  const base: Omit<ActualizationValidation, "integrity_hash"> = {
    validation_id: "actualization_validation",
    validation_status: has("EVIDENCE_MISSING") || has("MISSION_IMPACT_NOT_VALIDATED") ? "INSUFFICIENT_EVIDENCE" : failures.length ? "BLOCKED" : "VALID",
    structural_valid: !has("DUPLICATE_ACTUALIZATION_CREATED"),
    prediction_valid: !has("PREDICTION_CANNOT_BE_LINKED") && !has("FORECAST_REFERENCE_MISSING") && !has("CONFIDENCE_REFERENCE_MISSING") && !has("RISK_REFERENCE_MISSING"),
    evidence_valid: !has("EVIDENCE_MISSING") && !has("INFERRED_COMPARISON_ACCEPTED"),
    governance_valid: !has("GOVERNANCE_REFERENCES_MISSING"),
    replay_valid: !has("REPLAY_RECONSTRUCTION_DIFFERS"),
    integrity_valid: !has("INTEGRITY_VERIFICATION_FAILED"),
    deterministic: !has("NONDETERMINISTIC_CLASSIFICATION_DETECTED"),
    tenant_isolated: !has("TENANT_ISOLATION_VIOLATED"),
    original_predictions_immutable: !has("ORIGINAL_PREDICTION_MODIFIED"),
    historical_records_unchanged: !has("HISTORICAL_PREDICTION_CHANGED"),
    recalibration_absent: !has("RECALIBRATION_ATTEMPTED"),
    failures,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildReplay(linkage: PredictionLinkage, classification: ActualizationClassification, record: ActualizationRecord, validation: ActualizationValidation): ActualizationReplayReport {
  const reconstruction = { linkage, classification, record, validation };
  const base: Omit<ActualizationReplayReport, "integrity_hash"> = {
    replay_report_id: "actualization_replay_report",
    linkage_hash: linkage.integrity_hash,
    classification_hash: classification.integrity_hash,
    record_hash: record.integrity_hash,
    reconstruction_hash: hash(reconstruction),
    replay_reconstruction_identical: validation.replay_valid,
    deterministic_serialization: validation.deterministic && validation.integrity_valid,
    historical_compatibility_preserved: validation.historical_records_unchanged,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildLedger(record: ActualizationRecord, validation: ActualizationValidation): readonly ActualizationLedgerRecord[] {
  const base: Omit<ActualizationLedgerRecord, "integrity_hash"> = {
    ledger_id: "actualization_ledger_001",
    actualization_id: record.actualization_id,
    tenant_id: record.tenant_id,
    mission_id: record.mission_id,
    outcome_id: record.outcome_id,
    lifecycle_state: validation.failures.length ? "VALIDATED" : "REPLAYABLE",
    risk_actualization: record.risk_actualization,
    confidence_actualization: record.confidence_actualization,
    forecast_actualization: record.forecast_actualization,
    actualization_hash: record.integrity_hash,
    timestamp: record.observation_timestamp,
    sequence_number: 1,
    append_only: true,
    deleted: false,
  };
  return freezeArray([Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) })]);
}

function buildMetrics(record: ActualizationRecord, validation: ActualizationValidation): ActualizationMetrics {
  const base: Omit<ActualizationMetrics, "integrity_hash"> = {
    metrics_id: "actualization_metrics",
    actualizations_recorded: validation.failures.length ? 0 : 1,
    risk_actualization_distribution: freezeArray([record.risk_actualization]),
    confidence_accuracy_distribution: freezeArray([record.confidence_actualization]),
    forecast_accuracy_distribution: freezeArray([record.forecast_actualization]),
    prediction_linkage_success_rate: validation.prediction_valid ? 1 : 0,
    insufficient_evidence_occurrences: validation.validation_status === "INSUFFICIENT_EVIDENCE" ? 1 : 0,
    validation_failures: validation.failures.length,
    replay_reconstruction_success_rate: validation.replay_valid ? 1 : 0,
    processing_latency_ms: 0,
    integrity_verification_failures: validation.integrity_valid ? 0 : 1,
    advisory_only: true,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildAudit(record: ActualizationRecord, validation: ActualizationValidation, replay: ActualizationReplayReport): ActualizationAuditReport {
  const base: Omit<ActualizationAuditReport, "integrity_hash"> = {
    report_id: "actualization_audit_report",
    tenant_id: record.tenant_id,
    checks: ACTUALIZATION_CHECKS,
    risk_recorder_operational: validation.validation_status === "VALID",
    confidence_recorder_operational: validation.validation_status === "VALID",
    forecast_recorder_operational: validation.validation_status === "VALID",
    prediction_linkage_operational: validation.prediction_valid,
    classification_engine_operational: validation.deterministic,
    replay_generator_operational: replay.replay_reconstruction_identical,
    evidence_lineage_preserved: validation.evidence_valid,
    governance_lineage_preserved: validation.governance_valid,
    replay_lineage_preserved: validation.replay_valid,
    no_recalibration_performed: validation.recalibration_absent,
    historical_predictions_unchanged: validation.historical_records_unchanged && validation.original_predictions_immutable,
    failure_analysis: validation.failures,
    certification_decision: pass(validation.failures.length === 0),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function resultReplayHash(result: Omit<RiskConfidenceActualizationRecorderResult, "integrity_hash" | "replay_hash">): string {
  return hash({
    linkage: result.prediction_linkage,
    classification: result.classification,
    record: result.actualization_record,
    validation: result.validation,
    replay: result.replay_report,
    ledger: result.actualization_ledger,
    audit: result.audit_report,
  });
}

export function runRiskConfidenceActualizationRecorder(input: RiskConfidenceActualizationRecorderInput = {}): RiskConfidenceActualizationRecorderResult {
  const scenario = input.scenario ?? "BASELINE";
  const role = input.role ?? "OPERATOR";
  const mission_impact_recorder = sourceForScenario(input, scenario);
  const prediction_linkage = buildLinkage(mission_impact_recorder, scenario);
  const classification = buildClassification(mission_impact_recorder, prediction_linkage, scenario);
  const actualization_record = buildRecord(mission_impact_recorder, prediction_linkage, classification, scenario);
  const failures = collectFailures({ source: mission_impact_recorder, linkage: prediction_linkage, classification, record: actualization_record, role, scenario });
  const validation = buildValidation(failures);
  const replay_report = buildReplay(prediction_linkage, classification, actualization_record, validation);
  const actualization_ledger = buildLedger(actualization_record, validation);
  const metrics = buildMetrics(actualization_record, validation);
  const audit_report = buildAudit(actualization_record, validation, replay_report);
  const lifecycle: readonly ActualizationLifecycleState[] = failures.length ? freezeArray<ActualizationLifecycleState>(["PREDICTION_LINKED", "OBSERVATION_CAPTURED", "ACTUALIZATION_CLASSIFIED", "VALIDATED"]) : ACTUALIZATION_LIFECYCLE;
  const base: Omit<RiskConfidenceActualizationRecorderResult, "integrity_hash" | "replay_hash"> = {
    actualization_recorder_version: ACTUALIZATION_RECORDER_VERSION,
    mission_impact_recorder,
    prediction_linkage,
    classification,
    actualization_record,
    validation,
    replay_report,
    actualization_ledger,
    metrics,
    audit_report,
    lifecycle,
    deterministic: true,
    replayable: true,
    observational_only: true,
    recalibrates_risk: false,
    recalibrates_confidence: false,
    changes_historical_predictions: false,
  };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: hashWithoutIntegrity({ ...base, replay_hash }) });
}

export function replayRiskConfidenceActualizationRecorder(result: RiskConfidenceActualizationRecorderResult): boolean {
  return resultReplayHash(result) === result.replay_hash && hashWithoutIntegrity(result) === result.integrity_hash;
}

export function computeActualizationRecordHash(record: Omit<ActualizationRecord, "integrity_hash"> | ActualizationRecord): string {
  return hashWithoutIntegrity(record);
}

export function getRiskConfidenceActualizationRecorderFoundation(): RiskConfidenceActualizationRecorderFoundation {
  return Object.freeze({
    actualization_recorder_version: ACTUALIZATION_RECORDER_VERSION,
    checks: ACTUALIZATION_CHECKS,
    lifecycle: ACTUALIZATION_LIFECYCLE,
    result: runRiskConfidenceActualizationRecorder(),
  });
}

export const RiskConfidenceActualizationRecorder = Object.freeze({
  run: runRiskConfidenceActualizationRecorder,
  replay: replayRiskConfidenceActualizationRecorder,
});
