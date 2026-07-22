export type ProvingRegistryOutcome = "PASS" | "FAIL" | "REQUIRES_GOVERNANCE_REVIEW";
export type ProvingArtifactLifecycle = "DRAFT" | "REVIEW" | "APPROVED" | "REGISTERED" | "ACTIVE" | "DEPRECATED" | "RETIRED" | "ARCHIVED";
export type ScenarioCategory = "FUNCTIONAL" | "INTEGRATION" | "GOVERNANCE" | "POLICY" | "CONSTITUTIONAL" | "SECURITY" | "TRUST" | "SAFETY" | "RECOVERY" | "PERFORMANCE" | "SCALABILITY" | "STRESS" | "CHAOS" | "FAILURE_INJECTION" | "MULTI_TENANT" | "CROSS_TENANT_ISOLATION" | "REPLAY_VALIDATION" | "CERTIFICATION" | "QUALIFICATION";
export type ExperimentType = "CONTROLLED" | "COMPARATIVE" | "EXPLORATORY" | "REGRESSION" | "SIMULATION" | "AB_VALIDATION" | "COUNTERFACTUAL" | "SENSITIVITY_ANALYSIS" | "STRESS_ANALYSIS" | "RESILIENCE_STUDY";
export type RiskLevel = "LOW" | "MODERATE" | "HIGH" | "CRITICAL";

export type ProvingRegistryFailure =
  | "P6_2_PROVISIONING_INVALID"
  | "SCENARIO_REGISTRY_MISSING"
  | "EXPERIMENT_CATALOG_MISSING"
  | "BENCHMARK_REGISTRY_MISSING"
  | "EXERCISE_REGISTRY_MISSING"
  | "VALIDATION_CATALOG_MISSING"
  | "ARTIFACT_IDENTITY_MISSING"
  | "ARTIFACT_IDENTITY_MUTATED"
  | "ANONYMOUS_PROVING_ACTIVITY_ALLOWED"
  | "VERSION_GOVERNANCE_MISSING"
  | "HISTORICAL_VERSION_MUTABLE"
  | "REPRODUCIBILITY_METADATA_MISSING"
  | "DISCOVERY_SERVICE_MISSING"
  | "EVIDENCE_LINEAGE_MISSING"
  | "TENANT_VISIBILITY_VIOLATION"
  | "SCENARIO_METADATA_INCOMPLETE"
  | "EXPERIMENT_METADATA_INCOMPLETE"
  | "BENCHMARK_METADATA_INCOMPLETE"
  | "EXERCISE_METADATA_INCOMPLETE"
  | "VALIDATION_SUITE_DUPLICATES_ARTIFACTS"
  | "DEPENDENCY_TRACKING_MISSING"
  | "DEPENDENCY_VALIDATION_FAILED"
  | "LIFECYCLE_MANAGEMENT_MISSING"
  | "REGISTRY_API_MISSING"
  | "GOVERNANCE_METADATA_MISSING"
  | "APPROVAL_EVIDENCE_MISSING"
  | "ROLE_BASED_ACCESS_MISSING"
  | "POLICY_ENFORCEMENT_MISSING"
  | "IMMUTABLE_AUDIT_MISSING"
  | "REGISTRY_AUTHORIZATION_MISSING"
  | "EVIDENCE_PROTECTION_MISSING"
  | "TRACEABILITY_LINKS_MISSING"
  | "ORPHAN_ARTIFACT_DETECTED"
  | "EXECUTION_REFERENCE_NOT_VERSIONED"
  | "DOWNSTREAM_CONSUMPTION_NOT_READY"
  | "SCENARIO_EXECUTION_ATTEMPTED"
  | "SIMULATION_EXECUTION_ATTEMPTED"
  | "VALIDATION_LOGIC_IMPLEMENTED"
  | "CERTIFICATION_EXECUTION_ATTEMPTED"
  | "QUALIFICATION_EXECUTION_ATTEMPTED"
  | "GOVERNANCE_REVIEW_REQUIRED";

