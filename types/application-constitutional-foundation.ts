export type ApplicationFoundationOutcome = "PASS" | "FAIL" | "PRUNED";
export type ApplicationFoundationCheckResult = "PASS" | "FAIL";
export type ApplicationTaxonomyCategory =
  | "OPERATIONAL_APPLICATION"
  | "INTELLIGENCE_APPLICATION"
  | "ANALYSIS_APPLICATION"
  | "COLLABORATION_APPLICATION"
  | "ADMINISTRATIVE_APPLICATION"
  | "CONSUMER_APPLICATION"
  | "PLATFORM_APPLICATION"
  | "EXTERNAL_INTEGRATION_APPLICATION";

export type ApplicationFoundationFailure =
  | "PROGRAM_1_CONSTITUTION_INVALID"
  | "PROGRAM_2_GOVERNANCE_INVALID"
  | "PROGRAM_3_BOUNDARY_INVALID"
  | "CONSTITUTIONAL_BEHAVIOR_DEFINED_INDEPENDENTLY"
  | "CONSTITUTIONAL_INHERITANCE_WEAKENED"
  | "APPLICATION_FUNCTIONALITY_IMPLEMENTED"
  | "BOUNDARY_MODEL_INCOMPLETE"
  | "BOUNDARY_OVERLAP_DETECTED"
  | "CAPABILITY_OUTSIDE_BOUNDARY"
  | "OWNERSHIP_INCOMPLETE"
  | "SHARED_OWNERSHIP_UNGOVERNED"
  | "TAXONOMY_INCOMPLETE"
  | "TAXONOMY_UNGOVERNED_EXTENSION"
  | "ARCHITECTURAL_CONSTRAINTS_MISSING"
  | "CONSTRAINT_VIOLATION_ALLOWED"
  | "NAMESPACE_COLLISION"
  | "NAMESPACE_LIFECYCLE_MISSING"
  | "VALIDATION_REPORT_MISSING"
  | "CONSTITUTIONAL_EVIDENCE_MISSING"
  | "CONSTITUTIONAL_EVIDENCE_MUTABLE"
  | "PHASE_CERTIFICATION_FAILED"
  | "CERTIFICATION_PRUNED";

export type ApplicationFoundationScenario = "BASELINE" | ApplicationFoundationFailure;
export type ApplicationFoundationInput = Readonly<{ scenario?: ApplicationFoundationScenario; tenant_id?: string }>;

export type ApplicationDoctrine = Readonly<{
  doctrine_id: string;
  purpose: string;
  constitutional_obligations: readonly string[];
  architectural_identity: string;
  ecosystem_responsibilities: readonly string[];
  authority_limits: readonly string[];
  governance_expectations: readonly string[];
  implements_application_functionality: boolean;
  integrity_hash: string;
}>;

export type ConstitutionalInheritanceSpec = Readonly<{
  inheritance_id: string;
  hierarchy: readonly string[];
  inherited_responsibilities: readonly string[];
  inherited_governance: readonly string[];
  inherited_constraints: readonly string[];
  extension_allowed: boolean;
  override_allowed: boolean;
  weakening_allowed: boolean;
  validated: boolean;
  integrity_hash: string;
}>;

export type ApplicationBoundaryModel = Readonly<{
  boundary_model_id: string;
  functional_scope: readonly string[];
  capability_boundaries: readonly string[];
  authority_limits: readonly string[];
  runtime_boundaries: readonly string[];
  registry_boundaries: readonly string[];
  governance_boundaries: readonly string[];
  policy_boundaries: readonly string[];
  evidence_boundaries: readonly string[];
  interoperability_boundaries: readonly string[];
  dependency_boundaries: readonly string[];
  deterministic: boolean;
  non_overlapping: boolean;
  complete: boolean;
  integrity_hash: string;
}>;

export type ApplicationOwnershipRegistry = Readonly<{
  registry_id: string;
  capability_owners: readonly string[];
  service_owners: readonly string[];
  registry_owners: readonly string[];
  governance_artifact_owners: readonly string[];
  evidence_owners: readonly string[];
  policy_owners: readonly string[];
  interface_owners: readonly string[];
  api_owners: readonly string[];
  lifecycle_owners: readonly string[];
  operational_owners: readonly string[];
  deterministic: boolean;
  shared_ownership_governed: boolean;
  complete: boolean;
  integrity_hash: string;
}>;

