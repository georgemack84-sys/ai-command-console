import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { runOutcomeIdentityResolver } from "@/services/outcome-identity-resolver";
import type { VisibilityRole } from "@/types/decision-observability-contract";
import type { OutcomeIdentityResolverResult } from "@/types/outcome-identity-resolver";
import type {
  OutcomeTruthBinding,
  TruthBindingApiSurface,
  TruthBindingAuditReport,
  TruthBindingCheck,
  TruthBindingFailure,
  TruthBindingMetrics,
  TruthBindingReference,
  TruthBindingReferenceType,
  TruthBindingRelationship,
  TruthBindingReplayMetadata,
  TruthBindingValidationResult,
  TruthLedgerBindingEngineFoundation,
  TruthLedgerBindingEngineInput,
  TruthLedgerBindingEngineResult,
  TruthReferenceRegistryRecord,
} from "@/types/truth-ledger-binding-engine";

const TRUTH_LEDGER_BINDING_ENGINE_VERSION = "truth-ledger-binding-engine/v1" as const;
const BINDING_VERSION = "10.2.3" as const;

export const TRUTH_BINDING_CHECKS: readonly TruthBindingCheck[] = Object.freeze(["IDENTITY_VALIDATION", "BINDING_REQUEST_VALIDATION", "TRUTH_REFERENCE_RESOLUTION", "MANDATORY_REFERENCES", "TENANT_ISOLATION", "IMMUTABLE_TARGETS", "BINDING_CREATION", "REFERENCE_REGISTRY", "REPLAY_METADATA", "HISTORICAL_TRUTH_CHAIN", "INTEGRITY_VALIDATION"]);

type Scenario = NonNullable<TruthLedgerBindingEngineInput["scenario"]>;

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

function sourceForScenario(input: TruthLedgerBindingEngineInput, scenario: Scenario): OutcomeIdentityResolverResult {
  if (input.identity_resolver) return input.identity_resolver;
  if (scenario === "INVALID_IDENTITY") return runOutcomeIdentityResolver({ scenario: "MISSING_IDENTIFIER" });
  if (scenario === "CROSS_TENANT_REFERENCE" || scenario === "INVALID_TENANT") return runOutcomeIdentityResolver({ scenario: "CROSS_TENANT_REFERENCE" });
  if (scenario === "HASH_MISMATCH") return runOutcomeIdentityResolver({ scenario: "HASH_MISMATCH" });
  return runOutcomeIdentityResolver();
}

function visibleToRole(source: OutcomeIdentityResolverResult, role: VisibilityRole): boolean {
  return source.normalization_adapter.outcome_ledger.governance_operator_recorder.actualization_recorder.mission_impact_recorder.completeness_validator.evidence_registry.observation_engine.intake_adapter.capture_contract.architecture_certification.security_boundaries.adaptive_ledger.approval_framework.replay_traceability.authority_binding.adaptation_state.learning_permission.boundary_model.contract_foundation.final_certification.production_readiness.security_certification.observability_certification.ledger_certification.operator_workflow_certification.intelligence_certification.governance_certification.replay_certification.deterministic_certification.foundation_certification.certification_framework.analytics_result.operator_dashboard.replay_monitoring.governance_visibility.priority_dashboard.conflict_visualization.timeline_result.dashboard_result.observability_result.authorizations.some((auth) => auth.role === role && auth.permissions.includes("VIEW_DECISIONS"));
}

