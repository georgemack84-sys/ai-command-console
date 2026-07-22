export type RiskAdaptationLifecycleState =
  | "OBSERVED"
  | "EVIDENCE_COLLECTED"
  | "COMPARED"
  | "GAP_DETECTED"
  | "PROPOSED"
  | "VALIDATED"
  | "GOVERNANCE_REVIEW"
  | "SIMULATION"
  | "OPERATOR_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "CERTIFIED"
  | "ARCHIVED";

export type RiskAdaptationRecommendationType =
  | "SEVERITY_ADJUSTMENT"
  | "PROBABILITY_ADJUSTMENT"
  | "ESCALATION_REFINEMENT"
  | "ROLLBACK_REFINEMENT"
  | "GOVERNANCE_ESCALATION"
  | "ADDITIONAL_MONITORING"
  | "EVIDENCE_IMPROVEMENT"
  | "RISK_CLASSIFICATION_REFINEMENT"
  | "DOCUMENTATION_IMPROVEMENT"
  | "SIMULATION_REQUIREMENT";

export type RiskAdaptationDomain = "MISSION_RISK" | "GOVERNANCE_RISK" | "OPERATIONAL_RISK" | "FORECAST_RISK" | "RECOMMENDATION_RISK" | "STRATEGIC_RISK";
export type RiskAdaptationValidationState = "CERTIFIED" | "FAILED" | "PENDING_REPLAY" | "REJECTED";

export type RiskAdaptationFailure =
  | "SCHEMA_INVALID"
  | "EVIDENCE_MISSING"
  | "REPLAY_REFERENCES_MISSING"
  | "GOVERNANCE_METADATA_MISSING"
  | "CONSTITUTIONAL_METADATA_MISSING"
  | "AUTHORITY_METADATA_MISSING"
  | "SIMULATION_REQUIREMENT_MISSING"
  | "LINEAGE_INCOMPLETE"
  | "TENANT_ISOLATION_VIOLATED"
  | "INTEGRITY_HASH_MISMATCH"
  | "INVALID_STATE_TRANSITION"
  | "PRODUCTION_RISK_MODEL_MUTATION_DETECTED"
  | "AUTOMATIC_SEVERITY_UPDATE_DETECTED"
  | "AUTOMATIC_PROBABILITY_UPDATE_DETECTED"
  | "GOVERNANCE_THRESHOLD_MUTATION_DETECTED"
  | "SIMULATION_BYPASS_DETECTED"
  | "OPERATOR_BYPASS_DETECTED"
  | "HISTORICAL_RECORD_MUTATION_DETECTED"
  | "NONDETERMINISTIC_RECOMMENDATION"
  | "FAIL_OPEN_BEHAVIOR";

export type RiskAdaptationScenario =
  | "BASELINE"
  | "SEVERITY"
  | "PROBABILITY"
  | "ESCALATION"
  | "ROLLBACK"
  | "GOVERNANCE"
  | "MONITORING"
  | "EVIDENCE"
  | "CLASSIFICATION"
  | "DOCUMENTATION"
  | "SIMULATION"
  | "APPROVED"
  | "REJECTED"
  | "CERTIFIED"
  | "MISSING_SCHEMA"
  | "MISSING_EVIDENCE"
  | "MISSING_REPLAY"
  | "MISSING_GOVERNANCE"
  | "MISSING_CONSTITUTIONAL"
  | "MISSING_AUTHORITY"
  | "MISSING_SIMULATION"
  | "BROKEN_LINEAGE"
  | "CROSS_TENANT"
  | "HASH_MISMATCH"
  | "INVALID_TRANSITION"
  | "PRODUCTION_MUTATION"
  | "SEVERITY_UPDATE"
  | "PROBABILITY_UPDATE"
  | "GOVERNANCE_THRESHOLD_UPDATE"
  | "SIMULATION_BYPASS"
  | "OPERATOR_BYPASS"
  | "HISTORICAL_RECORD_MUTATION"
  | "NONDETERMINISTIC"
  | "FAIL_OPEN";

export type RiskAdaptationContract = Readonly<{
  adaptation_id: string;
  recommendation_id: string;
  tenant_id: string;
  mission_scope: string;
  risk_domain: RiskAdaptationDomain;
  recommendation_type: RiskAdaptationRecommendationType;
  adaptation_reason: string;
  historical_assessment_refs: readonly string[];
  actual_outcome_refs: readonly string[];
  supporting_evidence_refs: readonly string[];
  risk_gap_summary: string;
  recommended_adjustment: string;
  governance_status: "REQUIRED" | "PENDING_REVIEW" | "APPROVED" | "REJECTED";
  simulation_status: "REQUIRED" | "PENDING" | "PASSED" | "FAILED";
  operator_status: "OPERATOR_REVIEW_REQUIRED" | "APPROVED" | "REJECTED";
  constitutional_refs: readonly string[];
  authority_refs: readonly string[];
  replay_refs: readonly string[];
  lineage_refs: readonly string[];
  created_at: string;
  immutable: true;
  advisory_only: true;
  mutates_production_risk_model: false;
  updates_severity: false;
  updates_probability: false;
  changes_governance_thresholds: false;
  bypasses_simulation: false;
  bypasses_operator_approval: false;
  mutates_historical_records: false;
  integrity_hash: string;
}>;