export type ApplicationTaxonomy = Readonly<{
  taxonomy_id: string;
  categories: readonly ApplicationTaxonomyCategory[];
  namespace_prefixes: readonly string[];
  classification_registry_ref: string;
  extensible_through_governance: boolean;
  approved: boolean;
  integrity_hash: string;
}>;

export type ArchitecturalConstraintFramework = Readonly<{
  framework_id: string;
  mandatory_constraints: readonly string[];
  prohibited_behaviors: readonly string[];
  dependency_constraints: readonly string[];
  interoperability_constraints: readonly string[];
  validation_rules: readonly string[];
  enforced: boolean;
  integrity_hash: string;
}>;

export type NamespaceGovernance = Readonly<{
  namespace_id: string;
  application_identifier_pattern: string;
  allocated_namespaces: readonly string[];
  naming_conventions: readonly string[];
  collision_prevention: boolean;
  lifecycle_governed: boolean;
  operational: boolean;
  integrity_hash: string;
}>;

export type ApplicationFoundationEvidence = Readonly<{
  evidence_id: string;
  constitutional_evidence_refs: readonly string[];
  architectural_evidence_refs: readonly string[];
  ownership_evidence_refs: readonly string[];
  taxonomy_evidence_refs: readonly string[];
  validation_report_refs: readonly string[];
  lineage_refs: readonly string[];
  immutable: boolean;
  complete: boolean;
  integrity_hash: string;
}>;

export type ApplicationFoundationCertification = Readonly<{
  certification_id: string;
  outcome: ApplicationFoundationOutcome;
  phase_ready: boolean;
  doctrine_established: boolean;
  inheritance_validated: boolean;
  boundaries_complete: boolean;
  ownership_deterministic: boolean;
  taxonomy_approved: boolean;
  constraints_enforced: boolean;
  namespace_governance_operational: boolean;
  evidence_complete: boolean;
  failures: readonly ApplicationFoundationFailure[];
  integrity_hash: string;
}>;

export type ApplicationFoundationResult = Readonly<{
  phase_version: "application-constitutional-foundation/v4.1";
  phase_identifier: "ApplicationConstitutionalFoundation";
  program_1_constitution_ref: "Program 1 - Constitutional Baseline";
  program_2_governance_ref: "Program 2 - Constitutional Governance";
  program_3_boundary_ref: "caf-program-qualification/v3.18";
  doctrine: ApplicationDoctrine;
  inheritance: ConstitutionalInheritanceSpec;
  boundary_model: ApplicationBoundaryModel;
  ownership_registry: ApplicationOwnershipRegistry;
  taxonomy: ApplicationTaxonomy;
  constraints: ArchitecturalConstraintFramework;
  namespace_governance: NamespaceGovernance;
  evidence: ApplicationFoundationEvidence;
  certification: ApplicationFoundationCertification;
  replay_hash: string;
  integrity_hash: string;
}>;

export type ApplicationFoundationValidation = Readonly<{
  valid: boolean;
  outcome: ApplicationFoundationOutcome;
  replay_hash_valid: boolean;
  integrity_hash_valid: boolean;
  doctrine_valid: boolean;
  inheritance_valid: boolean;
  boundary_valid: boolean;
  ownership_valid: boolean;
  taxonomy_valid: boolean;
  constraints_valid: boolean;
  namespace_valid: boolean;
  evidence_valid: boolean;
  certification_valid: boolean;
  failures: readonly ApplicationFoundationFailure[];
  integrity_hash: string;
}>;

export type ApplicationFoundationBundle = Readonly<{
  doctrine: Readonly<{
    version: "application-constitutional-foundation/v4.1";
    owns_application_doctrine: true;
    owns_application_boundaries: true;
    owns_application_ownership_model: true;
    owns_constitutional_inheritance: true;
    owns_application_taxonomy: true;
    owns_namespace_governance: true;
    owns_architectural_constraints: true;
    implements_application_functionality: false;
    overrides_program_1_2_3_authority: false;
  }>;
  result: ApplicationFoundationResult;
  validation: ApplicationFoundationValidation;
}>;
