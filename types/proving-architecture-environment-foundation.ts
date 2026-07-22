export type ProvingFoundationOutcome = "PASS" | "FAIL" | "REQUIRES_GOVERNANCE_REVIEW";
export type ProvingEnvironmentLifecycleState =
  | "DEFINED"
  | "REGISTERED"
  | "VALIDATED"
  | "PROVISIONING"
  | "READY"
  | "ACTIVE"
  | "PAUSED"
  | "RESUMED"
  | "ARCHIVED"
  | "RETIRED";
export type ProvingEnvironmentType =
  | "SANDBOX"
  | "SIMULATION"
  | "INTEGRATION"
  | "CERTIFICATION"
  | "QUALIFICATION"
  | "STRESS"
  | "PERFORMANCE"
  | "SYNTHETIC_TENANT"
  | "SYNTHETIC_ENTERPRISE"
  | "ECOSYSTEM"
  | "RECOVERY"
  | "REGRESSION";
export type ProvingServiceType =
  | "ENVIRONMENT_REGISTRY"
  | "PROVISIONING_SERVICE"
  | "LIFECYCLE_SERVICE"
  | "SCHEDULING_SERVICE"
  | "CONFIGURATION_SERVICE"
  | "DEPENDENCY_SERVICE"
  | "ENVIRONMENT_CATALOG"
  | "ENVIRONMENT_HEALTH_SERVICE"
  | "RESOURCE_MANAGER"
  | "ISOLATION_MANAGER";

export type ProvingFoundationFailure =
  | "P5_18_PROGRAM_QUALIFICATION_INVALID"
  | "PROVING_ARCHITECTURE_MISSING"
  | "ENVIRONMENT_MODEL_MISSING"
  | "SERVICE_MODEL_MISSING"
  | "EXECUTION_MODEL_MISSING"
  | "ENVIRONMENT_LIFECYCLE_MISSING"
  | "ENVIRONMENT_STATE_MODEL_INVALID"
  | "ENVIRONMENT_SERVICES_MISSING"
  | "ENVIRONMENT_GOVERNANCE_MISSING"
  | "ENVIRONMENT_COMPOSITION_INVALID"
  | "ENVIRONMENT_REGISTRATION_INVALID"
  | "ARCHITECTURE_INCOMPLETE"
  | "DEPENDENCY_CORRECTNESS_FAILED"
  | "SERVICE_COMPOSITION_FAILED"
  | "BOUNDARY_DEFINITION_FAILED"
  | "LIFECYCLE_CORRECTNESS_FAILED"
  | "PROVISIONING_SEQUENCE_INVALID"
  | "ISOLATION_FAILURE"
  | "EXECUTION_READINESS_INVALID"
  | "SERVICE_CONTRACT_INVALID"
  | "SERVICE_INTEROPERABILITY_FAILED"
  | "LIFECYCLE_INTEGRATION_FAILED"
  | "DEPENDENCY_RESOLUTION_FAILED"
  | "CONSTITUTIONAL_COMPATIBILITY_FAILED"
  | "PROGRAM_1_COMPATIBILITY_FAILED"
  | "PROGRAM_2_COMPATIBILITY_FAILED"
  | "PROGRAM_3_COMPATIBILITY_FAILED"
  | "PROGRAM_4_COMPATIBILITY_FAILED"
  | "PROGRAM_5_COMPATIBILITY_FAILED"
  | "GLOBAL_IDENTITY_MISSING"
  | "IMMUTABLE_IDENTITY_VIOLATION"
  | "REPRODUCIBILITY_MISSING"
  | "CONFIGURATION_VERSION_MISSING"
  | "DETERMINISTIC_REPLAY_UNSUPPORTED"
  | "DEPENDENCIES_NOT_DECLARED"
  | "SERVICES_NOT_COMPOSABLE"
  | "LIFECYCLE_VALIDATION_BYPASSED"
  | "PROVISIONING_BEFORE_REGISTRATION"
  | "INACTIVE_ENVIRONMENT_EXECUTION_ALLOWED"
  | "ARCHIVED_ENVIRONMENT_MUTABLE"
  | "RETIRED_ENVIRONMENT_EXECUTION_ALLOWED"
  | "PRODUCTION_ACCESS_WITHOUT_CONSTITUTIONAL_AUTHORIZATION"
  | "GOVERNANCE_INHERITANCE_MISSING"
  | "ARCHITECTURAL_EVIDENCE_MISSING"
  | "RUNTIME_EXECUTION_LOGIC_IMPLEMENTED"
  | "PROVING_SCENARIO_OWNERSHIP_VIOLATION"
  | "PROVING_EVIDENCE_OWNERSHIP_VIOLATION"
  | "REPLAY_OWNERSHIP_VIOLATION"
  | "CERTIFICATION_OWNERSHIP_VIOLATION"
  | "QUALIFICATION_OWNERSHIP_VIOLATION"
  | "TRUST_EVALUATION_OWNERSHIP_VIOLATION"
  | "GOVERNANCE_REVIEW_REQUIRED";

