export type AutonomyClassificationOutcome = "PASS" | "FAIL" | "REQUIRES_GOVERNANCE_REVIEW" | "REQUIRES_OPERATOR_REVIEW";
export type AutonomyCategory = "ADVISORY" | "ASSISTED" | "GUIDED" | "MANAGED" | "GOVERNED_AUTONOMOUS" | "RESTRICTED_AUTONOMOUS" | "MISSION_AUTONOMOUS" | "SUPERVISORY_AUTONOMOUS";
export type AutonomyLevel = "LEVEL_0_NO_AUTONOMY" | "LEVEL_1_RECOMMENDATION_ONLY" | "LEVEL_2_OPERATOR_ASSISTED" | "LEVEL_3_GOVERNED_EXECUTION" | "LEVEL_4_MISSION_AUTONOMY" | "LEVEL_5_STRATEGIC_BOUNDED_AUTONOMY";
export type AuthorityClass = "INFORMATIONAL" | "ADVISORY" | "OPERATIONAL" | "ADMINISTRATIVE" | "MISSION" | "ORGANIZATIONAL" | "CONSTITUTIONAL";
export type AutonomyClassificationStatus = "DRAFT" | "REVIEW" | "ACTIVE" | "SUSPENDED" | "RETIRED" | "ARCHIVED";
export type AutonomyEligibilityStatus = "ELIGIBLE" | "ELIGIBLE_WITH_RESTRICTIONS" | "REQUIRES_OPERATOR_REVIEW" | "REQUIRES_GOVERNANCE_REVIEW" | "INELIGIBLE" | "FAIL_CLOSED";

export type AutonomyClassificationFailure =
  | "P5_0_TRUST_CONSTITUTION_INVALID"
  | "P5_1_TRUST_ARCHITECTURE_INVALID"
  | "P5_2_TRUST_REGISTRY_INVALID"
  | "P5_3_RESTRICTION_POLICY_INVALID"
  | "CAF_AUTONOMY_CLASSIFICATION_MISSING"
  | "AUTONOMY_TAXONOMY_MISSING"
  | "AUTONOMY_LEVELS_MISSING"
  | "AUTHORITY_CLASSES_MISSING"
  | "AUTONOMY_ELIGIBILITY_MISSING"
  | "CLASSIFICATION_REGISTRY_MISSING"
  | "CLASSIFICATION_RULES_INCOMPLETE"
  | "AUTHORITY_MATRIX_MISSING"
  | "CLASSIFICATION_NOT_DETERMINISTIC"
  | "MULTIPLE_ACTIVE_CLASSIFICATIONS"
  | "NO_ACTIVE_CLASSIFICATION"
  | "AUTHORITY_EXCEEDS_CONSTITUTION"
  | "ELIGIBILITY_DOES_NOT_FAIL_CLOSED"
  | "TRUST_CONTRACT_BYPASS_ATTEMPTED"
  | "RESTRICTION_POLICY_BYPASS_ATTEMPTED"
  | "AUTHORITY_GATE_BYPASS_ATTEMPTED"
  | "POLICY_GATE_BYPASS_ATTEMPTED"
  | "SAFETY_GATE_BYPASS_ATTEMPTED"
  | "INHERITANCE_WEAKENS_RESTRICTIONS"
  | "UNKNOWN_CLASSIFICATION_ACCEPTED"
  | "TRUST_COMPATIBILITY_INVALID"
  | "RESTRICTION_COMPATIBILITY_INVALID"
  | "GOVERNANCE_COMPATIBILITY_INVALID"
  | "REPLAY_REPRODUCIBILITY_INVALID"
  | "CERTIFICATION_INCOMPLETE"
  | "RUNTIME_AUTHORITY_DECISION_EXECUTED"
  | "AUTONOMY_EXECUTION_GRANTED"
  | "GOVERNANCE_REVIEW_REQUIRED"
  | "OPERATOR_REVIEW_REQUIRED";

