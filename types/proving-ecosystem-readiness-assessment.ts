export type EcosystemReadinessDecision = "READY" | "READY_WITH_LIMITATIONS" | "CONDITIONALLY_READY" | "NOT_READY";
export type ReadinessDimension = "TECHNICAL" | "OPERATIONAL" | "TRUST" | "VALIDATION" | "GOVERNANCE" | "CONSUMER";
export type ReadinessFailure =
  | "P6_15_EVIDENCE_LEDGER_INVALID"
  | "ECOSYSTEM_READINESS_EVALUATOR_MISSING"
  | "PLATFORM_READINESS_INCOMPLETE"
  | "APPLICATION_READINESS_INCOMPLETE"
  | "GOVERNANCE_READINESS_INCOMPLETE"
  | "TRUST_READINESS_INCOMPLETE"
  | "INTEROPERABILITY_READINESS_INCOMPLETE"
  | "VALIDATION_COMPLETENESS_INSUFFICIENT"
  | "OPERATIONAL_READINESS_ASSESSOR_MISSING"
  | "OPERATIONAL_WORKFLOWS_INCOMPLETE"
  | "MISSION_EXECUTION_UNPREPARED"
  | "DEPLOYMENT_PROCEDURES_INCOMPLETE"
  | "RECOVERY_CAPABILITY_INSUFFICIENT"
  | "OPERATOR_PREPAREDNESS_INSUFFICIENT"
  | "GOVERNANCE_PREPAREDNESS_INSUFFICIENT"
  | "DEPLOYMENT_READINESS_ASSESSOR_MISSING"
  | "DEPLOYMENT_EVIDENCE_INCOMPLETE"
  | "INFRASTRUCTURE_READINESS_INCOMPLETE"
  | "CONFIGURATION_READINESS_INCOMPLETE"
  | "SCALABILITY_READINESS_INSUFFICIENT"
  | "FAILOVER_CAPABILITY_INSUFFICIENT"
  | "MONITORING_READINESS_INSUFFICIENT"
  | "CONSUMER_READINESS_ASSESSOR_MISSING"
  | "USABILITY_READINESS_INSUFFICIENT"
  | "DOCUMENTATION_INCOMPLETE"
  | "OPERATIONAL_GUIDANCE_INCOMPLETE"
  | "SUPPORT_READINESS_INSUFFICIENT"
  | "GOVERNANCE_TRANSPARENCY_INSUFFICIENT"
  | "EXPLAINABILITY_INSUFFICIENT"
  | "ONBOARDING_READINESS_INSUFFICIENT"
  | "MATURITY_ASSESSOR_MISSING"
  | "MATURITY_LEVEL_INSUFFICIENT"
  | "ECOSYSTEM_HEALTH_ASSESSOR_MISSING"
  | "VALIDATION_SUCCESS_DEGRADED"
  | "OPERATIONAL_STABILITY_DEGRADED"
  | "REPLAY_CONSISTENCY_DEGRADED"
  | "TRUST_STABILITY_DEGRADED"
  | "CERTIFICATION_HEALTH_DEGRADED"
  | "DEPENDENCY_HEALTH_DEGRADED"
  | "EVIDENCE_FRESHNESS_DEGRADED"
  | "GAP_ANALYSIS_MISSING"
  | "READINESS_GAPS_UNDOCUMENTED"
  | "RECOMMENDATION_ENGINE_MISSING"
  | "READINESS_REPORT_MISSING"
  | "EVIDENCE_LINEAGE_UNVERIFIED"
  | "ASSESSMENT_PACKAGE_MISSING";
