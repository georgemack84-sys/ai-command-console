export type TrustConstitutionalOutcome = "PASS" | "FAIL" | "PRUNED";

export type TrustConstitutionalFailure =
  | "PROGRAM_1_CONSTITUTIONAL_BASELINE_INVALID"
  | "PROGRAM_1_CAPABILITY_ATLAS_INVALID"
  | "PROGRAM_2_CONSTITUTIONAL_GOVERNANCE_INVALID"
  | "PROGRAM_2_POLICY_FRAMEWORK_INVALID"
  | "PROGRAM_2_IDENTITY_MODEL_INVALID"
  | "PROGRAM_3_CONSTITUTIONAL_AUTHORITY_INVALID"
  | "PROGRAM_3_GOVERNANCE_GATES_INVALID"
  | "PROGRAM_4_APPLICATION_BOUNDARIES_INVALID"
  | "TRUST_CONSTITUTION_MISSING"
  | "TRUST_CONSTITUTION_NOT_APPROVED"
  | "TRUST_DOCTRINE_MISSING"
  | "TRUST_DOCTRINE_NOT_FINALIZED"
  | "TRUST_TERMINOLOGY_MISSING"
  | "TRUST_TERMINOLOGY_NOT_STANDARDIZED"
  | "TRUST_PRINCIPLES_MISSING"
  | "TRUST_PRINCIPLES_NOT_ADOPTED"
  | "TRUST_INVARIANTS_MISSING"
  | "TRUST_INVARIANTS_MUTABLE"
  | "TRUST_GOVERNANCE_MISSING"
  | "TRUST_GOVERNANCE_RESPONSIBILITIES_UNDEFINED"
  | "TRUST_AUTHORITY_HIERARCHY_MISSING"
  | "TRUST_AUTHORITY_HIERARCHY_INVALID"
  | "TRUST_BOUNDARY_MODEL_MISSING"
  | "TRUST_BOUNDARIES_UNSPECIFIED"
  | "TRUST_VOCABULARY_NOT_REGISTERED"
  | "TRUST_REFERENCE_MODEL_MISSING"
  | "DOWNSTREAM_INHERITANCE_INVALID"
  | "TRUST_SCORING_OWNERSHIP_ATTEMPTED"
  | "TRUST_EVALUATION_OWNERSHIP_ATTEMPTED"
  | "TRUST_EVIDENCE_OWNERSHIP_ATTEMPTED"
  | "TRUST_REPUTATION_OWNERSHIP_ATTEMPTED"
  | "TRUST_CERTIFICATION_OWNERSHIP_ATTEMPTED"
  | "TRUST_QUALIFICATION_OWNERSHIP_ATTEMPTED"
  | "TRUST_AUTHORITY_CREATION_ATTEMPTED"
  | "GOVERNANCE_BYPASS_ATTEMPTED"
  | "OPERATOR_AUTHORITY_REPLACED"
  | "TENANT_ISOLATION_INVALID"
  | "DETERMINISM_INVALID"
  | "REPLAYABILITY_INVALID"
  | "EXPLAINABILITY_INVALID"
  | "AUDITABILITY_INVALID"
  | "EVIDENCE_DERIVATION_INVALID"
  | "FAIL_CLOSED_INVALID"
  | "CERTIFICATION_PRUNED";

export type TrustConstitutionalScenario = "BASELINE" | TrustConstitutionalFailure;
export type TrustConstitutionalInput = Readonly<{ scenario?: TrustConstitutionalScenario; constitution_id?: string; tenant_id?: string }>;