export type ProvingRegistryScenario = "BASELINE" | ProvingRegistryFailure;
export type ProvingRegistryInput = Readonly<{ scenario?: ProvingRegistryScenario; tenant_id?: string }>;

export type ScenarioDefinition = Readonly<{ scenario_id: string; name: string; description: string; owner: string; program: string; domain: string; category: ScenarioCategory; risk_level: RiskLevel; dependencies: readonly string[]; required_services: readonly string[]; required_policies: readonly string[]; required_roles: readonly string[]; environment_requirements: readonly string[]; dataset_requirements: readonly string[]; expected_outputs: readonly string[]; success_criteria: readonly string[]; version: string; lifecycle_status: ProvingArtifactLifecycle; objective: string; expected_behavior: string; participating_systems: readonly string[]; execution_constraints: readonly string[]; validation_expectations: readonly string[]; tenant_id: string; immutable_identity: boolean; integrity_hash: string }>;
export type ExperimentDefinition = Readonly<{ experiment_id: string; hypothesis: string; experiment_type: ExperimentType; variables: readonly string[]; controls: readonly string[]; measurements: readonly string[]; success_metrics: readonly string[]; observation_plan: string; statistical_requirements: readonly string[]; risk_classification: RiskLevel; owner: string; lifecycle_status: ProvingArtifactLifecycle; related_scenarios: readonly string[]; tenant_id: string; version: string; evidence_producing: boolean; integrity_hash: string }>;
export type BenchmarkDefinition = Readonly<{ benchmark_id: string; metric: string; measurement_method: string; units: string; target_value: number; acceptable_range: readonly [number, number]; failure_threshold: number; collection_method: string; sampling_rules: readonly string[]; applicable_services: readonly string[]; lifecycle_status: ProvingArtifactLifecycle; version: string; tenant_id: string; integrity_hash: string }>;
export type ExerciseDefinition = Readonly<{ exercise_id: string; exercise_type: string; objective: string; referenced_scenarios: readonly string[]; referenced_benchmarks: readonly string[]; referenced_experiments: readonly string[]; referenced_simulations: readonly string[]; owner: string; lifecycle_status: ProvingArtifactLifecycle; tenant_id: string; version: string; integrity_hash: string }>;
export type ValidationSuiteDefinition = Readonly<{ suite_id: string; name: string; scenario_refs: readonly string[]; experiment_refs: readonly string[]; benchmark_refs: readonly string[]; exercise_refs: readonly string[]; duplicates_artifacts: boolean; lifecycle_status: ProvingArtifactLifecycle; tenant_id: string; version: string; integrity_hash: string }>;
export type RegistryGovernance = Readonly<{ governance_id: string; owner: boolean; approving_authority: boolean; lifecycle_status: boolean; review_history: readonly string[]; approval_evidence: readonly string[]; version_history: readonly string[]; dependency_validation: boolean; integrity_hash: string }>;
export type RegistrySecurity = Readonly<{ security_id: string; tenant_isolation: boolean; role_based_access: boolean; policy_enforcement: boolean; immutable_audit: boolean; registry_authorization: boolean; evidence_protection: boolean; integrity_hash: string }>;
export type RegistryTraceability = Readonly<{ traceability_id: string; originating_requirements: readonly string[]; proving_objectives: readonly string[]; execution_history_refs: readonly string[]; produced_evidence_refs: readonly string[]; benchmark_result_refs: readonly string[]; qualification_report_refs: readonly string[]; certification_report_refs: readonly string[]; no_orphan_artifacts: boolean; execution_references_registered_versions: boolean; integrity_hash: string }>;
export type RegistryServices = Readonly<{ services_id: string; scenario_registration: boolean; experiment_registration: boolean; benchmark_registration: boolean; validation_catalog: boolean; exercise_registry: boolean; search: boolean; dependency_tracking: boolean; version_management: boolean; api_surface: readonly string[]; integrity_hash: string }>;
export type ArtifactVersioning = Readonly<{ versioning_id: string; immutable_identity: boolean; metadata_may_evolve: boolean; historical_versions_immutable: boolean; scenario_version_refs: readonly string[]; experiment_version_refs: readonly string[]; benchmark_version_refs: readonly string[]; integrity_hash: string }>;
export type RegistryRelationships = Readonly<{ relationships_id: string; validation_suite_to_scenarios: boolean; validation_suite_to_experiments: boolean; validation_suite_to_benchmarks: boolean; validation_suite_to_exercises: boolean; scenario_to_environment: boolean; scenario_to_dataset: boolean; scenario_to_policy: boolean; scenario_to_identity: boolean; scenario_to_service: boolean; scenario_to_expected_evidence: boolean; integrity_hash: string }>;
export type ProvingRegistryBoundary = Readonly<{ boundary_id: string; executes_scenarios: false; executes_simulations: false; implements_validation_logic: false; performs_certification: false; performs_qualification: false; integrity_hash: string }>;
export type ProvingRegistryReadiness = Readonly<{ readiness_id: string; outcome: ProvingRegistryOutcome; phase_ready: boolean; scenario_registry_ready: boolean; experiment_catalog_ready: boolean; benchmark_registry_ready: boolean; exercise_registry_ready: boolean; validation_catalog_ready: boolean; versioning_ready: boolean; discovery_ready: boolean; dependency_tracking_ready: boolean; governance_ready: boolean; security_ready: boolean; traceability_ready: boolean; downstream_ready: boolean; boundaries_respected: boolean; failures: readonly ProvingRegistryFailure[]; integrity_hash: string }>;

