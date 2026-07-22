import type { AutonomyMaturityCertificationRepository } from "@/types/autonomy-maturity-certification-gate";

export type CataResilienceCertificationScenario = "BASELINE" | "RUNTIME_ASSURANCE_MISSING" | "RUNTIME_DRIFT" | "AUTONOMOUS_RECOVERY" | "RECOVERY_REPLAY_MISMATCH" | "PREDICTION_INCONSISTENCY" | "MISSION_HEALTH_GAP" | "EXPLAINABILITY_INCOMPLETE" | "STRESS_UNRESOLVED_CRITICAL_FAILURE" | "COORDINATION_NONDETERMINISTIC" | "HIDDEN_COMMUNICATION" | "UNAUTHORIZED_OPTIMIZATION" | "OUTCOME_MODIFICATION" | "UNAUTHORIZED_LEARNING" | "POLICY_MODIFICATION" | "CONSTITUTIONAL_MODIFICATION" | "GOVERNANCE_BYPASS" | "CONSTITUTIONAL_VIOLATION" | "AUTHORITY_ESCALATION" | "REPLAY_MISMATCH" | "INTEGRITY_FAILURE" | "TENANT_ISOLATION_FAILURE" | "HIDDEN_EXECUTION" | "CERTIFICATION_SUITE_FAILURE" | "INCOMPLETE_EVIDENCE" | "INCOMPLETE_REPLAY_REFERENCES" | "DOCUMENTATION_GAP";
export type CataResilienceCertificationFailure = "RUNTIME_ASSURANCE_MISSING" | "RUNTIME_DRIFT_DETECTED" | "AUTONOMOUS_RECOVERY_DETECTED" | "RECOVERY_REPLAY_MISMATCH_DETECTED" | "PREDICTION_INCONSISTENCY_DETECTED" | "MISSION_HEALTH_EVIDENCE_INCOMPLETE" | "EXPLAINABILITY_INCOMPLETE" | "UNRESOLVED_CRITICAL_STRESS_FAILURE" | "COORDINATION_NONDETERMINISTIC_DETECTED" | "HIDDEN_COMMUNICATION_DETECTED" | "UNAUTHORIZED_OPTIMIZATION_DETECTED" | "OUTCOME_MODIFICATION_DETECTED" | "UNAUTHORIZED_LEARNING_DETECTED" | "POLICY_MODIFICATION_DETECTED" | "CONSTITUTIONAL_MODIFICATION_DETECTED" | "GOVERNANCE_BYPASS_DETECTED" | "CONSTITUTIONAL_VIOLATION_DETECTED" | "AUTHORITY_ESCALATION_DETECTED" | "REPLAY_MISMATCH_DETECTED" | "INTEGRITY_FAILURE_DETECTED" | "TENANT_ISOLATION_FAILURE_DETECTED" | "HIDDEN_EXECUTION_DETECTED" | "CERTIFICATION_SUITE_FAILED" | "CERTIFICATION_EVIDENCE_INCOMPLETE" | "REPLAY_REFERENCES_INCOMPLETE";
export type CataResilienceCertificationOutcome = "PASS" | "CONDITIONAL_PASS" | "FAIL";
export type CataResilienceCertificationArea = "RUNTIME_ASSURANCE" | "RECOVERY_INTELLIGENCE" | "PREDICTIVE_INTELLIGENCE" | "MISSION_HEALTH" | "EXPLAINABILITY" | "STRESS_SIMULATION" | "MULTI_AGENT_COORDINATION" | "CONTINUOUS_OPTIMIZATION" | "KNOWLEDGE_EVOLUTION" | "CONSTITUTIONAL_RESILIENCE" | "AUTONOMY_MATURITY" | "REPLAY_VALIDATION" | "INTEGRITY_VALIDATION" | "GOVERNANCE_VALIDATION" | "AUTHORITY_VALIDATION" | "TENANT_ISOLATION" | "VISIBILITY" | "CERTIFICATION_REPLAY";

export type CataResilienceCertificationTest = Readonly<{
  test_id: string;
  area: CataResilienceCertificationArea;
  name: string;
  expected_result: "PASS";
  actual_result: "PASS" | "CONDITIONAL_PASS" | "FAIL";
  evidence_reference: string;
  replay_reference: string;
  integrity_hash: string;
}>;

export type CataResilienceEvidencePackage = Readonly<{
  package_id: string;
  upstream_maturity_certification_id: string;
  runtime_evidence: readonly string[];
  recovery_evidence: readonly string[];
  predictive_evidence: readonly string[];
  mission_health_evidence: readonly string[];
  explainability_evidence: readonly string[];
  stress_evidence: readonly string[];
  coordination_evidence: readonly string[];
  optimization_evidence: readonly string[];
  knowledge_evidence: readonly string[];
  constitutional_evidence: readonly string[];
  governance_evidence: readonly string[];
  authority_evidence: readonly string[];
  replay_evidence: readonly string[];
  integrity_evidence: readonly string[];
  tenant_isolation_evidence: readonly string[];
  complete: boolean;
  immutable: true;
  integrity_hash: string;
}>;

