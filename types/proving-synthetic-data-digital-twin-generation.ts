export type SyntheticGenerationOutcome = "PASS" | "FAIL" | "REQUIRES_GOVERNANCE_REVIEW";
export type DigitalTwinLifecycle = "DEFINED" | "GENERATED" | "VALIDATED" | "REGISTERED" | "ACTIVE" | "UPDATED" | "ARCHIVED" | "RETIRED";
export type SyntheticDatasetLifecycle = "DEFINED" | "GENERATED" | "VALIDATED" | "CATALOGED" | "PUBLISHED" | "VERSIONED" | "ARCHIVED";
export type DigitalTwinCategory = "ORGANIZATION" | "INFRASTRUCTURE" | "PLATFORM" | "APPLICATION" | "USER" | "WORKFLOW" | "MISSION" | "ENVIRONMENT";
export type SyntheticDataModality = "STRUCTURED" | "SEMI_STRUCTURED" | "DOCUMENTS" | "IMAGES" | "TELEMETRY" | "EVENTS" | "TIME_SERIES" | "SENSOR_STREAMS" | "FINANCIAL_RECORDS" | "OPERATIONAL_RECORDS";

export type SyntheticGenerationFailure =
  | "P6_3_REGISTRY_INVALID"
  | "SYNTHETIC_TENANT_GENERATOR_MISSING"
  | "SYNTHETIC_ORGANIZATION_GENERATOR_MISSING"
  | "SYNTHETIC_USER_GENERATOR_MISSING"
  | "SYNTHETIC_MISSION_GENERATOR_MISSING"
  | "SYNTHETIC_DATASET_GENERATOR_MISSING"
  | "DIGITAL_TWIN_GENERATOR_MISSING"
  | "INFRASTRUCTURE_TWIN_GENERATOR_MISSING"
  | "BEHAVIORAL_MODEL_GENERATOR_MISSING"
  | "HISTORICAL_TIMELINE_GENERATOR_MISSING"
  | "ENVIRONMENT_COMPOSER_MISSING"
  | "PRODUCTION_DATA_EXPOSURE"
  | "STATISTICAL_REALISM_MISSING"
  | "DETERMINISTIC_REPLAY_MISSING"
  | "GENERATION_SEED_MISSING"
  | "GENERATOR_IDENTITY_MISSING"
  | "CONFIGURATION_VERSION_MISSING"
  | "SCHEMA_VALIDATION_FAILED"
  | "ONTOLOGY_COMPLIANCE_FAILED"
  | "REFERENTIAL_INTEGRITY_FAILED"
  | "DEPENDENCY_INTEGRITY_FAILED"
  | "LIFECYCLE_CONSISTENCY_FAILED"
  | "IDENTITY_UNIQUENESS_FAILED"
  | "GOVERNANCE_CONSISTENCY_FAILED"
  | "TRUST_COMPATIBILITY_FAILED"
  | "DIGITAL_TWIN_LINEAGE_MISSING"
  | "DIGITAL_TWIN_VERSION_HISTORY_MISSING"
  | "SYNTHETIC_DATA_CATALOG_MISSING"
  | "SYNTHETIC_ENVIRONMENT_REGISTRY_MISSING"
  | "COMPOSED_ENVIRONMENT_NOT_EXECUTABLE"
  | "GOVERNANCE_SAFE_EVIDENCE_MISSING"
  | "SCENARIO_INSTANTIATION_MISSING"
  | "SIMULATION_EXECUTION_ATTEMPTED"
  | "BENCHMARK_EXECUTION_ATTEMPTED"
  | "CERTIFICATION_EXECUTION_ATTEMPTED"
  | "VALIDATION_ORCHESTRATION_ATTEMPTED"
  | "GOVERNANCE_REVIEW_REQUIRED";

export type SyntheticGenerationScenario = "BASELINE" | SyntheticGenerationFailure;
export type SyntheticGenerationInput = Readonly<{ scenario?: SyntheticGenerationScenario; seed?: string; tenant_id?: string }>;

