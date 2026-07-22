import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { runOutcomeCompletenessValidator } from "@/services/outcome-completeness-validator";
import type { OutcomeValidationState } from "@/types/actual-result-capture-contract";
import type { VisibilityRole } from "@/types/decision-observability-contract";
import type { OutcomeCompletenessValidatorResult } from "@/types/outcome-completeness-validator";
import type {
  MissionImpactAnalysis,
  MissionImpactAuditReport,
  MissionImpactCheck,
  MissionImpactClassification,
  MissionImpactFailure,
  MissionImpactLedgerRecord,
  MissionImpactLifecycleState,
  MissionImpactMetrics,
  MissionImpactRecord,
  MissionImpactRecorderFoundation,
  MissionImpactRecorderInput,
  MissionImpactRecorderResult,
  MissionImpactReplayReport,
  MissionImpactType,
  MissionImpactValidation,
} from "@/types/mission-impact-recorder";

const MISSION_IMPACT_RECORDER_VERSION = "mission-impact-recorder/v1" as const;

export const MISSION_IMPACT_TYPES: readonly MissionImpactType[] = Object.freeze(["OBJECTIVE_COMPLETED", "OBJECTIVE_PARTIALLY_COMPLETED", "OBJECTIVE_NOT_COMPLETED", "MISSION_IMPROVED", "MISSION_DEGRADED", "SIDE_EFFECT_OBSERVED", "UNEXPECTED_OUTCOME", "NO_OBSERVABLE_CHANGE", "INSUFFICIENT_EVIDENCE"]);
export const MISSION_IMPACT_CHECKS: readonly MissionImpactCheck[] = Object.freeze(["COMPLETENESS_VALIDATION", "MISSION_IMPACT_ANALYSIS", "IMPACT_CLASSIFICATION", "STRUCTURAL_VALIDATION", "EVIDENCE_VALIDATION", "GOVERNANCE_VALIDATION", "REPLAY_VALIDATION", "INTEGRITY_VALIDATION", "CONSISTENCY_VALIDATION", "LEDGER_IMMUTABILITY", "TENANT_ISOLATION", "CONSTITUTIONAL_GOVERNANCE"]);
export const MISSION_IMPACT_LIFECYCLE: readonly MissionImpactLifecycleState[] = Object.freeze(["OBSERVED", "CLASSIFIED", "VALIDATED", "RECORDED", "REPLAYABLE"]);

type Scenario = NonNullable<MissionImpactRecorderInput["scenario"]>;

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

function sourceForScenario(input: MissionImpactRecorderInput, scenario: Scenario): OutcomeCompletenessValidatorResult {
  if (input.completeness_validator) return input.completeness_validator;
  if (scenario === "INSUFFICIENT_EVIDENCE" || scenario === "MISSING_EVIDENCE") return runOutcomeCompletenessValidator({ scenario: "MISSING_EVIDENCE" });
  if (scenario === "MISSING_GOVERNANCE" || scenario === "CONSTITUTIONAL_BYPASS") return runOutcomeCompletenessValidator({ scenario: "MISSING_GOVERNANCE" });
  if (scenario === "MISSING_REPLAY") return runOutcomeCompletenessValidator({ scenario: "MISSING_REPLAY" });
  if (scenario === "TENANT_VIOLATION") return runOutcomeCompletenessValidator({ scenario: "TENANT_VIOLATION" });
  if (scenario === "INTEGRITY_FAILURE") return runOutcomeCompletenessValidator({ scenario: "MISSING_INTEGRITY_HASH" });
  return runOutcomeCompletenessValidator();
}

function visibleToRole(source: OutcomeCompletenessValidatorResult, role: VisibilityRole): boolean {
  return source.evidence_registry.observation_engine.intake_adapter.capture_contract.architecture_certification.security_boundaries.adaptive_ledger.approval_framework.replay_traceability.authority_binding.adaptation_state.learning_permission.boundary_model.contract_foundation.final_certification.production_readiness.security_certification.observability_certification.ledger_certification.operator_workflow_certification.intelligence_certification.governance_certification.replay_certification.deterministic_certification.foundation_certification.certification_framework.analytics_result.operator_dashboard.replay_monitoring.governance_visibility.priority_dashboard.conflict_visualization.timeline_result.dashboard_result.observability_result.authorizations.some((auth) => auth.role === role && auth.permissions.includes("VIEW_DECISIONS"));
}

