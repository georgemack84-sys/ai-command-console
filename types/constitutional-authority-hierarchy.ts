export type AuthorityLayer = "CONSTITUTION" | "GOVERNANCE" | "OPERATOR" | "ASSESSMENT";
export type AuthorityDecisionStatus = "PASS" | "FAIL";
export type AuthorityFailure =
  | "CONSTITUTION_MUTABLE"
  | "GOVERNANCE_EXCEEDS_CONSTITUTION"
  | "OPERATOR_EXCEEDS_GOVERNANCE"
  | "ASSESSMENT_EXCEEDS_OPERATOR"
  | "SIBLING_AUTHORITY_PRESENT"
  | "MISSING_PARENT"
  | "CYCLIC_INHERITANCE"
  | "SKIPPED_LAYER"
  | "CEILING_MUTATED"
  | "EXECUTION_AUTHORITY_PRODUCED"
  | "ADVISORY_BOUNDARY_BYPASSED"
  | "REPLAY_MISMATCH"
  | "EXPLAINABILITY_INCOMPLETE"
  | "INTEGRITY_FAILURE"
  | "AMBIGUOUS_AUTHORITY";
export type AuthorityScenario = "BASELINE" | AuthorityFailure;
export type AuthorityInput = Readonly<{ scenario?: AuthorityScenario; tenant_id?: string }>;

export type AuthorityContract = Readonly<{ contract_id: string; layers: readonly AuthorityLayer[]; vocabulary: readonly string[]; advisory_only: true; hierarchy_immutable: boolean; replay_required: true; integrity_required: true; integrity_hash: string }>;
export type AuthorityHierarchyNode = Readonly<{ layer: AuthorityLayer; parent: AuthorityLayer | null; ceiling: number; permitted_outputs: readonly string[]; prohibited_outputs: readonly string[]; integrity_hash: string }>;
export type AuthorityHierarchyModel = Readonly<{ model_id: string; nodes: readonly AuthorityHierarchyNode[]; deterministic: boolean; no_sibling_relationships: boolean; exactly_one_parent_per_lower_layer: boolean; terminates_at_constitution: boolean; immutable: boolean; integrity_hash: string }>;
export type AuthorityResolutionReport = Readonly<{ report_id: string; resolution_order: readonly AuthorityLayer[]; governing_constitution: string; applicable_governance: string; operator_authority: string; assessment_ceiling: "ADVISORY_ONLY"; lower_layers_influence_higher_layers: false; deterministic: boolean; integrity_hash: string }>;
export type AuthorityCeilingReport = Readonly<{ report_id: string; constitution_ceiling: number; governance_ceiling: number; operator_ceiling: number; assessment_ceiling: number; ceilings_immutable: boolean; escalation_rejected: boolean; unauthorized_delegation_rejected: boolean; valid: boolean; integrity_hash: string }>;
export type AuthorityInheritanceReport = Readonly<{ report_id: string; path: readonly AuthorityLayer[]; downward_only: boolean; no_skipped_layers: boolean; no_cycles: boolean; no_expansion: boolean; inherited_authority_reproducible: boolean; integrity_hash: string }>;
export type AdvisoryBoundaryReport = Readonly<{ report_id: string; permitted_outputs: readonly string[]; prohibited_outputs: readonly string[]; execution_authority_possible: false; advisory_only_enforced: boolean; operator_override_preserved: boolean; governance_bypass_prevented: boolean; constitution_bypass_prevented: boolean; integrity_hash: string }>;
export type AuthorityReplayReport = Readonly<{ report_id: string; hierarchy_replayed: boolean; inheritance_replayed: boolean; ceilings_replayed: boolean; resolution_replayed: boolean; validation_replayed: boolean; identical_authority_chain: boolean; integrity_hash: string }>;
export type AuthorityExplanation = Readonly<{ explanation_id: string; constitutional_rules: readonly string[]; governance_rules: readonly string[]; operator_constraints: readonly string[]; inherited_authority_path: readonly AuthorityLayer[]; ceiling_calculation: string; advisory_boundary_explanation: string; rejection_rationale: string | null; replay_references: readonly string[]; complete: boolean; integrity_hash: string }>;
export type AuthorityIntegrityReport = Readonly<{ report_id: string; hashes_valid: boolean; references_valid: boolean; hierarchy_consistent: boolean; ceilings_immutable: boolean; inheritance_integrity_valid: boolean; replay_consistent: boolean; forged_authority_detected: boolean; unauthorized_expansion_detected: boolean; integrity_hash: string }>;
export type AuthorityRegistry = Readonly<{ registry_id: string; authoritative_layers: readonly AuthorityLayer[]; canonical_owner: string; single_parent_paths: boolean; immutable: boolean; integrity_hash: string }>;
export type AuthorityCertificationTest = Readonly<{ test_id: string; name: string; expected: "PASS"; actual: "PASS" | "FAIL"; passed: boolean; failure_reason: AuthorityFailure | null; evidence_refs: readonly string[]; integrity_hash: string }>;
export type AuthorityCertification = Readonly<{ certification_id: string; status: AuthorityDecisionStatus; certified: boolean; failures: readonly AuthorityFailure[]; tests: readonly AuthorityCertificationTest[]; integrity_hash: string }>;
export type AuthorityHierarchyResult = Readonly<{ phase_version: "constitutional-authority-hierarchy/v13.1"; phase_identifier: "ConstitutionalAuthorityHierarchy"; contract: AuthorityContract; hierarchy: AuthorityHierarchyModel; resolution: AuthorityResolutionReport; ceilings: AuthorityCeilingReport; inheritance: AuthorityInheritanceReport; advisory_boundary: AdvisoryBoundaryReport; replay: AuthorityReplayReport; explainability: AuthorityExplanation; integrity: AuthorityIntegrityReport; registry: AuthorityRegistry; certification: AuthorityCertification; replay_hash: string; integrity_hash: string }>;
export type AuthorityValidation = Readonly<{ valid: boolean; status: AuthorityDecisionStatus; certified: boolean; failures: readonly AuthorityFailure[]; replay_hash_valid: boolean; integrity_hash_valid: boolean; advisory_boundary_valid: boolean; hierarchy_valid: boolean; validation_hash: string }>;
export type AuthorityContractBundle = Readonly<{ doctrine: Readonly<{ version: "constitutional-authority-hierarchy/v13.1"; constitutional_supremacy: true; governance_subordinate_to_constitution: true; operator_subordinate_to_governance: true; assessment_advisory_only: true; deterministic_inheritance_required: true; immutable_ceilings_required: true; fail_closed_on_ambiguity: true }>; result: AuthorityHierarchyResult; validation: AuthorityValidation }>;
