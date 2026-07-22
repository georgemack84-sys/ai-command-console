import { runApplicationIntegrationFramework, validateApplicationIntegrationFramework } from "@/services/application-integration-framework";
import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import type {
  ApplicationEvidenceBundle,
  ApplicationEvidenceFailure,
  ApplicationEvidenceInput,
  ApplicationEvidenceOutcome,
  ApplicationEvidenceScenario,
  ApplicationEvidenceSourceGovernanceResult,
  ApplicationEvidenceValidation,
} from "@/types/application-evidence-source-governance";

const VERSION = "application-evidence-source-governance/v4.7" as const;
const IDENTIFIER = "ApplicationEvidenceSourceGovernance" as const;
let baselineIntegration: ReturnType<typeof runApplicationIntegrationFramework> | undefined;

function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function hash(value: unknown): string { return generateDecisionIntegrityHash(value); }
function hashWithoutIntegrity<T extends object>(value: T): string {
  const copy = { ...value } as Record<string, unknown>;
  delete copy.integrity_hash;
  return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown);
}
function nested<T extends object>(value: T): T & { integrity_hash: string } {
  return Object.freeze({ ...value, integrity_hash: hashWithoutIntegrity(value) }) as T & { integrity_hash: string };
}
function has(failures: readonly ApplicationEvidenceFailure[], failure: ApplicationEvidenceFailure): boolean { return failures.includes(failure); }
function scenarioFailure(scenario: ApplicationEvidenceScenario): ApplicationEvidenceFailure | undefined { return scenario === "BASELINE" ? undefined : scenario; }
function outcome(failures: readonly ApplicationEvidenceFailure[]): ApplicationEvidenceOutcome {
  if (has(failures, "CERTIFICATION_PRUNED")) return "PRUNED";
  return failures.length ? "FAIL" : "PASS";
}
function verifyHashedRecord(value: { integrity_hash: string }): boolean { return hashWithoutIntegrity(value) === value.integrity_hash; }
function getBaselineIntegration() { baselineIntegration ??= runApplicationIntegrationFramework(); return baselineIntegration; }

function resultReplayHash(result: Omit<ApplicationEvidenceSourceGovernanceResult, "replay_hash" | "integrity_hash">): string {
  return hash({
    boundary: result.boundary.integrity_hash,
    index: result.evidence_index.integrity_hash,
    references: result.reference_catalog.integrity_hash,
    source: result.source_registry.integrity_hash,
    source_governance: result.source_governance.integrity_hash,
    views: result.evidence_views.map((view) => view.integrity_hash),
    provenance: result.provenance_view.integrity_hash,
    discovery: result.discovery.integrity_hash,
    governance: result.governance_integration.integrity_hash,
    qualification: result.qualification.integrity_hash,
    certification: result.certification.integrity_hash,
  });
}
function resultIntegrityHash(result: Omit<ApplicationEvidenceSourceGovernanceResult, "integrity_hash">): string {
  return hash({ version: result.phase_version, identifier: result.phase_identifier, outcome: result.certification.outcome, replay_hash: result.replay_hash });
}

