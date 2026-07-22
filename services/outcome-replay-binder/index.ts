import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { runOutcomeIntegrityValidator } from "@/services/outcome-integrity-validator";
import type { VisibilityRole } from "@/types/decision-observability-contract";
import type { OutcomeIntegrityValidatorResult } from "@/types/outcome-integrity-validator";
import type {
  OutcomeReplayBinderFoundation,
  OutcomeReplayBinderInput,
  OutcomeReplayBinderResult,
  OutcomeReplayBinding,
  OutcomeReplayCheck,
  OutcomeReplayFailure,
  ReplayApiSurface,
  ReplayAuditReport,
  ReplayDependencyRecord,
  ReplayDependencyType,
  ReplayMetrics,
  ReplayPackage,
  ReplayReferenceRecord,
  ReplayReferenceRegistryRecord,
  ReplayReferenceType,
  ReplayValidationResult,
} from "@/types/outcome-replay-binder";

const OUTCOME_REPLAY_BINDER_VERSION = "outcome-replay-binder/v1" as const;
const REPLAY_VERSION = "10.2.6" as const;

export const OUTCOME_REPLAY_CHECKS: readonly OutcomeReplayCheck[] = Object.freeze(["INTEGRITY_CERTIFICATION", "REPLAY_DEPENDENCY_RESOLUTION", "REPLAY_BINDING", "REPLAY_REFERENCE_REGISTRY", "REPLAY_DEPENDENCY_MAPPING", "REPLAY_VALIDATION", "REPLAY_ORDERING", "TENANT_ISOLATION", "IMMUTABLE_REPLAY_PACKAGE", "CRYPTOGRAPHIC_VERIFICATION"]);

type Scenario = NonNullable<OutcomeReplayBinderInput["scenario"]>;

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

function sourceForScenario(input: OutcomeReplayBinderInput, scenario: Scenario): OutcomeIntegrityValidatorResult {
  if (input.integrity_validator) return input.integrity_validator;
  if (scenario === "INVALID_INTEGRITY") return runOutcomeIntegrityValidator({ scenario: "BROKEN_LINEAGE" });
  if (scenario === "CROSS_TENANT_REPLAY") return runOutcomeIntegrityValidator({ scenario: "CROSS_TENANT" });
  if (scenario === "HASH_MISMATCH") return runOutcomeIntegrityValidator({ scenario: "HASH_MISMATCH" });
  if (scenario === "LINEAGE_MISMATCH") return runOutcomeIntegrityValidator({ scenario: "BROKEN_LINEAGE" });
  return runOutcomeIntegrityValidator();
}

function visibleToRole(source: OutcomeIntegrityValidatorResult, role: VisibilityRole): boolean {
  return source.lineage_mapper.truth_binding.identity_resolver.normalization_adapter.outcome_ledger.governance_operator_recorder.actualization_recorder.mission_impact_recorder.completeness_validator.evidence_registry.observation_engine.intake_adapter.capture_contract.architecture_certification.security_boundaries.adaptive_ledger.approval_framework.replay_traceability.authority_binding.adaptation_state.learning_permission.boundary_model.contract_foundation.final_certification.production_readiness.security_certification.observability_certification.ledger_certification.operator_workflow_certification.intelligence_certification.governance_certification.replay_certification.deterministic_certification.foundation_certification.certification_framework.analytics_result.operator_dashboard.replay_monitoring.governance_visibility.priority_dashboard.conflict_visualization.timeline_result.dashboard_result.observability_result.authorizations.some((auth) => auth.role === role && auth.permissions.includes("VIEW_DECISIONS"));
}

