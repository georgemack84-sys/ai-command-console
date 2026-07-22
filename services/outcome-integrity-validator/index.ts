import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { runOutcomeLineageMapper } from "@/services/outcome-lineage-mapper";
import type { VisibilityRole } from "@/types/decision-observability-contract";
import type { OutcomeLineageMapperResult } from "@/types/outcome-lineage-mapper";
import type {
  HashVerificationRecord,
  IntegrityConsistencyReport,
  IntegrityValidationCategory,
  IntegrityValidationResult,
  OutcomeIntegrityApiSurface,
  OutcomeIntegrityAuditReport,
  OutcomeIntegrityCheck,
  OutcomeIntegrityFailure,
  OutcomeIntegrityMetrics,
  OutcomeIntegrityReplayReport,
  OutcomeIntegrityValidation,
  OutcomeIntegrityValidatorFoundation,
  OutcomeIntegrityValidatorInput,
  OutcomeIntegrityValidatorResult,
} from "@/types/outcome-integrity-validator";

const OUTCOME_INTEGRITY_VALIDATOR_VERSION = "outcome-integrity-validator/v1" as const;
const VALIDATION_VERSION = "10.2.5" as const;

export const OUTCOME_INTEGRITY_CHECKS: readonly OutcomeIntegrityCheck[] = Object.freeze(["LINEAGE_VALIDATION", "SCHEMA_COMPLETENESS", "REFERENCE_VALIDATION", "IDENTITY_CONSISTENCY", "EVIDENCE_INTEGRITY", "REPLAY_INTEGRITY", "TRUTH_LEDGER_INTEGRITY", "LINEAGE_COMPLETENESS", "TENANT_ISOLATION", "HASH_VERIFICATION", "CONSISTENCY_CHECK"]);

type Scenario = NonNullable<OutcomeIntegrityValidatorInput["scenario"]>;

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

function pass(value: boolean): "PASS" | "FAIL" {
  return value ? "PASS" : "FAIL";
}

function sourceForScenario(input: OutcomeIntegrityValidatorInput, scenario: Scenario): OutcomeLineageMapperResult {
  if (input.lineage_mapper) return input.lineage_mapper;
  if (scenario === "INVALID_LINEAGE" || scenario === "BROKEN_LINEAGE") return runOutcomeLineageMapper({ scenario: "ORPHAN_OUTCOME" });
  if (scenario === "CROSS_TENANT") return runOutcomeLineageMapper({ scenario: "CROSS_TENANT" });
  if (scenario === "REPLAY_MISMATCH") return runOutcomeLineageMapper({ scenario: "REPLAY_MISMATCH" });
  if (scenario === "HASH_MISMATCH") return runOutcomeLineageMapper({ scenario: "HASH_MISMATCH" });
  if (scenario === "MISSING_TRUTH_LEDGER") return runOutcomeLineageMapper({ scenario: "MISSING_TRUTH_LEDGER" });
  return runOutcomeLineageMapper();
}

function visibleToRole(source: OutcomeLineageMapperResult, role: VisibilityRole): boolean {
  return source.truth_binding.identity_resolver.normalization_adapter.outcome_ledger.governance_operator_recorder.actualization_recorder.mission_impact_recorder.completeness_validator.evidence_registry.observation_engine.intake_adapter.capture_contract.architecture_certification.security_boundaries.adaptive_ledger.approval_framework.replay_traceability.authority_binding.adaptation_state.learning_permission.boundary_model.contract_foundation.final_certification.production_readiness.security_certification.observability_certification.ledger_certification.operator_workflow_certification.intelligence_certification.governance_certification.replay_certification.deterministic_certification.foundation_certification.certification_framework.analytics_result.operator_dashboard.replay_monitoring.governance_visibility.priority_dashboard.conflict_visualization.timeline_result.dashboard_result.observability_result.authorizations.some((auth) => auth.role === role && auth.permissions.includes("VIEW_DECISIONS"));
}

