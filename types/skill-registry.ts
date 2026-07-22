export type SkillRegistryDecision = "SKILL_REGISTRY_OPERATIONAL" | "CONDITIONALLY_OPERATIONAL" | "NOT_OPERATIONAL" | "FAIL_CLOSED";
export type SkillRegistryFailure =
  | "W2_0_CAF_CONSTITUTION_INVALID"
  | "W2_1_AGENT_REGISTRY_INVALID"
  | "W2_2_LIFECYCLE_ENGINE_INVALID"
  | "W2_3_CAPABILITY_REGISTRY_INVALID"
  | "SKILL_REGISTRY_MISSING"
  | "SKILL_IDENTITY_NOT_UNIQUE"
  | "SKILL_OWNER_AMBIGUOUS"
  | "SKILL_CAPABILITY_MAPPING_MISSING"
  | "SKILL_METADATA_INVALID"
  | "PACKAGE_REPOSITORY_MISSING"
  | "UNSIGNED_PACKAGE_ALLOWED"
  | "PACKAGE_INTEGRITY_INVALID"
  | "PACKAGE_NOT_IMMUTABLE"
  | "PACKAGE_NOT_REPRODUCIBLE"
  | "VERSION_MANAGER_MISSING"
  | "VERSION_LINEAGE_MISSING"
  | "ROLLBACK_REFERENCES_MISSING"
  | "DEPRECATED_SKILL_EXECUTABLE"
  | "REVOKED_SKILL_EXECUTABLE"
  | "COMPATIBILITY_ENGINE_MISSING"
  | "RUNTIME_COMPATIBILITY_INVALID"
  | "CAPABILITY_COMPATIBILITY_INVALID"
  | "AUTHORITY_COMPATIBILITY_INVALID"
  | "POLICY_COMPATIBILITY_INVALID"
  | "DEPENDENCY_COMPATIBILITY_INVALID"
  | "LIFECYCLE_COMPATIBILITY_INVALID"
  | "CERTIFICATION_COMPATIBILITY_INVALID"
  | "DEPENDENCY_GRAPH_NON_DETERMINISTIC"
  | "DEPENDENCY_CYCLE_UNDETECTED"
  | "MISSING_DEPENDENCY_ALLOWED"
  | "CERTIFICATION_MANAGER_MISSING"
  | "UNCERTIFIED_SKILL_DEPLOYABLE"
  | "CERTIFICATION_EVIDENCE_MISSING"
  | "CERTIFICATION_EXPIRATION_IGNORED"
  | "CERTIFICATION_REVOCATION_IGNORED"
  | "DISCOVERY_ENGINE_MISSING"
  | "DISCOVERY_RESULTS_NON_DETERMINISTIC"
  | "SKILL_TEST_HARNESS_MISSING"
  | "REPLAY_VALIDATION_MISSING"
  | "SECURITY_VALIDATION_MISSING"
  | "TENANT_ISOLATION_FAILED"
  | "GOVERNANCE_API_MISSING"
  | "GOVERNANCE_POLICY_NOT_ENFORCED"
  | "SKILL_EVIDENCE_MISSING"
  | "SKILL_EVIDENCE_NOT_IMMUTABLE"
  | "SKILL_REGISTRY_REPLAY_INVALID"
  | "SKILL_REGISTRY_OPERATIONAL_GATE_FAILED";