export type ProvingRegistryResult = Readonly<{ phase_version: "proving-scenario-registry-experiment-catalog/v6.3"; phase_identifier: "ProvingScenarioRegistryExperimentCatalog"; provisioning_ref: "proving-environment-identity-isolation-provisioning/v6.2"; scenario_registry: readonly ScenarioDefinition[]; experiment_catalog: readonly ExperimentDefinition[]; benchmark_registry: readonly BenchmarkDefinition[]; exercise_registry: readonly ExerciseDefinition[]; validation_catalog: readonly ValidationSuiteDefinition[]; services: RegistryServices; governance: RegistryGovernance; security: RegistrySecurity; traceability: RegistryTraceability; versioning: ArtifactVersioning; relationships: RegistryRelationships; boundaries: ProvingRegistryBoundary; readiness: ProvingRegistryReadiness; replay_hash: string; integrity_hash: string }>;
export type ProvingRegistryValidation = Readonly<{ valid: boolean; outcome: ProvingRegistryOutcome; replay_hash_valid: boolean; integrity_hash_valid: boolean; scenario_registry_valid: boolean; experiment_catalog_valid: boolean; benchmark_registry_valid: boolean; exercise_registry_valid: boolean; validation_catalog_valid: boolean; services_valid: boolean; governance_valid: boolean; security_valid: boolean; traceability_valid: boolean; versioning_valid: boolean; relationships_valid: boolean; boundaries_valid: boolean; readiness_valid: boolean; failures: readonly ProvingRegistryFailure[]; integrity_hash: string }>;
export type ProvingRegistryBundle = Readonly<{ doctrine: Readonly<{ version: "proving-scenario-registry-experiment-catalog/v6.3"; owns_scenario_registry: true; owns_experiment_catalog: true; owns_exercise_registry: true; owns_benchmark_registry: true; owns_validation_catalog: true; owns_registry_apis: true; executes_scenarios: false; executes_simulations: false; implements_validation_logic: false; performs_certification: false; performs_qualification: false }>; result: ProvingRegistryResult; validation: ProvingRegistryValidation }>;
