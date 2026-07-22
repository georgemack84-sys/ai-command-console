export type ApplicationCapabilityCompositionOutcome = "PASS" | "FAIL" | "PRUNED";
export type ApplicationCapabilityCompositionCheckResult = "PASS" | "FAIL";

export type ApplicationCapabilityCompositionFailure =
  | "P4_2_REGISTRY_INVALID"
  | "PROGRAM_1_CAPABILITY_ATLAS_INVALID"
  | "CAF_COMPOSITION_CONTRACTS_INVALID"
  | "NEW_CAPABILITY_DEFINED"
  | "PROGRAM_1_CAPABILITY_MODIFIED"
  | "CAPABILITY_EXECUTION_ATTEMPTED"
  | "RUNTIME_ORCHESTRATION_ATTEMPTED"
  | "DEPLOYMENT_ATTEMPTED"
  | "APPLICATION_METADATA_OWNERSHIP_DUPLICATED"
  | "CAF_COMPOSITION_LOGIC_DUPLICATED"
  | "CAPABILITY_MAPPING_INCOMPLETE"
  | "CAPABILITY_MAPPING_NON_DETERMINISTIC"
  | "UNAPPROVED_CAPABILITY_USED"
  | "COMPOSITION_INVALID"
  | "REUSABLE_COMPOSITION_UNVERIFIED"
  | "COMPOSITION_INHERITANCE_INVALID"
  | "DEPENDENCY_MAP_INCOMPLETE"
  | "UNRESOLVED_DEPENDENCY"
  | "CIRCULAR_DEPENDENCY_DETECTED"
  | "DEPENDENCY_COMPATIBILITY_FAILED"
  | "COMPOSITION_CONTRACT_MISSING"
  | "COMPOSITION_CONTRACT_NON_DETERMINISTIC"
  | "COMPOSITION_CONTRACT_UNVERSIONED"
  | "CAPABILITY_ARCHITECTURE_INCOMPLETE"
  | "ARCHITECTURAL_BOUNDARY_INVALID"
  | "TOPOLOGY_INVALID"
  | "GOVERNANCE_NOT_ENFORCED"
  | "OWNERSHIP_NOT_VERIFIED"
  | "CONSTITUTIONAL_COMPLIANCE_FAILED"
  | "CAPABILITY_LINEAGE_INCOMPLETE"
  | "LINEAGE_NOT_IMMUTABLE"
  | "CERTIFICATION_EVIDENCE_INCOMPLETE"
  | "CERTIFICATION_PRUNED";

export type ApplicationCapabilityCompositionScenario = "BASELINE" | ApplicationCapabilityCompositionFailure;
export type ApplicationCapabilityCompositionInput = Readonly<{ scenario?: ApplicationCapabilityCompositionScenario; tenant_id?: string }>;

export type CompositionFoundation = Readonly<{
  foundation_id: string;
  composition_rules: readonly string[];
  capability_refs: readonly string[];
  capability_ownership_refs: readonly string[];
  composition_boundaries: readonly string[];
  creates_new_capabilities: boolean;
  modifies_program_1_capabilities: boolean;
  duplicates_caf_composition_logic: boolean;
  deterministic: boolean;
  integrity_hash: string;
}>;

export type CapabilityMap = Readonly<{
  map_id: string;
  application_id: string;
  program_1_capability_atlas_ref: string;
  mapped_capability_refs: readonly string[];
  capability_categories: readonly string[];
  deterministic: boolean;
  complete: boolean;
  approved_capabilities_only: boolean;
  integrity_hash: string;
}>;

export type CompositionGraph = Readonly<{
  graph_id: string;
  application_id: string;
  nodes: readonly string[];
  edges: readonly string[];
  reusable_compositions: readonly string[];
  hierarchy: readonly string[];
  inheritance_refs: readonly string[];
  valid: boolean;
  reusable_verified: boolean;
  inheritance_verified: boolean;
  integrity_hash: string;
}>;

export type DependencyMap = Readonly<{
  map_id: string;
  dependency_refs: readonly string[];
  dependency_registry_refs: readonly string[];
  missing_dependencies: readonly string[];
  circular_dependencies: readonly string[];
  compatibility_verified: boolean;
  complete: boolean;
  integrity_hash: string;
}>;

export type CompositionContractRegistry = Readonly<{
  registry_id: string;
  composition_contract_refs: readonly string[];
  capability_contract_refs: readonly string[];
  dependency_contract_refs: readonly string[];
  inheritance_contract_refs: readonly string[];
  version_compatibility: boolean;
  complete: boolean;
  deterministic: boolean;
  versioned: boolean;
  integrity_hash: string;
}>;

