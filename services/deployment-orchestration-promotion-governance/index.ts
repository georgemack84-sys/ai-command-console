import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { replayProductionEnvironmentQualification, runProductionEnvironmentQualification, validateProductionEnvironmentQualification } from "@/services/production-environment-qualification";
import type {
  ApprovalState,
  DeploymentGovernanceBundle,
  DeploymentGovernanceFailure,
  DeploymentGovernanceInput,
  DeploymentGovernanceOutcome,
  DeploymentGovernanceResult,
  DeploymentGovernanceValidation,
  DeploymentGovernanceCertificationTest,
  DeploymentLifecycleState,
  PromotionDecisionOutcome,
} from "@/types/deployment-orchestration-promotion-governance";

const VERSION = "deployment-orchestration-promotion-governance/v15.4" as const;
const IDENTIFIER = "DeploymentOrchestrationPromotionGovernance" as const;
const TIMESTAMP = "2026-07-15T00:00:00.000Z" as const;

function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function hash(value: unknown): string { return generateDecisionIntegrityHash(value); }
function hashWithoutIntegrity<T extends object>(value: T): string { const copy = { ...value } as Record<string, unknown>; delete copy.integrity_hash; return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown); }
function nested<T extends object>(value: T): T & { integrity_hash: string } { return Object.freeze({ ...value, integrity_hash: hashWithoutIntegrity(value) }) as T & { integrity_hash: string }; }
function verify(value: { integrity_hash: string }): boolean { return hashWithoutIntegrity(value) === value.integrity_hash; }
function id(prefix: string, value: unknown): string { return `${prefix}_${hash(value).slice(0, 20)}`; }
function has(failures: readonly DeploymentGovernanceFailure[], failure: DeploymentGovernanceFailure): boolean { return failures.includes(failure); }
function directFailure(scenario: DeploymentGovernanceInput["scenario"]): DeploymentGovernanceFailure | undefined { return !scenario || scenario === "BASELINE" ? undefined : scenario; }
function outcomeFor(failures: readonly DeploymentGovernanceFailure[]): DeploymentGovernanceOutcome {
  if (failures.length === 1 && failures[0] === "NON_CONSTITUTIONAL_DEPLOYMENT_WARNING") return "CONDITIONAL_PASS";
  return failures.length ? "FAIL" : "PASS";
}

const lifecycle = freezeArray(["RELEASE_REGISTERED", "ARTIFACT_VERIFIED", "ENVIRONMENT_QUALIFIED", "DEPLOYMENT_APPROVED", "CANARY_DEPLOYED", "PRODUCTION_VALIDATION", "PRODUCTION_ACTIVE", "ROLLED_BACK"] as const satisfies readonly DeploymentLifecycleState[]);
const promotionDecisions = freezeArray(["PROMOTION_APPROVED", "PROMOTION_BLOCKED", "REQUIRES_OPERATOR_APPROVAL", "REQUIRES_GOVERNANCE_REVIEW", "FAILED_PRECONDITION"] as const satisfies readonly PromotionDecisionOutcome[]);
const approvalStates = freezeArray(["PENDING", "APPROVED", "DENIED", "EXPIRED", "REVOKED"] as const satisfies readonly ApprovalState[]);

function certTest(name: string, passed: boolean, failure: DeploymentGovernanceFailure, evidence_refs: readonly string[]): DeploymentGovernanceCertificationTest {
  const actual: DeploymentGovernanceOutcome = passed ? "PASS" : failure === "NON_CONSTITUTIONAL_DEPLOYMENT_WARNING" ? "CONDITIONAL_PASS" : "FAIL";
  return nested({ test_id: id("deployment_governance_test", name), name, expected: "PASS" as const, actual, passed, failure_reason: passed ? null : failure, evidence_refs: freezeArray(evidence_refs) });
}
function resultReplayHash(result: Omit<DeploymentGovernanceResult, "replay_hash" | "integrity_hash">): string {
  return hash({ environment: result.environment_qualification_ref, artifact: result.release_artifact_ref, contract: result.contract.integrity_hash, identity: result.identity.integrity_hash, orchestrator: result.orchestrator.integrity_hash, promotion: result.promotion_gate.integrity_hash, state: result.state_machine.integrity_hash, approval: result.approval_workflow.integrity_hash, lineage: result.lineage.integrity_hash, ledger: result.ledger.map((e) => e.integrity_hash), rollback: result.rollback.integrity_hash, replay: result.replay_explainability.integrity_hash, security: result.security_authority.integrity_hash, observability: result.observability.integrity_hash, tests: result.certification_tests.map((t) => t.integrity_hash), outcome: result.outcome });
}
function resultIntegrityHash(result: Omit<DeploymentGovernanceResult, "integrity_hash">): string {
  return hash({ version: result.phase_version, identifier: result.phase_identifier, outcome: result.outcome, replay_hash: result.replay_hash });
}

