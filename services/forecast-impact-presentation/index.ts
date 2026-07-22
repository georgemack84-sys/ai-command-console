import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { summarizeEvidenceRiskConfidence } from "@/services/evidence-risk-confidence-summarization";
import type { EvidenceRiskConfidenceResult } from "@/types/evidence-risk-confidence-summarization";
import type {
  DependencyImpactRecord,
  ForecastImpactPresentationFailureReason,
  ForecastImpactPresentationFoundation,
  ForecastImpactPresentationInput,
  ForecastImpactPresentationObservability,
  ForecastImpactPresentationReplay,
  ForecastImpactPresentationResult,
  ForecastPresentation,
  ForecastPresentationLedgerEntry,
  ForecastPresentationState,
  ForecastValidationResult,
  ForecastVisualizationModel,
  ForecastVisualizationSection,
  FutureStateProjection,
  MissionImpactRecord,
} from "@/types/forecast-impact-presentation";

const PRESENTER_VERSION = "forecast-impact-presentation/v1" as const;
const AUTHORIZED_COMPONENT = "forecast-impact-presentation";
const NOW = "2026-07-04T01:12:00.000Z";

export const FORECAST_PRESENTATION_STATES: readonly ForecastPresentationState[] = Object.freeze(["INITIALIZED", "GENERATING", "VALIDATING", "COMPLETE", "VERIFIED", "FAILED", "FAIL_CLOSED"]);

export const FORECAST_VISUALIZATION_SECTIONS: readonly ForecastVisualizationSection[] = Object.freeze([
  "forecast overview",
  "mission impact",
  "dependency map",
  "projected timeline",
  "expected outcomes",
  "uncertainty indicators",
]);

function hash(value: unknown): string {
  return generateDecisionIntegrityHash(value);
}

function hashWithoutIntegrity(value: object): string {
  const copy = { ...value } as Record<string, unknown>;
  delete copy.integrity_hash;
  delete copy.ledger_integrity_hash;
  return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown);
}

function normalize(values: readonly string[]): readonly string[] {
  return Object.freeze([...new Set(values.filter((value) => value.length > 0))].sort());
}

function presentationHash(record: Omit<ForecastPresentation, "integrity_hash"> | ForecastPresentation): string {
  return hashWithoutIntegrity(record);
}

export function computeForecastPresentationHash(record: Omit<ForecastPresentation, "integrity_hash"> | ForecastPresentation): string {
  return presentationHash(record);
}

function missionImpactHash(record: Omit<MissionImpactRecord, "integrity_hash"> | MissionImpactRecord): string {
  return hashWithoutIntegrity(record);
}

export function computeMissionImpactRecordHash(record: Omit<MissionImpactRecord, "integrity_hash"> | MissionImpactRecord): string {
  return missionImpactHash(record);
}

function dependencyHash(record: Omit<DependencyImpactRecord, "integrity_hash"> | DependencyImpactRecord): string {
  return hashWithoutIntegrity(record);
}

export function computeDependencyImpactRecordHash(record: Omit<DependencyImpactRecord, "integrity_hash"> | DependencyImpactRecord): string {
  return dependencyHash(record);
}

function projectionHash(record: Omit<FutureStateProjection, "integrity_hash"> | FutureStateProjection): string {
  return hashWithoutIntegrity(record);
}

export function computeFutureStateProjectionHash(record: Omit<FutureStateProjection, "integrity_hash"> | FutureStateProjection): string {
  return projectionHash(record);
}

function visualizationHash(record: Omit<ForecastVisualizationModel, "integrity_hash"> | ForecastVisualizationModel): string {
  return hashWithoutIntegrity(record);
}

export function computeForecastVisualizationModelHash(record: Omit<ForecastVisualizationModel, "integrity_hash"> | ForecastVisualizationModel): string {
  return visualizationHash(record);
}

function validationHash(record: Omit<ForecastValidationResult, "integrity_hash"> | ForecastValidationResult): string {
  return hashWithoutIntegrity(record);
}

function ledgerHash(record: Omit<ForecastPresentationLedgerEntry, "ledger_integrity_hash"> | ForecastPresentationLedgerEntry): string {
  return hashWithoutIntegrity(record);
}

function packageObjectives(evidence: EvidenceRiskConfidenceResult): readonly string[] {
  return normalize([
    evidence.package_build_result.package.mission_id,
    evidence.package_build_result.package.orchestration_id,
  ]);
}

