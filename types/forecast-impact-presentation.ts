import type { EvidenceRiskConfidenceResult } from "@/types/evidence-risk-confidence-summarization";

export type ForecastPresentationState = "INITIALIZED" | "GENERATING" | "VALIDATING" | "COMPLETE" | "VERIFIED" | "FAILED" | "FAIL_CLOSED";

export type ForecastPresentation = Readonly<{
  presentation_id: string;
  package_id: string;
  orchestration_id: string;
  mission_id: string;
  tenant_id: string;
  forecast_summary: string;
  projected_mission_impact: string;
  downstream_effects: readonly string[];
  dependency_impacts: readonly DependencyImpactRecord[];
  future_state_projection: FutureStateProjection;
  projected_outcomes: readonly string[];
  forecast_confidence: string;
  replay_ref: string;
  lineage_ref: string;
  advisory_only: true;
  integrity_hash: string;
}>;

export type MissionImpactRecord = Readonly<{
  impact_id: string;
  mission_id: string;
  impacted_objectives: readonly string[];
  operational_effects: readonly string[];
  strategic_effects: readonly string[];
  projected_benefits: readonly string[];
  projected_risks: readonly string[];
  impact_summary: string;
  integrity_hash: string;
}>;

export type DependencyImpactRecord = Readonly<{
  dependency_id: string;
  package_id: string;
  affected_dependencies: readonly string[];
  dependency_type: "DECISION" | "WORKFLOW" | "MISSION" | "GOVERNANCE" | "RESOURCE" | "INFRASTRUCTURE" | "RECOVERY";
  dependency_effect: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "UNKNOWN";
  mitigation_required: boolean;
  integrity_hash: string;
}>;

export type FutureStateProjection = Readonly<{
  projection_id: string;
  package_id: string;
  projected_state: string;
  expected_conditions: readonly string[];
  timeline: readonly string[];
  assumptions: readonly string[];
  uncertainty_summary: string;
  integrity_hash: string;
}>;

export type ForecastVisualizationModel = Readonly<{
  visualization_id: string;
  package_id: string;
  sections: readonly ForecastVisualizationSection[];
  uncertainty_indicators: readonly string[];
  dependency_map: readonly string[];
  projected_timeline: readonly string[];
  integrity_hash: string;
}>;

export type ForecastVisualizationSection = "forecast overview" | "mission impact" | "dependency map" | "projected timeline" | "expected outcomes" | "uncertainty indicators";

export type ForecastValidationResult = Readonly<{
  validation_id: string;
  package_id: string;
  forecast_complete: boolean;
  impacts_complete: boolean;
  dependencies_complete: boolean;
  projections_complete: boolean;
  outcomes_complete: boolean;
  replay_present: boolean;
  lineage_present: boolean;
  integrity_valid: boolean;
  validation_status: "VALID" | "REJECTED";
  validation_timestamp: string;
  failures: readonly ForecastImpactPresentationFailureReason[];
  integrity_hash: string;
}>;

export type ForecastPresentationLedgerEntry = Readonly<{
  ledger_id: string;
  presentation_id: string;
  package_id: string;
  orchestration_id: string;
  generation_timestamp: string;
  replay_ref: string;
  lineage_ref: string;
  integrity_hash: string;
  validation_status: "VALID" | "REJECTED";
  append_only: true;
  deleted: false;
  ledger_integrity_hash: string;
}>;

export type ForecastImpactPresentationFailureReason =
  | "FORECAST_SUMMARY_MISSING"
  | "MISSION_IMPACT_MISSING"
  | "DEPENDENCY_ANALYSIS_INCOMPLETE"
  | "FUTURE_STATE_PROJECTION_MISSING"
  | "PROJECTED_OUTCOMES_MISSING"
  | "FORECAST_CONFIDENCE_MISSING"
  | "REPLAY_REFERENCE_MISSING"
  | "LINEAGE_REFERENCE_MISSING"
  | "INTEGRITY_VERIFICATION_FAILED"
  | "FORECAST_COMPLETENESS_UNVERIFIED"
  | "EVIDENCE_SUMMARY_INVALID"
  | "TENANT_MISMATCH"
  | "ADVISORY_ONLY_VIOLATION"
  | "UNAUTHORIZED_FORECAST_PRESENTATION_ACCESS"
  | "REPLAY_DIVERGENCE";

export type ForecastImpactPresentationInput = Readonly<{
  evidence_result?: EvidenceRiskConfidenceResult;
  presentation?: ForecastPresentation;
  mission_impact?: MissionImpactRecord;
  dependency_impacts?: readonly DependencyImpactRecord[];
  future_state_projection?: FutureStateProjection;
  visualization_model?: ForecastVisualizationModel;
  authorized_component?: string;
  replay_expected_hash?: string;
}>;

export type ForecastImpactPresentationResult = Readonly<{
  presentation_status: "PASS" | "FAIL";
  fail_closed: boolean;
  evidence_result: EvidenceRiskConfidenceResult;
  presentation: ForecastPresentation;
  mission_impact: MissionImpactRecord;
  dependency_impacts: readonly DependencyImpactRecord[];
  future_state_projection: FutureStateProjection;
  visualization_model: ForecastVisualizationModel;
  validation: ForecastValidationResult;
  presentation_ledger: readonly ForecastPresentationLedgerEntry[];
  replay_hash: string;
  failures: readonly ForecastImpactPresentationFailureReason[];
  deterministic: true;
  advisory_only: true;
  integrity_hash: string;
}>;

export type ForecastImpactPresentationReplay = Readonly<{
  replay_id: string;
  replay_valid: boolean;
  presentation_id: string;
  package_id: string;
  dependency_refs: readonly string[];
  projected_outcomes: readonly string[];
  expected_replay_hash: string;
  reconstructed_replay_hash: string;
  failures: readonly ForecastImpactPresentationFailureReason[];
  integrity_hash: string;
}>;

export type ForecastImpactPresentationObservability = Readonly<{
  forecast_presentations_generated: number;
  mission_impacts_presented: number;
  dependency_impacts_documented: number;
  future_state_projections_generated: number;
  projected_outcome_coverage: number;
  validation_failures: number;
  replay_reproducibility: number;
  integrity_verification_success: number;
  presentation_latency_ms: number;
  fail_closed_activations: number;
}>;

export type ForecastImpactPresentationFoundation = Readonly<{
  presenter_version: "forecast-impact-presentation/v1";
  presentation_states: readonly ForecastPresentationState[];
  visualization_sections: readonly ForecastVisualizationSection[];
  result: ForecastImpactPresentationResult;
  replay: ForecastImpactPresentationReplay;
  observability: ForecastImpactPresentationObservability;
}>;
