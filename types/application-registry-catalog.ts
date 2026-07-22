import type { ApplicationTaxonomyCategory } from "@/types/application-constitutional-foundation";

export type ApplicationRegistryLifecycleState = "REGISTERED" | "VALIDATED" | "CATALOGED" | "ACTIVE" | "UPDATED" | "SUPERSEDED" | "RETIRED" | "ARCHIVED";
export type ApplicationRegistryOutcome = "PASS" | "FAIL" | "PRUNED";
export type ApplicationRegistryCheckResult = "PASS" | "FAIL";
export type ApplicationConstitutionalStatus = "FOUNDATION_VALIDATED" | "PENDING_VALIDATION" | "REJECTED";

export type ApplicationRegistryFailure =
  | "P4_1_FOUNDATION_INVALID"
  | "CCI_REGISTRY_SERVICES_UNAVAILABLE"
  | "CCI_IDENTITY_SERVICES_UNAVAILABLE"
  | "CCI_STORAGE_SERVICES_UNAVAILABLE"
  | "CCI_EVIDENCE_SERVICES_UNAVAILABLE"
  | "CCI_AUDIT_SERVICES_UNAVAILABLE"
  | "APPLICATION_NOT_REGISTERED_BEFORE_PUBLICATION"
  | "APPLICATION_IDENTITY_MUTATED"
  | "HISTORICAL_ALIAS_UNRESOLVABLE"
  | "METADATA_UNVALIDATED"
  | "UNAUTHORIZED_METADATA_CHANGE_ALLOWED"
  | "LINEAGE_NOT_APPEND_ONLY"
  | "LINEAGE_INCOMPLETE"
  | "OWNERSHIP_REFERENCE_UNRESOLVED"
  | "DISCOVERY_DUPLICATES_RETURNED"
  | "DISCOVERY_NON_DETERMINISTIC"
  | "INVALID_REGISTRATION_ACCEPTED"
  | "AUDIT_EVIDENCE_MISSING"
  | "AUDIT_EVIDENCE_MUTABLE"
  | "DUPLICATE_REGISTRATION_ALLOWED"
  | "CATALOG_PUBLICATION_UNGOVERNED"
  | "DEPLOYMENT_ATTEMPTED"
  | "RUNTIME_EXECUTION_ATTEMPTED"
  | "PLATFORM_CERTIFICATION_ATTEMPTED"
  | "RUNTIME_GOVERNANCE_ATTEMPTED"
  | "CERTIFICATION_PRUNED";

export type ApplicationRegistryScenario = "BASELINE" | ApplicationRegistryFailure;
export type ApplicationRegistryInput = Readonly<{ scenario?: ApplicationRegistryScenario; tenant_id?: string }>;

export type ApplicationRegistryRecord = Readonly<{
  application_id: string;
  canonical_name: string;
  display_name: string;
  aliases: readonly string[];
  constitutional_owner_ref: string;
  taxonomy_classification: ApplicationTaxonomyCategory;
  namespace: string;
  lifecycle_state: ApplicationRegistryLifecycleState;
  version: string;
  dependency_refs: readonly string[];
  constitutional_refs: readonly string[];
  metadata_refs: readonly string[];
  audit_refs: readonly string[];
  immutable_identity: boolean;
  registered: boolean;
  integrity_hash: string;
}>;

export type ApplicationRegistry = Readonly<{
  registry_id: string;
  authoritative: boolean;
  initialized: boolean;
  cci_registry_ref: string;
  cci_identity_ref: string;
  records: readonly ApplicationRegistryRecord[];
  duplicate_prevention: boolean;
  identity_validation: boolean;
  governance_enabled: boolean;
  integrity_hash: string;
}>;

export type ApplicationMetadataRepository = Readonly<{
  repository_id: string;
  schema_ref: string;
  metadata_validated: boolean;
  ownership_metadata_resolved: boolean;
  classification_validated: boolean;
  constitutional_attributes_validated: boolean;
  unauthorized_changes_blocked: boolean;
  integrity_hash: string;
}>;

export type ApplicationDiscoveryIndex = Readonly<{
  discovery_id: string;
  views: readonly string[];
  indexed_application_ids: readonly string[];
  deterministic_ordering: boolean;
  duplicate_free: boolean;
  dependency_discovery_enabled: boolean;
  ownership_lookup_enabled: boolean;
  integrity_hash: string;
}>;