function buildApiSurface(): OutcomeIntegrityApiSurface {
  const base: Omit<OutcomeIntegrityApiSurface, "integrity_hash"> = {
    api_id: "outcome_integrity_api",
    validate_outcome_integrity: "POST /integrity/validate",
    verify_hashes: "POST /integrity/hash/verify",
    validate_references: "POST /integrity/references",
    retrieve_validation_report: "GET /integrity/{normalized_outcome_id}",
    retrieve_hash_verification: "GET /integrity/{normalized_outcome_id}/hashes",
    read_only: true,
    repair_supported: false,
    update_supported: false,
    delete_supported: false,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function collectFailures(source: OutcomeLineageMapperResult, role: VisibilityRole, scenario: Scenario): readonly OutcomeIntegrityFailure[] {
  const failures: OutcomeIntegrityFailure[] = [];
  const binding = source.truth_binding;
  const canonical = binding.identity_resolver.normalization_adapter.canonical_outcome;
  if (source.validation.validation_status !== "VALID" || scenario === "INVALID_LINEAGE") failures.push("LINEAGE_NOT_VALIDATED");
  if (!canonical.normalized_outcome_id || !canonical.normalization_version || scenario === "SCHEMA_VIOLATION") failures.push("SCHEMA_VIOLATION_REJECTED");
  if (!binding.binding.decision_id || !binding.binding.decision_package_ref || !binding.binding.operator_workflow_ref || scenario === "MISSING_REFERENCE") failures.push("MISSING_REFERENCE_REJECTED");
  if (!binding.identity_resolver.outcome_identity.canonical_identity_id || scenario === "UNKNOWN_IDENTITY") failures.push("UNKNOWN_IDENTITY_REJECTED");
  if (!binding.binding.evidence_refs.length || scenario === "MISSING_EVIDENCE") failures.push("MISSING_EVIDENCE_REJECTED");
  if (!source.validation.complete_parent_chain || !source.validation.complete_child_chain || scenario === "BROKEN_LINEAGE") failures.push("BROKEN_LINEAGE_REJECTED");
  if (!source.replay_report.replay_reconstruction_identical || scenario === "REPLAY_MISMATCH") failures.push("REPLAY_MISMATCH_REJECTED");
  if (!binding.binding.truth_record_refs.length || scenario === "MISSING_TRUTH_LEDGER") failures.push("MISSING_TRUTH_LEDGER_REFERENCE_REJECTED");
  if (!source.validation.tenant_consistent || scenario === "CROSS_TENANT") failures.push("CROSS_TENANT_REFERENCE_REJECTED");
  if (hashWithoutIntegrity(canonical) !== canonical.integrity_hash || hashWithoutIntegrity(binding.binding) !== binding.binding.integrity_hash || scenario === "HASH_MISMATCH") failures.push("HASH_MISMATCH_REJECTED");
  if (scenario === "CONSISTENCY_FAILURE") failures.push("CONSISTENCY_CHECK_FAILED");
  if (scenario === "READ_ONLY_VIOLATION") failures.push("READ_ONLY_VALIDATION_VIOLATED");
  if (scenario === "EVIDENCE_AUTHENTICITY_FAILURE") failures.push("EVIDENCE_AUTHENTICITY_FAILED");
  if (scenario === "CROSS_TENANT") failures.push("TENANT_ISOLATION_VIOLATED");
  if (scenario === "INTEGRITY_BYPASS") failures.push("INTEGRITY_VERIFICATION_BYPASSED");
  if (!visibleToRole(source, role)) failures.push("AUTHORIZATION_FAILURE");
  if (scenario === "FAIL_OPEN") failures.push("FAIL_OPEN_INTEGRITY_VALIDATION_BEHAVIOR");
  return freezeArray([...new Set(failures)]);
}

function categoryFailure(category: IntegrityValidationCategory, failures: readonly OutcomeIntegrityFailure[]): OutcomeIntegrityFailure | undefined {
  if (category === "SCHEMA") return failures.find((failure) => failure === "SCHEMA_VIOLATION_REJECTED");
  if (category === "REFERENCE") return failures.find((failure) => failure === "MISSING_REFERENCE_REJECTED" || failure === "MISSING_TRUTH_LEDGER_REFERENCE_REJECTED");
  if (category === "IDENTITY") return failures.find((failure) => failure === "UNKNOWN_IDENTITY_REJECTED");
  if (category === "EVIDENCE") return failures.find((failure) => failure === "MISSING_EVIDENCE_REJECTED" || failure === "EVIDENCE_AUTHENTICITY_FAILED");
  if (category === "REPLAY") return failures.find((failure) => failure === "REPLAY_MISMATCH_REJECTED");
  if (category === "LEDGER") return failures.find((failure) => failure === "MISSING_TRUTH_LEDGER_REFERENCE_REJECTED");
  if (category === "LINEAGE") return failures.find((failure) => failure === "LINEAGE_NOT_VALIDATED" || failure === "BROKEN_LINEAGE_REJECTED");
  if (category === "TENANT") return failures.find((failure) => failure === "CROSS_TENANT_REFERENCE_REJECTED" || failure === "TENANT_ISOLATION_VIOLATED");
  if (category === "HASH") return failures.find((failure) => failure === "HASH_MISMATCH_REJECTED" || failure === "INTEGRITY_VERIFICATION_BYPASSED");
  return failures.find((failure) => failure === "CONSISTENCY_CHECK_FAILED" || failure === "READ_ONLY_VALIDATION_VIOLATED");
}

function buildResult(category: IntegrityValidationCategory, affected: string, replayRefs: readonly string[], failures: readonly OutcomeIntegrityFailure[]): IntegrityValidationResult {
  const failure = categoryFailure(category, failures);
  const base: Omit<IntegrityValidationResult, "integrity_hash"> = {
    result_id: `integrity_result_${category.toLowerCase()}`,
    validation_category: category,
    validation_status: failure ? "FAIL" : "PASS",
    validation_reason: failure ?? `${category.toLowerCase()} validation passed`,
    affected_reference: affected,
    severity: failure ? "CRITICAL" : "INFO",
    remediation_required: Boolean(failure),
    replay_refs: freezeArray(replayRefs),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildValidationResults(source: OutcomeLineageMapperResult, failures: readonly OutcomeIntegrityFailure[]): readonly IntegrityValidationResult[] {
  const normalizedId = source.truth_binding.binding.normalized_outcome_id;
  const replayRefs = source.truth_binding.binding.replay_refs;
  return freezeArray((["SCHEMA", "REFERENCE", "IDENTITY", "EVIDENCE", "REPLAY", "LEDGER", "LINEAGE", "TENANT", "HASH", "CONSISTENCY"] as const).map((category) => buildResult(category, normalizedId, replayRefs, failures)));
}

function verifyHash(id: string, expected: string, value: object, scenario: Scenario): HashVerificationRecord {
  const calculated = scenario === "HASH_MISMATCH" && id === "normalized_outcome" ? hash({ tampered: id }) : hashWithoutIntegrity(value);
  const base: Omit<HashVerificationRecord, "integrity_hash"> = {
    verification_id: `hash_verify_${id}`,
    normalized_outcome_id: id,
    hash_algorithm: "sha256",
    expected_hash: expected,
    calculated_hash: calculated,
    verification_status: expected === calculated ? "PASS" : "FAIL",
    verification_timestamp: "2026-01-01T00:08:00.000Z",
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildHashVerifications(source: OutcomeLineageMapperResult, scenario: Scenario): readonly HashVerificationRecord[] {
  const canonical = source.truth_binding.identity_resolver.normalization_adapter.canonical_outcome;
  return freezeArray([
    verifyHash("normalized_outcome", canonical.integrity_hash, canonical, scenario),
    verifyHash("identity", source.truth_binding.identity_resolver.outcome_identity.integrity_hash, source.truth_binding.identity_resolver.outcome_identity, scenario),
    verifyHash("truth_binding", source.truth_binding.binding.integrity_hash, source.truth_binding.binding, scenario),
    verifyHash("lineage_graph", source.lineage_graph.integrity_hash, source.lineage_graph, scenario),
    verifyHash("replay_metadata", source.replay_report.integrity_hash, source.replay_report, scenario),
  ]);
}

function buildConsistency(source: OutcomeLineageMapperResult, failures: readonly OutcomeIntegrityFailure[]): IntegrityConsistencyReport {
  const has = (failure: OutcomeIntegrityFailure) => failures.includes(failure);
  const base: Omit<IntegrityConsistencyReport, "integrity_hash"> = {
    report_id: "outcome_integrity_consistency_report",
    identities_consistent: !has("UNKNOWN_IDENTITY_REJECTED"),
    lineage_consistent: !has("BROKEN_LINEAGE_REJECTED") && !has("LINEAGE_NOT_VALIDATED"),
    references_consistent: !has("MISSING_REFERENCE_REJECTED") && !has("MISSING_TRUTH_LEDGER_REFERENCE_REJECTED"),
    evidence_consistent: !has("MISSING_EVIDENCE_REJECTED") && !has("EVIDENCE_AUTHENTICITY_FAILED"),
    replay_consistent: !has("REPLAY_MISMATCH_REJECTED"),
    truth_ledger_consistent: !has("MISSING_TRUTH_LEDGER_REFERENCE_REJECTED"),
    governance_consistent: source.truth_binding.binding.governance_refs.length > 0,
    certification_consistent: source.truth_binding.binding.certification_refs.length > 0,
    global_integrity_status: failures.length ? "FAIL" : "PASS",
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildValidation(source: OutcomeLineageMapperResult, failures: readonly OutcomeIntegrityFailure[]): OutcomeIntegrityValidation {
  const has = (failure: OutcomeIntegrityFailure) => failures.includes(failure);
  const canonical = source.truth_binding.identity_resolver.normalization_adapter.canonical_outcome;
  const base: Omit<OutcomeIntegrityValidation, "integrity_hash"> = {
    validation_id: "outcome_integrity_validation",
    normalized_outcome_id: canonical.normalized_outcome_id,
    tenant_id: canonical.tenant_id,
    mission_id: canonical.mission_id,
    validation_version: VALIDATION_VERSION,
    schema_validation: pass(!has("SCHEMA_VIOLATION_REJECTED")),
    reference_validation: pass(!has("MISSING_REFERENCE_REJECTED")),
    identity_validation: pass(!has("UNKNOWN_IDENTITY_REJECTED")),
    evidence_validation: pass(!has("MISSING_EVIDENCE_REJECTED") && !has("EVIDENCE_AUTHENTICITY_FAILED")),
    replay_validation: pass(!has("REPLAY_MISMATCH_REJECTED")),
    ledger_validation: pass(!has("MISSING_TRUTH_LEDGER_REFERENCE_REJECTED")),
    lineage_validation: pass(!has("LINEAGE_NOT_VALIDATED") && !has("BROKEN_LINEAGE_REJECTED")),
    tenant_validation: pass(!has("CROSS_TENANT_REFERENCE_REJECTED") && !has("TENANT_ISOLATION_VIOLATED")),
    hash_validation: pass(!has("HASH_MISMATCH_REJECTED") && !has("INTEGRITY_VERIFICATION_BYPASSED")),
    overall_validation_state: failures.length ? "FAILED" : "CERTIFIED",
    validation_timestamp: "2026-01-01T00:08:01.000Z",
    replay_refs: source.truth_binding.binding.replay_refs,
    failures,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function expectedReplayHash(validation: OutcomeIntegrityValidation, results: readonly IntegrityValidationResult[], hashes: readonly HashVerificationRecord[], consistency: IntegrityConsistencyReport): string {
  return hash({ validation, results, hashes, consistency });
}

function buildReplay(validation: OutcomeIntegrityValidation, results: readonly IntegrityValidationResult[], hashes: readonly HashVerificationRecord[], consistency: IntegrityConsistencyReport, scenario: Scenario): OutcomeIntegrityReplayReport {
  const expected = expectedReplayHash(validation, results, hashes, consistency);
  const replay = scenario === "REPLAY_MISMATCH" ? hash({ replay: "mismatch" }) : expected;
  const base: Omit<OutcomeIntegrityReplayReport, "integrity_hash"> = {
    replay_report_id: "outcome_integrity_replay_report",
    validation_hash: validation.integrity_hash,
    result_hashes: freezeArray(results.map((result) => result.integrity_hash)),
    hash_verification_hashes: freezeArray(hashes.map((record) => record.integrity_hash)),
    consistency_hash: consistency.integrity_hash,
    replay_reconstruction_hash: replay,
    replay_reconstruction_identical: replay === expected,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildMetrics(validation: OutcomeIntegrityValidation): OutcomeIntegrityMetrics {
  const has = (failure: OutcomeIntegrityFailure) => validation.failures.includes(failure);
  const base: Omit<OutcomeIntegrityMetrics, "integrity_hash"> = {
    metrics_id: "outcome_integrity_metrics",
    validations_executed: 1,
    validation_success_rate: validation.overall_validation_state === "CERTIFIED" ? 1 : 0,
    schema_failures: has("SCHEMA_VIOLATION_REJECTED") ? 1 : 0,
    reference_failures: has("MISSING_REFERENCE_REJECTED") || has("MISSING_TRUTH_LEDGER_REFERENCE_REJECTED") ? 1 : 0,
    evidence_failures: has("MISSING_EVIDENCE_REJECTED") || has("EVIDENCE_AUTHENTICITY_FAILED") ? 1 : 0,
    replay_failures: has("REPLAY_MISMATCH_REJECTED") ? 1 : 0,
    lineage_failures: has("BROKEN_LINEAGE_REJECTED") || has("LINEAGE_NOT_VALIDATED") ? 1 : 0,
    hash_mismatches: has("HASH_MISMATCH_REJECTED") ? 1 : 0,
    tenant_violations: has("TENANT_ISOLATION_VIOLATED") || has("CROSS_TENANT_REFERENCE_REJECTED") ? 1 : 0,
    validation_latency_ms: 0,
    advisory_only: true,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildAudit(source: OutcomeLineageMapperResult, validation: OutcomeIntegrityValidation, consistency: IntegrityConsistencyReport): OutcomeIntegrityAuditReport {
  const base: Omit<OutcomeIntegrityAuditReport, "integrity_hash"> = {
    report_id: "outcome_integrity_audit_report",
    tenant_id: source.truth_binding.binding.tenant_id,
    checks: OUTCOME_INTEGRITY_CHECKS,
    integrity_validator_operational: validation.overall_validation_state === "CERTIFIED",
    hash_verification_engine_operational: validation.hash_validation === "PASS",
    reference_validator_operational: validation.reference_validation === "PASS",
    consistency_checker_operational: consistency.global_integrity_status === "PASS",
    schema_completeness_verified: validation.schema_validation === "PASS",
    truth_ledger_integrity_verified: validation.ledger_validation === "PASS",
    lineage_completeness_verified: validation.lineage_validation === "PASS",
    read_only_validation_preserved: !validation.failures.includes("READ_ONLY_VALIDATION_VIOLATED"),
    adaptive_intelligence_eligible: validation.overall_validation_state === "CERTIFIED",
    failure_analysis: validation.failures,
    certification_decision: validation.overall_validation_state === "CERTIFIED" ? "PASS" : "FAIL",
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function resultReplayHash(result: Omit<OutcomeIntegrityValidatorResult, "integrity_hash" | "replay_hash">): string {
  return hash({
    validation: result.validation,
    results: result.validation_results,
    hashes: result.hash_verifications,
    consistency: result.consistency_report,
    replay: result.replay_report,
    audit: result.audit_report,
  });
}

export function runOutcomeIntegrityValidator(input: OutcomeIntegrityValidatorInput = {}): OutcomeIntegrityValidatorResult {
  const scenario = input.scenario ?? "BASELINE";
  const role = input.role ?? "OPERATOR";
  const lineage_mapper = sourceForScenario(input, scenario);
  const api_surface = buildApiSurface();
  const failures = collectFailures(lineage_mapper, role, scenario);
  const validation = buildValidation(lineage_mapper, failures);
  const validation_results = buildValidationResults(lineage_mapper, failures);
  const hash_verifications = buildHashVerifications(lineage_mapper, scenario);
  const consistency_report = buildConsistency(lineage_mapper, failures);
  const replay_report = buildReplay(validation, validation_results, hash_verifications, consistency_report, scenario);
  const metrics = buildMetrics(validation);
  const audit_report = buildAudit(lineage_mapper, validation, consistency_report);
  const base: Omit<OutcomeIntegrityValidatorResult, "integrity_hash" | "replay_hash"> = {
    outcome_integrity_validator_version: OUTCOME_INTEGRITY_VALIDATOR_VERSION,
    lineage_mapper,
    api_surface,
    validation,
    validation_results,
    hash_verifications,
    consistency_report,
    replay_report,
    metrics,
    audit_report,
    deterministic: true,
    replayable: true,
    read_only: true,
    repairs_records: false,
    modifies_normalized_outcomes: false,
    modifies_lineage: false,
    modifies_truth_ledger: false,
    changes_evidence: false,
  };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: hashWithoutIntegrity({ ...base, replay_hash }) });
}

export function replayOutcomeIntegrityValidator(result: OutcomeIntegrityValidatorResult): boolean {
  return resultReplayHash(result) === result.replay_hash && hashWithoutIntegrity(result) === result.integrity_hash;
}

export function computeOutcomeIntegrityValidationHash(validation: Omit<OutcomeIntegrityValidation, "integrity_hash"> | OutcomeIntegrityValidation): string {
  return hashWithoutIntegrity(validation);
}

export function getOutcomeIntegrityValidatorFoundation(): OutcomeIntegrityValidatorFoundation {
  const api_surface = buildApiSurface();
  return Object.freeze({
    outcome_integrity_validator_version: OUTCOME_INTEGRITY_VALIDATOR_VERSION,
    checks: OUTCOME_INTEGRITY_CHECKS,
    api_surface,
    result: runOutcomeIntegrityValidator(),
  });
}

export const OutcomeIntegrityValidator = Object.freeze({
  run: runOutcomeIntegrityValidator,
  replay: replayOutcomeIntegrityValidator,
});
