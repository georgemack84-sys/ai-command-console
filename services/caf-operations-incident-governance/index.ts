import { runAgentIdentityLifecycle, validateAgentIdentityLifecycle } from "@/services/caf-agent-identity-lifecycle";
import { runBehavioralReplayDivergence, validateBehavioralReplayDivergence } from "@/services/caf-behavioral-replay-divergence";
import { runGovernanceAuthorityPolicy, validateGovernanceAuthorityPolicy } from "@/services/caf-governance-authority-policy";
import { runLearningAdaptation, validateLearningAdaptation } from "@/services/caf-learning-adaptation";
import { runObservabilityTelemetry, validateObservabilityTelemetry } from "@/services/caf-observability-telemetry";
import { runRuntimeOrchestration, validateRuntimeOrchestration } from "@/services/caf-runtime-orchestration";
import { runSafetyBehavioralConstraints, validateSafetyBehavioralConstraints } from "@/services/caf-safety-behavioral-constraints";
import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import type {
  IncidentLifecycleState,
  OperationsCertificationOutcome,
  OperationsIncidentGovernanceBundle,
  OperationsIncidentGovernanceFailure,
  OperationsIncidentGovernanceInput,
  OperationsIncidentGovernanceResult,
  OperationsIncidentGovernanceScenario,
  OperationsIncidentGovernanceValidation,
  RecoveryLifecycleState,
} from "@/types/caf-operations-incident-governance";

const VERSION = "caf-operations-incident-governance/v3.13" as const;
const IDENTIFIER = "CafOperationsIncidentGovernance" as const;
const INCIDENT_LIFECYCLE: readonly IncidentLifecycleState[] = Object.freeze(["DETECTED", "CLASSIFIED", "ACKNOWLEDGED", "UNDER_INVESTIGATION", "CONTAINED", "RECOVERY_IN_PROGRESS", "VALIDATING", "RESOLVED", "CLOSED"]);
const RECOVERY_LIFECYCLE: readonly RecoveryLifecycleState[] = Object.freeze(["REQUESTED", "VALIDATED", "APPROVED", "EXECUTING", "VERIFYING", "COMPLETED"]);

function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function hash(value: unknown): string { return generateDecisionIntegrityHash(value); }
function hashWithoutIntegrity<T extends object>(value: T): string {
  const copy = { ...value } as Record<string, unknown>;
  delete copy.integrity_hash;
  return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown);
}
function nested<T extends object>(value: T): T & { integrity_hash: string } {
  return Object.freeze({ ...value, integrity_hash: hashWithoutIntegrity(value) }) as T & { integrity_hash: string };
}
function scenarioFailure(scenario: OperationsIncidentGovernanceScenario): OperationsIncidentGovernanceFailure | undefined { return scenario === "BASELINE" ? undefined : scenario; }
function has(failures: readonly OperationsIncidentGovernanceFailure[], failure: OperationsIncidentGovernanceFailure): boolean { return failures.includes(failure); }
function outcome(failures: readonly OperationsIncidentGovernanceFailure[]): OperationsCertificationOutcome {
  if (has(failures, "CERTIFICATION_PRUNED")) return "PRUNED";
  return failures.length ? "FAIL" : "PASS";
}
function verifyHashedRecord(value: { integrity_hash: string }): boolean { return hashWithoutIntegrity(value) === value.integrity_hash; }

function resultReplayHash(result: Omit<OperationsIncidentGovernanceResult, "replay_hash" | "integrity_hash">): string {
  return hash({
    console: result.operations_console.integrity_hash,
    incident: result.incident.integrity_hash,
    recovery: result.recovery.integrity_hash,
    governance: result.operational_governance.integrity_hash,
    evidence: result.operational_evidence.integrity_hash,
    ledger: result.incident_ledger.integrity_hash,
    replay: result.replay_validation.integrity_hash,
    certification: result.certification.integrity_hash,
  });
}
function resultIntegrityHash(result: Omit<OperationsIncidentGovernanceResult, "integrity_hash">): string {
  return hash({ version: result.phase_version, identifier: result.phase_identifier, outcome: result.certification.outcome, replay_hash: result.replay_hash });
}

