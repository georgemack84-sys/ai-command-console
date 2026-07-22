import type { FeedbackNormalizationEngineResult } from "@/types/feedback-normalization-engine";
import type { OverrideLearningAnalyzerResult } from "@/types/override-learning-analyzer";
import type { RejectionLearningAnalyzerResult } from "@/types/rejection-learning-analyzer";

export type CorrelationLifecycleStage =
  | "FEEDBACK"
  | "DECISION"
  | "RECOMMENDATION"
  | "OUTCOME"
  | "SIMULATION"
  | "REPLAY"
  | "ADAPTIVE_PROPOSAL";

export type CorrelationNodeType =
  | CorrelationLifecycleStage
  | "OPERATOR"
  | "MISSION"
  | "EVIDENCE"
  | "GOVERNANCE_REVIEW"
  | "CONFIDENCE_ASSESSMENT"
  | "PATTERN";

export type CorrelationEdgeType =
  | "GENERATED_BY"
  | "INFLUENCED"
  | "SUPPORTED_BY"
  | "VALIDATED_BY"
  | "REPLAYED_BY"
  | "SIMULATED_BY"
  | "REVIEWED_BY"
  | "RESULTED_IN"
  | "CONTRIBUTED_TO"
  | "REFERENCED_BY";

export type CorrelationOutcomeCategory =
  | "SUCCESSFUL_EXECUTION"
  | "PARTIAL_SUCCESS"
  | "UNSUCCESSFUL_EXECUTION"
  | "AVOIDED_FAILURE"
  | "UNEXPECTED_OUTCOME"
  | "MISSION_IMPROVEMENT"
  | "MISSION_DEGRADATION";

export type RecommendationCorrelationStatus = "ACCEPTED" | "REJECTED" | "OVERRIDDEN" | "MODIFIED" | "DEFERRED";
export type FeedbackEvidenceCorrelationState = "CORRELATED" | "REJECTED";

export type FeedbackEvidenceCorrelationFailure =
  | "FEEDBACK_REFERENCE_MISSING"
  | "DECISION_UNAVAILABLE"
  | "RECOMMENDATION_UNAVAILABLE"
  | "OUTCOME_UNAVAILABLE"
  | "REPLAY_LINEAGE_INCOMPLETE"
  | "EVIDENCE_UNAVAILABLE"
  | "GOVERNANCE_METADATA_INCOMPLETE"
  | "CORRELATION_RULE_VERSION_INVALID"
  | "NORMALIZED_FEEDBACK_REJECTED"
  | "TENANT_ISOLATION_FAILED"
  | "INTEGRITY_VERIFICATION_FAILED"
  | "PRODUCTION_MUTATION_ATTEMPT"
  | "ADAPTIVE_PROPOSAL_GENERATION_ATTEMPT";

export type FeedbackEvidenceCorrelationScenario =
  | "BASELINE"
  | "OVERRIDE_FEEDBACK"
  | "REJECTION_FEEDBACK"
  | "APPROVAL_FEEDBACK"
  | "SUCCESSFUL_EXECUTION"
  | "PARTIAL_SUCCESS"
  | "UNSUCCESSFUL_EXECUTION"
  | "AVOIDED_FAILURE"
  | "UNEXPECTED_OUTCOME"
  | "MISSION_IMPROVEMENT"
  | "MISSION_DEGRADATION"
  | "SIMULATION_VARIANCE"
  | "PATTERN_OVERRIDE"
  | "PATTERN_REJECTION"
  | "MISSING_FEEDBACK_REFERENCE"
  | "MISSING_DECISION"
  | "MISSING_RECOMMENDATION"
  | "MISSING_OUTCOME"
  | "MISSING_REPLAY_LINEAGE"
  | "MISSING_EVIDENCE"
  | "MISSING_GOVERNANCE_METADATA"
  | "INVALID_RULE_VERSION"
  | "NORMALIZATION_REJECTED"
  | "CROSS_TENANT"
  | "INTEGRITY_MISMATCH"
  | "PRODUCTION_MUTATION_ATTEMPT"
  | "ADAPTIVE_PROPOSAL_GENERATION_ATTEMPT";

export type CorrelationGraphNode = Readonly<{
  node_id: string;
  node_type: CorrelationNodeType;
  artifact_ref: string;
  tenant_id: string;
  immutable: true;
  versioned: true;
  replayable: true;
  integrity_hash: string;
}>;

export type CorrelationGraphEdge = Readonly<{
  edge_id: string;
  edge_type: CorrelationEdgeType;
  from_node_id: string;
  to_node_id: string;
  deterministic_rule: string;
  integrity_hash: string;
}>;

export type CorrelationGraph = Readonly<{
  graph_id: string;
  graph_version: "feedback-correlation-graph/v1";
  nodes: readonly CorrelationGraphNode[];
  edges: readonly CorrelationGraphEdge[];
  immutable: true;
  append_only: true;
  deterministic: true;
  replayable: true;
  tenant_isolated: true;
  explainable: true;
  integrity_hash: string;
}>;

export type LifecycleCorrelation = Readonly<{
  correlation_id: string;
  feedback_ref: string;
  decision_ref: string;
  recommendation_ref: string;
  outcome_ref: string;
  simulation_ref: string;
  replay_ref: string;
  adaptive_proposal_ref: string;
  recommendation_status: RecommendationCorrelationStatus;
  outcome_category: CorrelationOutcomeCategory;
  prediction_accuracy: number;
  scenario_coverage: number;
  variance_magnitude: number;
  simulation_usefulness: number;
  integrity_hash: string;
}>;

