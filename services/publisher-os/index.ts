import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { runMissionControl, validateMissionControl } from "@/services/mission-control";
import { runPolicyBusinessGovernance, validatePolicyBusinessGovernance } from "@/services/policy-business-governance";
import type {
  PublisherBundle,
  PublisherFailure,
  PublisherInput,
  PublisherOsResult,
  PublisherOutcome,
  PublisherScenario,
  PublisherValidation,
} from "@/types/publisher-os";

const VERSION = "publisher-os/v4.14" as const;
const IDENTIFIER = "PublisherOS" as const;
const TIMESTAMP = "2026-07-18T00:00:00.000Z" as const;
let baselinePbg: ReturnType<typeof runPolicyBusinessGovernance> | undefined;
let baselineMissionControl: ReturnType<typeof runMissionControl> | undefined;

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
function has(failures: readonly PublisherFailure[], failure: PublisherFailure): boolean { return failures.includes(failure); }
function scenarioFailure(scenario: PublisherScenario): PublisherFailure | undefined { return scenario === "BASELINE" ? undefined : scenario; }
function getBaselinePbg() { baselinePbg ??= runPolicyBusinessGovernance(); return baselinePbg; }
function getBaselineMissionControl() { baselineMissionControl ??= runMissionControl(); return baselineMissionControl; }
function outcome(failures: readonly PublisherFailure[]): PublisherOutcome {
  if (has(failures, "CERTIFICATION_PRUNED")) return "PRUNED";
  return failures.length ? "FAIL" : "PASS";
}
function verifyHashedRecord(value: { integrity_hash: string }): boolean { return hashWithoutIntegrity(value) === value.integrity_hash; }
function resultReplayHash(result: Omit<PublisherOsResult, "replay_hash" | "integrity_hash">): string {
  return hash({
    foundation: result.foundation.integrity_hash,
    registry: result.registry.integrity_hash,
    authoring: result.authoring.integrity_hash,
    lifecycle: result.lifecycle.integrity_hash,
    governance: result.governance.integrity_hash,
    lineage: result.lineage.integrity_hash,
    evidence: result.evidence.integrity_hash,
    rendering: result.rendering.integrity_hash,
    distribution: result.distribution.integrity_hash,
    search: result.search.integrity_hash,
    observability: result.observability.integrity_hash,
    readiness: result.readiness.integrity_hash,
    certification: result.certification.integrity_hash,
  });
}
function resultIntegrityHash(result: Omit<PublisherOsResult, "integrity_hash">): string {
  return hash({ version: result.phase_version, identifier: result.phase_identifier, outcome: result.certification.outcome, replay_hash: result.replay_hash });
}

