export type ContinuousRiskIntelligenceOutcome = "PASS" | "CONDITIONAL_PASS" | "FAIL";
export type RiskCategory = "OPERATIONAL" | "GOVERNANCE" | "DEPENDENCY" | "REPLAY" | "CERTIFICATION" | "INFRASTRUCTURE";
export type RiskRecommendationOutcome = "CONTINUE_MONITORING" | "REQUIRE_OPERATOR_REVIEW" | "REQUIRE_GOVERNANCE_REVIEW" | "REQUIRE_CERTIFICATION_REVIEW" | "REQUIRE_REPLAY_VALIDATION" | "REQUIRE_DEPENDENCY_VALIDATION" | "REQUIRE_RESILIENCE_TESTING";
export type ContinuousRiskIntelligenceFailure =
  | "CONTINUOUS_RISK_EVALUATION_NOT_OPERATIONAL"
  | "OPERATIONAL_RISK_NOT_TRACKED"
  | "GOVERNANCE_RISK_NOT_TRACKED"
  | "DEPENDENCY_RISK_NOT_TRACKED"
  | "REPLAY_RISK_NOT_TRACKED"
  | "CERTIFICATION_RISK_NOT_TRACKED"
  | "INFRASTRUCTURE_RISK_NOT_TRACKED"
  | "RISK_RECOMMENDATIONS_NOT_DETERMINISTIC"
  | "RECOMMENDATIONS_NOT_EXPLAINABLE"
  | "EVIDENCE_INCOMPLETE"
  | "REPLAY_NOT_REPRODUCIBLE"
  | "IMMUTABLE_LINEAGE_NOT_VERIFIED"
  | "GOVERNANCE_NOT_PRESERVED"
  | "ADVISORY_BOUNDARY_NOT_ENFORCED"
  | "TENANT_ISOLATION_NOT_MAINTAINED"
  | "FAIL_CLOSED_NOT_VERIFIED"
  | "CONTINUOUS_RISK_INTELLIGENCE_NOT_CERTIFIED"
  | "PHASE_18_8_ADAPTIVE_GOVERNANCE_NOT_VALID"
  | "NON_CONSTITUTIONAL_RISK_WARNING";
export type ContinuousRiskIntelligenceScenario = "BASELINE" | ContinuousRiskIntelligenceFailure;
export type ContinuousRiskIntelligenceInput = Readonly<{ scenario?: ContinuousRiskIntelligenceScenario; tenant_id?: string; operator_id?: string; mission_id?: string; assessment_id?: string }>;

