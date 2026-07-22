export type FormalDocumentType = "ROADMAP" | "SPECIFICATION" | "AMENDMENT" | "ADDENDUM" | "RECONCILIATION_AMENDMENT";
export type FormalDocumentLifecycleState = "DRAFT" | "REVIEW" | "APPROVED" | "ACTIVE" | "SUPERSEDED" | "ARCHIVED" | "RETIRED";
export type FormalDocumentRelationshipType = "PARENT" | "CHILD" | "DEPENDS_ON" | "SUPERSEDES" | "SUPERSEDED_BY" | "AMENDS" | "AMENDED_BY" | "EXTENDED_BY" | "CLARIFIED_BY" | "REFERENCED_BY" | "DERIVED_FROM" | "RECONCILES" | "ORIGINATES_FROM";
export type FormalDocumentValidationOutcome = "VALID" | "INVALID" | "INCOMPLETE" | "CONFLICTING";

export type FormalDocumentTaxonomyFailure =
  | "MULTIPLE_DOCUMENT_TYPES"
  | "UNKNOWN_DOCUMENT_TYPE"
  | "OWNER_NOT_UNIQUE"
  | "IDENTITY_MUTATED"
  | "RELATIONSHIP_ILLEGAL"
  | "RELATIONSHIP_CYCLE"
  | "DEPENDENCY_MISSING"
  | "DEPENDENCY_CONFLICTING"
  | "LIFECYCLE_TRANSITION_INVALID"
  | "GOVERNANCE_APPROVAL_MISSING"
  | "VOCABULARY_MUTATION_UNAPPROVED"
  | "LINEAGE_INCOMPLETE"
  | "REPLAY_NONDETERMINISTIC"
  | "INTEGRITY_VIOLATION";

export type FormalDocumentTaxonomyScenario = "BASELINE" | FormalDocumentTaxonomyFailure;
export type FormalDocumentTaxonomyInput = Readonly<{ scenario?: FormalDocumentTaxonomyScenario; tenant_id?: string }>;

export type FormalDocumentTaxonomyContract = Readonly<{
  document_id: string;
  document_type: FormalDocumentType;
  document_title: string;
  version: string;
  lifecycle_state: FormalDocumentLifecycleState;
  canonical_owner: string;
  governing_authority: string;
  parent_document_refs: readonly string[];
  child_document_refs: readonly string[];
  superseded_by: string | null;
  supersedes: readonly string[];
  amendment_refs: readonly string[];
  addendum_refs: readonly string[];
  reconciliation_refs: readonly string[];
  dependency_refs: readonly string[];
  origin_ref: string;
  approval_refs: readonly string[];
  integrity_hash: string;
}>;

export type CanonicalDocumentDefinition = Readonly<{
  document_type: FormalDocumentType;
  normative: boolean;
  purpose: string;
  defines: readonly string[];
  prohibited_semantics: readonly string[];
  immutable_after_approval: boolean;
  integrity_hash: string;
}>;

export type DocumentClassificationReport = Readonly<{
  classification_report_id: string;
  primary_classification: FormalDocumentType;
  candidate_classifications: readonly FormalDocumentType[];
  classification_unique: boolean;
  vocabulary_standardized: boolean;
  purpose_explicit: boolean;
  immutable_after_approval: boolean;
  integrity_hash: string;
}>;

export type DocumentRelationshipRecord = Readonly<{
  relationship_id: string;
  source_document_id: string;
  target_document_id: string;
  relationship_type: FormalDocumentRelationshipType;
  directional: true;
  immutable_once_approved: boolean;
  legal: boolean;
  integrity_hash: string;
}>;

export type DocumentRelationshipValidation = Readonly<{
  relationship_validation_id: string;
  relationships: readonly DocumentRelationshipRecord[];
  dependency_graph_deterministic: boolean;
  cycles_prevented: boolean;
  lineage_complete: boolean;
  outcome: FormalDocumentValidationOutcome;
  integrity_hash: string;
}>;

export type DocumentDependencyValidation = Readonly<{
  dependency_validation_id: string;
  dependency_existence: FormalDocumentValidationOutcome;
  version_compatibility: FormalDocumentValidationOutcome;
  authority_consistency: FormalDocumentValidationOutcome;
  lifecycle_compatibility: FormalDocumentValidationOutcome;
  constitutional_compatibility: FormalDocumentValidationOutcome;
  ownership_compatibility: FormalDocumentValidationOutcome;
  relationship_legality: FormalDocumentValidationOutcome;
  outcome: FormalDocumentValidationOutcome;
  integrity_hash: string;
}>;