export type CataResilienceCertificationReport = Readonly<{
  report_id: string;
  report_type: "CATA_RESILIENCE_CERTIFICATION_FRAMEWORK" | "COMPREHENSIVE_CERTIFICATION_TEST_SUITE" | "DETERMINISTIC_REPLAY_VALIDATION" | "RUNTIME_ASSURANCE_VALIDATION" | "RECOVERY_INTELLIGENCE_CERTIFICATION" | "PREDICTIVE_INTELLIGENCE_CERTIFICATION" | "MISSION_HEALTH_CERTIFICATION" | "EXPLAINABILITY_CERTIFICATION" | "STRESS_SIMULATION" | "MULTI_AGENT_COORDINATION_VALIDATION" | "CONTINUOUS_OPTIMIZATION_SAFETY" | "KNOWLEDGE_EVOLUTION_BOUNDARY" | "CONSTITUTIONAL_RESILIENCE" | "AUTONOMY_MATURITY_ASSESSMENT" | "GOVERNANCE_AUTHORITY_COMPLIANCE" | "INTEGRITY_VERIFICATION" | "TENANT_ISOLATION_VERIFICATION" | "FINAL_PRODUCTION_CERTIFICATION_PACKAGE";
  outcome: CataResilienceCertificationOutcome;
  summary: readonly string[];
  evidence_references: readonly string[];
  replay_reference: string;
  lineage_reference: string;
  integrity_hash: string;
}>;

export type CataResilienceCertificationRecord = Readonly<{
  certification_id: string;
  architecture_version: "phase-8-alt-resilience-architecture/v8ALT.12";
  gate_version: "cata-resilience-certification-gate/v8ALT.12";
  upstream_maturity_certification_version: "autonomy-maturity-certification-gate/v8ALT.11.12";
  outcome: CataResilienceCertificationOutcome;
  production_readiness_verified: boolean;
  production_deployment_authorized: false;
  next_phase_progression_authorized: false;
  autonomous_execution_authorized: false;
  autonomous_recovery_authorized: false;
  autonomous_optimization_authorized: false;
  autonomous_learning_activation_authorized: false;
  runtime_behavior_modification_authorized: false;
  governance_modification_authorized: false;
  constitutional_modification_authorized: false;
  operator_authority_bypass_authorized: false;
  timestamp: "1970-01-01T00:00:00.000Z";
  integrity_hash: string;
}>;

export type CataResilienceCertificationRepository = Readonly<{
  repository_id: string;
  final_state: "CATA_RESILIENCE_CERTIFICATION_COMPLETE" | "CATA_RESILIENCE_CERTIFICATION_FAILED" | "CATA_RESILIENCE_CERTIFICATION_CONDITIONAL";
  upstream_maturity_certification: AutonomyMaturityCertificationRepository;
  record: CataResilienceCertificationRecord;
  tests: readonly CataResilienceCertificationTest[];
  evidence_package: CataResilienceEvidencePackage;
  reports: readonly CataResilienceCertificationReport[];
  failures: readonly CataResilienceCertificationFailure[];
  advisory_only: true;
  immutable: true;
  tenant_isolated: boolean;
  integrity_hash: string;
}>;

export type CataResilienceCertificationValidationResult = Readonly<{
  repository_id: string;
  valid: boolean;
  all_tests_passed: boolean;
  upstream_maturity_certified: boolean;
  replay_verified: boolean;
  integrity_verified: boolean;
  governance_verified: boolean;
  constitutional_verified: boolean;
  authority_enforced: boolean;
  tenant_isolated: boolean;
  evidence_complete: boolean;
  explainability_complete: boolean;
  stress_failures_resolved: boolean;
  no_hidden_execution: boolean;
  no_unauthorized_learning: boolean;
  no_unauthorized_optimization: boolean;
  no_policy_or_constitutional_modification: boolean;
  production_deployment_authorized: false;
  next_phase_progression_authorized: false;
  failures: readonly CataResilienceCertificationFailure[];
  validation_hash: string;
}>;

export type CataResilienceCertificationObservabilitySurface = Readonly<{
  repository_id: string;
  final_state: string;
  outcome: CataResilienceCertificationOutcome;
  test_count: number;
  report_count: number;
  failure_count: number;
  production_readiness_verified: boolean;
  production_deployment_authorized: false;
  advisory_only: true;
  tenant_isolated: boolean;
  integrity_hash: string;
}>;

export type CataResilienceCertificationInput = Readonly<{ scenario?: CataResilienceCertificationScenario; repository?: CataResilienceCertificationRepository; upstream_maturity_certification?: AutonomyMaturityCertificationRepository }>;

export type CataResilienceCertificationBundle = Readonly<{
  doctrine: Readonly<{
    engine_version: "cata-resilience-certification-gate/v8ALT.12";
    final_state: "CATA_RESILIENCE_CERTIFICATION_GATE_READY";
    principles: readonly string[];
  }>;
  repository: CataResilienceCertificationRepository;
  validation: CataResilienceCertificationValidationResult;
  observability: CataResilienceCertificationObservabilitySurface;
}>;