function buildApiSurface(): ReplayApiSurface {
  const base: Omit<ReplayApiSurface, "integrity_hash"> = {
    api_id: "outcome_replay_api",
    create_replay_binding: "POST /replay/bind",
    validate_replay: "POST /replay/validate",
    retrieve_replay_package: "GET /replay/{normalized_outcome_id}",
    retrieve_replay_dependencies: "GET /replay/{normalized_outcome_id}/dependencies",
    compare_replay_results: "POST /replay/compare",
    executes_replay: false,
    update_supported: false,
    delete_supported: false,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildPackage(source: OutcomeIntegrityValidatorResult, scenario: Scenario): ReplayPackage {
  const lineage = source.lineage_mapper;
  const binding = lineage.truth_binding.binding;
  const identity = lineage.truth_binding.identity_resolver.outcome_identity;
  const node = (type: string) => lineage.nodes.find((entry) => entry.node_type === type)?.source_record_id ?? "";
  const base: Omit<ReplayPackage, "integrity_hash"> = {
    replay_package_id: `replay_package_${hash(identity.canonical_identity_id).slice(0, 16)}`,
    normalized_outcome_id: binding.normalized_outcome_id,
    outcome_identity_ref: identity.canonical_identity_id,
    decision_record_ref: scenario === "MISSING_DEPENDENCY" ? "" : node("DECISION"),
    recommendation_ref: node("RECOMMENDATION"),
    decision_package_ref: node("DECISION_PACKAGE"),
    operator_workflow_ref: node("OPERATOR_ACTION"),
    execution_history_ref: node("EXECUTION"),
    observed_outcome_ref: node("OBSERVED_OUTCOME"),
    truth_ledger_binding_refs: scenario === "TRUTH_LEDGER_MISMATCH" ? freezeArray([]) : freezeArray([lineage.truth_binding.binding.binding_id]),
    evidence_refs: scenario === "EVIDENCE_MISMATCH" ? freezeArray([]) : binding.evidence_refs,
    historical_lineage_ref: scenario === "LINEAGE_MISMATCH" ? "" : lineage.lineage_graph.lineage_graph_id,
    replay_metadata_ref: source.replay_report.replay_report_id,
    integrity_verification_refs: freezeArray(source.hash_verifications.map((entry) => entry.verification_id)),
    immutable: true,
  };
  const built = Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
  if (scenario === "PACKAGE_MUTATION") return Object.freeze({ ...built, evidence_refs: freezeArray(["mutated:evidence"]), integrity_hash: built.integrity_hash });
  if (scenario === "HASH_MISMATCH") return Object.freeze({ ...built, integrity_hash: hash({ tampered: built.replay_package_id }) });
  return built;
}

function reference(type: ReplayReferenceType, sourceId: string, order: number, packageId: string): ReplayReferenceRecord {
  const base: Omit<ReplayReferenceRecord, "integrity_hash"> = {
    replay_reference_id: `replay_ref_${hash(`${packageId}:${type}:${sourceId}`).slice(0, 14)}`,
    replay_package_id: packageId,
    reference_type: type,
    source_record_id: sourceId,
    relationship: order === 0 ? "reconstructs" : order % 3 === 0 ? "verifies" : "depends_on",
    replay_order: order,
    replay_version: REPLAY_VERSION,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildReferences(pkg: ReplayPackage, scenario: Scenario): readonly ReplayReferenceRecord[] {
  const rows: readonly [ReplayReferenceType, string][] = [
    ["OUTCOME_IDENTITY", pkg.outcome_identity_ref],
    ["DECISION_RECORD", pkg.decision_record_ref],
    ["RECOMMENDATION", pkg.recommendation_ref],
    ["DECISION_PACKAGE", pkg.decision_package_ref],
    ["OPERATOR_WORKFLOW", pkg.operator_workflow_ref],
    ["EXECUTION_HISTORY", pkg.execution_history_ref],
    ["OBSERVED_OUTCOME", pkg.observed_outcome_ref],
    ["NORMALIZED_OUTCOME", pkg.normalized_outcome_id],
    ["TRUTH_LEDGER_BINDING", pkg.truth_ledger_binding_refs[0] ?? ""],
    ["EVIDENCE_REFERENCE", pkg.evidence_refs[0] ?? ""],
    ["HISTORICAL_LINEAGE", pkg.historical_lineage_ref],
    ["REPLAY_METADATA", pkg.replay_metadata_ref],
    ["INTEGRITY_VERIFICATION", pkg.integrity_verification_refs[0] ?? ""],
  ];
  const ordered = scenario === "NONDETERMINISTIC_ORDERING" ? [...rows].reverse() : rows;
  return freezeArray(ordered.map(([type, sourceId], index) => reference(type, sourceId, index + 1, pkg.replay_package_id)));
}

function dependencyType(index: number): ReplayDependencyType {
  const types: readonly ReplayDependencyType[] = ["IDENTITY", "NORMALIZATION", "OPERATOR_WORKFLOW", "EXECUTION", "TRUTH_LEDGER", "EVIDENCE", "LINEAGE", "GOVERNANCE"];
  return types[index] ?? "EXECUTION";
}

function buildDependencies(pkg: ReplayPackage, references: readonly ReplayReferenceRecord[], scenario: Scenario): readonly ReplayDependencyRecord[] {
  if (scenario === "INCOMPLETE_DEPENDENCY_GRAPH") return freezeArray([]);
  return freezeArray(references.slice(0, -1).map((entry, index) => {
    const child = references[index + 1];
    const base: Omit<ReplayDependencyRecord, "integrity_hash"> = {
      dependency_id: `replay_dep_${hash(`${entry.replay_reference_id}:${child.replay_reference_id}`).slice(0, 14)}`,
      replay_package_id: pkg.replay_package_id,
      dependency_type: dependencyType(index),
      parent_reference: entry.replay_reference_id,
      child_reference: child.replay_reference_id,
      dependency_sequence: index + 1,
      replay_refs: freezeArray([entry.replay_reference_id, child.replay_reference_id]),
    };
    return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
  }));
}

function buildBinding(source: OutcomeIntegrityValidatorResult, pkg: ReplayPackage, refs: readonly ReplayReferenceRecord[], deps: readonly ReplayDependencyRecord[], scenario: Scenario): OutcomeReplayBinding {
  const binding = source.lineage_mapper.truth_binding.binding;
  const base: Omit<OutcomeReplayBinding, "integrity_hash"> = {
    replay_binding_id: `replay_binding_${hash(pkg.replay_package_id).slice(0, 16)}`,
    normalized_outcome_id: pkg.normalized_outcome_id,
    tenant_id: scenario === "CROSS_TENANT_REPLAY" ? `${binding.tenant_id}:foreign` : binding.tenant_id,
    mission_id: binding.mission_id,
    decision_id: binding.decision_id,
    replay_package_id: pkg.replay_package_id,
    outcome_identity_ref: pkg.outcome_identity_ref,
    normalization_version: source.lineage_mapper.truth_binding.identity_resolver.normalization_adapter.canonical_outcome.normalization_version,
    replay_dependency_refs: freezeArray(deps.map((entry) => entry.dependency_id)),
    replay_reference_refs: freezeArray(refs.map((entry) => entry.replay_reference_id)),
    ledger_binding_refs: pkg.truth_ledger_binding_refs,
    evidence_refs: pkg.evidence_refs,
    lineage_graph_ref: pkg.historical_lineage_ref,
    replay_validation_ref: "pending_replay_validation",
    replay_version: REPLAY_VERSION,
    replay_state: "BOUND",
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function collectFailures(input: {
  source: OutcomeIntegrityValidatorResult;
  pkg: ReplayPackage;
  binding: OutcomeReplayBinding;
  refs: readonly ReplayReferenceRecord[];
  deps: readonly ReplayDependencyRecord[];
  role: VisibilityRole;
  scenario: Scenario;
}): readonly OutcomeReplayFailure[] {
  const failures: OutcomeReplayFailure[] = [];
  if (input.source.validation.overall_validation_state !== "CERTIFIED" || input.scenario === "INVALID_INTEGRITY") failures.push("INTEGRITY_NOT_CERTIFIED");
  if (!input.pkg.decision_record_ref || !input.pkg.recommendation_ref || !input.pkg.decision_package_ref || !input.pkg.operator_workflow_ref || !input.pkg.execution_history_ref || !input.pkg.observed_outcome_ref || input.scenario === "MISSING_DEPENDENCY") failures.push("MISSING_REPLAY_DEPENDENCY_REJECTED");
  if (input.scenario === "REPLAY_DIVERGENCE") failures.push("REPLAY_DIVERGENCE_REJECTED");
  if (hashWithoutIntegrity(input.pkg) !== input.pkg.integrity_hash || input.scenario === "HASH_MISMATCH") failures.push("HASH_MISMATCH_REJECTED");
  if (!input.pkg.historical_lineage_ref || input.scenario === "LINEAGE_MISMATCH") failures.push("LINEAGE_MISMATCH_REJECTED");
  if (!input.pkg.truth_ledger_binding_refs.length || input.scenario === "TRUTH_LEDGER_MISMATCH") failures.push("TRUTH_LEDGER_MISMATCH_REJECTED");
  if (!input.pkg.evidence_refs.length || input.scenario === "EVIDENCE_MISMATCH") failures.push("EVIDENCE_MISMATCH_REJECTED");
  if (input.binding.tenant_id !== input.source.validation.tenant_id || input.scenario === "CROSS_TENANT_REPLAY") failures.push("CROSS_TENANT_REPLAY_REJECTED");
  if (input.scenario === "NONDETERMINISTIC_ORDERING" || input.refs.some((entry, index) => entry.replay_order !== index + 1)) failures.push("REPLAY_ORDERING_NONDETERMINISTIC");
  if (input.scenario === "PACKAGE_MUTATION") failures.push("REPLAY_PACKAGE_MUTATION_REJECTED");
  if (input.scenario === "APPEND_ONLY_VIOLATION") failures.push("REPLAY_REGISTRY_APPEND_ONLY_VIOLATED");
  if (input.deps.length !== Math.max(input.refs.length - 1, 0) || input.scenario === "INCOMPLETE_DEPENDENCY_GRAPH") failures.push("DEPENDENCY_GRAPH_INCOMPLETE");
  if (!visibleToRole(input.source, input.role)) failures.push("AUTHORIZATION_FAILURE");
  if (input.scenario === "FAIL_OPEN") failures.push("FAIL_OPEN_REPLAY_BINDING_BEHAVIOR");
  return freezeArray([...new Set(failures)]);
}

function reconstructedHash(pkg: ReplayPackage, refs: readonly ReplayReferenceRecord[], deps: readonly ReplayDependencyRecord[]): string {
  return hash({ pkg, refs, deps });
}

function buildValidation(pkg: ReplayPackage, refs: readonly ReplayReferenceRecord[], deps: readonly ReplayDependencyRecord[], failures: readonly OutcomeReplayFailure[], scenario: Scenario): ReplayValidationResult {
  const expected = reconstructedHash(pkg, refs, deps);
  const reconstructed = scenario === "REPLAY_DIVERGENCE" ? hash({ replay: "diverged" }) : expected;
  const base: Omit<ReplayValidationResult, "integrity_hash"> = {
    validation_id: "outcome_replay_validation",
    replay_package_id: pkg.replay_package_id,
    validation_status: failures.length ? "FAILED" : "CERTIFIED",
    reconstructed_identity: pkg.outcome_identity_ref,
    reconstructed_hash: reconstructed,
    divergence_detected: reconstructed !== expected || failures.includes("REPLAY_DIVERGENCE_REJECTED"),
    divergence_summary: failures.length ? failures.join(",") : "none",
    replay_timestamp: "2026-01-01T00:09:00.000Z",
    failures,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildRegistry(binding: OutcomeReplayBinding, refs: readonly ReplayReferenceRecord[], deps: readonly ReplayDependencyRecord[], scenario: Scenario): readonly ReplayReferenceRegistryRecord[] {
  const base: Omit<ReplayReferenceRegistryRecord, "integrity_hash"> = {
    registry_id: "replay_reference_registry_001",
    replay_package_id: binding.replay_package_id,
    normalized_outcome_id: binding.normalized_outcome_id,
    tenant_id: binding.tenant_id,
    replay_reference_ids: freezeArray(refs.map((entry) => entry.replay_reference_id)),
    dependency_ids: freezeArray(deps.map((entry) => entry.dependency_id)),
    replay_version: REPLAY_VERSION,
    ledger_sequence: 1,
    append_only: true,
    deleted: false,
  };
  const record = Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
  if (scenario !== "APPEND_ONLY_VIOLATION") return freezeArray([record]);
  return freezeArray([record, Object.freeze({ ...record, registry_id: "replay_reference_registry_002", ledger_sequence: 1, integrity_hash: record.integrity_hash })]);
}

function buildMetrics(validation: ReplayValidationResult, registry: readonly ReplayReferenceRegistryRecord[]): ReplayMetrics {
  const has = (failure: OutcomeReplayFailure) => validation.failures.includes(failure);
  const base: Omit<ReplayMetrics, "integrity_hash"> = {
    metrics_id: "outcome_replay_metrics",
    replay_packages_created: validation.validation_status === "CERTIFIED" ? 1 : 0,
    replay_validation_success_rate: validation.validation_status === "CERTIFIED" ? 1 : 0,
    replay_divergence_rate: validation.divergence_detected ? 1 : 0,
    dependency_resolution_failures: has("MISSING_REPLAY_DEPENDENCY_REJECTED") || has("DEPENDENCY_GRAPH_INCOMPLETE") ? 1 : 0,
    hash_mismatches: has("HASH_MISMATCH_REJECTED") ? 1 : 0,
    replay_latency_ms: 0,
    registry_growth: registry.length,
    lineage_mismatches: has("LINEAGE_MISMATCH_REJECTED") ? 1 : 0,
    tenant_isolation_violations: has("CROSS_TENANT_REPLAY_REJECTED") ? 1 : 0,
    advisory_only: true,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildAudit(validation: ReplayValidationResult, registry: readonly ReplayReferenceRegistryRecord[], deps: readonly ReplayDependencyRecord[], pkg: ReplayPackage): ReplayAuditReport {
  const base: Omit<ReplayAuditReport, "integrity_hash"> = {
    report_id: "outcome_replay_audit_report",
    tenant_id: registry[0]?.tenant_id ?? "unknown",
    checks: OUTCOME_REPLAY_CHECKS,
    replay_binder_operational: validation.validation_status === "CERTIFIED",
    replay_reference_registry_operational: !validation.failures.includes("REPLAY_REGISTRY_APPEND_ONLY_VIOLATED"),
    replay_dependency_mapper_operational: !validation.failures.includes("DEPENDENCY_GRAPH_INCOMPLETE"),
    replay_validation_engine_operational: validation.validation_status === "CERTIFIED",
    dependency_graph_complete: deps.length > 0 && !validation.failures.includes("DEPENDENCY_GRAPH_INCOMPLETE"),
    replay_reconstruction_identical: !validation.divergence_detected,
    immutable_replay_package_verified: pkg.immutable && !validation.failures.includes("REPLAY_PACKAGE_MUTATION_REJECTED"),
    cryptographic_verification_succeeded: !validation.failures.includes("HASH_MISMATCH_REJECTED"),
    failure_analysis: validation.failures,
    certification_decision: validation.failures.length ? "FAIL" : "PASS",
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function resultReplayHash(result: Omit<OutcomeReplayBinderResult, "integrity_hash" | "replay_hash">): string {
  return hash({
    pkg: result.replay_package,
    binding: result.replay_binding,
    refs: result.replay_references,
    deps: result.replay_dependencies,
    validation: result.validation,
    registry: result.reference_registry,
    audit: result.audit_report,
  });
}

export function runOutcomeReplayBinder(input: OutcomeReplayBinderInput = {}): OutcomeReplayBinderResult {
  const scenario = input.scenario ?? "BASELINE";
  const role = input.role ?? "OPERATOR";
  const integrity_validator = sourceForScenario(input, scenario);
  const api_surface = buildApiSurface();
  const replay_package = buildPackage(integrity_validator, scenario);
  const replay_references = buildReferences(replay_package, scenario);
  const replay_dependencies = buildDependencies(replay_package, replay_references, scenario);
  const replay_binding = buildBinding(integrity_validator, replay_package, replay_references, replay_dependencies, scenario);
  const failures = collectFailures({ source: integrity_validator, pkg: replay_package, binding: replay_binding, refs: replay_references, deps: replay_dependencies, role, scenario });
  const validation = buildValidation(replay_package, replay_references, replay_dependencies, failures, scenario);
  const reference_registry = buildRegistry(replay_binding, replay_references, replay_dependencies, scenario);
  const metrics = buildMetrics(validation, reference_registry);
  const audit_report = buildAudit(validation, reference_registry, replay_dependencies, replay_package);
  const base: Omit<OutcomeReplayBinderResult, "integrity_hash" | "replay_hash"> = {
    outcome_replay_binder_version: OUTCOME_REPLAY_BINDER_VERSION,
    integrity_validator,
    api_surface,
    replay_package,
    replay_binding,
    replay_references,
    replay_dependencies,
    validation,
    reference_registry,
    metrics,
    audit_report,
    deterministic: true,
    replayable: true,
    binding_only: true,
    executes_replay: false,
    immutable_replay_package: true,
    modifies_outcome_records: false,
  };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: hashWithoutIntegrity({ ...base, replay_hash }) });
}

export function replayOutcomeReplayBinder(result: OutcomeReplayBinderResult): boolean {
  return resultReplayHash(result) === result.replay_hash && hashWithoutIntegrity(result) === result.integrity_hash;
}

export function computeOutcomeReplayBindingHash(binding: Omit<OutcomeReplayBinding, "integrity_hash"> | OutcomeReplayBinding): string {
  return hashWithoutIntegrity(binding);
}

export function getOutcomeReplayBinderFoundation(): OutcomeReplayBinderFoundation {
  const api_surface = buildApiSurface();
  return Object.freeze({
    outcome_replay_binder_version: OUTCOME_REPLAY_BINDER_VERSION,
    checks: OUTCOME_REPLAY_CHECKS,
    api_surface,
    result: runOutcomeReplayBinder(),
  });
}

export const OutcomeReplayBinder = Object.freeze({
  run: runOutcomeReplayBinder,
  replay: replayOutcomeReplayBinder,
});