export type SkillRegistryScenario = "BASELINE" | "OPERATIONAL_WITH_OBSERVATIONS" | "CONDITIONAL_FOLLOWUP" | SkillRegistryFailure;
export type SkillRegistryInput = Readonly<{ scenario?: SkillRegistryScenario; seed?: string }>;
export type SkillLifecycleState = "Draft" | "Developing" | "Testing" | "Validated" | "Certified" | "Published" | "Deprecated" | "Retired" | "Revoked";
export type CompatibilityOutcome = "Compatible" | "Compatible with Restrictions" | "Upgrade Required" | "Incompatible";
export type SkillRegistryCatalog = Readonly<{ registry_id: string; authoritative_catalog: boolean; unique_skill_identity: boolean; metadata_indexing: boolean; discovery_indexing: boolean; ownership_binding: boolean; single_owner: boolean; capability_mapping: boolean; runtime_requirements: boolean; supported_agents: boolean; certification_status: boolean; risk_classification: boolean; authority_requirements: boolean; tenant_scope: boolean; lifecycle_state: SkillLifecycleState; integrity_hash: string }>;
export type SkillPackageRepository = Readonly<{ repository_id: string; executable_logic: boolean; schemas: boolean; manifests: boolean; policies: boolean; configuration: boolean; documentation: boolean; tests: boolean; certification_artifacts: boolean; replay_artifacts: boolean; immutable_packages: boolean; signed_packages: boolean; reproducible_packages: boolean; versioned_packages: boolean; package_integrity: boolean; integrity_hash: string }>;
export type SkillVersionManager = Readonly<{ manager_id: string; semantic_versions: boolean; immutable_releases: boolean; patch_tracking: boolean; deprecation: boolean; retirement: boolean; compatibility_history: boolean; upgrade_paths: boolean; rollback_references: boolean; release_dates: boolean; lineage: boolean; change_summary: boolean; certification_linkage: boolean; integrity_hash: string }>;
export type SkillDependencyGraph = Readonly<{ graph_id: string; deterministic_resolution: boolean; dependency_existence: boolean; dependency_versions: boolean; circular_detection: boolean; package_integrity: boolean; capability_availability: boolean; authority_compatibility: boolean; certification_compatibility: boolean; cycle_free: boolean; integrity_hash: string }>;
export type SkillCompatibilityEngine = Readonly<{ engine_id: string; runtime_compatibility: boolean; capability_compatibility: boolean; authority_compatibility: boolean; policy_compatibility: boolean; dependency_compatibility: boolean; package_compatibility: boolean; lifecycle_compatibility: boolean; certification_compatibility: boolean; outcomes: readonly CompatibilityOutcome[]; deterministic_reports: boolean; integrity_hash: string }>;
export type SkillCertificationManager = Readonly<{ manager_id: string; testing_status: boolean; qualification_evidence: boolean; replay_validation: boolean; security_validation: boolean; policy_validation: boolean; authority_validation: boolean; operational_approval: boolean; expiration_tracking: boolean; certification_history: boolean; revocation: boolean; production_blocks_uncertified: boolean; integrity_hash: string }>;
export type SkillDiscoveryExplorer = Readonly<{ explorer_id: string; search: boolean; filtering: boolean; capability_lookup: boolean; authority_lookup: boolean; certification_lookup: boolean; version_lookup: boolean; dependency_lookup: boolean; dependency_visualization: boolean; version_comparison: boolean; package_browsing: boolean; lineage_exploration: boolean; deterministic_results: boolean; integrity_hash: string }>;
export type SkillTestHarness = Readonly<{ harness_id: string; unit_execution: boolean; integration_testing: boolean; policy_validation: boolean; authority_validation: boolean; replay_testing: boolean; compatibility_testing: boolean; regression_testing: boolean; certification_testing: boolean; functionality_validated: boolean; certification_readiness: boolean; integrity_hash: string }>;
export type SkillGovernanceApis = Readonly<{ api_id: string; register_skill: boolean; update_metadata: boolean; retrieve_skill: boolean; search_skills: boolean; list_versions: boolean; view_dependencies: boolean; upload_package: boolean; retrieve_package: boolean; verify_package: boolean; download_package: boolean; compare_packages: boolean; validate_skill: boolean; validate_runtime: boolean; resolve_dependencies: boolean; compatibility_report: boolean; submit_certification: boolean; retrieve_certification: boolean; revoke_certification: boolean; certification_history: boolean; policy_enforcement: boolean; runtime_deployment_eligibility: boolean; integrity_hash: string }>;
export type SkillRegistryEvidence = Readonly<{ ledger_id: string; records: readonly string[]; registration_records: boolean; package_manifests: boolean; version_history: boolean; compatibility_reports: boolean; dependency_graphs: boolean; certification_evidence: boolean; replay_evidence: boolean; security_evidence: boolean; governance_decisions: boolean; lifecycle_records: boolean; immutable: boolean; replayable: boolean; integrity_hash: string }>;
export type SkillRegistryOperationalReadiness = Readonly<{ readiness_id: string; decision: SkillRegistryDecision; phase_ready: boolean; constitution_ready: boolean; agent_registry_ready: boolean; lifecycle_engine_ready: boolean; capability_registry_ready: boolean; registry_ready: boolean; package_ready: boolean; version_ready: boolean; dependency_ready: boolean; compatibility_ready: boolean; certification_ready: boolean; discovery_ready: boolean; harness_ready: boolean; governance_api_ready: boolean; evidence_ready: boolean; production_deployment_eligible: boolean; failures: readonly SkillRegistryFailure[]; integrity_hash: string }>;
export type SkillRegistryResult = Readonly<{ phase_version: "skill-registry/w2.4"; phase_identifier: "SkillRegistry"; caf_constitution_ref: "caf-constitutional-foundation/w2.0"; agent_registry_ref: "agent-registry/w2.1"; lifecycle_engine_ref: "lifecycle-engine/w2.2"; capability_registry_ref: "capability-registry/w2.3"; registry: SkillRegistryCatalog; packages: SkillPackageRepository; versions: SkillVersionManager; dependencies: SkillDependencyGraph; compatibility: SkillCompatibilityEngine; certification: SkillCertificationManager; discovery: SkillDiscoveryExplorer; test_harness: SkillTestHarness; governance_apis: SkillGovernanceApis; evidence: SkillRegistryEvidence; readiness: SkillRegistryOperationalReadiness; replay_hash: string; integrity_hash: string }>;
export type SkillRegistryValidation = Readonly<{ valid: boolean; decision: SkillRegistryDecision; replay_hash_valid: boolean; integrity_hash_valid: boolean; registry_valid: boolean; packages_valid: boolean; versions_valid: boolean; dependencies_valid: boolean; compatibility_valid: boolean; certification_valid: boolean; discovery_valid: boolean; harness_valid: boolean; governance_apis_valid: boolean; evidence_valid: boolean; readiness_valid: boolean; failures: readonly SkillRegistryFailure[]; integrity_hash: string }>;
export type SkillRegistryBundle = Readonly<{ doctrine: Readonly<{ version: "skill-registry/w2.4"; owns_skill_registry: true; owns_skill_packages: true; owns_skill_versioning: true; owns_dependency_resolution: true; owns_compatibility_validation: true; owns_skill_certification: true; owns_skill_discovery: true; owns_skill_test_harness: true; owns_skill_governance_apis: true; owns_skill_evidence: true; operational_gate: "Skill Registry Operational Gate" }>; result: SkillRegistryResult; validation: SkillRegistryValidation }>;
