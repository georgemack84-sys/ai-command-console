import type { RecommendationEffectivenessCertificationGateResult } from "@/types/recommendation-effectiveness-certification-gate";

export type PatternType =
  | "RECOMMENDATION_FAILURE_PATTERN"
  | "RECOMMENDATION_SUCCESS_PATTERN"
  | "RISK_UNDERESTIMATION_PATTERN"
  | "RISK_OVERESTIMATION_PATTERN"
  | "CONFIDENCE_DRIFT_PATTERN"
  | "GOVERNANCE_BLOCKER_PATTERN"
  | "OPERATOR_OVERRIDE_PATTERN"
  | "EVIDENCE_GAP_PATTERN"
  | "MISSION_BOTTLENECK_PATTERN"
  | "DEPENDENCY_CONFLICT_PATTERN"
  | "SIMULATION_ERROR_PATTERN"
  | "ROLLBACK_PATTERN"
  | "STRATEGIC_OPPORTUNITY_PATTERN";

export type PatternLifecycleState = "DEFINED" | "EVIDENCE_COLLECTION" | "CANDIDATE" | "VALIDATED" | "CLASSIFIED" | "GOVERNANCE_REVIEW" | "CERTIFIED" | "ACTIVE" | "SUPERSEDED" | "ARCHIVED";
export type PatternEvidenceSource = "DECISION_HISTORY" | "RECOMMENDATION_HISTORY" | "OUTCOME_RECORDS" | "OUTCOME_NORMALIZATION" | "RECOMMENDATION_EFFECTIVENESS_ANALYSIS" | "RISK_ACTUALIZATION" | "CONFIDENCE_ACTUALIZATION" | "GOVERNANCE_OUTCOMES" | "OPERATOR_FEEDBACK" | "SIMULATION_RESULTS" | "REPLAY_RECORDS" | "TRUTH_LEDGER" | "PATTERN_LEDGER";
export type PatternContractStatus = "ACTIVE" | "FAILED" | "PENDING_EVIDENCE";

export type PatternContractFailure =
  | "PHASE_10_3_CERTIFICATION_REQUIRED"
  | "UNSUPPORTED_PATTERN_TYPE"
  | "UNSUPPORTED_EVIDENCE_SOURCE"
  | "MANDATORY_EVIDENCE_MISSING"
  | "RECURRENCE_THRESHOLD_NOT_MET"
  | "CONFIDENCE_CALCULATION_FAILED"
  | "GOVERNANCE_REVIEW_FAILED"
  | "CONSTITUTIONAL_RULE_VIOLATED"
  | "REPLAY_REFERENCES_MISSING"
  | "REPLAY_RECONSTRUCTION_FAILED"
  | "INTEGRITY_VERIFICATION_FAILED"
  | "TENANT_BOUNDARY_VIOLATED"
  | "OPERATOR_VISIBILITY_INCOMPLETE"
  | "INVALID_LIFECYCLE_TRANSITION"
  | "IDENTITY_MUTATION_DETECTED"
  | "AUTONOMOUS_LEARNING_DETECTED"
  | "HIDDEN_INTELLIGENCE_DETECTED"
  | "FAIL_OPEN_BEHAVIOR";

export type PatternContractScenario =
  | "BASELINE"
  | "PHASE_10_3_NOT_CERTIFIED"
  | "UNSUPPORTED_PATTERN"
  | "UNSUPPORTED_EVIDENCE"
  | "MISSING_EVIDENCE"
  | "LOW_RECURRENCE"
  | "CONFIDENCE_FAILURE"
  | "GOVERNANCE_FAILURE"
  | "CONSTITUTIONAL_FAILURE"
  | "MISSING_REPLAY"
  | "REPLAY_DIVERGENCE"
  | "HASH_MISMATCH"
  | "CROSS_TENANT"
  | "OPERATOR_VISIBILITY_GAP"
  | "INVALID_TRANSITION"
  | "IDENTITY_MUTATION"
  | "AUTONOMOUS_LEARNING"
  | "HIDDEN_INTELLIGENCE"
  | "FAIL_OPEN";

export type RecurrenceWindowRule = Readonly<{
  rule_id: string;
  minimum_observations: number;
  recurrence_window_days: number;
  minimum_frequency: number;
  temporal_consistency_required: true;
  deterministic_grouping: true;
}>;

