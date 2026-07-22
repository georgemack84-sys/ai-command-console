export type RegistryFullDecision = "QUALIFIED" | "CONDITIONALLY_QUALIFIED" | "NOT_QUALIFIED" | "FAIL_CLOSED";
export type RegistryFullFailure =
  | "W1_1B_IDENTITY_FULL_INVALID"
  | "W1_2B_STORAGE_FULL_INVALID"
  | "W1_3B_MESSAGING_FULL_INVALID"
  | "W1_4A_REGISTRY_CORE_INVALID"
  | "CONFIGURATION_PLATFORM_INVALID"
  | "OBSERVABILITY_PLATFORM_INVALID"
  | "SECURITY_FULL_INVALID"
  | "REGISTRY_EXPLORER_MISSING"
  | "EXPLORER_NON_DETERMINISTIC"
  | "RELATIONSHIP_GRAPH_INCOMPLETE"
  | "REGISTRY_SEARCH_MISSING"
  | "SEARCH_INDEX_INCOMPLETE"
  | "SEARCH_NON_DETERMINISTIC"
  | "DEPENDENCY_ENGINE_MISSING"
  | "DEPENDENCY_GRAPH_INCOMPLETE"
  | "MISSING_DEPENDENCIES_UNDETECTED"
  | "CIRCULAR_DEPENDENCIES_UNDETECTED"
  | "DEPENDENCY_AUTHORITY_VIOLATION_UNDETECTED"
  | "COMPATIBILITY_ENGINE_MISSING"
  | "COMPATIBILITY_EVALUATION_NON_DETERMINISTIC"
  | "INCOMPATIBLE_DEPLOYMENT_ALLOWED"
  | "REGISTRY_LINEAGE_MISSING"
  | "LINEAGE_INCOMPLETE"
  | "LINEAGE_NOT_REPLAYABLE"
  | "LIFECYCLE_GOVERNANCE_MISSING"
  | "LIFECYCLE_APPROVAL_NOT_ENFORCED"
  | "LIFECYCLE_NON_DETERMINISTIC"
  | "CONTRACT_VALIDATION_ENGINE_MISSING"
  | "INVALID_CONTRACT_ALLOWED"
  | "CONSTITUTIONAL_VALIDATION_MISSING"
  | "QUALIFICATION_FRAMEWORK_MISSING"
  | "QUALIFICATION_EVIDENCE_MISSING"
  | "QUALIFICATION_EVIDENCE_NOT_IMMUTABLE"
  | "GOVERNANCE_AUTHORITY_VALIDATION_FAILED"
  | "TENANT_ISOLATION_FAILED"
  | "AUDIT_INTEGRITY_FAILED"
  | "REGISTRY_INFRASTRUCTURE_GATE_FAILED";
