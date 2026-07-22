export type AdversarialOutcome = "PASS" | "FAIL" | "REQUIRES_GOVERNANCE_REVIEW";
export type AttackType = "AUTHENTICATION" | "AUTHORIZATION" | "IDENTITY_SPOOFING" | "PRIVILEGE_ESCALATION" | "REPLAY_ATTACK" | "POLICY_BYPASS" | "AUTHORITY_ABUSE" | "MALFORMED_REQUEST" | "RACE_CONDITION" | "TIMING_ATTACK" | "DEPENDENCY_FAILURE" | "CONFIGURATION_CORRUPTION" | "TENANT_BOUNDARY_VIOLATION" | "EVENT_ORDERING" | "EVIDENCE_TAMPERING" | "REPLAY_DIVERGENCE";
export type AttackScenarioType = "SINGLE" | "CHAINED" | "COORDINATED" | "CAMPAIGN" | "ADAPTIVE" | "INSIDER" | "EXTERNAL";
export type AdversarialFailure =
  | "P6_6_REPLAY_VALIDATION_INVALID"
  | "ADVERSARIAL_ARCHITECTURE_MISSING"
  | "ATTACK_CATALOG_MISSING"
  | "ATTACK_COVERAGE_INCOMPLETE"
  | "ATTACK_SCENARIO_GENERATION_MISSING"
  | "FAULT_INJECTION_MISSING"
  | "FAULT_INJECTION_NONDETERMINISTIC"
  | "MISUSE_TESTING_MISSING"
  | "ABUSE_VALIDATION_MISSING"
  | "GOVERNANCE_ATTACK_VALIDATION_MISSING"
  | "IDENTITY_TENANT_ATTACK_VALIDATION_MISSING"
  | "REPLAY_ADVERSARIAL_VALIDATION_MISSING"
  | "RECOVERY_VALIDATION_MISSING"
  | "ADVERSARIAL_ANALYTICS_MISSING"
  | "CERTIFICATION_EVIDENCE_MISSING"
  | "DETERMINISTIC_ADVERSARIAL_EXECUTION_FAILED"
  | "GOVERNANCE_FAIL_CLOSED_FAILED"
  | "TENANT_ISOLATION_VIOLATED"
  | "EVIDENCE_INTEGRITY_FAILED"
  | "REPLAY_EQUIVALENCE_FAILED"
  | "NON_PRODUCTION_CONTAINMENT_FAILED"
  | "UNAUTHORIZED_EXECUTION_NOT_BLOCKED"
  | "AUTHORITY_PRESERVATION_FAILED"
  | "POLICY_PRESERVATION_FAILED"
  | "SAFETY_PRESERVATION_FAILED"
  | "REPLAY_DIVERGENCE_UNCLASSIFIED"
  | "RECOVERY_CONTAINMENT_FAILED"
  | "RESTORATION_VALIDATION_FAILED"
  | "EVIDENCE_LINEAGE_INCOMPLETE"
  | "CERTIFICATION_PACKAGE_MISSING"
  | "PRODUCTION_SECURITY_MONITORING_OWNERSHIP_VIOLATION"
  | "RUNTIME_INCIDENT_RESPONSE_OWNERSHIP_VIOLATION"
  | "TRUST_EVALUATION_ATTEMPTED"
  | "SAFETY_QUALIFICATION_ATTEMPTED"
  | "REPLAY_ENGINE_IMPLEMENTATION_ATTEMPTED"
  | "SIMULATION_ENGINE_IMPLEMENTATION_ATTEMPTED"
  | "GOVERNANCE_REVIEW_REQUIRED";
