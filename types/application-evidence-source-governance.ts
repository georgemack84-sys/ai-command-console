export type EvidenceViewType = "OPERATIONAL" | "CERTIFICATION" | "LIFECYCLE" | "GOVERNANCE" | "AUDIT" | "DEPENDENCY";
export type SourceTrustLevel = "TRUSTED" | "CONDITIONAL" | "UNTRUSTED";
export type SourceGovernanceStatus = "GOVERNED" | "REQUIRES_REVIEW" | "REJECTED" | "RETIRED";
export type SourceApprovalStatus = "APPROVED" | "PENDING" | "REJECTED";
export type ApplicationEvidenceOutcome = "PASS" | "FAIL" | "PRUNED";

export type ApplicationEvidenceFailure =
  | "P4_2_REGISTRY_INVALID"
  | "P4_3_CAPABILITY_MAP_INVALID"
  | "P4_5_CERTIFICATION_INVALID"
  | "P4_6_INTERFACE_REGISTRY_INVALID"
  | "CCI_CANONICAL_EVIDENCE_SERVICES_INVALID"
  | "CCI_EVIDENCE_REGISTRY_INVALID"
  | "CCI_EVIDENCE_LINEAGE_INVALID"
  | "CCI_REPLAY_EVIDENCE_INVALID"
  | "CCI_INTEGRITY_SERVICES_INVALID"
  | "EVIDENCE_BOUNDARY_NOT_DEFINED"
  | "CANONICAL_EVIDENCE_STORED_BY_P4"
  | "EVIDENCE_LINEAGE_MODIFIED"
  | "FORENSIC_RECORD_ALTERED"
  | "REPLAY_EVIDENCE_REWRITTEN"
  | "INTEGRITY_RECORD_REPLACED"
  | "IMMUTABLE_EVIDENCE_DUPLICATED"
  | "P4_BECAME_EVIDENCE_SYSTEM_OF_RECORD"
  | "EVIDENCE_INDEX_NOT_OPERATIONAL"
  | "EVIDENCE_INDEX_NON_DETERMINISTIC"
  | "EVIDENCE_REFERENCE_INVALID"
  | "BROKEN_REFERENCE_ALLOWED"
  | "REFERENCE_LINEAGE_NOT_PRESERVED"
  | "SOURCE_NOT_REGISTERED"
  | "SOURCE_OWNERSHIP_UNVERIFIED"
  | "SOURCE_GOVERNANCE_NOT_ENFORCED"
  | "UNAUTHORIZED_SOURCE_ACCEPTED"
  | "SOURCE_LIFECYCLE_NOT_ENFORCED"
  | "PROVENANCE_INCOMPLETE"
  | "PROVENANCE_NON_DETERMINISTIC"
  | "EVIDENCE_VIEW_DUPLICATES_RECORDS"
  | "EVIDENCE_VIEW_NOT_SYNCHRONIZED"
  | "DISCOVERY_NON_DETERMINISTIC"
  | "SEARCH_VALIDATION_FAILED"
  | "GOVERNANCE_NOT_SYNCHRONIZED_WITH_CCI"
  | "OWNERSHIP_BOUNDARY_NOT_PRESERVED"
  | "QUALIFICATION_REPORT_MISSING"
  | "VALIDATION_EVIDENCE_MISSING"
  | "CERTIFICATION_PRUNED";

export type ApplicationEvidenceScenario = "BASELINE" | ApplicationEvidenceFailure;
export type ApplicationEvidenceInput = Readonly<{ scenario?: ApplicationEvidenceScenario; tenant_id?: string }>;

export type EvidenceBoundarySpecification = Readonly<{
  boundary_id: string;
  cci_canonical_owner: boolean;
  p4_owns_indexes_only: boolean;
  duplication_prohibited: boolean;
  consumer_contract_refs: readonly string[];
  approved: boolean;
  stores_canonical_evidence: boolean;
  modifies_lineage: boolean;
  alters_forensics: boolean;
  rewrites_replay: boolean;
  replaces_integrity: boolean;
  duplicates_immutable_evidence: boolean;
  system_of_record: boolean;
  integrity_hash: string;
}>;

export type ApplicationEvidenceIndex = Readonly<{
  evidence_index_id: string;
  application_id: string;
  evidence_reference: string;
  evidence_type: string;
  evidence_category: string;
  source_id: string;
  lifecycle_phase: string;
  certification_reference: string;
  provenance_reference: string;
  integrity_reference: string;
  evidence_tags: readonly string[];
  search_metadata: readonly string[];
  created_timestamp: string;
  operational: boolean;
  deterministic: boolean;
  duplicates_evidence: boolean;
  integrity_hash: string;
}>;

export type EvidenceReferenceCatalog = Readonly<{
  catalog_id: string;
  evidence_refs: readonly string[];
  dependency_refs: readonly string[];
  lifecycle_refs: readonly string[];
  references_validated: boolean;
  broken_references_prevented: boolean;
  lineage_preserved: boolean;
  integrity_hash: string;
}>;

export type SourceRegistryRecord = Readonly<{
  source_id: string;
  source_name: string;
  provider: string;
  ownership: string;
  classification: string;
  trust_level: SourceTrustLevel;
  governance_status: SourceGovernanceStatus;
  approval_status: SourceApprovalStatus;
  lifecycle_status: "ACTIVE" | "RETIRED";
  metadata: readonly string[];
  registered: boolean;
  integrity_hash: string;
}>;