export function runPublisherOs(input: PublisherInput = {}): PublisherOsResult {
  const direct = scenarioFailure(input.scenario ?? "BASELINE");
  const scenarioFailures = freezeArray<PublisherFailure>(direct ? [direct] : []);
  const pbg = getBaselinePbg();
  const missionControl = getBaselineMissionControl();
  const dependencyFailures = freezeArray<PublisherFailure>([
    ...(!validatePolicyBusinessGovernance(pbg).valid || has(scenarioFailures, "P4_13_PBG_INVALID") ? ["P4_13_PBG_INVALID" as const] : []),
    ...(!validateMissionControl(missionControl).valid || has(scenarioFailures, "P4_11_MISSION_CONTROL_INVALID") ? ["P4_11_MISSION_CONTROL_INVALID" as const] : []),
    ...(has(scenarioFailures, "PROGRAM_2_CCI_SERVICES_INVALID") ? ["PROGRAM_2_CCI_SERVICES_INVALID" as const] : []),
    ...(has(scenarioFailures, "PROGRAM_3_CAF_GOVERNANCE_INVALID") ? ["PROGRAM_3_CAF_GOVERNANCE_INVALID" as const] : []),
  ]);
  const failures = freezeArray([...new Set([...scenarioFailures, ...dependencyFailures])]);
  const applicationId = input.application_id ?? "app:publisher-os";
  const tenantId = input.tenant_id ?? "tenant:qualified:primary";
  const foundation = nested({
    application_id: has(failures, "PUBLISHER_APPLICATION_MISSING") ? "" : applicationId,
    application_name: "Publisher OS" as const,
    tenant_id: tenantId,
    architecture_ref: has(failures, "PUBLISHER_ARCHITECTURE_MISSING") ? "" : "publisher:architecture:p4.14",
    publisher_contract_refs: has(failures, "PUBLISHER_CONTRACTS_MISSING") ? freezeArray<string>([]) : freezeArray(["publisher:contract:application", "publisher:contract:service"]),
    publication_model_ref: has(failures, "PUBLICATION_MODEL_MISSING") ? "" : "publisher:publication-model",
    service_contract_refs: freezeArray(["cci:registry", "cci:evidence", "cci:storage", "cci:search", "caf:governance-contracts"]),
    boundaries_verified: true,
  });
  const publication = nested({
    publication_id: has(failures, "PUBLICATION_REGISTRY_MISSING") ? "" : "publication:civitas-constitution-guide",
    publication_name: "Civitas Constitutional Publishing Guide",
    publication_type: "AUTHORITATIVE_DOCUMENT",
    tenant_id: tenantId,
    namespace: "civitas.publisher.authoritative",
    owner: "publisher-os",
    current_version: "1.0.0",
    lifecycle_status: "PUBLISHED" as const,
    governance_status: "GOVERNED" as const,
    publication_date: TIMESTAMP,
    superseded_by: "",
    evidence_refs: has(failures, "CANONICAL_EVIDENCE_REFS_MISSING") ? freezeArray<string>([]) : freezeArray(["cci:evidence:publisher:001", "cci:evidence:publisher:002"]),
    lineage_refs: has(failures, "VERSION_LINEAGE_INCOMPLETE") ? freezeArray<string>([]) : freezeArray(["lineage:publication:001"]),
  });
  const registry = nested({
    registry_id: has(failures, "PUBLICATION_REGISTRY_MISSING") ? "" : "P4.14-PUBLICATION-REGISTRY-001",
    catalog_id: has(failures, "PUBLICATION_CATALOG_MISSING") ? "" : "P4.14-PUBLICATION-CATALOG-001",
    publication,
    metadata_refs: freezeArray(["metadata:publication:title", "metadata:publication:owner"]),
    ownership_refs: freezeArray(["ownership:publisher-os"]),
    discovery_refs: has(failures, "PUBLICATION_DISCOVERY_MISSING") ? freezeArray<string>([]) : freezeArray(["discovery:publication:catalog"]),
    operational: !has(failures, "PUBLICATION_REGISTRY_MISSING") && !has(failures, "PUBLICATION_CATALOG_MISSING"),
  });
  const authoring = nested({
    authoring_engine_id: has(failures, "AUTHORING_ENGINE_MISSING") ? "" : "P4.14-AUTHORING-ENGINE-001",
    template_library_id: has(failures, "TEMPLATE_LIBRARY_MISSING") ? "" : "P4.14-TEMPLATE-LIBRARY-001",
    structured_authoring_refs: freezeArray(["authoring:structured"]),
    composition_refs: freezeArray(["composition:document"]),
    collaborative_editing_refs: has(failures, "COLLABORATIVE_AUTHORING_MISSING") ? freezeArray<string>([]) : freezeArray(["collab:editing:session"]),
    reusable_content_block_refs: freezeArray(["content-block:constitutional-notice", "content-block:evidence-citation"]),
    governed_content_creation: true,
  });
  const approval = nested({
    approval_id: has(failures, "PUBLICATION_APPROVAL_MISSING") ? "" : "P4.14-PUBLICATION-APPROVAL-001",
    publication_id: publication.publication_id,
    authority_level: "caf-authority-reviewed",
    reviewer: "reviewer:governance",
    decision: "APPROVED" as const,
    approval_timestamp: TIMESTAMP,
    governance_refs: freezeArray(["caf:authority-gate", "caf:policy-gate", "caf:safety-gate"]),
  });
  const lifecycle = nested({
    lifecycle_engine_id: "P4.14-PUBLICATION-LIFECYCLE-001",
    statuses: freezeArray(["DRAFT", "UNDER_REVIEW", "APPROVED", "PUBLISHED", "SUPERSEDED", "ARCHIVED"] as const),
    current_status: "PUBLISHED" as const,
    deterministic: !has(failures, "PUBLICATION_LIFECYCLE_NON_DETERMINISTIC"),
    approval,
  });
  const governance = nested({
    governance_engine_id: has(failures, "PUBLICATION_GOVERNANCE_INVALID") ? "" : "P4.14-PUBLICATION-GOVERNANCE-001",
    authority_gate_ref: has(failures, "CAF_GATES_NOT_BOUND") ? "" : "caf:authority-gate",
    policy_gate_ref: has(failures, "CAF_GATES_NOT_BOUND") ? "" : "caf:policy-gate",
    safety_gate_ref: has(failures, "CAF_GATES_NOT_BOUND") ? "" : "caf:safety-gate",
    constitutional_validation_ref: "publisher:constitutional-validation",
    release_governance_ref: "publisher:release-governance",
    permissions_ref: "publisher:publication-permissions",
    integrated: !has(failures, "PUBLICATION_GOVERNANCE_INVALID") && !has(failures, "CAF_GATES_NOT_BOUND"),
    enforcement_owned: has(failures, "AUTHORITY_ENFORCEMENT_ATTEMPTED") || has(failures, "POLICY_ENFORCEMENT_ATTEMPTED") || has(failures, "SAFETY_ENFORCEMENT_ATTEMPTED"),
  });
  const version = nested({
    version_id: "publication-version:1.0.0",
    publication_id: publication.publication_id,
    semantic_version: "1.0.0",
    author: "publisher-os",
    change_summary: "Initial governed publication.",
    evidence_refs: publication.evidence_refs,
    approval_refs: approval.approval_id ? freezeArray([approval.approval_id]) : freezeArray<string>([]),
    publication_timestamp: TIMESTAMP,
    rendered_artifacts: has(failures, "RENDERED_ARTIFACTS_MISSING") ? freezeArray<string>([]) : freezeArray(["artifact:html", "artifact:markdown", "artifact:pdf", "artifact:json", "artifact:xml"]),
  });
  const lineage = nested({
    lineage_id: has(failures, "VERSION_LINEAGE_INCOMPLETE") ? "" : "P4.14-PUBLICATION-LINEAGE-001",
    version,
    revision_history_refs: has(failures, "REVISION_HISTORY_MISSING") ? freezeArray<string>([]) : freezeArray(["revision:initial", "revision:reviewed"]),
    supersession_refs: freezeArray(["supersession:none"]),
    lineage_graph_refs: has(failures, "VERSION_LINEAGE_INCOMPLETE") ? freezeArray<string>([]) : freezeArray(["lineage-graph:publication"]),
    dependency_refs: freezeArray(["dependency:evidence", "dependency:template", "dependency:governance"]),
    deterministic: !has(failures, "VERSION_LINEAGE_INCOMPLETE"),
  });
  const evidence = nested({
    evidence_index_id: has(failures, "EVIDENCE_BINDING_MISSING") ? "" : "P4.14-PUBLICATION-EVIDENCE-INDEX-001",
    evidence_refs: publication.evidence_refs,
    citation_refs: freezeArray(["citation:evidence:001", "citation:evidence:002"]),
    provenance_refs: has(failures, "PROVENANCE_TRACEABILITY_INCOMPLETE") ? freezeArray<string>([]) : freezeArray(["provenance:source:001"]),
    traceability_refs: has(failures, "PROVENANCE_TRACEABILITY_INCOMPLETE") ? freezeArray<string>([]) : freezeArray(["trace:publication:evidence"]),
    references_canonical_cci_evidence: !has(failures, "CANONICAL_EVIDENCE_REFS_MISSING"),
    owns_evidence: has(failures, "EVIDENCE_STORAGE_ATTEMPTED"),
  });
  const rendering = nested({
    rendering_engine_id: has(failures, "RENDERING_ENGINE_MISSING") ? "" : "P4.14-RENDERING-ENGINE-001",
    formats: freezeArray(["HTML", "Markdown", "PDF", "JSON", "XML"] as const),
    rendered_artifacts: version.rendered_artifacts,
    version_rendering_supported: true,
    reproducible_builds: !has(failures, "RENDERING_NON_DETERMINISTIC"),
    deterministic_output: !has(failures, "RENDERING_NON_DETERMINISTIC"),
  });
  const distribution = nested({
    distribution_service_id: has(failures, "DISTRIBUTION_SERVICE_MISSING") ? "" : "P4.14-DISTRIBUTION-SERVICE-001",
    package_refs: freezeArray(["package:publication:1.0.0"]),
    release_channel_refs: has(failures, "RELEASE_CHANNELS_MISSING") ? freezeArray<string>([]) : freezeArray(["channel:public", "channel:tenant"]),
    publication_feed_refs: freezeArray(["feed:publisher-os"]),
    tenant_delivery_refs: has(failures, "TENANT_DELIVERY_MISSING") ? freezeArray<string>([]) : freezeArray(["tenant-delivery:qualified"]),
    secure_download_refs: freezeArray(["download:secure:publication"]),
    operational: !has(failures, "DISTRIBUTION_SERVICE_MISSING"),
  });
  const search = nested({
    search_service_id: has(failures, "SEARCH_SERVICES_MISSING") ? "" : "P4.14-SEARCH-SERVICES-001",
    full_text_search_ref: "search:full-text",
    metadata_search_ref: "search:metadata",
    evidence_search_ref: "search:evidence",
    relationship_refs: freezeArray(["relationship:supersedes", "relationship:evidence"]),
    taxonomy_navigation_ref: "search:taxonomy",
    consumes_cci_search: !has(failures, "CCI_SEARCH_NOT_CONSUMED"),
    functional: !has(failures, "SEARCH_SERVICES_MISSING"),
  });
  const observability = nested({
    dashboard_id: has(failures, "OBSERVABILITY_DASHBOARD_MISSING") ? "" : "P4.14-PUBLISHER-DASHBOARD-001",
    diagnostics_id: has(failures, "OPERATIONAL_DIAGNOSTICS_MISSING") ? "" : "P4.14-PUBLISHER-DIAGNOSTICS-001",
    lifecycle_monitoring_refs: freezeArray(["monitor:lifecycle"]),
    approval_latency_refs: freezeArray(["metric:approval-latency"]),
    rendering_health_refs: freezeArray(["health:rendering"]),
    governance_failure_refs: freezeArray(["monitor:governance-failures"]),
    distribution_health_refs: freezeArray(["health:distribution"]),
    visible: !has(failures, "OBSERVABILITY_DASHBOARD_MISSING"),
  });
  const readiness = nested({
    readiness_report_id: has(failures, "READINESS_REPORT_MISSING") ? "" : "P4.14-PUBLISHER-READINESS-REPORT-001",
    constitutional_compliance: !has(failures, "CONSTITUTIONAL_COMPLIANCE_INVALID"),
    governance_compliance: governance.integrated && !governance.enforcement_owned,
    publication_reproducibility: rendering.reproducible_builds,
    deterministic_rendering: rendering.deterministic_output,
    evidence_completeness: evidence.evidence_refs.length > 0 && evidence.references_canonical_cci_evidence,
    lineage_integrity: lineage.deterministic && lineage.lineage_graph_refs.length > 0 && !has(failures, "LINEAGE_INTEGRITY_INVALID"),
    replay_compatibility: !has(failures, "REPLAY_COMPATIBILITY_INVALID"),
    ecosystem_publication_ready: true,
  });
  const noOutOfScope = !has(failures, "CONSTITUTIONAL_GOVERNANCE_OWNERSHIP_ATTEMPTED") && !has(failures, "EVIDENCE_STORAGE_ATTEMPTED") && !has(failures, "REPLAY_INFRASTRUCTURE_ATTEMPTED") && !has(failures, "IDENTITY_INFRASTRUCTURE_ATTEMPTED") && !has(failures, "TENANT_MANAGEMENT_ATTEMPTED") && !has(failures, "AUTHORITY_ENFORCEMENT_ATTEMPTED") && !has(failures, "POLICY_ENFORCEMENT_ATTEMPTED") && !has(failures, "SAFETY_ENFORCEMENT_ATTEMPTED");
  const derivedFailures = freezeArray([...new Set([
    ...failures,
    ...(foundation.application_id.length === 0 ? ["PUBLISHER_APPLICATION_MISSING" as const] : []),
    ...(foundation.architecture_ref.length === 0 ? ["PUBLISHER_ARCHITECTURE_MISSING" as const] : []),
    ...(foundation.publisher_contract_refs.length === 0 ? ["PUBLISHER_CONTRACTS_MISSING" as const] : []),
    ...(foundation.publication_model_ref.length === 0 ? ["PUBLICATION_MODEL_MISSING" as const] : []),
    ...(registry.registry_id.length === 0 ? ["PUBLICATION_REGISTRY_MISSING" as const] : []),
    ...(registry.catalog_id.length === 0 ? ["PUBLICATION_CATALOG_MISSING" as const] : []),
    ...(registry.discovery_refs.length === 0 ? ["PUBLICATION_DISCOVERY_MISSING" as const] : []),
    ...(authoring.authoring_engine_id.length === 0 ? ["AUTHORING_ENGINE_MISSING" as const] : []),
    ...(authoring.template_library_id.length === 0 ? ["TEMPLATE_LIBRARY_MISSING" as const] : []),
    ...(authoring.collaborative_editing_refs.length === 0 ? ["COLLABORATIVE_AUTHORING_MISSING" as const] : []),
    ...(!lifecycle.deterministic ? ["PUBLICATION_LIFECYCLE_NON_DETERMINISTIC" as const] : []),
    ...(approval.approval_id.length === 0 ? ["PUBLICATION_APPROVAL_MISSING" as const] : []),
    ...(!governance.integrated ? ["PUBLICATION_GOVERNANCE_INVALID" as const] : []),
    ...(governance.authority_gate_ref.length === 0 || governance.policy_gate_ref.length === 0 || governance.safety_gate_ref.length === 0 ? ["CAF_GATES_NOT_BOUND" as const] : []),
    ...(lineage.lineage_id.length === 0 || lineage.lineage_graph_refs.length === 0 ? ["VERSION_LINEAGE_INCOMPLETE" as const] : []),
    ...(lineage.revision_history_refs.length === 0 ? ["REVISION_HISTORY_MISSING" as const] : []),
    ...(evidence.evidence_index_id.length === 0 ? ["EVIDENCE_BINDING_MISSING" as const] : []),
    ...(evidence.evidence_refs.length === 0 ? ["CANONICAL_EVIDENCE_REFS_MISSING" as const] : []),
    ...(evidence.provenance_refs.length === 0 || evidence.traceability_refs.length === 0 ? ["PROVENANCE_TRACEABILITY_INCOMPLETE" as const] : []),
    ...(rendering.rendering_engine_id.length === 0 ? ["RENDERING_ENGINE_MISSING" as const] : []),
    ...(!rendering.deterministic_output ? ["RENDERING_NON_DETERMINISTIC" as const] : []),
    ...(rendering.rendered_artifacts.length === 0 ? ["RENDERED_ARTIFACTS_MISSING" as const] : []),
    ...(distribution.distribution_service_id.length === 0 ? ["DISTRIBUTION_SERVICE_MISSING" as const] : []),
    ...(distribution.release_channel_refs.length === 0 ? ["RELEASE_CHANNELS_MISSING" as const] : []),
    ...(distribution.tenant_delivery_refs.length === 0 ? ["TENANT_DELIVERY_MISSING" as const] : []),
    ...(search.search_service_id.length === 0 ? ["SEARCH_SERVICES_MISSING" as const] : []),
    ...(!search.consumes_cci_search ? ["CCI_SEARCH_NOT_CONSUMED" as const] : []),
    ...(observability.dashboard_id.length === 0 ? ["OBSERVABILITY_DASHBOARD_MISSING" as const] : []),
    ...(observability.diagnostics_id.length === 0 ? ["OPERATIONAL_DIAGNOSTICS_MISSING" as const] : []),
    ...(readiness.readiness_report_id.length === 0 ? ["READINESS_REPORT_MISSING" as const] : []),
    ...(!readiness.constitutional_compliance ? ["CONSTITUTIONAL_COMPLIANCE_INVALID" as const] : []),
    ...(!readiness.lineage_integrity ? ["LINEAGE_INTEGRITY_INVALID" as const] : []),
    ...(!readiness.replay_compatibility ? ["REPLAY_COMPATIBILITY_INVALID" as const] : []),
    ...(!noOutOfScope ? ["CONSTITUTIONAL_GOVERNANCE_OWNERSHIP_ATTEMPTED" as const] : []),
  ])]);
  const certification = nested({
    certification_id: "P4.14-PUBLISHER-OS-CERTIFICATION-001",
    outcome: outcome(derivedFailures),
    phase_ready: outcome(derivedFailures) === "PASS",
    architecture_implemented: foundation.application_id.length > 0 && foundation.architecture_ref.length > 0 && foundation.publisher_contract_refs.length > 0,
    registry_operational: registry.operational,
    authoring_operational: authoring.authoring_engine_id.length > 0 && authoring.template_library_id.length > 0 && authoring.collaborative_editing_refs.length > 0,
    lifecycle_managed: lifecycle.deterministic && approval.approval_id.length > 0,
    governance_integrated: governance.integrated && !governance.enforcement_owned,
    lineage_deterministic: lineage.deterministic && lineage.lineage_graph_refs.length > 0,
    evidence_canonical: evidence.references_canonical_cci_evidence && !evidence.owns_evidence,
    rendering_reproducible: rendering.reproducible_builds && rendering.deterministic_output && rendering.rendered_artifacts.length === 5,
    distribution_operational: distribution.operational && distribution.release_channel_refs.length > 0 && distribution.tenant_delivery_refs.length > 0,
    search_functional: search.functional && search.consumes_cci_search,
    observability_visible: observability.visible && observability.diagnostics_id.length > 0,
    readiness_confirmed: readiness.readiness_report_id.length > 0 && readiness.constitutional_compliance && readiness.governance_compliance && readiness.lineage_integrity && readiness.replay_compatibility,
    no_out_of_scope_ownership: noOutOfScope,
    failures: derivedFailures,
  });
  const base: Omit<PublisherOsResult, "replay_hash" | "integrity_hash"> = {
    phase_version: VERSION,
    phase_identifier: IDENTIFIER,
    pbg_ref: "policy-business-governance/v4.13",
    mission_control_ref: "mission-control/v4.11",
    foundation,
    registry,
    authoring,
    lifecycle,
    governance,
    lineage,
    evidence,
    rendering,
    distribution,
    search,
    observability,
    readiness,
    certification,
  };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function validatePublisherOs(result?: PublisherOsResult): PublisherValidation {
  if (!result) return nested({ valid: false, outcome: "FAIL" as const, replay_hash_valid: false, integrity_hash_valid: false, foundation_valid: false, registry_valid: false, authoring_valid: false, lifecycle_valid: false, governance_valid: false, lineage_valid: false, evidence_valid: false, rendering_valid: false, distribution_valid: false, search_valid: false, observability_valid: false, readiness_valid: false, certification_valid: false, failures: freezeArray(["CERTIFICATION_PRUNED" as const]) });
  const replay_hash_valid = resultReplayHash(result) === result.replay_hash;
  const integrity_hash_valid = resultIntegrityHash(result) === result.integrity_hash;
  const foundation_valid = verifyHashedRecord(result.foundation) && result.foundation.application_id.length > 0 && result.foundation.architecture_ref.length > 0 && result.foundation.publisher_contract_refs.length > 0 && result.foundation.publication_model_ref.length > 0;
  const registry_valid = verifyHashedRecord(result.registry) && verifyHashedRecord(result.registry.publication) && result.registry.operational && result.registry.discovery_refs.length > 0;
  const authoring_valid = verifyHashedRecord(result.authoring) && result.authoring.authoring_engine_id.length > 0 && result.authoring.template_library_id.length > 0 && result.authoring.collaborative_editing_refs.length > 0;
  const lifecycle_valid = verifyHashedRecord(result.lifecycle) && verifyHashedRecord(result.lifecycle.approval) && result.lifecycle.deterministic && result.lifecycle.approval.approval_id.length > 0;
  const governance_valid = verifyHashedRecord(result.governance) && result.governance.integrated && !result.governance.enforcement_owned;
  const lineage_valid = verifyHashedRecord(result.lineage) && verifyHashedRecord(result.lineage.version) && result.lineage.deterministic && result.lineage.lineage_graph_refs.length > 0 && result.lineage.revision_history_refs.length > 0;
  const evidence_valid = verifyHashedRecord(result.evidence) && result.evidence.evidence_index_id.length > 0 && result.evidence.references_canonical_cci_evidence && !result.evidence.owns_evidence && result.evidence.traceability_refs.length > 0;
  const rendering_valid = verifyHashedRecord(result.rendering) && result.rendering.rendering_engine_id.length > 0 && result.rendering.deterministic_output && result.rendering.reproducible_builds && result.rendering.rendered_artifacts.length === 5;
  const distribution_valid = verifyHashedRecord(result.distribution) && result.distribution.operational && result.distribution.release_channel_refs.length > 0 && result.distribution.tenant_delivery_refs.length > 0;
  const search_valid = verifyHashedRecord(result.search) && result.search.functional && result.search.consumes_cci_search;
  const observability_valid = verifyHashedRecord(result.observability) && result.observability.visible && result.observability.diagnostics_id.length > 0;
  const readiness_valid = verifyHashedRecord(result.readiness) && result.readiness.readiness_report_id.length > 0 && result.readiness.constitutional_compliance && result.readiness.governance_compliance && result.readiness.lineage_integrity && result.readiness.replay_compatibility;
  const certification_valid = verifyHashedRecord(result.certification) && result.certification.outcome === "PASS" && result.certification.phase_ready && result.certification.failures.length === 0;
  const valid = replay_hash_valid && integrity_hash_valid && foundation_valid && registry_valid && authoring_valid && lifecycle_valid && governance_valid && lineage_valid && evidence_valid && rendering_valid && distribution_valid && search_valid && observability_valid && readiness_valid && certification_valid;
  return nested({ valid, outcome: result.certification.outcome, replay_hash_valid, integrity_hash_valid, foundation_valid, registry_valid, authoring_valid, lifecycle_valid, governance_valid, lineage_valid, evidence_valid, rendering_valid, distribution_valid, search_valid, observability_valid, readiness_valid, certification_valid, failures: result.certification.failures });
}

export function replayPublisherOs(result = runPublisherOs()): boolean {
  const replayed = runPublisherOs();
  return result.replay_hash === replayed.replay_hash && result.integrity_hash === replayed.integrity_hash && validatePublisherOs(result).valid;
}

export function getPublisherOsBundle(): PublisherBundle {
  const result = runPublisherOs();
  return Object.freeze({
    doctrine: Object.freeze({
      version: VERSION,
      owns_publication_management: true,
      owns_document_lifecycle: true,
      owns_publication_workflows: true,
      owns_publication_rendering: true,
      owns_publication_distribution: true,
      owns_publication_templates: true,
      owns_constitutional_governance: false,
      owns_evidence_storage: false,
      owns_replay_infrastructure: false,
      owns_identity_infrastructure: false,
      owns_tenant_management: false,
      owns_authority_enforcement: false,
      owns_policy_enforcement: false,
      owns_safety_enforcement: false,
    }),
    result,
    validation: validatePublisherOs(result),
  });
}

export const PublisherOsService = Object.freeze({ run: runPublisherOs, validate: validatePublisherOs, replay: replayPublisherOs });
