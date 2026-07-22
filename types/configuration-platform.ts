export type ConfigurationPlatformDecision = "CONFIGURATION_PLATFORM_QUALIFIED" | "CONDITIONALLY_QUALIFIED" | "NOT_QUALIFIED" | "FAIL_CLOSED";
export type ConfigurationPlatformFailure =
  | "W1_4A_REGISTRY_CORE_INVALID"
  | "W1_1A_IDENTITY_CORE_INVALID"
  | "W1_2A_STORAGE_CORE_INVALID"
  | "W1_3A_MESSAGING_CORE_INVALID"
  | "REGISTRY_RECONCILIATION_INCOMPLETE"
  | "OBSERVABILITY_QUALIFICATION_INVALID"
  | "SECURITY_CORE_INVALID"
  | "CONFIGURATION_ARCHITECTURE_MISSING"
  | "CONFIGURATION_DOMAIN_REGISTRY_MISSING"
  | "CONFIGURATION_SERVICE_MISSING"
  | "CONFIGURATION_STORAGE_UNAVAILABLE"
  | "CONFIGURATION_VERSION_HISTORY_MISSING"
  | "RUNTIME_CONFIGURATION_MISSING"
  | "RUNTIME_RESOLUTION_NON_DETERMINISTIC"
  | "RUNTIME_REFRESH_UNCONTROLLED"
  | "FEATURE_FLAG_PLATFORM_MISSING"
  | "FEATURE_FLAG_EVALUATION_NON_DETERMINISTIC"
  | "ROLLOUT_POLICY_INVALID"
  | "ENVIRONMENT_PROFILES_MISSING"
  | "ENVIRONMENT_ISOLATION_FAILED"
  | "PROFILE_INHERITANCE_NON_DETERMINISTIC"
  | "CONFIGURATION_VALIDATION_MISSING"
  | "SCHEMA_VALIDATION_FAILED"
  | "CONTRACT_VALIDATION_FAILED"
  | "DEPENDENCY_VALIDATION_FAILED"
  | "CONFLICT_DETECTION_FAILED"
  | "AUTHORIZATION_VALIDATION_FAILED"
  | "CONFIGURATION_EVIDENCE_MISSING"
  | "CONFIGURATION_EVIDENCE_NOT_IMMUTABLE"
  | "CONFIGURATION_LINEAGE_MISSING"
  | "CONFIGURATION_REPLAY_INVALID"
  | "CONFIGURATION_QUALIFICATION_FAILED";
export type ConfigurationPlatformScenario = "BASELINE" | "QUALIFIED_WITH_OBSERVATIONS" | "CONDITIONAL_FOLLOWUP" | ConfigurationPlatformFailure;
export type ConfigurationPlatformInput = Readonly<{ scenario?: ConfigurationPlatformScenario; seed?: string }>;
export type ConfigurationArchitecture = Readonly<{ architecture_id: string; domains_defined: boolean; ownership_defined: boolean; hierarchy_defined: boolean; lifecycle_defined: boolean; contracts_defined: boolean; inheritance_rules: boolean; override_rules: boolean; deterministic_resolution_model: boolean; integrity_hash: string }>;
export type ConfigurationService = Readonly<{ service_id: string; configuration_storage: boolean; retrieval: boolean; version_management: boolean; namespace_support: boolean; tenant_isolation: boolean; snapshots: boolean; immutable_history: boolean; integrity_hash: string }>;
export type RuntimeConfiguration = Readonly<{ engine_id: string; runtime_loading: boolean; configuration_caching: boolean; deterministic_resolution: boolean; immutable_snapshots: boolean; runtime_refresh: boolean; configuration_locking: boolean; reproducible: boolean; integrity_hash: string }>;
export type FeatureFlagPlatform = Readonly<{ platform_id: string; flag_registry: boolean; feature_activation: boolean; rollout_policies: boolean; environment_targeting: boolean; tenant_targeting: boolean; evaluation_logging: boolean; deterministic_evaluation: boolean; integrity_hash: string }>;
export type EnvironmentProfiles = Readonly<{ registry_id: string; profiles: readonly string[]; environment_inheritance: boolean; profile_validation: boolean; environment_policies: boolean; environment_isolation: boolean; deterministic_inheritance: boolean; integrity_hash: string }>;
export type ConfigurationValidation = Readonly<{ engine_id: string; schema_validation: boolean; contract_validation: boolean; dependency_validation: boolean; conflict_detection: boolean; authorization_validation: boolean; deterministic_validation: boolean; passed: boolean; integrity_hash: string }>;
export type ConfigurationEvidence = Readonly<{ ledger_id: string; records: readonly string[]; configuration_lineage: boolean; configuration_decisions: boolean; version_evidence: boolean; validation_evidence: boolean; deployment_evidence: boolean; immutable_audit: boolean; replayable: boolean; integrity_hash: string }>;
export type ConfigurationQualification = Readonly<{ report_id: string; deterministic_resolution: boolean; configuration_integrity: boolean; environment_isolation: boolean; feature_flag_evaluation: boolean; runtime_consistency: boolean; evidence_completeness: boolean; replayability: boolean; qualified: boolean; integrity_hash: string }>;
export type ConfigurationPlatformReadiness = Readonly<{ readiness_id: string; decision: ConfigurationPlatformDecision; phase_ready: boolean; registry_core_ready: boolean; identity_core_ready: boolean; storage_core_ready: boolean; messaging_core_ready: boolean; registry_reconciliation_complete: boolean; observability_qualified: boolean; security_core_ready: boolean; architecture_ready: boolean; service_ready: boolean; runtime_ready: boolean; feature_flags_ready: boolean; environment_profiles_ready: boolean; validation_ready: boolean; evidence_ready: boolean; qualification_ready: boolean; failures: readonly ConfigurationPlatformFailure[]; integrity_hash: string }>;
export type ConfigurationPlatformResult = Readonly<{ phase_version: "configuration-platform/w1.5"; phase_identifier: "ConfigurationPlatform"; registry_core_ref: "registry-core/w1.4a"; identity_core_ref: "identity-core/w1.1a"; storage_core_ref: "storage-core/w1.2a"; messaging_core_ref: "messaging-core/w1.3a"; architecture: ConfigurationArchitecture; configuration_service: ConfigurationService; runtime_configuration: RuntimeConfiguration; feature_flags: FeatureFlagPlatform; environment_profiles: EnvironmentProfiles; validation: ConfigurationValidation; evidence: ConfigurationEvidence; qualification: ConfigurationQualification; readiness: ConfigurationPlatformReadiness; replay_hash: string; integrity_hash: string }>;
export type ConfigurationPlatformValidation = Readonly<{ valid: boolean; decision: ConfigurationPlatformDecision; replay_hash_valid: boolean; integrity_hash_valid: boolean; architecture_valid: boolean; service_valid: boolean; runtime_valid: boolean; feature_flags_valid: boolean; environment_profiles_valid: boolean; configuration_validation_valid: boolean; evidence_valid: boolean; qualification_valid: boolean; readiness_valid: boolean; failures: readonly ConfigurationPlatformFailure[]; integrity_hash: string }>;
export type ConfigurationPlatformBundle = Readonly<{ doctrine: Readonly<{ version: "configuration-platform/w1.5"; owns_configuration_service: true; owns_runtime_configuration: true; owns_feature_flags: true; owns_environment_profiles: true; owns_configuration_validation: true; owns_configuration_evidence: true; exit_state: "CONFIGURATION_PLATFORM_QUALIFIED" }>; result: ConfigurationPlatformResult; validation: ConfigurationPlatformValidation }>;