export type AdversarialScenario = "BASELINE" | AdversarialFailure;
export type AdversarialInput = Readonly<{ scenario?: AdversarialScenario; seed?: string }>;
export type AdversarialArchitecture = Readonly<{ architecture_id: string; architecture_model: boolean; execution_model: boolean; testing_services: boolean; attack_pipeline: boolean; deterministic: boolean; dependency_validation: boolean; integrity_hash: string }>;
export type AttackCatalog = Readonly<{ catalog_id: string; attacks: readonly AttackType[]; metadata_complete: boolean; classification_complete: boolean; identity_attacks: boolean; governance_attacks: boolean; policy_attacks: boolean; replay_attacks: boolean; infrastructure_attacks: boolean; tenant_attacks: boolean; integrity_hash: string }>;
export type AttackScenarioSet = Readonly<{ scenario_set_id: string; supported_types: readonly AttackScenarioType[]; campaign_definitions: readonly string[]; deterministic_generation: boolean; integrity_hash: string }>;
export type FaultInjectionPlan = Readonly<{ plan_id: string; service_failures: boolean; node_failures: boolean; network_latency: boolean; packet_loss: boolean; storage_corruption: boolean; configuration_corruption: boolean; dependency_failure: boolean; api_failure: boolean; timeout: boolean; event_duplication: boolean; event_omission: boolean; ordering_faults: boolean; deterministic: boolean; replay_compatible: boolean; execution_logs: readonly string[]; integrity_hash: string }>;
export type AdversarialValidationReport = Readonly<{ report_id: string; category: "MISUSE" | "ABUSE" | "GOVERNANCE" | "ISOLATION" | "REPLAY" | "RECOVERY"; scenarios: readonly string[]; expected_outcomes: readonly string[]; findings: readonly string[]; fail_closed: boolean; evidence_refs: readonly string[]; integrity_hash: string }>;
export type AdversarialAnalytics = Readonly<{ analytics_id: string; attack_success: number; attack_failure: number; governance_intervention: number; replay_stability: number; recovery_effectiveness: number; resilience_score: number; trend_reports: readonly string[]; integrity_hash: string }>;
export type AdversarialEvidencePackage = Readonly<{ package_id: string; attack_evidence: readonly string[]; fault_evidence: readonly string[]; replay_evidence: readonly string[]; recovery_evidence: readonly string[]; governance_evidence: readonly string[]; immutable: boolean; lineage_complete: boolean; certification_ready: boolean; integrity_hash: string }>;
export type AdversarialGates = Readonly<{ gate_id: string; architecture_verification: boolean; attack_coverage: boolean; fault_injection: boolean; misuse_verification: boolean; abuse_validation: boolean; governance_validation: boolean; replay_validation: boolean; recovery_verification: boolean; evidence_verification: boolean; phase_certification: boolean; passed: boolean; integrity_hash: string }>;
export type AdversarialInvariants = Readonly<{ deterministic_execution: boolean; fail_closed_governance: boolean; tenant_isolation: boolean; evidence_integrity: boolean; replay_equivalence: boolean; non_production_containment: boolean; integrity_hash: string }>;
export type AdversarialBoundary = Readonly<{ boundary_id: string; owns_production_security_monitoring: false; owns_runtime_incident_response: false; owns_trust_evaluation: false; owns_safety_qualification: false; owns_replay_engine_implementation: false; owns_simulation_engine: false; integrity_hash: string }>;
export type AdversarialReadiness = Readonly<{ readiness_id: string; outcome: AdversarialOutcome; phase_ready: boolean; architecture_ready: boolean; attack_catalog_ready: boolean; attack_scenarios_ready: boolean; fault_injection_ready: boolean; misuse_ready: boolean; abuse_ready: boolean; governance_ready: boolean; isolation_ready: boolean; replay_ready: boolean; recovery_ready: boolean; analytics_ready: boolean; evidence_ready: boolean; gates_passed: boolean; invariants_satisfied: boolean; boundaries_respected: boolean; failures: readonly AdversarialFailure[]; integrity_hash: string }>;
export type AdversarialResult = Readonly<{ phase_version: "proving-adversarial-testing-framework/v6.7"; phase_identifier: "ProvingAdversarialTestingFramework"; replay_validation_ref: "proving-replay-validation-framework/v6.6"; architecture: AdversarialArchitecture; attack_catalog: AttackCatalog; attack_scenarios: AttackScenarioSet; fault_injection: FaultInjectionPlan; misuse_report: AdversarialValidationReport; abuse_report: AdversarialValidationReport; governance_report: AdversarialValidationReport; isolation_report: AdversarialValidationReport; replay_attack_report: AdversarialValidationReport; recovery_report: AdversarialValidationReport; analytics: AdversarialAnalytics; evidence_package: AdversarialEvidencePackage; gates: AdversarialGates; invariants: AdversarialInvariants; boundaries: AdversarialBoundary; readiness: AdversarialReadiness; replay_hash: string; integrity_hash: string }>;
export type AdversarialValidation = Readonly<{ valid: boolean; outcome: AdversarialOutcome; replay_hash_valid: boolean; integrity_hash_valid: boolean; architecture_valid: boolean; attack_catalog_valid: boolean; attack_scenarios_valid: boolean; fault_injection_valid: boolean; misuse_valid: boolean; abuse_valid: boolean; governance_valid: boolean; isolation_valid: boolean; replay_valid: boolean; recovery_valid: boolean; analytics_valid: boolean; evidence_valid: boolean; gates_valid: boolean; invariants_valid: boolean; boundaries_valid: boolean; readiness_valid: boolean; failures: readonly AdversarialFailure[]; integrity_hash: string }>;
export type AdversarialBundle = Readonly<{ doctrine: Readonly<{ version: "proving-adversarial-testing-framework/v6.7"; owns_adversarial_testing: true; owns_attack_simulation: true; owns_fault_injection: true; owns_misuse_testing: true; owns_abuse_validation: true; owns_production_security_monitoring: false; owns_runtime_incident_response: false; owns_trust_evaluation: false; owns_safety_qualification: false; owns_replay_engine_implementation: false; owns_simulation_engine: false }>; result: AdversarialResult; validation: AdversarialValidation }>;