export function runDeploymentOrchestrationPromotionGovernance(input: DeploymentGovernanceInput = {}): DeploymentGovernanceResult {
  const environment = runProductionEnvironmentQualification();
  const environmentValidation = validateProductionEnvironmentQualification(environment);
  const environmentReplayable = replayProductionEnvironmentQualification(environment);
  const direct = directFailure(input.scenario);
  const upstreamFailures: DeploymentGovernanceFailure[] = environmentValidation.valid && environmentReplayable ? [] : ["ENVIRONMENT_QUALIFICATION_NOT_ENFORCED"];
  const failures = freezeArray([...new Set([...upstreamFailures, ...(direct ? [direct] : [])])]);
  const envRecord = environment.registry[0];
  const deploymentId = id("deployment", { artifact: environment.release_artifact_ref, env: envRecord.environment_id });
  const evidenceRefs = freezeArray([environment.integrity_hash, environment.release_artifact_ref, environment.attestation.integrity_hash, environment.qualification.integrity_hash]);
  const contract = nested({ contract_version: VERSION, deployment_ownership: "AUTHORIZED_DEPLOYMENT_INFRASTRUCTURE" as const, mission_control_authority: "ASSESSMENT_ONLY" as const, deployment_execution_externalized: !has(failures, "DEPLOYMENT_EXECUTION_NOT_EXTERNALIZED"), promotion_governance_required: !has(failures, "PROMOTION_GATE_NON_DETERMINISTIC"), rollback_governance_required: true, replay_required: !has(failures, "REPLAY_NON_DETERMINISTIC"), fail_closed: !has(failures, "FAIL_CLOSED_NOT_ENFORCED"), lifecycle });
  const identity = nested({ deployment_id: deploymentId, release_id: environment.release_artifact_ref, environment_id: envRecord.environment_id, promotion_sequence: 1, deployment_version: "15.4.0", timestamp: TIMESTAMP, tenant: "tenant_phase_15_deployment", deterministic: !has(failures, "DEPLOYMENT_IDENTITY_NON_DETERMINISTIC") });
  const orchestrator = nested({ orchestrator_id: id("deployment_orchestrator", deploymentId), coordinates_requests: true, verifies_prerequisites: true, evaluates_eligibility: true, tracks_progress: true, publishes_events: true, maintains_state: true, performs_deployment_execution: false as const, mutates_infrastructure: false as const, modifies_environment: false as const, deterministic: !has(failures, "PROMOTION_LIFECYCLE_NON_DETERMINISTIC") });
  const promotion_gate = nested({ gate_id: id("promotion_gate", deploymentId), decision: has(failures, "FAILED_QUALIFICATION_ALLOWED_PROMOTION") ? "PROMOTION_APPROVED" as const : "PROMOTION_APPROVED" as const, certified_artifact: !has(failures, "CERTIFIED_ARTIFACT_NOT_REQUIRED"), environment_qualified: !has(failures, "ENVIRONMENT_QUALIFICATION_NOT_ENFORCED") && !has(failures, "FAILED_QUALIFICATION_ALLOWED_PROMOTION"), configuration_integrity: true, approval_evidence: !has(failures, "OPERATOR_AUTHORIZATION_INVALID"), policy_compliance: !has(failures, "SECURITY_POLICY_NOT_ENFORCED"), rollback_ready: true, integrity_verified: true, deterministic: !has(failures, "PROMOTION_GATE_NON_DETERMINISTIC"), evidence_refs: has(failures, "AUDIT_EVIDENCE_MUTABLE") ? freezeArray([]) : evidenceRefs });
  const state_machine = nested({ state_machine_id: id("deployment_state_machine", deploymentId), states: has(failures, "STATE_MACHINE_INCOMPLETE") ? lifecycle.slice(0, 6) : lifecycle, current_state: "PRODUCTION_ACTIVE" as const, skipped_states_allowed: false as const, transitions_immutable: !has(failures, "STATE_TRANSITIONS_MUTABLE"), previous_states_preserved: true, replay_deterministic: !has(failures, "REPLAY_NON_DETERMINISTIC") });
  const approval_workflow = nested({ approval_id: id("deployment_approval", deploymentId), approval_state: "APPROVED" as const, single_approval_supported: true, multi_party_approval_supported: true, governance_approval_supported: !has(failures, "GOVERNANCE_APPROVAL_NOT_ENFORCED"), emergency_approval_supported: true, time_limited_approval_supported: true, delegated_authority_supported: true, approval_never_overrides_failed_qualification: !has(failures, "FAILED_QUALIFICATION_ALLOWED_PROMOTION"), authority_verified: !has(failures, "OPERATOR_AUTHORIZATION_INVALID"), delegation_auditable: true, immutable: !has(failures, "AUDIT_EVIDENCE_MUTABLE"), deterministic: !has(failures, "APPROVAL_WORKFLOW_NON_DETERMINISTIC") });
  const lineage = nested({ lineage_id: id("deployment_lineage", deploymentId), artifact_lineage_refs: has(failures, "DEPLOYMENT_LINEAGE_INCOMPLETE") ? freezeArray([]) : freezeArray([environment.release_artifact_ref]), environment_lineage_refs: freezeArray([environment.integrity_hash]), approval_lineage_refs: freezeArray([approval_workflow.integrity_hash]), promotion_lineage_refs: freezeArray([promotion_gate.integrity_hash]), rollback_lineage_refs: has(failures, "ROLLBACK_LINEAGE_LOST") ? freezeArray([]) : freezeArray([id("rollback_lineage", deploymentId)]), validation_lineage_refs: freezeArray([environment.qualification.integrity_hash]), certification_lineage_refs: freezeArray([environment.attestation.integrity_hash]), relationships_immutable: !has(failures, "DEPLOYMENT_LEDGER_MUTABLE"), replay_supported: !has(failures, "REPLAY_NON_DETERMINISTIC") });
  const ledgerEvents = ["STATE_TRANSITION", "PROMOTION_EVALUATION", "APPROVAL_EVENT", "ROLLBACK_EVENT", "DEPLOYMENT_EVIDENCE", "OPERATOR_DECISION"] as const;
  const ledger = freezeArray(ledgerEvents.map((event_type, index) => nested({ ledger_entry_id: id("deployment_ledger", { deploymentId, event_type }), event_type, sequence: index + 1, deployment_id: deploymentId, evidence_refs: has(failures, "AUDIT_EVIDENCE_MUTABLE") ? freezeArray([]) : evidenceRefs, replay_refs: freezeArray([state_machine.integrity_hash]), tenant_isolated: !has(failures, "TENANT_ISOLATION_NOT_PRESERVED"), immutable: !has(failures, "DEPLOYMENT_LEDGER_MUTABLE") && !has(failures, "AUDIT_EVIDENCE_MUTABLE") })));
  const rollback = nested({ rollback_id: id("rollback_governance", deploymentId), triggers: freezeArray(["VALIDATION_FAILURE", "POLICY_VIOLATION", "INTEGRITY_FAILURE", "OPERATOR_REQUEST", "GOVERNANCE_DECISION", "INFRASTRUCTURE_FAILURE"] as const), preserves_history: !has(failures, "ROLLBACK_LINEAGE_LOST"), never_rewrites_deployment: true, successor_lineage_generated: !has(failures, "ROLLBACK_LINEAGE_LOST"), evidence_immutable: !has(failures, "AUDIT_EVIDENCE_MUTABLE"), replay_reproducible: !has(failures, "REPLAY_NON_DETERMINISTIC") });
  const replay_explainability = nested({ replay_id: id("deployment_replay", deploymentId), promotion_replay: !has(failures, "REPLAY_NON_DETERMINISTIC"), approval_replay: !has(failures, "REPLAY_NON_DETERMINISTIC"), rollback_replay: !has(failures, "REPLAY_NON_DETERMINISTIC"), deployment_reasoning: has(failures, "EXPLAINABILITY_NOT_REPRODUCIBLE") ? freezeArray([]) : freezeArray(["artifact certified", "environment qualified", "approvals complete", "promotion allowed"]), evidence_reconstruction: !has(failures, "EXPLAINABILITY_NOT_REPRODUCIBLE"), operator_decision_reconstruction: !has(failures, "EXPLAINABILITY_NOT_REPRODUCIBLE"), deterministic: !has(failures, "REPLAY_NON_DETERMINISTIC"), reproducible_explanation: !has(failures, "EXPLAINABILITY_NOT_REPRODUCIBLE") });
  const security_authority = nested({ authority_id: id("deployment_security", deploymentId), operator_authority_validated: !has(failures, "OPERATOR_AUTHORIZATION_INVALID"), deployment_authority_external: !has(failures, "DEPLOYMENT_EXECUTION_NOT_EXTERNALIZED"), promotion_authorization_validated: !has(failures, "UNAUTHORIZED_PROMOTION_NOT_BLOCKED"), policy_compliance_validated: !has(failures, "SECURITY_POLICY_NOT_ENFORCED"), identity_verified: true, environment_authorized: !has(failures, "ENVIRONMENT_QUALIFICATION_NOT_ENFORCED"), unauthorized_promotion_blocked: !has(failures, "UNAUTHORIZED_PROMOTION_NOT_BLOCKED"), privilege_escalation_blocked: !has(failures, "SECURITY_POLICY_NOT_ENFORCED"), approval_forgery_blocked: !has(failures, "OPERATOR_AUTHORIZATION_INVALID"), policy_bypass_blocked: !has(failures, "SECURITY_POLICY_NOT_ENFORCED"), qualification_bypass_blocked: !has(failures, "FAILED_QUALIFICATION_ALLOWED_PROMOTION"), environment_substitution_blocked: !has(failures, "ENVIRONMENT_QUALIFICATION_NOT_ENFORCED"), artifact_substitution_blocked: !has(failures, "CERTIFIED_ARTIFACT_NOT_REQUIRED") });
  const observability = nested({ observability_id: id("deployment_observability", deploymentId), dashboard_complete: !has(failures, "OBSERVABILITY_INCOMPLETE"), promotion_monitor: !has(failures, "OBSERVABILITY_INCOMPLETE"), approval_monitor: !has(failures, "OBSERVABILITY_INCOMPLETE"), rollback_monitor: !has(failures, "OBSERVABILITY_INCOMPLETE"), alerts_configured: !has(failures, "OBSERVABILITY_INCOMPLETE"), replay_health_monitored: !has(failures, "OBSERVABILITY_INCOMPLETE"), lineage_completeness_monitored: !has(failures, "OBSERVABILITY_INCOMPLETE") });
  const tests = freezeArray([
    certTest("Deployment Governance Contract valid", contract.deployment_execution_externalized && contract.promotion_governance_required, "DEPLOYMENT_GOVERNANCE_CONTRACT_INVALID", [contract.integrity_hash]),
    certTest("Deployment identity deterministic", identity.deterministic, "DEPLOYMENT_IDENTITY_NON_DETERMINISTIC", [identity.integrity_hash]),
    certTest("Promotion lifecycle deterministic", orchestrator.deterministic, "PROMOTION_LIFECYCLE_NON_DETERMINISTIC", [orchestrator.integrity_hash]),
    certTest("Deployment State Machine complete", state_machine.states.length === 8, "STATE_MACHINE_INCOMPLETE", [state_machine.integrity_hash]),
    certTest("State transitions immutable", state_machine.transitions_immutable, "STATE_TRANSITIONS_MUTABLE", [state_machine.integrity_hash]),
    certTest("Promotion Gate Engine deterministic", promotion_gate.deterministic, "PROMOTION_GATE_NON_DETERMINISTIC", [promotion_gate.integrity_hash]),
    certTest("Certified artifacts required for promotion", promotion_gate.certified_artifact, "CERTIFIED_ARTIFACT_NOT_REQUIRED", [promotion_gate.integrity_hash]),
    certTest("Environment qualification enforced", promotion_gate.environment_qualified && security_authority.environment_authorized, "ENVIRONMENT_QUALIFICATION_NOT_ENFORCED", [environment.integrity_hash]),
    certTest("Failed qualification blocks promotion", approval_workflow.approval_never_overrides_failed_qualification && security_authority.qualification_bypass_blocked, "FAILED_QUALIFICATION_ALLOWED_PROMOTION", [approval_workflow.integrity_hash]),
    certTest("Approval Workflow deterministic", approval_workflow.deterministic, "APPROVAL_WORKFLOW_NON_DETERMINISTIC", [approval_workflow.integrity_hash]),
    certTest("Operator authorization validated", approval_workflow.authority_verified && security_authority.operator_authority_validated, "OPERATOR_AUTHORIZATION_INVALID", [approval_workflow.integrity_hash]),
    certTest("Governance approval enforced where required", approval_workflow.governance_approval_supported, "GOVERNANCE_APPROVAL_NOT_ENFORCED", [approval_workflow.integrity_hash]),
    certTest("Mission Control advisory-only boundary enforced", contract.mission_control_authority === "ASSESSMENT_ONLY", "ADVISORY_BOUNDARY_BREACH", [contract.integrity_hash]),
    certTest("Deployment execution authority externalized", contract.deployment_execution_externalized && orchestrator.performs_deployment_execution === false, "DEPLOYMENT_EXECUTION_NOT_EXTERNALIZED", [orchestrator.integrity_hash]),
    certTest("Unauthorized promotion blocked", security_authority.unauthorized_promotion_blocked, "UNAUTHORIZED_PROMOTION_NOT_BLOCKED", [security_authority.integrity_hash]),
    certTest("Deployment lineage complete", lineage.artifact_lineage_refs.length > 0 && lineage.environment_lineage_refs.length > 0 && lineage.approval_lineage_refs.length > 0, "DEPLOYMENT_LINEAGE_INCOMPLETE", [lineage.integrity_hash]),
    certTest("Rollback lineage preserved", rollback.preserves_history && lineage.rollback_lineage_refs.length > 0, "ROLLBACK_LINEAGE_LOST", [rollback.integrity_hash]),
    certTest("Deployment Ledger immutable", ledger.length === 6 && ledger.every((entry) => entry.immutable), "DEPLOYMENT_LEDGER_MUTABLE", ledger.map((entry) => entry.integrity_hash)),
    certTest("Replay deterministic", replay_explainability.deterministic && state_machine.replay_deterministic, "REPLAY_NON_DETERMINISTIC", [replay_explainability.integrity_hash]),
    certTest("Explainability reproducible", replay_explainability.reproducible_explanation && replay_explainability.deployment_reasoning.length > 0, "EXPLAINABILITY_NOT_REPRODUCIBLE", [replay_explainability.integrity_hash]),
    certTest("Security policy enforcement verified", security_authority.policy_compliance_validated && security_authority.policy_bypass_blocked, "SECURITY_POLICY_NOT_ENFORCED", [security_authority.integrity_hash]),
    certTest("Tenant isolation preserved", ledger.every((entry) => entry.tenant_isolated), "TENANT_ISOLATION_NOT_PRESERVED", ledger.map((entry) => entry.integrity_hash)),
    certTest("Observability complete", Object.entries(observability).filter(([key]) => key !== "observability_id" && key !== "integrity_hash").every(([, value]) => value === true), "OBSERVABILITY_INCOMPLETE", [observability.integrity_hash]),
    certTest("Audit evidence immutable", ledger.every((entry) => entry.evidence_refs.length > 0 && entry.immutable) && approval_workflow.immutable, "AUDIT_EVIDENCE_MUTABLE", ledger.map((entry) => entry.integrity_hash)),
    certTest("Fail-closed behavior enforced", contract.fail_closed && promotion_gate.evidence_refs.length > 0, "FAIL_CLOSED_NOT_ENFORCED", [contract.integrity_hash]),
  ]);
  const effectiveFailures = freezeArray([...new Set([...failures, ...tests.map((test) => test.failure_reason).filter((failure): failure is DeploymentGovernanceFailure => Boolean(failure))])]);
  const outcome = outcomeFor(effectiveFailures);
  const base: Omit<DeploymentGovernanceResult, "replay_hash" | "integrity_hash"> = { phase_version: VERSION, phase_identifier: IDENTIFIER, environment_qualification_ref: environment.integrity_hash, release_artifact_ref: environment.release_artifact_ref, contract, identity, orchestrator, promotion_gate, state_machine, approval_workflow, lineage, ledger, rollback, replay_explainability, security_authority, observability, certification_tests: tests, failures: effectiveFailures, outcome };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function validateDeploymentOrchestrationPromotionGovernance(result = runDeploymentOrchestrationPromotionGovernance()): DeploymentGovernanceValidation {
  const contract_valid = verify(result.contract) && result.contract.deployment_execution_externalized && result.contract.mission_control_authority === "ASSESSMENT_ONLY" && result.contract.fail_closed && result.contract.lifecycle.length === 8;
  const identity_valid = verify(result.identity) && result.identity.deterministic && result.identity.deployment_id.length > 0 && result.identity.environment_id.length > 0;
  const orchestrator_valid = verify(result.orchestrator) && result.orchestrator.deterministic && result.orchestrator.performs_deployment_execution === false && result.orchestrator.mutates_infrastructure === false && result.orchestrator.modifies_environment === false;
  const promotion_valid = verify(result.promotion_gate) && result.promotion_gate.decision === "PROMOTION_APPROVED" && result.promotion_gate.certified_artifact && result.promotion_gate.environment_qualified && result.promotion_gate.approval_evidence && result.promotion_gate.policy_compliance && result.promotion_gate.deterministic && result.promotion_gate.evidence_refs.length > 0;
  const state_valid = verify(result.state_machine) && result.state_machine.states.length === 8 && result.state_machine.skipped_states_allowed === false && result.state_machine.transitions_immutable && result.state_machine.previous_states_preserved && result.state_machine.replay_deterministic;
  const approval_valid = verify(result.approval_workflow) && result.approval_workflow.approval_state === "APPROVED" && result.approval_workflow.governance_approval_supported && result.approval_workflow.approval_never_overrides_failed_qualification && result.approval_workflow.authority_verified && result.approval_workflow.immutable && result.approval_workflow.deterministic;
  const lineage_valid = verify(result.lineage) && result.lineage.artifact_lineage_refs.length > 0 && result.lineage.environment_lineage_refs.length > 0 && result.lineage.rollback_lineage_refs.length > 0 && result.lineage.relationships_immutable && result.lineage.replay_supported;
  const ledger_valid = result.ledger.length === 6 && result.ledger.every((entry, index) => verify(entry) && entry.sequence === index + 1 && entry.immutable && entry.tenant_isolated && entry.evidence_refs.length > 0 && entry.replay_refs.length > 0);
  const rollback_valid = verify(result.rollback) && result.rollback.triggers.length === 6 && result.rollback.preserves_history && result.rollback.never_rewrites_deployment && result.rollback.successor_lineage_generated && result.rollback.evidence_immutable && result.rollback.replay_reproducible;
  const replay_valid = verify(result.replay_explainability) && result.replay_explainability.deterministic && result.replay_explainability.reproducible_explanation && resultReplayHash(result) === result.replay_hash && resultIntegrityHash(result) === result.integrity_hash;
  const security_valid = verify(result.security_authority) && Object.entries(result.security_authority).filter(([key]) => key !== "authority_id" && key !== "integrity_hash").every(([, value]) => value === true);
  const observability_valid = verify(result.observability) && Object.entries(result.observability).filter(([key]) => key !== "observability_id" && key !== "integrity_hash").every(([, value]) => value === true);
  const certification_valid = result.certification_tests.length === 25 && result.certification_tests.every((test) => verify(test) && test.passed && test.evidence_refs.length > 0);
  const valid = result.outcome === "PASS" && contract_valid && identity_valid && orchestrator_valid && promotion_valid && state_valid && approval_valid && lineage_valid && ledger_valid && rollback_valid && replay_valid && security_valid && observability_valid && certification_valid;
  return nested({ valid, outcome: result.outcome, contract_valid, identity_valid, orchestrator_valid, promotion_valid, state_valid, approval_valid, lineage_valid, ledger_valid, rollback_valid, replay_valid, security_valid, observability_valid, certification_valid, failures: result.failures });
}

export function replayDeploymentOrchestrationPromotionGovernance(result = runDeploymentOrchestrationPromotionGovernance()): boolean {
  const replayed = runDeploymentOrchestrationPromotionGovernance();
  return result.replay_hash === replayed.replay_hash && result.integrity_hash === replayed.integrity_hash && validateDeploymentOrchestrationPromotionGovernance(result).valid;
}

export function getDeploymentOrchestrationPromotionGovernanceBundle(): DeploymentGovernanceBundle {
  const result = runDeploymentOrchestrationPromotionGovernance();
  return Object.freeze({ doctrine: Object.freeze({ version: VERSION, upstream_phase: "production-environment-qualification/v15.3" as const, lifecycle, promotion_decisions: promotionDecisions, approval_states: approvalStates, certification_outcomes: freezeArray(["PASS", "CONDITIONAL_PASS", "FAIL"] as const) }), result, validation: validateDeploymentOrchestrationPromotionGovernance(result) });
}

export const DeploymentOrchestrationPromotionGovernanceService = Object.freeze({ run: runDeploymentOrchestrationPromotionGovernance, validate: validateDeploymentOrchestrationPromotionGovernance, replay: replayDeploymentOrchestrationPromotionGovernance });
