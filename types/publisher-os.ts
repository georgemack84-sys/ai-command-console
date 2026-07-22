export type PublisherOutcome = "PASS" | "FAIL" | "PRUNED";
export type PublicationLifecycleStatus = "DRAFT" | "UNDER_REVIEW" | "APPROVED" | "PUBLISHED" | "SUPERSEDED" | "ARCHIVED";
export type PublicationApprovalDecision = "APPROVED" | "APPROVED_WITH_CONDITIONS" | "REJECTED" | "REQUIRES_REVISION" | "REQUIRES_GOVERNANCE_REVIEW" | "REQUIRES_OPERATOR_REVIEW";

export type PublisherFailure =
  | "P4_13_PBG_INVALID"
  | "P4_11_MISSION_CONTROL_INVALID"
  | "PROGRAM_2_CCI_SERVICES_INVALID"
  | "PROGRAM_3_CAF_GOVERNANCE_INVALID"
  | "PUBLISHER_APPLICATION_MISSING"
  | "PUBLISHER_ARCHITECTURE_MISSING"
  | "PUBLISHER_CONTRACTS_MISSING"
  | "PUBLICATION_MODEL_MISSING"
  | "PUBLICATION_REGISTRY_MISSING"
  | "PUBLICATION_CATALOG_MISSING"
  | "PUBLICATION_DISCOVERY_MISSING"
  | "AUTHORING_ENGINE_MISSING"
  | "TEMPLATE_LIBRARY_MISSING"
  | "COLLABORATIVE_AUTHORING_MISSING"
  | "PUBLICATION_LIFECYCLE_NON_DETERMINISTIC"
  | "PUBLICATION_APPROVAL_MISSING"
  | "PUBLICATION_GOVERNANCE_INVALID"
  | "CAF_GATES_NOT_BOUND"
  | "VERSION_LINEAGE_INCOMPLETE"
  | "REVISION_HISTORY_MISSING"
  | "EVIDENCE_BINDING_MISSING"
  | "CANONICAL_EVIDENCE_REFS_MISSING"
  | "PROVENANCE_TRACEABILITY_INCOMPLETE"
  | "RENDERING_ENGINE_MISSING"
  | "RENDERING_NON_DETERMINISTIC"
  | "RENDERED_ARTIFACTS_MISSING"
  | "DISTRIBUTION_SERVICE_MISSING"
  | "RELEASE_CHANNELS_MISSING"
  | "TENANT_DELIVERY_MISSING"
  | "SEARCH_SERVICES_MISSING"
  | "CCI_SEARCH_NOT_CONSUMED"
  | "OBSERVABILITY_DASHBOARD_MISSING"
  | "OPERATIONAL_DIAGNOSTICS_MISSING"
  | "READINESS_REPORT_MISSING"
  | "CONSTITUTIONAL_COMPLIANCE_INVALID"
  | "LINEAGE_INTEGRITY_INVALID"
  | "REPLAY_COMPATIBILITY_INVALID"
  | "CONSTITUTIONAL_GOVERNANCE_OWNERSHIP_ATTEMPTED"
  | "EVIDENCE_STORAGE_ATTEMPTED"
  | "REPLAY_INFRASTRUCTURE_ATTEMPTED"
  | "IDENTITY_INFRASTRUCTURE_ATTEMPTED"
  | "TENANT_MANAGEMENT_ATTEMPTED"
  | "AUTHORITY_ENFORCEMENT_ATTEMPTED"
  | "POLICY_ENFORCEMENT_ATTEMPTED"
  | "SAFETY_ENFORCEMENT_ATTEMPTED"
  | "CERTIFICATION_PRUNED";

export type PublisherScenario = "BASELINE" | PublisherFailure;
export type PublisherInput = Readonly<{ scenario?: PublisherScenario; application_id?: string; tenant_id?: string }>;

