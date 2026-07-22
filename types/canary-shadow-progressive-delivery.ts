export type ProgressiveDeliveryOutcome = "PASS" | "CONDITIONAL_PASS" | "FAIL";
export type RolloutRecommendationOutcome = "CONTINUE" | "HOLD" | "REQUIRE_REVIEW" | "RECOMMEND_ROLLBACK" | "REQUIRE_REQUALIFICATION";
export type ExposureStage = "0%" | "1%" | "5%" | "10%" | "25%" | "50%" | "100%";
export type ProgressiveDeliveryFailure = "SHADOW_EXECUTION_NOT_ISOLATED" | "PRODUCTION_EFFECTS_NOT_PREVENTED" | "CANARY_ACTIVATION_NON_DETERMINISTIC" | "EXPOSURE_POLICIES_NOT_ENFORCED" | "PROGRESSIVE_ROLLOUT_NON_DETERMINISTIC" | "PERCENTAGE_EXPOSURE_UNBOUNDED" | "TENANT_SCOPED_ROLLOUT_NOT_ENFORCED" | "CAPABILITY_SCOPED_ACTIVATION_NOT_ENFORCED" | "PRODUCTION_COMPARISON_NOT_REPRODUCIBLE" | "DIVERGENCE_DETECTION_NON_DETERMINISTIC" | "ROLLBACK_RECOMMENDATION_NOT_REPRODUCIBLE" | "ADVISORY_BOUNDARY_BREACH" | "DEPLOYMENT_AUTHORITY_SEPARATION_BREACH" | "REPLAY_NON_DETERMINISTIC" | "AUDIT_LINEAGE_INCOMPLETE" | "EXPOSURE_HISTORY_MUTABLE" | "POLICY_VIOLATION_NOT_FAIL_CLOSED" | "UNSAFE_EXPANSION_NOT_BLOCKED" | "CERTIFICATION_LINEAGE_LOST" | "PRODUCTION_GOVERNANCE_NOT_MAINTAINED" | "NON_CONSTITUTIONAL_DELIVERY_WARNING";
export type ProgressiveDeliveryScenario = "BASELINE" | ProgressiveDeliveryFailure;

export type ProgressiveDeliveryInput = Readonly<{ scenario?: ProgressiveDeliveryScenario }>;

export type ShadowExecutionRecord = Readonly<{
  shadow_id: string;
  mirrored_requests: boolean;
  synthetic_response_generation: boolean;
  execution_isolation: boolean;
  production_comparison: boolean;
  replay_capture: boolean;
  divergence_detection: boolean;
  production_state_modified: false;
  external_side_effects_executed: false;
  replayable: boolean;
  evidence_refs: readonly string[];
  integrity_hash: string;
}>;

export type CanaryDeploymentRecord = Readonly<{
  canary_id: string;
  internal_canary: boolean;
  tenant_canary: boolean;
  capability_canary: boolean;
  environment_canary: boolean;
  operator_approved: boolean;
  governance_controlled_activation: boolean;
  failed_canary_blocks_expansion: boolean;
  deterministic: boolean;
  evidence_refs: readonly string[];
  integrity_hash: string;
}>;

export type ExposurePolicyRecord = Readonly<{
  policy_id: string;
  maximum_rollout: ExposureStage;
  approval_requirements: readonly string[];
  rollback_triggers: readonly string[];
  tenant_restrictions: readonly string[];
  capability_restrictions: readonly string[];
  safety_thresholds: readonly string[];
  governed: boolean;
  enforceable_constraints: boolean;
  integrity_hash: string;
}>;

export type ExposureDecisionRecord = Readonly<{
  decision_id: string;
  stages: readonly ExposureStage[];
  current_stage: ExposureStage;
  percentage_bounded: boolean;
  tenant_scoped: boolean;
  capability_scoped: boolean;
  policy_enforced: boolean;
  unsafe_expansion_blocked: boolean;
  deterministic_progression: boolean;
  immutable_history: boolean;
  integrity_hash: string;
}>;

