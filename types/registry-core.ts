export type RegistryCoreDecision = "CORE_ACTIVATED" | "ACTIVE_WITH_OBSERVATIONS" | "CONDITIONALLY_ACTIVE" | "NOT_ACTIVE" | "FAIL_CLOSED";
export type RegistryCoreFailure =
  | "W1_1A_IDENTITY_CORE_INVALID"
  | "W1_2A_STORAGE_CORE_INVALID"
  | "W1_3A_MESSAGING_CORE_INVALID"
  | "SECURITY_CORE_INVALID"
  | "REGISTRY_ARCHITECTURE_MISSING"
  | "REGISTRY_DATA_MODEL_INVALID"
  | "REGISTRY_PERSISTENCE_MISSING"
  | "REGISTRY_STORAGE_UNAVAILABLE"
  | "REGISTRATION_ENGINE_MISSING"
  | "SERVICE_REGISTRATION_FAILED"
  | "CONTRACT_REGISTRATION_FAILED"
  | "DEPENDENCY_REGISTRATION_FAILED"
  | "OWNERSHIP_REGISTRATION_FAILED"
  | "QUERY_ENGINE_MISSING"
  | "DETERMINISTIC_LOOKUP_FAILED"
  | "QUERY_NON_DETERMINISTIC"
  | "OWNERSHIP_REGISTRY_MISSING"
  | "AUTHORITY_RECORDS_MISSING"
  | "DEPENDENCY_REGISTRY_MISSING"
  | "DEPENDENCY_GRAPH_INVALID"
  | "DEPENDENCY_CYCLE_UNCONTROLLED"
  | "CONTRACT_REGISTRY_MISSING"
  | "CONTRACT_VALIDATION_FAILED"
  | "REGISTRY_MESSAGING_MISSING"
  | "REGISTRATION_EVENTS_NOT_PUBLISHED"
  | "REGISTRY_SECURITY_MISSING"
  | "REGISTRY_AUTHENTICATION_FAILED"
  | "REGISTRY_AUTHORIZATION_FAILED"
  | "REGISTRY_ACCESS_POLICY_VIOLATED"
  | "REGISTRY_EVIDENCE_MISSING"
  | "REGISTRY_EVIDENCE_NOT_IMMUTABLE"
  | "REGISTRATION_LINEAGE_MISSING"
  | "REGISTRY_REPLAY_INVALID"
  | "CORE_ACTIVATION_FAILED";
export type RegistryCoreScenario = "BASELINE" | "ACTIVE_WITH_OBSERVATIONS" | "CONDITIONAL_FOLLOWUP" | RegistryCoreFailure;
export type RegistryCoreInput = Readonly<{ scenario?: RegistryCoreScenario; seed?: string }>;
export type RegistryArchitecture = Readonly<{ architecture_id: string; data_model: boolean; registration_model: boolean; query_model: boolean; ownership_model: boolean; evidence_model: boolean; deterministic_discovery: boolean; integrity_hash: string }>;
export type RegistryPersistence = Readonly<{ storage_id: string; registry_database: boolean; indexes: boolean; version_storage: boolean; metadata_storage: boolean; durable_state: boolean; integrity_hashing: boolean; integrity_hash: string }>;
export type RegistrationEngine = Readonly<{ engine_id: string; service_registration: boolean; contract_registration: boolean; dependency_registration: boolean; ownership_registration: boolean; validation_pipeline: boolean; removal_policies: boolean; integrity_hash: string }>;
export type RegistryQueryEngine = Readonly<{ engine_id: string; deterministic_lookup: boolean; search_api: boolean; lookup_api: boolean; resolution_service: boolean; query_optimization: boolean; stable_sorting: boolean; integrity_hash: string }>;
export type OwnershipRegistry = Readonly<{ registry_id: string; service_owners: boolean; contract_owners: boolean; component_owners: boolean; namespace_owners: boolean; tenant_owners: boolean; authority_records: boolean; integrity_hash: string }>;
export type DependencyRegistry = Readonly<{ registry_id: string; service_dependencies: boolean; runtime_dependencies: boolean; infrastructure_dependencies: boolean; cross_core_dependencies: boolean; dependency_graph: boolean; dependency_lineage: boolean; cycle_controls: boolean; integrity_hash: string }>;
export type ContractRegistry = Readonly<{ registry_id: string; service_contracts: boolean; interface_contracts: boolean; api_contracts: boolean; platform_contracts: boolean; version_registry: boolean; contract_validation: boolean; integrity_hash: string }>;
export type RegistryMessaging = Readonly<{ messaging_id: string; command_transport: boolean; event_transport: boolean; service_registered_events: boolean; contract_registered_events: boolean; dependency_registered_events: boolean; ownership_changed_events: boolean; retry_and_dlq: boolean; integrity_hash: string }>;
export type RegistrySecurity = Readonly<{ security_id: string; authentication: boolean; authorization: boolean; access_policies: boolean; audit_controls: boolean; cryptographic_validation: boolean; certificate_validation: boolean; integrity_hash: string }>;
export type RegistryEvidence = Readonly<{ ledger_id: string; records: readonly string[]; registration_evidence: boolean; audit_evidence: boolean; lineage_records: boolean; registration_history: boolean; immutable: boolean; replay_validated: boolean; integrity_hash: string }>;
export type RegistryCoreReadiness = Readonly<{ readiness_id: string; decision: RegistryCoreDecision; phase_ready: boolean; identity_ready: boolean; storage_ready: boolean; messaging_ready: boolean; security_ready: boolean; architecture_ready: boolean; persistence_ready: boolean; registration_ready: boolean; query_ready: boolean; ownership_ready: boolean; dependency_ready: boolean; contract_ready: boolean; registry_messaging_ready: boolean; evidence_ready: boolean; failures: readonly RegistryCoreFailure[]; integrity_hash: string }>;
export type RegistryCoreResult = Readonly<{ phase_version: "registry-core/w1.4a"; phase_identifier: "RegistryCore"; identity_core_ref: "identity-core/w1.1a"; storage_core_ref: "storage-core/w1.2a"; messaging_core_ref: "messaging-core/w1.3a"; architecture: RegistryArchitecture; persistence: RegistryPersistence; registration_engine: RegistrationEngine; query_engine: RegistryQueryEngine; ownership_registry: OwnershipRegistry; dependency_registry: DependencyRegistry; contract_registry: ContractRegistry; registry_messaging: RegistryMessaging; security: RegistrySecurity; evidence: RegistryEvidence; readiness: RegistryCoreReadiness; replay_hash: string; integrity_hash: string }>;
export type RegistryCoreValidation = Readonly<{ valid: boolean; decision: RegistryCoreDecision; replay_hash_valid: boolean; integrity_hash_valid: boolean; architecture_valid: boolean; persistence_valid: boolean; registration_valid: boolean; query_valid: boolean; ownership_valid: boolean; dependency_valid: boolean; contract_valid: boolean; messaging_valid: boolean; security_valid: boolean; evidence_valid: boolean; readiness_valid: boolean; failures: readonly RegistryCoreFailure[]; integrity_hash: string }>;
export type RegistryCoreBundle = Readonly<{ doctrine: Readonly<{ version: "registry-core/w1.4a"; owns_registry_engine: true; owns_service_registration: true; owns_contract_registration: true; owns_dependency_registration: true; owns_ownership_registry: true; owns_query_engine: true; owns_registry_messaging: true; owns_registry_evidence: true }>; result: RegistryCoreResult; validation: RegistryCoreValidation }>;