export type TrustConstitutionalRecord = Readonly<{ record_id: string; constitution_id: string; tenant_id: string; version: "trust-constitutional-foundation/v5.0"; refs: readonly string[]; immutable: boolean; deterministic: boolean; integrity_hash: string }>;
export type TrustConstitution = TrustConstitutionalRecord & Readonly<{ approved: boolean; rules: readonly string[]; advisory_by_default: boolean; creates_authority: boolean; bypasses_governance: boolean; replaces_operator_authority: boolean }>;
export type ConstitutionalTrustDoctrine = TrustConstitutionalRecord & Readonly<{ definition: string; finalized: boolean; doctrine_properties: readonly string[] }>;
export type TrustPrinciples = TrustConstitutionalRecord & Readonly<{ principles: readonly string[]; adopted: boolean }>;
export type TrustInvariants = TrustConstitutionalRecord & Readonly<{ invariant_refs: readonly string[]; immutable_invariants: boolean }>;
export type TrustGovernanceFramework = TrustConstitutionalRecord & Readonly<{ responsibility_refs: readonly string[]; responsibilities_defined: boolean }>;
export type TrustAuthorityHierarchy = TrustConstitutionalRecord & Readonly<{ hierarchy: readonly string[]; validated: boolean; elevates_above_governance: boolean }>;
export type TrustTerminologyRegistry = TrustConstitutionalRecord & Readonly<{ terminology: readonly string[]; standardized: boolean; registered_in_program_1: boolean }>;
export type TrustBoundaryModel = TrustConstitutionalRecord & Readonly<{ boundaries: readonly string[]; formally_specified: boolean; invalidates_on_violation: boolean; tenant_isolated: boolean }>;
export type ConstitutionalTrustReferenceModel = TrustConstitutionalRecord & Readonly<{ consumes: readonly string[]; downstream_inheritance_ready: boolean; redefines_trust_downstream: boolean }>;
export type TrustConstitutionalBoundary = Readonly<{ owns_trust_scoring: boolean; owns_trust_evaluation: boolean; owns_trust_evidence: boolean; owns_trust_reputation: boolean; owns_trust_certification: boolean; owns_trust_qualification: boolean; creates_execution_authority: boolean; integrity_hash: string }>;

export type TrustConstitutionalCertification = Readonly<{ certification_id: string; outcome: TrustConstitutionalOutcome; phase_ready: boolean; constitution_approved: boolean; doctrine_finalized: boolean; terminology_standardized: boolean; principles_adopted: boolean; invariants_immutable: boolean; governance_defined: boolean; authority_hierarchy_validated: boolean; boundaries_specified: boolean; vocabulary_registered: boolean; downstream_inheritance_ready: boolean; constitutional_guardrails_enforced: boolean; no_out_of_scope_ownership: boolean; failures: readonly TrustConstitutionalFailure[]; integrity_hash: string }>;

export type TrustConstitutionalResult = Readonly<{ phase_version: "trust-constitutional-foundation/v5.0"; phase_identifier: "TrustConstitutionalFoundation"; constitution: TrustConstitution; doctrine: ConstitutionalTrustDoctrine; principles: TrustPrinciples; invariants: TrustInvariants; governance: TrustGovernanceFramework; authority: TrustAuthorityHierarchy; terminology: TrustTerminologyRegistry; boundaries: TrustBoundaryModel; reference_model: ConstitutionalTrustReferenceModel; boundary: TrustConstitutionalBoundary; certification: TrustConstitutionalCertification; replay_hash: string; integrity_hash: string }>;

export type TrustConstitutionalValidation = Readonly<{ valid: boolean; outcome: TrustConstitutionalOutcome; replay_hash_valid: boolean; integrity_hash_valid: boolean; constitution_valid: boolean; doctrine_valid: boolean; principles_valid: boolean; invariants_valid: boolean; governance_valid: boolean; authority_valid: boolean; terminology_valid: boolean; boundaries_valid: boolean; reference_model_valid: boolean; boundary_valid: boolean; certification_valid: boolean; failures: readonly TrustConstitutionalFailure[]; integrity_hash: string }>;

export type TrustConstitutionalBundle = Readonly<{ doctrine: Readonly<{ version: "trust-constitutional-foundation/v5.0"; owns_trust_constitution: true; owns_constitutional_trust_doctrine: true; owns_trust_principles: true; owns_trust_terminology: true; owns_constitutional_invariants: true; owns_trust_governance: true; owns_trust_scoring: false; owns_trust_evaluation: false; owns_trust_evidence: false; owns_trust_reputation: false; owns_trust_certification: false; owns_trust_qualification: false }>; result: TrustConstitutionalResult; validation: TrustConstitutionalValidation }>;