export type ProvingFoundationScenario = "BASELINE" | ProvingFoundationFailure;
export type ProvingFoundationInput = Readonly<{ scenario?: ProvingFoundationScenario; environment_id?: string; tenant_id?: string }>;

export type ProvingArchitecture = Readonly<{
  architecture_id: string;
  logical_architecture: boolean;
  physical_architecture: boolean;
  service_architecture: boolean;
  runtime_architecture: boolean;
  dependency_architecture: boolean;
  communication_architecture: boolean;
  security_architecture: boolean;
  deterministic: boolean;
  reproducible: boolean;
  replayable: boolean;
  isolated: boolean;
  observable: boolean;
  governable: boolean;
  scalable: boolean;
  modular: boolean;
  composable: boolean;
  policy_driven: boolean;
  trust_aware: boolean;
  constitutional: boolean;
  integrity_hash: string;
}>;

export type ProvingEnvironmentModel = Readonly<{
  environment_id: string;
  environment_version: string;
  environment_type: ProvingEnvironmentType;
  owner: string;
  tenant: string;
  purpose: string;
  dependencies: readonly string[];
  services: readonly ProvingServiceType[];
  configuration_ref: string;
  policy_refs: readonly string[];
  isolation_profile: string;
  security_profile: string;
  resource_profile: string;
  lifecycle_state: ProvingEnvironmentLifecycleState;
  identity_immutable: boolean;
  globally_unique: boolean;
  integrity_hash: string;
}>;

export type ProvingExecutionModel = Readonly<{
  execution_model_id: string;
  sequence: readonly string[];
  orchestration_defined: boolean;
  workload_scheduling_defined: boolean;
  startup_defined: boolean;
  shutdown_defined: boolean;
  coordination_defined: boolean;
  boundaries_defined: boolean;
  only_active_executes: boolean;
  runtime_logic_implemented: boolean;
  integrity_hash: string;
}>;

export type ProvingServiceCatalog = Readonly<{
  catalog_id: string;
  services: readonly ProvingServiceType[];
  registry_schema: boolean;
  service_contracts: boolean;
  independently_composable: boolean;
  lifecycle_integrated: boolean;
  dependency_resolution: boolean;
  interoperability: boolean;
  integrity_hash: string;
}>;

export type ProvingLifecycleModel = Readonly<{
  lifecycle_id: string;
  states: readonly ProvingEnvironmentLifecycleState[];
  deterministic_state_machine: boolean;
  registration_precedes_provisioning: boolean;
  validation_precedes_execution: boolean;
  archived_immutable: boolean;
  retired_non_executable: boolean;
  integrity_hash: string;
}>;

export type ProvingIsolationArchitecture = Readonly<{
  isolation_id: string;
  compute: boolean;
  storage: boolean;
  networking: boolean;
  messaging: boolean;
  identities: boolean;
  secrets: boolean;
  telemetry: boolean;
  evidence: boolean;
  replay: boolean;
  audit: boolean;
  production_access_requires_constitutional_authorization: boolean;
  integrity_hash: string;
}>;

export type ProvingGovernanceModel = Readonly<{
  governance_id: string;
  layer_0_inherited: boolean;
  program_1_inherited: boolean;
  program_2_inherited: boolean;
  program_3_inherited: boolean;
  program_4_inherited: boolean;
  program_5_inherited: boolean;
  architectural_decisions_emit_evidence: boolean;
  policy_enforced: boolean;
  trust_standing_consumed: boolean;
  integrity_hash: string;
}>;

