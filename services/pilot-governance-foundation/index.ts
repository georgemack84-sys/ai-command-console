import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { runProductionCertificationGate } from "@/services/production-certification-gate";
import type {
  PilotGovernanceBundle,
  PilotGovernanceCertificationTest,
  PilotGovernanceFailure,
  PilotGovernanceInput,
  PilotGovernanceOutcome,
  PilotGovernanceResult,
  PilotGovernanceValidation,
  PilotLifecycleState,
  PilotRiskClassification,
} from "@/types/pilot-governance-foundation";

const VERSION = "pilot-governance-foundation/v16.1" as const;
const IDENTIFIER = "PilotGovernanceFoundation" as const;
const TIMESTAMP = "2026-07-15T00:00:00.000Z" as const;
const DEFAULT_TENANT = "tenant_phase_16_pilot_governance" as const;
const DEFAULT_OPERATOR = "operator_phase_16_pilot_governance" as const;

function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function hash(value: unknown): string { return generateDecisionIntegrityHash(value); }
function hashWithoutIntegrity<T extends object>(value: T): string { const copy = { ...value } as Record<string, unknown>; delete copy.integrity_hash; return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown); }
function nested<T extends object>(value: T): T & { integrity_hash: string } { return Object.freeze({ ...value, integrity_hash: hashWithoutIntegrity(value) }) as T & { integrity_hash: string }; }
function verify(value: { integrity_hash: string }): boolean { return hashWithoutIntegrity(value) === value.integrity_hash; }
function id(prefix: string, value: unknown): string { return `${prefix}_${hash(value).slice(0, 20)}`; }
function has(failures: readonly PilotGovernanceFailure[], failure: PilotGovernanceFailure): boolean { return failures.includes(failure); }
function directFailure(scenario: PilotGovernanceInput["scenario"]): PilotGovernanceFailure | undefined { return !scenario || scenario === "BASELINE" ? undefined : scenario; }
function outcomeFor(failures: readonly PilotGovernanceFailure[]): PilotGovernanceOutcome {
  if (failures.length === 1 && failures[0] === "NON_CONSTITUTIONAL_PILOT_WARNING") return "CONDITIONAL_PASS";
  return failures.length ? "FAIL" : "PASS";
}

const lifecycleStates = freezeArray(["PLANNED", "QUALIFIED", "APPROVED", "ACTIVE", "MONITORED", "ROLLED_BACK", "TERMINATED", "EXPANDED", "COMPLETE"] as const satisfies readonly PilotLifecycleState[]);
const riskClassifications = freezeArray(["LOW", "MODERATE", "HIGH", "CRITICAL", "CONSTITUTIONAL"] as const satisfies readonly PilotRiskClassification[]);

function certTest(name: string, passed: boolean, failure: PilotGovernanceFailure, evidence_refs: readonly string[]): PilotGovernanceCertificationTest {
  const actual: PilotGovernanceOutcome = passed ? "PASS" : failure === "NON_CONSTITUTIONAL_PILOT_WARNING" ? "CONDITIONAL_PASS" : "FAIL";
  return nested({ test_id: id("pilot_governance_test", name), name, expected: "PASS" as const, actual, passed, failure_reason: passed ? null : failure, evidence_refs: freezeArray(evidence_refs) });
}
function resultReplayHash(result: Omit<PilotGovernanceResult, "replay_hash" | "integrity_hash">): string {
  return hash({ certification: result.production_certification_ref, contract: result.contract.integrity_hash, lifecycle: result.lifecycle.integrity_hash, authority: result.authority.integrity_hash, ownership: result.ownership.integrity_hash, scope: result.scope.integrity_hash, criteria: result.criteria.integrity_hash, transition: result.transition.integrity_hash, decision: result.decision.integrity_hash, ledger: result.ledger.map((entry) => entry.integrity_hash), tests: result.certification_tests.map((test) => test.integrity_hash), outcome: result.outcome });
}
function resultIntegrityHash(result: Omit<PilotGovernanceResult, "integrity_hash">): string {
  return hash({ version: result.phase_version, identifier: result.phase_identifier, outcome: result.outcome, replay_hash: result.replay_hash });
}