export type SourceGovernanceRecord = Readonly<{
  governance_id: string;
  trust_governance: boolean;
  approval_workflows: boolean;
  source_classification: boolean;
  source_restrictions: readonly string[];
  source_retirement: boolean;
  unauthorized_sources_rejected: boolean;
  lifecycle_enforced: boolean;
  integrity_hash: string;
}>;

export type EvidenceViewRecord = Readonly<{
  view_id: string;
  application_id: string;
  evidence_reference: string;
  provenance_reference: string;
  dependency_reference: string;
  view_type: EvidenceViewType;
  generated_timestamp: string;
  projection_only: boolean;
  synchronized: boolean;
  integrity_hash: string;
}>;

export type ProvenanceView = Readonly<{
  provenance_id: string;
  evidence_origins: readonly string[];
  dependency_chains: readonly string[];
  application_relationships: readonly string[];
  certification_lineage: readonly string[];
  operational_lineage: readonly string[];
  complete: boolean;
  deterministic: boolean;
  integrity_hash: string;
}>;

export type EvidenceDiscoveryService = Readonly<{
  discovery_id: string;
  indexed_search: boolean;
  relationship_search: boolean;
  source_lookup: boolean;
  provenance_navigation: boolean;
  deterministic: boolean;
  search_validated: boolean;
  references_accurate: boolean;
  integrity_hash: string;
}>;

export type EvidenceGovernanceIntegration = Readonly<{
  integration_id: string;
  cci_governance_consumed: boolean;
  integrity_validation_consumed: boolean;
  replay_evidence_consumed: boolean;
  audit_lineage_consumed: boolean;
  governance_synchronized: boolean;
  ownership_preserved: boolean;
  constitutional_compliance: boolean;
  integrity_hash: string;
}>;

export type EvidenceQualification = Readonly<{
  qualification_report_id: string;
  validation_evidence_id: string;
  governance_report_id: string;
  references_valid: boolean;
  provenance_verified: boolean;
  source_governance_valid: boolean;
  deterministic_indexing_valid: boolean;
  search_valid: boolean;
  constitutional_boundary_valid: boolean;
  phase_ready: boolean;
  integrity_hash: string;
}>;

export type ApplicationEvidenceCertification = Readonly<{
  certification_id: string;
  outcome: ApplicationEvidenceOutcome;
  phase_ready: boolean;
  evidence_index_operational: boolean;
  source_registry_governed: boolean;
  evidence_views_project_canonical: boolean;
  provenance_complete: boolean;
  references_deterministic_validated: boolean;
  source_governance_enforced: boolean;
  no_canonical_evidence_duplicated_or_stored: boolean;
  cci_ownership_boundary_verified: boolean;
  qualification_complete: boolean;
  failures: readonly ApplicationEvidenceFailure[];
  integrity_hash: string;
}>;

export type ApplicationEvidenceSourceGovernanceResult = Readonly<{
  phase_version: "application-evidence-source-governance/v4.7";
  phase_identifier: "ApplicationEvidenceSourceGovernance";
  application_registry_ref: "application-registry-catalog/v4.2";
  application_capability_map_ref: "application-capability-composition/v4.3";
  application_certification_ref: "application-lifecycle-certification/v4.5";
  application_interface_registry_ref: "application-integration-framework/v4.6";
  cci_evidence_services_ref: "Program 2 - CCI Evidence Services";
  cci_evidence_registry_ref: "Program 2 - CCI Evidence Registry";
  cci_evidence_lineage_ref: "Program 2 - CCI Evidence Lineage";
  cci_replay_evidence_ref: "Program 2 - CCI Replay Infrastructure";
  cci_integrity_services_ref: "Program 2 - CCI Integrity Services";
  boundary: EvidenceBoundarySpecification;
  evidence_index: ApplicationEvidenceIndex;
  reference_catalog: EvidenceReferenceCatalog;
  source_registry: SourceRegistryRecord;
  source_governance: SourceGovernanceRecord;
  evidence_views: readonly EvidenceViewRecord[];
  provenance_view: ProvenanceView;
  discovery: EvidenceDiscoveryService;
  governance_integration: EvidenceGovernanceIntegration;
  qualification: EvidenceQualification;
  certification: ApplicationEvidenceCertification;
  replay_hash: string;
  integrity_hash: string;
}>;

export type ApplicationEvidenceValidation = Readonly<{
  valid: boolean;
  outcome: ApplicationEvidenceOutcome;
  replay_hash_valid: boolean;
  integrity_hash_valid: boolean;
  boundary_valid: boolean;
  index_valid: boolean;
  references_valid: boolean;
  source_registry_valid: boolean;
  source_governance_valid: boolean;
  views_valid: boolean;
  provenance_valid: boolean;
  discovery_valid: boolean;
  governance_valid: boolean;
  qualification_valid: boolean;
  certification_valid: boolean;
  failures: readonly ApplicationEvidenceFailure[];
  integrity_hash: string;
}>;

export type ApplicationEvidenceBundle = Readonly<{
  doctrine: Readonly<{
    version: "application-evidence-source-governance/v4.7";
    owns_application_evidence_indexes: true;
    owns_application_evidence_references: true;
    owns_provenance_views: true;
    owns_source_governance: true;
    owns_canonical_evidence_storage: false;
    owns_immutable_evidence_records: false;
    owns_evidence_lineage: false;
    owns_replay_evidence: false;
    owns_forensic_records: false;
    owns_integrity_verification: false;
    becomes_evidence_system_of_record: false;
  }>;
  result: ApplicationEvidenceSourceGovernanceResult;
  validation: ApplicationEvidenceValidation;
}>;