export type RiskAdaptationLifecycle = Readonly<{
  lifecycle_id: string;
  current_state: RiskAdaptationLifecycleState;
  allowed_transitions: readonly RiskAdaptationLifecycleState[];
  rejected_terminal: boolean;
  no_backward_transitions: boolean;
  replay_only_reconstruction: boolean;
  integrity_hash: string;
}>;

export type RiskRecommendationPipeline = Readonly<{
  pipeline_id: string;
  stages: readonly string[];
  recommendation_type: RiskAdaptationRecommendationType;
  deterministic: true;
  replayable: true;
  integrity_hash: string;
}>;

export type RiskAdaptationValidation = Readonly<{
  validation_id: string;
  state: RiskAdaptationValidationState;
  certified: boolean;
  failures: readonly RiskAdaptationFailure[];
  schema_valid: boolean;
  evidence_complete: boolean;
  replay_complete: boolean;
  governance_complete: boolean;
  constitutional_complete: boolean;
  authority_complete: boolean;
  simulation_required: boolean;
  lineage_complete: boolean;
  tenant_isolated: boolean;
  deterministic: boolean;
  immutable_history: boolean;
  advisory_only: boolean;
  no_production_mutation: boolean;
  no_automatic_risk_update: boolean;
  no_governance_bypass: boolean;
  no_simulation_bypass: boolean;
  no_operator_bypass: boolean;
  no_historical_record_mutation: boolean;
  integrity_verified: boolean;
  integrity_hash: string;
}>;

export type RiskReplayFramework = Readonly<{
  replay_framework_id: string;
  replay_includes: readonly string[];
  reproduces_identical_recommendation: boolean;
  reproduces_identical_evidence: boolean;
  reproduces_identical_validation: boolean;
  reproduces_identical_governance: boolean;
  reproduces_identical_simulation: boolean;
  replay_refs: readonly string[];
  integrity_hash: string;
}>;

export type RiskAdaptationApiSurface = Readonly<{
  api_id: string;
  analyze_foundation: "POST /risk-adaptation-engine-foundation/analyze";
  retrieve_lifecycle: "POST /risk-adaptation-engine-foundation/lifecycle";
  retrieve_pipeline: "POST /risk-adaptation-engine-foundation/pipeline";
  retrieve_validation: "POST /risk-adaptation-engine-foundation/validation";
  retrieve_state_machine: "POST /risk-adaptation-engine-foundation/state-machine";
  retrieve_replay_framework: "POST /risk-adaptation-engine-foundation/replay-framework";
  retrieve_recommendations: "POST /risk-adaptation-engine-foundation/recommendations";
  retrieve_governance: "POST /risk-adaptation-engine-foundation/governance";
  retrieve_observability: "POST /risk-adaptation-engine-foundation/observability";
  replay_analysis: "POST /risk-adaptation-engine-foundation/replay";
  retrieve_contract: "GET /risk-adaptation-engine-foundation/contract";
  update_supported: false;
  delete_supported: false;
  production_risk_mutation_supported: false;
  automatic_risk_update_supported: false;
  governance_bypass_supported: false;
  simulation_bypass_supported: false;
  operator_bypass_supported: false;
  integrity_hash: string;
}>;

export type RiskAdaptationInput = Readonly<{
  scenario?: RiskAdaptationScenario;
}>;

export type RiskAdaptationFoundationResult = Readonly<{
  risk_adaptation_engine_foundation_version: "risk-adaptation-engine-foundation/v1";
  api_surface: RiskAdaptationApiSurface;
  contract: RiskAdaptationContract;
  lifecycle: RiskAdaptationLifecycle;
  pipeline: RiskRecommendationPipeline;
  replay_framework: RiskReplayFramework;
  validation: RiskAdaptationValidation;
  deterministic: true;
  replayable: true;
  explainable: boolean;
  evidence_backed: boolean;
  governance_visible: boolean;
  tenant_isolated: boolean;
  advisory_only: true;
  production_mutation_supported: false;
  automatic_risk_update_supported: false;
  governance_bypass_supported: false;
  simulation_bypass_supported: false;
  operator_bypass_supported: false;
  replay_hash: string;
  integrity_hash: string;
}>;

export type RiskAdaptationFoundation = Readonly<{
  risk_adaptation_engine_foundation_version: "risk-adaptation-engine-foundation/v1";
  api_surface: RiskAdaptationApiSurface;
  result: RiskAdaptationFoundationResult;
}>;