export type PublisherFoundation = Readonly<{
  application_id: string;
  application_name: "Publisher OS";
  tenant_id: string;
  architecture_ref: string;
  publisher_contract_refs: readonly string[];
  publication_model_ref: string;
  service_contract_refs: readonly string[];
  boundaries_verified: boolean;
  integrity_hash: string;
}>;

export type PublicationRecord = Readonly<{
  publication_id: string;
  publication_name: string;
  publication_type: string;
  tenant_id: string;
  namespace: string;
  owner: string;
  current_version: string;
  lifecycle_status: PublicationLifecycleStatus;
  governance_status: "GOVERNED" | "BLOCKED";
  publication_date: string;
  superseded_by: string;
  evidence_refs: readonly string[];
  lineage_refs: readonly string[];
  integrity_hash: string;
}>;

export type PublicationVersionRecord = Readonly<{
  version_id: string;
  publication_id: string;
  semantic_version: string;
  author: string;
  change_summary: string;
  evidence_refs: readonly string[];
  approval_refs: readonly string[];
  publication_timestamp: string;
  rendered_artifacts: readonly string[];
  integrity_hash: string;
}>;

export type PublicationApprovalRecord = Readonly<{
  approval_id: string;
  publication_id: string;
  authority_level: string;
  reviewer: string;
  decision: PublicationApprovalDecision;
  approval_timestamp: string;
  governance_refs: readonly string[];
  integrity_hash: string;
}>;

export type PublicationRegistry = Readonly<{
  registry_id: string;
  catalog_id: string;
  publication: PublicationRecord;
  metadata_refs: readonly string[];
  ownership_refs: readonly string[];
  discovery_refs: readonly string[];
  operational: boolean;
  integrity_hash: string;
}>;

export type AuthoringFramework = Readonly<{
  authoring_engine_id: string;
  template_library_id: string;
  structured_authoring_refs: readonly string[];
  composition_refs: readonly string[];
  collaborative_editing_refs: readonly string[];
  reusable_content_block_refs: readonly string[];
  governed_content_creation: boolean;
  integrity_hash: string;
}>;

export type PublicationLifecycle = Readonly<{
  lifecycle_engine_id: string;
  statuses: readonly PublicationLifecycleStatus[];
  current_status: PublicationLifecycleStatus;
  deterministic: boolean;
  approval: PublicationApprovalRecord;
  integrity_hash: string;
}>;

export type PublicationGovernance = Readonly<{
  governance_engine_id: string;
  authority_gate_ref: string;
  policy_gate_ref: string;
  safety_gate_ref: string;
  constitutional_validation_ref: string;
  release_governance_ref: string;
  permissions_ref: string;
  integrated: boolean;
  enforcement_owned: boolean;
  integrity_hash: string;
}>;

export type PublicationLineage = Readonly<{
  lineage_id: string;
  version: PublicationVersionRecord;
  revision_history_refs: readonly string[];
  supersession_refs: readonly string[];
  lineage_graph_refs: readonly string[];
  dependency_refs: readonly string[];
  deterministic: boolean;
  integrity_hash: string;
}>;

export type PublicationEvidenceIndex = Readonly<{
  evidence_index_id: string;
  evidence_refs: readonly string[];
  citation_refs: readonly string[];
  provenance_refs: readonly string[];
  traceability_refs: readonly string[];
  references_canonical_cci_evidence: boolean;
  owns_evidence: boolean;
  integrity_hash: string;
}>;

export type RenderingEngine = Readonly<{
  rendering_engine_id: string;
  formats: readonly ("HTML" | "Markdown" | "PDF" | "JSON" | "XML")[];
  rendered_artifacts: readonly string[];
  version_rendering_supported: boolean;
  reproducible_builds: boolean;
  deterministic_output: boolean;
  integrity_hash: string;
}>;

export type DistributionService = Readonly<{
  distribution_service_id: string;
  package_refs: readonly string[];
  release_channel_refs: readonly string[];
  publication_feed_refs: readonly string[];
  tenant_delivery_refs: readonly string[];
  secure_download_refs: readonly string[];
  operational: boolean;
  integrity_hash: string;
}>;