export function createMissionImpactRecord(evidence: EvidenceRiskConfidenceResult = summarizeEvidenceRiskConfidence()): MissionImpactRecord {
  const pkg = evidence.package_build_result.package;
  const base: Omit<MissionImpactRecord, "integrity_hash"> = {
    impact_id: `mission_impact_${pkg.package_id}`,
    mission_id: pkg.mission_id,
    impacted_objectives: packageObjectives(evidence),
    operational_effects: Object.freeze([pkg.forecast_summary, evidence.risk_record.operational_risk]),
    strategic_effects: Object.freeze([pkg.governance_summary, pkg.constitutional_summary]),
    projected_benefits: Object.freeze([pkg.recommended_option.summary]),
    projected_risks: Object.freeze([evidence.risk_record.overall_risk_profile, evidence.risk_record.recovery_risk]),
    impact_summary: `Forecast presented for ${pkg.package_id}: ${pkg.forecast_summary}`,
  };
  return Object.freeze({ ...base, integrity_hash: missionImpactHash(base) });
}

export function renderDependencyImpacts(evidence: EvidenceRiskConfidenceResult = summarizeEvidenceRiskConfidence()): readonly DependencyImpactRecord[] {
  const pkg = evidence.package_build_result.package;
  const records: readonly Omit<DependencyImpactRecord, "integrity_hash">[] = Object.freeze([
    {
      dependency_id: `dependency_decision_${pkg.package_id}`,
      package_id: pkg.package_id,
      affected_dependencies: normalize(pkg.alternative_options.map((option) => option.option_id)),
      dependency_type: "DECISION",
      dependency_effect: `Recommended option ${pkg.recommended_option.option_id} constrains alternatives: ${pkg.alternative_options.map((option) => option.label).join("; ")}.`,
      severity: "MEDIUM",
      mitigation_required: false,
    },
    {
      dependency_id: `dependency_governance_${pkg.package_id}`,
      package_id: pkg.package_id,
      affected_dependencies: normalize(pkg.approval_requirements),
      dependency_type: "GOVERNANCE",
      dependency_effect: pkg.authority_summary,
      severity: pkg.approval_requirements.length > 0 ? "MEDIUM" : "LOW",
      mitigation_required: pkg.operator_required_action !== "REVIEW_ONLY",
    },
    {
      dependency_id: `dependency_recovery_${pkg.package_id}`,
      package_id: pkg.package_id,
      affected_dependencies: normalize([pkg.rollback_guidance, pkg.recovery_guidance]),
      dependency_type: "RECOVERY",
      dependency_effect: evidence.risk_record.recovery_risk,
      severity: evidence.risk_record.overall_risk_profile,
      mitigation_required: evidence.risk_record.overall_risk_profile !== "LOW",
    },
  ]);
  return Object.freeze(records.map((record) => Object.freeze({ ...record, integrity_hash: dependencyHash(record) })));
}

export function projectFutureState(evidence: EvidenceRiskConfidenceResult = summarizeEvidenceRiskConfidence()): FutureStateProjection {
  const pkg = evidence.package_build_result.package;
  const base: Omit<FutureStateProjection, "integrity_hash"> = {
    projection_id: `future_state_${pkg.package_id}`,
    package_id: pkg.package_id,
    projected_state: pkg.forecast_summary,
    expected_conditions: Object.freeze([pkg.recovery_guidance, pkg.governance_summary, pkg.constitutional_summary]),
    timeline: Object.freeze([pkg.generated_timestamp, evidence.package_build_result.assembly_record.assembly_timestamp]),
    assumptions: Object.freeze([evidence.confidence_record.uncertainty_summary]),
    uncertainty_summary: evidence.confidence_record.forecast_confidence,
  };
  return Object.freeze({ ...base, integrity_hash: projectionHash(base) });
}

export function createForecastPresentation(
  evidence: EvidenceRiskConfidenceResult = summarizeEvidenceRiskConfidence(),
  missionImpact: MissionImpactRecord = createMissionImpactRecord(evidence),
  dependencyImpacts: readonly DependencyImpactRecord[] = renderDependencyImpacts(evidence),
  futureState: FutureStateProjection = projectFutureState(evidence),
): ForecastPresentation {
  const pkg = evidence.package_build_result.package;
  const base: Omit<ForecastPresentation, "integrity_hash"> = {
    presentation_id: `forecast_presentation_${pkg.package_id}`,
    package_id: pkg.package_id,
    orchestration_id: pkg.orchestration_id,
    mission_id: pkg.mission_id,
    tenant_id: pkg.tenant_id,
    forecast_summary: pkg.forecast_summary,
    projected_mission_impact: missionImpact.impact_summary,
    downstream_effects: Object.freeze(dependencyImpacts.map((item) => item.dependency_effect)),
    dependency_impacts: dependencyImpacts,
    future_state_projection: futureState,
    projected_outcomes: Object.freeze([pkg.recommended_option.summary, evidence.summary.risk_summary, evidence.summary.confidence_summary]),
    forecast_confidence: evidence.confidence_record.forecast_confidence,
    replay_ref: pkg.replay_ref,
    lineage_ref: pkg.lineage_ref,
    advisory_only: true,
  };
  return Object.freeze({ ...base, integrity_hash: presentationHash(base) });
}

