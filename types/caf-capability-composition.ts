export type CompositionCertificationOutcome = "PASS" | "FAIL" | "PRUNED";
export type SkillCategory = "ATOMIC" | "COMPOSITE" | "DOMAIN" | "ORCHESTRATION" | "UTILITY" | "INFRASTRUCTURE";

export type CapabilityCompositionFailure =
  | "P3_1_AGENT_LIFECYCLE_INVALID"
  | "UNCERTIFIED_CAPABILITY"
  | "DIRECT_BEHAVIOR_IMPLEMENTATION"
  | "DEPENDENCY_MISSING"
  | "CIRCULAR_DEPENDENCY"
  | "INCOMPATIBLE_CAPABILITY_VERSION"
  | "DUPLICATE_BEHAVIOR"
  | "COMPOSITION_CONTRACT_MISSING"
  | "NON_DETERMINISTIC_ORDERING"
  | "LINEAGE_INCOMPLETE"
  | "REPLAY_DIVERGENCE"
  | "REGISTRY_MUTABLE"
  | "VALIDATION_EVIDENCE_MISSING"
  | "GOVERNANCE_COMPLIANCE_GAP"
  | "CERTIFICATION_PRUNED";

export type CapabilityCompositionScenario = "BASELINE" | CapabilityCompositionFailure;
export type CapabilityCompositionInput = Readonly<{ scenario?: CapabilityCompositionScenario; tenant_id?: string }>;

export type CapabilityReference = Readonly<{
  capability_id: string;
  atlas_ref: string;
  capability_name: string;
  version: string;
  certified: boolean;
  canonical: boolean;
  owner_program: "Program 1";
  contract_ref: string;
  lineage_refs: readonly string[];
  integrity_hash: string;
}>;

export type CompositionModel = Readonly<{
  composition_id: string;
  agent_ref: string;
  composition_type: "ATOMIC" | "HIERARCHICAL" | "REUSABLE";
  capability_refs: readonly CapabilityReference[];
  behavior_template_refs: readonly string[];
  composition_metadata_refs: readonly string[];
  direct_behavior_implementation_allowed: false;
  deterministic_ordering: boolean;
  capability_reuse_enforced: boolean;
  behavior_duplication_prohibited: boolean;
  integrity_hash: string;
}>;

export type DependencyGraph = Readonly<{
  graph_id: string;
  nodes: readonly string[];
  edges: readonly string[];
  missing_capabilities: readonly string[];
  duplicate_capabilities: readonly string[];
  circular_references: readonly string[];
  incompatible_versions: readonly string[];
  unresolved_contracts: readonly string[];
  deterministic_order: readonly string[];
  valid: boolean;
  integrity_hash: string;
}>;

export type SkillRecord = Readonly<{
  skill_id: string;
  skill_name: string;
  category: SkillCategory;
  composition_ref: string;
  capability_refs: readonly string[];
  lifecycle_state: "DRAFT" | "VALIDATED" | "CERTIFIED" | "RETIRED";
  reusable: boolean;
  contract_ref: string;
  metadata_refs: readonly string[];
  validation_refs: readonly string[];
  integrity_hash: string;
}>;

export type BehaviorTemplate = Readonly<{
  behavior_id: string;
  behavior_name: string;
  canonical_capability_refs: readonly string[];
  inherited_from: string | null;
  duplicate_behavior_detected: boolean;
  reuse_required: boolean;
  integrity_hash: string;
}>;

export type CompositionContract = Readonly<{
  contract_id: string;
  compatibility_rules_ref: string;
  interface_contract_refs: readonly string[];
  behavioral_contract_refs: readonly string[];
  dependency_contract_refs: readonly string[];
  all_assemblies_governed: boolean;
  constitutional_compliance_required: boolean;
  integrity_hash: string;
}>;

export type CompositionRegistry = Readonly<{
  registry_id: string;
  compositions: readonly string[];
  skills: readonly string[];
  metadata_index_refs: readonly string[];
  discovery_enabled: boolean;
  version_management_enabled: boolean;
  immutable: boolean;
  replayable: boolean;
  integrity_hash: string;
}>;

export type CompositionEvidenceEntry = Readonly<{
  evidence_id: string;
  event_type: "COMPOSITION_CREATED" | "DEPENDENCY_VALIDATED" | "SKILL_REGISTERED" | "CONTRACT_VERIFIED" | "LINEAGE_CAPTURED" | "REPLAY_VALIDATED" | "CERTIFICATION_REFERENCED";
  evidence_refs: readonly string[];
  sequence: number;
  immutable: boolean;
  replayable: boolean;
  integrity_hash: string;
}>;

export type CompositionReplayValidation = Readonly<{
  replay_validation_id: string;
  composition_reproduced: boolean;
  dependency_graph_reproduced: boolean;
  skills_reproduced: boolean;
  contracts_reproduced: boolean;
  lineage_reproduced: boolean;
  registry_reproduced: boolean;
  deterministic: boolean;
  integrity_hash: string;
}>;

export type CompositionCertification = Readonly<{
  certification_id: string;
  outcome: CompositionCertificationOutcome;
  certified: boolean;
  capability_composition_valid: boolean;
  dependency_composition_valid: boolean;
  reusable_skills_operational: boolean;
  deterministic_ordering: boolean;
  contract_compliance: boolean;
  replay_determinism: boolean;
  lineage_complete: boolean;
  registry_integrity: boolean;
  compatibility_validated: boolean;
  governance_compliance: boolean;
  no_direct_behavior_implementation: boolean;
  no_behavior_duplication: boolean;
  failures: readonly CapabilityCompositionFailure[];
  integrity_hash: string;
}>;

export type CapabilityCompositionResult = Readonly<{
  phase_version: "caf-capability-composition/v3.2";
  phase_identifier: "CafCapabilityComposition";
  constitutional_ref: "P3.0-CAF-CONSTITUTION-001";
  agent_lifecycle_ref: "caf-agent-identity-lifecycle/v3.1";
  program_1_capability_atlas_ref: "Program 1 - Capability Atlas";
  composition: CompositionModel;
  dependency_graph: DependencyGraph;
  skill_registry: readonly SkillRecord[];
  behavior_library: readonly BehaviorTemplate[];
  contract_library: readonly CompositionContract[];
  composition_registry: CompositionRegistry;
  composition_evidence: readonly CompositionEvidenceEntry[];
  replay_validation: CompositionReplayValidation;
  certification: CompositionCertification;
  replay_hash: string;
  integrity_hash: string;
}>;

export type CapabilityCompositionValidation = Readonly<{
  valid: boolean;
  outcome: CompositionCertificationOutcome;
  replay_hash_valid: boolean;
  integrity_hash_valid: boolean;
  composition_valid: boolean;
  dependency_valid: boolean;
  skill_valid: boolean;
  contract_valid: boolean;
  evidence_valid: boolean;
  certification_valid: boolean;
  failures: readonly CapabilityCompositionFailure[];
  integrity_hash: string;
}>;

export type CapabilityCompositionBundle = Readonly<{
  doctrine: Readonly<{
    version: "caf-capability-composition/v3.2";
    consumes_program_1_capability_atlas: true;
    consumes_agent_identity_lifecycle: true;
    owns_composition_not_capability_definitions: true;
    direct_behavior_implementation_prohibited: true;
    deterministic_composition_required: true;
    immutable_lineage_required: true;
    certified_capability_reuse_required: true;
  }>;
  result: CapabilityCompositionResult;
  validation: CapabilityCompositionValidation;
}>;