export type CapabilityArchitecture = Readonly<{
  architecture_id: string;
  capability_hierarchy: readonly string[];
  decomposition_refs: readonly string[];
  service_boundaries: readonly string[];
  composition_topology: readonly string[];
  capability_domains: readonly string[];
  architectural_boundaries_validated: boolean;
  topology_verified: boolean;
  complete: boolean;
  integrity_hash: string;
}>;

export type CompositionValidationReport = Readonly<{
  report_id: string;
  composition_complete: boolean;
  dependency_complete: boolean;
  architecture_valid: boolean;
  capability_valid: boolean;
  contract_valid: boolean;
  result: ApplicationCapabilityCompositionCheckResult;
  integrity_hash: string;
}>;

export type CapabilityLineage = Readonly<{
  lineage_id: string;
  program_1_capability_refs: readonly string[];
  composition_lineage_refs: readonly string[];
  dependency_lineage_refs: readonly string[];
  contract_lineage_refs: readonly string[];
  version_lineage_refs: readonly string[];
  immutable: boolean;
  complete: boolean;
  traceable: boolean;
  integrity_hash: string;
}>;

export type CompositionGovernanceEvidence = Readonly<{
  evidence_id: string;
  governance_validation_refs: readonly string[];
  ownership_validation_refs: readonly string[];
  policy_validation_refs: readonly string[];
  architectural_compliance_refs: readonly string[];
  amendment_compliance_refs: readonly string[];
  governance_enforced: boolean;
  ownership_verified: boolean;
  constitutional_compliance: boolean;
  complete: boolean;
  integrity_hash: string;
}>;

export type ApplicationCapabilityCompositionCertification = Readonly<{
  certification_id: string;
  outcome: ApplicationCapabilityCompositionOutcome;
  phase_ready: boolean;
  capability_mapping_complete: boolean;
  composition_valid: boolean;
  dependencies_validated: boolean;
  contracts_validated: boolean;
  architecture_complete: boolean;
  governance_enforced: boolean;
  lineage_complete: boolean;
  evidence_complete: boolean;
  no_forbidden_authority: boolean;
  failures: readonly ApplicationCapabilityCompositionFailure[];
  integrity_hash: string;
}>;

export type ApplicationCapabilityCompositionResult = Readonly<{
  phase_version: "application-capability-composition/v4.3";
  phase_identifier: "ApplicationCapabilityComposition";
  application_registry_ref: "application-registry-catalog/v4.2";
  program_1_capability_atlas_ref: "Program 1 - Capability Atlas";
  caf_composition_contracts_ref: "caf-capability-composition/v3.2";
  foundation: CompositionFoundation;
  capability_map: CapabilityMap;
  composition_graph: CompositionGraph;
  dependency_map: DependencyMap;
  contract_registry: CompositionContractRegistry;
  architecture: CapabilityArchitecture;
  validation_report: CompositionValidationReport;
  lineage: CapabilityLineage;
  governance_evidence: CompositionGovernanceEvidence;
  certification: ApplicationCapabilityCompositionCertification;
  replay_hash: string;
  integrity_hash: string;
}>;

export type ApplicationCapabilityCompositionValidation = Readonly<{
  valid: boolean;
  outcome: ApplicationCapabilityCompositionOutcome;
  replay_hash_valid: boolean;
  integrity_hash_valid: boolean;
  foundation_valid: boolean;
  mapping_valid: boolean;
  composition_valid: boolean;
  dependency_valid: boolean;
  contracts_valid: boolean;
  architecture_valid: boolean;
  validation_report_valid: boolean;
  lineage_valid: boolean;
  governance_valid: boolean;
  certification_valid: boolean;
  failures: readonly ApplicationCapabilityCompositionFailure[];
  integrity_hash: string;
}>;

export type ApplicationCapabilityCompositionBundle = Readonly<{
  doctrine: Readonly<{
    version: "application-capability-composition/v4.3";
    owns_capability_mapping: true;
    owns_capability_composition: true;
    owns_dependency_validation: true;
    owns_application_capability_architecture: true;
    creates_new_capabilities: false;
    modifies_program_1_capabilities: false;
    executes_capabilities: false;
    owns_runtime_orchestration: false;
    performs_deployment: false;
    owns_application_metadata: false;
    duplicates_caf_composition_logic: false;
  }>;
  result: ApplicationCapabilityCompositionResult;
  validation: ApplicationCapabilityCompositionValidation;
}>;
