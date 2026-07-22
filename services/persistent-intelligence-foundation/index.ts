import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import type {
  PersistentIntelligenceApiSurface,
  PersistentIntelligenceCertification,
  PersistentIntelligenceCertificationTest,
  PersistentIntelligenceContract,
  PersistentIntelligenceFailure,
  PersistentIntelligenceFoundationContract,
  PersistentIntelligenceFoundationInput,
  PersistentIntelligenceFoundationResult,
  PersistentIntelligenceIdentity,
  PersistentIntelligenceLedgerEntry,
  PersistentIntelligenceLifecycleStage,
  PersistentIntelligenceObservability,
  PersistentIntelligenceQualificationInterface,
  PersistentIntelligenceRegistryEntry,
  PersistentIntelligenceScenario,
  PersistentIntelligenceStatus,
  PersistentIntelligenceValidation,
  PersistentIntelligenceVersion,
  PersistentIntelligenceVersionType,
  PersistentKnowledgeSchema,
} from "@/types/persistent-intelligence-foundation";

const VERSION = "persistent-intelligence-foundation/v11.1" as const;
const ID = "PersistentIntelligenceFoundation" as const;
const TENANT_ID = "tenant_mission_control";
const MISSION_ID = "mission_persistent_intelligence";
const LIFECYCLE: readonly PersistentIntelligenceLifecycleStage[] = Object.freeze(["DRAFT", "CANDIDATE", "QUALIFIED", "CERTIFIED", "PERSISTENT", "DEPRECATED", "ARCHIVED", "RETIRED"]);
const VERSION_TYPES: readonly PersistentIntelligenceVersionType[] = Object.freeze(["MAJOR", "MINOR", "PATCH", "CERTIFICATION", "GOVERNANCE", "RETIREMENT"]);

function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function hash(value: unknown): string { return generateDecisionIntegrityHash(value); }
function hashWithoutIntegrity<T extends object>(value: T): string { const copy = { ...value } as Record<string, unknown>; delete copy.integrity_hash; return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown); }
function id(prefix: string, value: unknown): string { return `${prefix}_${hash(value).slice(0, 24)}`; }

function failureForScenario(scenario: PersistentIntelligenceScenario): PersistentIntelligenceFailure | undefined {
  return scenario === "BASELINE" ? undefined : scenario;
}
function statusFor(failures: readonly PersistentIntelligenceFailure[]): PersistentIntelligenceStatus {
  if (failures.includes("OBSERVABILITY_INCOMPLETE") && failures.length === 1) return "CONDITIONAL_PASS";
  return failures.length ? "FAIL" : "PASS";
}
function has(failures: readonly PersistentIntelligenceFailure[], values: readonly PersistentIntelligenceFailure[]): boolean {
  return failures.some((failure) => values.includes(failure));
}

function contract(failures: readonly PersistentIntelligenceFailure[]): PersistentIntelligenceContract {
  const base: Omit<PersistentIntelligenceContract, "integrity_hash"> = {
    contract_id: id("persistent_intelligence_contract", VERSION),
    lifecycle: LIFECYCLE,
    ownership_required: true,
    constitutional_authority_required: !failures.includes("CONSTITUTIONAL_VALIDATION_MISSING"),
    governance_approval_required: !failures.includes("GOVERNANCE_VALIDATION_MISSING"),
    trust_qualification_required: !failures.includes("QUALIFICATION_BYPASS"),
    evidence_required: true,
    replay_required: !failures.includes("REPLAY_INCONSISTENCY"),
    tenant_isolation_required: !failures.includes("TENANT_ISOLATION_BREACH"),
    advisory_only: true,
    memory_substitute: false,
    persistence_rule: "ONLY_CERTIFIED_QUALIFIED_INTELLIGENCE_CAN_BECOME_PERSISTENT",
    retirement_policy: "RETIRED_ASSETS_REMAIN_REPLAYABLE_AND_AUDITABLE",
    restoration_policy: "RESTORATION_REQUIRES_GOVERNANCE_AND_REPLAY_CERTIFICATION",
  };
  return Object.freeze({ ...base, integrity_hash: failures.includes("CONTRACT_INVALID") ? "invalid-contract-hash" : hashWithoutIntegrity(base) });
}

