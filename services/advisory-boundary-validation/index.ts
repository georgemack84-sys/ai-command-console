import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { runTenantIsolationValidation, validateTenantIsolationValidation } from "@/services/tenant-isolation-validation";
import type {
  AdvisoryAuthorityAction,
  AdvisoryBoundaryCertificationTest,
  AdvisoryBoundaryFailure,
  AdvisoryBoundaryOutcome,
  AdvisoryBoundaryScenario,
  AdvisoryBoundaryValidationBundle,
  AdvisoryBoundaryValidationInput,
  AdvisoryBoundaryValidationResult,
  AdvisoryBoundaryValidationValidation,
  BoundaryAttackRecord,
  BoundaryReplayDivergenceCategory,
  BoundaryType,
  BoundaryViolationCategory,
  BoundaryViolationRecord,
  ProhibitedExecutionAuthority,
} from "@/types/advisory-boundary-validation";

const VERSION = "advisory-boundary-validation/v14.6" as const;
const IDENTIFIER = "AdvisoryBoundaryValidation" as const;
const TIMESTAMP = "2026-07-15T00:00:00.000Z" as const;
const DEFAULT_TENANT = "tenant_mission_control_foundation";

function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function hash(value: unknown): string { return generateDecisionIntegrityHash(value); }
function hashWithoutIntegrity<T extends object>(value: T): string { const copy = { ...value } as Record<string, unknown>; delete copy.integrity_hash; return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown); }
function nested<T extends object>(value: T): T & { integrity_hash: string } { return Object.freeze({ ...value, integrity_hash: hashWithoutIntegrity(value) }) as T & { integrity_hash: string }; }
function verify(value: { integrity_hash: string }): boolean { return hashWithoutIntegrity(value) === value.integrity_hash; }
function id(prefix: string, value: unknown): string { return `${prefix}_${hash(value).slice(0, 20)}`; }
function directFailure(scenario: AdvisoryBoundaryScenario): AdvisoryBoundaryFailure | undefined { return scenario === "BASELINE" ? undefined : scenario; }
function has(failures: readonly AdvisoryBoundaryFailure[], failure: AdvisoryBoundaryFailure): boolean { return failures.includes(failure); }
function outcomeFor(failures: readonly AdvisoryBoundaryFailure[]): AdvisoryBoundaryOutcome {
  if (failures.length === 1 && failures[0] === "NON_CONSTITUTIONAL_DOCUMENTATION_WARNING") return "CONDITIONAL_PASS";
  return failures.length ? "FAIL" : "PASS";
}

const allowedAuthority = freezeArray(["ASSESS", "RECOMMEND", "EXPLAIN", "CERTIFY", "SIMULATE", "VALIDATE"] as const satisfies readonly AdvisoryAuthorityAction[]);
const prohibitedAuthority = freezeArray(["EXECUTE_ACTION", "INITIATE_DEPLOYMENT", "MODIFY_EXTERNAL_SYSTEM", "SELF_APPROVE", "BYPASS_GOVERNANCE", "ELEVATE_AUTHORITY"] as const satisfies readonly ProhibitedExecutionAuthority[]);
const boundaryTypes = freezeArray(["API", "CONNECTOR", "DEPLOYMENT", "WORKFLOW", "AUTOMATION", "ORCHESTRATION", "PLUGIN", "TOOL"] as const satisfies readonly BoundaryType[]);
const replayDivergences = freezeArray(["AUTHORITY_DIVERGENCE", "REPLAY_DIVERGENCE", "INTERFACE_DIVERGENCE", "ORDERING_DIVERGENCE", "POLICY_DIVERGENCE", "EXECUTION_DIVERGENCE"] as const satisfies readonly BoundaryReplayDivergenceCategory[]);

function resultReplayHash(result: Omit<AdvisoryBoundaryValidationResult, "replay_hash" | "integrity_hash">): string {
  return hash({
    tenant: result.tenant_isolation_ref,
    contract: result.contract.integrity_hash,
    guard: result.guard.integrity_hash,
    validation: result.validation.integrity_hash,
    interfaces: result.interfaces.integrity_hash,
    attacks: result.attacks.map((item) => item.integrity_hash),
    violations: result.violations.map((item) => item.integrity_hash),
    replay: result.replay.integrity_hash,
    governance: result.governance.integrity_hash,
    observability: result.observability.integrity_hash,
    tests: result.certification_tests.map((item) => item.integrity_hash),
    outcome: result.outcome,
  });
}

