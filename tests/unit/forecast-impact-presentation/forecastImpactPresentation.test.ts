import { describe, expect, it } from "vitest";
import { summarizeEvidenceRiskConfidence } from "@/services/evidence-risk-confidence-summarization";
import {
  FORECAST_PRESENTATION_STATES,
  FORECAST_VISUALIZATION_SECTIONS,
  buildForecastVisualizationModel,
  computeDependencyImpactRecordHash,
  computeForecastPresentationHash,
  computeForecastVisualizationModelHash,
  computeFutureStateProjectionHash,
  computeMissionImpactRecordHash,
  createForecastPresentation,
  createMissionImpactRecord,
  getForecastImpactPresentationFoundation,
  presentForecastImpact,
  projectFutureState,
  renderDependencyImpacts,
  replayForecastImpactPresentation,
} from "@/services/forecast-impact-presentation";

describe("Mission Control Phase 9.8.6 Forecast & Impact Presentation", () => {
  it("publishes the forecast impact presentation foundation", () => {
    const foundation = getForecastImpactPresentationFoundation();

    expect(foundation.presenter_version).toBe("forecast-impact-presentation/v1");
    expect(foundation.presentation_states).toEqual(FORECAST_PRESENTATION_STATES);
    expect(foundation.visualization_sections).toEqual(FORECAST_VISUALIZATION_SECTIONS);
    expect(foundation.result.presentation_status).toBe("PASS");
    expect(foundation.replay.replay_valid).toBe(true);
  });

  it("presents forecasts and impact deterministically without mutating upstream forecast text", () => {
    const first = presentForecastImpact();
    const second = presentForecastImpact();

    expect(first).toEqual(second);
    expect(first.presentation.forecast_summary).toBe(first.evidence_result.package_build_result.package.forecast_summary);
    expect(first.presentation.forecast_confidence).toBe(first.evidence_result.confidence_record.forecast_confidence);
    expect(first.presentation.projected_outcomes).toContain(first.evidence_result.summary.risk_summary);
    expect(first.validation.validation_status).toBe("VALID");
    expect(first.presentation_ledger).toHaveLength(1);
  });

  it("renders mission impacts, dependency impacts, future state, and visualization sections", () => {
    const result = presentForecastImpact();

    expect(result.mission_impact.impact_summary).toContain(result.presentation.package_id);
    expect(result.mission_impact.impacted_objectives).toContain(result.presentation.mission_id);
    expect(result.dependency_impacts.map((item) => item.dependency_type)).toEqual(["DECISION", "GOVERNANCE", "RECOVERY"]);
    expect(result.future_state_projection.projected_state).toBe(result.presentation.forecast_summary);
    expect(result.visualization_model.sections).toEqual(FORECAST_VISUALIZATION_SECTIONS);
    expect(result.visualization_model.dependency_map).toHaveLength(result.dependency_impacts.length);
  });

  it("fails closed when forecast, mission impact, dependencies, future state, outcomes, or confidence are missing", () => {
    const evidence = summarizeEvidenceRiskConfidence();
    const missionImpact = createMissionImpactRecord(evidence);
    const dependencies = renderDependencyImpacts(evidence);
    const futureState = projectFutureState(evidence);
    const presentation = createForecastPresentation(evidence, missionImpact, dependencies, futureState);
    const visualization = buildForecastVisualizationModel(presentation, futureState);

    expect(presentForecastImpact({ presentation: { ...presentation, forecast_summary: "", integrity_hash: computeForecastPresentationHash({ ...presentation, forecast_summary: "" }) } }).failures).toContain("FORECAST_SUMMARY_MISSING");
    expect(presentForecastImpact({ mission_impact: { ...missionImpact, impact_summary: "", integrity_hash: computeMissionImpactRecordHash({ ...missionImpact, impact_summary: "" }) } }).failures).toContain("MISSION_IMPACT_MISSING");
    expect(presentForecastImpact({ dependency_impacts: [] }).failures).toContain("DEPENDENCY_ANALYSIS_INCOMPLETE");
    expect(presentForecastImpact({ future_state_projection: { ...futureState, projected_state: "", integrity_hash: computeFutureStateProjectionHash({ ...futureState, projected_state: "" }) } }).failures).toContain("FUTURE_STATE_PROJECTION_MISSING");
    expect(presentForecastImpact({ presentation: { ...presentation, projected_outcomes: [], integrity_hash: computeForecastPresentationHash({ ...presentation, projected_outcomes: [] }) } }).failures).toContain("PROJECTED_OUTCOMES_MISSING");
    expect(presentForecastImpact({ presentation: { ...presentation, forecast_confidence: "", integrity_hash: computeForecastPresentationHash({ ...presentation, forecast_confidence: "" }) } }).failures).toContain("FORECAST_CONFIDENCE_MISSING");
    expect(presentForecastImpact({ visualization_model: { ...visualization, dependency_map: [], integrity_hash: computeForecastVisualizationModelHash({ ...visualization, dependency_map: [] }) } }).failures).toContain("DEPENDENCY_ANALYSIS_INCOMPLETE");
  });

  it("rejects replay gaps, lineage gaps, integrity tampering, tenant mismatch, and advisory-only violations", () => {
    const valid = presentForecastImpact();
    const presentation = valid.presentation;
    const dependency = valid.dependency_impacts[0]!;

    expect(presentForecastImpact({ presentation: { ...presentation, replay_ref: "", integrity_hash: computeForecastPresentationHash({ ...presentation, replay_ref: "" }) } }).failures).toContain("REPLAY_REFERENCE_MISSING");
    expect(presentForecastImpact({ presentation: { ...presentation, lineage_ref: "", integrity_hash: computeForecastPresentationHash({ ...presentation, lineage_ref: "" }) } }).failures).toContain("LINEAGE_REFERENCE_MISSING");
    expect(presentForecastImpact({ dependency_impacts: [{ ...dependency, dependency_effect: "tampered" }] }).failures).toContain("INTEGRITY_VERIFICATION_FAILED");
    expect(presentForecastImpact({ presentation: { ...presentation, tenant_id: "tenant_beta", integrity_hash: computeForecastPresentationHash({ ...presentation, tenant_id: "tenant_beta" }) } }).failures).toContain("TENANT_MISMATCH");
    expect(presentForecastImpact({ presentation: { ...presentation, advisory_only: false as true, integrity_hash: computeForecastPresentationHash({ ...presentation, advisory_only: false as true }) } }).failures).toContain("ADVISORY_ONLY_VIOLATION");
    expect(computeDependencyImpactRecordHash(dependency)).toBe(dependency.integrity_hash);
  });

  it("detects invalid upstream evidence, unauthorized access, and replay divergence", () => {
    const valid = presentForecastImpact();
    const badEvidence = { ...valid.evidence_result, summarization_status: "FAIL" as const };

    expect(presentForecastImpact({ evidence_result: badEvidence }).failures).toContain("EVIDENCE_SUMMARY_INVALID");
    expect(presentForecastImpact({ authorized_component: "unknown" }).failures).toContain("UNAUTHORIZED_FORECAST_PRESENTATION_ACCESS");
    expect(presentForecastImpact({ replay_expected_hash: `${valid.replay_hash}_wrong` }).failures).toContain("REPLAY_DIVERGENCE");
  });

  it("replays forecast impact presentations deterministically", () => {
    const result = presentForecastImpact();
    const replay = replayForecastImpactPresentation(result);
    const tampered = replayForecastImpactPresentation({ ...result, replay_hash: "tampered" });

    expect(replay.replay_valid).toBe(true);
    expect(replay.presentation_id).toBe(result.presentation.presentation_id);
    expect(replay.dependency_refs).toEqual(result.dependency_impacts.map((item) => item.dependency_id));
    expect(tampered.replay_valid).toBe(false);
    expect(tampered.failures).toContain("REPLAY_DIVERGENCE");
  });
});
