import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { runSyntheticScenarioOrchestration, validateSyntheticScenarioOrchestration } from "@/services/synthetic-scenario-orchestration";
import type {
  IsolationDomain,
  IsolationViolationCategory,
  IsolationViolationRecord,
  TenantIsolationCertificationTest,
  TenantIsolationFailure,
  TenantIsolationOutcome,
  TenantIsolationScenario,
  TenantIsolationValidationBundle,
  TenantIsolationValidationInput,
  TenantIsolationValidationResult,
  TenantIsolationValidationValidation,
} from "@/types/tenant-isolation-validation";

const VERSION = "tenant-isolation-validation/v14.5" as const;
const IDENTIFIER = "TenantIsolationValidation" as const;
const TIMESTAMP = "2026-07-15T00:00:00.000Z" as const;
const DEFAULT_TENANT = "tenant_mission_control_foundation";

function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function hash(value: unknown): string { return generateDecisionIntegrityHash(value); }
function hashWithoutIntegrity<T extends object>(value: T): string { const copy = { ...value } as Record<string, unknown>; delete copy.integrity_hash; return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown); }
function nested<T extends object>(value: T): T & { integrity_hash: string } { return Object.freeze({ ...value, integrity_hash: hashWithoutIntegrity(value) }) as T & { integrity_hash: string }; }
function verify(value: { integrity_hash: string }): boolean { return hashWithoutIntegrity(value) === value.integrity_hash; }
function id(prefix: string, value: unknown): string { return `${prefix}_${hash(value).slice(0, 20)}`; }
function directFailure(scenario: TenantIsolationScenario): TenantIsolationFailure | undefined { return scenario === "BASELINE" ? undefined : scenario; }
function has(failures: readonly TenantIsolationFailure[], failure: TenantIsolationFailure): boolean { return failures.includes(failure); }
function outcomeFor(failures: readonly TenantIsolationFailure[]): TenantIsolationOutcome {
  if (failures.length === 1 && failures[0] === "NON_CONSTITUTIONAL_MONITORING_WARNING") return "CONDITIONAL_PASS";
  return failures.length ? "FAIL" : "PASS";
}

const lifecycle = freezeArray(["REGISTERED", "INITIALIZED", "VALIDATING", "EVIDENCE_COLLECTED", "REPLAY_VALIDATED", "CERTIFIED"] as const);
const isolationDomains = freezeArray(["IDENTITY", "POLICY", "MEMORY", "ARTIFACT", "REPLAY"] as const satisfies readonly IsolationDomain[]);
const violationCategories = freezeArray(["IDENTITY_VIOLATION", "POLICY_VIOLATION", "MEMORY_VIOLATION", "ARTIFACT_VIOLATION", "REPLAY_VIOLATION", "EXECUTION_BOUNDARY_VIOLATION", "UNKNOWN_ISOLATION_FAILURE"] as const satisfies readonly IsolationViolationCategory[]);

function resultReplayHash(result: Omit<TenantIsolationValidationResult, "replay_hash" | "integrity_hash">): string {
  return hash({
    orchestration: result.orchestration_ref,
    contract: result.contract.integrity_hash,
    validation: result.validation_record.integrity_hash,
    violations: result.violations.map((item) => item.integrity_hash),
    replay: result.replay.integrity_hash,
    evidence: result.evidence_registry.map((item) => item.integrity_hash),
    explanation: result.explanation.integrity_hash,
    governance: result.governance.integrity_hash,
    tests: result.certification_tests.map((item) => item.integrity_hash),
    outcome: result.outcome,
  });
}

function resultIntegrityHash(result: Omit<TenantIsolationValidationResult, "integrity_hash">): string {
  return hash({ version: result.phase_version, identifier: result.phase_identifier, outcome: result.outcome, replay_hash: result.replay_hash });
}

function test(name: string, passed: boolean, failure: TenantIsolationFailure): TenantIsolationCertificationTest {
  const actual: TenantIsolationOutcome = passed ? "PASS" : failure === "NON_CONSTITUTIONAL_MONITORING_WARNING" ? "CONDITIONAL_PASS" : "FAIL";
  return nested({ test_id: id("tenant_isolation_test", name), name, expected: "PASS" as const, actual, passed, failure_reason: passed ? null : failure });
}