export function buildForecastVisualizationModel(
  presentation: ForecastPresentation = createForecastPresentation(),
  futureState: FutureStateProjection = presentation.future_state_projection,
): ForecastVisualizationModel {
  const base: Omit<ForecastVisualizationModel, "integrity_hash"> = {
    visualization_id: `forecast_visualization_${presentation.presentation_id}`,
    package_id: presentation.package_id,
    sections: FORECAST_VISUALIZATION_SECTIONS,
    uncertainty_indicators: Object.freeze([presentation.forecast_confidence, futureState.uncertainty_summary]),
    dependency_map: Object.freeze(presentation.dependency_impacts.map((item) => `${item.dependency_type}:${item.dependency_id}`)),
    projected_timeline: futureState.timeline,
  };
  return Object.freeze({ ...base, integrity_hash: visualizationHash(base) });
}

function presentationFailures(input: {
  evidence: EvidenceRiskConfidenceResult;
  presentation: ForecastPresentation;
  missionImpact: MissionImpactRecord;
  dependencyImpacts: readonly DependencyImpactRecord[];
  futureState: FutureStateProjection;
  visualization: ForecastVisualizationModel;
  authorized: boolean;
}): readonly ForecastImpactPresentationFailureReason[] {
  const failures: ForecastImpactPresentationFailureReason[] = [];
  if (!input.authorized) failures.push("UNAUTHORIZED_FORECAST_PRESENTATION_ACCESS");
  if (input.evidence.summarization_status !== "PASS") failures.push("EVIDENCE_SUMMARY_INVALID");
  if (!input.presentation.forecast_summary) failures.push("FORECAST_SUMMARY_MISSING");
  if (!input.presentation.projected_mission_impact || !input.missionImpact.impact_summary) failures.push("MISSION_IMPACT_MISSING");
  if (input.dependencyImpacts.length === 0 || input.presentation.downstream_effects.length === 0 || input.visualization.dependency_map.length === 0) failures.push("DEPENDENCY_ANALYSIS_INCOMPLETE");
  if (!input.futureState.projected_state || input.futureState.expected_conditions.length === 0 || input.futureState.timeline.length === 0) failures.push("FUTURE_STATE_PROJECTION_MISSING");
  if (input.presentation.projected_outcomes.length === 0) failures.push("PROJECTED_OUTCOMES_MISSING");
  if (!input.presentation.forecast_confidence) failures.push("FORECAST_CONFIDENCE_MISSING");
  if (!input.presentation.replay_ref) failures.push("REPLAY_REFERENCE_MISSING");
  if (!input.presentation.lineage_ref) failures.push("LINEAGE_REFERENCE_MISSING");
  if (input.presentation.tenant_id !== input.evidence.summary.tenant_id || input.presentation.tenant_id !== input.evidence.package_build_result.package.tenant_id) failures.push("TENANT_MISMATCH");
  if (!input.presentation.advisory_only || !input.evidence.advisory_only) failures.push("ADVISORY_ONLY_VIOLATION");
  if (input.evidence.validation.validation_status !== "VALID" || input.evidence.quality_assessment.evidence_completeness !== "COMPLETE") failures.push("FORECAST_COMPLETENESS_UNVERIFIED");
  if (
    presentationHash(input.presentation) !== input.presentation.integrity_hash
    || missionImpactHash(input.missionImpact) !== input.missionImpact.integrity_hash
    || input.dependencyImpacts.some((item) => dependencyHash(item) !== item.integrity_hash)
    || projectionHash(input.futureState) !== input.futureState.integrity_hash
    || visualizationHash(input.visualization) !== input.visualization.integrity_hash
  ) failures.push("INTEGRITY_VERIFICATION_FAILED");
  return Object.freeze([...new Set(failures)] as ForecastImpactPresentationFailureReason[]);
}