export type LineageRegistryRecord = Readonly<{
  lineage_id: string;
  feedback_id: string;
  decision_id: string;
  recommendation_id: string;
  evidence_refs: readonly string[];
  outcome_refs: readonly string[];
  simulation_refs: readonly string[];
  replay_refs: readonly string[];
  adaptive_proposal_refs: readonly string[];
  governance_refs: readonly string[];
  created_timestamp: string;
  schema_version: "feedback-evidence-lineage/v1";
  append_only: true;
  immutable: true;
  cryptographically_verifiable: true;
  integrity_hash: string;
}>;

export type FeedbackEvidenceCorrelationExplanation = Readonly<{
  explanation_id: string;
  why_feedback_was_submitted: string;
  lifecycle_point: CorrelationLifecycleStage;
  authenticated_operator: string;
  supporting_evidence_refs: readonly string[];
  operational_outcome: string;
  future_relevance: string;
  governance_context: string;
  replay_lineage: readonly string[];
  traceable: true;
  integrity_hash: string;
}>;

export type FeedbackEvidenceCorrelationAuditEvent = Readonly<{
  audit_event_id: string;
  event_type: "CORRELATION" | "DECISION_LINK" | "RECOMMENDATION_LINK" | "OUTCOME_LINK" | "SIMULATION_LINK" | "REPLAY_LINK" | "PATTERN_LINK" | "GRAPH_BUILD" | "LINEAGE_REGISTRY" | "REJECTION";
  outcome: string;
  recorded_at: string;
  append_only: true;
  immutable: true;
  integrity_hash: string;
}>;

export type FeedbackEvidenceCorrelationApiSurface = Readonly<{
  api_id: string;
  correlate_feedback_evidence: "POST /feedback-evidence-correlation/correlate";
  retrieve_graph: "POST /feedback-evidence-correlation/graph";
  retrieve_lineage: "POST /feedback-evidence-correlation/lineage";
  retrieve_decision_correlation: "POST /feedback-evidence-correlation/decision";
  retrieve_recommendation_correlation: "POST /feedback-evidence-correlation/recommendation";
  retrieve_outcome_correlation: "POST /feedback-evidence-correlation/outcome";
  retrieve_simulation_correlation: "POST /feedback-evidence-correlation/simulation";
  retrieve_replay_correlation: "POST /feedback-evidence-correlation/replay";
  retrieve_pattern_correlation: "POST /feedback-evidence-correlation/patterns";
  retrieve_explanation: "POST /feedback-evidence-correlation/explanation";
  retrieve_audit: "POST /feedback-evidence-correlation/audit";
  retrieve_contract: "GET /feedback-evidence-correlation/contract";
  normalization_supported: false;
  recommendation_analysis_supported: false;
  adaptive_proposal_generation_supported: false;
  production_mutation_supported: false;
  simulation_execution_supported: false;
  governance_override_supported: false;
  historical_evidence_mutation_supported: false;
  evidence_only: true;
  fail_open_supported: false;
  integrity_hash: string;
}>;

export type FeedbackEvidenceCorrelationInput = Readonly<{
  scenario?: FeedbackEvidenceCorrelationScenario;
  normalization_result?: FeedbackNormalizationEngineResult;
  override_learning_result?: OverrideLearningAnalyzerResult;
  rejection_learning_result?: RejectionLearningAnalyzerResult;
}>;

export type FeedbackEvidenceCorrelationResult = Readonly<{
  feedback_evidence_correlation_version: "feedback-evidence-correlation/v1";
  correlation_rule_version: "feedback-evidence-correlation-rules/v1";
  api_surface: FeedbackEvidenceCorrelationApiSurface;
  normalization_result: FeedbackNormalizationEngineResult;
  override_learning_result: OverrideLearningAnalyzerResult | null;
  rejection_learning_result: RejectionLearningAnalyzerResult | null;
  lifecycle_correlation: LifecycleCorrelation | null;
  graph: CorrelationGraph | null;
  lineage_registry_record: LineageRegistryRecord | null;
  explanation: FeedbackEvidenceCorrelationExplanation;
  audit_events: readonly FeedbackEvidenceCorrelationAuditEvent[];
  correlation_state: FeedbackEvidenceCorrelationState;
  failures: readonly FeedbackEvidenceCorrelationFailure[];
  replay_hash: string;
  integrity_hash: string;
  deterministic: true;
  replayable: boolean;
  explainable: true;
  tenant_isolated: boolean;
  evidence_lineage_complete: boolean;
  replay_lineage_complete: boolean;
  adaptive_proposal_traceable: boolean;
  evidence_only: true;
  immutable_lineage: true;
  append_only_audit: true;
  modifies_recommendations: false;
  generates_adaptive_proposals: false;
  executes_simulations: false;
  overrides_governance: false;
  alters_historical_evidence: false;
  changes_production_behavior: false;
}>;

export type FeedbackEvidenceCorrelationFoundation = Readonly<{
  feedback_evidence_correlation_version: "feedback-evidence-correlation/v1";
  api_surface: FeedbackEvidenceCorrelationApiSurface;
  result: FeedbackEvidenceCorrelationResult;
}>;