export type ProvingDependencyArchitecture = Readonly<{
  dependency_id: string;
  consumes_program_1_capability_registry: boolean;
  consumes_program_2_platform_services: boolean;
  consumes_program_2_identity: boolean;
  consumes_program_2_deployment_services: boolean;
  consumes_program_2_runtime_services: boolean;
  consumes_program_2_observability: boolean;
  consumes_program_3_agent_runtime: boolean;
  consumes_program_4_applications: boolean;
  consumes_program_5_trust_standing: boolean;
  produces_environment_foundation: boolean;
  produces_environment_registration: boolean;
  produces_environment_lifecycle: boolean;
  produces_execution_foundation: boolean;
  integrity_hash: string;
}>;

export type ProvingArchitecturalInvariant = Readonly<{
  invariant_id: string;
  description: string;
  satisfied: boolean;
  evidence_ref: string;
  integrity_hash: string;
}>;

export type ProvingVerificationGate = Readonly<{
  gate_id: "P6.1-G1" | "P6.1-G2" | "P6.1-G3" | "P6.1-G4";
  name: string;
  verifies: readonly string[];
  passed: boolean;
  failures: readonly ProvingFoundationFailure[];
  integrity_hash: string;
}>;

export type ProvingBoundaryModel = Readonly<{
  boundary_id: string;
  owns_proving_scenarios: false;
  owns_proving_evidence: false;
  owns_replay: false;
  owns_certification: false;
  owns_qualification: false;
  owns_trust_evaluation: false;
  owns_runtime_execution_logic: false;
  integrity_hash: string;
}>;

export type ProvingFoundationReadiness = Readonly<{
  readiness_id: string;
  outcome: ProvingFoundationOutcome;
  phase_ready: boolean;
  architecture_complete: boolean;
  environment_model_complete: boolean;
  service_model_complete: boolean;
  execution_model_complete: boolean;
  lifecycle_deterministic: boolean;
  isolation_enforced: boolean;
  dependencies_declared: boolean;
  governance_inherited: boolean;
  gates_passed: boolean;
  invariants_satisfied: boolean;
  boundaries_respected: boolean;
  failures: readonly ProvingFoundationFailure[];
  integrity_hash: string;
}>;

export type ProvingFoundationResult = Readonly<{
  phase_version: "proving-architecture-environment-foundation/v6.1";
  phase_identifier: "ProvingArchitectureEnvironmentFoundation";
  trust_program_qualification_ref: "trust-program-qualification/v5.18";
  architecture: ProvingArchitecture;
  environment_model: ProvingEnvironmentModel;
  execution_model: ProvingExecutionModel;
  service_catalog: ProvingServiceCatalog;
  lifecycle: ProvingLifecycleModel;
  isolation: ProvingIsolationArchitecture;
  governance: ProvingGovernanceModel;
  dependencies: ProvingDependencyArchitecture;
  invariants: readonly ProvingArchitecturalInvariant[];
  gates: readonly ProvingVerificationGate[];
  boundaries: ProvingBoundaryModel;
  readiness: ProvingFoundationReadiness;
  replay_hash: string;
  integrity_hash: string;
}>;

export type ProvingFoundationValidation = Readonly<{
  valid: boolean;
  outcome: ProvingFoundationOutcome;
  replay_hash_valid: boolean;
  integrity_hash_valid: boolean;
  architecture_valid: boolean;
  environment_valid: boolean;
  execution_valid: boolean;
  services_valid: boolean;
  lifecycle_valid: boolean;
  isolation_valid: boolean;
  governance_valid: boolean;
  dependencies_valid: boolean;
  invariants_valid: boolean;
  gates_valid: boolean;
  boundaries_valid: boolean;
  readiness_valid: boolean;
  failures: readonly ProvingFoundationFailure[];
  integrity_hash: string;
}>;

export type ProvingFoundationBundle = Readonly<{
  doctrine: Readonly<{
    version: "proving-architecture-environment-foundation/v6.1";
    owns_proving_architecture: true;
    owns_environment_model: true;
    owns_service_model: true;
    owns_execution_model: true;
    owns_environment_lifecycle: true;
    owns_environment_registration: true;
    owns_runtime_execution_logic: false;
    owns_proving_scenarios: false;
    owns_proving_evidence: false;
    owns_replay: false;
    owns_certification: false;
    owns_qualification: false;
    owns_trust_evaluation: false;
  }>;
  result: ProvingFoundationResult;
  validation: ProvingFoundationValidation;
}>;