export type ProductionComparisonRecord = Readonly<{
  comparison_id: string;
  output_consistency: boolean;
  latency_within_bounds: boolean;
  reliability_within_bounds: boolean;
  governance_behavior_consistent: boolean;
  replay_consistency: boolean;
  certification_expectations_met: boolean;
  operational_integrity: boolean;
  divergence_detected: boolean;
  deterministic: boolean;
  reproducible: boolean;
  integrity_hash: string;
}>;

export type RolloutRecommendationRecord = Readonly<{
  recommendation_id: string;
  outcome: RolloutRecommendationOutcome;
  risk_assessment_refs: readonly string[];
  rollback_evidence_refs: readonly string[];
  mission_control_initiates_rollback: false;
  deployment_authority_required: true;
  immutable: boolean;
  deterministic: boolean;
  replayable: boolean;
  integrity_hash: string;
}>;

export type ProgressiveReplayRecord = Readonly<{
  replay_id: string;
  rollout_stages_replayed: boolean;
  exposure_decisions_replayed: boolean;
  comparison_evidence_replayed: boolean;
  rollback_recommendations_replayed: boolean;
  approvals_replayed: boolean;
  policy_evaluations_replayed: boolean;
  audit_lineage_refs: readonly string[];
  deterministic: boolean;
  integrity_hash: string;
}>;

export type ProgressiveDeliveryCertificationTest = Readonly<{
  test_id: string;
  name: string;
  expected: "PASS";
  actual: ProgressiveDeliveryOutcome;
  passed: boolean;
  failure_reason: ProgressiveDeliveryFailure | null;
  evidence_refs: readonly string[];
  integrity_hash: string;
}>;

export type ProgressiveDeliveryCertificationRecord = Readonly<{
  certification_id: string;
  deployment_governance_ref: string;
  shadow_refs: readonly string[];
  canary_refs: readonly string[];
  exposure_refs: readonly string[];
  comparison_refs: readonly string[];
  recommendation_refs: readonly string[];
  replay_refs: readonly string[];
  certification_lineage_refs: readonly string[];
  outcome: ProgressiveDeliveryOutcome;
  integrity_hash: string;
}>;

export type ProgressiveDeliveryResult = Readonly<{
  phase_version: "canary-shadow-progressive-delivery/v15.5";
  phase_identifier: "CanaryShadowProgressiveDelivery";
  deployment_governance_ref: string;
  shadow_execution: ShadowExecutionRecord;
  canary: CanaryDeploymentRecord;
  exposure_policy: ExposurePolicyRecord;
  exposure_decision: ExposureDecisionRecord;
  comparison: ProductionComparisonRecord;
  recommendation: RolloutRecommendationRecord;
  replay: ProgressiveReplayRecord;
  certification_tests: readonly ProgressiveDeliveryCertificationTest[];
  certification_record: ProgressiveDeliveryCertificationRecord;
  failures: readonly ProgressiveDeliveryFailure[];
  outcome: ProgressiveDeliveryOutcome;
  replay_hash: string;
  integrity_hash: string;
}>;

export type ProgressiveDeliveryValidation = Readonly<{
  valid: boolean;
  outcome: ProgressiveDeliveryOutcome;
  shadow_valid: boolean;
  canary_valid: boolean;
  policy_valid: boolean;
  exposure_valid: boolean;
  comparison_valid: boolean;
  recommendation_valid: boolean;
  replay_valid: boolean;
  certification_valid: boolean;
  failures: readonly ProgressiveDeliveryFailure[];
  integrity_hash: string;
}>;

export type ProgressiveDeliveryBundle = Readonly<{
  doctrine: Readonly<{
    version: "canary-shadow-progressive-delivery/v15.5";
    upstream_phase: "deployment-orchestration-promotion-governance/v15.4";
    exposure_stages: readonly ExposureStage[];
    recommendation_outcomes: readonly RolloutRecommendationOutcome[];
    certification_outcomes: readonly ProgressiveDeliveryOutcome[];
  }>;
  result: ProgressiveDeliveryResult;
  validation: ProgressiveDeliveryValidation;
}>;
