import { runApplicationConstitutionalFoundation, validateApplicationConstitutionalFoundation } from "@/services/application-constitutional-foundation";
import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import type {
  ApplicationRegistryBundle,
  ApplicationRegistryCatalogResult,
  ApplicationRegistryFailure,
  ApplicationRegistryInput,
  ApplicationRegistryOutcome,
  ApplicationRegistryScenario,
  ApplicationRegistryValidation,
} from "@/types/application-registry-catalog";

const VERSION = "application-registry-catalog/v4.2" as const;
const IDENTIFIER = "ApplicationRegistryCatalog" as const;
const APPLICATION_ID = "civitas.app.ops.command-console" as const;
let baselineFoundation: ReturnType<typeof runApplicationConstitutionalFoundation> | undefined;

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
function has(failures: readonly ApplicationRegistryFailure[], failure: ApplicationRegistryFailure): boolean { return failures.includes(failure); }
function scenarioFailure(scenario: ApplicationRegistryScenario): ApplicationRegistryFailure | undefined { return scenario === "BASELINE" ? undefined : scenario; }
function outcome(failures: readonly ApplicationRegistryFailure[]): ApplicationRegistryOutcome {
  if (has(failures, "CERTIFICATION_PRUNED")) return "PRUNED";
  return failures.length ? "FAIL" : "PASS";
}
function verifyHashedRecord(value: { integrity_hash: string }): boolean { return hashWithoutIntegrity(value) === value.integrity_hash; }
function getBaselineFoundation() { baselineFoundation ??= runApplicationConstitutionalFoundation(); return baselineFoundation; }

function resultReplayHash(result: Omit<ApplicationRegistryCatalogResult, "replay_hash" | "integrity_hash">): string {
  return hash({
    registry: result.registry.integrity_hash,
    metadata: result.metadata_repository.integrity_hash,
    discovery: result.discovery_index.integrity_hash,
    catalog: result.catalog.integrity_hash,
    lineage: result.lineage.integrity_hash,
    governance: result.governance.integrity_hash,
    audit: result.audit_evidence.integrity_hash,
    certification: result.certification.integrity_hash,
  });
}
function resultIntegrityHash(result: Omit<ApplicationRegistryCatalogResult, "integrity_hash">): string {
  return hash({ version: result.phase_version, identifier: result.phase_identifier, outcome: result.certification.outcome, replay_hash: result.replay_hash });
}