export type SyntheticTenantModel = Readonly<{ tenant_id: string; governance_model: string; departments: readonly string[]; users: number; permissions: readonly string[]; capabilities: readonly string[]; policies: readonly string[]; operational_structure: string; integrity_hash: string }>;
export type SyntheticOrganizationModel = Readonly<{ organization_id: string; organization_type: string; hierarchy_depth: number; complexity: "LOW" | "MODERATE" | "HIGH"; governance_models: readonly string[]; units: readonly string[]; integrity_hash: string }>;
export type SyntheticUserPopulation = Readonly<{ population_id: string; count_supported: "THOUSANDS" | "MILLIONS" | "BILLIONS"; roles: readonly string[]; responsibilities: readonly string[]; permissions: readonly string[]; expertise: readonly string[]; workload_model: string; communication_patterns: readonly string[]; integrity_hash: string }>;
export type SyntheticMissionCatalog = Readonly<{ catalog_id: string; mission_types: readonly string[]; objectives: readonly string[]; priorities: readonly string[]; constraints: readonly string[]; timelines: readonly string[]; authorities: readonly string[]; resources: readonly string[]; dependencies: readonly string[]; expected_outcomes: readonly string[]; integrity_hash: string }>;
export type SyntheticDatasetCatalog = Readonly<{ catalog_id: string; modalities: readonly SyntheticDataModality[]; statistically_realistic: boolean; deterministic: boolean; configurable: boolean; lifecycle: readonly SyntheticDatasetLifecycle[]; no_production_data: boolean; integrity_hash: string }>;
export type DigitalTwinModel = Readonly<{ twin_id: string; categories: readonly DigitalTwinCategory[]; lifecycle: readonly DigitalTwinLifecycle[]; immutable_identity: boolean; state: string; topology: readonly string[]; dependencies: readonly string[]; behavior_model: string; event_model: string; state_transitions: readonly string[]; evidence_lineage: readonly string[]; version_history: readonly string[]; integrity_hash: string }>;
export type InfrastructureTwinModel = Readonly<{ twin_id: string; cloud: boolean; networks: boolean; services: boolean; compute: boolean; storage: boolean; containers: boolean; kubernetes: boolean; apis: boolean; messaging: boolean; security: boolean; failures: boolean; outages: boolean; scaling: boolean; latency: boolean; recovery: boolean; integrity_hash: string }>;
export type BehavioralModel = Readonly<{ model_id: string; operators: boolean; caf_agents: boolean; applications: boolean; organizations: boolean; missions: boolean; governance: boolean; failures: boolean; deterministic_seeded_probabilities: boolean; configurable_distributions: boolean; repeatable_execution: boolean; integrity_hash: string }>;
export type HistoricalTimeline = Readonly<{ timeline_id: string; years_of_events: number; incident_history: boolean; governance_decisions: boolean; certifications: boolean; policy_evolution: boolean; trust_changes: boolean; operational_trends: boolean; replay_initialization: boolean; learning_validation: boolean; integrity_hash: string }>;
export type SyntheticEnvironmentComposition = Readonly<{ environment_id: string; tenants: readonly string[]; organizations: readonly string[]; users: readonly string[]; datasets: readonly string[]; infrastructure: readonly string[]; missions: readonly string[]; twins: readonly string[]; scenarios: readonly string[]; executable_in_proving_ground: boolean; integrity_hash: string }>;
export type GenerationPipeline = Readonly<{ pipeline_id: string; templates: boolean; configuration: boolean; random_seed: string; generators: boolean; validation: boolean; digital_twin: boolean; synthetic_environment: boolean; deterministic: boolean; equivalent_inputs_equivalent_outputs: boolean; generator_identity: string; integrity_hash: string }>;
export type GenerationValidation = Readonly<{ validation_id: string; schema_correctness: boolean; referential_integrity: boolean; ontology_compliance: boolean; dependency_integrity: boolean; statistical_realism: boolean; deterministic_replay: boolean; lifecycle_consistency: boolean; identity_uniqueness: boolean; governance_consistency: boolean; trust_compatibility: boolean; integrity_hash: string }>;
export type SyntheticGenerationBoundary = Readonly<{ boundary_id: string; redefines_p6_1_architecture: false; redefines_p6_2_identity: false; redefines_p6_3_registry: false; executes_simulations: false; executes_benchmarks: false; executes_certification: false; orchestrates_validation: false; integrity_hash: string }>;
export type SyntheticGenerationReadiness = Readonly<{ readiness_id: string; outcome: SyntheticGenerationOutcome; phase_ready: boolean; tenant_generation_ready: boolean; organization_generation_ready: boolean; user_generation_ready: boolean; mission_generation_ready: boolean; dataset_generation_ready: boolean; digital_twin_ready: boolean; infrastructure_twin_ready: boolean; behavior_model_ready: boolean; historical_timeline_ready: boolean; environment_composition_ready: boolean; validation_ready: boolean; no_production_data: boolean; boundaries_respected: boolean; failures: readonly SyntheticGenerationFailure[]; integrity_hash: string }>;

export type SyntheticGenerationResult = Readonly<{ phase_version: "proving-synthetic-data-digital-twin-generation/v6.4"; phase_identifier: "ProvingSyntheticDataDigitalTwinGeneration"; registry_ref: "proving-scenario-registry-experiment-catalog/v6.3"; pipeline: GenerationPipeline; tenant: SyntheticTenantModel; organization: SyntheticOrganizationModel; users: SyntheticUserPopulation; missions: SyntheticMissionCatalog; datasets: SyntheticDatasetCatalog; digital_twins: DigitalTwinModel; infrastructure_twin: InfrastructureTwinModel; behavior: BehavioralModel; timeline: HistoricalTimeline; composition: SyntheticEnvironmentComposition; validation: GenerationValidation; boundaries: SyntheticGenerationBoundary; readiness: SyntheticGenerationReadiness; replay_hash: string; integrity_hash: string }>;
export type SyntheticGenerationValidationResult = Readonly<{ valid: boolean; outcome: SyntheticGenerationOutcome; replay_hash_valid: boolean; integrity_hash_valid: boolean; pipeline_valid: boolean; tenant_valid: boolean; organization_valid: boolean; users_valid: boolean; missions_valid: boolean; datasets_valid: boolean; twins_valid: boolean; infrastructure_valid: boolean; behavior_valid: boolean; timeline_valid: boolean; composition_valid: boolean; validation_valid: boolean; boundaries_valid: boolean; readiness_valid: boolean; failures: readonly SyntheticGenerationFailure[]; integrity_hash: string }>;
export type SyntheticGenerationBundle = Readonly<{ doctrine: Readonly<{ version: "proving-synthetic-data-digital-twin-generation/v6.4"; owns_synthetic_tenants: true; owns_synthetic_organizations: true; owns_synthetic_missions: true; owns_synthetic_datasets: true; owns_digital_twins: true; exposes_production_data: false; redefines_prior_programs: false; executes_simulations: false; performs_certification: false; orchestrates_validation: false }>; result: SyntheticGenerationResult; validation: SyntheticGenerationValidationResult }>;
