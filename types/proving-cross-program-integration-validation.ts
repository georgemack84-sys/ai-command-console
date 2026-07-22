export type IntegrationOutcome = "PASS" | "FAIL" | "REQUIRES_REVIEW";
export type ProgramIdentifier = "PROGRAM_1_CAPABILITY_ATLAS" | "PROGRAM_2_CORE_INFRASTRUCTURE" | "PROGRAM_3_CAF_LEGION" | "PROGRAM_4_ECOSYSTEM_APPLICATIONS" | "PROGRAM_5_CATA_TRUST_FRAMEWORK";
export type EcosystemScenario = "MISSION_EXECUTION" | "OPERATOR_INTERVENTION" | "TRUST_DEGRADATION" | "CERTIFICATION_REVOCATION" | "DEPENDENCY_FAILURES" | "REGIONAL_FAILOVER" | "TENANT_ISOLATION_BREACH_ATTEMPT" | "POLICY_UPDATES" | "GOVERNANCE_ESCALATION" | "DISASTER_RECOVERY" | "LARGE_SCALE_DEPLOYMENTS" | "FEDERATION_OPERATIONS";
export type IntegrationFailure =
  | "P6_9_PERFORMANCE_QUALIFICATION_INVALID"
  | "DEPENDENCY_ENGINE_MISSING"
  | "DEPENDENCY_GRAPH_INCOMPLETE"
  | "DEPENDENCY_INCORRECT"
  | "CIRCULAR_DEPENDENCY_DETECTED"
  | "VERSION_COMPATIBILITY_FAILED"
  | "OWNERSHIP_VERIFICATION_FAILED"
  | "NAMESPACE_VALIDATION_FAILED"
  | "LIFECYCLE_COMPATIBILITY_FAILED"
  | "INTERFACE_VALIDATION_MISSING"
  | "API_COMPATIBILITY_FAILED"
  | "EVENT_COMPATIBILITY_FAILED"
  | "MESSAGE_COMPATIBILITY_FAILED"
  | "SCHEMA_COMPATIBILITY_FAILED"
  | "SERIALIZATION_COMPATIBILITY_FAILED"
  | "PROTOCOL_COMPATIBILITY_FAILED"
  | "CONTRACT_EVOLUTION_FAILED"
  | "BACKWARD_COMPATIBILITY_FAILED"
  | "INTEGRATION_TESTING_MISSING"
  | "WORKFLOW_EXECUTION_FAILED"
  | "IDENTITY_PROPAGATION_FAILED"
  | "AUTHORITY_PROPAGATION_FAILED"
  | "TRUST_PROPAGATION_FAILED"
  | "GOVERNANCE_PROPAGATION_FAILED"
  | "EVIDENCE_PROPAGATION_FAILED"
  | "REPLAY_PROPAGATION_FAILED"
  | "DATA_INTEROPERABILITY_FAILED"
  | "GOVERNANCE_INTEGRATION_FAILED"
  | "TRUST_INTEGRATION_FAILED"
  | "REPLAY_COMPATIBILITY_FAILED"
  | "ECOSYSTEM_SCENARIO_FAILED"
  | "COMPATIBILITY_MATRIX_MISSING"
  | "COMPATIBILITY_MATRIX_INCOMPLETE"
  | "TENANT_ISOLATION_FAILED"
  | "FAIL_CLOSED_BEHAVIOR_FAILED"
  | "CONSTITUTIONAL_BOUNDARY_VIOLATED"
  | "INDIVIDUAL_PROGRAM_CERTIFICATION_ATTEMPTED"
  | "PROGRAM_ARCHITECTURE_MODIFICATION_ATTEMPTED"
  | "PROGRAM_CERTIFICATION_REPLACEMENT_ATTEMPTED"
  | "INTERFACE_REDEFINITION_ATTEMPTED"
  | "CONSTITUTIONAL_OWNERSHIP_REDEFINITION_ATTEMPTED"
  | "INTEGRATION_EVIDENCE_MISSING"
  | "INTEGRATION_EVIDENCE_MUTATED"
  | "INTEGRATION_LINEAGE_INCOMPLETE"
  | "GOVERNANCE_REVIEW_REQUIRED";