export function runApplicationRegistryCatalog(input: ApplicationRegistryInput = {}): ApplicationRegistryCatalogResult {
  const direct = scenarioFailure(input.scenario ?? "BASELINE");
  const scenarioFailures = freezeArray<ApplicationRegistryFailure>(direct ? [direct] : []);
  const p41 = getBaselineFoundation();
  const dependencyFailures = freezeArray<ApplicationRegistryFailure>([
    ...(!validateApplicationConstitutionalFoundation(p41).valid || has(scenarioFailures, "P4_1_FOUNDATION_INVALID") ? ["P4_1_FOUNDATION_INVALID" as const] : []),
    ...(has(scenarioFailures, "CCI_REGISTRY_SERVICES_UNAVAILABLE") ? ["CCI_REGISTRY_SERVICES_UNAVAILABLE" as const] : []),
    ...(has(scenarioFailures, "CCI_IDENTITY_SERVICES_UNAVAILABLE") ? ["CCI_IDENTITY_SERVICES_UNAVAILABLE" as const] : []),
    ...(has(scenarioFailures, "CCI_STORAGE_SERVICES_UNAVAILABLE") ? ["CCI_STORAGE_SERVICES_UNAVAILABLE" as const] : []),
    ...(has(scenarioFailures, "CCI_EVIDENCE_SERVICES_UNAVAILABLE") ? ["CCI_EVIDENCE_SERVICES_UNAVAILABLE" as const] : []),
    ...(has(scenarioFailures, "CCI_AUDIT_SERVICES_UNAVAILABLE") ? ["CCI_AUDIT_SERVICES_UNAVAILABLE" as const] : []),
  ]);
  const failures = freezeArray([...new Set([...scenarioFailures, ...dependencyFailures])]);
  const registered = !has(failures, "APPLICATION_NOT_REGISTERED_BEFORE_PUBLICATION");
  const record = nested({
    application_id: has(failures, "APPLICATION_IDENTITY_MUTATED") ? "civitas.app.ops.command-console-renamed" : APPLICATION_ID,
    canonical_name: "command-console",
    display_name: "AI Command Console",
    aliases: has(failures, "HISTORICAL_ALIAS_UNRESOLVABLE") ? freezeArray([]) : freezeArray(["command-center", "operator-console"]),
    constitutional_owner_ref: has(failures, "OWNERSHIP_REFERENCE_UNRESOLVED") ? "" : p41.ownership_registry.registry_id,
    taxonomy_classification: "OPERATIONAL_APPLICATION" as const,
    namespace: "civitas.app.ops",
    lifecycle_state: "ACTIVE" as const,
    version: "1.0.0",
    dependency_refs: freezeArray(["application-constitutional-foundation/v4.1", "Program 2 - CCI Registry Services"]),
    constitutional_refs: freezeArray([p41.doctrine.doctrine_id, p41.boundary_model.boundary_model_id, p41.taxonomy.taxonomy_id]),
    metadata_refs: freezeArray(["metadata:p4.2:command-console"]),
    audit_refs: has(failures, "AUDIT_EVIDENCE_MISSING") ? freezeArray([]) : freezeArray(["audit:p4.2:registration", "audit:p4.2:catalog-publication"]),
    immutable_identity: !has(failures, "APPLICATION_IDENTITY_MUTATED"),
    registered,
  });
  const duplicateRecord = has(failures, "DUPLICATE_REGISTRATION_ALLOWED") ? [record] : [];
  const registry = nested({
    registry_id: "P4.2-APPLICATION-REGISTRY-001",
    authoritative: true,
    initialized: !has(failures, "CCI_REGISTRY_SERVICES_UNAVAILABLE"),
    cci_registry_ref: "Program 2 - CCI Registry Services",
    cci_identity_ref: "Program 2 - CCI Identity Services",
    records: freezeArray([record, ...duplicateRecord]),
    duplicate_prevention: !has(failures, "DUPLICATE_REGISTRATION_ALLOWED"),
    identity_validation: !has(failures, "CCI_IDENTITY_SERVICES_UNAVAILABLE") && record.immutable_identity,
    governance_enabled: !has(failures, "CATALOG_PUBLICATION_UNGOVERNED"),
  });
  const metadata_repository = nested({
    repository_id: "P4.2-METADATA-REPOSITORY-001",
    schema_ref: "p4.2:application-metadata-schema",
    metadata_validated: !has(failures, "METADATA_UNVALIDATED"),
    ownership_metadata_resolved: record.constitutional_owner_ref.length > 0,
    classification_validated: p41.taxonomy.categories.includes(record.taxonomy_classification),
    constitutional_attributes_validated: record.constitutional_refs.length === 3,
    unauthorized_changes_blocked: !has(failures, "UNAUTHORIZED_METADATA_CHANGE_ALLOWED"),
  });
  const ids = has(failures, "DISCOVERY_DUPLICATES_RETURNED") ? freezeArray([record.application_id, record.application_id]) : freezeArray([record.application_id]);
  const discovery_index = nested({
    discovery_id: "P4.2-DISCOVERY-INDEX-001",
    views: freezeArray(["application_family", "taxonomy", "owner", "namespace", "lifecycle", "dependency", "constitutional_status", "version", "ecosystem", "domain"]),
    indexed_application_ids: has(failures, "DISCOVERY_NON_DETERMINISTIC") ? freezeArray([...ids].reverse()) : ids,
    deterministic_ordering: !has(failures, "DISCOVERY_NON_DETERMINISTIC"),
    duplicate_free: !has(failures, "DISCOVERY_DUPLICATES_RETURNED"),
    dependency_discovery_enabled: true,
    ownership_lookup_enabled: true,
  });
  const catalog = nested({
    catalog_id: "P4.2-ECOSYSTEM-APPLICATION-CATALOG-001",
    published: registered && !has(failures, "APPLICATION_NOT_REGISTERED_BEFORE_PUBLICATION"),
    publication_approved: !has(failures, "CATALOG_PUBLICATION_UNGOVERNED"),
    taxonomy_organized: true,
    ownership_visible: record.constitutional_owner_ref.length > 0,
    dependency_visible: true,
    constitutional_status_visible: true,
    application_ids: registered ? freezeArray([record.application_id]) : freezeArray([]),
  });
  const lineage = nested({
    lineage_id: "P4.2-LINEAGE-001",
    application_id: record.application_id,
    previous_version: "0.9.0",
    current_version: record.version,
    ownership_lineage: record.constitutional_owner_ref ? freezeArray([record.constitutional_owner_ref]) : freezeArray([]),
    namespace_lineage: freezeArray([record.namespace]),
    metadata_changes: freezeArray(["registered canonical metadata", "published catalog metadata"]),
    dependency_changes: freezeArray(["added p4.1 foundation dependency"]),
    constitutional_refs: record.constitutional_refs,
    audit_refs: record.audit_refs,
    timestamps: freezeArray(["2026-07-17T02:30:00.000Z", "2026-07-17T02:40:00.000Z"]),
    append_only: !has(failures, "LINEAGE_NOT_APPEND_ONLY"),
    complete: !has(failures, "LINEAGE_INCOMPLETE"),
    immutable: !has(failures, "LINEAGE_NOT_APPEND_ONLY"),
  });
  const governance = nested({
    governance_id: "P4.2-CATALOG-GOVERNANCE-001",
    publication_requires_registration: !has(failures, "APPLICATION_NOT_REGISTERED_BEFORE_PUBLICATION"),
    publication_requires_validated_metadata: !has(failures, "METADATA_UNVALIDATED"),
    identity_immutable: record.immutable_identity,
    aliases_permanently_resolvable: record.aliases.length > 0,
    ownership_refs_resolve_to_p4_1: record.constitutional_owner_ref === p41.ownership_registry.registry_id,
    duplicate_registrations_rejected: !has(failures, "DUPLICATE_REGISTRATION_ALLOWED"),
    invalid_registrations_rejected: !has(failures, "INVALID_REGISTRATION_ACCEPTED"),
    catalog_consistent: !has(failures, "CATALOG_PUBLICATION_UNGOVERNED"),
  });
  const audit_evidence = nested({
    evidence_id: "P4.2-REGISTRY-AUDIT-EVIDENCE-001",
    registry_operation_refs: has(failures, "AUDIT_EVIDENCE_MISSING") ? freezeArray([]) : freezeArray(["registry:init", "registry:register"]),
    metadata_operation_refs: has(failures, "AUDIT_EVIDENCE_MISSING") ? freezeArray([]) : freezeArray(["metadata:validate", "metadata:publish"]),
    lineage_refs: has(failures, "AUDIT_EVIDENCE_MISSING") ? freezeArray([]) : freezeArray([lineage.lineage_id]),
    catalog_publication_refs: has(failures, "AUDIT_EVIDENCE_MISSING") ? freezeArray([]) : freezeArray([catalog.catalog_id]),
    audit_refs: has(failures, "AUDIT_EVIDENCE_MISSING") ? freezeArray([]) : record.audit_refs,
    immutable: !has(failures, "AUDIT_EVIDENCE_MUTABLE"),
    complete: !has(failures, "AUDIT_EVIDENCE_MISSING"),
  });
  const noRuntimeAuthority = !has(failures, "DEPLOYMENT_ATTEMPTED") && !has(failures, "RUNTIME_EXECUTION_ATTEMPTED") && !has(failures, "PLATFORM_CERTIFICATION_ATTEMPTED") && !has(failures, "RUNTIME_GOVERNANCE_ATTEMPTED");
  const derivedFailures = freezeArray([...new Set([
    ...failures,
    ...(!registry.initialized ? ["CCI_REGISTRY_SERVICES_UNAVAILABLE" as const] : []),
    ...(!registry.identity_validation ? ["CCI_IDENTITY_SERVICES_UNAVAILABLE" as const] : []),
    ...(!catalog.published ? ["APPLICATION_NOT_REGISTERED_BEFORE_PUBLICATION" as const] : []),
    ...(!record.immutable_identity ? ["APPLICATION_IDENTITY_MUTATED" as const] : []),
    ...(record.aliases.length === 0 ? ["HISTORICAL_ALIAS_UNRESOLVABLE" as const] : []),
    ...(!metadata_repository.metadata_validated ? ["METADATA_UNVALIDATED" as const] : []),
    ...(!metadata_repository.unauthorized_changes_blocked ? ["UNAUTHORIZED_METADATA_CHANGE_ALLOWED" as const] : []),
    ...(!lineage.append_only ? ["LINEAGE_NOT_APPEND_ONLY" as const] : []),
    ...(!lineage.complete ? ["LINEAGE_INCOMPLETE" as const] : []),
    ...(!governance.ownership_refs_resolve_to_p4_1 ? ["OWNERSHIP_REFERENCE_UNRESOLVED" as const] : []),
    ...(!discovery_index.duplicate_free ? ["DISCOVERY_DUPLICATES_RETURNED" as const] : []),
    ...(!discovery_index.deterministic_ordering ? ["DISCOVERY_NON_DETERMINISTIC" as const] : []),
    ...(!governance.invalid_registrations_rejected ? ["INVALID_REGISTRATION_ACCEPTED" as const] : []),
    ...(!audit_evidence.complete ? ["AUDIT_EVIDENCE_MISSING" as const] : []),
    ...(!audit_evidence.immutable ? ["AUDIT_EVIDENCE_MUTABLE" as const] : []),
    ...(!registry.duplicate_prevention ? ["DUPLICATE_REGISTRATION_ALLOWED" as const] : []),
    ...(!governance.catalog_consistent ? ["CATALOG_PUBLICATION_UNGOVERNED" as const] : []),
    ...(!noRuntimeAuthority ? ["RUNTIME_GOVERNANCE_ATTEMPTED" as const] : []),
  ])]);
  const certification = nested({
    certification_id: "P4.2-REGISTRY-CATALOG-CERTIFICATION-001",
    outcome: outcome(derivedFailures),
    phase_ready: outcome(derivedFailures) === "PASS",
    registry_operational: registry.initialized && registry.authoritative,
    immutable_identities_enforced: record.immutable_identity && governance.identity_immutable,
    catalog_published: catalog.published && catalog.publication_approved,
    discovery_deterministic: discovery_index.deterministic_ordering && discovery_index.duplicate_free,
    metadata_governed: metadata_repository.metadata_validated && metadata_repository.unauthorized_changes_blocked,
    ownership_refs_resolved: governance.ownership_refs_resolve_to_p4_1,
    lineage_complete: lineage.complete && lineage.immutable && lineage.append_only,
    duplicate_registrations_prevented: registry.duplicate_prevention,
    audit_evidence_complete: audit_evidence.complete && audit_evidence.immutable,
    constitutional_validation_required: true,
    no_runtime_or_certification_authority: noRuntimeAuthority,
    failures: derivedFailures,
  });
  const base: Omit<ApplicationRegistryCatalogResult, "replay_hash" | "integrity_hash"> = {
    phase_version: VERSION,
    phase_identifier: IDENTIFIER,
    application_foundation_ref: "application-constitutional-foundation/v4.1",
    cci_registry_services_ref: "Program 2 - CCI Registry Services",
    cci_identity_services_ref: "Program 2 - CCI Identity Services",
    cci_storage_services_ref: "Program 2 - CCI Storage Services",
    cci_evidence_services_ref: "Program 2 - CCI Evidence Services",
    cci_audit_services_ref: "Program 2 - CCI Audit Services",
    registry,
    metadata_repository,
    discovery_index,
    catalog,
    lineage,
    governance,
    audit_evidence,
    certification,
  };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function validateApplicationRegistryCatalog(result?: ApplicationRegistryCatalogResult): ApplicationRegistryValidation {
  if (!result) return nested({ valid: false, outcome: "FAIL" as const, replay_hash_valid: false, integrity_hash_valid: false, registry_valid: false, metadata_valid: false, discovery_valid: false, catalog_valid: false, lineage_valid: false, governance_valid: false, audit_valid: false, certification_valid: false, failures: freezeArray(["CERTIFICATION_PRUNED" as const]) });
  const replay_hash_valid = resultReplayHash(result) === result.replay_hash;
  const integrity_hash_valid = resultIntegrityHash(result) === result.integrity_hash;
  const registry_valid = verifyHashedRecord(result.registry) && result.registry.authoritative && result.registry.initialized && result.registry.records.length === 1 && result.registry.duplicate_prevention && result.registry.identity_validation;
  const metadata_valid = verifyHashedRecord(result.metadata_repository) && result.metadata_repository.metadata_validated && result.metadata_repository.ownership_metadata_resolved && result.metadata_repository.unauthorized_changes_blocked;
  const discovery_valid = verifyHashedRecord(result.discovery_index) && result.discovery_index.deterministic_ordering && result.discovery_index.duplicate_free && result.discovery_index.indexed_application_ids.length === 1;
  const catalog_valid = verifyHashedRecord(result.catalog) && result.catalog.published && result.catalog.publication_approved && result.catalog.application_ids.length === 1;
  const lineage_valid = verifyHashedRecord(result.lineage) && result.lineage.append_only && result.lineage.complete && result.lineage.immutable;
  const governance_valid = verifyHashedRecord(result.governance) && result.governance.publication_requires_registration && result.governance.publication_requires_validated_metadata && result.governance.identity_immutable && result.governance.aliases_permanently_resolvable && result.governance.ownership_refs_resolve_to_p4_1 && result.governance.duplicate_registrations_rejected;
  const audit_valid = verifyHashedRecord(result.audit_evidence) && result.audit_evidence.complete && result.audit_evidence.immutable && result.audit_evidence.audit_refs.length > 0;
  const certification_valid = verifyHashedRecord(result.certification) && result.certification.outcome === "PASS" && result.certification.phase_ready && result.certification.no_runtime_or_certification_authority && result.certification.failures.length === 0;
  const valid = replay_hash_valid && integrity_hash_valid && registry_valid && metadata_valid && discovery_valid && catalog_valid && lineage_valid && governance_valid && audit_valid && certification_valid;
  return nested({ valid, outcome: result.certification.outcome, replay_hash_valid, integrity_hash_valid, registry_valid, metadata_valid, discovery_valid, catalog_valid, lineage_valid, governance_valid, audit_valid, certification_valid, failures: result.certification.failures });
}

export function replayApplicationRegistryCatalog(result = runApplicationRegistryCatalog()): boolean {
  const replayed = runApplicationRegistryCatalog();
  return result.replay_hash === replayed.replay_hash && result.integrity_hash === replayed.integrity_hash && validateApplicationRegistryCatalog(result).valid;
}

export function getApplicationRegistryCatalogBundle(): ApplicationRegistryBundle {
  const result = runApplicationRegistryCatalog();
  return Object.freeze({
    doctrine: Object.freeze({
      version: VERSION,
      owns_application_registry: true,
      owns_application_metadata: true,
      owns_application_discovery: true,
      owns_application_lineage: true,
      owns_catalog_governance: true,
      authoritative_identity_registry: true,
      deploys_applications: false,
      executes_applications: false,
      certifies_applications: false,
      governs_runtime_behavior: false,
    }),
    result,
    validation: validateApplicationRegistryCatalog(result),
  });
}

export const ApplicationRegistryCatalogService = Object.freeze({
  run: runApplicationRegistryCatalog,
  validate: validateApplicationRegistryCatalog,
  replay: replayApplicationRegistryCatalog,
});
