export type FederationOutcome = "FEDERATION_READY" | "READY_WITH_OBSERVATIONS" | "CONDITIONALLY_READY" | "NOT_READY" | "FAIL_CLOSED";
export type FederationExerciseType = "ECOSYSTEM_EXERCISE" | "FEDERATION_REHEARSAL" | "DISTRIBUTED_SIMULATION" | "MULTI_REGION_PROVING" | "MULTI_TENANT_PROVING" | "CROSS_PROGRAM_PROVING" | "CONSTITUTIONAL_VALIDATION" | "TRUST_FEDERATION_VALIDATION" | "OPERATIONAL_FEDERATION_DRILL" | "ECOSYSTEM_RECOVERY_EXERCISE";
export type FederationMetric = "FEDERATION_HEALTH" | "SYNCHRONIZATION_LATENCY" | "FEDERATION_AVAILABILITY" | "REPLAY_DETERMINISM" | "TENANT_ISOLATION_SUCCESS" | "GOVERNANCE_CONSISTENCY" | "EVIDENCE_SYNCHRONIZATION" | "INTEROPERABILITY_SUCCESS" | "DISTRIBUTED_EXECUTION_ACCURACY" | "CONSTITUTIONAL_COMPLIANCE";
export type FederationFailure =
  | "P6_16_READINESS_INVALID"
  | "FEDERATION_ARCHITECTURE_MISSING"
  | "FEDERATION_TOPOLOGY_INVALID"
  | "FEDERATION_REGISTRY_MISSING"
  | "FEDERATION_PARTICIPANT_IDENTITY_UNVERIFIED"
  | "FEDERATION_AUTHORIZATION_MISSING"
  | "TENANT_ISOLATION_VIOLATED"
  | "CROSS_TENANT_AUTHORIZATION_INVALID"
  | "CROSS_PROGRAM_COMPATIBILITY_INVALID"
  | "QUALIFIED_INTERFACE_MISSING"
  | "FEDERATION_EXERCISE_FRAMEWORK_MISSING"
  | "DISTRIBUTED_SCENARIO_EXECUTION_FAILED"
  | "SCENARIO_SYNCHRONIZATION_FAILED"
  | "FEDERATION_REPLAY_INVALID"
  | "REPLAY_LINEAGE_INCOMPLETE"
  | "EVIDENCE_SYNCHRONIZATION_FAILED"
  | "FEDERATED_EVIDENCE_INTEGRITY_INVALID"
  | "GOVERNANCE_CONSISTENCY_INVALID"
  | "AUTHORITY_ENFORCEMENT_INVALID"
  | "POLICY_ENFORCEMENT_INVALID"
  | "OPERATOR_SUPREMACY_VIOLATED"
  | "FAIL_CLOSED_NOT_ENFORCED"
  | "TRUST_FEDERATION_COMPATIBILITY_INVALID"
  | "TRUST_AUTHORITY_SUPERSEDED"
  | "FEDERATION_RESILIENCE_VALIDATION_FAILED"
  | "PARTITION_HANDLING_FAILED"
  | "FEDERATION_QUALIFICATION_PACKAGE_INCOMPLETE"
  | "ECOSYSTEM_QUALIFICATION_READINESS_FAILED";