export type RiskAssessment = Readonly<{ assessment_id: string; evaluation_scope: string; assessment_timestamp: string; monitored_evidence_refs: readonly string[]; applicable_governance_refs: readonly string[]; dependency_refs: readonly string[]; replay_refs: readonly string[]; certification_refs: readonly string[]; operational_change_refs: readonly string[]; identified_risks: readonly RiskCategory[]; supporting_rationale: string; recommendation_set: readonly RiskRecommendationOutcome[]; confidence_evaluation: number; integrity_hash: string }>;
export type ContinuousRiskIntelligenceEngine = Readonly<{ engine_id: string; continuous_risk_evaluation: boolean; deterministic_scheduling: boolean; evidence_collection: boolean; recommendation_generation: boolean; replay_support: boolean; governance_integration: boolean; advisory_only: boolean; tenant_isolation: boolean; fail_closed: boolean; integrity_hash: string }>;
export type RiskDomainAnalyzer = Readonly<{ analyzer_id: string; category: RiskCategory; tracked: boolean; deterministic: boolean; observations: readonly string[]; score: number; evidence_refs: readonly string[]; integrity_hash: string }>;
export type RiskCorrelationEngine = Readonly<{ engine_id: string; cross_domain_correlation: boolean; cascading_risk_detection: boolean; dependency_chain_analysis: boolean; historical_comparisons: boolean; trend_analysis: boolean; constitutional_impact_assessment: boolean; deterministic: boolean; replayable: boolean; correlation_refs: readonly string[]; integrity_hash: string }>;
export type RiskRecommendation = Readonly<{ recommendation_id: string; outcome: RiskRecommendationOutcome; categories: readonly RiskCategory[]; contributing_evidence: readonly string[]; contributing_risks: readonly string[]; applicable_governance: readonly string[]; supporting_rationale: string; advisory_only: boolean; grants_operational_authority: boolean; explainable: boolean; integrity_hash: string }>;
export type RiskRecommendationGenerator = Readonly<{ generator_id: string; deterministic_recommendations: boolean; explainable_recommendations: boolean; advisory_only: boolean; recommendations: readonly RiskRecommendation[]; integrity_hash: string }>;
export type RiskEvidenceRegistry = Readonly<{ registry_id: string; monitored_events: readonly string[]; operational_metrics: readonly string[]; certification_references: readonly string[]; governance_records: readonly string[]; replay_references: readonly string[]; dependency_records: readonly string[]; operational_change_records: readonly string[]; historical_comparisons: readonly string[]; immutable_evidence: boolean; complete: boolean; integrity_hash: string }>;
export type RiskIntelligenceLedger = Readonly<{ ledger_id: string; assessments: readonly string[]; recommendations: readonly string[]; evidence: readonly string[]; superseding_assessments: readonly string[]; governance_actions: readonly string[]; operator_acknowledgements: readonly string[]; additive_only: boolean; immutable: boolean; integrity_hash: string }>;
export type ContinuousRiskCertificationPackage = Readonly<{ package_id: string; continuous_risk_evaluation_operational: boolean; operational_risk_tracked: boolean; governance_risk_tracked: boolean; dependency_risk_tracked: boolean; replay_risk_tracked: boolean; certification_risk_tracked: boolean; infrastructure_risk_tracked: boolean; risk_recommendations_deterministic: boolean; recommendations_explainable: boolean; evidence_complete: boolean; replay_reproducible: boolean; immutable_lineage_verified: boolean; governance_preserved: boolean; advisory_boundary_enforced: boolean; tenant_isolation_maintained: boolean; fail_closed_behavior_verified: boolean; continuous_risk_intelligence_certified: boolean; evidence_refs: readonly string[]; integrity_hash: string }>;
export type ContinuousRiskIntelligenceTest = Readonly<{ test_id: string; name: string; expected: "PASS"; actual: ContinuousRiskIntelligenceOutcome; passed: boolean; failure_reason: ContinuousRiskIntelligenceFailure | null; evidence_refs: readonly string[]; integrity_hash: string }>;

export type ContinuousRiskIntelligenceResult = Readonly<{ phase_version: "continuous-risk-intelligence/v18.9"; phase_identifier: "ContinuousRiskIntelligence"; adaptive_governance_ref: string; risk_engine: ContinuousRiskIntelligenceEngine; risk_analyzers: readonly RiskDomainAnalyzer[]; risk_correlation_engine: RiskCorrelationEngine; risk_assessment: RiskAssessment; recommendation_generator: RiskRecommendationGenerator; evidence_registry: RiskEvidenceRegistry; risk_ledger: RiskIntelligenceLedger; certification_package: ContinuousRiskCertificationPackage; certification_tests: readonly ContinuousRiskIntelligenceTest[]; failures: readonly ContinuousRiskIntelligenceFailure[]; outcome: ContinuousRiskIntelligenceOutcome; replay_hash: string; integrity_hash: string }>;
export type ContinuousRiskIntelligenceValidation = Readonly<{ valid: boolean; outcome: ContinuousRiskIntelligenceOutcome; engine_valid: boolean; analyzers_valid: boolean; correlation_valid: boolean; assessment_valid: boolean; recommendations_valid: boolean; evidence_valid: boolean; ledger_valid: boolean; certification_package_valid: boolean; certification_valid: boolean; result_replay_valid: boolean; failures: readonly ContinuousRiskIntelligenceFailure[]; integrity_hash: string }>;
export type ContinuousRiskIntelligenceBundle = Readonly<{ doctrine: Readonly<{ version: "continuous-risk-intelligence/v18.9"; upstream_phase: "adaptive-governance/v18.8"; risk_categories: readonly RiskCategory[]; recommendation_outcomes: readonly RiskRecommendationOutcome[]; certification_outcomes: readonly ContinuousRiskIntelligenceOutcome[] }>; result: ContinuousRiskIntelligenceResult; validation: ContinuousRiskIntelligenceValidation }>;