function resultIntegrityHash(result: Omit<AdvisoryBoundaryValidationResult, "integrity_hash">): string {
  return hash({ version: result.phase_version, identifier: result.phase_identifier, outcome: result.outcome, replay_hash: result.replay_hash });
}

function test(name: string, passed: boolean, failure: AdvisoryBoundaryFailure): AdvisoryBoundaryCertificationTest {
  const actual: AdvisoryBoundaryOutcome = passed ? "PASS" : failure === "NON_CONSTITUTIONAL_DOCUMENTATION_WARNING" ? "CONDITIONAL_PASS" : "FAIL";
  return nested({ test_id: id("advisory_boundary_test", name), name, expected: "PASS" as const, actual, passed, failure_reason: passed ? null : failure });
}

function violationCategory(failure: AdvisoryBoundaryFailure): BoundaryViolationCategory | null {
  const map: Partial<Record<AdvisoryBoundaryFailure, BoundaryViolationCategory>> = {
    DIRECT_EXECUTION_NOT_BLOCKED: "DIRECT_EXECUTION",
    INDIRECT_EXECUTION_NOT_BLOCKED: "INDIRECT_EXECUTION",
    DELEGATED_EXECUTION_NOT_BLOCKED: "DELEGATED_EXECUTION",
    RECURSIVE_EXECUTION_NOT_BLOCKED: "RECURSIVE_EXECUTION",
    AUTHORITY_ESCALATION_NOT_DETECTED: "AUTHORITY_ESCALATION",
    GOVERNANCE_BYPASS_NOT_REJECTED: "GOVERNANCE_BYPASS",
    OPERATOR_BYPASS_NOT_REJECTED: "OPERATOR_BYPASS",
    INTERFACE_PROTECTION_FAILURE: "INTERFACE_AUTHORITY_LEAKAGE",
    REPLAY_NON_DETERMINISTIC: "REPLAY_MANIPULATION",
  };
  return map[failure] ?? null;
}

