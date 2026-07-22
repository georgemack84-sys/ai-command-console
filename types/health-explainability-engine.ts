import type { MissionSubsystemId } from "@/types/mission-health-contract";
import type { MissionHealthTimeline } from "@/types/mission-health-timeline-engine";
import type { MissionTrendState } from "@/types/mission-trend-intelligence-engine";

export type HealthExplanationProcessingState = "RECEIVED_HEALTH_CHANGE" | "LOAD_PRIOR_HEALTH_STATE" | "LOAD_CURRENT_HEALTH_STATE" | "CALCULATE_SCORE_DELTA" | "IDENTIFY_CONTRIBUTING_SUBSYSTEMS" | "TRACE_METRIC_CHANGES" | "LINK_SUPPORTING_EVIDENCE" | "ANALYZE_CONFIDENCE" | "ANALYZE_TRENDS" | "BUILD_CAUSAL_CHAIN" | "PUBLISH_EXPLANATION" | "REJECTED";
export type HealthExplanationType = "HEALTH_INCREASE" | "HEALTH_DECREASE" | "CONFIDENCE_CHANGE" | "STABILITY_CHANGE" | "READINESS_CHANGE" | "DEGRADATION_EVENT" | "RECOVERY_EVENT" | "SYSTEMIC_RISK" | "ANOMALY_DETECTED" | "CERTIFICATION_EXPLANATION";
export type SubsystemAttributionCategory = "PRIMARY_CAUSE" | "SECONDARY_CAUSE" | "CONTRIBUTING_FACTOR" | "CORRELATED_SIGNAL" | "NO_MATERIAL_IMPACT";
export type CausalCategory = "DIRECT_CAUSE" | "INDIRECT_CAUSE" | "SYSTEMIC_CAUSE" | "CORRELATED_CAUSE" | "INSUFFICIENT_CAUSAL_EVIDENCE";
export type HealthExplanationConfidenceState = "VERY_HIGH" | "HIGH" | "MEDIUM" | "LOW" | "VERY_LOW" | "INSUFFICIENT";

export type HealthExplainabilityScenario =
  | "BASELINE"
  | "HEALTH_INCREASE"
  | "MISSING_PRIOR_STATE"
  | "MISSING_CURRENT_STATE"
  | "UNREPRODUCIBLE_SCORE_DELTA"
  | "INCONSISTENT_ATTRIBUTION"
  | "MISSING_EVIDENCE"
  | "MISSING_REPLAY_REFERENCE"
  | "BROKEN_LINEAGE"
  | "INTEGRITY_FAILURE"
  | "UNSUPPORTED_CAUSAL_CHAIN"
  | "TENANT_VIOLATION"
  | "GOVERNANCE_VIOLATION"
  | "AUTHORITY_VIOLATION"
  | "ADVISORY_ONLY_VIOLATION";

export type HealthExplainabilityFailure =
  | "EXPLANATION_CONTRACT_INVALID"
  | "PRIOR_HEALTH_STATE_MISSING"
  | "CURRENT_HEALTH_STATE_MISSING"
  | "SCORE_DELTA_UNREPRODUCIBLE"
  | "SUBSYSTEM_ATTRIBUTION_INCONSISTENT"
  | "EVIDENCE_TRACE_INCOMPLETE"
  | "REPLAY_REFERENCE_MISSING"
  | "LINEAGE_BROKEN"
  | "INTEGRITY_INVALID"
  | "CAUSAL_CHAIN_UNSUPPORTED"
  | "DEPENDENCY_GRAPH_NONDETERMINISTIC"
  | "CONFIDENCE_EXPLANATION_INVALID"
  | "TREND_INFLUENCE_UNREPRODUCIBLE"
  | "GOVERNANCE_INVALID"
  | "CONSTITUTIONAL_INVALID"
  | "AUTHORITY_INVALID"
  | "TENANT_ISOLATION_INVALID"
  | "ADVISORY_ONLY_VIOLATION";

export type ScoreDecomposition = Readonly<{
  prior_score: number;
  current_score: number;
  score_delta: number;
  weighted_subsystem_impact: number;
  confidence_adjustment: number;
  readiness_adjustment: number;
  stability_influence: number;
  trend_influence: number;
  degradation_severity_impact: number;
  decomposition_hash: string;
}>;

export type SubsystemAttribution = Readonly<{
  subsystem: MissionSubsystemId;
  previous_score: number;
  current_score: number;
  delta: number;
  weighted_impact: number;
  category: SubsystemAttributionCategory;
  evidence_reference: string;
  attribution_hash: string;
}>;

export type MetricChange = Readonly<{
  metric_name: string;
  previous_value: number | string;
  current_value: number | string;
  delta: number;
  subsystem: MissionSubsystemId | "mission";
  severity: string;
  evidence_reference: string;
  confidence: number;
  metric_change_hash: string;
}>;

export type ConfidenceAssessment = Readonly<{
  confidence_state: HealthExplanationConfidenceState;
  evidence_quality: number;
  subsystem_confidence: number;
  replay_certainty: number;
  integrity_verification: number;
  trend_stability: number;
  historical_consistency: number;
  incomplete_signal_count: number;
  confidence_hash: string;
}>;

export type TrendInfluence = Readonly<{
  previous_trend: MissionTrendState;
  current_trend: MissionTrendState;
  trend_direction: string;
  trend_duration: string;
  degradation_velocity: number;
  recovery_velocity: number;
  confidence_movement: number;
  subsystem_volatility: number;
  recurring_degradation: boolean;
  trend_influence_hash: string;
}>;