function buildValidation(presentation: ForecastPresentation, failures: readonly ForecastImpactPresentationFailureReason[]): ForecastValidationResult {
  const has = (failure: ForecastImpactPresentationFailureReason) => failures.includes(failure);
  const base: Omit<ForecastValidationResult, "integrity_hash"> = {
    validation_id: `forecast_validation_${presentation.presentation_id}`,
    package_id: presentation.package_id,
    forecast_complete: !has("FORECAST_SUMMARY_MISSING") && !has("FORECAST_COMPLETENESS_UNVERIFIED"),
    impacts_complete: !has("MISSION_IMPACT_MISSING"),
    dependencies_complete: !has("DEPENDENCY_ANALYSIS_INCOMPLETE"),
    projections_complete: !has("FUTURE_STATE_PROJECTION_MISSING"),
    outcomes_complete: !has("PROJECTED_OUTCOMES_MISSING"),
    replay_present: !has("REPLAY_REFERENCE_MISSING") && !has("REPLAY_DIVERGENCE"),
    lineage_present: !has("LINEAGE_REFERENCE_MISSING"),
    integrity_valid: !has("INTEGRITY_VERIFICATION_FAILED"),
    validation_status: failures.length === 0 ? "VALID" : "REJECTED",
    validation_timestamp: NOW,
    failures,
  };
  return Object.freeze({ ...base, integrity_hash: validationHash(base) });
}

function writeLedger(presentation: ForecastPresentation, validation: ForecastValidationResult): readonly ForecastPresentationLedgerEntry[] {
  const base: Omit<ForecastPresentationLedgerEntry, "ledger_integrity_hash"> = {
    ledger_id: `forecast_presentation_ledger_${presentation.presentation_id}`,
    presentation_id: presentation.presentation_id,
    package_id: presentation.package_id,
    orchestration_id: presentation.orchestration_id,
    generation_timestamp: NOW,
    replay_ref: presentation.replay_ref,
    lineage_ref: presentation.lineage_ref,
    integrity_hash: presentation.integrity_hash,
    validation_status: validation.validation_status,
    append_only: true,
    deleted: false,
  };
  return Object.freeze([Object.freeze({ ...base, ledger_integrity_hash: ledgerHash(base) })]);
}

function resultReplayHash(result: Omit<ForecastImpactPresentationResult, "integrity_hash" | "replay_hash">): string {
  return hash({
    evidence_result: result.evidence_result,
    presentation: result.presentation,
    mission_impact: result.mission_impact,
    dependency_impacts: result.dependency_impacts,
    future_state_projection: result.future_state_projection,
    visualization_model: result.visualization_model,
    validation: result.validation,
    presentation_ledger: result.presentation_ledger,
    failures: result.failures,
  });
}

export function presentForecastImpact(input: ForecastImpactPresentationInput = {}): ForecastImpactPresentationResult {
  const evidence_result = input.evidence_result ?? summarizeEvidenceRiskConfidence();
  const mission_impact = input.mission_impact ?? createMissionImpactRecord(evidence_result);
  const dependency_impacts = input.dependency_impacts ?? renderDependencyImpacts(evidence_result);
  const future_state_projection = input.future_state_projection ?? projectFutureState(evidence_result);
  const presentation = input.presentation ?? createForecastPresentation(evidence_result, mission_impact, dependency_impacts, future_state_projection);
  const visualization_model = input.visualization_model ?? buildForecastVisualizationModel(presentation, future_state_projection);
  const initialFailures = presentationFailures({
    evidence: evidence_result,
    presentation,
    missionImpact: mission_impact,
    dependencyImpacts: dependency_impacts,
    futureState: future_state_projection,
    visualization: visualization_model,
    authorized: !input.authorized_component || input.authorized_component === AUTHORIZED_COMPONENT,
  });
  const validation = buildValidation(presentation, initialFailures);
  const ledger = writeLedger(presentation, validation);
  const ledgerFailures: readonly ForecastImpactPresentationFailureReason[] = ledger.every((entry) => ledgerHash(entry) === entry.ledger_integrity_hash && entry.append_only && !entry.deleted) ? [] : ["INTEGRITY_VERIFICATION_FAILED"];
  const finalFailures = Object.freeze([...new Set([...initialFailures, ...ledgerFailures])] as ForecastImpactPresentationFailureReason[]);
  const finalValidation = finalFailures.length === initialFailures.length ? validation : buildValidation(presentation, finalFailures);
  const finalLedger = finalValidation === validation ? ledger : writeLedger(presentation, finalValidation);
  const base: Omit<ForecastImpactPresentationResult, "integrity_hash" | "replay_hash"> = {
    presentation_status: finalValidation.validation_status === "VALID" ? "PASS" : "FAIL",
    fail_closed: finalValidation.failures.length > 0,
    evidence_result,
    presentation,
    mission_impact,
    dependency_impacts,
    future_state_projection,
    visualization_model,
    validation: finalValidation,
    presentation_ledger: finalLedger,
    failures: finalValidation.failures,
    deterministic: true,
    advisory_only: true,
  };
  const replay_hash = resultReplayHash(base);
  if (input.replay_expected_hash && input.replay_expected_hash !== replay_hash) {
    const replayFailures: readonly ForecastImpactPresentationFailureReason[] = Object.freeze(["REPLAY_DIVERGENCE"]);
    const replayValidation = buildValidation(presentation, replayFailures);
    const replayBase: Omit<ForecastImpactPresentationResult, "integrity_hash" | "replay_hash"> = {
      ...base,
      presentation_status: "FAIL",
      fail_closed: true,
      validation: replayValidation,
      presentation_ledger: Object.freeze([]),
      failures: replayFailures,
    };
    const mismatchHash = resultReplayHash(replayBase);
    return Object.freeze({ ...replayBase, replay_hash: mismatchHash, integrity_hash: hashWithoutIntegrity({ ...replayBase, replay_hash: mismatchHash }) });
  }
  return Object.freeze({ ...base, replay_hash, integrity_hash: hashWithoutIntegrity({ ...base, replay_hash }) });
}