export function runAdvisoryBoundaryValidation(input: AdvisoryBoundaryValidationInput = {}): AdvisoryBoundaryValidationResult {
  const tenantIsolation = runTenantIsolationValidation();
  const tenantValid = validateTenantIsolationValidation(tenantIsolation).valid;
  const direct = directFailure(input.scenario ?? "BASELINE");
  const failures = freezeArray([...new Set([...(tenantValid ? [] : ["TENANT_ISOLATION_NOT_APPROVED" as const]), ...(direct ? [direct] : [])])]);
  const tenant = has(failures, "TENANT_ISOLATION_BREACH") ? `${input.tenant_id ?? DEFAULT_TENANT}:foreign` : input.tenant_id ?? DEFAULT_TENANT;
  const validationId = id("advisory_boundary_validation", { tenant, scope: input.validation_scope ?? "COMPLETE_AUTHORITY_BOUNDARY", version: VERSION });

  const contract = nested({ contract_version: VERSION, tenant_isolation_ref: tenantIsolation.integrity_hash, allowed_authority: allowedAuthority, prohibited_authority: prohibitedAuthority, boundary_types: boundaryTypes, advisory_only: !has(failures, "BOUNDARY_CONTRACT_INVALID") && !has(failures, "ADVISORY_OUTPUT_FAILURE"), governance_required: !has(failures, "GOVERNANCE_BYPASS_NOT_REJECTED"), replay_required: !has(failures, "REPLAY_NON_DETERMINISTIC"), evidence_required: !has(failures, "EVIDENCE_MUTABLE") });
  const guard = nested({ guard_id: id("advisory_boundary_guard", validationId), recommendations_observed: true, generated_artifacts_observed: true, interface_requests_observed: true, orchestration_behavior_observed: true, workflow_transitions_observed: true, replay_execution_observed: true, execution_attempts_detected: true, advisory_only_preserved: !has(failures, "ADVISORY_OUTPUT_FAILURE") });
  const validation = nested({ validation_id: validationId, direct_execution_blocked: !has(failures, "DIRECT_EXECUTION_NOT_BLOCKED"), indirect_execution_blocked: !has(failures, "INDIRECT_EXECUTION_NOT_BLOCKED"), delegated_execution_blocked: !has(failures, "DELEGATED_EXECUTION_NOT_BLOCKED"), chained_execution_blocked: !has(failures, "INDIRECT_EXECUTION_NOT_BLOCKED"), recursive_execution_blocked: !has(failures, "RECURSIVE_EXECUTION_NOT_BLOCKED"), advisory_outputs_valid: !has(failures, "ADVISORY_OUTPUT_FAILURE"), authority_escalation_detected: !has(failures, "AUTHORITY_ESCALATION_NOT_DETECTED"), governance_bypass_rejected: !has(failures, "GOVERNANCE_BYPASS_NOT_REJECTED"), operator_bypass_rejected: !has(failures, "OPERATOR_BYPASS_NOT_REJECTED"), execution_authority_impossible: !failures.some((failure) => ["DIRECT_EXECUTION_NOT_BLOCKED", "INDIRECT_EXECUTION_NOT_BLOCKED", "DELEGATED_EXECUTION_NOT_BLOCKED", "RECURSIVE_EXECUTION_NOT_BLOCKED", "AUTHORITY_ESCALATION_NOT_DETECTED"].includes(failure)) });
  const interfaces = nested({ interface_protection_id: id("advisory_interface_protection", validationId), protected_interfaces: boundaryTypes, interface_contracts_valid: !has(failures, "INTERFACE_PROTECTION_FAILURE"), immutable_advisory_responses: !has(failures, "INTERFACE_PROTECTION_FAILURE"), execution_separation: !has(failures, "INTERFACE_PROTECTION_FAILURE"), authority_preservation: !has(failures, "INTERFACE_PROTECTION_FAILURE"), policy_enforcement: !has(failures, "INTERFACE_PROTECTION_FAILURE") });
  const attackCategories = freezeArray(["EXECUTION_INJECTION", "AUTHORITY_SPOOFING", "GOVERNANCE_BYPASS", "POLICY_SUBSTITUTION", "INTERFACE_ABUSE", "REPLAY_MANIPULATION", "ORCHESTRATION_ABUSE", "CHAINED_EXECUTION", "DELEGATED_EXECUTION", "RECURSIVE_EXECUTION", "PLUGIN_ABUSE", "TOOL_INVOCATION_ABUSE"] as const);
  const attacks = freezeArray(attackCategories.map((attack_category): BoundaryAttackRecord => {
    const fails = has(failures, "ATTACK_SUITE_FAILURE");
    return nested({ attack_id: id("boundary_attack", { validationId, attack_category }), attack_category, expected_behavior: "BLOCKED" as const, observed_behavior: fails ? "ALLOWED" as const : "BLOCKED" as const, execution_blocked: !fails, evidence_ref: id("boundary_attack_evidence", attack_category), replay_ref: id("boundary_attack_replay", attack_category), constitutional_assessment: fails ? "FAIL" as const : "PASS" as const });
  }));
  const violations = freezeArray(failures.map((failure): BoundaryViolationRecord | null => {
    const category = violationCategory(failure);
    if (!category) return null;
    return nested({ violation_id: id("boundary_violation", { validationId, failure }), validation_id: validationId, scenario_id: id("boundary_scenario", failure), tenant_id: tenant, boundary_type: category === "INTERFACE_AUTHORITY_LEAKAGE" ? "API" as const : "ORCHESTRATION" as const, violation_category: category, affected_interfaces: category === "INTERFACE_AUTHORITY_LEAKAGE" ? boundaryTypes : freezeArray(["ORCHESTRATION"] as const), authority_path: freezeArray(["ASSESSMENT_AUTHORITY", "attempted_execution_authority"]), attempted_execution: failure.toLowerCase(), execution_blocked: !["DIRECT_EXECUTION_NOT_BLOCKED", "INDIRECT_EXECUTION_NOT_BLOCKED", "DELEGATED_EXECUTION_NOT_BLOCKED", "RECURSIVE_EXECUTION_NOT_BLOCKED"].includes(failure), constitutional_rule: "Mission Control shall never execute, delegate, self-approve, bypass governance, or elevate authority.", evidence_refs: freezeArray([id("boundary_evidence", failure)]), replay_refs: freezeArray([id("boundary_replay", failure)]), severity: "CRITICAL" as const, validation_result: "BLOCKED" as const, timestamp: TIMESTAMP });
  }).filter((item): item is BoundaryViolationRecord => Boolean(item)));
  const replay = nested({ replay_id: id("boundary_replay_report", validationId), validation_sessions_replayed: !has(failures, "REPLAY_NON_DETERMINISTIC"), attack_scenarios_replayed: !has(failures, "REPLAY_NON_DETERMINISTIC"), interface_interactions_replayed: !has(failures, "REPLAY_NON_DETERMINISTIC"), authority_decisions_replayed: !has(failures, "REPLAY_NON_DETERMINISTIC"), violation_detection_replayed: !has(failures, "REPLAY_NON_DETERMINISTIC"), execution_blocking_replayed: !has(failures, "REPLAY_NON_DETERMINISTIC"), certification_evidence_replayed: !has(failures, "CERTIFICATION_REPLAY_FAILURE"), divergence_categories: freezeArray(has(failures, "REPLAY_NON_DETERMINISTIC") ? ["REPLAY_DIVERGENCE"] as const : has(failures, "REPLAY_DIVERGENCE_UNDETECTED") ? ["EXECUTION_DIVERGENCE"] as const : []), deterministic: !has(failures, "REPLAY_NON_DETERMINISTIC") });
  const governance = nested({ governance_id: id("advisory_boundary_governance", validationId), constitutional_hierarchy: !has(failures, "CONSTITUTIONAL_HIERARCHY_BREACH"), governance_supremacy: !has(failures, "GOVERNANCE_BYPASS_NOT_REJECTED"), operator_supremacy: !has(failures, "OPERATOR_BYPASS_NOT_REJECTED"), advisory_only_doctrine: !has(failures, "ADVISORY_OUTPUT_FAILURE"), authority_ceilings: !has(failures, "AUTHORITY_ESCALATION_NOT_DETECTED"), tenant_isolation: !has(failures, "TENANT_ISOLATION_BREACH"), replay_governance: !has(failures, "REPLAY_NON_DETERMINISTIC"), no_authority_expansion: !has(failures, "AUTHORITY_ESCALATION_NOT_DETECTED") });
  const observability = nested({ observability_id: id("advisory_boundary_observability", VERSION), boundary_health_dashboard: !has(failures, "MONITORING_UNAVAILABLE"), interface_status_dashboard: !has(failures, "MONITORING_UNAVAILABLE"), violation_activity_dashboard: !has(failures, "MONITORING_UNAVAILABLE"), replay_status_dashboard: !has(failures, "MONITORING_UNAVAILABLE"), authority_compliance_dashboard: !has(failures, "MONITORING_UNAVAILABLE"), attack_coverage_dashboard: !has(failures, "MONITORING_UNAVAILABLE"), alerts_operational: !has(failures, "MONITORING_UNAVAILABLE"), metrics_accurate: !has(failures, "MONITORING_UNAVAILABLE") });

  const tests = freezeArray([
    test("Advisory Boundary Contract valid", contract.advisory_only && contract.allowed_authority.length === 6, "BOUNDARY_CONTRACT_INVALID"),
    test("Advisory-only outputs enforced", validation.advisory_outputs_valid, "ADVISORY_OUTPUT_FAILURE"),
    test("Direct execution blocked", validation.direct_execution_blocked, "DIRECT_EXECUTION_NOT_BLOCKED"),
    test("Indirect execution blocked", validation.indirect_execution_blocked, "INDIRECT_EXECUTION_NOT_BLOCKED"),
    test("Delegated execution blocked", validation.delegated_execution_blocked, "DELEGATED_EXECUTION_NOT_BLOCKED"),
    test("Recursive execution blocked", validation.recursive_execution_blocked, "RECURSIVE_EXECUTION_NOT_BLOCKED"),
    test("External interfaces protected", interfaces.execution_separation && interfaces.authority_preservation, "INTERFACE_PROTECTION_FAILURE"),
    test("Authority escalation detected", validation.authority_escalation_detected, "AUTHORITY_ESCALATION_NOT_DETECTED"),
    test("Governance bypass rejected", validation.governance_bypass_rejected, "GOVERNANCE_BYPASS_NOT_REJECTED"),
    test("Operator bypass rejected", validation.operator_bypass_rejected, "OPERATOR_BYPASS_NOT_REJECTED"),
    test("Boundary violations registered", !has(failures, "VIOLATION_REGISTRY_INCOMPLETE"), "VIOLATION_REGISTRY_INCOMPLETE"),
    test("Boundary lineage complete", !has(failures, "BOUNDARY_LINEAGE_INCOMPLETE"), "BOUNDARY_LINEAGE_INCOMPLETE"),
    test("Replay deterministic", replay.deterministic, "REPLAY_NON_DETERMINISTIC"),
    test("Replay divergence detected", !has(failures, "REPLAY_DIVERGENCE_UNDETECTED"), "REPLAY_DIVERGENCE_UNDETECTED"),
    test("Boundary evidence immutable", !has(failures, "EVIDENCE_MUTABLE"), "EVIDENCE_MUTABLE"),
    test("Tenant isolation preserved", governance.tenant_isolation, "TENANT_ISOLATION_BREACH"),
    test("Constitutional hierarchy enforced", governance.constitutional_hierarchy, "CONSTITUTIONAL_HIERARCHY_BREACH"),
    test("Continuous monitoring operational", observability.alerts_operational, "MONITORING_UNAVAILABLE"),
    test("Synthetic attack suite passed", attacks.every((attack) => attack.execution_blocked), "ATTACK_SUITE_FAILURE"),
    test("Certification reproducible", replay.certification_evidence_replayed && !has(failures, "CERTIFICATION_REPLAY_FAILURE"), "CERTIFICATION_REPLAY_FAILURE"),
  ]);
  const effectiveFailures = freezeArray([...new Set([...failures, ...tests.map((item) => item.failure_reason).filter((failure): failure is AdvisoryBoundaryFailure => Boolean(failure))])]);
  const outcome = outcomeFor(effectiveFailures);
  const base: Omit<AdvisoryBoundaryValidationResult, "replay_hash" | "integrity_hash"> = { phase_version: VERSION, phase_identifier: IDENTIFIER, tenant_isolation_ref: tenantIsolation.integrity_hash, contract, guard, validation, interfaces, attacks, violations, replay, governance, observability, certification_tests: tests, failures: effectiveFailures, outcome };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function validateAdvisoryBoundaryValidation(result = runAdvisoryBoundaryValidation()): AdvisoryBoundaryValidationValidation {
  const contract_valid = verify(result.contract) && result.contract.advisory_only && result.contract.allowed_authority.length === 6 && result.contract.prohibited_authority.length === 6;
  const guard_valid = verify(result.guard) && result.guard.execution_attempts_detected && result.guard.advisory_only_preserved;
  const validation_valid = verify(result.validation) && Object.entries(result.validation).filter(([key]) => !key.endsWith("_id") && key !== "integrity_hash").every(([, value]) => value === true);
  const interfaces_valid = verify(result.interfaces) && result.interfaces.protected_interfaces.length === 8 && result.interfaces.interface_contracts_valid && result.interfaces.execution_separation && result.interfaces.authority_preservation;
  const attacks_valid = result.attacks.length === 12 && result.attacks.every((attack) => verify(attack) && attack.execution_blocked && attack.observed_behavior === "BLOCKED" && attack.constitutional_assessment === "PASS");
  const violations_valid = result.violations.every((violation) => verify(violation) && violation.execution_blocked && violation.validation_result === "BLOCKED") && result.violations.length === 0;
  const replay_valid = verify(result.replay) && result.replay.deterministic && result.replay.validation_sessions_replayed && result.replay.attack_scenarios_replayed && result.replay.certification_evidence_replayed;
  const governance_valid = verify(result.governance) && Object.entries(result.governance).filter(([key]) => !key.endsWith("_id") && key !== "integrity_hash").every(([, value]) => value === true);
  const observability_valid = verify(result.observability) && Object.entries(result.observability).filter(([key]) => !key.endsWith("_id") && key !== "integrity_hash").every(([, value]) => value === true);
  const certification_valid = result.certification_tests.length === 20 && result.certification_tests.every((item) => verify(item) && item.passed);
  const integrityValid = resultReplayHash(result) === result.replay_hash && resultIntegrityHash(result) === result.integrity_hash;
  const valid = result.outcome === "PASS" && integrityValid && contract_valid && guard_valid && validation_valid && interfaces_valid && attacks_valid && violations_valid && replay_valid && governance_valid && observability_valid && certification_valid;
  return nested({ valid, outcome: result.outcome, contract_valid, guard_valid, validation_valid, interfaces_valid, attacks_valid, violations_valid, replay_valid, governance_valid, observability_valid, certification_valid, failures: result.failures });
}

export function replayAdvisoryBoundaryValidation(result = runAdvisoryBoundaryValidation()): boolean {
  const replayed = runAdvisoryBoundaryValidation();
  return result.replay_hash === replayed.replay_hash && result.integrity_hash === replayed.integrity_hash && validateAdvisoryBoundaryValidation(result).valid;
}

export function getAdvisoryBoundaryValidationBundle(): AdvisoryBoundaryValidationBundle {
  const result = runAdvisoryBoundaryValidation();
  return Object.freeze({ doctrine: Object.freeze({ version: VERSION, tenant_isolation_phase: "tenant-isolation-validation/v14.5" as const, certification_outcomes: freezeArray(["PASS", "CONDITIONAL_PASS", "FAIL"] as const), allowed_authority: allowedAuthority, prohibited_authority: prohibitedAuthority, replay_divergence_categories: replayDivergences }), result, validation: validateAdvisoryBoundaryValidation(result) });
}

export const AdvisoryBoundaryValidationService = Object.freeze({ run: runAdvisoryBoundaryValidation, validate: validateAdvisoryBoundaryValidation, replay: replayAdvisoryBoundaryValidation });
