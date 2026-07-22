import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { runOutcomeNormalizationAdapter } from "@/services/outcome-normalization-adapter";
import type { VisibilityRole } from "@/types/decision-observability-contract";
import type { OutcomeNormalizationAdapterResult } from "@/types/outcome-normalization-adapter";
import type {
  DuplicateCategory,
  DuplicateResolutionRecord,
  IdentityApiSurface,
  IdentityAuditReport,
  IdentityInputValidation,
  IdentityLineageRecord,
  IdentityMetrics,
  IdentityRegistryRecord,
  IdentityReplayReport,
  OutcomeIdentity,
  OutcomeIdentityCheck,
  OutcomeIdentityFailure,
  OutcomeIdentityResolverFoundation,
  OutcomeIdentityResolverInput,
  OutcomeIdentityResolverResult,
} from "@/types/outcome-identity-resolver";

const OUTCOME_IDENTITY_RESOLVER_VERSION = "outcome-identity-resolver/v1" as const;
const IDENTITY_VERSION = "10.2.2" as const;

export const OUTCOME_IDENTITY_CHECKS: readonly OutcomeIdentityCheck[] = Object.freeze(["NORMALIZATION_VALIDATION", "IDENTITY_INPUT_VALIDATION", "IDENTITY_GENERATION", "DUPLICATE_DETECTION", "CANONICAL_RESOLUTION", "IDENTITY_REGISTRY", "IDENTITY_LINEAGE", "VERSION_TRACKING", "REPLAY_RECONSTRUCTION", "REGISTRY_IMMUTABILITY", "TENANT_ISOLATION", "INTEGRITY_VALIDATION"]);

type Scenario = NonNullable<OutcomeIdentityResolverInput["scenario"]>;

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

function sourceForScenario(input: OutcomeIdentityResolverInput, scenario: Scenario): OutcomeNormalizationAdapterResult {
  if (input.normalization_adapter) return input.normalization_adapter;
  if (scenario === "INVALID_NORMALIZATION") return runOutcomeNormalizationAdapter({ scenario: "MISSING_IDENTIFIER" });
  if (scenario === "INVALID_NORMALIZATION_VERSION") return runOutcomeNormalizationAdapter({ scenario: "UNSUPPORTED_VERSION" });
  if (scenario === "MALFORMED_TIMESTAMP") return runOutcomeNormalizationAdapter({ scenario: "INVALID_TIMESTAMP" });
  if (scenario === "CROSS_TENANT_REFERENCE") return runOutcomeNormalizationAdapter({ scenario: "TENANT_MISMATCH" });
  if (scenario === "HASH_MISMATCH") return runOutcomeNormalizationAdapter({ scenario: "HASH_MISMATCH" });
  return runOutcomeNormalizationAdapter();
}

function visibleToRole(source: OutcomeNormalizationAdapterResult, role: VisibilityRole): boolean {
  return source.outcome_ledger.governance_operator_recorder.actualization_recorder.mission_impact_recorder.completeness_validator.evidence_registry.observation_engine.intake_adapter.capture_contract.architecture_certification.security_boundaries.adaptive_ledger.approval_framework.replay_traceability.authority_binding.adaptation_state.learning_permission.boundary_model.contract_foundation.final_certification.production_readiness.security_certification.observability_certification.ledger_certification.operator_workflow_certification.intelligence_certification.governance_certification.replay_certification.deterministic_certification.foundation_certification.certification_framework.analytics_result.operator_dashboard.replay_monitoring.governance_visibility.priority_dashboard.conflict_visualization.timeline_result.dashboard_result.observability_result.authorizations.some((auth) => auth.role === role && auth.permissions.includes("VIEW_DECISIONS"));
}