export type PublicationSearch = Readonly<{
  search_service_id: string;
  full_text_search_ref: string;
  metadata_search_ref: string;
  evidence_search_ref: string;
  relationship_refs: readonly string[];
  taxonomy_navigation_ref: string;
  consumes_cci_search: boolean;
  functional: boolean;
  integrity_hash: string;
}>;

export type PublisherObservability = Readonly<{
  dashboard_id: string;
  diagnostics_id: string;
  lifecycle_monitoring_refs: readonly string[];
  approval_latency_refs: readonly string[];
  rendering_health_refs: readonly string[];
  governance_failure_refs: readonly string[];
  distribution_health_refs: readonly string[];
  visible: boolean;
  integrity_hash: string;
}>;

export type PublisherReadiness = Readonly<{
  readiness_report_id: string;
  constitutional_compliance: boolean;
  governance_compliance: boolean;
  publication_reproducibility: boolean;
  deterministic_rendering: boolean;
  evidence_completeness: boolean;
  lineage_integrity: boolean;
  replay_compatibility: boolean;
  ecosystem_publication_ready: boolean;
  integrity_hash: string;
}>;

export type PublisherCertification = Readonly<{
  certification_id: string;
  outcome: PublisherOutcome;
  phase_ready: boolean;
  architecture_implemented: boolean;
  registry_operational: boolean;
  authoring_operational: boolean;
  lifecycle_managed: boolean;
  governance_integrated: boolean;
  lineage_deterministic: boolean;
  evidence_canonical: boolean;
  rendering_reproducible: boolean;
  distribution_operational: boolean;
  search_functional: boolean;
  observability_visible: boolean;
  readiness_confirmed: boolean;
  no_out_of_scope_ownership: boolean;
  failures: readonly PublisherFailure[];
  integrity_hash: string;
}>;

export type PublisherOsResult = Readonly<{
  phase_version: "publisher-os/v4.14";
  phase_identifier: "PublisherOS";
  pbg_ref: "policy-business-governance/v4.13";
  mission_control_ref: "mission-control/v4.11";
  foundation: PublisherFoundation;
  registry: PublicationRegistry;
  authoring: AuthoringFramework;
  lifecycle: PublicationLifecycle;
  governance: PublicationGovernance;
  lineage: PublicationLineage;
  evidence: PublicationEvidenceIndex;
  rendering: RenderingEngine;
  distribution: DistributionService;
  search: PublicationSearch;
  observability: PublisherObservability;
  readiness: PublisherReadiness;
  certification: PublisherCertification;
  replay_hash: string;
  integrity_hash: string;
}>;

export type PublisherValidation = Readonly<{
  valid: boolean;
  outcome: PublisherOutcome;
  replay_hash_valid: boolean;
  integrity_hash_valid: boolean;
  foundation_valid: boolean;
  registry_valid: boolean;
  authoring_valid: boolean;
  lifecycle_valid: boolean;
  governance_valid: boolean;
  lineage_valid: boolean;
  evidence_valid: boolean;
  rendering_valid: boolean;
  distribution_valid: boolean;
  search_valid: boolean;
  observability_valid: boolean;
  readiness_valid: boolean;
  certification_valid: boolean;
  failures: readonly PublisherFailure[];
  integrity_hash: string;
}>;

export type PublisherBundle = Readonly<{
  doctrine: Readonly<{
    version: "publisher-os/v4.14";
    owns_publication_management: true;
    owns_document_lifecycle: true;
    owns_publication_workflows: true;
    owns_publication_rendering: true;
    owns_publication_distribution: true;
    owns_publication_templates: true;
    owns_constitutional_governance: false;
    owns_evidence_storage: false;
    owns_replay_infrastructure: false;
    owns_identity_infrastructure: false;
    owns_tenant_management: false;
    owns_authority_enforcement: false;
    owns_policy_enforcement: false;
    owns_safety_enforcement: false;
  }>;
  result: PublisherOsResult;
  validation: PublisherValidation;
}>;