export type EvidenceTraceItem = Readonly<{
  evidence_id: string;
  subsystem: MissionSubsystemId | "mission";
  metric: string;
  value: number | string;
  source: string;
  timestamp: string;
  lineage_reference: string;
  replay_reference: string;
  integrity_hash: string;
}>;

export type EvidenceTrace = Readonly<{
  trace_id: string;
  explanation_id: string;
  evidence_items: readonly EvidenceTraceItem[];
  trace_hash: string;
}>;

export type DependencyGraph = Readonly<{
  graph_id: string;
  nodes: readonly string[];
  edges: readonly string[];
  graph_hash: string;
}>;

export type CausalExplanation = Readonly<{
  causal_chain_id: string;
  causal_category: CausalCategory;
  root_cause: string;
  intermediate_causes: readonly string[];
  affected_subsystems: readonly MissionSubsystemId[];
  affected_metrics: readonly string[];
  causal_confidence: number;
  supporting_evidence: readonly string[];
  alternative_explanations: readonly string[];
  rejected_explanations: readonly string[];
  replay_reference: string;
  causal_hash: string;
}>;

export type OperatorHealthExplanation = Readonly<{
  summary: string;
  primary_reason: string;
  affected_subsystems: readonly MissionSubsystemId[];
  severity: string;
  confidence: HealthExplanationConfidenceState;
  evidence_summary: string;
  trend_summary: string;
  recommended_review: string;
  no_autonomous_action_taken: true;
  report_hash: string;
}>;

export type HealthExplanation = Readonly<{
  explanation_id: string;
  mission_id: string;
  tenant_id: string;
  health_score_id: string;
  prior_health_score_id: string;
  current_health_score: number;
  previous_health_score: number;
  score_delta: number;
  explanation_type: HealthExplanationType;
  processing_state: HealthExplanationProcessingState;
  primary_cause: string;
  contributing_subsystems: readonly SubsystemAttribution[];
  changed_metrics: readonly MetricChange[];
  confidence_assessment: ConfidenceAssessment;
  trend_influence: TrendInfluence;
  evidence_trace: EvidenceTrace;
  dependency_graph_reference: string;
  dependency_graph: DependencyGraph;
  causal_chain: CausalExplanation;
  score_decomposition: ScoreDecomposition;
  operator_summary: OperatorHealthExplanation;
  governance_reference: string;
  lineage_reference: string;
  replay_reference: string;
  integrity_hash: string;
  timestamp: string;
  contract_version: "health-explainability-engine/v8ALT.4.6";
  source_timeline: MissionHealthTimeline;
  advisory_only: true;
  intervention_executed: boolean;
  mission_health_modified: boolean;
  evidence_modified: boolean;
  timeline_rewritten: boolean;
  governance_bypassed: boolean;
  recovery_approved: boolean;
  authority_escalated: boolean;
  explanation_hash: string;
}>;

export type HealthExplainabilityInput = Readonly<{
  scenario?: HealthExplainabilityScenario;
  mission_id?: string;
  tenant_id?: string;
  timeline?: MissionHealthTimeline;
}>;

export type HealthExplanationValidationResult = Readonly<{
  explanation_id: string | null;
  valid: boolean;
  explanation_contract_valid: boolean;
  prior_state_exists: boolean;
  current_state_exists: boolean;
  score_delta_reproducible: boolean;
  subsystem_attribution_deterministic: boolean;
  evidence_trace_complete: boolean;
  confidence_explanation_valid: boolean;
  trend_influence_reproducible: boolean;
  dependency_graph_deterministic: boolean;
  causal_explanation_replayable: boolean;
  lineage_preserved: boolean;
  replay_references_present: boolean;
  integrity_hashes_valid: boolean;
  governance_valid: boolean;
  constitutional_valid: boolean;
  authority_valid: boolean;
  tenant_isolated: boolean;
  advisory_only_behavior_enforced: boolean;
  failures: readonly HealthExplainabilityFailure[];
  validation_hash: string;
}>;

export type HealthExplanationReplayResult = Readonly<{
  replay_reference: string;
  explanation_id: string;
  deterministic: boolean;
  reconstructed_hash: string;
  original_hash: string;
  replay_result_hash: string;
}>;

export type HealthExplainabilityObservabilitySurface = Readonly<{
  explanation_id: string;
  mission_id: string;
  tenant_id: string;
  explanation_type: HealthExplanationType;
  score_delta: number;
  primary_cause: string;
  affected_subsystem_count: number;
  evidence_item_count: number;
  advisory_only: true;
  explanation_hash: string;
}>;

export type HealthExplainabilityEngineContract = Readonly<{
  doctrine: Readonly<{
    engine_version: "health-explainability-engine/v8ALT.4.6";
    principles: readonly string[];
    processing_states: readonly HealthExplanationProcessingState[];
    explanation_types: readonly HealthExplanationType[];
    attribution_categories: readonly SubsystemAttributionCategory[];
    causal_categories: readonly CausalCategory[];
    confidence_states: readonly HealthExplanationConfidenceState[];
    advisory_only: true;
  }>;
  explanation: HealthExplanation;
  validation: HealthExplanationValidationResult;
  replay: HealthExplanationReplayResult;
  observability: HealthExplainabilityObservabilitySurface;
}>;