function violationFor(failure: TenantIsolationFailure, tenant: string, validationId: string): IsolationViolationRecord | null {
  const categoryByFailure: Partial<Record<TenantIsolationFailure, IsolationViolationCategory>> = {
    IDENTITY_ISOLATION_FAILURE: "IDENTITY_VIOLATION",
    POLICY_ISOLATION_FAILURE: "POLICY_VIOLATION",
    MEMORY_ISOLATION_FAILURE: "MEMORY_VIOLATION",
    ARTIFACT_ISOLATION_FAILURE: "ARTIFACT_VIOLATION",
    REPLAY_ISOLATION_FAILURE: "REPLAY_VIOLATION",
    UNAUTHORIZED_SHARING: "EXECUTION_BOUNDARY_VIOLATION",
  };
  const category = categoryByFailure[failure];
  if (!category) return null;
  return nested({ violation_id: id("isolation_violation", { failure, tenant, validationId }), tenant_id: tenant, violation_category: category, affected_component: failure.toLowerCase(), severity: "CRITICAL" as const, detected_timestamp: TIMESTAMP, evidence_reference: id("isolation_evidence", failure), replay_reference: id("isolation_replay", validationId), resolution_status: "BLOCKED" as const });
}

export function runTenantIsolationValidation(input: TenantIsolationValidationInput = {}): TenantIsolationValidationResult {
  const orchestration = runSyntheticScenarioOrchestration();
  const orchestrationValid = validateSyntheticScenarioOrchestration(orchestration).valid;
  const direct = directFailure(input.scenario ?? "BASELINE");
  const failures = freezeArray([...new Set([...(orchestrationValid ? [] : ["SCENARIO_ORCHESTRATION_NOT_APPROVED" as const]), ...(direct ? [direct] : [])])]);
  const tenant = has(failures, "UNAUTHORIZED_SHARING") ? `${input.tenant_id ?? DEFAULT_TENANT}:foreign` : input.tenant_id ?? DEFAULT_TENANT;
  const validationId = id("tenant_isolation_validation", { tenant, scope: input.validation_scope ?? "COMPLETE_SYNTHETIC_EXECUTION", version: VERSION });
  const replayRef = id("tenant_isolation_replay", validationId);
  const evidenceRef = id("tenant_isolation_evidence", validationId);

  const contract = nested({
    contract_version: VERSION,
    orchestration_ref: orchestration.integrity_hash,
    lifecycle,
    isolation_domains: isolationDomains,
    deterministic_validation_required: !has(failures, "CROSS_TENANT_DETECTION_NON_DETERMINISTIC"),
    replay_required: !has(failures, "ISOLATION_REPLAY_FAILURE"),
    evidence_required: !has(failures, "EVIDENCE_MUTABLE"),
    governance_required: !has(failures, "GOVERNANCE_NOT_ENFORCED"),
    advisory_only: !has(failures, "ADVISORY_BOUNDARY_BREACH"),
  });
  const validation_record = nested({ validation_id: validationId, tenant_id: tenant, synthetic_environment_id: orchestration.data_generation_ref, validation_scope: input.validation_scope ?? "COMPLETE_SYNTHETIC_EXECUTION", validation_status: has(failures, "CONTRACT_NOT_APPROVED") ? "INITIALIZED" as const : "CERTIFIED" as const, isolation_domains_validated: isolationDomains.filter((domain) => !((domain === "IDENTITY" && has(failures, "IDENTITY_ISOLATION_FAILURE")) || (domain === "POLICY" && has(failures, "POLICY_ISOLATION_FAILURE")) || (domain === "MEMORY" && has(failures, "MEMORY_ISOLATION_FAILURE")) || (domain === "ARTIFACT" && has(failures, "ARTIFACT_ISOLATION_FAILURE")) || (domain === "REPLAY" && has(failures, "REPLAY_ISOLATION_FAILURE")))), validation_timestamp: TIMESTAMP, replay_reference: replayRef, evidence_reference: evidenceRef });
  const violations = freezeArray(failures.map((failure) => violationFor(failure, tenant, validationId)).filter((record): record is IsolationViolationRecord => Boolean(record)));
  const replay = nested({ replay_id: replayRef, original_validation_id: validationId, replay_status: has(failures, "ISOLATION_REPLAY_FAILURE") || has(failures, "CERTIFICATION_REPLAY_FAILURE") ? "DIVERGED" as const : "REPRODUCED" as const, divergence_detected: has(failures, "ISOLATION_REPLAY_FAILURE") || has(failures, "CERTIFICATION_REPLAY_FAILURE"), divergence_summary: has(failures, "ISOLATION_REPLAY_FAILURE") ? "Isolation drift detected during replay." : "", replay_timestamp: TIMESTAMP, evidence_reference: evidenceRef });
  const evidence_registry = freezeArray(["VALIDATION", "VIOLATION", "REPLAY", "CERTIFICATION"] as const).map((evidence_type) => nested({ evidence_id: id("tenant_isolation_evidence_record", { validationId, evidence_type }), validation_id: validationId, tenant_id: tenant, evidence_type, lineage_reference: has(failures, "LINEAGE_INCOMPLETE") ? "" : id("tenant_isolation_lineage", { validationId, evidence_type }), immutable_timestamp: has(failures, "EVIDENCE_MUTABLE") ? "" : TIMESTAMP }));
  const explanation = nested({ explanation_id: id("tenant_isolation_explanation", validationId), validation_id: validationId, explanation_summary: has(failures, "EXPLAINABILITY_INCOMPLETE") ? "" : "All tenant isolation domains were evaluated deterministically with replayable evidence.", supporting_evidence: evidence_registry.map((item) => item.evidence_id), validation_reasoning: has(failures, "EXPLAINABILITY_INCOMPLETE") ? "" : "Identity, policy, memory, artifact, and replay boundaries remain tenant-scoped.", replay_reference: replayRef });
  const governance = nested({ governance_id: id("tenant_isolation_governance", validationId), constitutional_compliance: !has(failures, "CONSTITUTIONAL_BOUNDARY_BREACH"), governance_supremacy: !has(failures, "GOVERNANCE_NOT_ENFORCED"), operator_supremacy: !has(failures, "GOVERNANCE_NOT_ENFORCED"), advisory_only_behavior: !has(failures, "ADVISORY_BOUNDARY_BREACH"), tenant_ownership_preserved: !has(failures, "UNAUTHORIZED_SHARING"), immutable_audit: !has(failures, "EVIDENCE_MUTABLE"), deterministic_validation: !has(failures, "CROSS_TENANT_DETECTION_NON_DETERMINISTIC"), unauthorized_access_blocked: !has(failures, "UNAUTHORIZED_SHARING"), cross_tenant_execution_blocked: !has(failures, "UNAUTHORIZED_SHARING") });

  const tests = freezeArray([
    test("Tenant Isolation Validation Contract approved", contract.deterministic_validation_required && contract.advisory_only, "CONTRACT_NOT_APPROVED"),
    test("Identity isolation enforced", validation_record.isolation_domains_validated.includes("IDENTITY"), "IDENTITY_ISOLATION_FAILURE"),
    test("Policy isolation enforced", validation_record.isolation_domains_validated.includes("POLICY"), "POLICY_ISOLATION_FAILURE"),
    test("Memory isolation enforced", validation_record.isolation_domains_validated.includes("MEMORY"), "MEMORY_ISOLATION_FAILURE"),
    test("Artifact isolation enforced", validation_record.isolation_domains_validated.includes("ARTIFACT"), "ARTIFACT_ISOLATION_FAILURE"),
    test("Replay isolation enforced", validation_record.isolation_domains_validated.includes("REPLAY"), "REPLAY_ISOLATION_FAILURE"),
    test("Cross-tenant detection deterministic", !has(failures, "CROSS_TENANT_DETECTION_NON_DETERMINISTIC"), "CROSS_TENANT_DETECTION_NON_DETERMINISTIC"),
    test("Isolation replay reproducible", replay.replay_status === "REPRODUCED", "ISOLATION_REPLAY_FAILURE"),
    test("Evidence immutable", evidence_registry.every((item) => verify(item) && Boolean(item.immutable_timestamp)), "EVIDENCE_MUTABLE"),
    test("Lineage complete", evidence_registry.every((item) => Boolean(item.lineage_reference)), "LINEAGE_INCOMPLETE"),
    test("Explainability complete", Boolean(explanation.explanation_summary) && Boolean(explanation.validation_reasoning), "EXPLAINABILITY_INCOMPLETE"),
    test("Governance enforced", governance.governance_supremacy, "GOVERNANCE_NOT_ENFORCED"),
    test("Constitutional boundaries preserved", governance.constitutional_compliance, "CONSTITUTIONAL_BOUNDARY_BREACH"),
    test("Advisory-only boundary enforced", governance.advisory_only_behavior, "ADVISORY_BOUNDARY_BREACH"),
    test("Unauthorized sharing prevented", governance.unauthorized_access_blocked && governance.cross_tenant_execution_blocked, "UNAUTHORIZED_SHARING"),
    test("Integrity verification successful", !has(failures, "INTEGRITY_VERIFICATION_FAILED"), "INTEGRITY_VERIFICATION_FAILED"),
    test("Certification replayable", replay.replay_status === "REPRODUCED" && !has(failures, "CERTIFICATION_REPLAY_FAILURE"), "CERTIFICATION_REPLAY_FAILURE"),
  ]);
  const effectiveFailures = freezeArray([...new Set([...failures, ...tests.map((item) => item.failure_reason).filter((failure): failure is TenantIsolationFailure => Boolean(failure))])]);
  const outcome = outcomeFor(effectiveFailures);
  const base: Omit<TenantIsolationValidationResult, "replay_hash" | "integrity_hash"> = { phase_version: VERSION, phase_identifier: IDENTIFIER, orchestration_ref: orchestration.integrity_hash, contract, validation_record, violations, replay, evidence_registry, explanation, governance, certification_tests: tests, failures: effectiveFailures, outcome };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function validateTenantIsolationValidation(result = runTenantIsolationValidation()): TenantIsolationValidationValidation {
  const contract_valid = verify(result.contract) && result.contract.advisory_only && result.contract.lifecycle.join(">") === lifecycle.join(">") && result.contract.isolation_domains.length === 5;
  const validation_record_valid = verify(result.validation_record) && result.validation_record.validation_status === "CERTIFIED" && result.validation_record.isolation_domains_validated.length === 5;
  const violations_valid = result.violations.every((item) => verify(item) && violationCategories.includes(item.violation_category) && item.resolution_status === "BLOCKED") && result.violations.length === 0;
  const replay_valid = verify(result.replay) && result.replay.replay_status === "REPRODUCED" && !result.replay.divergence_detected;
  const evidence_valid = result.evidence_registry.length === 4 && result.evidence_registry.every((item) => verify(item) && Boolean(item.lineage_reference) && Boolean(item.immutable_timestamp));
  const explanation_valid = verify(result.explanation) && Boolean(result.explanation.explanation_summary) && Boolean(result.explanation.validation_reasoning) && result.explanation.supporting_evidence.length === result.evidence_registry.length;
  const governance_valid = verify(result.governance) && Object.entries(result.governance).filter(([key]) => !key.endsWith("_id") && key !== "integrity_hash").every(([, value]) => value === true);
  const certification_valid = result.certification_tests.length === 17 && result.certification_tests.every((item) => verify(item) && item.passed);
  const integrityValid = resultReplayHash(result) === result.replay_hash && resultIntegrityHash(result) === result.integrity_hash;
  const valid = result.outcome === "PASS" && integrityValid && contract_valid && validation_record_valid && violations_valid && replay_valid && evidence_valid && explanation_valid && governance_valid && certification_valid;
  return nested({ valid, outcome: result.outcome, contract_valid, validation_record_valid, violations_valid, replay_valid, evidence_valid, explanation_valid, governance_valid, certification_valid, failures: result.failures });
}

export function replayTenantIsolationValidation(result = runTenantIsolationValidation()): boolean {
  const replayed = runTenantIsolationValidation();
  return result.replay_hash === replayed.replay_hash && result.integrity_hash === replayed.integrity_hash && validateTenantIsolationValidation(result).valid;
}

export function getTenantIsolationValidationBundle(): TenantIsolationValidationBundle {
  const result = runTenantIsolationValidation();
  return Object.freeze({ doctrine: Object.freeze({ version: VERSION, orchestration_phase: "synthetic-scenario-orchestration/v14.4" as const, certification_outcomes: freezeArray(["PASS", "CONDITIONAL_PASS", "FAIL"] as const), violation_categories: violationCategories, isolation_domains: isolationDomains }), result, validation: validateTenantIsolationValidation(result) });
}

export const TenantIsolationValidationService = Object.freeze({ run: runTenantIsolationValidation, validate: validateTenantIsolationValidation, replay: replayTenantIsolationValidation });
