export type AdaptationSimulationOutcome = "PASS" | "CONDITIONAL_PASS" | "FAIL";
export type SimulationResultOutcome = "PASS" | "PASS_WITH_WARNINGS" | "FAIL" | "REQUIRES_REVIEW" | "REQUIRES_MORE_EVIDENCE";
export type SimulationLifecycleState = "PROPOSED" | "REGISTERED" | "PREPARING" | "SIMULATING" | "VALIDATING" | "ANALYZED" | "RECORDED" | "QUALIFICATION_READY";
export type SimulationDomain = "OPERATIONAL_IMPACT" | "GOVERNANCE_IMPACT" | "REPLAY_IMPACT" | "TENANT_ISOLATION_IMPACT" | "RISK_IMPACT";
export type SimulationCategory = "OPERATIONAL" | "GOVERNANCE" | "REPLAY" | "TENANT_ISOLATION" | "RISK";
export type SimulationDivergence = "NONE" | "EXPECTED" | "BENEFICIAL" | "HARMFUL" | "GOVERNANCE_CRITICAL" | "TENANT_ISOLATION" | "REPLAY_INCONSISTENT" | "NONDETERMINISTIC" | "UNEXPLAINED";
export type AdaptationSimulationFailure =
  | "SIMULATIONS_NOT_DETERMINISTIC"
  | "EVIDENCE_NOT_REPRODUCIBLE"
  | "REPLAY_NOT_VERIFIED"
  | "GOVERNANCE_IMPACT_NOT_VALIDATED"
  | "OPERATIONAL_IMPACT_NOT_EXPLAINABLE"
  | "TENANT_ISOLATION_NOT_PRESERVED"
  | "RISK_ASSESSMENTS_NOT_REPRODUCIBLE"
  | "COUNTERFACTUAL_ANALYSIS_NOT_DETERMINISTIC"
  | "SIMULATION_LINEAGE_INCOMPLETE"
  | "QUALIFICATION_RECOMMENDATIONS_NOT_GOVERNED"
  | "SIMULATION_AUDIT_INCOMPLETE"
  | "ADAPTATION_SIMULATION_NOT_CERTIFIED"
  | "OPERATIONAL_HISTORY_MODIFIED"
  | "SIMULATION_EVIDENCE_MUTABLE"
  | "AUTHORITY_BOUNDARY_NOT_PRESERVED"
  | "FAIL_CLOSED_NOT_ENFORCED"
  | "PHASE_18_4_OPTIMIZATION_NOT_VALID"
  | "NON_CONSTITUTIONAL_SIMULATION_WARNING";
export type AdaptationSimulationScenario = "BASELINE" | AdaptationSimulationFailure;
export type AdaptationSimulationInput = Readonly<{ scenario?: AdaptationSimulationScenario; tenant_id?: string; operator_id?: string; mission_id?: string; simulation_id?: string; proposal_id?: string }>;