export function runOperationsIncidentGovernance(input: OperationsIncidentGovernanceInput = {}): OperationsIncidentGovernanceResult {
  const direct = scenarioFailure(input.scenario ?? "BASELINE");
  const scenarioFailures = freezeArray<OperationsIncidentGovernanceFailure>(direct ? [direct] : []);
  const p31 = runAgentIdentityLifecycle();
  const p33 = runRuntimeOrchestration();
  const p37 = runGovernanceAuthorityPolicy();
  const p38 = runSafetyBehavioralConstraints();
  const p310 = runObservabilityTelemetry();
  const p311 = runBehavioralReplayDivergence();
  const p312 = runLearningAdaptation();
  const dependencyFailures = freezeArray<OperationsIncidentGovernanceFailure>([
    ...(!validateAgentIdentityLifecycle(p31).valid || has(scenarioFailures, "P3_1_AGENT_IDENTITY_INVALID") ? ["P3_1_AGENT_IDENTITY_INVALID" as const] : []),
    ...(!validateRuntimeOrchestration(p33).valid || has(scenarioFailures, "P3_3_RUNTIME_INVALID") ? ["P3_3_RUNTIME_INVALID" as const] : []),
    ...(!validateGovernanceAuthorityPolicy(p37).valid || has(scenarioFailures, "P3_7_GOVERNANCE_INVALID") ? ["P3_7_GOVERNANCE_INVALID" as const] : []),
    ...(!validateSafetyBehavioralConstraints(p38).valid || has(scenarioFailures, "P3_8_SAFETY_INVALID") ? ["P3_8_SAFETY_INVALID" as const] : []),
    ...(!validateObservabilityTelemetry(p310).valid || has(scenarioFailures, "P3_10_OBSERVABILITY_INVALID") ? ["P3_10_OBSERVABILITY_INVALID" as const] : []),
    ...(!validateBehavioralReplayDivergence(p311).valid || has(scenarioFailures, "P3_11_REPLAY_INVALID") ? ["P3_11_REPLAY_INVALID" as const] : []),
    ...(!validateLearningAdaptation(p312).valid || has(scenarioFailures, "P3_12_LEARNING_INVALID") ? ["P3_12_LEARNING_INVALID" as const] : []),
  ]);
  const failures = freezeArray([...new Set([...scenarioFailures, ...dependencyFailures])]);
  const consumesCciOps = !has(failures, "CCI_OPERATIONS_NOT_CONSUMED");
  const duplicatesCciOps = has(failures, "CCI_OPERATIONS_DUPLICATED");
  const operations_console = nested({
    console_id: "P3.13-OPERATIONS-CONSOLE-001",
    overview_ref: "ops-console:overview",
    runtime_status_ref: p33.orchestrator.orchestrator_id,
    health_summary_ref: p310.health_records[0]?.health_id ?? "health:p3.10:missing",
    workload_visibility_ref: "ops-console:workload",
    incident_dashboard_ref: "ops-console:incidents",
    recovery_monitoring_ref: "ops-console:recovery",
    operator_controls_ref: "ops-console:operator-controls",
    operational: !has(failures, "OPERATIONS_CONSOLE_INCOMPLETE"),
  });
  const incidentLifecycle = has(failures, "INCIDENT_LIFECYCLE_INCOMPLETE") ? freezeArray(INCIDENT_LIFECYCLE.slice(0, 6)) : INCIDENT_LIFECYCLE;
  const severity = has(failures, "INCIDENT_SEVERITY_INVALID") ? "INFORMATIONAL" as const : "MODERATE" as const;
  const incident = nested({
    incident_id: has(failures, "INCIDENT_NOT_RECORDED") ? "" : "P3.13-INCIDENT-001",
    affected_agents: freezeArray(["agent:p3.13:operational"]),
    severity,
    lifecycle: incidentLifecycle,
    classification: "runtime-health-degradation",
    impact_analysis: "moderate operational impact; recovery required before closure",
    containment_ref: p38.containment_decision.containment_id,
    escalation_ref: "escalation:p3.13:operator",
    operator_notification_ref: has(failures, "OPERATOR_OVERSIGHT_MISSING") ? "" : "operator-notification:p3.13",
    closure_timestamp: incidentLifecycle.includes("CLOSED") ? "2026-07-17T00:45:00.000Z" : "",
    immutable_when_closed: incidentLifecycle.includes("CLOSED") && !has(failures, "OPERATIONAL_EVIDENCE_MUTABLE"),
  });
  const recoveryLifecycle = has(failures, "RECOVERY_LIFECYCLE_INVALID") ? freezeArray(["REQUESTED", "VALIDATED", "FAILED", "ESCALATED"] as const) : RECOVERY_LIFECYCLE;
  const recovery = nested({
    recovery_id: "P3.13-RECOVERY-001",
    incident_ref: incident.incident_id,
    strategy: "REPLAY_RESTORE" as const,
    lifecycle: recoveryLifecycle,
    deterministic: !has(failures, "RECOVERY_NON_DETERMINISTIC"),
    governance_approval_refs: has(failures, "RECOVERY_NOT_GOVERNED") || has(failures, "GOVERNANCE_BYPASSED") ? freezeArray([]) : freezeArray([p37.gate_result.gate_id, "approval:p3.13:operator"]),
    safety_validation_ref: has(failures, "SAFETY_VALIDATION_BYPASSED") ? "" : p38.safety_gate.safety_gate_id,
    replay_validation_ref: has(failures, "REPLAY_VALIDATION_MISSING") ? "" : p311.replay_record.replay_id,
    dependency_validation_refs: freezeArray([p33.scheduling.schedule_id, p310.evidence.evidence_id]),
    restoration_verified: recoveryLifecycle.includes("COMPLETED"),
    authority_expanded: has(failures, "AUTHORITY_EXPANSION_DURING_RECOVERY"),
  });
  const operational_governance = nested({
    governance_id: "P3.13-OPERATIONAL-GOVERNANCE-001",
    operational_policy_refs: freezeArray(["policy:operations:p3.13"]),
    approval_refs: recovery.governance_approval_refs,
    authority_ref: p37.authority_decision.authority_decision_id,
    restriction_refs: freezeArray(["restriction:no-recovery-without-governance", "restriction:no-safety-bypass"]),
    exception_refs: freezeArray([]),
    governance_precedes_recovery: !has(failures, "GOVERNANCE_BYPASSED") && recovery.governance_approval_refs.length > 0,
    safety_precedes_recovery: !has(failures, "SAFETY_VALIDATION_BYPASSED") && recovery.safety_validation_ref.length > 0,
    operator_authority_supreme: !has(failures, "OPERATOR_OVERSIGHT_MISSING"),
    constitutional_compliance_preserved: !has(failures, "CONSTITUTIONAL_COMPLIANCE_LOST") && !recovery.authority_expanded,
  });
  const evidenceRefs = has(failures, "OPERATIONAL_EVIDENCE_MISSING") ? freezeArray([]) : freezeArray(["evidence:p3.13:incident", "evidence:p3.13:recovery", "evidence:p3.13:governance"]);
  const operational_evidence = nested({
    evidence_id: "P3.13-OPERATIONAL-EVIDENCE-001",
    incident_ref: incident.incident_id,
    operational_state: "restored",
    severity,
    recovery_strategy: recovery.strategy,
    governance_approvals: recovery.governance_approval_refs,
    operator_actions: has(failures, "OPERATOR_OVERSIGHT_MISSING") ? freezeArray([]) : freezeArray(["operator:p3.13:acknowledged", "operator:p3.13:approved-recovery"]),
    replay_refs: recovery.replay_validation_ref ? freezeArray([recovery.replay_validation_ref]) : freezeArray([]),
    telemetry_refs: freezeArray([p310.telemetry_records[0]?.telemetry_id ?? "telemetry:p3.10:missing"]),
    timestamps: freezeArray(["2026-07-17T00:40:00.000Z", "2026-07-17T00:45:00.000Z"]),
    immutable: evidenceRefs.length > 0 && !has(failures, "OPERATIONAL_EVIDENCE_MUTABLE"),
    auditable: evidenceRefs.length > 0,
  });
  const incident_ledger = nested({
    ledger_id: "P3.13-INCIDENT-LEDGER-001",
    incident_refs: incident.incident_id ? freezeArray([incident.incident_id]) : freezeArray([]),
    recovery_refs: freezeArray([recovery.recovery_id]),
    evidence_refs: operational_evidence.evidence_id ? freezeArray([operational_evidence.evidence_id]) : freezeArray([]),
    complete: !has(failures, "INCIDENT_LEDGER_INCOMPLETE") && incident.incident_id.length > 0 && operational_evidence.immutable,
    permanently_auditable: operational_evidence.auditable && incident.immutable_when_closed,
  });
  const replay_validation = nested({
    replay_validation_id: "P3.13-OPERATIONAL-REPLAY-VALIDATION-001",
    incident_replayed: incident.lifecycle.includes("CLOSED"),
    recovery_replayed: recovery.deterministic && recovery.restoration_verified,
    evidence_replayed: operational_evidence.immutable,
    restoration_replayed: recovery.restoration_verified,
    deterministic: recovery.deterministic && recovery.replay_validation_ref.length > 0,
  });
  const derivedFailures = freezeArray([...new Set([
    ...failures,
    ...(!consumesCciOps ? ["CCI_OPERATIONS_NOT_CONSUMED" as const] : []),
    ...(duplicatesCciOps ? ["CCI_OPERATIONS_DUPLICATED" as const] : []),
    ...(incident.incident_id.length === 0 ? ["INCIDENT_NOT_RECORDED" as const] : []),
    ...(incident.lifecycle.length < INCIDENT_LIFECYCLE.length ? ["INCIDENT_LIFECYCLE_INCOMPLETE" as const] : []),
    ...(severity === "INFORMATIONAL" && has(failures, "INCIDENT_SEVERITY_INVALID") ? ["INCIDENT_SEVERITY_INVALID" as const] : []),
    ...(recovery.governance_approval_refs.length === 0 ? ["RECOVERY_NOT_GOVERNED" as const] : []),
    ...(!recovery.deterministic ? ["RECOVERY_NON_DETERMINISTIC" as const] : []),
    ...(!recovery.lifecycle.includes("COMPLETED") ? ["RECOVERY_LIFECYCLE_INVALID" as const] : []),
    ...(!operational_governance.governance_precedes_recovery ? ["GOVERNANCE_BYPASSED" as const] : []),
    ...(!operational_governance.safety_precedes_recovery ? ["SAFETY_VALIDATION_BYPASSED" as const] : []),
    ...(!operational_governance.operator_authority_supreme ? ["OPERATOR_OVERSIGHT_MISSING" as const] : []),
    ...(recovery.replay_validation_ref.length === 0 ? ["REPLAY_VALIDATION_MISSING" as const] : []),
    ...(!operational_evidence.auditable ? ["OPERATIONAL_EVIDENCE_MISSING" as const] : []),
    ...(!operational_evidence.immutable ? ["OPERATIONAL_EVIDENCE_MUTABLE" as const] : []),
    ...(recovery.authority_expanded ? ["AUTHORITY_EXPANSION_DURING_RECOVERY" as const] : []),
    ...(!operational_governance.constitutional_compliance_preserved ? ["CONSTITUTIONAL_COMPLIANCE_LOST" as const] : []),
    ...(!operations_console.operational ? ["OPERATIONS_CONSOLE_INCOMPLETE" as const] : []),
    ...(!incident_ledger.complete ? ["INCIDENT_LEDGER_INCOMPLETE" as const] : []),
    ...(has(failures, "RECOVERY_FRAMEWORK_UNCERTIFIED") ? ["RECOVERY_FRAMEWORK_UNCERTIFIED" as const] : []),
  ])]);
  const certification = nested({
    certification_id: "P3.13-OPERATIONS-INCIDENT-CERTIFICATION-GATE-001",
    outcome: outcome(derivedFailures),
    certified: outcome(derivedFailures) === "PASS",
    consumes_cci_operations: consumesCciOps,
    does_not_duplicate_cci_operations: !duplicatesCciOps,
    operations_console_operational: operations_console.operational,
    incident_recorded: incident.incident_id.length > 0,
    incident_lifecycle_complete: incident.lifecycle.length === INCIDENT_LIFECYCLE.length,
    incident_ledger_complete: incident_ledger.complete,
    recovery_governed: recovery.governance_approval_refs.length > 0,
    recovery_deterministic: recovery.deterministic,
    recovery_lifecycle_valid: recovery.lifecycle.includes("COMPLETED"),
    governance_enforced: operational_governance.governance_precedes_recovery,
    safety_validated: operational_governance.safety_precedes_recovery,
    operator_oversight_available: operational_governance.operator_authority_supreme,
    replay_validation_succeeded: replay_validation.deterministic,
    evidence_immutable: operational_evidence.immutable,
    no_authority_expansion: !recovery.authority_expanded,
    constitutional_compliance_preserved: operational_governance.constitutional_compliance_preserved,
    recovery_framework_certified: !has(derivedFailures, "RECOVERY_FRAMEWORK_UNCERTIFIED"),
    failures: derivedFailures,
  });
  const base: Omit<OperationsIncidentGovernanceResult, "replay_hash" | "integrity_hash"> = {
    phase_version: VERSION,
    phase_identifier: IDENTIFIER,
    agent_identity_lifecycle_ref: "caf-agent-identity-lifecycle/v3.1",
    runtime_orchestration_ref: "caf-runtime-orchestration/v3.3",
    governance_authority_policy_ref: "caf-governance-authority-policy/v3.7",
    safety_behavioral_constraints_ref: "caf-safety-behavioral-constraints/v3.8",
    observability_telemetry_ref: "caf-observability-telemetry/v3.10",
    behavioral_replay_divergence_ref: "caf-behavioral-replay-divergence/v3.11",
    learning_adaptation_ref: "caf-learning-adaptation/v3.12",
    cci_operations_ref: "Program 2 - CCI Operations Infrastructure",
    cci_evidence_ref: "Program 2 - CCI Evidence Infrastructure",
    cci_replay_ref: "Program 2 - CCI Replay Infrastructure",
    operations_console,
    incident,
    recovery,
    operational_governance,
    operational_evidence,
    incident_ledger,
    replay_validation,
    certification,
  };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function validateOperationsIncidentGovernance(result?: OperationsIncidentGovernanceResult): OperationsIncidentGovernanceValidation {
  if (!result) return nested({ valid: false, outcome: "FAIL" as const, replay_hash_valid: false, integrity_hash_valid: false, console_valid: false, incident_valid: false, recovery_valid: false, governance_valid: false, evidence_valid: false, ledger_valid: false, replay_valid: false, certification_valid: false, failures: freezeArray(["CERTIFICATION_PRUNED" as const]) });
  const replay_hash_valid = resultReplayHash(result) === result.replay_hash;
  const integrity_hash_valid = resultIntegrityHash(result) === result.integrity_hash && verifyHashedRecord(result.certification);
  const console_valid = verifyHashedRecord(result.operations_console) && result.operations_console.operational;
  const incident_valid = verifyHashedRecord(result.incident) && result.incident.incident_id.length > 0 && result.incident.lifecycle.includes("CLOSED") && result.incident.immutable_when_closed;
  const recovery_valid = verifyHashedRecord(result.recovery) && result.recovery.deterministic && result.recovery.lifecycle.includes("COMPLETED") && result.recovery.governance_approval_refs.length > 0 && result.recovery.safety_validation_ref.length > 0 && !result.recovery.authority_expanded;
  const governance_valid = verifyHashedRecord(result.operational_governance) && result.operational_governance.governance_precedes_recovery && result.operational_governance.safety_precedes_recovery && result.operational_governance.operator_authority_supreme && result.operational_governance.constitutional_compliance_preserved;
  const evidence_valid = verifyHashedRecord(result.operational_evidence) && result.operational_evidence.immutable && result.operational_evidence.auditable && result.operational_evidence.replay_refs.length > 0;
  const ledger_valid = verifyHashedRecord(result.incident_ledger) && result.incident_ledger.complete && result.incident_ledger.permanently_auditable;
  const replay_valid = verifyHashedRecord(result.replay_validation) && result.replay_validation.deterministic && result.replay_validation.restoration_replayed;
  const certification_valid = verifyHashedRecord(result.certification) && result.certification.outcome === "PASS" && result.certification.certified;
  const valid = replay_hash_valid && integrity_hash_valid && console_valid && incident_valid && recovery_valid && governance_valid && evidence_valid && ledger_valid && replay_valid && certification_valid;
  return nested({ valid, outcome: result.certification.outcome, replay_hash_valid, integrity_hash_valid, console_valid, incident_valid, recovery_valid, governance_valid, evidence_valid, ledger_valid, replay_valid, certification_valid, failures: result.certification.failures });
}

export function replayOperationsIncidentGovernance(result = runOperationsIncidentGovernance()): boolean {
  const replayed = runOperationsIncidentGovernance();
  return result.replay_hash === replayed.replay_hash && result.integrity_hash === replayed.integrity_hash && validateOperationsIncidentGovernance(result).valid;
}

export function getOperationsIncidentGovernanceBundle(): OperationsIncidentGovernanceBundle {
  const result = runOperationsIncidentGovernance();
  return Object.freeze({
    doctrine: Object.freeze({
      version: VERSION,
      owns_operations: true,
      owns_incidents: true,
      owns_recovery: true,
      owns_operational_governance: true,
      owns_operational_evidence: true,
      owns_platform_infrastructure_operations: false,
      owns_platform_failover: false,
      consumes_cci_operations: true,
      fail_closed_required: true,
    }),
    result,
    validation: validateOperationsIncidentGovernance(result),
  });
}

export const OperationsIncidentGovernanceService = Object.freeze({
  run: runOperationsIncidentGovernance,
  validate: validateOperationsIncidentGovernance,
  replay: replayOperationsIncidentGovernance,
});