export function runPilotGovernanceFoundation(input: PilotGovernanceInput = {}): PilotGovernanceResult {
  const certification = runProductionCertificationGate({ tenant_id: input.tenant_id ?? DEFAULT_TENANT, operator_id: input.operator_id ?? DEFAULT_OPERATOR });
  const direct = directFailure(input.scenario);
  const upstreamFailures: PilotGovernanceFailure[] = certification.outcome === "PASS" ? [] : ["PHASE_15_CERTIFICATION_NOT_PASSED"];
  const failures = freezeArray([...new Set([...upstreamFailures, ...(direct ? [direct] : [])])]);
  const pilotId = input.pilot_id ?? id("pilot", certification.integrity_hash);
  const evidenceRefs = has(failures, "EVIDENCE_LINEAGE_INCOMPLETE") ? freezeArray([]) : freezeArray([certification.integrity_hash, certification.certification_record.integrity_hash]);
  const contract = nested({ contract_version: VERSION, constitutional_scope: "limited governed production pilot", permitted_production_behavior: freezeArray(["observe", "recommend", "explain", "governed pilot operation"]), operational_constraints: freezeArray(["limited scope", "tenant isolation", "advisory only", "governance approval required"]), required_evidence: freezeArray(["governance approvals", "qualification evidence", "production authorization", "authority validation", "lifecycle history", "replay checkpoints", "monitoring evidence", "rollback evidence", "termination evidence", "completion evidence"]), approval_requirements: freezeArray(["governance approval", "qualification approval", "production authorization"]), monitoring_obligations: freezeArray(["active observation", "evidence collection", "replay checkpoints"]), rollback_requirements: freezeArray(["independent rollback authority", "rollback evidence", "rollback lineage"]), completion_conditions: freezeArray(["objectives achieved", "governance satisfied", "evidence complete", "replay validated"]), expansion_requirements: freezeArray(["new governance approval", "updated qualification evidence"]), termination_conditions: freezeArray(["governed terminal decision", "history preserved"]), approved: !has(failures, "GOVERNANCE_CONTRACT_NOT_APPROVED"), advisory_only: !has(failures, "ADVISORY_ONLY_NOT_PRESERVED"), fail_closed: !has(failures, "UNAUTHORIZED_ADVANCEMENT_POSSIBLE") });
  const lifecycle = nested({ lifecycle_id: id("pilot_lifecycle", pilotId), states: lifecycleStates, valid_transitions: freezeArray(["PLANNED>QUALIFIED", "QUALIFIED>APPROVED", "APPROVED>ACTIVE", "ACTIVE>MONITORED", "MONITORED>EXPANDED", "MONITORED>ROLLED_BACK", "MONITORED>TERMINATED", "EXPANDED>COMPLETE", "ROLLED_BACK>COMPLETE", "TERMINATED>COMPLETE"]), deterministic: !has(failures, "PILOT_LIFECYCLE_NON_DETERMINISTIC"), terminal_states_governed: !has(failures, "TERMINAL_STATES_NOT_GOVERNED"), immutable_history_required: !has(failures, "LIFECYCLE_TRANSITIONS_MUTABLE"), replay_required: !has(failures, "PILOT_HISTORY_NOT_REPLAYABLE") });
  const authority = nested({ authority_id: id("pilot_authority", pilotId), governance_approval_authority: "governance_board", qualification_approval_authority: "certification_authority", production_authorization_authority: "production_authority", rollback_authority: "independent_rollback_authority", expansion_approval_authority: "governance_board", termination_approval_authority: "governance_board", certification_review_authority: "constitutional_certification_authority", operational_monitoring_owner: "operations_owner", evidence_acceptance_authority: "evidence_governance", final_completion_authority: "governance_board", explicit: !has(failures, "AUTHORITY_MODEL_NOT_EXPLICIT"), authority_separated: !has(failures, "AUTHORITY_MODEL_NOT_EXPLICIT"), rollback_independent: !has(failures, "ROLLBACK_AUTHORITY_NOT_INDEPENDENT") });
  const ownership = nested({ pilot_id: pilotId, pilot_owner: "pilot_owner", governance_authority: authority.governance_approval_authority, operational_owner: "operations_owner", production_environment: certification.certification_record.environment_id, scope_definition: "limited governed tenant pilot", tenant_scope: freezeArray([input.tenant_id ?? DEFAULT_TENANT]), risk_classification: "HIGH" as const, approval_refs: evidenceRefs, certification_refs: freezeArray([certification.certification_record.integrity_hash]), current_state: "MONITORED" as const, attributable: !has(failures, "OWNERSHIP_NOT_ATTRIBUTABLE") });
  const scope = nested({ scope_id: id("pilot_scope", pilotId), participating_tenants: ownership.tenant_scope, enabled_capabilities: freezeArray(["production observation", "recommendation evaluation"]), production_limits: freezeArray(["bounded traffic", "bounded tenants", "no autonomous execution"]), geographic_boundaries: freezeArray(["authorized regions only"]), environment_restrictions: freezeArray([ownership.production_environment]), monitoring_requirements: freezeArray(["continuous monitoring", "operator review"]), rollback_boundaries: freezeArray(["tenant scoped rollback", "capability rollback"]), success_measurements: freezeArray(["functional objectives", "governance compliance", "production safety"]), expansion_authorized: !has(failures, "EXPANSION_WITHOUT_GOVERNANCE"), tenant_isolation_preserved: !has(failures, "TENANT_ISOLATION_NOT_PRESERVED") });
  const criteria = nested({ criteria_id: id("pilot_criteria", pilotId), functional_objectives: true, governance_compliance: !has(failures, "CONSTITUTIONAL_RULES_NOT_VERIFIED"), operational_stability: true, replay_consistency: !has(failures, "PILOT_HISTORY_NOT_REPLAYABLE"), tenant_isolation: !has(failures, "TENANT_ISOLATION_NOT_PRESERVED"), advisory_boundary_preservation: !has(failures, "ADVISORY_ONLY_NOT_PRESERVED"), rollback_readiness: !has(failures, "ROLLBACK_AUTHORITY_NOT_INDEPENDENT"), operator_satisfaction: true, evidence_completeness: evidenceRefs.length > 0, production_safety: !has(failures, "PRODUCTION_BOUNDARIES_NOT_ENFORCED"), exit_objectives_achieved: true, exit_reviews_finalized: !has(failures, "TERMINAL_STATES_NOT_GOVERNED") });
  const transition = nested({ transition_id: id("pilot_transition", pilotId), from_state: "ACTIVE" as const, to_state: "MONITORED" as const, current_state_validated: !has(failures, "PILOT_LIFECYCLE_NON_DETERMINISTIC"), governance_authorized: !has(failures, "GOVERNANCE_DECISIONS_NOT_TRACEABLE"), authority_verified: authority.explicit, evidence_refs: evidenceRefs, replay_checkpoint_ref: has(failures, "PILOT_HISTORY_NOT_REPLAYABLE") ? "" : id("pilot_replay_checkpoint", pilotId), ledger_entry_ref: id("pilot_ledger_entry", pilotId), timestamp: TIMESTAMP, operator_ref: input.operator_id ?? DEFAULT_OPERATOR, certification_validated: !has(failures, "PHASE_15_CERTIFICATION_NOT_PASSED"), integrity_verified: !has(failures, "LIFECYCLE_TRANSITIONS_MUTABLE"), immutable: !has(failures, "LIFECYCLE_TRANSITIONS_MUTABLE"), replayable: !has(failures, "PILOT_HISTORY_NOT_REPLAYABLE") });
  const decision = nested({ decision_id: id("pilot_governance_decision", pilotId), lifecycle_decision: "ADVANCE" as const, deterministic: !has(failures, "PILOT_LIFECYCLE_NON_DETERMINISTIC"), governance_supremacy: !has(failures, "GOVERNANCE_DECISIONS_NOT_TRACEABLE"), explicit_authority: authority.explicit, fail_closed_advancement: !has(failures, "UNAUTHORIZED_ADVANCEMENT_POSSIBLE"), unauthorized_advancement_blocked: !has(failures, "UNAUTHORIZED_ADVANCEMENT_POSSIBLE"), expansion_requires_governance: !has(failures, "EXPANSION_WITHOUT_GOVERNANCE"), fully_traceable: !has(failures, "GOVERNANCE_DECISIONS_NOT_TRACEABLE") && evidenceRefs.length > 0, evidence_refs: evidenceRefs });
  const ledgerTypes = ["CONTRACT", "AUTHORITY", "OWNERSHIP", "SCOPE", "CRITERIA", "TRANSITION", "DECISION", "CERTIFICATION"] as const;
  const ledger = freezeArray(ledgerTypes.map((event_type, index) => nested({ ledger_entry_id: id("pilot_governance_ledger", { pilotId, event_type }), sequence: index + 1, event_type, pilot_id: pilotId, evidence_refs: has(failures, "LIFECYCLE_TRANSITIONS_MUTABLE") ? freezeArray([]) : evidenceRefs, lineage_refs: has(failures, "EVIDENCE_LINEAGE_INCOMPLETE") ? freezeArray([]) : freezeArray([certification.integrity_hash, transition.integrity_hash]), replay_refs: has(failures, "PILOT_HISTORY_NOT_REPLAYABLE") ? freezeArray([]) : freezeArray([transition.replay_checkpoint_ref]), append_only: !has(failures, "LIFECYCLE_TRANSITIONS_MUTABLE"), immutable: !has(failures, "LIFECYCLE_TRANSITIONS_MUTABLE") })));
  const tests = freezeArray([
    certTest("Governance contract approved", contract.approved, "GOVERNANCE_CONTRACT_NOT_APPROVED", [contract.integrity_hash]),
    certTest("Pilot lifecycle deterministic", lifecycle.deterministic && decision.deterministic, "PILOT_LIFECYCLE_NON_DETERMINISTIC", [lifecycle.integrity_hash]),
    certTest("Authority model explicit", authority.explicit && authority.authority_separated, "AUTHORITY_MODEL_NOT_EXPLICIT", [authority.integrity_hash]),
    certTest("Ownership assignments attributable", ownership.attributable, "OWNERSHIP_NOT_ATTRIBUTABLE", [ownership.integrity_hash]),
    certTest("Lifecycle transitions immutable", transition.immutable && ledger.every((entry) => entry.immutable), "LIFECYCLE_TRANSITIONS_MUTABLE", [transition.integrity_hash]),
    certTest("Pilot history replayable", transition.replayable && ledger.every((entry) => entry.replay_refs.length > 0), "PILOT_HISTORY_NOT_REPLAYABLE", [transition.integrity_hash]),
    certTest("Governance decisions fully traceable", decision.fully_traceable && transition.governance_authorized, "GOVERNANCE_DECISIONS_NOT_TRACEABLE", [decision.integrity_hash]),
    certTest("Production boundaries constitutionally enforced", criteria.production_safety && scope.production_limits.length > 0, "PRODUCTION_BOUNDARIES_NOT_ENFORCED", [scope.integrity_hash]),
    certTest("Rollback authority independently governed", authority.rollback_independent && criteria.rollback_readiness, "ROLLBACK_AUTHORITY_NOT_INDEPENDENT", [authority.integrity_hash]),
    certTest("Advisory-only operation preserved", contract.advisory_only && criteria.advisory_boundary_preservation, "ADVISORY_ONLY_NOT_PRESERVED", [contract.integrity_hash]),
    certTest("Terminal states governance-controlled", lifecycle.terminal_states_governed && criteria.exit_reviews_finalized, "TERMINAL_STATES_NOT_GOVERNED", [lifecycle.integrity_hash]),
    certTest("Evidence lineage complete", evidenceRefs.length > 0 && ledger.every((entry) => entry.lineage_refs.length > 0), "EVIDENCE_LINEAGE_INCOMPLETE", ledger.map((entry) => entry.integrity_hash)),
    certTest("Unauthorized lifecycle advancement impossible", decision.unauthorized_advancement_blocked && decision.fail_closed_advancement && contract.fail_closed, "UNAUTHORIZED_ADVANCEMENT_POSSIBLE", [decision.integrity_hash]),
    certTest("Expansion requires governance approval", decision.expansion_requires_governance && scope.expansion_authorized, "EXPANSION_WITHOUT_GOVERNANCE", [scope.integrity_hash]),
    certTest("All constitutional rules pass deterministic verification", criteria.governance_compliance, "CONSTITUTIONAL_RULES_NOT_VERIFIED", [criteria.integrity_hash]),
    certTest("Tenant isolation preserved", scope.tenant_isolation_preserved && criteria.tenant_isolation, "TENANT_ISOLATION_NOT_PRESERVED", [scope.integrity_hash]),
    certTest("Phase 15 production certification passed", certification.outcome === "PASS" && transition.certification_validated, "PHASE_15_CERTIFICATION_NOT_PASSED", [certification.integrity_hash]),
  ]);
  const effectiveFailures = freezeArray([...new Set([...failures, ...tests.map((test) => test.failure_reason).filter((failure): failure is PilotGovernanceFailure => Boolean(failure))])]);
  const outcome = outcomeFor(effectiveFailures);
  const base: Omit<PilotGovernanceResult, "replay_hash" | "integrity_hash"> = { phase_version: VERSION, phase_identifier: IDENTIFIER, production_certification_ref: certification.integrity_hash, contract, lifecycle, authority, ownership, scope, criteria, transition, decision, ledger, certification_tests: tests, failures: effectiveFailures, outcome };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function validatePilotGovernanceFoundation(result = runPilotGovernanceFoundation()): PilotGovernanceValidation {
  const contract_valid = verify(result.contract) && result.contract.approved && result.contract.advisory_only && result.contract.fail_closed && result.contract.required_evidence.length === 10;
  const lifecycle_valid = verify(result.lifecycle) && result.lifecycle.states.length === 9 && result.lifecycle.deterministic && result.lifecycle.terminal_states_governed && result.lifecycle.immutable_history_required && result.lifecycle.replay_required;
  const authority_valid = verify(result.authority) && result.authority.explicit && result.authority.authority_separated && result.authority.rollback_independent;
  const ownership_valid = verify(result.ownership) && result.ownership.attributable && result.ownership.approval_refs.length > 0 && result.ownership.certification_refs.length > 0;
  const scope_valid = verify(result.scope) && result.scope.expansion_authorized && result.scope.tenant_isolation_preserved && result.scope.production_limits.length > 0;
  const criteria_valid = verify(result.criteria) && Object.entries(result.criteria).filter(([key]) => key !== "criteria_id" && key !== "integrity_hash").every(([, value]) => value === true);
  const transition_valid = verify(result.transition) && result.transition.governance_authorized && result.transition.authority_verified && result.transition.evidence_refs.length > 0 && Boolean(result.transition.replay_checkpoint_ref) && result.transition.certification_validated && result.transition.integrity_verified && result.transition.immutable && result.transition.replayable;
  const decision_valid = verify(result.decision) && result.decision.deterministic && result.decision.governance_supremacy && result.decision.explicit_authority && result.decision.fail_closed_advancement && result.decision.unauthorized_advancement_blocked && result.decision.expansion_requires_governance && result.decision.fully_traceable;
  const ledger_valid = result.ledger.length === 8 && result.ledger.every((entry, index) => verify(entry) && entry.sequence === index + 1 && entry.evidence_refs.length > 0 && entry.lineage_refs.length > 0 && entry.replay_refs.length > 0 && entry.append_only && entry.immutable);
  const certification_valid = result.certification_tests.length === 17 && result.certification_tests.every((test) => verify(test) && test.passed && test.evidence_refs.length > 0);
  const replay_valid = resultReplayHash(result) === result.replay_hash && resultIntegrityHash(result) === result.integrity_hash;
  const valid = result.outcome === "PASS" && replay_valid && contract_valid && lifecycle_valid && authority_valid && ownership_valid && scope_valid && criteria_valid && transition_valid && decision_valid && ledger_valid && certification_valid;
  return nested({ valid, outcome: result.outcome, contract_valid, lifecycle_valid, authority_valid, ownership_valid, scope_valid, criteria_valid, transition_valid, decision_valid, ledger_valid, certification_valid, replay_valid, failures: result.failures });
}

export function replayPilotGovernanceFoundation(result = runPilotGovernanceFoundation()): boolean {
  const replayed = runPilotGovernanceFoundation();
  return result.replay_hash === replayed.replay_hash && result.integrity_hash === replayed.integrity_hash && validatePilotGovernanceFoundation(result).valid;
}

export function getPilotGovernanceFoundationBundle(): PilotGovernanceBundle {
  const result = runPilotGovernanceFoundation();
  return Object.freeze({ doctrine: Object.freeze({ version: VERSION, upstream_phase: "production-certification-gate/v15.12" as const, lifecycle: lifecycleStates, risk_classifications: riskClassifications, certification_outcomes: freezeArray(["PASS", "CONDITIONAL_PASS", "FAIL"] as const) }), result, validation: validatePilotGovernanceFoundation(result) });
}

export const PilotGovernanceFoundationService = Object.freeze({ run: runPilotGovernanceFoundation, validate: validatePilotGovernanceFoundation, replay: replayPilotGovernanceFoundation });