export function runApplicationEvidenceSourceGovernance(input: ApplicationEvidenceInput = {}): ApplicationEvidenceSourceGovernanceResult {
  const direct = scenarioFailure(input.scenario ?? "BASELINE");
  const scenarioFailures = freezeArray<ApplicationEvidenceFailure>(direct ? [direct] : []);
  const integration = getBaselineIntegration();
  const dependencyFailures = freezeArray<ApplicationEvidenceFailure>([
    ...(has(scenarioFailures, "P4_2_REGISTRY_INVALID") ? ["P4_2_REGISTRY_INVALID" as const] : []),
    ...(has(scenarioFailures, "P4_3_CAPABILITY_MAP_INVALID") ? ["P4_3_CAPABILITY_MAP_INVALID" as const] : []),
    ...(has(scenarioFailures, "P4_5_CERTIFICATION_INVALID") ? ["P4_5_CERTIFICATION_INVALID" as const] : []),
    ...(!validateApplicationIntegrationFramework(integration).valid || has(scenarioFailures, "P4_6_INTERFACE_REGISTRY_INVALID") ? ["P4_6_INTERFACE_REGISTRY_INVALID" as const] : []),
    ...(has(scenarioFailures, "CCI_CANONICAL_EVIDENCE_SERVICES_INVALID") ? ["CCI_CANONICAL_EVIDENCE_SERVICES_INVALID" as const] : []),
    ...(has(scenarioFailures, "CCI_EVIDENCE_REGISTRY_INVALID") ? ["CCI_EVIDENCE_REGISTRY_INVALID" as const] : []),
    ...(has(scenarioFailures, "CCI_EVIDENCE_LINEAGE_INVALID") ? ["CCI_EVIDENCE_LINEAGE_INVALID" as const] : []),
    ...(has(scenarioFailures, "CCI_REPLAY_EVIDENCE_INVALID") ? ["CCI_REPLAY_EVIDENCE_INVALID" as const] : []),
    ...(has(scenarioFailures, "CCI_INTEGRITY_SERVICES_INVALID") ? ["CCI_INTEGRITY_SERVICES_INVALID" as const] : []),
  ]);
  const failures = freezeArray([...new Set([...scenarioFailures, ...dependencyFailures])]);
  const boundary = nested({
    boundary_id: "P4.7-EVIDENCE-BOUNDARY-001",
    cci_canonical_owner: !has(failures, "EVIDENCE_BOUNDARY_NOT_DEFINED"),
    p4_owns_indexes_only: !has(failures, "EVIDENCE_BOUNDARY_NOT_DEFINED"),
    duplication_prohibited: !has(failures, "EVIDENCE_BOUNDARY_NOT_DEFINED"),
    consumer_contract_refs: has(failures, "EVIDENCE_BOUNDARY_NOT_DEFINED") ? freezeArray([]) : freezeArray(["contract:p4.7:evidence-consumer", integration.integration_contract.integration_contract_id]),
    approved: !has(failures, "EVIDENCE_BOUNDARY_NOT_DEFINED"),
    stores_canonical_evidence: has(failures, "CANONICAL_EVIDENCE_STORED_BY_P4"),
    modifies_lineage: has(failures, "EVIDENCE_LINEAGE_MODIFIED"),
    alters_forensics: has(failures, "FORENSIC_RECORD_ALTERED"),
    rewrites_replay: has(failures, "REPLAY_EVIDENCE_REWRITTEN"),
    replaces_integrity: has(failures, "INTEGRITY_RECORD_REPLACED"),
    duplicates_immutable_evidence: has(failures, "IMMUTABLE_EVIDENCE_DUPLICATED"),
    system_of_record: has(failures, "P4_BECAME_EVIDENCE_SYSTEM_OF_RECORD"),
  });
  const applicationId = integration.interface_record.application_id;
  const certificateRef = integration.integration_contract.certification_requirements[0] ?? "P4.5-APPLICATION-CERTIFICATE-001";
  const cciEvidenceRef = "cci:evidence:application-certification:001";
  const evidence_index = nested({
    evidence_index_id: "P4.7-APPLICATION-EVIDENCE-INDEX-001",
    application_id: applicationId,
    evidence_reference: cciEvidenceRef,
    evidence_type: "CERTIFICATION",
    evidence_category: "application-certification",
    source_id: "source:p4.7:cci-evidence",
    lifecycle_phase: "ACTIVE",
    certification_reference: certificateRef,
    provenance_reference: "provenance:p4.7:application-certification",
    integrity_reference: "cci:integrity:application-certification:001",
    evidence_tags: freezeArray(["certification", "lifecycle", "governance"]),
    search_metadata: freezeArray(["application:command-console", "category:certification", "source:cci"]),
    created_timestamp: "2026-07-17T06:00:00.000Z",
    operational: !has(failures, "EVIDENCE_INDEX_NOT_OPERATIONAL"),
    deterministic: !has(failures, "EVIDENCE_INDEX_NON_DETERMINISTIC"),
    duplicates_evidence: has(failures, "EVIDENCE_VIEW_DUPLICATES_RECORDS") || has(failures, "IMMUTABLE_EVIDENCE_DUPLICATED"),
  });
  const reference_catalog = nested({
    catalog_id: "P4.7-EVIDENCE-REFERENCE-CATALOG-001",
    evidence_refs: has(failures, "EVIDENCE_REFERENCE_INVALID") ? freezeArray(["missing:evidence"]) : freezeArray([cciEvidenceRef, "P4.5-CERTIFICATION-EVIDENCE-001", integration.evidence.evidence_id]),
    dependency_refs: freezeArray(["P4.2-APPLICATION-REGISTRY-001", "P4.3-CAPABILITY-MAP-001", certificateRef, integration.interface_record.interface_id]),
    lifecycle_refs: freezeArray(["application-lifecycle-certification/v4.5:ACTIVE"]),
    references_validated: !has(failures, "EVIDENCE_REFERENCE_INVALID"),
    broken_references_prevented: !has(failures, "BROKEN_REFERENCE_ALLOWED"),
    lineage_preserved: !has(failures, "REFERENCE_LINEAGE_NOT_PRESERVED"),
  });
  const source_registry = nested({
    source_id: has(failures, "SOURCE_NOT_REGISTERED") ? "" : "source:p4.7:cci-evidence",
    source_name: "CCI Canonical Evidence Services",
    provider: "Program 2 CCI",
    ownership: has(failures, "SOURCE_OWNERSHIP_UNVERIFIED") ? "" : "owner:cci:evidence",
    classification: "canonical-evidence-reference",
    trust_level: has(failures, "UNAUTHORIZED_SOURCE_ACCEPTED") ? "UNTRUSTED" as const : "TRUSTED" as const,
    governance_status: has(failures, "SOURCE_GOVERNANCE_NOT_ENFORCED") ? "REQUIRES_REVIEW" as const : "GOVERNED" as const,
    approval_status: has(failures, "UNAUTHORIZED_SOURCE_ACCEPTED") ? "REJECTED" as const : "APPROVED" as const,
    lifecycle_status: "ACTIVE" as const,
    metadata: freezeArray(["canonical-owner:cci", "consumer:p4", "storage:not-owned-by-p4"]),
    registered: !has(failures, "SOURCE_NOT_REGISTERED"),
  });
  const source_governance = nested({
    governance_id: "P4.7-SOURCE-GOVERNANCE-001",
    trust_governance: source_registry.trust_level === "TRUSTED",
    approval_workflows: source_registry.approval_status === "APPROVED",
    source_classification: true,
    source_restrictions: freezeArray(["reference-only", "no-canonical-storage", "no-lineage-rewrite"]),
    source_retirement: !has(failures, "SOURCE_LIFECYCLE_NOT_ENFORCED"),
    unauthorized_sources_rejected: !has(failures, "UNAUTHORIZED_SOURCE_ACCEPTED"),
    lifecycle_enforced: !has(failures, "SOURCE_LIFECYCLE_NOT_ENFORCED"),
  });
  const evidence_views = freezeArray([
    nested({ view_id: "P4.7-VIEW-CERTIFICATION-001", application_id: applicationId, evidence_reference: cciEvidenceRef, provenance_reference: evidence_index.provenance_reference, dependency_reference: reference_catalog.catalog_id, view_type: "CERTIFICATION" as const, generated_timestamp: "2026-07-17T06:10:00.000Z", projection_only: !has(failures, "EVIDENCE_VIEW_DUPLICATES_RECORDS"), synchronized: !has(failures, "EVIDENCE_VIEW_NOT_SYNCHRONIZED") }),
    nested({ view_id: "P4.7-VIEW-AUDIT-001", application_id: applicationId, evidence_reference: "cci:evidence:audit:001", provenance_reference: "provenance:p4.7:audit", dependency_reference: reference_catalog.catalog_id, view_type: "AUDIT" as const, generated_timestamp: "2026-07-17T06:11:00.000Z", projection_only: !has(failures, "EVIDENCE_VIEW_DUPLICATES_RECORDS"), synchronized: !has(failures, "EVIDENCE_VIEW_NOT_SYNCHRONIZED") }),
  ]);
  const provenance_view = nested({
    provenance_id: "P4.7-PROVENANCE-VIEW-001",
    evidence_origins: has(failures, "PROVENANCE_INCOMPLETE") ? freezeArray([]) : freezeArray(["Program 2 CCI Evidence Services"]),
    dependency_chains: has(failures, "PROVENANCE_INCOMPLETE") ? freezeArray([]) : freezeArray([reference_catalog.catalog_id]),
    application_relationships: freezeArray([applicationId, integration.integration_record.target_application]),
    certification_lineage: freezeArray([certificateRef, "P4.5-VERSION-LINEAGE-001"]),
    operational_lineage: freezeArray([integration.integration_record.integration_id]),
    complete: !has(failures, "PROVENANCE_INCOMPLETE"),
    deterministic: !has(failures, "PROVENANCE_NON_DETERMINISTIC"),
  });
  const discovery = nested({
    discovery_id: "P4.7-EVIDENCE-DISCOVERY-001",
    indexed_search: true,
    relationship_search: true,
    source_lookup: true,
    provenance_navigation: true,
    deterministic: !has(failures, "DISCOVERY_NON_DETERMINISTIC"),
    search_validated: !has(failures, "SEARCH_VALIDATION_FAILED"),
    references_accurate: reference_catalog.references_validated,
  });
  const governance_integration = nested({
    integration_id: "P4.7-CCI-GOVERNANCE-INTEGRATION-001",
    cci_governance_consumed: !has(failures, "GOVERNANCE_NOT_SYNCHRONIZED_WITH_CCI"),
    integrity_validation_consumed: !has(failures, "CCI_INTEGRITY_SERVICES_INVALID"),
    replay_evidence_consumed: !has(failures, "CCI_REPLAY_EVIDENCE_INVALID"),
    audit_lineage_consumed: !has(failures, "CCI_EVIDENCE_LINEAGE_INVALID"),
    governance_synchronized: !has(failures, "GOVERNANCE_NOT_SYNCHRONIZED_WITH_CCI"),
    ownership_preserved: !has(failures, "OWNERSHIP_BOUNDARY_NOT_PRESERVED"),
    constitutional_compliance: !has(failures, "OWNERSHIP_BOUNDARY_NOT_PRESERVED"),
  });
  const qualification = nested({
    qualification_report_id: has(failures, "QUALIFICATION_REPORT_MISSING") ? "" : "P4.7-QUALIFICATION-REPORT-001",
    validation_evidence_id: has(failures, "VALIDATION_EVIDENCE_MISSING") ? "" : "P4.7-VALIDATION-EVIDENCE-001",
    governance_report_id: "P4.7-GOVERNANCE-REPORT-001",
    references_valid: reference_catalog.references_validated,
    provenance_verified: provenance_view.complete && provenance_view.deterministic,
    source_governance_valid: source_governance.trust_governance && source_governance.unauthorized_sources_rejected,
    deterministic_indexing_valid: evidence_index.deterministic,
    search_valid: discovery.search_validated && discovery.deterministic,
    constitutional_boundary_valid: boundary.approved && boundary.cci_canonical_owner && !boundary.system_of_record,
    phase_ready: true,
  });
  const noBoundaryViolation = boundary.cci_canonical_owner && boundary.p4_owns_indexes_only && boundary.duplication_prohibited && !boundary.stores_canonical_evidence && !boundary.modifies_lineage && !boundary.alters_forensics && !boundary.rewrites_replay && !boundary.replaces_integrity && !boundary.duplicates_immutable_evidence && !boundary.system_of_record && !evidence_index.duplicates_evidence && evidence_views.every((view) => view.projection_only);
  const derivedFailures = freezeArray([...new Set([
    ...failures,
    ...(!boundary.approved ? ["EVIDENCE_BOUNDARY_NOT_DEFINED" as const] : []),
    ...(boundary.stores_canonical_evidence ? ["CANONICAL_EVIDENCE_STORED_BY_P4" as const] : []),
    ...(boundary.modifies_lineage ? ["EVIDENCE_LINEAGE_MODIFIED" as const] : []),
    ...(boundary.alters_forensics ? ["FORENSIC_RECORD_ALTERED" as const] : []),
    ...(boundary.rewrites_replay ? ["REPLAY_EVIDENCE_REWRITTEN" as const] : []),
    ...(boundary.replaces_integrity ? ["INTEGRITY_RECORD_REPLACED" as const] : []),
    ...(boundary.duplicates_immutable_evidence || evidence_index.duplicates_evidence ? ["IMMUTABLE_EVIDENCE_DUPLICATED" as const] : []),
    ...(boundary.system_of_record ? ["P4_BECAME_EVIDENCE_SYSTEM_OF_RECORD" as const] : []),
    ...(!evidence_index.operational ? ["EVIDENCE_INDEX_NOT_OPERATIONAL" as const] : []),
    ...(!evidence_index.deterministic ? ["EVIDENCE_INDEX_NON_DETERMINISTIC" as const] : []),
    ...(!reference_catalog.references_validated ? ["EVIDENCE_REFERENCE_INVALID" as const] : []),
    ...(!reference_catalog.broken_references_prevented ? ["BROKEN_REFERENCE_ALLOWED" as const] : []),
    ...(!reference_catalog.lineage_preserved ? ["REFERENCE_LINEAGE_NOT_PRESERVED" as const] : []),
    ...(!source_registry.registered ? ["SOURCE_NOT_REGISTERED" as const] : []),
    ...(source_registry.ownership.length === 0 ? ["SOURCE_OWNERSHIP_UNVERIFIED" as const] : []),
    ...(source_registry.governance_status !== "GOVERNED" ? ["SOURCE_GOVERNANCE_NOT_ENFORCED" as const] : []),
    ...(!source_governance.unauthorized_sources_rejected ? ["UNAUTHORIZED_SOURCE_ACCEPTED" as const] : []),
    ...(!source_governance.lifecycle_enforced ? ["SOURCE_LIFECYCLE_NOT_ENFORCED" as const] : []),
    ...(!provenance_view.complete ? ["PROVENANCE_INCOMPLETE" as const] : []),
    ...(!provenance_view.deterministic ? ["PROVENANCE_NON_DETERMINISTIC" as const] : []),
    ...(evidence_views.some((view) => !view.projection_only) ? ["EVIDENCE_VIEW_DUPLICATES_RECORDS" as const] : []),
    ...(evidence_views.some((view) => !view.synchronized) ? ["EVIDENCE_VIEW_NOT_SYNCHRONIZED" as const] : []),
    ...(!discovery.deterministic ? ["DISCOVERY_NON_DETERMINISTIC" as const] : []),
    ...(!discovery.search_validated ? ["SEARCH_VALIDATION_FAILED" as const] : []),
    ...(!governance_integration.governance_synchronized ? ["GOVERNANCE_NOT_SYNCHRONIZED_WITH_CCI" as const] : []),
    ...(!governance_integration.ownership_preserved ? ["OWNERSHIP_BOUNDARY_NOT_PRESERVED" as const] : []),
    ...(qualification.qualification_report_id.length === 0 ? ["QUALIFICATION_REPORT_MISSING" as const] : []),
    ...(qualification.validation_evidence_id.length === 0 ? ["VALIDATION_EVIDENCE_MISSING" as const] : []),
  ])]);
  const certification = nested({
    certification_id: "P4.7-EVIDENCE-SOURCE-GOVERNANCE-CERTIFICATION-001",
    outcome: outcome(derivedFailures),
    phase_ready: outcome(derivedFailures) === "PASS",
    evidence_index_operational: evidence_index.operational && evidence_index.deterministic,
    source_registry_governed: source_registry.registered && source_governance.trust_governance && source_governance.lifecycle_enforced,
    evidence_views_project_canonical: evidence_views.every((view) => view.projection_only && view.synchronized),
    provenance_complete: provenance_view.complete && provenance_view.deterministic,
    references_deterministic_validated: reference_catalog.references_validated && reference_catalog.broken_references_prevented && reference_catalog.lineage_preserved,
    source_governance_enforced: source_governance.unauthorized_sources_rejected,
    no_canonical_evidence_duplicated_or_stored: noBoundaryViolation,
    cci_ownership_boundary_verified: governance_integration.ownership_preserved && boundary.cci_canonical_owner,
    qualification_complete: qualification.qualification_report_id.length > 0 && qualification.validation_evidence_id.length > 0,
    failures: derivedFailures,
  });
  const base: Omit<ApplicationEvidenceSourceGovernanceResult, "replay_hash" | "integrity_hash"> = {
    phase_version: VERSION,
    phase_identifier: IDENTIFIER,
    application_registry_ref: "application-registry-catalog/v4.2",
    application_capability_map_ref: "application-capability-composition/v4.3",
    application_certification_ref: "application-lifecycle-certification/v4.5",
    application_interface_registry_ref: "application-integration-framework/v4.6",
    cci_evidence_services_ref: "Program 2 - CCI Evidence Services",
    cci_evidence_registry_ref: "Program 2 - CCI Evidence Registry",
    cci_evidence_lineage_ref: "Program 2 - CCI Evidence Lineage",
    cci_replay_evidence_ref: "Program 2 - CCI Replay Infrastructure",
    cci_integrity_services_ref: "Program 2 - CCI Integrity Services",
    boundary,
    evidence_index,
    reference_catalog,
    source_registry,
    source_governance,
    evidence_views,
    provenance_view,
    discovery,
    governance_integration,
    qualification,
    certification,
  };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function validateApplicationEvidenceSourceGovernance(result?: ApplicationEvidenceSourceGovernanceResult): ApplicationEvidenceValidation {
  if (!result) return nested({ valid: false, outcome: "FAIL" as const, replay_hash_valid: false, integrity_hash_valid: false, boundary_valid: false, index_valid: false, references_valid: false, source_registry_valid: false, source_governance_valid: false, views_valid: false, provenance_valid: false, discovery_valid: false, governance_valid: false, qualification_valid: false, certification_valid: false, failures: freezeArray(["CERTIFICATION_PRUNED" as const]) });
  const replay_hash_valid = resultReplayHash(result) === result.replay_hash;
  const integrity_hash_valid = resultIntegrityHash(result) === result.integrity_hash;
  const boundary_valid = verifyHashedRecord(result.boundary) && result.boundary.approved && result.boundary.cci_canonical_owner && result.boundary.p4_owns_indexes_only && !result.boundary.stores_canonical_evidence && !result.boundary.system_of_record;
  const index_valid = verifyHashedRecord(result.evidence_index) && result.evidence_index.operational && result.evidence_index.deterministic && !result.evidence_index.duplicates_evidence;
  const references_valid = verifyHashedRecord(result.reference_catalog) && result.reference_catalog.references_validated && result.reference_catalog.broken_references_prevented && result.reference_catalog.lineage_preserved;
  const source_registry_valid = verifyHashedRecord(result.source_registry) && result.source_registry.registered && result.source_registry.ownership.length > 0 && result.source_registry.approval_status === "APPROVED";
  const source_governance_valid = verifyHashedRecord(result.source_governance) && result.source_governance.trust_governance && result.source_governance.unauthorized_sources_rejected && result.source_governance.lifecycle_enforced;
  const views_valid = result.evidence_views.every((view) => verifyHashedRecord(view) && view.projection_only && view.synchronized);
  const provenance_valid = verifyHashedRecord(result.provenance_view) && result.provenance_view.complete && result.provenance_view.deterministic;
  const discovery_valid = verifyHashedRecord(result.discovery) && result.discovery.deterministic && result.discovery.search_validated && result.discovery.references_accurate;
  const governance_valid = verifyHashedRecord(result.governance_integration) && result.governance_integration.governance_synchronized && result.governance_integration.ownership_preserved && result.governance_integration.constitutional_compliance;
  const qualification_valid = verifyHashedRecord(result.qualification) && result.qualification.phase_ready && result.qualification.qualification_report_id.length > 0 && result.qualification.validation_evidence_id.length > 0;
  const certification_valid = verifyHashedRecord(result.certification) && result.certification.outcome === "PASS" && result.certification.phase_ready && result.certification.failures.length === 0;
  const valid = replay_hash_valid && integrity_hash_valid && boundary_valid && index_valid && references_valid && source_registry_valid && source_governance_valid && views_valid && provenance_valid && discovery_valid && governance_valid && qualification_valid && certification_valid;
  return nested({ valid, outcome: result.certification.outcome, replay_hash_valid, integrity_hash_valid, boundary_valid, index_valid, references_valid, source_registry_valid, source_governance_valid, views_valid, provenance_valid, discovery_valid, governance_valid, qualification_valid, certification_valid, failures: result.certification.failures });
}

export function replayApplicationEvidenceSourceGovernance(result = runApplicationEvidenceSourceGovernance()): boolean {
  const replayed = runApplicationEvidenceSourceGovernance();
  return result.replay_hash === replayed.replay_hash && result.integrity_hash === replayed.integrity_hash && validateApplicationEvidenceSourceGovernance(result).valid;
}

export function getApplicationEvidenceSourceGovernanceBundle(): ApplicationEvidenceBundle {
  const result = runApplicationEvidenceSourceGovernance();
  return Object.freeze({
    doctrine: Object.freeze({
      version: VERSION,
      owns_application_evidence_indexes: true,
      owns_application_evidence_references: true,
      owns_provenance_views: true,
      owns_source_governance: true,
      owns_canonical_evidence_storage: false,
      owns_immutable_evidence_records: false,
      owns_evidence_lineage: false,
      owns_replay_evidence: false,
      owns_forensic_records: false,
      owns_integrity_verification: false,
      becomes_evidence_system_of_record: false,
    }),
    result,
    validation: validateApplicationEvidenceSourceGovernance(result),
  });
}

export const ApplicationEvidenceSourceGovernanceService = Object.freeze({
  run: runApplicationEvidenceSourceGovernance,
  validate: validateApplicationEvidenceSourceGovernance,
  replay: replayApplicationEvidenceSourceGovernance,
});
