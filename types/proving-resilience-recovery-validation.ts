export type ResilienceOutcome = "PASS" | "FAIL" | "FAIL_SAFE";
export type RecoveryScenario = "SERVICE_CRASH" | "NODE_FAILURE" | "CLUSTER_OUTAGE" | "NETWORK_PARTITION" | "STORAGE_CORRUPTION" | "DATABASE_OUTAGE" | "CONFIGURATION_CORRUPTION" | "REGISTRY_CORRUPTION" | "IDENTITY_FAILURE" | "AUTHENTICATION_OUTAGE" | "POLICY_CORRUPTION" | "GOVERNANCE_INTERRUPTION" | "TRUST_SUSPENSION" | "REPLAY_INTERRUPTION" | "ORCHESTRATION_FAILURE" | "COMPLETE_ENVIRONMENT_LOSS";
export type ResilienceScenarioType = "CONTINUOUS_OPERATIONS" | "INTERMITTENT_FAILURES" | "CASCADING_FAILURES" | "CONCURRENT_FAILURES" | "PARTIAL_INFRASTRUCTURE_LOSS" | "DEPENDENCY_OUTAGES" | "HIGH_LATENCY" | "OVERLOAD" | "RESOURCE_EXHAUSTION";
export type DisasterScenario = "DATA_CENTER_FAILURE" | "REGIONAL_OUTAGE" | "CLOUD_PROVIDER_OUTAGE" | "STORAGE_LOSS" | "REGISTRY_DESTRUCTION" | "BACKUP_RECOVERY" | "CONFIGURATION_RESTORATION" | "TENANT_RESTORATION";
export type DegradationMode = "READ_ONLY" | "ADVISORY_ONLY" | "GOVERNANCE_ONLY" | "OPERATOR_ONLY" | "REDUCED_AUTONOMY" | "DEGRADED_TRUST" | "PARTIAL_CAPABILITY";
export type ResilienceFailure =
  | "P6_7_ADVERSARIAL_TESTING_INVALID"
  | "RESILIENCE_FRAMEWORK_MISSING"
  | "FAILURE_INJECTION_LIBRARY_MISSING"
  | "FAILURE_INJECTION_NONDETERMINISTIC"
  | "RECOVERY_VALIDATION_ENGINE_MISSING"
  | "RECOVERY_WORKFLOW_FAILED"
  | "DETERMINISTIC_RESTORATION_FAILED"
  | "STATE_PRESERVATION_FAILED"
  | "CONSISTENCY_VALIDATION_FAILED"
  | "FAILOVER_VALIDATION_MISSING"
  | "FAILOVER_EXECUTION_FAILED"
  | "DISASTER_RECOVERY_VALIDATION_MISSING"
  | "ENVIRONMENT_RESTORATION_FAILED"
  | "BACKUP_RESTORATION_FAILED"
  | "TRUST_RESTORATION_FAILED"
  | "DEGRADATION_TESTING_MISSING"
  | "GRACEFUL_DEGRADATION_FAILED"
  | "POLICY_ENFORCEMENT_DURING_DEGRADATION_FAILED"
  | "OPERATOR_VISIBILITY_FAILED"
  | "RECOVERY_REPLAY_VALIDATION_MISSING"
  | "RECOVERY_REPLAY_DIVERGED"
  | "REPEATABLE_RECOVERY_FAILED"
  | "RECOVERY_EVIDENCE_MISSING"
  | "RECOVERY_EVIDENCE_MUTATED"
  | "RECOVERY_LINEAGE_INCOMPLETE"
  | "GOVERNANCE_PRESERVATION_FAILED"
  | "TRUST_TRANSITION_NONCOMPLIANT"
  | "FAIL_SAFE_BEHAVIOR_FAILED"
  | "OPERATIONS_NOT_MAINTAINED"
  | "RESILIENCE_OBJECTIVES_NOT_MET"
  | "RECOVERY_CERTIFICATION_NOT_READY"
  | "FUNCTIONAL_CORRECTNESS_OWNERSHIP_VIOLATION"
  | "PRODUCTION_INCIDENT_RESPONSE_OWNERSHIP_VIOLATION"
  | "TRUST_DECISION_OWNERSHIP_VIOLATION";