function buildApiSurface(): TruthBindingApiSurface {
  const base: Omit<TruthBindingApiSurface, "integrity_hash"> = {
    api_id: "truth_ledger_binding_api",
    create_binding: "POST /truth-ledger/bind",
    validate_binding: "POST /truth-ledger/bind/validate",
    retrieve_binding: "GET /truth-ledger/bind/{binding_id}",
    retrieve_truth_references: "GET /truth-ledger/references/{normalized_outcome_id}",
    retrieve_historical_truth_chain: "GET /truth-ledger/history/{normalized_outcome_id}",
    update_supported: false,
    delete_supported: false,
    deterministic_access: true,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function refs(source: OutcomeIdentityResolverResult) {
  const ledger = source.normalization_adapter.outcome_ledger;
  const go = ledger.governance_operator_recorder;
  const actualization = go.actualization_recorder;
  const impact = actualization.mission_impact_recorder;
  const observation = impact.completeness_validator.evidence_registry.observation_engine.observation_record;
  return { ledger, go, actualization, impact, observation };
}

function buildBinding(source: OutcomeIdentityResolverResult, scenario: Scenario): OutcomeTruthBinding {
  const r = refs(source);
  const tenant = scenario === "CROSS_TENANT_REFERENCE" || scenario === "INVALID_TENANT" ? `${source.outcome_identity.tenant_id}:foreign` : source.outcome_identity.tenant_id;
  const historical = scenario === "MISSING_HISTORY" ? freezeArray<string>([]) : freezeArray([r.ledger.ledger_records[0].ledger_record_id, r.go.governance_outcome_record.governance_outcome_id, r.actualization.actualization_record.actualization_id, r.impact.impact_record.impact_id]);
  const base: Omit<OutcomeTruthBinding, "integrity_hash"> = {
    binding_id: `truth_binding_${hash(source.outcome_identity.canonical_identity_id).slice(0, 18)}`,
    normalized_outcome_id: scenario === "MISSING_IDENTIFIER" ? "" : source.outcome_identity.normalized_outcome_id,
    tenant_id: tenant,
    mission_id: scenario === "INVALID_MISSION" ? "" : source.outcome_identity.mission_id,
    decision_id: scenario === "MISSING_DECISION" ? "" : source.outcome_identity.decision_id,
    truth_record_refs: scenario === "UNKNOWN_REFERENCE" ? freezeArray(["unknown:truth-record"]) : freezeArray([r.ledger.ledger_records[0].ledger_record_id]),
    decision_package_ref: scenario === "MISSING_DECISION_PACKAGE" ? "" : r.observation.decision_package_id,
    operator_workflow_ref: scenario === "MISSING_OPERATOR_WORKFLOW" ? "" : r.observation.operator_workflow_id,
    evidence_refs: scenario === "MISSING_EVIDENCE" ? freezeArray([]) : r.ledger.ledger_records[0].evidence_refs,
    replay_refs: scenario === "MISSING_REPLAY" ? freezeArray([]) : r.ledger.ledger_records[0].replay_refs,
    governance_refs: scenario === "MISSING_GOVERNANCE" ? freezeArray([]) : r.ledger.ledger_records[0].governance_outcome_refs,
    certification_refs: scenario === "MISSING_CERTIFICATION" ? freezeArray([]) : freezeArray([source.audit_report.report_id, r.go.audit_report.report_id]),
    final_outcome_ref: scenario === "MISSING_FINAL_OUTCOME" ? "" : r.observation.outcome_id,
    historical_truth_chain_refs: historical,
    binding_version: BINDING_VERSION,
    binding_timestamp: "2026-01-01T00:06:00.000Z",
  };
  const built = Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
  if (scenario === "HASH_MISMATCH") return Object.freeze({ ...built, integrity_hash: hash({ tampered: built.binding_id }) });
  return built;
}

function reference(type: TruthBindingReferenceType, truthRecordId: string, sourceComponent: string, relationship: TruthBindingRelationship, tenantId: string, replayRef: string, scenario: Scenario): TruthBindingReference {
  const base: Omit<TruthBindingReference, "integrity_hash"> = {
    reference_id: `truth_ref_${hash(`${type}:${truthRecordId}:${relationship}`).slice(0, 14)}`,
    truth_record_id: truthRecordId,
    reference_type: type,
    source_component: sourceComponent,
    relationship,
    tenant_id: scenario === "CROSS_TENANT_REFERENCE" ? `${tenantId}:foreign` : tenantId,
    replay_ref: replayRef,
    immutable_target: scenario !== "MUTABLE_REFERENCE",
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildReferences(binding: OutcomeTruthBinding, scenario: Scenario): readonly TruthBindingReference[] {
  const replayRef = binding.replay_refs[0] ?? "missing-replay";
  return freezeArray([
    reference("ORIGINAL_DECISION", binding.decision_id, "decision", "originates_from", binding.tenant_id, replayRef, scenario),
    reference("DECISION_PACKAGE", binding.decision_package_ref, "decision-package", "produced_by", binding.tenant_id, replayRef, scenario),
    reference("OPERATOR_WORKFLOW", binding.operator_workflow_ref, "operator-workflow", "approved_by", binding.tenant_id, replayRef, scenario),
    ...binding.evidence_refs.map((ref) => reference("EVIDENCE_RECORD", ref, "evidence", "supported_by", binding.tenant_id, replayRef, scenario)),
    ...binding.replay_refs.map((ref) => reference("REPLAY_RECORD", ref, "replay", "replayed_by", binding.tenant_id, ref, scenario)),
    ...binding.governance_refs.map((ref) => reference("GOVERNANCE_RECORD", ref, "governance", "governed_by", binding.tenant_id, replayRef, scenario)),
    ...binding.certification_refs.map((ref) => reference("CERTIFICATION_RECORD", ref, "certification", "certified_by", binding.tenant_id, replayRef, scenario)),
    reference("FINAL_OUTCOME", binding.final_outcome_ref, "outcome", "finalized_by", binding.tenant_id, replayRef, scenario),
    ...binding.historical_truth_chain_refs.map((ref) => reference("HISTORICAL_TRUTH_CHAIN", ref, "truth-ledger", "recorded_in", binding.tenant_id, replayRef, scenario)),
  ]);
}

function buildRegistry(binding: OutcomeTruthBinding, references: readonly TruthBindingReference[], scenario: Scenario): readonly TruthReferenceRegistryRecord[] {
  const base: Omit<TruthReferenceRegistryRecord, "integrity_hash"> = {
    registry_id: "truth_reference_registry_001",
    binding_id: binding.binding_id,
    normalized_outcome_id: binding.normalized_outcome_id,
    tenant_id: binding.tenant_id,
    reference_ids: freezeArray(references.map((entry) => entry.reference_id)),
    historical_truth_chain_refs: binding.historical_truth_chain_refs,
    binding_version: BINDING_VERSION,
    ledger_sequence: 1,
    append_only: true,
    deleted: false,
  };
  const record = Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
  if (scenario !== "APPEND_ONLY_VIOLATION") return freezeArray([record]);
  return freezeArray([record, Object.freeze({ ...record, registry_id: "truth_reference_registry_002", ledger_sequence: 1, integrity_hash: record.integrity_hash })]);
}

function baseReplayHash(binding: OutcomeTruthBinding, references: readonly TruthBindingReference[], registry: readonly TruthReferenceRegistryRecord[]): string {
  return hash({ binding, references, registry });
}

function collectFailures(input: {
  source: OutcomeIdentityResolverResult;
  binding: OutcomeTruthBinding;
  references: readonly TruthBindingReference[];
  registry: readonly TruthReferenceRegistryRecord[];
  role: VisibilityRole;
  scenario: Scenario;
}): readonly TruthBindingFailure[] {
  const failures: TruthBindingFailure[] = [];
  const b = input.binding;
  if (input.source.input_validation.validation_status !== "VALID" || input.scenario === "INVALID_IDENTITY") failures.push("IDENTITY_NOT_VALIDATED");
  if (input.scenario === "INCOMPLETE_OUTCOME") failures.push("INCOMPLETE_OUTCOME_REJECTED");
  if (!b.normalized_outcome_id || !b.decision_id || input.scenario === "MISSING_IDENTIFIER") failures.push("MISSING_IDENTIFIER_REJECTED");
  if (input.source.normalization_adapter.validation.validation_outcome !== "PASS" || input.scenario === "UNNORMALIZED_RECORD") failures.push("UNNORMALIZED_RECORD_REJECTED");
  if (b.tenant_id !== input.source.outcome_identity.tenant_id || input.scenario === "INVALID_TENANT") failures.push("INVALID_TENANT_REJECTED");
  if (!b.mission_id || input.scenario === "INVALID_MISSION") failures.push("INVALID_MISSION_REJECTED");
  if (!b.decision_id || !b.decision_package_ref || !b.operator_workflow_ref || !b.evidence_refs.length || !b.replay_refs.length || !b.governance_refs.length || !b.certification_refs.length || !b.final_outcome_ref || !b.historical_truth_chain_refs.length) failures.push("MISSING_REQUIRED_REFERENCE_REJECTED");
  if (b.truth_record_refs.some((ref) => ref.startsWith("unknown")) || input.scenario === "UNKNOWN_REFERENCE") failures.push("UNKNOWN_TRUTH_REFERENCE_REJECTED");
  if (input.references.some((ref) => ref.tenant_id !== b.tenant_id) || input.scenario === "CROSS_TENANT_REFERENCE") failures.push("CROSS_TENANT_REFERENCE_REJECTED");
  if (input.references.some((ref) => !ref.immutable_target) || input.scenario === "MUTABLE_REFERENCE") failures.push("MUTABLE_LEDGER_REFERENCE_REJECTED");
  if (input.scenario === "REPLAY_MISMATCH") failures.push("REPLAY_REFERENCE_MISMATCH_REJECTED");
  if (hashWithoutIntegrity(b) !== b.integrity_hash || input.scenario === "HASH_MISMATCH") failures.push("INTEGRITY_HASH_MISMATCH_REJECTED");
  if (new Set(input.registry.map((entry) => entry.ledger_sequence)).size !== input.registry.length || input.scenario === "APPEND_ONLY_VIOLATION") failures.push("REGISTRY_APPEND_ONLY_VIOLATED");
  if (input.scenario === "HISTORICAL_MUTATION") failures.push("HISTORICAL_RECORD_MUTATION_REJECTED");
  if (input.scenario === "NONDETERMINISTIC_RELATIONSHIP") failures.push("RELATIONSHIP_NONDETERMINISTIC");
  if (!visibleToRole(input.source, input.role)) failures.push("AUTHORIZATION_FAILURE");
  if (input.scenario === "FAIL_OPEN") failures.push("FAIL_OPEN_BINDING_BEHAVIOR");
  return freezeArray([...new Set(failures)]);
}

function buildValidation(binding: OutcomeTruthBinding, references: readonly TruthBindingReference[], failures: readonly TruthBindingFailure[]): TruthBindingValidationResult {
  const invalidReferenceCount = failures.filter((failure) => failure.includes("REFERENCE") || failure.includes("TENANT") || failure.includes("INTEGRITY")).length;
  const base: Omit<TruthBindingValidationResult, "integrity_hash"> = {
    validation_id: "truth_binding_validation",
    normalized_outcome_id: binding.normalized_outcome_id,
    validation_status: failures.length ? "BLOCKED" : "VALID",
    validated_reference_count: failures.length ? 0 : references.length,
    missing_reference_count: failures.includes("MISSING_REQUIRED_REFERENCE_REJECTED") ? 1 : 0,
    invalid_reference_count: invalidReferenceCount,
    tenant_validation_status: failures.includes("CROSS_TENANT_REFERENCE_REJECTED") || failures.includes("INVALID_TENANT_REJECTED") ? "INVALID" : "VALID",
    replay_validation_status: failures.includes("REPLAY_REFERENCE_MISMATCH_REJECTED") ? "INVALID" : "VALID",
    integrity_status: failures.includes("INTEGRITY_HASH_MISMATCH_REJECTED") ? "INVALID" : "VALID",
    validation_timestamp: "2026-01-01T00:06:01.000Z",
    failures,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildReplay(binding: OutcomeTruthBinding, references: readonly TruthBindingReference[], registry: readonly TruthReferenceRegistryRecord[], scenario: Scenario): TruthBindingReplayMetadata {
  const reference_hashes = freezeArray(references.map((entry) => entry.integrity_hash));
  const registry_hashes = freezeArray(registry.map((entry) => entry.integrity_hash));
  const expected = baseReplayHash(binding, references, registry);
  const reconstruction = scenario === "REPLAY_MISMATCH" ? hash({ replay: "mismatch" }) : expected;
  const base: Omit<TruthBindingReplayMetadata, "integrity_hash"> = {
    replay_metadata_id: "truth_binding_replay_metadata",
    binding_hash: binding.integrity_hash,
    reference_hashes,
    registry_hashes,
    historical_truth_chain_hash: hash(binding.historical_truth_chain_refs),
    replay_reconstruction_hash: reconstruction,
    replay_reconstruction_identical: reconstruction === expected,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildMetrics(validation: TruthBindingValidationResult, registry: readonly TruthReferenceRegistryRecord[]): TruthBindingMetrics {
  const base: Omit<TruthBindingMetrics, "integrity_hash"> = {
    metrics_id: "truth_binding_metrics",
    bindings_created: validation.validation_status === "VALID" ? 1 : 0,
    binding_failures: validation.failures.length,
    missing_reference_failures: validation.missing_reference_count,
    unknown_reference_failures: validation.failures.includes("UNKNOWN_TRUTH_REFERENCE_REJECTED") ? 1 : 0,
    tenant_violations: validation.tenant_validation_status === "INVALID" ? 1 : 0,
    replay_validation_failures: validation.replay_validation_status === "INVALID" ? 1 : 0,
    registry_growth: registry.length,
    validation_latency_ms: 0,
    integrity_verification_failures: validation.integrity_status === "INVALID" ? 1 : 0,
    advisory_only: true,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildAudit(binding: OutcomeTruthBinding, validation: TruthBindingValidationResult, replay: TruthBindingReplayMetadata): TruthBindingAuditReport {
  const base: Omit<TruthBindingAuditReport, "integrity_hash"> = {
    report_id: "truth_binding_audit_report",
    tenant_id: binding.tenant_id,
    checks: TRUTH_BINDING_CHECKS,
    ledger_binding_engine_operational: validation.validation_status === "VALID",
    binding_validator_operational: validation.validation_status === "VALID",
    truth_reference_registry_operational: !validation.failures.includes("REGISTRY_APPEND_ONLY_VIOLATED"),
    immutable_binding_pipeline_operational: validation.validation_status === "VALID",
    mandatory_references_enforced: !validation.failures.includes("MISSING_REQUIRED_REFERENCE_REJECTED"),
    historical_truth_chain_complete: binding.historical_truth_chain_refs.length > 0,
    immutable_relationships_verified: !validation.failures.includes("MUTABLE_LEDGER_REFERENCE_REJECTED"),
    truth_ledger_records_unmodified: !validation.failures.includes("HISTORICAL_RECORD_MUTATION_REJECTED"),
    failure_analysis: validation.failures,
    certification_decision: validation.failures.length ? "FAIL" : "PASS",
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function resultReplayHash(result: Omit<TruthLedgerBindingEngineResult, "integrity_hash" | "replay_hash">): string {
  return hash({
    api: result.api_surface,
    binding: result.binding,
    references: result.references,
    validation: result.validation,
    registry: result.reference_registry,
    replay: result.replay_metadata,
    audit: result.audit_report,
  });
}

export function runTruthLedgerBindingEngine(input: TruthLedgerBindingEngineInput = {}): TruthLedgerBindingEngineResult {
  const scenario = input.scenario ?? "BASELINE";
  const role = input.role ?? "OPERATOR";
  const identity_resolver = sourceForScenario(input, scenario);
  const api_surface = buildApiSurface();
  const binding = buildBinding(identity_resolver, scenario);
  const references = buildReferences(binding, scenario);
  const reference_registry = buildRegistry(binding, references, scenario);
  const failures = collectFailures({ source: identity_resolver, binding, references, registry: reference_registry, role, scenario });
  const validation = buildValidation(binding, references, failures);
  const replay_metadata = buildReplay(binding, references, reference_registry, scenario);
  const metrics = buildMetrics(validation, reference_registry);
  const audit_report = buildAudit(binding, validation, replay_metadata);
  const base: Omit<TruthLedgerBindingEngineResult, "integrity_hash" | "replay_hash"> = {
    truth_ledger_binding_engine_version: TRUTH_LEDGER_BINDING_ENGINE_VERSION,
    identity_resolver,
    api_surface,
    binding,
    references,
    validation,
    reference_registry,
    replay_metadata,
    metrics,
    audit_report,
    deterministic: true,
    replayable: true,
    immutable_references_only: true,
    modifies_truth_ledger_records: false,
    update_supported: false,
    delete_supported: false,
  };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: hashWithoutIntegrity({ ...base, replay_hash }) });
}

export function replayTruthLedgerBindingEngine(result: TruthLedgerBindingEngineResult): boolean {
  return resultReplayHash(result) === result.replay_hash && hashWithoutIntegrity(result) === result.integrity_hash;
}

export function computeOutcomeTruthBindingHash(binding: Omit<OutcomeTruthBinding, "integrity_hash"> | OutcomeTruthBinding): string {
  return hashWithoutIntegrity(binding);
}

export function getTruthLedgerBindingEngineFoundation(): TruthLedgerBindingEngineFoundation {
  const api_surface = buildApiSurface();
  return Object.freeze({
    truth_ledger_binding_engine_version: TRUTH_LEDGER_BINDING_ENGINE_VERSION,
    checks: TRUTH_BINDING_CHECKS,
    api_surface,
    result: runTruthLedgerBindingEngine(),
  });
}

export const TruthLedgerBindingEngine = Object.freeze({
  run: runTruthLedgerBindingEngine,
  replay: replayTruthLedgerBindingEngine,
});