export type DocumentLifecycleRegistry = Readonly<{
  lifecycle_registry_id: string;
  lifecycle_states: readonly FormalDocumentLifecycleState[];
  legal_transitions: readonly string[];
  current_state: FormalDocumentLifecycleState;
  target_state: FormalDocumentLifecycleState;
  transition_approved: boolean;
  historical_validity_preserved: boolean;
  replayable_after_archive: boolean;
  immutable_audit_preserved: boolean;
  deterministic: boolean;
  integrity_hash: string;
}>;

export type DocumentDependencyGraph = Readonly<{
  dependency_graph_id: string;
  nodes: readonly string[];
  edges: readonly DocumentRelationshipRecord[];
  acyclic: boolean;
  deterministic: boolean;
  integrity_hash: string;
}>;

export type TaxonomyGovernanceEngine = Readonly<{
  governance_engine_id: string;
  taxonomy_approved: boolean;
  vocabulary_governed: boolean;
  classification_enforced: boolean;
  version_governed: boolean;
  relationship_governed: boolean;
  lifecycle_governed: boolean;
  registry_managed: boolean;
  changes_traceable: boolean;
  integrity_hash: string;
}>;

export type DocumentIntegrityValidation = Readonly<{
  integrity_validation_id: string;
  taxonomy_integrity: FormalDocumentValidationOutcome;
  classification_consistency: FormalDocumentValidationOutcome;
  relationship_integrity: FormalDocumentValidationOutcome;
  dependency_integrity: FormalDocumentValidationOutcome;
  lifecycle_integrity: FormalDocumentValidationOutcome;
  authority_integrity: FormalDocumentValidationOutcome;
  version_integrity: FormalDocumentValidationOutcome;
  lineage_integrity: FormalDocumentValidationOutcome;
  reconciliation_required: boolean;
  outcome: FormalDocumentValidationOutcome;
  integrity_hash: string;
}>;

export type DocumentLineageRegistry = Readonly<{
  lineage_registry_id: string;
  creation_refs: readonly string[];
  classification_refs: readonly string[];
  approval_refs: readonly string[];
  amendment_refs: readonly string[];
  addendum_refs: readonly string[];
  reconciliation_refs: readonly string[];
  supersession_refs: readonly string[];
  retirement_refs: readonly string[];
  dependency_evolution_refs: readonly string[];
  relationship_evolution_refs: readonly string[];
  governance_decision_refs: readonly string[];
  complete: boolean;
  immutable_audit: boolean;
  integrity_hash: string;
}>;

export type DocumentReplayValidation = Readonly<{
  replay_validation_id: string;
  document_replayable: boolean;
  transitions_replayable: boolean;
  historical_versions_reproducible: boolean;
  explainability_complete: boolean;
  deterministic: boolean;
  integrity_hash: string;
}>;

export type FormalDocumentTaxonomyCertification = Readonly<{
  certification_id: string;
  outcome: "PASS" | "FAIL";
  certified: boolean;
  failures: readonly FormalDocumentTaxonomyFailure[];
  integrity_hash: string;
}>;

export type FormalDocumentTaxonomyResult = Readonly<{
  phase_version: "formal-document-taxonomy/v13.9";
  phase_identifier: "FormalDocumentTaxonomy";
  contract: FormalDocumentTaxonomyContract;
  definitions: readonly CanonicalDocumentDefinition[];
  classification: DocumentClassificationReport;
  relationships: DocumentRelationshipValidation;
  dependencies: DocumentDependencyValidation;
  lifecycle: DocumentLifecycleRegistry;
  dependency_graph: DocumentDependencyGraph;
  governance: TaxonomyGovernanceEngine;
  integrity: DocumentIntegrityValidation;
  lineage: DocumentLineageRegistry;
  replay: DocumentReplayValidation;
  certification: FormalDocumentTaxonomyCertification;
  replay_hash: string;
  integrity_hash: string;
}>;

export type FormalDocumentTaxonomyValidation = Readonly<{
  valid: boolean;
  outcome: "PASS" | "FAIL";
  replay_hash_valid: boolean;
  integrity_hash_valid: boolean;
  classification_valid: boolean;
  relationships_valid: boolean;
  dependencies_valid: boolean;
  lifecycle_valid: boolean;
  replay_valid: boolean;
  failures: readonly FormalDocumentTaxonomyFailure[];
  integrity_hash: string;
}>;

export type FormalDocumentTaxonomyBundle = Readonly<{
  doctrine: Readonly<{
    version: "formal-document-taxonomy/v13.9";
    document_types: readonly FormalDocumentType[];
    lifecycle_states: readonly FormalDocumentLifecycleState[];
    relationship_types: readonly FormalDocumentRelationshipType[];
    canonical_classification_required: true;
    deterministic_vocabulary_required: true;
    immutable_identity_required: true;
    explicit_relationships_required: true;
    historical_preservation_required: true;
    governance_authority_required: true;
    replayability_required: true;
  }>;
  result: FormalDocumentTaxonomyResult;
  validation: FormalDocumentTaxonomyValidation;
}>;