export type ReadinessScenario = "BASELINE" | "READY_WITH_LIMITATIONS" | "CONDITIONAL_FOLLOWUP" | ReadinessFailure;
export type EcosystemReadinessInput = Readonly<{ scenario?: ReadinessScenario; seed?: string }>;
export type EcosystemReadinessAssessment = Readonly<{ assessment_id: string; dimensions: readonly ReadinessDimension[]; platform_readiness: boolean; application_readiness: boolean; operational_readiness: boolean; governance_readiness: boolean; trust_readiness: boolean; interoperability_readiness: boolean; validation_completeness: boolean; overall_score: number; integrity_hash: string }>;
export type OperationalReadinessReport = Readonly<{ report_id: string; operational_workflows: boolean; mission_execution: boolean; deployment_procedures: boolean; recovery_capability: boolean; operator_preparedness: boolean; governance_preparedness: boolean; score: number; integrity_hash: string }>;
export type DeploymentReadinessReport = Readonly<{ report_id: string; deployment_evidence: boolean; infrastructure_readiness: boolean; configuration_readiness: boolean; scalability: boolean; failover_capability: boolean; monitoring_readiness: boolean; deployment_eligible: boolean; score: number; integrity_hash: string }>;
export type ConsumerReadinessReport = Readonly<{ report_id: string; usability: boolean; documentation: boolean; operational_guidance: boolean; support_readiness: boolean; governance_transparency: boolean; explainability: boolean; onboarding_readiness: boolean; score: number; integrity_hash: string }>;
export type MaturityAssessment = Readonly<{ assessment_id: string; maturity_level: 1 | 2 | 3 | 4 | 5; governance_maturity: boolean; operational_maturity: boolean; validation_maturity: boolean; trust_maturity: boolean; certification_maturity: boolean; interoperability_maturity: boolean; automation_maturity: boolean; integrity_hash: string }>;
export type EcosystemHealthReport = Readonly<{ report_id: string; validation_success: boolean; operational_stability: boolean; replay_consistency: boolean; trust_stability: boolean; certification_health: boolean; dependency_health: boolean; evidence_freshness: boolean; health_score: number; integrity_hash: string }>;
export type ReadinessGapReport = Readonly<{ report_id: string; missing_evidence: readonly string[]; incomplete_validation: readonly string[]; interoperability_gaps: readonly string[]; deployment_blockers: readonly string[]; maturity_gaps: readonly string[]; operational_risks: readonly string[]; gaps_documented: boolean; integrity_hash: string }>;
export type ReadinessRecommendations = Readonly<{ recommendation_id: string; additional_validation: readonly string[]; additional_benchmarking: readonly string[]; operational_improvements: readonly string[]; certification_updates: readonly string[]; governance_improvements: readonly string[]; deployment_sequencing: readonly string[]; published: boolean; integrity_hash: string }>;
export type ReadinessEvidencePackage = Readonly<{ package_id: string; validation_ledger: string; qualification_evidence: string; evidence_lineage_verified: boolean; immutable_evidence: boolean; cross_program_evidence_integrated: boolean; p617_ready: boolean; integrity_hash: string }>;
export type OperationalReadinessDecision = Readonly<{ decision_id: string; decision: EcosystemReadinessDecision; deployment_recommended: boolean; consumer_adoption_recommended: boolean; ecosystem_expansion_recommended: boolean; program_qualification_evidence_ready: boolean; does_not_replace_upstream_decisions: boolean; rationale: readonly string[]; integrity_hash: string }>;
export type EcosystemReadinessGates = Readonly<{ gate_id: string; ecosystem_gate: boolean; operational_gate: boolean; deployment_gate: boolean; consumer_gate: boolean; maturity_gate: boolean; health_gate: boolean; gap_gate: boolean; recommendation_gate: boolean; evidence_gate: boolean; report_gate: boolean; passed: boolean; integrity_hash: string }>;
export type EcosystemReadinessStatus = Readonly<{ readiness_id: string; decision: EcosystemReadinessDecision; phase_ready: boolean; ecosystem_ready: boolean; operational_ready: boolean; deployment_ready: boolean; consumer_ready: boolean; maturity_ready: boolean; health_ready: boolean; gaps_ready: boolean; recommendations_ready: boolean; evidence_ready: boolean; gates_passed: boolean; failures: readonly ReadinessFailure[]; integrity_hash: string }>;
export type EcosystemReadinessResult = Readonly<{ phase_version: "proving-ecosystem-readiness-assessment/v6.16"; phase_identifier: "ProvingEcosystemReadinessAssessment"; evidence_ledger_ref: "proving-evidence-aggregation-qualification-ledger/v6.15"; ecosystem_assessment: EcosystemReadinessAssessment; operational_report: OperationalReadinessReport; deployment_report: DeploymentReadinessReport; consumer_report: ConsumerReadinessReport; maturity_assessment: MaturityAssessment; health_report: EcosystemHealthReport; gap_report: ReadinessGapReport; recommendations: ReadinessRecommendations; evidence_package: ReadinessEvidencePackage; decision: OperationalReadinessDecision; gates: EcosystemReadinessGates; readiness: EcosystemReadinessStatus; replay_hash: string; integrity_hash: string }>;
export type EcosystemReadinessValidation = Readonly<{ valid: boolean; decision: EcosystemReadinessDecision; replay_hash_valid: boolean; integrity_hash_valid: boolean; ecosystem_valid: boolean; operational_valid: boolean; deployment_valid: boolean; consumer_valid: boolean; maturity_valid: boolean; health_valid: boolean; gaps_valid: boolean; recommendations_valid: boolean; evidence_valid: boolean; decision_valid: boolean; gates_valid: boolean; readiness_valid: boolean; failures: readonly ReadinessFailure[]; integrity_hash: string }>;
export type EcosystemReadinessBundle = Readonly<{ doctrine: Readonly<{ version: "proving-ecosystem-readiness-assessment/v6.16"; owns_ecosystem_readiness: true; owns_operational_maturity: true; owns_deployment_readiness: true; owns_consumer_readiness: true; owns_ecosystem_health: true; preserves_upstream_authority: true }>; result: EcosystemReadinessResult; validation: EcosystemReadinessValidation }>;