export type ResilienceValidationScenario = "BASELINE" | ResilienceFailure;
export type ResilienceInput = Readonly<{ scenario?: ResilienceValidationScenario; seed?: string }>;
export type ResilienceFramework = Readonly<{ framework_id: string; test_engine: boolean; orchestration: boolean; scheduling: boolean; policies: boolean; execution: boolean; deterministic: boolean; integrity_hash: string }>;
export type FailureInjectionLibrary = Readonly<{ library_id: string; service_failures: boolean; infrastructure_failures: boolean; dependency_failures: boolean; configuration_failures: boolean; storage_failures: boolean; network_failures: boolean; identity_failures: boolean; deterministic: boolean; integrity_hash: string }>;
export type RecoveryValidationEngine = Readonly<{ engine_id: string; workflows: readonly RecoveryScenario[]; workflow_execution: boolean; deterministic_restoration: boolean; state_preservation: boolean; consistency_validation: boolean; evidence_preservation: boolean; governance_preservation: boolean; trust_transition_compliance: boolean; integrity_hash: string }>;
export type FailoverReport = Readonly<{ report_id: string; active_active: boolean; active_passive: boolean; quorum_failover: boolean; orchestration_failover: boolean; tenant_failover: boolean; service_relocation: boolean; deterministic: boolean; evidence_refs: readonly string[]; integrity_hash: string }>;
export type DisasterRecoveryReport = Readonly<{ report_id: string; scenarios: readonly DisasterScenario[]; backup_restoration: boolean; infrastructure_recreation: boolean; environment_rebuild: boolean; registry_recovery: boolean; replay_restoration: boolean; trust_restoration: boolean; evidence_refs: readonly string[]; integrity_hash: string }>;
export type DegradationReport = Readonly<{ report_id: string; modes: readonly DegradationMode[]; reduced_capability: boolean; restricted_autonomy: boolean; operator_takeover: boolean; policy_restriction: boolean; degraded_trust: boolean; degraded_services: boolean; graceful: boolean; evidence_refs: readonly string[]; integrity_hash: string }>;
export type RecoveryReplayReport = Readonly<{ report_id: string; replay_ref: "proving-replay-validation-framework/v6.6"; adversarial_ref: "proving-adversarial-testing-framework/v6.7"; identical_recovery_replay: boolean; deterministic_restoration: boolean; repeatable_recovery: boolean; divergence_analyzed: boolean; evidence_refs: readonly string[]; integrity_hash: string }>;
export type ResilienceEvidence = Readonly<{ evidence_id: string; resilience_execution: readonly string[]; recovery_execution: readonly string[]; failover: readonly string[]; disaster_recovery: readonly string[]; degradation: readonly string[]; replay_validation: readonly string[]; trust_restoration: readonly string[]; governance_preservation: readonly string[]; immutable: boolean; traceable: boolean; replayable: boolean; certification_ready: boolean; integrity_hash: string }>;
export type ResilienceGates = Readonly<{ gate_id: string; recovery_gate: boolean; resilience_gate: boolean; disaster_recovery_gate: boolean; degradation_gate: boolean; replay_gate: boolean; evidence_gate: boolean; phase_certification: boolean; passed: boolean; integrity_hash: string }>;
export type ResilienceInvariants = Readonly<{ deterministic_resilience_testing: boolean; deterministic_recovery: boolean; governance_maintained: boolean; trust_preserved: boolean; evidence_integrity: boolean; fail_safe_when_unrecoverable: boolean; recovery_replay_equivalence: boolean; integrity_hash: string }>;
export type ResilienceBoundaries = Readonly<{ boundary_id: string; owns_functional_correctness: false; owns_production_incident_response: false; owns_trust_decisions: false; owns_runtime_security_monitoring: false; integrity_hash: string }>;
export type ResilienceReadiness = Readonly<{ readiness_id: string; outcome: ResilienceOutcome; phase_ready: boolean; framework_ready: boolean; failure_injection_ready: boolean; recovery_ready: boolean; failover_ready: boolean; disaster_recovery_ready: boolean; degradation_ready: boolean; replay_ready: boolean; evidence_ready: boolean; gates_passed: boolean; invariants_satisfied: boolean; boundaries_respected: boolean; failures: readonly ResilienceFailure[]; integrity_hash: string }>;
export type ResilienceResult = Readonly<{ phase_version: "proving-resilience-recovery-validation/v6.8"; phase_identifier: "ProvingResilienceRecoveryValidation"; adversarial_testing_ref: "proving-adversarial-testing-framework/v6.7"; framework: ResilienceFramework; failure_injection: FailureInjectionLibrary; recovery_engine: RecoveryValidationEngine; failover_report: FailoverReport; disaster_recovery_report: DisasterRecoveryReport; degradation_report: DegradationReport; recovery_replay_report: RecoveryReplayReport; evidence: ResilienceEvidence; gates: ResilienceGates; invariants: ResilienceInvariants; boundaries: ResilienceBoundaries; readiness: ResilienceReadiness; replay_hash: string; integrity_hash: string }>;
export type ResilienceValidation = Readonly<{ valid: boolean; outcome: ResilienceOutcome; replay_hash_valid: boolean; integrity_hash_valid: boolean; framework_valid: boolean; failure_injection_valid: boolean; recovery_valid: boolean; failover_valid: boolean; disaster_recovery_valid: boolean; degradation_valid: boolean; replay_valid: boolean; evidence_valid: boolean; gates_valid: boolean; invariants_valid: boolean; boundaries_valid: boolean; readiness_valid: boolean; failures: readonly ResilienceFailure[]; integrity_hash: string }>;
export type ResilienceBundle = Readonly<{ doctrine: Readonly<{ version: "proving-resilience-recovery-validation/v6.8"; owns_resilience_validation: true; owns_recovery_validation: true; owns_failover_testing: true; owns_disaster_recovery_validation: true; owns_degradation_testing: true; owns_recovery_replay_validation: true; owns_resilience_evidence: true; owns_functional_correctness: false; owns_production_incident_response: false; owns_trust_decisions: false; owns_runtime_security_monitoring: false }>; result: ResilienceResult; validation: ResilienceValidation }>;