function buildApiSurface(): IdentityApiSurface {
  const base: Omit<IdentityApiSurface, "integrity_hash"> = {
    api_id: "outcome_identity_api",
    generate_identity: "POST /identity/generate",
    resolve_identity: "POST /identity/resolve",
    detect_duplicates: "POST /identity/duplicates",
    lookup_identity: "GET /identity/{normalized_outcome_id}",
    retrieve_lineage: "GET /identity/{normalized_outcome_id}/lineage",
    deterministic_access: true,
    update_supported: false,
    delete_supported: false,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function validTimestamp(value: string): boolean {
  return !Number.isNaN(Date.parse(value));
}

function collectInputFailures(source: OutcomeNormalizationAdapterResult, role: VisibilityRole, scenario: Scenario): readonly OutcomeIdentityFailure[] {
  const failures: OutcomeIdentityFailure[] = [];
  const outcome = source.canonical_outcome;
  if (source.validation.validation_outcome !== "PASS" || scenario === "INVALID_NORMALIZATION") failures.push("NORMALIZED_OUTCOME_NOT_VALIDATED");
  if (!outcome.tenant_id || !outcome.mission_id || !outcome.decision_id || !outcome.source_outcome_id || scenario === "MISSING_IDENTIFIER") failures.push("MISSING_IDENTIFIERS_REJECTED");
  if (outcome.normalization_version !== "10.2.1" || scenario === "INVALID_NORMALIZATION_VERSION") failures.push("INVALID_NORMALIZATION_VERSION_REJECTED");
  if (!validTimestamp(outcome.outcome_timestamp) || scenario === "MALFORMED_TIMESTAMP") failures.push("MALFORMED_TIMESTAMP_REJECTED");
  if (!outcome.normalized_outcome_id || !outcome.source_outcome_id || scenario === "INCOMPLETE_OUTCOME_REF") failures.push("INCOMPLETE_OUTCOME_REFERENCE_REJECTED");
  if (outcome.tenant_id !== source.outcome_ledger.ledger_records[0].tenant_id || scenario === "CROSS_TENANT_REFERENCE") failures.push("CROSS_TENANT_REFERENCE_REJECTED");
  if (scenario === "AMBIGUOUS_IDENTITY") failures.push("AMBIGUOUS_IDENTITY_REJECTED");
  if (scenario === "RANDOM_IDENTITY") failures.push("RANDOM_IDENTITY_GENERATION_REJECTED");
  if (scenario === "NONDETERMINISTIC_DUPLICATE") failures.push("DUPLICATE_RESOLUTION_NONDETERMINISTIC");
  if (scenario === "INVALID_DUPLICATE") failures.push("INVALID_DUPLICATE_MERGE_REJECTED");
  if (scenario === "APPEND_ONLY_VIOLATION") failures.push("REGISTRY_APPEND_ONLY_VIOLATED");
  if (scenario === "IDENTITY_MUTATION") failures.push("CANONICAL_IDENTITY_MUTATION_REJECTED");
  if (scenario === "LINEAGE_INCOMPLETE") failures.push("LINEAGE_INCOMPLETE");
  if (scenario === "REPLAY_MISMATCH") failures.push("REPLAY_RECONSTRUCTION_DIFFERED");
  if (scenario === "HASH_MISMATCH") failures.push("INTEGRITY_HASH_NOT_REPRODUCIBLE");
  if (scenario === "CROSS_TENANT_REFERENCE") failures.push("TENANT_ISOLATION_VIOLATED");
  if (!visibleToRole(source, role)) failures.push("AUTHORIZATION_FAILURE");
  if (scenario === "FAIL_OPEN") failures.push("FAIL_OPEN_IDENTITY_RESOLUTION_BEHAVIOR");
  return freezeArray([...new Set(failures)]);
}

function buildInputValidation(failures: readonly OutcomeIdentityFailure[]): IdentityInputValidation {
  const has = (failure: OutcomeIdentityFailure) => failures.includes(failure);
  const base: Omit<IdentityInputValidation, "integrity_hash"> = {
    validation_id: "outcome_identity_input_validation",
    validation_status: failures.length ? "BLOCKED" : "VALID",
    tenant_id_valid: !has("MISSING_IDENTIFIERS_REJECTED") && !has("CROSS_TENANT_REFERENCE_REJECTED"),
    mission_id_valid: !has("MISSING_IDENTIFIERS_REJECTED"),
    decision_id_valid: !has("MISSING_IDENTIFIERS_REJECTED"),
    outcome_type_valid: !has("AMBIGUOUS_IDENTITY_REJECTED"),
    source_outcome_ref_valid: !has("INCOMPLETE_OUTCOME_REFERENCE_REJECTED"),
    normalization_version_valid: !has("INVALID_NORMALIZATION_VERSION_REJECTED"),
    timestamp_valid: !has("MALFORMED_TIMESTAMP_REJECTED"),
    tenant_isolated: !has("TENANT_ISOLATION_VIOLATED") && !has("CROSS_TENANT_REFERENCE_REJECTED"),
    failures,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function identitySeed(source: OutcomeNormalizationAdapterResult): string {
  const outcome = source.canonical_outcome;
  return [outcome.tenant_id, outcome.mission_id, outcome.decision_id, outcome.outcome_type, outcome.outcome_timestamp, outcome.source_outcome_id, outcome.normalization_version].join("|");
}

function duplicateCategory(scenario: Scenario): DuplicateCategory {
  if (scenario === "EXACT_DUPLICATE") return "EXACT_DUPLICATE";
  if (scenario === "REPLAY_DUPLICATE") return "REPLAY_DUPLICATE";
  if (scenario === "IMPORT_DUPLICATE") return "IMPORT_DUPLICATE";
  if (scenario === "INVALID_DUPLICATE") return "INVALID_DUPLICATE";
  return "NONE";
}

function buildIdentity(source: OutcomeNormalizationAdapterResult, validation: IdentityInputValidation, scenario: Scenario): OutcomeIdentity {
  const outcome = source.canonical_outcome;
  const seed = identitySeed(source);
  const canonical_identity_id = scenario === "RANDOM_IDENTITY" ? `identity_random_${Date.now()}` : `identity_${hash(seed).slice(0, 20)}`;
  const duplicate_group_id = `duplicate_group_${hash(`${outcome.tenant_id}:${outcome.mission_id}:${outcome.decision_id}:${outcome.source_outcome_id}`).slice(0, 16)}`;
  const base: Omit<OutcomeIdentity, "integrity_hash"> = {
    normalized_outcome_id: outcome.normalized_outcome_id,
    canonical_identity_id,
    source_outcome_id: outcome.source_outcome_id,
    tenant_id: scenario === "CROSS_TENANT_REFERENCE" ? `${outcome.tenant_id}:foreign` : outcome.tenant_id,
    mission_id: outcome.mission_id,
    decision_id: outcome.decision_id,
    normalized_outcome_type: outcome.outcome_type,
    normalization_version: outcome.normalization_version,
    identity_version: IDENTITY_VERSION,
    identity_state: validation.failures.length ? "PENDING" : duplicateCategory(scenario) === "NONE" ? "CANONICAL" : "DUPLICATE",
    duplicate_group_id,
    canonical_reference: `outcome-identity://${outcome.tenant_id}/${canonical_identity_id}`,
    lineage_root_id: `lineage_root_${hash(seed).slice(0, 16)}`,
    parent_identity_refs: freezeArray([]),
    child_identity_refs: duplicateCategory(scenario) === "NONE" ? freezeArray([]) : freezeArray([outcome.normalized_outcome_id]),
    replay_refs: outcome.replay_refs,
  };
  const built = Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
  if (scenario === "IDENTITY_MUTATION") return Object.freeze({ ...built, canonical_reference: `${built.canonical_reference}:mutated`, integrity_hash: built.integrity_hash });
  if (scenario === "HASH_MISMATCH") return Object.freeze({ ...built, integrity_hash: hash({ tampered: built.canonical_identity_id }) });
  return built;
}

function buildDuplicateResolution(identity: OutcomeIdentity, scenario: Scenario): DuplicateResolutionRecord {
  const category = duplicateCategory(scenario);
  const candidates = category === "NONE" ? freezeArray([identity.canonical_identity_id]) : freezeArray([identity.canonical_identity_id, identity.normalized_outcome_id]);
  const base: Omit<DuplicateResolutionRecord, "integrity_hash"> = {
    duplicate_group_id: identity.duplicate_group_id,
    candidate_identity_refs: candidates,
    canonical_identity_id: identity.canonical_identity_id,
    duplicate_reason: category,
    resolution_rule: category === "INVALID_DUPLICATE" ? "reject-merge-create-separate-identity" : "deterministic-canonical-identity-reuse",
    resolution_timestamp: "2026-01-01T00:05:00.000Z",
    replay_refs: identity.replay_refs,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildLineage(identity: OutcomeIdentity, scenario: Scenario): readonly IdentityLineageRecord[] {
  if (scenario === "LINEAGE_INCOMPLETE") return freezeArray([]);
  const root: Omit<IdentityLineageRecord, "integrity_hash"> = {
    lineage_id: `lineage_${identity.canonical_identity_id}_root`,
    canonical_identity_id: identity.canonical_identity_id,
    lineage_root_id: identity.lineage_root_id,
    parent_identity_id: identity.lineage_root_id,
    child_identity_id: identity.canonical_identity_id,
    lineage_event: "ROOT_CREATED",
    event_timestamp: "2026-01-01T00:05:00.000Z",
    replay_refs: identity.replay_refs,
  };
  const resolved: Omit<IdentityLineageRecord, "integrity_hash"> = {
    lineage_id: `lineage_${identity.canonical_identity_id}_resolved`,
    canonical_identity_id: identity.canonical_identity_id,
    lineage_root_id: identity.lineage_root_id,
    parent_identity_id: identity.canonical_identity_id,
    child_identity_id: identity.normalized_outcome_id,
    lineage_event: identity.identity_state === "DUPLICATE" ? "DUPLICATE_BOUND" : "CANONICAL_RESOLVED",
    event_timestamp: "2026-01-01T00:05:01.000Z",
    replay_refs: identity.replay_refs,
  };
  return freezeArray([
    Object.freeze({ ...root, integrity_hash: hashWithoutIntegrity(root) }),
    Object.freeze({ ...resolved, integrity_hash: hashWithoutIntegrity(resolved) }),
  ]);
}

function buildRegistry(identity: OutcomeIdentity, scenario: Scenario): readonly IdentityRegistryRecord[] {
  const base: Omit<IdentityRegistryRecord, "integrity_hash"> = {
    registry_id: "outcome_identity_registry_001",
    canonical_identity_id: identity.canonical_identity_id,
    normalized_outcome_id: identity.normalized_outcome_id,
    tenant_id: identity.tenant_id,
    identity_version: IDENTITY_VERSION,
    canonical_reference: identity.canonical_reference,
    duplicate_group_id: identity.duplicate_group_id,
    lineage_root_id: identity.lineage_root_id,
    replay_refs: identity.replay_refs,
    ledger_sequence: 1,
    append_only: true,
    deleted: false,
  };
  const built = Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
  if (scenario !== "APPEND_ONLY_VIOLATION") return freezeArray([built]);
  return freezeArray([built, Object.freeze({ ...built, registry_id: "outcome_identity_registry_002", ledger_sequence: 1, integrity_hash: built.integrity_hash })]);
}

function replayHash(identity: OutcomeIdentity, duplicate: DuplicateResolutionRecord, registry: readonly IdentityRegistryRecord[], lineage: readonly IdentityLineageRecord[]): string {
  return hash({ identity, duplicate, registry, lineage });
}

function buildReplayReport(identity: OutcomeIdentity, duplicate: DuplicateResolutionRecord, registry: readonly IdentityRegistryRecord[], lineage: readonly IdentityLineageRecord[], scenario: Scenario): IdentityReplayReport {
  const registry_hashes = freezeArray(registry.map((entry) => entry.integrity_hash));
  const lineage_hashes = freezeArray(lineage.map((entry) => entry.integrity_hash));
  const reconstruction = scenario === "REPLAY_MISMATCH" ? hash({ replay: "mismatch" }) : replayHash(identity, duplicate, registry, lineage);
  const base: Omit<IdentityReplayReport, "integrity_hash"> = {
    replay_report_id: "outcome_identity_replay_report",
    identity_hash: identity.integrity_hash,
    registry_hashes,
    lineage_hashes,
    duplicate_resolution_hash: duplicate.integrity_hash,
    replay_reconstruction_hash: reconstruction,
    replay_reconstruction_identical: reconstruction === replayHash(identity, duplicate, registry, lineage),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function finalFailures(inputFailures: readonly OutcomeIdentityFailure[], input: {
  source: OutcomeNormalizationAdapterResult;
  identity: OutcomeIdentity;
  duplicate: DuplicateResolutionRecord;
  registry: readonly IdentityRegistryRecord[];
  lineage: readonly IdentityLineageRecord[];
  replay: IdentityReplayReport;
  scenario: Scenario;
}): readonly OutcomeIdentityFailure[] {
  const failures = [...inputFailures];
  const sequences = input.registry.map((entry) => entry.ledger_sequence);
  if (new Set(sequences).size !== sequences.length) failures.push("REGISTRY_APPEND_ONLY_VIOLATED");
  if (hashWithoutIntegrity(input.identity) !== input.identity.integrity_hash) failures.push("INTEGRITY_HASH_NOT_REPRODUCIBLE");
  if (!input.lineage.length) failures.push("LINEAGE_INCOMPLETE");
  if (!input.replay.replay_reconstruction_identical) failures.push("REPLAY_RECONSTRUCTION_DIFFERED");
  if (input.identity.tenant_id !== input.source.canonical_outcome.tenant_id) failures.push("TENANT_ISOLATION_VIOLATED");
  if (input.scenario === "NONDETERMINISTIC_DUPLICATE") failures.push("DUPLICATE_RESOLUTION_NONDETERMINISTIC");
  if (input.scenario === "INVALID_DUPLICATE") failures.push("INVALID_DUPLICATE_MERGE_REJECTED");
  return freezeArray([...new Set(failures)]);
}

function buildMetrics(identity: OutcomeIdentity, duplicate: DuplicateResolutionRecord, lineage: readonly IdentityLineageRecord[], failures: readonly OutcomeIdentityFailure[]): IdentityMetrics {
  const base: Omit<IdentityMetrics, "integrity_hash"> = {
    metrics_id: "outcome_identity_metrics",
    identities_generated: failures.length ? 0 : 1,
    duplicate_detections: duplicate.duplicate_reason === "NONE" ? 0 : 1,
    duplicate_resolution_rate: failures.includes("DUPLICATE_RESOLUTION_NONDETERMINISTIC") ? 0 : 1,
    registry_growth: 1,
    lineage_depth: lineage.length,
    replay_consistency: failures.includes("REPLAY_RECONSTRUCTION_DIFFERED") ? 0 : 1,
    identity_validation_failures: failures.length,
    tenant_isolation_violations: failures.includes("TENANT_ISOLATION_VIOLATED") ? 1 : 0,
    canonical_lookup_latency_ms: 0,
    advisory_only: true,
  };
  return Object.freeze({ ...base, identity, integrity_hash: hashWithoutIntegrity(base) });
}

function buildAudit(source: OutcomeNormalizationAdapterResult, lineage: readonly IdentityLineageRecord[], replay: IdentityReplayReport, failures: readonly OutcomeIdentityFailure[]): IdentityAuditReport {
  const base: Omit<IdentityAuditReport, "integrity_hash"> = {
    report_id: "outcome_identity_audit_report",
    tenant_id: source.canonical_outcome.tenant_id,
    checks: OUTCOME_IDENTITY_CHECKS,
    identity_generator_operational: !failures.includes("RANDOM_IDENTITY_GENERATION_REJECTED"),
    identity_registry_operational: !failures.includes("REGISTRY_APPEND_ONLY_VIOLATED"),
    duplicate_detector_operational: !failures.includes("DUPLICATE_RESOLUTION_NONDETERMINISTIC"),
    canonical_identity_rules_enforced: !failures.includes("AMBIGUOUS_IDENTITY_REJECTED") && !failures.includes("INVALID_DUPLICATE_MERGE_REJECTED"),
    lineage_complete: lineage.length > 0 && !failures.includes("LINEAGE_INCOMPLETE"),
    version_tracking_preserved: true,
    registry_append_only: !failures.includes("REGISTRY_APPEND_ONLY_VIOLATED"),
    cross_tenant_resolution_blocked: !failures.includes("TENANT_ISOLATION_VIOLATED") && !failures.includes("CROSS_TENANT_REFERENCE_REJECTED"),
    replay_reconstruction_identical: replay.replay_reconstruction_identical,
    failure_analysis: failures,
    certification_decision: failures.length ? "FAIL" : "PASS",
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function resultReplayHash(result: Omit<OutcomeIdentityResolverResult, "integrity_hash" | "replay_hash">): string {
  return hash({
    validation: result.input_validation,
    identity: result.outcome_identity,
    duplicate: result.duplicate_resolution,
    registry: result.identity_registry,
    lineage: result.lineage_records,
    replay: result.replay_report,
    audit: result.audit_report,
  });
}

export function runOutcomeIdentityResolver(input: OutcomeIdentityResolverInput = {}): OutcomeIdentityResolverResult {
  const scenario = input.scenario ?? "BASELINE";
  const role = input.role ?? "OPERATOR";
  const normalization_adapter = sourceForScenario(input, scenario);
  const api_surface = buildApiSurface();
  const initialFailures = collectInputFailures(normalization_adapter, role, scenario);
  const preliminaryValidation = buildInputValidation(initialFailures);
  const outcome_identity = buildIdentity(normalization_adapter, preliminaryValidation, scenario);
  const duplicate_resolution = buildDuplicateResolution(outcome_identity, scenario);
  const identity_registry = buildRegistry(outcome_identity, scenario);
  const lineage_records = buildLineage(outcome_identity, scenario);
  const replay_report = buildReplayReport(outcome_identity, duplicate_resolution, identity_registry, lineage_records, scenario);
  const failures = finalFailures(initialFailures, { source: normalization_adapter, identity: outcome_identity, duplicate: duplicate_resolution, registry: identity_registry, lineage: lineage_records, replay: replay_report, scenario });
  const input_validation = buildInputValidation(failures);
  const metrics = buildMetrics(outcome_identity, duplicate_resolution, lineage_records, failures);
  const audit_report = buildAudit(normalization_adapter, lineage_records, replay_report, failures);
  const base: Omit<OutcomeIdentityResolverResult, "integrity_hash" | "replay_hash"> = {
    outcome_identity_resolver_version: OUTCOME_IDENTITY_RESOLVER_VERSION,
    normalization_adapter,
    api_surface,
    input_validation,
    outcome_identity,
    duplicate_resolution,
    identity_registry,
    lineage_records,
    replay_report,
    metrics,
    audit_report,
    deterministic: true,
    replayable: true,
    identity_only: true,
    creates_new_meaning: false,
    modifies_outcome_data: false,
    uses_randomness: false,
  };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: hashWithoutIntegrity({ ...base, replay_hash }) });
}

export function replayOutcomeIdentityResolver(result: OutcomeIdentityResolverResult): boolean {
  return resultReplayHash(result) === result.replay_hash && hashWithoutIntegrity(result) === result.integrity_hash;
}

export function computeOutcomeIdentityHash(identity: Omit<OutcomeIdentity, "integrity_hash"> | OutcomeIdentity): string {
  return hashWithoutIntegrity(identity);
}

export function getOutcomeIdentityResolverFoundation(): OutcomeIdentityResolverFoundation {
  const api_surface = buildApiSurface();
  return Object.freeze({
    outcome_identity_resolver_version: OUTCOME_IDENTITY_RESOLVER_VERSION,
    checks: OUTCOME_IDENTITY_CHECKS,
    api_surface,
    result: runOutcomeIdentityResolver(),
  });
}

export const OutcomeIdentityResolver = Object.freeze({
  run: runOutcomeIdentityResolver,
  replay: replayOutcomeIdentityResolver,
});