export type EcosystemApplicationCatalog = Readonly<{
  catalog_id: string;
  published: boolean;
  publication_approved: boolean;
  taxonomy_organized: boolean;
  ownership_visible: boolean;
  dependency_visible: boolean;
  constitutional_status_visible: boolean;
  application_ids: readonly string[];
  integrity_hash: string;
}>;

export type ApplicationLineageRecord = Readonly<{
  lineage_id: string;
  application_id: string;
  previous_version: string;
  current_version: string;
  ownership_lineage: readonly string[];
  namespace_lineage: readonly string[];
  metadata_changes: readonly string[];
  dependency_changes: readonly string[];
  constitutional_refs: readonly string[];
  audit_refs: readonly string[];
  timestamps: readonly string[];
  append_only: boolean;
  complete: boolean;
  immutable: boolean;
  integrity_hash: string;
}>;

export type CatalogGovernance = Readonly<{
  governance_id: string;
  publication_requires_registration: boolean;
  publication_requires_validated_metadata: boolean;
  identity_immutable: boolean;
  aliases_permanently_resolvable: boolean;
  ownership_refs_resolve_to_p4_1: boolean;
  duplicate_registrations_rejected: boolean;
  invalid_registrations_rejected: boolean;
  catalog_consistent: boolean;
  integrity_hash: string;
}>;

export type RegistryAuditEvidence = Readonly<{
  evidence_id: string;
  registry_operation_refs: readonly string[];
  metadata_operation_refs: readonly string[];
  lineage_refs: readonly string[];
  catalog_publication_refs: readonly string[];
  audit_refs: readonly string[];
  immutable: boolean;
  complete: boolean;
  integrity_hash: string;
}>;

export type ApplicationRegistryCertification = Readonly<{
  certification_id: string;
  outcome: ApplicationRegistryOutcome;
  phase_ready: boolean;
  registry_operational: boolean;
  immutable_identities_enforced: boolean;
  catalog_published: boolean;
  discovery_deterministic: boolean;
  metadata_governed: boolean;
  ownership_refs_resolved: boolean;
  lineage_complete: boolean;
  duplicate_registrations_prevented: boolean;
  audit_evidence_complete: boolean;
  constitutional_validation_required: boolean;
  no_runtime_or_certification_authority: boolean;
  failures: readonly ApplicationRegistryFailure[];
  integrity_hash: string;
}>;

export type ApplicationRegistryCatalogResult = Readonly<{
  phase_version: "application-registry-catalog/v4.2";
  phase_identifier: "ApplicationRegistryCatalog";
  application_foundation_ref: "application-constitutional-foundation/v4.1";
  cci_registry_services_ref: "Program 2 - CCI Registry Services";
  cci_identity_services_ref: "Program 2 - CCI Identity Services";
  cci_storage_services_ref: "Program 2 - CCI Storage Services";
  cci_evidence_services_ref: "Program 2 - CCI Evidence Services";
  cci_audit_services_ref: "Program 2 - CCI Audit Services";
  registry: ApplicationRegistry;
  metadata_repository: ApplicationMetadataRepository;
  discovery_index: ApplicationDiscoveryIndex;
  catalog: EcosystemApplicationCatalog;
  lineage: ApplicationLineageRecord;
  governance: CatalogGovernance;
  audit_evidence: RegistryAuditEvidence;
  certification: ApplicationRegistryCertification;
  replay_hash: string;
  integrity_hash: string;
}>;

export type ApplicationRegistryValidation = Readonly<{
  valid: boolean;
  outcome: ApplicationRegistryOutcome;
  replay_hash_valid: boolean;
  integrity_hash_valid: boolean;
  registry_valid: boolean;
  metadata_valid: boolean;
  discovery_valid: boolean;
  catalog_valid: boolean;
  lineage_valid: boolean;
  governance_valid: boolean;
  audit_valid: boolean;
  certification_valid: boolean;
  failures: readonly ApplicationRegistryFailure[];
  integrity_hash: string;
}>;

export type ApplicationRegistryBundle = Readonly<{
  doctrine: Readonly<{
    version: "application-registry-catalog/v4.2";
    owns_application_registry: true;
    owns_application_metadata: true;
    owns_application_discovery: true;
    owns_application_lineage: true;
    owns_catalog_governance: true;
    authoritative_identity_registry: true;
    deploys_applications: false;
    executes_applications: false;
    certifies_applications: false;
    governs_runtime_behavior: false;
  }>;
  result: ApplicationRegistryCatalogResult;
  validation: ApplicationRegistryValidation;
}>;