export type ConfidenceRules = Readonly<{
  evidence_weight: number;
  recurrence_weight: number;
  statistical_weight: number;
  governance_weight: number;
  strategic_weight: number;
  minimum_overall_confidence: number;
  randomness_allowed: false;
}>;

export type PatternDetectionSchema = Readonly<{
  schema_version: "pattern-detection-schema/v1";
  pattern_type: PatternType;
  evidence_requirements: readonly PatternEvidenceSource[];
  recurrence_requirements: RecurrenceWindowRule;
  confidence_requirements: ConfidenceRules;
  governance_requirements: readonly string[];
  replay_requirements: readonly string[];
  validation_requirements: readonly string[];
  explainability_requirements: readonly string[];
  integrity_requirements: readonly string[];
  integrity_hash: string;
}>;

export type PatternIdentity = Readonly<{
  pattern_id: string;
  tenant_id: string;
  pattern_type: PatternType;
  lifecycle_state: PatternLifecycleState;
  evidence_refs: readonly string[];
  replay_refs: readonly string[];
  lineage_refs: readonly string[];
  recurrence_observations: number;
  confidence_score: number;
  immutable: true;
  integrity_hash: string;
}>;

export type PatternContract = Readonly<{
  contract_id: string;
  contract_version: "pattern-intelligence-contract/v1";
  contract_status: PatternContractStatus;
  supported_pattern_types: readonly PatternType[];
  minimum_support_threshold: number;
  minimum_recurrence_threshold: number;
  recurrence_window_rules: RecurrenceWindowRule;
  confidence_rules: ConfidenceRules;
  evidence_rules: readonly PatternEvidenceSource[];
  governance_rules: readonly string[];
  constitutional_rules: readonly string[];
  replay_requirements: readonly string[];
  replay_validation_rules: readonly string[];
  operator_visibility_rules: readonly string[];
  explainability_rules: readonly string[];
  tenant_isolation_rules: readonly string[];
  mission_scope_rules: readonly string[];
  advisory_only: true;
  fail_closed: true;
  integrity_hash: string;
}>;

export type PatternContractValidation = Readonly<{
  validation_id: string;
  valid: boolean;
  failures: readonly PatternContractFailure[];
  schema_valid: boolean;
  identity_immutable: boolean;
  evidence_sufficient: boolean;
  recurrence_valid: boolean;
  confidence_calculable: boolean;
  governance_validated: boolean;
  replay_validated: boolean;
  operator_visible: boolean;
  tenant_isolated: boolean;
  advisory_only: boolean;
  integrity_verified: boolean;
  integrity_hash: string;
}>;

export type PatternContractApiSurface = Readonly<{
  api_id: string;
  load_contract: "GET /pattern-intelligence-contract/contract";
  validate_contract: "POST /pattern-intelligence-contract/validate";
  validate_schema: "POST /pattern-intelligence-contract/schema";
  validate_replay: "POST /pattern-intelligence-contract/replay";
  validate_governance: "POST /pattern-intelligence-contract/governance";
  generate_identity: "POST /pattern-intelligence-contract/identity";
  update_supported: false;
  delete_supported: false;
  autonomous_learning_supported: false;
  cross_tenant_learning_supported: false;
  integrity_hash: string;
}>;

export type PatternContractInput = Readonly<{
  certification?: RecommendationEffectivenessCertificationGateResult;
  pattern_type?: PatternType;
  evidence_sources?: readonly PatternEvidenceSource[];
  scenario?: PatternContractScenario;
}>;

export type PatternContractResult = Readonly<{
  pattern_intelligence_contract_version: "pattern-intelligence-contract/v1";
  certification: RecommendationEffectivenessCertificationGateResult;
  api_surface: PatternContractApiSurface;
  contract: PatternContract;
  schema: PatternDetectionSchema;
  identity: PatternIdentity;
  validation: PatternContractValidation;
  deterministic: true;
  replayable: true;
  advisory_only: true;
  governance_first: true;
  autonomous_learning: false;
  autonomous_execution: false;
  modifies_recommendations: false;
  modifies_priorities: false;
  modifies_confidence: false;
  modifies_governance_policy: false;
  replay_hash: string;
  integrity_hash: string;
}>;

export type PatternContractFoundation = Readonly<{
  pattern_intelligence_contract_version: "pattern-intelligence-contract/v1";
  supported_pattern_types: readonly PatternType[];
  evidence_sources: readonly PatternEvidenceSource[];
  api_surface: PatternContractApiSurface;
  result: PatternContractResult;
}>;