export type AutonomyClassificationScenario = "BASELINE" | AutonomyClassificationFailure;
export type AutonomyClassificationInput = Readonly<{ scenario?: AutonomyClassificationScenario; tenant_id?: string; classification_id?: string; capability_id?: string; trust_domain_id?: string }>;
export type AutonomyClassificationRecord = Readonly<{ record_id: string; tenant_id: string; version: "autonomy-classification-framework/v5.4"; refs: readonly string[]; immutable: boolean; deterministic: boolean; integrity_hash: string }>;
export type CAFAutonomyClassification = AutonomyClassificationRecord & Readonly<{ classification_id: string; classification_name: string; capability_id: string; autonomy_category: AutonomyCategory; autonomy_level: AutonomyLevel; authority_class: AuthorityClass; minimum_trust_level: string; required_operator_authority: string; requires_governance: boolean; requires_policy_validation: boolean; requires_safety_validation: boolean; permitted_domains: readonly string[]; prohibited_domains: readonly string[]; escalation_rules: readonly string[]; certification_requirements: readonly string[]; replay_requirements: readonly string[]; audit_requirements: readonly string[]; effective_status: AutonomyClassificationStatus; grants_execution_authority: boolean; bypasses_trust_contracts: boolean; bypasses_restriction_policies: boolean; bypasses_authority_gate: boolean; bypasses_policy_gate: boolean; bypasses_safety_gate: boolean }>;
export type AutonomyTaxonomy = AutonomyClassificationRecord & Readonly<{ taxonomy_id: string; categories: readonly AutonomyCategory[]; deterministic_meanings: readonly string[]; finalized: boolean }>;
export type AutonomyLevelDefinitions = AutonomyClassificationRecord & Readonly<{ level_id: string; levels: readonly Readonly<{ level: AutonomyLevel; order: number; description: string; requires_additional_governance: boolean }>[]; increasing_governance_required: boolean }>;
export type AuthorityClassModel = AutonomyClassificationRecord & Readonly<{ authority_model_id: string; authority_classes: readonly AuthorityClass[]; never_bypasses_constitutional_governance: boolean; maximum_constitutional_authority: AuthorityClass }>;
export type AutonomyEligibilityRules = AutonomyClassificationRecord & Readonly<{ rules_id: string; considers_trust_standing: boolean; considers_restriction_policies: boolean; considers_tenant_boundaries: boolean; considers_authority: boolean; considers_governance_approval: boolean; considers_policy_validation: boolean; considers_safety_validation: boolean; considers_certification: boolean; considers_operational_status: boolean; fail_closed: boolean }>;
export type AutonomyClassificationRegistry = AutonomyClassificationRecord & Readonly<{ registry_id: string; classifications: readonly CAFAutonomyClassification[]; stores_authority_mappings: boolean; stores_autonomy_levels: boolean; stores_eligibility_rules: boolean; stores_governance_requirements: boolean; stores_policy_requirements: boolean; stores_safety_requirements: boolean; stores_replay_requirements: boolean; operational: boolean }>;
export type AutonomyClassificationRules = AutonomyClassificationRecord & Readonly<{ ruleset_id: string; required_fields: readonly string[]; no_requirement_omissions: boolean; exactly_one_active_classification: boolean; rejects_unknown_classification: boolean; inheritance_never_weakens_restrictions: boolean; does_not_execute_authority_decisions: boolean }>;
export type AutonomyAuthorityMatrix = AutonomyClassificationRecord & Readonly<{ matrix_id: string; mappings: readonly Readonly<{ autonomy_level: AutonomyLevel; authority_class: AuthorityClass; operator_authority: string; governance_approval: boolean; trust_standing: string; restriction_status: string; certification_status: string }>[]; canonical_for_runtime_authorization: boolean; authority_never_exceeds_constitution: boolean }>;
export type AutonomyClassificationPipeline = Readonly<{ pipeline_id: string; steps: readonly ["Capability", "Resolve Autonomy Classification", "Resolve Authority Class", "Evaluate Trust Standing", "Evaluate Restrictions", "Determine Eligibility", "Classification Result"]; deterministic: boolean; produces_runtime_enforcement_input: boolean; executes_runtime_enforcement: boolean; integrity_hash: string }>;
export type AutonomyEligibilityResult = Readonly<{ eligibility_id: string; capability_id: string; classification_id: string; tenant_id: string; trust_domain_id: string; autonomy_level: AutonomyLevel; authority_class: AuthorityClass; eligibility_status: AutonomyEligibilityStatus; operator_authority_resolved: boolean; governance_approved: boolean; policy_validated: boolean; safety_validated: boolean; trust_compatible: boolean; restriction_compatible: boolean; certification_complete: boolean; fail_closed_reason: string; integrity_hash: string }>;
export type AutonomyClassificationBoundary = Readonly<{ executes_authority_decisions: boolean; grants_autonomy_execution: boolean; grants_execution_authority: boolean; bypasses_governance: boolean; bypasses_policy: boolean; bypasses_safety: boolean; integrity_hash: string }>;
export type AutonomyClassificationCertification = Readonly<{ certification_id: string; outcome: AutonomyClassificationOutcome; phase_ready: boolean; classification_defined: boolean; taxonomy_finalized: boolean; autonomy_levels_defined: boolean; authority_classes_established: boolean; eligibility_rules_deterministic: boolean; registry_operational: boolean; classification_rules_complete: boolean; authority_matrix_published: boolean; classifications_replayable: boolean; fail_closed_unknown_invalid: boolean; authority_consistent: boolean; trust_compatible: boolean; restriction_compatible: boolean; governance_compatible: boolean; certification_complete: boolean; no_out_of_scope_execution: boolean; failures: readonly AutonomyClassificationFailure[]; integrity_hash: string }>;
export type AutonomyClassificationResult = Readonly<{ phase_version: "autonomy-classification-framework/v5.4"; phase_identifier: "AutonomyClassificationFramework"; trust_constitution_ref: "trust-constitutional-foundation/v5.0"; trust_architecture_ref: "trust-architecture-alignment-foundation/v5.1"; trust_identity_boundary_ref: "trust-identity-domains-boundaries/v5.2"; trust_restriction_policy_ref: "trust-contracts-restriction-policy/v5.3"; classification: CAFAutonomyClassification; taxonomy: AutonomyTaxonomy; levels: AutonomyLevelDefinitions; authority_classes: AuthorityClassModel; eligibility_rules: AutonomyEligibilityRules; registry: AutonomyClassificationRegistry; classification_rules: AutonomyClassificationRules; authority_matrix: AutonomyAuthorityMatrix; pipeline: AutonomyClassificationPipeline; eligibility: AutonomyEligibilityResult; boundary: AutonomyClassificationBoundary; certification: AutonomyClassificationCertification; replay_hash: string; integrity_hash: string }>;
export type AutonomyClassificationValidation = Readonly<{ valid: boolean; outcome: AutonomyClassificationOutcome; replay_hash_valid: boolean; integrity_hash_valid: boolean; classification_valid: boolean; taxonomy_valid: boolean; levels_valid: boolean; authority_classes_valid: boolean; eligibility_rules_valid: boolean; registry_valid: boolean; classification_rules_valid: boolean; authority_matrix_valid: boolean; pipeline_valid: boolean; eligibility_valid: boolean; boundary_valid: boolean; certification_valid: boolean; failures: readonly AutonomyClassificationFailure[]; integrity_hash: string }>;
export type AutonomyClassificationBundle = Readonly<{ doctrine: Readonly<{ version: "autonomy-classification-framework/v5.4"; owns_caf_autonomy_classification: true; owns_autonomy_taxonomy: true; owns_autonomy_levels: true; owns_authority_classes: true; owns_autonomy_eligibility: true; executes_authority_decisions: false; grants_autonomy_execution: false; grants_execution_authority: false }>; result: AutonomyClassificationResult; validation: AutonomyClassificationValidation }>;