export type FederationScenario = "BASELINE" | "READY_WITH_OBSERVATIONS" | "CONDITIONAL_FOLLOWUP" | FederationFailure;
export type FederationInput = Readonly<{ scenario?: FederationScenario; seed?: string }>;
export type FederationArchitecture = Readonly<{ architecture_id: string; topology_defined: boolean; proving_federation: boolean; execution_federation: boolean; environment_federation: boolean; deterministic: boolean; integrity_hash: string }>;
export type FederationRegistry = Readonly<{ registry_id: string; members: readonly string[]; federation_identities_verified: boolean; topology_registered: boolean; constitutional_authorization: boolean; environment_catalog_complete: boolean; integrity_hash: string }>;
export type MultiTenantValidationReport = Readonly<{ report_id: string; tenants: readonly string[]; tenant_isolation: boolean; tenant_independence: boolean; shared_infrastructure_validated: boolean; identity_isolation: boolean; cross_tenant_proving_authorized: boolean; integrity_hash: string }>;
export type CrossProgramValidationMatrix = Readonly<{ matrix_id: string; programs: readonly string[]; capability_interoperability: boolean; dependency_correctness: boolean; interface_compatibility: boolean; evidence_compatibility: boolean; qualified_contracts_only: boolean; integrity_hash: string }>;
export type FederationExerciseReport = Readonly<{ report_id: string; exercise_types: readonly FederationExerciseType[]; ecosystem_drills: boolean; distributed_rehearsals: boolean; coordinated_proving: boolean; operational_federation_drills: boolean; integrity_hash: string }>;
export type DistributedScenarioReport = Readonly<{ report_id: string; synchronized_execution: boolean; distributed_coordination: boolean; coordinated_missions: boolean; scenario_federation: boolean; execution_accuracy: number; integrity_hash: string }>;
export type FederationReplayReport = Readonly<{ report_id: string; distributed_replay: boolean; replay_synchronization: boolean; replay_lineage_complete: boolean; deterministic_replay: boolean; reproducible_outcomes: boolean; integrity_hash: string }>;
export type FederationEvidence = Readonly<{ evidence_id: string; immutable: boolean; cryptographically_verifiable: boolean; synchronized_across_members: boolean; traceable_to_originating_exercise: boolean; lineage_federated: boolean; reconciled: boolean; integrity_hash: string }>;
export type FederationGovernanceReport = Readonly<{ report_id: string; constitutional_compliance: boolean; authority_enforcement: boolean; policy_enforcement: boolean; governance_consistency: boolean; operator_supremacy: boolean; fail_closed_behavior: boolean; integrity_hash: string }>;
export type FederationTrustReport = Readonly<{ report_id: string; trust_federation_consumed: boolean; trust_standing_validated: boolean; trust_decisions_respected: boolean; trust_authority_preserved: boolean; proving_validates_behavior_only: boolean; integrity_hash: string }>;
export type FederationResilienceReport = Readonly<{ report_id: string; node_failure_resilience: boolean; partition_handling: boolean; degraded_federation: boolean; recovery_continuity: boolean; operational_resilience: boolean; integrity_hash: string }>;
export type FederationQualificationPackage = Readonly<{ package_id: string; interoperability_complete: boolean; governance_complete: boolean; replay_complete: boolean; evidence_complete: boolean; resilience_complete: boolean; cross_program_validation_complete: boolean; qualification_ready: boolean; integrity_hash: string }>;
export type FederationMetricsReport = Readonly<{ report_id: string; metrics: readonly FederationMetric[]; federation_health: number; synchronization_latency_ms: number; federation_availability: number; replay_determinism: number; tenant_isolation_success: number; governance_consistency: number; evidence_synchronization: number; interoperability_success: number; distributed_execution_accuracy: number; constitutional_compliance: number; integrity_hash: string }>;
export type FederationDecision = Readonly<{ decision_id: string; outcome: FederationOutcome; qualification_authorized: boolean; federation_execution_authorized: boolean; trust_authority_preserved: boolean; fail_closed: boolean; rationale: readonly string[]; integrity_hash: string }>;
export type FederationGates = Readonly<{ gate_id: string; registration_gate: boolean; tenant_isolation_gate: boolean; cross_program_gate: boolean; replay_gate: boolean; evidence_gate: boolean; governance_gate: boolean; trust_gate: boolean; qualification_gate: boolean; resilience_gate: boolean; passed: boolean; integrity_hash: string }>;
export type FederationReadiness = Readonly<{ readiness_id: string; outcome: FederationOutcome; phase_ready: boolean; architecture_ready: boolean; registry_ready: boolean; multi_tenant_ready: boolean; cross_program_ready: boolean; exercise_ready: boolean; distributed_execution_ready: boolean; replay_ready: boolean; evidence_ready: boolean; governance_ready: boolean; trust_ready: boolean; resilience_ready: boolean; qualification_ready: boolean; metrics_ready: boolean; gates_passed: boolean; failures: readonly FederationFailure[]; integrity_hash: string }>;
export type FederationResult = Readonly<{ phase_version: "proving-ecosystem-validation-federation/v6.17"; phase_identifier: "ProvingEcosystemValidationFederation"; ecosystem_readiness_ref: "proving-ecosystem-readiness-assessment/v6.16"; architecture: FederationArchitecture; registry: FederationRegistry; multi_tenant_report: MultiTenantValidationReport; cross_program_matrix: CrossProgramValidationMatrix; exercise_report: FederationExerciseReport; distributed_scenario_report: DistributedScenarioReport; replay_report: FederationReplayReport; evidence: FederationEvidence; governance_report: FederationGovernanceReport; trust_report: FederationTrustReport; resilience_report: FederationResilienceReport; qualification_package: FederationQualificationPackage; metrics_report: FederationMetricsReport; decision: FederationDecision; gates: FederationGates; readiness: FederationReadiness; replay_hash: string; integrity_hash: string }>;
export type FederationValidation = Readonly<{ valid: boolean; outcome: FederationOutcome; replay_hash_valid: boolean; integrity_hash_valid: boolean; architecture_valid: boolean; registry_valid: boolean; multi_tenant_valid: boolean; cross_program_valid: boolean; exercise_valid: boolean; distributed_execution_valid: boolean; replay_valid: boolean; evidence_valid: boolean; governance_valid: boolean; trust_valid: boolean; resilience_valid: boolean; qualification_valid: boolean; metrics_valid: boolean; decision_valid: boolean; gates_valid: boolean; readiness_valid: boolean; failures: readonly FederationFailure[]; integrity_hash: string }>;
export type FederationBundle = Readonly<{ doctrine: Readonly<{ version: "proving-ecosystem-validation-federation/v6.17"; owns_federation_proving: true; owns_multi_tenant_proving: true; owns_ecosystem_federation: true; owns_cross_program_validation: true; owns_federation_exercises: true; preserves_trust_authority: true }>; result: FederationResult; validation: FederationValidation }>;