function impactTypeForScenario(source: OutcomeCompletenessValidatorResult, scenario: Scenario): MissionImpactType {
  if (MISSION_IMPACT_TYPES.includes(scenario as MissionImpactType)) return scenario as MissionImpactType;
  const impact = source.evidence_registry.observation_engine.observation_record.mission_impact;
  if (!source.evidence_registry.evidence_registry.length || source.validation.validation_status === "INSUFFICIENT_EVIDENCE") return "INSUFFICIENT_EVIDENCE";
  if (impact.objectives_completed.length && impact.objectives_failed.length) return "OBJECTIVE_PARTIALLY_COMPLETED";
  if (impact.objectives_completed.length) return "OBJECTIVE_COMPLETED";
  if (impact.objectives_failed.length) return "OBJECTIVE_NOT_COMPLETED";
  return "NO_OBSERVABLE_CHANGE";
}

function buildAnalysis(source: OutcomeCompletenessValidatorResult, scenario: Scenario): MissionImpactAnalysis {
  const impact = source.evidence_registry.observation_engine.observation_record.mission_impact;
  const completed = scenario === "OBJECTIVE_NOT_COMPLETED" ? freezeArray<string>([]) : impact.objectives_completed;
  const missed = scenario === "OBJECTIVE_COMPLETED" ? freezeArray<string>([]) : scenario === "OBJECTIVE_NOT_COMPLETED" ? freezeArray(["objective_not_completed"]) : impact.objectives_failed;
  const improvements = scenario === "MISSION_IMPROVED" ? freezeArray(["reduced_operational_overhead", "faster_execution"]) : impact.operational_effect.toLowerCase().includes("improved") ? freezeArray([impact.operational_effect]) : freezeArray<string>([]);
  const degradation = scenario === "MISSION_DEGRADED" ? freezeArray(["reduced_service_quality", "mission_delay"]) : impact.recovery_required ? freezeArray(["mission_recovery_required"]) : freezeArray<string>([]);
  const sideEffects = scenario === "SIDE_EFFECT_OBSERVED" ? freezeArray(["downstream_workflow_disruption"]) : impact.unintended_effects;
  const unexpected = scenario === "UNEXPECTED_OUTCOME" ? freezeArray(["unplanned_environmental_effect"]) : freezeArray<string>([]);
  const base: Omit<MissionImpactAnalysis, "integrity_hash"> = {
    analyzer_id: "mission_impact_analyzer",
    completed_objectives: scenario === "NO_OBSERVABLE_CHANGE" || scenario === "INSUFFICIENT_EVIDENCE" ? freezeArray([]) : completed,
    missed_objectives: scenario === "NO_OBSERVABLE_CHANGE" || scenario === "INSUFFICIENT_EVIDENCE" ? freezeArray([]) : missed,
    observed_side_effects: scenario === "NO_OBSERVABLE_CHANGE" || scenario === "INSUFFICIENT_EVIDENCE" ? freezeArray([]) : sideEffects,
    operational_improvements: scenario === "NO_OBSERVABLE_CHANGE" || scenario === "INSUFFICIENT_EVIDENCE" ? freezeArray([]) : improvements,
    mission_degradation: scenario === "NO_OBSERVABLE_CHANGE" || scenario === "INSUFFICIENT_EVIDENCE" ? freezeArray([]) : degradation,
    unexpected_outcomes: scenario === "NO_OBSERVABLE_CHANGE" || scenario === "INSUFFICIENT_EVIDENCE" ? freezeArray([]) : unexpected,
    observed_effects_only: scenario !== "INFERRED_IMPACT",
    causal_reasoning_absent: scenario !== "CAUSAL_ATTRIBUTION",
    predictive_content_absent: scenario !== "PREDICTIVE_BEHAVIOR",
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildClassification(source: OutcomeCompletenessValidatorResult, analysis: MissionImpactAnalysis, scenario: Scenario): MissionImpactClassification {
  const impact_type = scenario === "UNSUPPORTED_CLASSIFICATION" ? "NO_OBSERVABLE_CHANGE" : impactTypeForScenario(source, scenario);
  const basis = freezeArray([...source.evidence_registry.replay_index.evidence_ids, ...source.evidence_registry.observation_engine.observation_record.governance_refs, ...source.evidence_registry.observation_engine.observation_record.replay_refs]);
  const base: Omit<MissionImpactClassification, "integrity_hash"> = {
    classifier_id: "mission_outcome_classifier",
    impact_type,
    supported_classification: scenario !== "UNSUPPORTED_CLASSIFICATION",
    classification_basis_refs: basis,
    deterministic_classification: scenario !== "NONDETERMINISTIC_CLASSIFICATION" && scenario !== "DIVERGENT_IMPACT",
    validation_result: "PASS",
  };
  const normalized = { ...base, validation_result: pass(base.supported_classification && base.deterministic_classification && basis.length > 0 && analysis.observed_effects_only && analysis.causal_reasoning_absent && analysis.predictive_content_absent) };
  return Object.freeze({ ...normalized, integrity_hash: hashWithoutIntegrity(normalized) });
}

function buildRecord(source: OutcomeCompletenessValidatorResult, analysis: MissionImpactAnalysis, classification: MissionImpactClassification, scenario: Scenario): MissionImpactRecord {
  const observation = source.evidence_registry.observation_engine.observation_record;
  const base: Omit<MissionImpactRecord, "integrity_hash"> = {
    impact_id: `mission_impact_${hash(`${observation.outcome_id}:${classification.impact_type}`).slice(0, 16)}`,
    tenant_id: scenario === "TENANT_VIOLATION" ? `${observation.tenant_id}:foreign` : observation.tenant_id,
    mission_id: observation.mission_id,
    outcome_id: scenario === "ORPHAN_IMPACT" ? "orphan-outcome" : observation.outcome_id,
    decision_id: observation.decision_id,
    observation_timestamp: observation.observed_timestamp,
    impact_type: classification.impact_type,
    objective_refs: freezeArray([...observation.mission_impact.objectives_completed, ...observation.mission_impact.objectives_failed]),
    achieved_objectives: analysis.completed_objectives,
    missed_objectives: analysis.missed_objectives,
    observed_side_effects: analysis.observed_side_effects,
    operational_improvements: analysis.operational_improvements,
    mission_degradation: analysis.mission_degradation,
    unexpected_outcomes: analysis.unexpected_outcomes,
    supporting_evidence_refs: scenario === "MISSING_EVIDENCE" ? freezeArray([]) : source.evidence_registry.replay_index.evidence_ids,
    governance_refs: scenario === "MISSING_GOVERNANCE" || scenario === "CONSTITUTIONAL_BYPASS" ? freezeArray([]) : observation.governance_refs,
    replay_refs: scenario === "MISSING_REPLAY" ? freezeArray([]) : observation.replay_refs,
    immutable_after_recording: true,
  };
  const built = Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
  if (scenario === "MODIFIED_AFTER_RECORDING") return Object.freeze({ ...built, operational_improvements: freezeArray(["modified_after_recording"]), integrity_hash: built.integrity_hash });
  if (scenario === "INTEGRITY_FAILURE") return Object.freeze({ ...built, integrity_hash: hash({ tampered: built.impact_id }) });
  return built;
}

function collectFailures(input: {
  source: OutcomeCompletenessValidatorResult;
  analysis: MissionImpactAnalysis;
  classification: MissionImpactClassification;
  record: MissionImpactRecord;
  role: VisibilityRole;
  scenario: Scenario;
}): readonly MissionImpactFailure[] {
  const failures: MissionImpactFailure[] = [];
  if (input.source.validation.validation_status !== "VALID" || input.scenario === "INSUFFICIENT_EVIDENCE") failures.push("COMPLETENESS_VALIDATION_NOT_PASSED");
  if (!input.analysis.observed_effects_only || input.scenario === "INFERRED_IMPACT") failures.push("INFERRED_MISSION_IMPACT_ACCEPTED");
  if (!input.classification.supported_classification || input.scenario === "UNSUPPORTED_CLASSIFICATION") failures.push("UNSUPPORTED_IMPACT_CLASSIFICATION_ACCEPTED");
  if (!input.record.supporting_evidence_refs.length || input.scenario === "MISSING_EVIDENCE") failures.push("EVIDENCE_MISSING");
  if (!input.record.governance_refs.length || input.scenario === "MISSING_GOVERNANCE") failures.push("GOVERNANCE_REFERENCES_MISSING");
  if (!input.record.replay_refs.length || input.scenario === "MISSING_REPLAY") failures.push("REPLAY_REFERENCES_MISSING");
  if (input.scenario === "MODIFIED_AFTER_RECORDING") failures.push("IMPACT_RECORD_MODIFIED_AFTER_RECORDING");
  if (input.scenario === "DIVERGENT_IMPACT") failures.push("IDENTICAL_EVIDENCE_PRODUCED_DIFFERENT_IMPACT");
  if (!input.classification.deterministic_classification || input.scenario === "NONDETERMINISTIC_CLASSIFICATION") failures.push("NONDETERMINISTIC_CLASSIFICATION_DETECTED");
  if (hashWithoutIntegrity(input.record) !== input.record.integrity_hash || input.scenario === "INTEGRITY_FAILURE") failures.push("INTEGRITY_VALIDATION_FAILED");
  if (input.record.outcome_id !== input.source.evidence_registry.observation_engine.observation_record.outcome_id || input.scenario === "ORPHAN_IMPACT") failures.push("ORPHAN_MISSION_IMPACT_ACCEPTED");
  if (input.record.tenant_id !== input.source.evidence_registry.observation_engine.observation_record.tenant_id || input.scenario === "TENANT_VIOLATION") failures.push("TENANT_ISOLATION_VIOLATED");
  if (input.scenario === "CONSTITUTIONAL_BYPASS") failures.push("CONSTITUTIONAL_CONSTRAINTS_BYPASSED");
  if (!input.analysis.predictive_content_absent || input.scenario === "PREDICTIVE_BEHAVIOR") failures.push("PREDICTIVE_MISSION_BEHAVIOR_ACCEPTED");
  if (!input.analysis.causal_reasoning_absent || input.scenario === "CAUSAL_ATTRIBUTION") failures.push("CAUSAL_ATTRIBUTION_ACCEPTED");
  if (input.scenario === "UNAUTHORIZED_MODIFICATION") failures.push("UNAUTHORIZED_MODIFICATION_REJECTED");
  if (!visibleToRole(input.source, input.role)) failures.push("AUTHORIZATION_FAILURE");
  if (input.scenario === "FAIL_OPEN") failures.push("FAIL_OPEN_MISSION_IMPACT_BEHAVIOR");
  return freezeArray([...new Set(failures)]);
}

function buildValidation(failures: readonly MissionImpactFailure[]): MissionImpactValidation {
  const has = (failure: MissionImpactFailure) => failures.includes(failure);
  const base: Omit<MissionImpactValidation, "integrity_hash"> = {
    validation_id: "mission_impact_validation",
    validation_status: has("EVIDENCE_MISSING") || has("COMPLETENESS_VALIDATION_NOT_PASSED") ? "INSUFFICIENT_EVIDENCE" : failures.length ? "BLOCKED" : "VALID",
    structural_valid: !has("ORPHAN_MISSION_IMPACT_ACCEPTED") && !has("UNSUPPORTED_IMPACT_CLASSIFICATION_ACCEPTED"),
    evidence_valid: !has("EVIDENCE_MISSING") && !has("INFERRED_MISSION_IMPACT_ACCEPTED"),
    governance_valid: !has("GOVERNANCE_REFERENCES_MISSING") && !has("CONSTITUTIONAL_CONSTRAINTS_BYPASSED"),
    replay_valid: !has("REPLAY_REFERENCES_MISSING") && !has("IDENTICAL_EVIDENCE_PRODUCED_DIFFERENT_IMPACT") && !has("NONDETERMINISTIC_CLASSIFICATION_DETECTED"),
    integrity_valid: !has("INTEGRITY_VALIDATION_FAILED"),
    consistency_valid: !has("IDENTICAL_EVIDENCE_PRODUCED_DIFFERENT_IMPACT") && !has("NONDETERMINISTIC_CLASSIFICATION_DETECTED"),
    tenant_isolated: !has("TENANT_ISOLATION_VIOLATED"),
    immutable_after_recording: !has("IMPACT_RECORD_MODIFIED_AFTER_RECORDING"),
    observed_effects_only: !has("INFERRED_MISSION_IMPACT_ACCEPTED") && !has("PREDICTIVE_MISSION_BEHAVIOR_ACCEPTED") && !has("CAUSAL_ATTRIBUTION_ACCEPTED"),
    constitutional_governance_preserved: !has("CONSTITUTIONAL_CONSTRAINTS_BYPASSED"),
    failures,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildReplay(analysis: MissionImpactAnalysis, classification: MissionImpactClassification, record: MissionImpactRecord, validation: MissionImpactValidation): MissionImpactReplayReport {
  const reconstruction = { analysis, classification, record, validation };
  const base: Omit<MissionImpactReplayReport, "integrity_hash"> = {
    replay_report_id: "mission_impact_replay_report",
    impact_record_hash: record.integrity_hash,
    analysis_hash: analysis.integrity_hash,
    classification_hash: classification.integrity_hash,
    reconstruction_hash: hash(reconstruction),
    replay_reconstruction_identical: validation.replay_valid,
    deterministic_serialization: validation.consistency_valid && validation.integrity_valid,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildLedger(record: MissionImpactRecord, validation: MissionImpactValidation): readonly MissionImpactLedgerRecord[] {
  const base: Omit<MissionImpactLedgerRecord, "integrity_hash"> = {
    ledger_id: "mission_impact_ledger_001",
    impact_id: record.impact_id,
    tenant_id: record.tenant_id,
    mission_id: record.mission_id,
    outcome_id: record.outcome_id,
    impact_type: record.impact_type,
    lifecycle_state: validation.failures.length ? "VALIDATED" : "REPLAYABLE",
    impact_hash: record.integrity_hash,
    evidence_refs: record.supporting_evidence_refs,
    governance_refs: record.governance_refs,
    replay_refs: record.replay_refs,
    timestamp: record.observation_timestamp,
    sequence_number: 1,
    append_only: true,
    deleted: false,
  };
  return freezeArray([Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) })]);
}

function buildMetrics(record: MissionImpactRecord, validation: MissionImpactValidation): MissionImpactMetrics {
  const has = (failure: MissionImpactFailure) => validation.failures.includes(failure);
  const base: Omit<MissionImpactMetrics, "integrity_hash"> = {
    metrics_id: "mission_impact_metrics",
    mission_impacts_recorded: validation.failures.length ? 0 : 1,
    impact_classifications_by_type: freezeArray([record.impact_type]),
    objectives_achieved: record.achieved_objectives.length,
    objectives_missed: record.missed_objectives.length,
    side_effects_observed: record.observed_side_effects.length,
    mission_degradation_events: record.mission_degradation.length,
    operational_improvements_recorded: record.operational_improvements.length,
    unexpected_outcomes_recorded: record.unexpected_outcomes.length,
    insufficient_evidence_occurrences: has("EVIDENCE_MISSING") || record.impact_type === "INSUFFICIENT_EVIDENCE" ? 1 : 0,
    replay_reconstruction_success_rate: validation.replay_valid ? 1 : 0,
    impact_recording_latency_ms: 0,
    advisory_only: true,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildAudit(record: MissionImpactRecord, validation: MissionImpactValidation, replay: MissionImpactReplayReport): MissionImpactAuditReport {
  const base: Omit<MissionImpactAuditReport, "integrity_hash"> = {
    report_id: "mission_impact_audit_report",
    tenant_id: record.tenant_id,
    checks: MISSION_IMPACT_CHECKS,
    analyzer_operational: validation.observed_effects_only,
    recorder_operational: validation.validation_status === "VALID",
    classifier_operational: validation.structural_valid && validation.consistency_valid,
    validator_operational: validation.validation_status === "VALID",
    replay_generator_operational: replay.replay_reconstruction_identical,
    evidence_lineage_preserved: validation.evidence_valid,
    governance_lineage_preserved: validation.governance_valid,
    replay_lineage_preserved: validation.replay_valid,
    analysis_and_attribution_absent: validation.observed_effects_only,
    immutable_record_verified: validation.immutable_after_recording,
    failure_analysis: validation.failures,
    certification_decision: pass(validation.failures.length === 0),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function resultReplayHash(result: Omit<MissionImpactRecorderResult, "integrity_hash" | "replay_hash">): string {
  return hash({
    analysis: result.analysis,
    classification: result.classification,
    record: result.impact_record,
    validation: result.validation,
    replay: result.replay_report,
    ledger: result.impact_ledger,
    audit: result.audit_report,
  });
}

export function runMissionImpactRecorder(input: MissionImpactRecorderInput = {}): MissionImpactRecorderResult {
  const scenario = input.scenario ?? "BASELINE";
  const role = input.role ?? "OPERATOR";
  const completeness_validator = sourceForScenario(input, scenario);
  const analysis = buildAnalysis(completeness_validator, scenario);
  const classification = buildClassification(completeness_validator, analysis, scenario);
  const impact_record = buildRecord(completeness_validator, analysis, classification, scenario);
  const failures = collectFailures({ source: completeness_validator, analysis, classification, record: impact_record, role, scenario });
  const validation = buildValidation(failures);
  const replay_report = buildReplay(analysis, classification, impact_record, validation);
  const impact_ledger = buildLedger(impact_record, validation);
  const metrics = buildMetrics(impact_record, validation);
  const audit_report = buildAudit(impact_record, validation, replay_report);
  const lifecycle: readonly MissionImpactLifecycleState[] = failures.length ? freezeArray<MissionImpactLifecycleState>(["OBSERVED", "CLASSIFIED", "VALIDATED"]) : MISSION_IMPACT_LIFECYCLE;
  const base: Omit<MissionImpactRecorderResult, "integrity_hash" | "replay_hash"> = {
    mission_impact_recorder_version: MISSION_IMPACT_RECORDER_VERSION,
    completeness_validator,
    analysis,
    classification,
    impact_record,
    validation,
    replay_report,
    impact_ledger,
    metrics,
    audit_report,
    lifecycle,
    deterministic: true,
    replayable: true,
    observational_only: true,
    permits_analysis: false,
    permits_attribution: false,
    permits_prediction: false,
  };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: hashWithoutIntegrity({ ...base, replay_hash }) });
}

export function replayMissionImpactRecorder(result: MissionImpactRecorderResult): boolean {
  return resultReplayHash(result) === result.replay_hash && hashWithoutIntegrity(result) === result.integrity_hash;
}

export function computeMissionImpactRecordHash(record: Omit<MissionImpactRecord, "integrity_hash"> | MissionImpactRecord): string {
  return hashWithoutIntegrity(record);
}

export function getMissionImpactRecorderFoundation(): MissionImpactRecorderFoundation {
  return Object.freeze({
    mission_impact_recorder_version: MISSION_IMPACT_RECORDER_VERSION,
    checks: MISSION_IMPACT_CHECKS,
    supported_classifications: MISSION_IMPACT_TYPES,
    lifecycle: MISSION_IMPACT_LIFECYCLE,
    result: runMissionImpactRecorder(),
  });
}

export const MissionImpactRecorder = Object.freeze({
  run: runMissionImpactRecorder,
  replay: replayMissionImpactRecorder,
});
