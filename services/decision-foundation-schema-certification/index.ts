import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { runCertificationFramework } from "@/services/decision-certification-framework";
import type { CertificationFrameworkResult } from "@/types/decision-certification-framework";
import type { VisibilityRole } from "@/types/decision-observability-contract";
import type {
  ContractValidationReport,
  CrossSchemaConsistencyReport,
  DependencyValidationReport,
  FoundationCertificationCheck,
  FoundationCertificationEvidencePackage,
  FoundationCertificationLedgerEntry,
  FoundationCertificationReport,
  FoundationSchemaCertificationFailure,
  FoundationSchemaCertificationFoundation,
  FoundationSchemaCertificationInput,
  FoundationSchemaCertificationResult,
  FoundationSchemaCertificationValidation,
  FoundationSchemaScope,
  FoundationSchemaValidationRecord,
  SchemaCompatibilityState,
  VersionCompatibilityReport,
} from "@/types/decision-foundation-schema-certification";

const CERTIFICATION_VERSION = "decision-foundation-schema-certification/v1" as const;

export const FOUNDATION_SCHEMA_SCOPES: readonly FoundationSchemaScope[] = Object.freeze(["DECISION_ORCHESTRATION_CONTRACT", "DECISION_CANDIDATE_SCHEMA", "DECISION_CONTEXT_SCHEMA", "DEPENDENCY_GRAPH_SCHEMA", "PRIORITY_MODEL", "GOVERNANCE_CONTRACT", "DECISION_PACKAGE_SCHEMA", "WORKFLOW_SCHEMA", "REPLAY_SCHEMA"]);
export const FOUNDATION_CERTIFICATION_CHECKS: readonly FoundationCertificationCheck[] = Object.freeze(["CONTRACT_COMPLETENESS", "REQUIRED_FIELDS", "IDENTITY_UNIQUENESS", "LIFECYCLE_COMPLETENESS", "RELATIONSHIP_VALIDITY", "DEPENDENCY_MAPPING", "GOVERNANCE_METADATA", "CONSTITUTIONAL_METADATA", "AUTHORITY_METADATA", "REPLAY_METADATA", "INTEGRITY_METADATA", "TENANT_METADATA", "VERSION_IDENTIFIER", "BACKWARD_COMPATIBILITY", "FORWARD_COMPATIBILITY", "MIGRATION_MAPPING", "DETERMINISTIC_VALIDATION"]);

type Scenario = NonNullable<FoundationSchemaCertificationInput["scenario"]>;

function freezeArray<T>(values: readonly T[]): readonly T[] {
  return Object.freeze([...values]);
}

function hash(value: unknown): string {
  return generateDecisionIntegrityHash(value);
}

function hashWithoutIntegrity<T extends object>(value: T): string {
  const copy = { ...value } as Record<string, unknown>;
  delete copy.integrity_hash;
  return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown);
}

function ctx(source: CertificationFrameworkResult) {
  return {
    tenant_id: source.analytics_result.source_snapshot.tenant_id,
    mission_id: source.analytics_result.source_snapshot.mission_id,
    replay_ref: source.replay_hash,
    certification_ref: source.certification_contract.certification_id,
  };
}

function schemaRef(scope: FoundationSchemaScope): string {
  return `schema:${scope.toLowerCase()}:v1`;
}

function requiredFields(scope: FoundationSchemaScope): readonly string[] {
  const common = ["id", "tenant_id", "mission_id", "version", "replay_ref", "integrity_hash"];
  const specific: Record<FoundationSchemaScope, readonly string[]> = {
    DECISION_ORCHESTRATION_CONTRACT: ["decision_id", "lifecycle_state", "governance_metadata", "authority_metadata", "certification_ref"],
    DECISION_CANDIDATE_SCHEMA: ["candidate_id", "source_refs", "evidence_refs", "risk_metadata", "confidence_metadata", "lineage_hash"],
    DECISION_CONTEXT_SCHEMA: ["context_id", "mission_context", "governance_context", "constitutional_context", "dependency_refs"],
    DEPENDENCY_GRAPH_SCHEMA: ["node_refs", "edge_refs", "blocker_refs", "cycle_detection"],
    PRIORITY_MODEL: ["priority_components", "weight_definitions", "tie_breaking_rules", "governance_weight"],
    GOVERNANCE_CONTRACT: ["policy_refs", "constitutional_refs", "approval_requirements", "escalation_requirements"],
    DECISION_PACKAGE_SCHEMA: ["recommendation", "alternatives", "evidence_summary", "risk_summary", "governance_summary"],
    WORKFLOW_SCHEMA: ["workflow_id", "workflow_states", "transitions", "override_support", "escalation_support"],
    REPLAY_SCHEMA: ["replay_id", "snapshot_refs", "timeline_refs", "reconstruction_metadata", "divergence_metadata"],
  };
  return freezeArray([...common, ...specific[scope]]);
}

