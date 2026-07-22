import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { runPhase17CertificationGate } from "@/services/phase-17-certification-gate";
import type {
  ContinuousOperationsFoundationBundle,
  ContinuousOperationsFoundationFailure,
  ContinuousOperationsFoundationInput,
  ContinuousOperationsFoundationOutcome,
  ContinuousOperationsFoundationResult,
  ContinuousOperationsFoundationTest,
  ContinuousOperationsFoundationValidation,
  OperationsLifecycleState,
  StandingServiceCategory,
} from "@/types/continuous-operations-foundation";

const VERSION = "continuous-operations-foundation/v18.1" as const;
const IDENTIFIER = "ContinuousOperationsFoundation" as const;
const DEFAULT_TENANT = "tenant_phase_18_operations";
const DEFAULT_OPERATOR = "operator_phase_18_operations";

function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function hash(value: unknown): string { return generateDecisionIntegrityHash(value); }
function hashWithoutIntegrity<T extends object>(value: T): string { const copy = { ...value } as Record<string, unknown>; delete copy.integrity_hash; return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown); }
function nested<T extends object>(value: T): T & { integrity_hash: string } { return Object.freeze({ ...value, integrity_hash: hashWithoutIntegrity(value) }) as T & { integrity_hash: string }; }
function verify(value: { integrity_hash: string }): boolean { return hashWithoutIntegrity(value) === value.integrity_hash; }
function id(prefix: string, value: unknown): string { return `${prefix}_${hash(value).slice(0, 20)}`; }
function has(failures: readonly ContinuousOperationsFoundationFailure[], failure: ContinuousOperationsFoundationFailure): boolean { return failures.includes(failure); }
function directFailure(scenario: ContinuousOperationsFoundationInput["scenario"]): ContinuousOperationsFoundationFailure | undefined { return !scenario || scenario === "BASELINE" ? undefined : scenario; }
function outcomeFor(failures: readonly ContinuousOperationsFoundationFailure[]): ContinuousOperationsFoundationOutcome {
  if (failures.length === 1 && failures[0] === "NON_CONSTITUTIONAL_OPERATIONS_WARNING") return "CONDITIONAL_PASS";
  return failures.length ? "FAIL" : "PASS";
}

const lifecycleStates = freezeArray(["REGISTERED", "INITIALIZING", "QUALIFIED", "ACTIVE", "DEGRADED", "SUSPENDED", "RECOVERING", "REQUALIFYING", "RETIRED"] as const satisfies readonly OperationsLifecycleState[]);
const categories = freezeArray(["GOVERNANCE", "CERTIFICATION", "OBSERVABILITY", "AUDIT", "REPLAY", "INTEGRITY", "SECURITY", "OPERATIONAL_HEALTH"] as const satisfies readonly StandingServiceCategory[]);

function certTest(name: string, passed: boolean, failure: ContinuousOperationsFoundationFailure, evidence_refs: readonly string[]): ContinuousOperationsFoundationTest {
  const actual: ContinuousOperationsFoundationOutcome = passed ? "PASS" : failure === "NON_CONSTITUTIONAL_OPERATIONS_WARNING" ? "CONDITIONAL_PASS" : "FAIL";
  return nested({ test_id: id("continuous_operations_foundation_test", name), name, expected: "PASS" as const, actual, passed, failure_reason: passed ? null : failure, evidence_refs: freezeArray(evidence_refs) });
}
function resultReplayHash(result: Omit<ContinuousOperationsFoundationResult, "replay_hash" | "integrity_hash">): string {
  return hash({ phase17: result.phase_17_certification_gate_ref, identity: result.operational_identity.integrity_hash, state: result.state_registry.integrity_hash, authority: result.authority_registry.integrity_hash, services: result.standing_service_registry.integrity_hash, inheritance: result.certification_inheritance.integrity_hash, replay: result.replay_contract.integrity_hash, audit: result.audit_contract.integrity_hash, governance: result.governance_rules.integrity_hash, package: result.certification_package.integrity_hash, tests: result.certification_tests.map((test) => test.integrity_hash), outcome: result.outcome });
}
function resultIntegrityHash(result: Omit<ContinuousOperationsFoundationResult, "integrity_hash">): string { return hash({ version: result.phase_version, identifier: result.phase_identifier, outcome: result.outcome, replay_hash: result.replay_hash }); }