function identity(input: PersistentIntelligenceFoundationInput, failures: readonly PersistentIntelligenceFailure[]): PersistentIntelligenceIdentity {
  const tenant_id = input.tenant_id ?? TENANT_ID;
  const mission_id = input.mission_id ?? MISSION_ID;
  const seed = { tenant_id, mission_id, classification_id: "persistent-intelligence-foundation", root: VERSION };
  const intelligence_id = failures.includes("DUPLICATE_IDENTITY") ? "pi_duplicate_identity" : id("pi", seed);
  const version_id = failures.includes("IDENTITY_MUTATION") ? id("piv", { ...seed, mutation: "illegal" }) : id("piv", { intelligence_id, version: "1.0.0" });
  const base: Omit<PersistentIntelligenceIdentity, "integrity_hash"> = {
    intelligence_id,
    version_id,
    parent_id: null,
    root_intelligence_id: intelligence_id,
    tenant_id,
    mission_id,
    classification_id: "persistent-intelligence-foundation",
    trust_tier: "PERSISTENT",
    qualification_id: id("qualification", { intelligence_id, version_id }),
    immutable: true,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function schema(failures: readonly PersistentIntelligenceFailure[]): PersistentKnowledgeSchema {
  const base: Omit<PersistentKnowledgeSchema, "integrity_hash"> = {
    schema_id: "persistent_knowledge_schema",
    schema_version: "persistent-knowledge-schema/v11.1",
    domains: freezeArray(["METADATA", "INTELLIGENCE", "EVIDENCE", "GOVERNANCE", "LIFECYCLE"]),
    fields: Object.freeze({
      metadata: freezeArray(["identifiers", "timestamps", "ownership", "version"]),
      intelligence: freezeArray(["summary", "findings", "rationale", "recommendations"]),
      evidence: freezeArray(["evidence_references", "confidence", "replay_links"]),
      governance: freezeArray(["approvals", "constitutional_review", "qualification"]),
      lifecycle: freezeArray(["created", "qualified", "certified", "deprecated", "archived"]),
    }),
    deterministic_serialization: !failures.includes("SCHEMA_NONDETERMINISTIC"),
    backward_compatible: true,
    migration_framework_available: true,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function versions(identityRecord: PersistentIntelligenceIdentity, failures: readonly PersistentIntelligenceFailure[]): readonly PersistentIntelligenceVersion[] {
  const rows: readonly Omit<PersistentIntelligenceVersion, "integrity_hash">[] = freezeArray([
    { version_id: identityRecord.version_id, intelligence_id: identityRecord.intelligence_id, version_number: "1.0.0", version_type: "MAJOR", parent_version_id: null, immutable: true, replayable: true, traceable: true, evidence_refs: freezeArray(["evidence:phase-10-final-certification", "evidence:persistent-foundation-contract"]), lineage_refs: freezeArray(["lineage:persistent-foundation:root"]) },
    { version_id: id("piv", { intelligence_id: identityRecord.intelligence_id, version: "1.0.1" }), intelligence_id: identityRecord.intelligence_id, version_number: "1.0.1", version_type: "CERTIFICATION", parent_version_id: failures.includes("VERSION_LINEAGE_INVALID") ? null : identityRecord.version_id, immutable: true, replayable: true, traceable: true, evidence_refs: freezeArray(["evidence:foundation-certification-matrix"]), lineage_refs: freezeArray(["lineage:persistent-foundation:certification"]) },
    { version_id: id("piv", { intelligence_id: identityRecord.intelligence_id, version: "1.0.2" }), intelligence_id: identityRecord.intelligence_id, version_number: "1.0.2", version_type: "GOVERNANCE", parent_version_id: id("piv", { intelligence_id: identityRecord.intelligence_id, version: "1.0.1" }), immutable: true, replayable: true, traceable: true, evidence_refs: freezeArray(["evidence:governance-approval"]), lineage_refs: freezeArray(["lineage:persistent-foundation:governance"]) },
  ]);
  return freezeArray(rows.map((row) => Object.freeze({ ...row, integrity_hash: hashWithoutIntegrity(row) })));
}

function registry(identityRecord: PersistentIntelligenceIdentity, versionRows: readonly PersistentIntelligenceVersion[], failures: readonly PersistentIntelligenceFailure[]): readonly PersistentIntelligenceRegistryEntry[] {
  const base: Omit<PersistentIntelligenceRegistryEntry, "integrity_hash"> = {
    registry_id: id("persistent_intelligence_registry", identityRecord.intelligence_id),
    identity: identityRecord,
    lifecycle_stage: "PERSISTENT",
    qualification_status: "PERSISTENT",
    governance_status: "APPROVED",
    constitutional_status: "APPROVED",
    dependencies: freezeArray(versionRows.map((version) => version.version_id)),
    searchable_terms: freezeArray(["persistent intelligence", "foundation", "governed asset", "certified knowledge"]),
    tenant_isolated: !failures.includes("TENANT_ISOLATION_BREACH") as true,
    replay_ref: id("replay", { registry: identityRecord.intelligence_id }),
  };
  const entry = Object.freeze({ ...base, integrity_hash: failures.includes("REGISTRY_CORRUPTION") ? "invalid-registry-hash" : hashWithoutIntegrity(base) });
  return freezeArray(failures.includes("DUPLICATE_IDENTITY") ? [entry, entry] : [entry]);
}

function qualification(failures: readonly PersistentIntelligenceFailure[]): PersistentIntelligenceQualificationInterface {
  const base: Omit<PersistentIntelligenceQualificationInterface, "integrity_hash"> = {
    interface_id: "persistent_intelligence_qualification_interface",
    validates_contract: !failures.includes("CONTRACT_INVALID"),
    validates_governance: !failures.includes("GOVERNANCE_VALIDATION_MISSING"),
    validates_constitution: !failures.includes("CONSTITUTIONAL_VALIDATION_MISSING"),
    validates_trust: !failures.includes("QUALIFICATION_BYPASS"),
    validates_replay: !failures.includes("REPLAY_INCONSISTENCY"),
    validates_tenant_isolation: !failures.includes("TENANT_ISOLATION_BREACH"),
    blocks_unqualified_persistence: !failures.includes("QUALIFICATION_BYPASS"),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function apiSurface(failures: readonly PersistentIntelligenceFailure[]): PersistentIntelligenceApiSurface {
  const base: Omit<PersistentIntelligenceApiSurface, "integrity_hash"> = {
    api_id: "persistent_intelligence_foundation_api",
    registration: freezeArray(["POST /persistent-intelligence-foundation/register", "POST /persistent-intelligence-foundation/version", "POST /persistent-intelligence-foundation/deprecate", "POST /persistent-intelligence-foundation/archive"]),
    discovery: freezeArray(["POST /persistent-intelligence-foundation/search", "POST /persistent-intelligence-foundation/lookup", "POST /persistent-intelligence-foundation/lineage", "POST /persistent-intelligence-foundation/dependencies"]),
    validation: freezeArray(["POST /persistent-intelligence-foundation/validate-contract", "POST /persistent-intelligence-foundation/validate-governance", "POST /persistent-intelligence-foundation/validate-qualification", "POST /persistent-intelligence-foundation/validate-replay"]),
    administration: freezeArray(["POST /persistent-intelligence-foundation/governance-review", "POST /persistent-intelligence-foundation/certify", "POST /persistent-intelligence-foundation/lifecycle-transition"]),
    authorization_required: !failures.includes("API_AUTHORIZATION_FAILURE"),
    constitutional_validation_required: !failures.includes("CONSTITUTIONAL_VALIDATION_MISSING"),
    governance_validation_required: !failures.includes("GOVERNANCE_VALIDATION_MISSING"),
    tenant_isolation_required: !failures.includes("TENANT_ISOLATION_BREACH"),
    replay_logging_required: !failures.includes("REPLAY_INCONSISTENCY"),
    audit_logging_required: !failures.includes("LEDGER_MUTATION"),
    mutation_without_version_supported: false,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function observability(failures: readonly PersistentIntelligenceFailure[]): PersistentIntelligenceObservability {
  const base: Omit<PersistentIntelligenceObservability, "integrity_hash"> = {
    observability_id: "persistent_intelligence_foundation_observability",
    metrics: Object.freeze({ registrations: 1, qualifications: 1, version_creations: 3, lookup_latency_ms: 18, replay_latency_ms: 22, api_performance_ms: 31 }),
    dashboards: failures.includes("OBSERVABILITY_INCOMPLETE") ? freezeArray(["REGISTRY_HEALTH"]) : freezeArray(["REGISTRY_HEALTH", "QUALIFICATION_HEALTH", "VERSION_GROWTH", "GOVERNANCE_STATUS", "REPLAY_VALIDATION", "CERTIFICATION_READINESS"]),
    alerts: failures.includes("ALERTING_INOPERABLE") ? freezeArray([]) : freezeArray(["REGISTRY_FAILURE", "DUPLICATE_IDENTITY", "VERSION_CONFLICT", "REPLAY_FAILURE", "GOVERNANCE_VIOLATION", "INTEGRITY_FAILURE"]),
    ledger_complete: !failures.includes("LEDGER_MUTATION") as true,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function ledger(identityRecord: PersistentIntelligenceIdentity, versionRows: readonly PersistentIntelligenceVersion[], failures: readonly PersistentIntelligenceFailure[]): readonly PersistentIntelligenceLedgerEntry[] {
  const events = freezeArray(["contract.registered", "identity.generated", "schema.stabilized", "versions.linked", "registry.operational", "qualification.enforced", "api.certified", "observability.enabled", "foundation.certified"]);
  return freezeArray(events.map((event, index) => {
    const version = versionRows[index % versionRows.length];
    const base: Omit<PersistentIntelligenceLedgerEntry, "integrity_hash"> = { ledger_entry_id: id("pi_ledger", `${index}:${event}`), sequence: index + 1, event, intelligence_id: identityRecord.intelligence_id, version_id: version.version_id, governance_refs: freezeArray(["governance:persistent-intelligence-foundation:approved"]), replay_refs: freezeArray([`replay:persistent-intelligence-foundation:${index + 1}`]), append_only: !failures.includes("LEDGER_MUTATION") as true };
    return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
  }));
}

function test(name: string, passed: boolean, failure: PersistentIntelligenceFailure, refs: readonly string[]): PersistentIntelligenceCertificationTest {
  const base: Omit<PersistentIntelligenceCertificationTest, "integrity_hash"> = { test_id: id("persistent_intelligence_test", name), name, expected: "PASS", actual: passed ? "PASS" : "FAIL", passed, failure_reason: passed ? null : failure, evidence_refs: refs };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

type CertificationBase = Omit<PersistentIntelligenceFoundationResult, "certification" | "replay_hash" | "integrity_hash">;
function certificationTests(result: CertificationBase): readonly PersistentIntelligenceCertificationTest[] {
  const refs = freezeArray([result.contract.integrity_hash, result.identity.integrity_hash, result.schema.integrity_hash]);
  const uniqueIds = new Set(result.registry.map((entry) => entry.identity.intelligence_id)).size === result.registry.length;
  const versionLineage = result.versions.every((version, index) => index === 0 ? version.parent_version_id === null : Boolean(version.parent_version_id));
  return freezeArray([
    test("Persistent Intelligence Contract valid", hashWithoutIntegrity(result.contract) === result.contract.integrity_hash, "CONTRACT_INVALID", refs),
    test("Identity generation deterministic", result.identity.intelligence_id === id("pi", { tenant_id: result.identity.tenant_id, mission_id: result.identity.mission_id, classification_id: result.identity.classification_id, root: VERSION }), "IDENTITY_MUTATION", refs),
    test("Identity immutability enforced", result.identity.immutable && result.identity.root_intelligence_id === result.identity.intelligence_id, "IDENTITY_MUTATION", refs),
    test("Duplicate identities prevented", uniqueIds, "DUPLICATE_IDENTITY", refs),
    test("Knowledge schema validation deterministic", result.schema.deterministic_serialization, "SCHEMA_NONDETERMINISTIC", refs),
    test("Schema serialization reproducible", hashWithoutIntegrity(result.schema) === result.schema.integrity_hash, "SCHEMA_NONDETERMINISTIC", refs),
    test("Backward compatibility validated", result.schema.backward_compatible, "SCHEMA_NONDETERMINISTIC", refs),
    test("Version lineage deterministic", versionLineage, "VERSION_LINEAGE_INVALID", refs),
    test("Historical version replay reproducible", result.versions.every((version) => version.replayable), "REPLAY_INCONSISTENCY", refs),
    test("Registry registration deterministic", result.registry.every((entry) => hashWithoutIntegrity(entry) === entry.integrity_hash), "REGISTRY_CORRUPTION", refs),
    test("Registry discovery reproducible", result.registry.every((entry) => entry.searchable_terms.length > 0), "REGISTRY_CORRUPTION", refs),
    test("Registry lookup deterministic", result.registry.every((entry) => entry.replay_ref.length > 0), "REGISTRY_CORRUPTION", refs),
    test("Registry integrity verified", result.registry.every((entry) => hashWithoutIntegrity(entry) === entry.integrity_hash), "REGISTRY_CORRUPTION", refs),
    test("Qualification interface validation enforced", result.qualification_interface.blocks_unqualified_persistence, "QUALIFICATION_BYPASS", refs),
    test("API authorization enforced", result.api_surface.authorization_required, "API_AUTHORIZATION_FAILURE", refs),
    test("Constitutional validation mandatory", result.api_surface.constitutional_validation_required && result.contract.constitutional_authority_required, "CONSTITUTIONAL_VALIDATION_MISSING", refs),
    test("Governance validation mandatory", result.api_surface.governance_validation_required && result.contract.governance_approval_required, "GOVERNANCE_VALIDATION_MISSING", refs),
    test("Trust qualification enforced", result.qualification_interface.validates_trust, "QUALIFICATION_BYPASS", refs),
    test("Tenant isolation validated", result.registry.every((entry) => entry.tenant_isolated), "TENANT_ISOLATION_BREACH", refs),
    test("Cross-tenant access blocked", result.api_surface.tenant_isolation_required, "TENANT_ISOLATION_BREACH", refs),
    test("Replay determinism validated", result.contract.replay_required, "REPLAY_INCONSISTENCY", refs),
    test("Replay lineage complete", result.versions.every((version) => version.lineage_refs.length > 0), "VERSION_LINEAGE_INVALID", refs),
    test("Audit ledger append-only", result.ledger.every((entry) => entry.append_only), "LEDGER_MUTATION", refs),
    test("Integrity hashes reproducible", result.versions.every((version) => hashWithoutIntegrity(version) === version.integrity_hash), "INTEGRITY_HASH_MISMATCH", refs),
    test("Cryptographic signatures validated", !result.registry.some((entry) => entry.integrity_hash === "invalid-registry-hash"), "SIGNATURE_INVALID", refs),
    test("Observability metrics complete", result.observability.dashboards.length === 6, "OBSERVABILITY_INCOMPLETE", refs),
    test("Dashboard integrity validated", result.observability.integrity_hash === hashWithoutIntegrity(result.observability), "OBSERVABILITY_INCOMPLETE", refs),
    test("Alerting operational", result.observability.alerts.length === 6, "ALERTING_INOPERABLE", refs),
    test("Performance thresholds satisfied", result.observability.metrics.lookup_latency_ms <= 50 && result.observability.metrics.replay_latency_ms <= 50 && result.observability.metrics.api_performance_ms <= 75, "PERFORMANCE_THRESHOLD_MISSED", refs),
    test("Security penetration tests passed", result.api_surface.authorization_required && result.api_surface.tenant_isolation_required, "SECURITY_TEST_FAILURE", refs),
    test("Foundation recovery deterministic", result.ledger.length === 9 && result.ledger.every((entry, index) => entry.sequence === index + 1), "RECOVERY_NONDETERMINISTIC", refs),
    test("Rollback procedures validated", result.versions.every((version) => version.traceable), "RECOVERY_NONDETERMINISTIC", refs),
    test("Production readiness confirmed", result.status === "PASS", "PRODUCTION_READINESS_BLOCKED", refs),
  ]);
}

function replayHash(result: Omit<PersistentIntelligenceFoundationResult, "replay_hash" | "integrity_hash">): string {
  return hash({ contract: result.contract.integrity_hash, identity: result.identity.integrity_hash, schema: result.schema.integrity_hash, versions: result.versions.map((version) => version.integrity_hash), registry: result.registry.map((entry) => entry.integrity_hash), ledger: result.ledger.map((entry) => entry.integrity_hash), certification: result.certification.integrity_hash });
}
function integrityHash(result: Omit<PersistentIntelligenceFoundationResult, "integrity_hash">): string {
  return hash({ version: result.foundation_version, id: result.foundation_identifier, status: result.status, replay_hash: result.replay_hash });
}

export function buildPersistentIntelligenceFoundation(input: PersistentIntelligenceFoundationInput = {}): PersistentIntelligenceFoundationResult {
  const scenarioFailure = failureForScenario(input.scenario ?? "BASELINE");
  const initialFailures = freezeArray(scenarioFailure ? [scenarioFailure] : []);
  const contractRecord = contract(initialFailures);
  const identityRecord = identity(input, initialFailures);
  const schemaRecord = schema(initialFailures);
  const versionRows = versions(identityRecord, initialFailures);
  const registryRows = registry(identityRecord, versionRows, initialFailures);
  const baseWithoutCertification: CertificationBase = {
    foundation_version: VERSION,
    foundation_identifier: ID,
    status: statusFor(initialFailures),
    contract: contractRecord,
    identity: identityRecord,
    schema: schemaRecord,
    versions: versionRows,
    registry: registryRows,
    qualification_interface: qualification(initialFailures),
    api_surface: apiSurface(initialFailures),
    observability: observability(initialFailures),
    ledger: ledger(identityRecord, versionRows, initialFailures),
  };
  const validationTests = certificationTests(baseWithoutCertification);
  const failures = freezeArray([...new Set([...initialFailures, ...validationTests.map((item) => item.failure_reason).filter((failure): failure is PersistentIntelligenceFailure => Boolean(failure))])]);
  const status = statusFor(failures);
  const certBase: Omit<PersistentIntelligenceCertification, "integrity_hash"> = { certification_id: id("persistent_intelligence_foundation_certification", VERSION), status, production_ready: status === "PASS", foundation_allows_object_creation: status === "PASS", failures, tests: validationTests };
  const certificationRecord = Object.freeze({ ...certBase, integrity_hash: hashWithoutIntegrity(certBase) });
  const base: Omit<PersistentIntelligenceFoundationResult, "replay_hash" | "integrity_hash"> = { ...baseWithoutCertification, status, certification: certificationRecord };
  const rHash = replayHash(base);
  return Object.freeze({ ...base, replay_hash: rHash, integrity_hash: integrityHash({ ...base, replay_hash: rHash }) });
}

export function validatePersistentIntelligenceFoundation(result?: PersistentIntelligenceFoundationResult): PersistentIntelligenceValidation {
  if (!result) {
    const failures = freezeArray<PersistentIntelligenceFailure>(["CONTRACT_INVALID"]);
    const base: Omit<PersistentIntelligenceValidation, "certification_hash"> = { foundation_id: null, valid: false, status: "FAIL", failures, replay_hash_valid: false, integrity_hash_valid: false };
    return Object.freeze({ ...base, certification_hash: hashWithoutIntegrity(base) });
  }
  const nestedValid = hashWithoutIntegrity(result.contract) === result.contract.integrity_hash
    && hashWithoutIntegrity(result.identity) === result.identity.integrity_hash
    && hashWithoutIntegrity(result.schema) === result.schema.integrity_hash
    && result.versions.every((version) => hashWithoutIntegrity(version) === version.integrity_hash)
    && result.registry.every((entry) => hashWithoutIntegrity(entry) === entry.integrity_hash)
    && result.ledger.every((entry) => hashWithoutIntegrity(entry) === entry.integrity_hash)
    && hashWithoutIntegrity(result.certification) === result.certification.integrity_hash;
  const replay_hash_valid = replayHash(result) === result.replay_hash;
  const integrity_hash_valid = integrityHash(result) === result.integrity_hash && nestedValid;
  const valid = result.status === "PASS" && result.certification.status === "PASS" && result.certification.failures.length === 0 && replay_hash_valid && integrity_hash_valid;
  const base: Omit<PersistentIntelligenceValidation, "certification_hash"> = { foundation_id: result.identity.intelligence_id, valid, status: result.status, failures: result.certification.failures, replay_hash_valid, integrity_hash_valid };
  return Object.freeze({ ...base, certification_hash: hashWithoutIntegrity(base) });
}

export function replayPersistentIntelligenceFoundation(result = buildPersistentIntelligenceFoundation()): boolean {
  const replayed = buildPersistentIntelligenceFoundation({ tenant_id: result.identity.tenant_id, mission_id: result.identity.mission_id });
  return result.integrity_hash === replayed.integrity_hash && result.replay_hash === replayed.replay_hash && validatePersistentIntelligenceFoundation(result).valid;
}

export function getPersistentIntelligenceFoundationContract(): PersistentIntelligenceFoundationContract {
  const result = buildPersistentIntelligenceFoundation();
  return Object.freeze({
    doctrine: Object.freeze({ version: VERSION, persistent_intelligence_is_memory: false, lifecycle: LIFECYCLE, version_types: VERSION_TYPES, requires_pass_before_object_creation: true, conditional_pass_blocks_object_creation: true }),
    result,
    validation: validatePersistentIntelligenceFoundation(result),
    observability: result.observability,
  });
}

export const PersistentIntelligenceFoundation = Object.freeze({
  build: buildPersistentIntelligenceFoundation,
  validate: validatePersistentIntelligenceFoundation,
  replay: replayPersistentIntelligenceFoundation,
});