function buildSchemaValidations(source: CertificationFrameworkResult, scenario: Scenario): readonly FoundationSchemaValidationRecord[] {
  const c = ctx(source);
  const scopes = scenario === "MISSING_SCHEMA" ? FOUNDATION_SCHEMA_SCOPES.slice(0, -1) : FOUNDATION_SCHEMA_SCOPES;
  const records = scopes.map((scope, index) => {
    const replay = scenario === "MISSING_REPLAY_METADATA" && scope === "REPLAY_SCHEMA" ? "" : c.replay_ref;
    const governance = scenario === "MISSING_GOVERNANCE_METADATA" && scope === "GOVERNANCE_CONTRACT" ? "" : `governance_metadata_${scope.toLowerCase()}`;
    const constitutional = scenario === "MISSING_CONSTITUTIONAL_METADATA" && scope === "GOVERNANCE_CONTRACT" ? "" : `constitutional_metadata_${scope.toLowerCase()}`;
    const authority = scenario === "MISSING_AUTHORITY_METADATA" && scope === "GOVERNANCE_CONTRACT" ? "" : `authority_metadata_${scope.toLowerCase()}`;
    const tenant = scenario === "MISSING_TENANT_METADATA" && scope === "DECISION_ORCHESTRATION_CONTRACT" ? "" : `tenant_metadata_${scope.toLowerCase()}`;
    const fields = scenario === "INCOMPLETE_FIELDS" && scope === "DECISION_CANDIDATE_SCHEMA" ? requiredFields(scope).slice(0, 3) : requiredFields(scope);
    const base: Omit<FoundationSchemaValidationRecord, "integrity_hash"> = {
      validation_id: `foundation_schema_validation_${scope.toLowerCase()}`,
      schema_scope: scope,
      tenant_id: c.tenant_id,
      mission_id: c.mission_id,
      schema_ref: schemaRef(scope),
      schema_version: scenario === "VERSION_INCOMPATIBILITY" && scope === "PRIORITY_MODEL" ? "schema-version/0" : "schema-version/1",
      required_fields: fields,
      validated_checks: scenario === "NONDETERMINISTIC_VALIDATION" && index === 0 ? freezeArray([...FOUNDATION_CERTIFICATION_CHECKS].reverse()) : FOUNDATION_CERTIFICATION_CHECKS,
      validation_state: "PASS",
      governance_metadata_ref: governance,
      constitutional_metadata_ref: constitutional,
      authority_metadata_ref: authority,
      replay_metadata_ref: replay,
      tenant_metadata_ref: tenant,
      certification_ref: c.certification_ref,
      replay_ref: replay,
    };
    const built = Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
    if (scenario === "HASH_MISMATCH" && index === 0) return Object.freeze({ ...built, integrity_hash: hash({ tampered: built.validation_id }) });
    return built;
  });
  if (scenario === "NONDETERMINISTIC_VALIDATION") return freezeArray([...records].reverse());
  return freezeArray(records);
}

