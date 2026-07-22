export type AgentRegistryDecision = "AGENT_REGISTRY_QUALIFIED" | "CONDITIONALLY_QUALIFIED" | "NOT_QUALIFIED" | "FAIL_CLOSED";
export type AgentRegistryFailure =
  | "W2_0_CAF_CONSTITUTION_INVALID"
  | "W1_1B_IDENTITY_FULL_INVALID"
  | "W1_4B_REGISTRY_FULL_INVALID"
  | "W1_5_CONFIGURATION_PLATFORM_INVALID"
  | "W1_7B_SECURITY_FULL_INVALID"
  | "AGENT_REGISTRY_MISSING"
  | "REGISTRATION_NON_DETERMINISTIC"
  | "REGISTRATION_VALIDATION_FAILED"
  | "AGENT_IDENTITY_MISSING"
  | "AGENT_IDENTITY_MUTABLE"
  | "IDENTITY_UNIQUENESS_FAILED"
  | "VERSIONING_MISSING"
  | "VERSION_HISTORY_INCOMPLETE"
  | "VERSION_ARTIFACT_MUTABLE"
  | "LINEAGE_MISSING"
  | "LINEAGE_INCOMPLETE"
  | "LINEAGE_EDGE_MUTABLE"
  | "DISCOVERY_MISSING"
  | "DISCOVERY_NON_DETERMINISTIC"
  | "OWNERSHIP_GOVERNANCE_MISSING"
  | "OWNERSHIP_VALIDATION_FAILED"
  | "CONFIGURATION_REFERENCES_MISSING"
  | "CONFIGURATION_REFERENCE_RESOLUTION_FAILED"
  | "RUNTIME_ELIGIBILITY_MISSING"
  | "ELIGIBILITY_NOT_COMPUTED"
  | "ELIGIBILITY_NON_REPRODUCIBLE"
  | "CERTIFICATION_REFERENCES_MISSING"
  | "CERTIFICATION_REFERENCE_INVALID"
  | "TRUST_REFERENCES_MISSING"
  | "TRUST_REFERENCE_UNRESOLVED"
  | "REGISTRY_EXPLORER_MISSING"
  | "LINEAGE_VIEW_MISSING"
  | "TENANT_ISOLATION_FAILED"
  | "CONSTITUTIONAL_COMPLIANCE_FAILED"
  | "REGISTRY_EVIDENCE_MISSING"
  | "REGISTRY_EVIDENCE_NOT_IMMUTABLE"
  | "REGISTRY_REPLAY_INVALID"
  | "AGENT_REGISTRY_QUALIFICATION_GATE_FAILED";