export type RegistryFullScenario = "BASELINE" | "QUALIFIED_WITH_OBSERVATIONS" | "CONDITIONAL_FOLLOWUP" | RegistryFullFailure;
export type RegistryFullInput = Readonly<{ scenario?: RegistryFullScenario; seed?: string }>;
export type RegistryExplorer = Readonly<{ explorer_id: string; hierarchical_browsing: boolean; namespace_traversal: boolean; ownership_visualization: boolean; capability_relationships: boolean; artifact_navigation: boolean; contract_browsing: boolean; relationship_graph: boolean; deterministic: boolean; integrity_hash: string }>;
export type RegistrySearch = Readonly<{ search_id: string; indexed_registry: boolean; metadata_search: boolean; contract_search: boolean; identity_search: boolean; ownership_search: boolean; tag_search: boolean; version_lookup: boolean; lifecycle_filtering: boolean; deterministic_results: boolean; integrity_hash: string }>;
export type DependencyIntelligence = Readonly<{ engine_id: string; dependency_graph: boolean; missing_detection: boolean; cycle_detection: boolean; version_validation: boolean; ownership_validation: boolean; contract_validation: boolean; authority_validation: boolean; impact_analysis: boolean; integrity_hash: string }>;
export type CompatibilityEvaluation = Readonly<{ engine_id: string; compatibility_matrix: boolean; interface_compatibility: boolean; schema_compatibility: boolean; message_compatibility: boolean; version_compatibility: boolean; deployment_compatibility: boolean; policy_compatibility: boolean; deterministic_evaluation: boolean; integrity_hash: string }>;
export type RegistryLineage = Readonly<{ lineage_id: string; registrations: boolean; updates: boolean; approvals: boolean; ownership_changes: boolean; dependency_evolution: boolean; lifecycle_transitions: boolean; qualification_history: boolean; replayable: boolean; complete: boolean; integrity_hash: string }>;
export type LifecycleGovernance = Readonly<{ governance_id: string; creation: boolean; approval: boolean; activation: boolean; modification: boolean; deprecation: boolean; retirement: boolean; archival: boolean; authority_enforcement: boolean; policy_validation: boolean; deterministic_workflows: boolean; integrity_hash: string }>;
export type RegistryContractValidation = Readonly<{ engine_id: string; schema_correctness: boolean; interface_consistency: boolean; dependency_integrity: boolean; policy_compliance: boolean; semantic_validation: boolean; authority_validation: boolean; deterministic_behavior: boolean; invalid_contract_rejection: boolean; integrity_hash: string }>;
export type RegistryFullQualification = Readonly<{ report_id: string; deterministic_queries: boolean; deterministic_validation: boolean; governance_enforcement: boolean; lifecycle_correctness: boolean; dependency_accuracy: boolean; compatibility_accuracy: boolean; lineage_completeness: boolean; evidence_integrity: boolean; tenant_isolation: boolean; gate_decision: RegistryFullDecision; integrity_hash: string }>;
export type RegistryFullEvidence = Readonly<{ ledger_id: string; records: readonly string[]; search_evidence: boolean; dependency_evidence: boolean; compatibility_evidence: boolean; lineage_evidence: boolean; governance_evidence: boolean; validation_evidence: boolean; immutable: boolean; replayable: boolean; integrity_hash: string }>;
export type RegistryFullReadiness = Readonly<{ readiness_id: string; decision: RegistryFullDecision; phase_ready: boolean; identity_full_ready: boolean; storage_full_ready: boolean; messaging_full_ready: boolean; registry_core_ready: boolean; configuration_ready: boolean; observability_ready: boolean; security_full_ready: boolean; explorer_ready: boolean; search_ready: boolean; dependency_ready: boolean; compatibility_ready: boolean; lineage_ready: boolean; lifecycle_ready: boolean; contract_validation_ready: boolean; evidence_ready: boolean; qualification_ready: boolean; failures: readonly RegistryFullFailure[]; integrity_hash: string }>;
export type RegistryFullResult = Readonly<{ phase_version: "registry-full/w1.4b"; phase_identifier: "RegistryFull"; identity_full_ref: "identity-full/w1.1b"; storage_full_ref: "storage-full/w1.2b"; messaging_full_ref: "messaging-full/w1.3b"; registry_core_ref: "registry-core/w1.4a"; explorer: RegistryExplorer; search: RegistrySearch; dependency_intelligence: DependencyIntelligence; compatibility: CompatibilityEvaluation; lineage: RegistryLineage; lifecycle_governance: LifecycleGovernance; contract_validation: RegistryContractValidation; evidence: RegistryFullEvidence; qualification: RegistryFullQualification; readiness: RegistryFullReadiness; replay_hash: string; integrity_hash: string }>;
export type RegistryFullValidation = Readonly<{ valid: boolean; decision: RegistryFullDecision; replay_hash_valid: boolean; integrity_hash_valid: boolean; explorer_valid: boolean; search_valid: boolean; dependency_valid: boolean; compatibility_valid: boolean; lineage_valid: boolean; lifecycle_valid: boolean; contract_validation_valid: boolean; evidence_valid: boolean; qualification_valid: boolean; readiness_valid: boolean; failures: readonly RegistryFullFailure[]; integrity_hash: string }>;
export type RegistryFullBundle = Readonly<{ doctrine: Readonly<{ version: "registry-full/w1.4b"; owns_registry_explorer: true; owns_registry_search: true; owns_dependency_intelligence: true; owns_compatibility_evaluation: true; owns_registry_lineage: true; owns_lifecycle_governance: true; owns_contract_validation: true; owns_registry_qualification: true; qualification_gate: "Registry Infrastructure Gate" }>; result: RegistryFullResult; validation: RegistryFullValidation }>;