export type IntegrationScenario = "BASELINE" | IntegrationFailure;
export type IntegrationInput = Readonly<{ scenario?: IntegrationScenario; seed?: string }>;
export type DependencyValidationReport = Readonly<{ report_id: string; programs: readonly ProgramIdentifier[]; graph_complete: boolean; dependencies_correct: boolean; circular_dependencies_absent: boolean; version_compatible: boolean; ownership_preserved: boolean; namespaces_valid: boolean; lifecycle_compatible: boolean; evidence_refs: readonly string[]; integrity_hash: string }>;
export type InterfaceValidationReport = Readonly<{ report_id: string; api_compatible: boolean; events_compatible: boolean; messages_compatible: boolean; schemas_compatible: boolean; serialization_compatible: boolean; protocols_compatible: boolean; contract_evolution_valid: boolean; backward_compatible: boolean; evidence_refs: readonly string[]; integrity_hash: string }>;
export type IntegrationWorkflowReport = Readonly<{ report_id: string; workflow: readonly ProgramIdentifier[]; mission_execution: boolean; identity_propagation: boolean; authority_propagation: boolean; trust_propagation: boolean; governance_propagation: boolean; evidence_propagation: boolean; replay_propagation: boolean; deterministic: boolean; evidence_refs: readonly string[]; integrity_hash: string }>;
export type EventValidationReport = Readonly<{ report_id: string; event_production: boolean; event_delivery: boolean; event_ordering: boolean; event_replay: boolean; idempotency: boolean; version_compatibility: boolean; routing_validation: boolean; subscription_validation: boolean; compatibility_matrix_ref: string; evidence_refs: readonly string[]; integrity_hash: string }>;
export type DataCompatibilityReport = Readonly<{ report_id: string; identity_consistency: boolean; registry_consistency: boolean; evidence_consistency: boolean; trust_consistency: boolean; audit_consistency: boolean; lineage_consistency: boolean; schema_consistency: boolean; serialization_compatibility: boolean; evidence_refs: readonly string[]; integrity_hash: string }>;
export type GovernanceIntegrationReport = Readonly<{ report_id: string; constitutional_inheritance: boolean; authority_precedence: boolean; policy_enforcement: boolean; tenant_isolation: boolean; governance_escalation: boolean; human_oversight: boolean; certification_dependencies: boolean; fail_closed_behavior: boolean; evidence_refs: readonly string[]; integrity_hash: string }>;
export type TrustIntegrationReport = Readonly<{ report_id: string; trust_decisions_compatible: boolean; trust_standing_propagation: boolean; trust_restrictions: boolean; trust_recovery: boolean; certification_compatibility: boolean; federation_compatibility: boolean; authorization_behavior: boolean; evidence_refs: readonly string[]; integrity_hash: string }>;
export type ReplayCompatibilityReport = Readonly<{ report_id: string; replay_fidelity: boolean; evidence_consistency: boolean; deterministic_execution: boolean; replay_lineage: boolean; replay_compatibility: boolean; replay_interoperability: boolean; evidence_refs: readonly string[]; integrity_hash: string }>;
export type EcosystemExerciseReport = Readonly<{ report_id: string; scenarios: readonly EcosystemScenario[]; normal_conditions: boolean; degraded_conditions: boolean; recovery_conditions: boolean; adversarial_conditions: boolean; exercises_complete: boolean; evidence_refs: readonly string[]; integrity_hash: string }>;
export type CompatibilityMatrix = Readonly<{ matrix_id: string; version_compatibility: boolean; dependency_compatibility: boolean; interface_compatibility: boolean; trust_compatibility: boolean; governance_compatibility: boolean; replay_compatibility: boolean; certification_compatibility: boolean; programs: readonly ProgramIdentifier[]; integrity_hash: string }>;
export type IntegrationEvidence = Readonly<{ evidence_id: string; dependency_evidence: readonly string[]; interface_evidence: readonly string[]; integration_evidence: readonly string[]; event_evidence: readonly string[]; data_evidence: readonly string[]; governance_evidence: readonly string[]; trust_evidence: readonly string[]; replay_evidence: readonly string[]; ecosystem_evidence: readonly string[]; compatibility_evidence: readonly string[]; immutable: boolean; traceable: boolean; replayable: boolean; lineage_complete: boolean; integrity_hash: string }>;
export type IntegrationGates = Readonly<{ gate_id: string; dependency_integrity: boolean; interface_compatibility: boolean; integration_success: boolean; trust_compatibility: boolean; replay_compatibility: boolean; governance_validation: boolean; ecosystem_readiness: boolean; passed: boolean; integrity_hash: string }>;
export type IntegrationBoundaries = Readonly<{ boundary_id: string; owns_individual_program_certification: false; owns_program_architecture_modification: false; owns_program_certification_replacement: false; owns_interface_redefinition: false; owns_constitutional_ownership_redefinition: false; integrity_hash: string }>;
export type IntegrationReadiness = Readonly<{ readiness_id: string; outcome: IntegrationOutcome; phase_ready: boolean; dependencies_ready: boolean; interfaces_ready: boolean; workflows_ready: boolean; events_ready: boolean; data_ready: boolean; governance_ready: boolean; trust_ready: boolean; replay_ready: boolean; ecosystem_ready: boolean; matrix_ready: boolean; evidence_ready: boolean; gates_passed: boolean; boundaries_respected: boolean; failures: readonly IntegrationFailure[]; integrity_hash: string }>;
export type IntegrationResult = Readonly<{ phase_version: "proving-cross-program-integration-validation/v6.10"; phase_identifier: "ProvingCrossProgramIntegrationValidation"; performance_qualification_ref: "proving-performance-scalability-qualification/v6.9"; dependency_report: DependencyValidationReport; interface_report: InterfaceValidationReport; workflow_report: IntegrationWorkflowReport; event_report: EventValidationReport; data_report: DataCompatibilityReport; governance_report: GovernanceIntegrationReport; trust_report: TrustIntegrationReport; replay_report: ReplayCompatibilityReport; ecosystem_report: EcosystemExerciseReport; compatibility_matrix: CompatibilityMatrix; evidence: IntegrationEvidence; gates: IntegrationGates; boundaries: IntegrationBoundaries; readiness: IntegrationReadiness; replay_hash: string; integrity_hash: string }>;
export type IntegrationValidation = Readonly<{ valid: boolean; outcome: IntegrationOutcome; replay_hash_valid: boolean; integrity_hash_valid: boolean; dependency_valid: boolean; interface_valid: boolean; workflow_valid: boolean; event_valid: boolean; data_valid: boolean; governance_valid: boolean; trust_valid: boolean; replay_valid: boolean; ecosystem_valid: boolean; matrix_valid: boolean; evidence_valid: boolean; gates_valid: boolean; boundaries_valid: boolean; readiness_valid: boolean; failures: readonly IntegrationFailure[]; integrity_hash: string }>;
export type IntegrationBundle = Readonly<{ doctrine: Readonly<{ version: "proving-cross-program-integration-validation/v6.10"; owns_interoperability: true; owns_dependency_validation: true; owns_integration_testing: true; owns_ecosystem_validation: true; owns_individual_program_certification: false; owns_program_architecture_modification: false; owns_program_certification_replacement: false; owns_interface_redefinition: false; owns_constitutional_ownership_redefinition: false }>; result: IntegrationResult; validation: IntegrationValidation }>;