export type AgentRegistryScenario = "BASELINE" | "QUALIFIED_WITH_OBSERVATIONS" | "CONDITIONAL_FOLLOWUP" | AgentRegistryFailure;
export type AgentRegistryInput = Readonly<{ scenario?: AgentRegistryScenario; seed?: string }>;
export type AgentRegistryService = Readonly<{ registry_id: string; agent_registration: boolean; agent_lookup: boolean; lifecycle_tracking: boolean; registration_validation: boolean; deterministic_retrieval: boolean; namespace_awareness: boolean; tenant_isolation: boolean; integrity_hash: string }>;
export type AgentIdentityModel = Readonly<{ model_id: string; agent_id: boolean; agent_name: boolean; namespace: boolean; tenant: boolean; organizational_ownership: boolean; creation_metadata: boolean; immutable_identity: boolean; identity_uniqueness: boolean; integrity_hash: string }>;
export type AgentVersioning = Readonly<{ manager_id: string; semantic_versions: boolean; compatibility_versions: boolean; release_lineage: boolean; deprecation: boolean; retirement: boolean; supersession: boolean; immutable_version_artifacts: boolean; integrity_hash: string }>;
export type AgentLineage = Readonly<{ engine_id: string; parent_agent: boolean; derived_agents: boolean; cloned_agents: boolean; merged_agents: boolean; replaced_agents: boolean; historical_evolution: boolean; immutable_edges: boolean; queryable: boolean; integrity_hash: string }>;
export type AgentDiscovery = Readonly<{ service_id: string; identity_lookup: boolean; capability_lookup: boolean; namespace_lookup: boolean; tenant_lookup: boolean; owner_lookup: boolean; certification_lookup: boolean; trust_lookup: boolean; eligibility_lookup: boolean; deterministic_results: boolean; integrity_hash: string }>;
export type AgentOwnership = Readonly<{ manager_id: string; owning_organization: boolean; owning_tenant: boolean; owning_namespace: boolean; responsible_authority: boolean; steward: boolean; maintainer: boolean; ownership_evidence_events: boolean; validation: boolean; integrity_hash: string }>;
export type AgentConfigurationReferences = Readonly<{ manager_id: string; configuration_profile: boolean; environment_profile: boolean; deployment_profile: boolean; feature_requirements: boolean; runtime_requirements: boolean; external_values_only: boolean; references_resolve: boolean; integrity_hash: string }>;
export type RuntimeEligibilityEvaluator = Readonly<{ evaluator_id: string; constitution_approved: boolean; identity_valid: boolean; certification_verified: boolean; trust_acceptable: boolean; dependencies_satisfied: boolean; policy_compliant: boolean; runtime_compatible: boolean; computed_not_assigned: boolean; reproducible: boolean; integrity_hash: string }>;
export type CertificationTrustReferences = Readonly<{ reference_id: string; certification_identifier: boolean; certification_status: boolean; certification_authority: boolean; certification_evidence: boolean; qualification_reports: boolean; trust_identifier: boolean; trust_standing: boolean; confidence_reference: boolean; restriction_reference: boolean; monitoring_reference: boolean; external_evaluations_only: boolean; integrity_hash: string }>;
export type AgentRegistryExplorer = Readonly<{ explorer_id: string; browsing: boolean; filtering: boolean; dependency_exploration: boolean; ownership_visualization: boolean; version_inspection: boolean; certification_inspection: boolean; lineage_view: boolean; deterministic_visualization: boolean; integrity_hash: string }>;
export type AgentRegistryEvidence = Readonly<{ ledger_id: string; records: readonly string[]; registration_evidence: boolean; identity_evidence: boolean; version_evidence: boolean; ownership_evidence: boolean; configuration_reference_evidence: boolean; eligibility_evidence: boolean; certification_reference_evidence: boolean; trust_reference_evidence: boolean; discovery_evidence: boolean; immutable: boolean; replayable: boolean; integrity_hash: string }>;
export type AgentRegistryQualification = Readonly<{ report_id: string; deterministic_registration: boolean; identity_uniqueness: boolean; immutable_version_lineage: boolean; deterministic_discovery_replay: boolean; ownership_validation: boolean; configuration_reference_validation: boolean; reproducible_eligibility: boolean; certification_reference_validation: boolean; trust_reference_resolution: boolean; explorer_validation: boolean; lineage_visualization_complete: boolean; evidence_integrity: boolean; tenant_isolation: boolean; constitutional_governance: boolean; gate_decision: AgentRegistryDecision; integrity_hash: string }>;
export type AgentRegistryReadiness = Readonly<{ readiness_id: string; decision: AgentRegistryDecision; phase_ready: boolean; constitution_ready: boolean; identity_ready: boolean; registry_ready: boolean; configuration_ready: boolean; security_ready: boolean; registry_service_ready: boolean; identity_model_ready: boolean; versioning_ready: boolean; lineage_ready: boolean; discovery_ready: boolean; ownership_ready: boolean; configuration_references_ready: boolean; eligibility_ready: boolean; certification_trust_ready: boolean; explorer_ready: boolean; evidence_ready: boolean; qualification_ready: boolean; failures: readonly AgentRegistryFailure[]; integrity_hash: string }>;
export type AgentRegistryResult = Readonly<{ phase_version: "agent-registry/w2.1"; phase_identifier: "AgentRegistry"; caf_constitution_ref: "caf-constitutional-foundation/w2.0"; identity_full_ref: "identity-full/w1.1b"; registry_full_ref: "registry-full/w1.4b"; configuration_platform_ref: "configuration-platform/w1.5"; security_full_ref: "security-full/w1.7b"; registry_service: AgentRegistryService; identity_model: AgentIdentityModel; versioning: AgentVersioning; lineage: AgentLineage; discovery: AgentDiscovery; ownership: AgentOwnership; configuration_references: AgentConfigurationReferences; runtime_eligibility: RuntimeEligibilityEvaluator; certification_trust: CertificationTrustReferences; explorer: AgentRegistryExplorer; evidence: AgentRegistryEvidence; qualification: AgentRegistryQualification; readiness: AgentRegistryReadiness; replay_hash: string; integrity_hash: string }>;
export type AgentRegistryValidation = Readonly<{ valid: boolean; decision: AgentRegistryDecision; replay_hash_valid: boolean; integrity_hash_valid: boolean; registry_valid: boolean; identity_valid: boolean; versioning_valid: boolean; lineage_valid: boolean; discovery_valid: boolean; ownership_valid: boolean; configuration_references_valid: boolean; eligibility_valid: boolean; certification_trust_valid: boolean; explorer_valid: boolean; evidence_valid: boolean; qualification_valid: boolean; readiness_valid: boolean; failures: readonly AgentRegistryFailure[]; integrity_hash: string }>;
export type AgentRegistryBundle = Readonly<{ doctrine: Readonly<{ version: "agent-registry/w2.1"; owns_agent_registry: true; owns_agent_identity_model: true; owns_agent_versioning: true; owns_agent_lineage: true; owns_agent_discovery: true; owns_agent_ownership: true; owns_configuration_references: true; owns_runtime_eligibility: true; owns_certification_references: true; owns_trust_references: true; owns_registry_explorer: true; owns_registry_evidence: true; qualification_gate: "Agent Registry Qualification Gate" }>; result: AgentRegistryResult; validation: AgentRegistryValidation }>;