export function replayForecastImpactPresentation(result: ForecastImpactPresentationResult): ForecastImpactPresentationReplay {
  const reconstructed = resultReplayHash(result);
  const replay_valid = reconstructed === result.replay_hash
    && presentationHash(result.presentation) === result.presentation.integrity_hash
    && missionImpactHash(result.mission_impact) === result.mission_impact.integrity_hash
    && result.dependency_impacts.every((item) => dependencyHash(item) === item.integrity_hash)
    && projectionHash(result.future_state_projection) === result.future_state_projection.integrity_hash
    && visualizationHash(result.visualization_model) === result.visualization_model.integrity_hash
    && validationHash(result.validation) === result.validation.integrity_hash
    && result.presentation_ledger.every((entry) => ledgerHash(entry) === entry.ledger_integrity_hash);
  const failures: ForecastImpactPresentationFailureReason[] = replay_valid ? [] : ["REPLAY_DIVERGENCE"];
  const base: Omit<ForecastImpactPresentationReplay, "integrity_hash"> = {
    replay_id: "replay_forecast_impact_presentation",
    replay_valid,
    presentation_id: result.presentation.presentation_id,
    package_id: result.presentation.package_id,
    dependency_refs: Object.freeze(result.dependency_impacts.map((item) => item.dependency_id)),
    projected_outcomes: result.presentation.projected_outcomes,
    expected_replay_hash: result.replay_hash,
    reconstructed_replay_hash: reconstructed,
    failures: Object.freeze(failures),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

export function buildForecastImpactPresentationObservability(result: ForecastImpactPresentationResult): ForecastImpactPresentationObservability {
  return Object.freeze({
    forecast_presentations_generated: result.presentation_status === "PASS" ? 1 : 0,
    mission_impacts_presented: result.validation.impacts_complete ? 1 : 0,
    dependency_impacts_documented: result.dependency_impacts.length,
    future_state_projections_generated: result.validation.projections_complete ? 1 : 0,
    projected_outcome_coverage: result.presentation.projected_outcomes.length,
    validation_failures: result.failures.length,
    replay_reproducibility: replayForecastImpactPresentation(result).replay_valid ? 1 : 0,
    integrity_verification_success: result.validation.integrity_valid ? 1 : 0,
    presentation_latency_ms: 0,
    fail_closed_activations: result.fail_closed ? 1 : 0,
  });
}

export function getForecastImpactPresentationFoundation(): ForecastImpactPresentationFoundation {
  const result = presentForecastImpact();
  const replay = replayForecastImpactPresentation(result);
  return Object.freeze({
    presenter_version: PRESENTER_VERSION,
    presentation_states: FORECAST_PRESENTATION_STATES,
    visualization_sections: FORECAST_VISUALIZATION_SECTIONS,
    result,
    replay,
    observability: buildForecastImpactPresentationObservability(result),
  });
}

export const ForecastImpactPresentation = Object.freeze({
  present: presentForecastImpact,
  replay: replayForecastImpactPresentation,
});