function buildContractReport(source: CertificationFrameworkResult, records: readonly FoundationSchemaValidationRecord[], scenario: Scenario): ContractValidationReport {
  const c = ctx(source);
  const base: Omit<ContractValidationReport, "integrity_hash"> = {
    contract_report_id: "foundation_contract_validation_report",
    tenant_id: c.tenant_id,
    mission_id: c.mission_id,
    validated_contracts: freezeArray(records.map((record) => record.schema_scope)),
    required_attributes_complete: scenario !== "INCOMPLETE_FIELDS" && scenario !== "INVALID_CONTRACT",
    identity_unique: scenario !== "DUPLICATE_IDENTITIES",
    lifecycle_complete: scenario !== "INVALID_LIFECYCLE",
    state_consistent: scenario !== "CONFLICTING_DEFINITIONS",
    replay_compatible: scenario !== "REPLAY_INCONSISTENCY" && scenario !== "MISSING_REPLAY_METADATA",
    governance_compatible: scenario !== "MISSING_GOVERNANCE_METADATA",
    authority_metadata_complete: scenario !== "MISSING_AUTHORITY_METADATA",
    certification_metadata_complete: scenario !== "INVALID_CONTRACT",
    replay_refs: scenario === "MISSING_REPLAY_METADATA" ? freezeArray([]) : freezeArray([c.replay_ref]),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildVersionReport(source: CertificationFrameworkResult, scenario: Scenario): VersionCompatibilityReport {
  const c = ctx(source);
  const matrix = Object.fromEntries(FOUNDATION_SCHEMA_SCOPES.map((scope) => [scope, scenario === "VERSION_INCOMPATIBILITY" && scope === "PRIORITY_MODEL" ? "INCOMPATIBLE" : "COMPATIBLE"])) as Record<FoundationSchemaScope, SchemaCompatibilityState>;
  const base: Omit<VersionCompatibilityReport, "integrity_hash"> = {
    version_report_id: "foundation_version_compatibility_report",
    tenant_id: c.tenant_id,
    mission_id: c.mission_id,
    compatibility_matrix: Object.freeze(matrix),
    backward_compatible: scenario !== "VERSION_INCOMPATIBILITY",
    forward_compatible: scenario !== "VERSION_INCOMPATIBILITY",
    deprecated_fields: freezeArray([]),
    migration_mappings: scenario === "MIGRATION_INCONSISTENCY" ? freezeArray([]) : freezeArray(FOUNDATION_SCHEMA_SCOPES.map((scope) => `migration_${scope.toLowerCase()}_v1_to_v1`)),
    upgrade_safe: scenario !== "VERSION_INCOMPATIBILITY" && scenario !== "MIGRATION_INCONSISTENCY",
    replay_refs: freezeArray([c.replay_ref]),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildConsistencyReport(source: CertificationFrameworkResult, scenario: Scenario): CrossSchemaConsistencyReport {
  const c = ctx(source);
  const base: Omit<CrossSchemaConsistencyReport, "integrity_hash"> = {
    consistency_report_id: "foundation_cross_schema_consistency_report",
    tenant_id: c.tenant_id,
    mission_id: c.mission_id,
    identity_consistent: scenario !== "DUPLICATE_IDENTITIES",
    shared_fields_consistent: scenario !== "CONFLICTING_DEFINITIONS",
    enumerations_consistent: scenario !== "CONFLICTING_DEFINITIONS",
    references_valid: scenario !== "BROKEN_REFERENCES",
    common_metadata_complete: scenario !== "MISSING_TENANT_METADATA",
    governance_consistent: scenario !== "MISSING_GOVERNANCE_METADATA",
    replay_consistent: scenario !== "REPLAY_INCONSISTENCY" && scenario !== "MISSING_REPLAY_METADATA",
    authority_consistent: scenario !== "MISSING_AUTHORITY_METADATA",
    replay_refs: scenario === "MISSING_REPLAY_METADATA" ? freezeArray([]) : freezeArray([c.replay_ref]),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildDependencyReport(source: CertificationFrameworkResult, scenario: Scenario): DependencyValidationReport {
  const c = ctx(source);
  const order = scenario === "NONDETERMINISTIC_VALIDATION" ? freezeArray([...FOUNDATION_SCHEMA_SCOPES].reverse()) : FOUNDATION_SCHEMA_SCOPES;
  const base: Omit<DependencyValidationReport, "integrity_hash"> = {
    dependency_report_id: "foundation_dependency_validation_report",
    tenant_id: c.tenant_id,
    mission_id: c.mission_id,
    required_dependencies: freezeArray(["decision-contract->candidate", "candidate->context", "context->graph", "graph->priority", "priority->governance", "governance->package", "package->workflow", "workflow->replay"]),
    optional_dependencies: freezeArray(["observability", "analytics", "certification-framework"]),
    circular_references_detected: scenario === "BROKEN_REFERENCES",
    missing_references: scenario === "BROKEN_REFERENCES" ? freezeArray(["context->graph"]) : freezeArray([]),
    invalid_references: scenario === "BROKEN_REFERENCES" ? freezeArray(["priority->unknown"]) : freezeArray([]),
    dependency_order: order,
    shared_contracts: scenario === "SCHEMA_AMBIGUITY" ? freezeArray(["ambiguous_shared_identity"]) : freezeArray(["tenant_id", "mission_id", "replay_ref", "integrity_hash"]),
    replay_refs: freezeArray([c.replay_ref]),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildEvidence(source: CertificationFrameworkResult, records: readonly FoundationSchemaValidationRecord[], contract: ContractValidationReport, version: VersionCompatibilityReport, consistency: CrossSchemaConsistencyReport, dependency: DependencyValidationReport, scenario: Scenario): FoundationCertificationEvidencePackage {
  const c = ctx(source);
  const base: Omit<FoundationCertificationEvidencePackage, "integrity_hash"> = {
    evidence_package_id: "foundation_schema_certification_evidence_package",
    tenant_id: c.tenant_id,
    mission_id: c.mission_id,
    schema_evidence_refs: freezeArray(records.map((record) => record.validation_id)),
    contract_evidence_refs: freezeArray([contract.contract_report_id]),
    version_evidence_refs: freezeArray([version.version_report_id]),
    integrity_evidence_refs: scenario === "HASH_MISMATCH" ? freezeArray([]) : freezeArray(records.map((record) => record.integrity_hash)),
    replay_evidence_refs: scenario === "MISSING_REPLAY_METADATA" ? freezeArray([]) : freezeArray([c.replay_ref, dependency.dependency_report_id, consistency.consistency_report_id]),
    complete: scenario !== "MISSING_SCHEMA" && scenario !== "INCOMPLETE_FIELDS",
    immutable: scenario !== "FAIL_OPEN",
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildReport(source: CertificationFrameworkResult, records: readonly FoundationSchemaValidationRecord[], version: VersionCompatibilityReport, consistency: CrossSchemaConsistencyReport, dependency: DependencyValidationReport, evidence: FoundationCertificationEvidencePackage, failures: readonly FoundationSchemaCertificationFailure[], scenario: Scenario): FoundationCertificationReport {
  const c = ctx(source);
  const decision = failures.length ? "FAIL" : "PASS";
  const base: Omit<FoundationCertificationReport, "integrity_hash"> = {
    report_id: "foundation_schema_certification_report",
    tenant_id: c.tenant_id,
    mission_id: c.mission_id,
    executive_summary: decision === "PASS" ? "All foundational Phase 9 schemas and contracts are certified." : "Foundation certification blocked by schema or contract failures.",
    validation_scope: freezeArray(records.map((record) => record.schema_scope)),
    certified_schemas: decision === "PASS" ? freezeArray(records.map((record) => record.schema_ref)) : freezeArray([]),
    certified_contracts: decision === "PASS" ? freezeArray(records.map((record) => record.schema_scope)) : freezeArray([]),
    version_compatibility_assessment: version.upgrade_safe ? "COMPATIBLE" : "INCOMPATIBLE",
    cross_schema_consistency: consistency.references_valid && consistency.shared_fields_consistent ? "PASS" : "FAIL",
    dependency_validation: dependency.missing_references.length === 0 && !dependency.circular_references_detected ? "PASS" : "FAIL",
    replay_validation: scenario === "REPLAY_INCONSISTENCY" || scenario === "MISSING_REPLAY_METADATA" ? "FAIL" : "PASS",
    integrity_verification: scenario === "HASH_MISMATCH" ? "FAIL" : "PASS",
    failure_analysis: failures,
    certification_decision: decision,
    production_readiness: decision === "PASS" ? "READY" : "BLOCKED",
    replay_refs: scenario === "MISSING_REPLAY_METADATA" ? freezeArray([]) : evidence.replay_evidence_refs,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildLedger(source: CertificationFrameworkResult, records: readonly FoundationSchemaValidationRecord[], evidence: FoundationCertificationEvidencePackage, report: FoundationCertificationReport, scenario: Scenario): readonly FoundationCertificationLedgerEntry[] {
  const c = ctx(source);
  const events: Omit<FoundationCertificationLedgerEntry, "integrity_hash">[] = [
    { ledger_entry_id: "foundation_cert_ledger_001", tenant_id: c.tenant_id, mission_id: c.mission_id, event_type: "SCHEMA_VALIDATED", scope_ref: "all_foundation_schemas", evidence_ref: evidence.evidence_package_id, certification_state: report.certification_decision, replay_refs: report.replay_refs, event_timestamp: "2026-07-05T09:12:02.000Z", sequence_number: 1, append_only: true, deleted: false },
    { ledger_entry_id: "foundation_cert_ledger_002", tenant_id: c.tenant_id, mission_id: c.mission_id, event_type: "CONTRACT_VALIDATED", scope_ref: "phase_9_contracts", evidence_ref: evidence.evidence_package_id, certification_state: report.certification_decision, replay_refs: report.replay_refs, event_timestamp: "2026-07-05T09:12:03.000Z", sequence_number: 2, append_only: true, deleted: false },
    { ledger_entry_id: "foundation_cert_ledger_003", tenant_id: c.tenant_id, mission_id: c.mission_id, event_type: "VERSION_COMPATIBILITY_VERIFIED", scope_ref: "version_matrix", evidence_ref: evidence.evidence_package_id, certification_state: report.certification_decision, replay_refs: report.replay_refs, event_timestamp: "2026-07-05T09:12:04.000Z", sequence_number: 3, append_only: true, deleted: false },
    { ledger_entry_id: "foundation_cert_ledger_004", tenant_id: c.tenant_id, mission_id: c.mission_id, event_type: report.certification_decision === "PASS" ? "FOUNDATION_CERTIFIED" : "FOUNDATION_BLOCKED", scope_ref: report.report_id, evidence_ref: records[0]?.validation_id ?? "missing", certification_state: report.certification_decision, replay_refs: report.replay_refs, event_timestamp: "2026-07-05T09:12:05.000Z", sequence_number: 4, append_only: (scenario === "FAIL_OPEN" ? false : true) as true, deleted: false },
  ];
  return freezeArray(events.map((event) => Object.freeze({ ...event, integrity_hash: hashWithoutIntegrity(event) })));
}

function collectFailures(input: {
  source: CertificationFrameworkResult;
  records: readonly FoundationSchemaValidationRecord[];
  contract: ContractValidationReport;
  version: VersionCompatibilityReport;
  consistency: CrossSchemaConsistencyReport;
  dependency: DependencyValidationReport;
  evidence: FoundationCertificationEvidencePackage;
  ledger: readonly FoundationCertificationLedgerEntry[];
  role: VisibilityRole;
  scenario: Scenario;
}): readonly FoundationSchemaCertificationFailure[] {
  const failures: FoundationSchemaCertificationFailure[] = [];
  if (input.records.length !== FOUNDATION_SCHEMA_SCOPES.length) failures.push("MISSING_REQUIRED_SCHEMA");
  if (!input.contract.required_attributes_complete || !input.contract.certification_metadata_complete) failures.push("INVALID_CONTRACT_DEFINITION");
  if (input.records.some((record) => record.required_fields.length < requiredFields(record.schema_scope).length)) failures.push("INCOMPLETE_REQUIRED_FIELDS");
  if (!input.contract.identity_unique || !input.consistency.identity_consistent) failures.push("DUPLICATE_IDENTITIES");
  if (!input.contract.state_consistent || !input.consistency.shared_fields_consistent || !input.consistency.enumerations_consistent) failures.push("CONFLICTING_DEFINITIONS");
  if (!input.contract.lifecycle_complete) failures.push("INVALID_LIFECYCLE");
  if (!input.consistency.references_valid || input.dependency.missing_references.length || input.dependency.invalid_references.length || input.dependency.circular_references_detected) failures.push("BROKEN_REFERENCES");
  if (input.records.some((record) => !record.replay_metadata_ref || !record.replay_ref) || !input.contract.replay_refs.length || !input.consistency.replay_refs.length) failures.push("MISSING_REPLAY_METADATA");
  if (input.records.some((record) => !record.governance_metadata_ref) || !input.contract.governance_compatible || !input.consistency.governance_consistent) failures.push("MISSING_GOVERNANCE_METADATA");
  if (input.records.some((record) => !record.constitutional_metadata_ref)) failures.push("MISSING_CONSTITUTIONAL_METADATA");
  if (input.records.some((record) => !record.authority_metadata_ref) || !input.contract.authority_metadata_complete || !input.consistency.authority_consistent) failures.push("MISSING_AUTHORITY_METADATA");
  if (input.records.some((record) => !record.tenant_metadata_ref) || !input.consistency.common_metadata_complete) failures.push("TENANT_METADATA_MISSING");
  if (!input.version.backward_compatible || !input.version.forward_compatible || !input.version.upgrade_safe || Object.values(input.version.compatibility_matrix).some((state) => state !== "COMPATIBLE")) failures.push("VERSION_INCOMPATIBILITY");
  if (!input.version.migration_mappings.length) failures.push("MIGRATION_INCONSISTENCY");
  if (!input.contract.replay_compatible || !input.consistency.replay_consistent || input.scenario === "REPLAY_INCONSISTENCY") failures.push("REPLAY_INCONSISTENCY");
  if (input.scenario === "NONDETERMINISTIC_VALIDATION" || input.dependency.dependency_order.join("|") !== FOUNDATION_SCHEMA_SCOPES.join("|")) failures.push("NONDETERMINISTIC_VALIDATION");
  if (input.dependency.shared_contracts.includes("ambiguous_shared_identity")) failures.push("SCHEMA_AMBIGUITY");
  if (
    input.records.some((record) => hashWithoutIntegrity(record) !== record.integrity_hash)
    || hashWithoutIntegrity(input.contract) !== input.contract.integrity_hash
    || hashWithoutIntegrity(input.version) !== input.version.integrity_hash
    || hashWithoutIntegrity(input.consistency) !== input.consistency.integrity_hash
    || hashWithoutIntegrity(input.dependency) !== input.dependency.integrity_hash
    || hashWithoutIntegrity(input.evidence) !== input.evidence.integrity_hash
    || input.ledger.some((entry) => hashWithoutIntegrity(entry) !== entry.integrity_hash)
  ) failures.push("INTEGRITY_HASH_MISMATCH");
  if (!input.evidence.immutable || input.ledger.some((entry) => !entry.append_only || entry.deleted)) failures.push("FAIL_OPEN_VALIDATION_BEHAVIOR");
  if (!input.source.analytics_result.operator_dashboard.replay_monitoring.governance_visibility.priority_dashboard.conflict_visualization.timeline_result.dashboard_result.observability_result.authorizations.some((auth) => auth.role === input.role && auth.permissions.includes("VIEW_DECISIONS"))) failures.push("AUTHORIZATION_FAILURE");
  if (input.scenario === "EXECUTION_AUTHORITY") failures.push("EXECUTION_AUTHORITY_GRANTED");
  return freezeArray([...new Set(failures)]);
}

function buildValidation(failures: readonly FoundationSchemaCertificationFailure[]): FoundationSchemaCertificationValidation {
  const has = (failure: FoundationSchemaCertificationFailure) => failures.includes(failure);
  const base: Omit<FoundationSchemaCertificationValidation, "integrity_hash"> = {
    validation_id: "foundation_schema_certification_validation",
    validation_status: failures.length ? "BLOCKED" : "VALID",
    required_schemas_present: !has("MISSING_REQUIRED_SCHEMA"),
    contracts_valid: !has("INVALID_CONTRACT_DEFINITION"),
    required_fields_complete: !has("INCOMPLETE_REQUIRED_FIELDS"),
    identities_unique: !has("DUPLICATE_IDENTITIES"),
    definitions_consistent: !has("CONFLICTING_DEFINITIONS"),
    lifecycle_valid: !has("INVALID_LIFECYCLE"),
    references_valid: !has("BROKEN_REFERENCES"),
    replay_metadata_complete: !has("MISSING_REPLAY_METADATA"),
    governance_metadata_complete: !has("MISSING_GOVERNANCE_METADATA"),
    constitutional_metadata_complete: !has("MISSING_CONSTITUTIONAL_METADATA"),
    authority_metadata_complete: !has("MISSING_AUTHORITY_METADATA"),
    tenant_metadata_complete: !has("TENANT_METADATA_MISSING"),
    version_compatible: !has("VERSION_INCOMPATIBILITY"),
    migrations_consistent: !has("MIGRATION_INCONSISTENCY"),
    replay_consistent: !has("REPLAY_INCONSISTENCY"),
    deterministic_validation: !has("NONDETERMINISTIC_VALIDATION"),
    schema_unambiguous: !has("SCHEMA_AMBIGUITY"),
    integrity_verified: !has("INTEGRITY_HASH_MISMATCH"),
    fail_closed: !has("FAIL_OPEN_VALIDATION_BEHAVIOR"),
    authorization_valid: !has("AUTHORIZATION_FAILURE"),
    advisory_only: !has("EXECUTION_AUTHORITY_GRANTED"),
    failures,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function resultReplayHash(result: Omit<FoundationSchemaCertificationResult, "integrity_hash" | "replay_hash">): string {
  return hash({
    schemas: result.schema_validations,
    contract: result.contract_report,
    version: result.version_report,
    consistency: result.consistency_report,
    dependency: result.dependency_report,
    evidence: result.evidence_package,
    report: result.foundation_report,
    ledger: result.foundation_ledger,
    validation: result.validation,
  });
}

export function runFoundationSchemaCertification(input: FoundationSchemaCertificationInput = {}): FoundationSchemaCertificationResult {
  const scenario = input.scenario ?? "BASELINE";
  const role = input.role ?? "OPERATOR";
  const certification_framework = input.certification_framework ?? runCertificationFramework();
  const schema_validations = buildSchemaValidations(certification_framework, scenario);
  const contract_report = buildContractReport(certification_framework, schema_validations, scenario);
  const version_report = buildVersionReport(certification_framework, scenario);
  const consistency_report = buildConsistencyReport(certification_framework, scenario);
  const dependency_report = buildDependencyReport(certification_framework, scenario);
  const evidence_package = buildEvidence(certification_framework, schema_validations, contract_report, version_report, consistency_report, dependency_report, scenario);
  const preFailures = collectFailures({ source: certification_framework, records: schema_validations, contract: contract_report, version: version_report, consistency: consistency_report, dependency: dependency_report, evidence: evidence_package, ledger: [], role, scenario });
  const foundation_report = buildReport(certification_framework, schema_validations, version_report, consistency_report, dependency_report, evidence_package, preFailures, scenario);
  const foundation_ledger = buildLedger(certification_framework, schema_validations, evidence_package, foundation_report, scenario);
  const failures = collectFailures({ source: certification_framework, records: schema_validations, contract: contract_report, version: version_report, consistency: consistency_report, dependency: dependency_report, evidence: evidence_package, ledger: foundation_ledger, role, scenario });
  const validation = buildValidation(failures);
  const base: Omit<FoundationSchemaCertificationResult, "integrity_hash" | "replay_hash"> = {
    certification_version: CERTIFICATION_VERSION,
    certification_framework,
    schema_validations,
    contract_report,
    version_report,
    consistency_report,
    dependency_report,
    evidence_package,
    foundation_report,
    foundation_ledger,
    validation,
    deterministic: true,
    replayable: true,
    advisory_only: true,
    mutates_schemas_or_contracts: false,
    execution_authority_granted: false,
  };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: hashWithoutIntegrity({ ...base, replay_hash }) });
}

export function replayFoundationSchemaCertification(result: FoundationSchemaCertificationResult): boolean {
  return resultReplayHash(result) === result.replay_hash && hashWithoutIntegrity(result) === result.integrity_hash;
}

export function computeFoundationSchemaValidationHash(record: Omit<FoundationSchemaValidationRecord, "integrity_hash"> | FoundationSchemaValidationRecord): string {
  return hashWithoutIntegrity(record);
}

export function getFoundationSchemaCertificationFoundation(): FoundationSchemaCertificationFoundation {
  return Object.freeze({
    certification_version: CERTIFICATION_VERSION,
    scopes: FOUNDATION_SCHEMA_SCOPES,
    checks: FOUNDATION_CERTIFICATION_CHECKS,
    result: runFoundationSchemaCertification(),
  });
}

export const FoundationSchemaCertification = Object.freeze({
  run: runFoundationSchemaCertification,
  replay: replayFoundationSchemaCertification,
});