export function runContinuousOperationsFoundation(input: ContinuousOperationsFoundationInput = {}): ContinuousOperationsFoundationResult {
  const gate = runPhase17CertificationGate({ tenant_id: input.tenant_id ?? DEFAULT_TENANT, operator_id: input.operator_id ?? DEFAULT_OPERATOR, mission_id: input.mission_id });
  const direct = directFailure(input.scenario);
  const upstreamFailures: ContinuousOperationsFoundationFailure[] = gate.outcome === "PASS" ? [] : ["PHASE_17_GATE_NOT_VALID"];
  const failures = freezeArray([...new Set([...upstreamFailures, ...(direct ? [direct] : [])])]);
  const blockingFailures = freezeArray(failures.filter((failure) => failure !== "NON_CONSTITUTIONAL_OPERATIONS_WARNING"));
  const tenantId = input.tenant_id ?? DEFAULT_TENANT;
  const serviceId = input.service_id ?? "mission-control-continuous-operations";
  const platform = input.platform_instance ?? "global-production";
  const lifecycleDeterministic = !has(failures, "LIFECYCLE_NOT_DETERMINISTIC");
  const governanceEnforced = !has(failures, "GOVERNANCE_NOT_ENFORCED") && !has(failures, "GOVERNANCE_PAUSES_DURING_RECOVERY");
  const servicesDefined = !has(failures, "STANDING_SERVICES_NOT_DEFINED");
  const inheritanceValid = !has(failures, "CERTIFICATION_INHERITANCE_NOT_VALIDATED");
  const identityImmutable = !has(failures, "OPERATIONAL_IDENTITY_MUTABLE");
  const replayComplete = !has(failures, "REPLAY_REQUIREMENTS_INCOMPLETE");
  const auditComplete = !has(failures, "OPERATIONAL_AUDIT_INCOMPLETE");
  const authorityPreserved = !has(failures, "CONSTITUTIONAL_AUTHORITY_NOT_PRESERVED") && !has(failures, "IMPLICIT_AUTHORITY_PRESENT") && !has(failures, "CERTIFICATION_INHERITANCE_EXPANDS_AUTHORITY");
  const operational_identity = nested({ operation_id: id("operation", { tenantId, serviceId }), service_id: serviceId, service_type: "GOVERNANCE" as const, platform_instance: platform, tenant_scope: tenantId, operational_version: "18.1.0", certification_reference: gate.integrity_hash, governance_reference: gate.certification_package.integrity_hash, replay_reference: gate.replay_hash, immutable: identityImmutable });
  const state_registry = nested({ registry_id: id("operational_state_registry", serviceId), lifecycle_state: "ACTIVE" as const, operational_status: "standing", qualification_status: "qualified", certification_status: gate.outcome === "PASS" ? "inherited-certified" : "blocked", health_summary: "healthy", dependency_status: "satisfied", governance_status: governanceEnforced ? "active" : "paused", replay_status: replayComplete ? "replayable" : "incomplete", deterministic_transitions: lifecycleDeterministic });
  const authority_registry = nested({ registry_id: id("operational_authority_registry", serviceId), governance_authority: authorityPreserved ? "constitutional-governance-authority" : "", operator_authority: "external-operator-authority", certification_authority: gate.certification_engine.integrity_hash, operational_ownership: "mission-control-operations", escalation_authority: "constitutional-escalation-authority", recovery_authority: "operational-resilience-recovery-governance", explicit_authority: !has(failures, "IMPLICIT_AUTHORITY_PRESENT"), inferred_authority: has(failures, "IMPLICIT_AUTHORITY_PRESENT") });
  const standing_service_registry = nested({ registry_id: id("standing_service_registry", VERSION), categories, service_refs: freezeArray(servicesDefined ? categories.map((category) => id("standing_service", category)) : []), ownership_defined: servicesDefined, performs_execution: false, fail_closed: servicesDefined });
  const certification_inheritance = nested({ contract_id: id("certification_inheritance", serviceId), certification_lineage_preserved: inheritanceValid, certification_scope_preserved: inheritanceValid, certification_validity_preserved: inheritanceValid && gate.outcome === "PASS", dependency_certification_preserved: inheritanceValid, operational_qualification_preserved: inheritanceValid, expands_constitutional_authority: has(failures, "CERTIFICATION_INHERITANCE_EXPANDS_AUTHORITY"), validates_without_replacing_decisions: inheritanceValid });
  const replay_contract = nested({ replay_id: id("operational_replay", serviceId), lifecycle_transitions_replayable: replayComplete, governance_decisions_replayable: replayComplete, operational_events_replayable: replayComplete, certification_events_replayable: replayComplete, recovery_events_replayable: replayComplete, requalification_events_replayable: replayComplete, state_mutations_replayable: replayComplete, dependency_changes_replayable: replayComplete, identical_operational_outcomes: replayComplete && lifecycleDeterministic, replay_refs: freezeArray(replayComplete ? [gate.replay_hash] : []) });
  const audit_contract = nested({ audit_id: id("operational_audit", serviceId), operational_identity_recorded: auditComplete, lifecycle_transition_recorded: auditComplete, governance_decision_recorded: auditComplete, operator_action_recorded: auditComplete, certification_event_recorded: auditComplete, recovery_activity_recorded: auditComplete, replay_reference_recorded: auditComplete && replay_contract.replay_refs.length > 0, integrity_verification_recorded: auditComplete, append_only: auditComplete, immutable: auditComplete });
  const governance_rules = nested({ rules_id: id("continuous_governance", VERSION), governance_continuously_active: governanceEnforced, active_during_degraded_operation: governanceEnforced, active_during_recovery: governanceEnforced, active_during_requalification: governanceEnforced, active_during_suspension: governanceEnforced, no_lifecycle_state_bypasses_governance: governanceEnforced, constitutional_authority_preserved: authorityPreserved });
  const certification_package = nested({ package_id: id("continuous_operations_certification", serviceId), lifecycle_deterministic: state_registry.deterministic_transitions, governance_enforced: governance_rules.governance_continuously_active && governance_rules.no_lifecycle_state_bypasses_governance, standing_services_defined: standing_service_registry.service_refs.length === categories.length && !standing_service_registry.performs_execution, certification_inheritance_validated: certification_inheritance.certification_lineage_preserved && !certification_inheritance.expands_constitutional_authority, operational_identity_immutable: operational_identity.immutable, replay_requirements_complete: replay_contract.identical_operational_outcomes && replay_contract.replay_refs.length > 0, operational_audit_complete: audit_contract.immutable && audit_contract.append_only, constitutional_authority_preserved: governance_rules.constitutional_authority_preserved && authority_registry.explicit_authority && !authority_registry.inferred_authority, continuous_operations_foundation_certified: blockingFailures.length === 0, evidence_refs: freezeArray([gate.integrity_hash, operational_identity.integrity_hash, governance_rules.integrity_hash]) });
  const tests = freezeArray([
    certTest("Lifecycle deterministic", certification_package.lifecycle_deterministic, "LIFECYCLE_NOT_DETERMINISTIC", [state_registry.integrity_hash]),
    certTest("Governance enforced", certification_package.governance_enforced, "GOVERNANCE_NOT_ENFORCED", [governance_rules.integrity_hash]),
    certTest("Standing services defined", certification_package.standing_services_defined, "STANDING_SERVICES_NOT_DEFINED", [standing_service_registry.integrity_hash]),
    certTest("Certification inheritance validated", certification_package.certification_inheritance_validated, "CERTIFICATION_INHERITANCE_NOT_VALIDATED", [certification_inheritance.integrity_hash]),
    certTest("Operational identity immutable", certification_package.operational_identity_immutable, "OPERATIONAL_IDENTITY_MUTABLE", [operational_identity.integrity_hash]),
    certTest("Replay requirements complete", certification_package.replay_requirements_complete, "REPLAY_REQUIREMENTS_INCOMPLETE", [replay_contract.integrity_hash]),
    certTest("Operational audit complete", certification_package.operational_audit_complete, "OPERATIONAL_AUDIT_INCOMPLETE", [audit_contract.integrity_hash]),
    certTest("Constitutional authority preserved", certification_package.constitutional_authority_preserved, "CONSTITUTIONAL_AUTHORITY_NOT_PRESERVED", [authority_registry.integrity_hash]),
    certTest("Continuous operations foundation certified", certification_package.continuous_operations_foundation_certified, "CONTINUOUS_OPERATIONS_FOUNDATION_NOT_CERTIFIED", [certification_package.integrity_hash]),
    certTest("Governance remains active during recovery", governance_rules.active_during_recovery, "GOVERNANCE_PAUSES_DURING_RECOVERY", [governance_rules.integrity_hash]),
    certTest("Operational authority explicitly declared", authority_registry.explicit_authority && !authority_registry.inferred_authority, "IMPLICIT_AUTHORITY_PRESENT", [authority_registry.integrity_hash]),
    certTest("Certification inheritance does not expand authority", !certification_inheritance.expands_constitutional_authority, "CERTIFICATION_INHERITANCE_EXPANDS_AUTHORITY", [certification_inheritance.integrity_hash]),
  ]);
  const effectiveFailures = freezeArray([...new Set([...failures, ...tests.map((test) => test.failure_reason).filter((failure): failure is ContinuousOperationsFoundationFailure => Boolean(failure))])]);
  const outcome = outcomeFor(effectiveFailures);
  const base: Omit<ContinuousOperationsFoundationResult, "replay_hash" | "integrity_hash"> = { phase_version: VERSION, phase_identifier: IDENTIFIER, phase_17_certification_gate_ref: gate.integrity_hash, operational_identity, state_registry, authority_registry, standing_service_registry, certification_inheritance, replay_contract, audit_contract, governance_rules, certification_package, certification_tests: tests, failures: effectiveFailures, outcome };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function validateContinuousOperationsFoundation(result = runContinuousOperationsFoundation()): ContinuousOperationsFoundationValidation {
  const identity_valid = verify(result.operational_identity) && result.operational_identity.immutable && result.operational_identity.certification_reference.length > 0 && result.operational_identity.governance_reference.length > 0 && result.operational_identity.replay_reference.length > 0;
  const state_valid = verify(result.state_registry) && result.state_registry.lifecycle_state === "ACTIVE" && result.state_registry.deterministic_transitions && result.state_registry.governance_status === "active" && result.state_registry.replay_status === "replayable";
  const authority_valid = verify(result.authority_registry) && result.authority_registry.explicit_authority && !result.authority_registry.inferred_authority && Object.entries(result.authority_registry).filter(([key]) => !["registry_id", "explicit_authority", "inferred_authority", "integrity_hash"].includes(key)).every(([, value]) => typeof value === "string" && value.length > 0);
  const services_valid = verify(result.standing_service_registry) && result.standing_service_registry.categories.length === 8 && result.standing_service_registry.service_refs.length === 8 && result.standing_service_registry.ownership_defined && !result.standing_service_registry.performs_execution && result.standing_service_registry.fail_closed;
  const inheritance_valid = verify(result.certification_inheritance) && !result.certification_inheritance.expands_constitutional_authority && Object.entries(result.certification_inheritance).filter(([key]) => !["contract_id", "expands_constitutional_authority", "integrity_hash"].includes(key)).every(([, value]) => value === true);
  const replay_valid = verify(result.replay_contract) && result.replay_contract.replay_refs.length > 0 && Object.entries(result.replay_contract).filter(([key]) => !["replay_id", "replay_refs", "integrity_hash"].includes(key)).every(([, value]) => value === true);
  const audit_valid = verify(result.audit_contract) && Object.entries(result.audit_contract).filter(([key]) => !["audit_id", "integrity_hash"].includes(key)).every(([, value]) => value === true);
  const governance_valid = verify(result.governance_rules) && Object.entries(result.governance_rules).filter(([key]) => !["rules_id", "integrity_hash"].includes(key)).every(([, value]) => value === true);
  const certification_package_valid = verify(result.certification_package) && result.certification_package.evidence_refs.length > 0 && Object.entries(result.certification_package).filter(([key]) => !["package_id", "evidence_refs", "integrity_hash"].includes(key)).every(([, value]) => value === true);
  const certification_valid = result.certification_tests.length === 12 && result.certification_tests.every((test) => verify(test) && test.passed && test.evidence_refs.length > 0);
  const result_replay_valid = resultReplayHash(result) === result.replay_hash && resultIntegrityHash(result) === result.integrity_hash;
  const valid = result.outcome === "PASS" && identity_valid && state_valid && authority_valid && services_valid && inheritance_valid && replay_valid && audit_valid && governance_valid && certification_package_valid && certification_valid && result_replay_valid;
  return nested({ valid, outcome: result.outcome, identity_valid, state_valid, authority_valid, services_valid, inheritance_valid, replay_valid, audit_valid, governance_valid, certification_package_valid, certification_valid, result_replay_valid, failures: result.failures });
}

export function replayContinuousOperationsFoundation(result = runContinuousOperationsFoundation()): boolean {
  const replayed = runContinuousOperationsFoundation();
  return result.replay_hash === replayed.replay_hash && result.integrity_hash === replayed.integrity_hash && validateContinuousOperationsFoundation(result).valid;
}

export function getContinuousOperationsFoundationBundle(): ContinuousOperationsFoundationBundle {
  const result = runContinuousOperationsFoundation();
  return Object.freeze({ doctrine: Object.freeze({ version: VERSION, upstream_phase: "phase-17-certification-gate/v17.12" as const, lifecycle_states: lifecycleStates, standing_service_categories: categories, certification_outcomes: freezeArray(["PASS", "CONDITIONAL_PASS", "FAIL"] as const) }), result, validation: validateContinuousOperationsFoundation(result) });
}

export const ContinuousOperationsFoundationService = Object.freeze({ run: runContinuousOperationsFoundation, validate: validateContinuousOperationsFoundation, replay: replayContinuousOperationsFoundation });