export type AdaptationSimulationEngine = Readonly<{ engine_id: string; deterministic_execution: boolean; adaptation_evaluation: boolean; reproducible_evidence_generation: boolean; baseline_comparison: boolean; governance_preservation_validation: boolean; replay_preservation_validation: boolean; tenant_isolation_validation: boolean; risk_evaluation: boolean; divergence_identification: boolean; qualification_support: boolean; advisory_only: boolean; fail_closed: boolean; integrity_hash: string }>;
export type OperationalImpactSimulator = Readonly<{ simulator_id: string; execution_latency_measured: boolean; operational_throughput_measured: boolean; monitoring_effectiveness_measured: boolean; optimization_effectiveness_measured: boolean; governance_overhead_measured: boolean; certification_impact_measured: boolean; resource_utilization_measured: boolean; metrics_evidentiary_only: boolean; explainable: boolean; integrity_hash: string }>;
export type CounterfactualSimulation = Readonly<{ framework_id: string; baseline_behavior_evaluated: boolean; proposed_behavior_evaluated: boolean; expected_improvements_evaluated: boolean; unintended_regressions_evaluated: boolean; operational_tradeoffs_evaluated: boolean; governance_implications_evaluated: boolean; certification_implications_evaluated: boolean; operational_history_modified: boolean; deterministic_analysis: boolean; integrity_hash: string }>;
export type SimulationEvidenceRecord = Readonly<{ simulation_id: string; proposal_id: string; simulation_category: SimulationCategory; operational_scope: string; baseline_refs: readonly string[]; simulated_refs: readonly string[]; replay_refs: readonly string[]; governance_refs: readonly string[]; evidence_refs: readonly string[]; observed_impacts: readonly string[]; risk_assessment: string; divergence_result: SimulationDivergence; simulation_outcome: SimulationResultOutcome; certification_lineage: readonly string[]; integrity_hash: string }>;
export type SimulationEvidenceRegistry = Readonly<{ registry_id: string; records: readonly SimulationEvidenceRecord[]; immutable_records: boolean; append_only: boolean; lifecycle: readonly SimulationLifecycleState[]; lineage_complete: boolean; audit_complete: boolean; integrity_hash: string }>;
export type SimulationGovernanceValidation = Readonly<{ validation_id: string; governance_before_approval: boolean; governance_impact_validated: boolean; constitutional_authority_preserved: boolean; policy_compliance: boolean; approval_requirements_validated: boolean; certification_effects_validated: boolean; tenant_isolation_preserved: boolean; replay_validated_before_qualification: boolean; integrity_hash: string }>;
export type SimulationReplayValidation = Readonly<{ validation_id: string; deterministic_replay: boolean; execution_ordering_verified: boolean; evidence_reconstruction_verified: boolean; replay_lineage_complete: boolean; replay_reproducible: boolean; integrity_hash: string }>;
export type SimulationRiskAssessment = Readonly<{ assessment_id: string; operational_risk: boolean; governance_risk: boolean; replay_risk: boolean; optimization_risk: boolean; failure_propagation: boolean; reproducible: boolean; harmful_divergence_blocks_qualification: boolean; integrity_hash: string }>;
export type QualificationRecommendation = Readonly<{ recommendation_id: string; simulation_refs: readonly string[]; governed: boolean; advisory_only: boolean; qualification_ready: boolean; outcome: "QUALIFICATION_READY" | "BLOCKED" | "REQUIRES_REVIEW"; blocking_divergences: readonly SimulationDivergence[]; integrity_hash: string }>;
export type AdaptationSimulationCertificationPackage = Readonly<{ package_id: string; simulations_deterministic: boolean; evidence_reproducible: boolean; replay_verified: boolean; governance_impact_validated: boolean; operational_impact_explainable: boolean; tenant_isolation_preserved: boolean; risk_assessments_reproducible: boolean; counterfactual_analysis_deterministic: boolean; simulation_lineage_complete: boolean; qualification_recommendations_governed: boolean; simulation_audit_complete: boolean; adaptation_simulation_certified: boolean; evidence_refs: readonly string[]; integrity_hash: string }>;
export type AdaptationSimulationTest = Readonly<{ test_id: string; name: string; expected: "PASS"; actual: AdaptationSimulationOutcome; passed: boolean; failure_reason: AdaptationSimulationFailure | null; evidence_refs: readonly string[]; integrity_hash: string }>;

export type AdaptationSimulationResult = Readonly<{ phase_version: "adaptation-simulation-engine/v18.5"; phase_identifier: "AdaptationSimulationEngine"; continuous_optimization_ref: string; simulation_engine: AdaptationSimulationEngine; impact_simulator: OperationalImpactSimulator; counterfactual_simulation: CounterfactualSimulation; evidence_registry: SimulationEvidenceRegistry; governance_validation: SimulationGovernanceValidation; replay_validation: SimulationReplayValidation; risk_assessment: SimulationRiskAssessment; qualification_recommendation: QualificationRecommendation; certification_package: AdaptationSimulationCertificationPackage; certification_tests: readonly AdaptationSimulationTest[]; failures: readonly AdaptationSimulationFailure[]; outcome: AdaptationSimulationOutcome; replay_hash: string; integrity_hash: string }>;
export type AdaptationSimulationValidation = Readonly<{ valid: boolean; outcome: AdaptationSimulationOutcome; engine_valid: boolean; impact_valid: boolean; counterfactual_valid: boolean; evidence_valid: boolean; governance_valid: boolean; replay_valid: boolean; risk_valid: boolean; qualification_valid: boolean; certification_package_valid: boolean; certification_valid: boolean; result_replay_valid: boolean; failures: readonly AdaptationSimulationFailure[]; integrity_hash: string }>;
export type AdaptationSimulationBundle = Readonly<{ doctrine: Readonly<{ version: "adaptation-simulation-engine/v18.5"; upstream_phase: "continuous-optimization-framework/v18.4"; lifecycle_states: readonly SimulationLifecycleState[]; simulation_domains: readonly SimulationDomain[]; simulation_categories: readonly SimulationCategory[]; simulation_outcomes: readonly SimulationResultOutcome[]; divergence_classes: readonly SimulationDivergence[]; certification_outcomes: readonly AdaptationSimulationOutcome[] }>; result: AdaptationSimulationResult; validation: AdaptationSimulationValidation }>;
