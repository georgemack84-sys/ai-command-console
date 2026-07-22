import { runCollaborationFederation, validateCollaborationFederation } from "@/services/caf-collaboration-federation";
import { runGovernanceAuthorityPolicy, validateGovernanceAuthorityPolicy } from "@/services/caf-governance-authority-policy";
import { runMemoryKnowledge, validateMemoryKnowledge } from "@/services/caf-memory-knowledge";
import { runPlanningReasoning, validatePlanningReasoning } from "@/services/caf-planning-reasoning";
import { runRuntimeOrchestration, validateRuntimeOrchestration } from "@/services/caf-runtime-orchestration";
import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import type {
  BehavioralConstraint,
  SafetyBehavioralConstraintBundle,
  SafetyBehavioralConstraintFailure,
  SafetyBehavioralConstraintInput,
  SafetyBehavioralConstraintResult,
  SafetyBehavioralConstraintScenario,
  SafetyBehavioralConstraintValidation,
  SafetyCertificationOutcome,
  SafetyWarning,
} from "@/types/caf-safety-behavioral-constraints";

const VERSION = "caf-safety-behavioral-constraints/v3.8" as const;
const IDENTIFIER = "CafSafetyBehavioralConstraints" as const;

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
function scenarioFailure(scenario: SafetyBehavioralConstraintScenario): SafetyBehavioralConstraintFailure | undefined { return scenario === "BASELINE" ? undefined : scenario; }
function has(failures: readonly SafetyBehavioralConstraintFailure[], failure: SafetyBehavioralConstraintFailure): boolean { return failures.includes(failure); }
function outcome(failures: readonly SafetyBehavioralConstraintFailure[]): SafetyCertificationOutcome {
  if (has(failures, "CERTIFICATION_PRUNED")) return "PRUNED";
  return failures.length ? "FAIL" : "PASS";
}
function verifyHashedRecord(value: { integrity_hash: string }): boolean { return hashWithoutIntegrity(value) === value.integrity_hash; }

function buildConstraints(failures: readonly SafetyBehavioralConstraintFailure[]): readonly BehavioralConstraint[] {
  const missing = has(failures, "BEHAVIORAL_CONSTRAINT_MISSING");
  const constraints: readonly BehavioralConstraint[] = [
    nested({
      constraint_id: "P3.8-CONSTRAINT-OPERATIONAL",
      boundary: "OPERATIONAL" as const,
      prohibited_behaviors: freezeArray(["unapproved autonomous execution", "runtime bypass"]),
      escalation_threshold: "medium-risk-or-higher",
      deterministic: true,
      enforceable: true,
      evidence_ref: "evidence:p3.8:operational-constraint",
    }),
    nested({
      constraint_id: "P3.8-CONSTRAINT-SAFETY",
      boundary: "SAFETY" as const,
      prohibited_behaviors: freezeArray(["unsafe behavior continuation", "fail-open execution"]),
      escalation_threshold: "any-safety-violation",
      deterministic: true,
      enforceable: true,
      evidence_ref: "evidence:p3.8:safety-constraint",
    }),
    nested({
      constraint_id: "P3.8-CONSTRAINT-GOVERNANCE",
      boundary: "GOVERNANCE" as const,
      prohibited_behaviors: freezeArray(["authority bypass", "policy bypass", "ungoverned exception"]),
      escalation_threshold: "authority-or-policy-warning",
      deterministic: true,
      enforceable: true,
      evidence_ref: "evidence:p3.8:governance-constraint",
    }),
  ];
  return missing ? freezeArray(constraints.slice(0, 2)) : freezeArray(constraints);
}

function buildWarnings(failures: readonly SafetyBehavioralConstraintFailure[]): readonly SafetyWarning[] {
  const routed = !has(failures, "WARNING_ROUTING_NON_DETERMINISTIC");
  return freezeArray([
    nested({
      warning_id: "P3.8-WARNING-001",
      warning_class: "SAFETY_POLICY_WARNING" as const,
      severity: "HIGH" as const,
      route: routed ? "operators" : "",
      routed,
      replayable: true,
      evidence_ref: "evidence:p3.8:safety-policy-warning",
    }),
    nested({
      warning_id: "P3.8-WARNING-002",
      warning_class: "AUTOMATION_WARNING" as const,
      severity: "MEDIUM" as const,
      route: routed ? "governance-dashboard" : "",
      routed,
      replayable: true,
      evidence_ref: "evidence:p3.8:automation-warning",
    }),
    nested({
      warning_id: "P3.8-WARNING-003",
      warning_class: "CONTAINMENT_WARNING" as const,
      severity: "MEDIUM" as const,
      route: routed ? "runtime-observability" : "",
      routed,
      replayable: true,
      evidence_ref: "evidence:p3.8:containment-warning",
    }),
  ]);
}

function resultReplayHash(result: Omit<SafetyBehavioralConstraintResult, "replay_hash" | "integrity_hash">): string {
  return hash({
    constraints: result.constraints.map((constraint) => constraint.integrity_hash),
    safety: result.safety_evaluation.integrity_hash,
    warnings: result.warnings.map((warning) => warning.integrity_hash),
    automation: result.automation_eligibility.integrity_hash,
    intervention: result.intervention_decision.integrity_hash,
    containment: result.containment_decision.integrity_hash,
    exceptions: result.exception_governance.integrity_hash,
    gate: result.safety_gate.integrity_hash,
    evidence: result.evidence_ledger.integrity_hash,
    observability: result.observability.integrity_hash,
    replay: result.replay_validation.integrity_hash,
    certification: result.certification.integrity_hash,
  });
}
function resultIntegrityHash(result: Omit<SafetyBehavioralConstraintResult, "integrity_hash">): string {
  return hash({ version: result.phase_version, identifier: result.phase_identifier, outcome: result.certification.outcome, replay_hash: result.replay_hash });
}

export function runSafetyBehavioralConstraints(input: SafetyBehavioralConstraintInput = {}): SafetyBehavioralConstraintResult {
  const direct = scenarioFailure(input.scenario ?? "BASELINE");
  const scenarioFailures = freezeArray<SafetyBehavioralConstraintFailure>(direct ? [direct] : []);
  const runtime = runRuntimeOrchestration();
  const memory = runMemoryKnowledge();
  const planning = runPlanningReasoning();
  const collaboration = runCollaborationFederation();
  const governance = runGovernanceAuthorityPolicy();
  const dependencyFailures = freezeArray<SafetyBehavioralConstraintFailure>([
    ...(!validateRuntimeOrchestration(runtime).valid || has(scenarioFailures, "P3_3_RUNTIME_INVALID") ? ["P3_3_RUNTIME_INVALID" as const] : []),
    ...(!validateMemoryKnowledge(memory).valid || has(scenarioFailures, "P3_4_MEMORY_GOVERNANCE_INVALID") ? ["P3_4_MEMORY_GOVERNANCE_INVALID" as const] : []),
    ...(!validatePlanningReasoning(planning).valid || has(scenarioFailures, "P3_5_PLANNING_INVALID") ? ["P3_5_PLANNING_INVALID" as const] : []),
    ...(!validateCollaborationFederation(collaboration).valid || has(scenarioFailures, "P3_6_COLLABORATION_INVALID") ? ["P3_6_COLLABORATION_INVALID" as const] : []),
    ...(!validateGovernanceAuthorityPolicy(governance).valid || has(scenarioFailures, "P3_7_GOVERNANCE_INVALID") ? ["P3_7_GOVERNANCE_INVALID" as const] : []),
  ]);
  const failures = freezeArray([...new Set([...scenarioFailures, ...dependencyFailures])]);
  const evidenceRefs = has(failures, "SAFETY_EVIDENCE_MISSING") ? freezeArray([]) : freezeArray([
    "evidence:p3.8:evaluation",
    "evidence:p3.8:enforcement",
    "evidence:p3.8:intervention",
    "evidence:p3.8:containment",
    "evidence:p3.8:automation",
    "evidence:p3.8:exception",
  ]);
  const constraints = buildConstraints(failures);
  const safety_evaluation = nested({
    evaluation_id: "P3.8-SAFETY-EVALUATION-001",
    behavior_request_ref: "behavior:p3.8:request-001",
    constraint_refs: freezeArray(constraints.map((constraint) => constraint.constraint_id)),
    safety_rule_refs: freezeArray(["rule:safety:do-not-bypass-authority", "rule:safety:fail-closed", "rule:safety:contain-unsafe-behavior"]),
    risk_assessment_ref: "risk:p3.8:bounded-autonomy",
    deterministic: !has(failures, "SAFETY_GATE_NON_DETERMINISTIC"),
    constraints_complete: constraints.length >= 3 && !has(failures, "SAFETY_ARCHITECTURE_INCOMPLETE"),
    evidence_refs: evidenceRefs,
  });
  const warnings = has(failures, "SAFETY_WARNING_REGISTRY_INCOMPLETE") ? freezeArray(buildWarnings(failures).slice(0, 2)) : buildWarnings(failures);
  const automation_eligibility = nested({
    eligibility_id: "P3.8-AUTOMATION-ELIGIBILITY-001",
    decision: has(failures, "UNSAFE_AUTOMATION_ELIGIBLE")
      ? "ELIGIBLE" as const
      : has(failures, "FAIL_CLOSED_NOT_ENFORCED")
        ? "ELIGIBLE_WITH_CONSTRAINTS" as const
        : "ELIGIBLE_WITH_APPROVAL" as const,
    confidence_threshold_ref: "confidence:p3.8:operator-approved-autonomy",
    governance_requirement_refs: freezeArray(["caf-governance-authority-policy/v3.7"]),
    operator_requirement_refs: freezeArray(["operator-approval:required-for-elevated-autonomy"]),
    policy_requirement_refs: freezeArray(["Program 2 - CCI Policy Engine"]),
    runtime_requirement_refs: freezeArray(["caf-runtime-orchestration/v3.3"]),
    deterministic: !has(failures, "AUTOMATION_ELIGIBILITY_NON_DETERMINISTIC"),
    evidence_refs: evidenceRefs,
  });
  const intervention_decision = nested({
    intervention_id: "P3.8-INTERVENTION-001",
    type: has(failures, "FAIL_CLOSED_NOT_ENFORCED") ? "ADVISORY" as const : "REQUIRE_APPROVAL" as const,
    recommendation: "Require operator approval before autonomous execution.",
    escalation_refs: freezeArray(["escalation:p3.8:safety"]),
    operator_notification_refs: freezeArray(["operator-notification:p3.8:safety"]),
    approval_request_refs: freezeArray(["approval-request:p3.8:automation"]),
    reproducible: !has(failures, "INTERVENTION_NON_REPRODUCIBLE"),
    evidence_refs: evidenceRefs,
  });
  const containment_decision = nested({
    containment_id: "P3.8-CONTAINMENT-001",
    level: has(failures, "FAIL_CLOSED_NOT_ENFORCED") ? "NONE" as const : "LOCAL" as const,
    isolated_scopes: has(failures, "FAIL_CLOSED_NOT_ENFORCED") ? freezeArray([]) : freezeArray(["external-actions", "memory-write", "federated-delegation"]),
    recovery_ref: "recovery:p3.8:operator-review",
    deterministic: !has(failures, "CONTAINMENT_NON_DETERMINISTIC"),
    evidence_refs: evidenceRefs,
  });
  const exception_governance = nested({
    exception_registry_id: "P3.8-EXCEPTION-REGISTRY-001",
    exception_request_refs: freezeArray(["exception-request:p3.8:controlled-deviation"]),
    approval_refs: freezeArray(["approval:p3.8:operator", "approval:p3.7:authority"]),
    expiration_ref: has(failures, "EXCEPTION_EXPIRATION_MISSING") ? "" : "expires:2026-07-17T01:00:00.000Z",
    bypasses_constitutional_authority: has(failures, "EXCEPTION_BYPASSES_AUTHORITY"),
    auditable: true,
    replayable: true,
    evidence_refs: has(failures, "EXCEPTION_EVIDENCE_MISSING") ? freezeArray([]) : evidenceRefs,
  });
  const failClosed = !has(failures, "FAIL_CLOSED_NOT_ENFORCED");
  const safety_gate = nested({
    safety_gate_id: "P3.8-SAFETY-GATE-001",
    behavior_request_ref: safety_evaluation.behavior_request_ref,
    safety_evaluation_ref: safety_evaluation.evaluation_id,
    automation_eligibility: automation_eligibility.decision,
    intervention_type: intervention_decision.type,
    containment_level: containment_decision.level,
    outcome: failClosed ? "SAFE_WITH_WARNINGS" as const : "SAFE" as const,
    fail_closed_enforced: failClosed,
    deterministic: safety_evaluation.deterministic,
    evidence_refs: evidenceRefs,
  });
  const evidence_ledger = nested({
    ledger_id: "P3.8-SAFETY-EVIDENCE-LEDGER-001",
    evidence_refs: evidenceRefs,
    immutable: evidenceRefs.length > 0,
    lineage_complete: evidenceRefs.length > 0,
    replayable: evidenceRefs.length > 0,
  });
  const observability = nested({
    dashboard_id: "P3.8-SAFETY-DASHBOARD-001",
    metrics: freezeArray(["safety_evaluations", "blocked_executions", "containment_frequency", "intervention_frequency", "warning_distribution", "automation_approvals", "exception_usage", "enforcement_latency"]),
    complete: !has(failures, "OBSERVABILITY_INCOMPLETE"),
    deterministic: true,
  });
  const replay_validation = nested({
    replay_validation_id: "P3.8-REPLAY-VALIDATION-001",
    safety_replayed: safety_evaluation.deterministic,
    enforcement_replayed: !has(failures, "ENFORCEMENT_NON_DETERMINISTIC"),
    intervention_replayed: intervention_decision.reproducible,
    containment_replayed: containment_decision.deterministic,
    automation_replayed: automation_eligibility.deterministic,
    exception_replayed: exception_governance.replayable,
    evidence_replayed: evidence_ledger.replayable,
    deterministic: !has(failures, "REPLAY_DIVERGENCE"),
  });
  const derivedFailures = freezeArray([...new Set([
    ...failures,
    ...(!safety_evaluation.constraints_complete ? ["BEHAVIORAL_CONSTRAINT_MISSING" as const] : []),
    ...(!safety_evaluation.deterministic ? ["SAFETY_GATE_NON_DETERMINISTIC" as const] : []),
    ...(!replay_validation.enforcement_replayed ? ["ENFORCEMENT_NON_DETERMINISTIC" as const] : []),
    ...(!intervention_decision.reproducible ? ["INTERVENTION_NON_REPRODUCIBLE" as const] : []),
    ...(!containment_decision.deterministic ? ["CONTAINMENT_NON_DETERMINISTIC" as const] : []),
    ...(warnings.length < 3 ? ["SAFETY_WARNING_REGISTRY_INCOMPLETE" as const] : []),
    ...(warnings.some((warning) => !warning.routed || !warning.replayable) ? ["WARNING_ROUTING_NON_DETERMINISTIC" as const] : []),
    ...(!automation_eligibility.deterministic ? ["AUTOMATION_ELIGIBILITY_NON_DETERMINISTIC" as const] : []),
    ...(has(failures, "UNSAFE_AUTOMATION_ELIGIBLE") ? ["UNSAFE_AUTOMATION_ELIGIBLE" as const] : []),
    ...(exception_governance.bypasses_constitutional_authority ? ["EXCEPTION_BYPASSES_AUTHORITY" as const] : []),
    ...(exception_governance.evidence_refs.length === 0 ? ["EXCEPTION_EVIDENCE_MISSING" as const] : []),
    ...(exception_governance.expiration_ref.length === 0 ? ["EXCEPTION_EXPIRATION_MISSING" as const] : []),
    ...(!evidence_ledger.immutable || !evidence_ledger.lineage_complete ? ["SAFETY_EVIDENCE_MISSING" as const] : []),
    ...(!observability.complete ? ["OBSERVABILITY_INCOMPLETE" as const] : []),
    ...(!replay_validation.deterministic ? ["REPLAY_DIVERGENCE" as const] : []),
    ...(!safety_gate.fail_closed_enforced ? ["FAIL_CLOSED_NOT_ENFORCED" as const] : []),
  ])]);
  const certification = nested({
    certification_id: "P3.8-SAFETY-CERTIFICATION-GATE-001",
    outcome: outcome(derivedFailures),
    certified: outcome(derivedFailures) === "PASS",
    safety_architecture_complete: !has(derivedFailures, "SAFETY_ARCHITECTURE_INCOMPLETE"),
    behavioral_constraints_complete: safety_evaluation.constraints_complete,
    safety_gate_deterministic: safety_gate.deterministic,
    enforcement_deterministic: replay_validation.enforcement_replayed,
    intervention_reproducible: intervention_decision.reproducible,
    containment_deterministic: containment_decision.deterministic,
    warning_registry_complete: warnings.length === 3 && warnings.every((warning) => warning.routed && warning.replayable),
    automation_eligibility_deterministic: automation_eligibility.deterministic && !has(derivedFailures, "UNSAFE_AUTOMATION_ELIGIBLE"),
    exception_governance_controlled: !exception_governance.bypasses_constitutional_authority && exception_governance.evidence_refs.length > 0 && exception_governance.expiration_ref.length > 0,
    safety_evidence_immutable: evidence_ledger.immutable && evidence_ledger.lineage_complete,
    observability_complete: observability.complete,
    replay_reproducible: replay_validation.deterministic,
    fail_closed_enforced: safety_gate.fail_closed_enforced,
    failures: derivedFailures,
  });
  const base: Omit<SafetyBehavioralConstraintResult, "replay_hash" | "integrity_hash"> = {
    phase_version: VERSION,
    phase_identifier: IDENTIFIER,
    runtime_orchestration_ref: "caf-runtime-orchestration/v3.3",
    memory_knowledge_ref: "caf-memory-knowledge/v3.4",
    planning_reasoning_ref: "caf-planning-reasoning/v3.5",
    collaboration_federation_ref: "caf-collaboration-federation/v3.6",
    governance_authority_policy_ref: "caf-governance-authority-policy/v3.7",
    constraints,
    safety_evaluation,
    warnings,
    automation_eligibility,
    intervention_decision,
    containment_decision,
    exception_governance,
    safety_gate,
    evidence_ledger,
    observability,
    replay_validation,
    certification,
  };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function validateSafetyBehavioralConstraints(result?: SafetyBehavioralConstraintResult): SafetyBehavioralConstraintValidation {
  if (!result) return nested({ valid: false, outcome: "FAIL" as const, replay_hash_valid: false, integrity_hash_valid: false, constraints_valid: false, safety_gate_valid: false, intervention_valid: false, containment_valid: false, automation_valid: false, exceptions_valid: false, evidence_valid: false, observability_valid: false, certification_valid: false, failures: freezeArray(["CERTIFICATION_PRUNED" as const]) });
  const replay_hash_valid = resultReplayHash(result) === result.replay_hash;
  const integrity_hash_valid = resultIntegrityHash(result) === result.integrity_hash && verifyHashedRecord(result.certification);
  const constraints_valid = result.constraints.length >= 3 && result.constraints.every((constraint) => verifyHashedRecord(constraint) && constraint.deterministic && constraint.enforceable);
  const safety_gate_valid = verifyHashedRecord(result.safety_gate) && result.safety_gate.deterministic && result.safety_gate.fail_closed_enforced && result.safety_gate.evidence_refs.length > 0;
  const intervention_valid = verifyHashedRecord(result.intervention_decision) && result.intervention_decision.reproducible;
  const containment_valid = verifyHashedRecord(result.containment_decision) && result.containment_decision.deterministic;
  const automation_valid = verifyHashedRecord(result.automation_eligibility) && result.automation_eligibility.deterministic && result.automation_eligibility.decision !== "ELIGIBLE";
  const exceptions_valid = verifyHashedRecord(result.exception_governance) && !result.exception_governance.bypasses_constitutional_authority && result.exception_governance.evidence_refs.length > 0 && result.exception_governance.expiration_ref.length > 0;
  const evidence_valid = verifyHashedRecord(result.evidence_ledger) && result.evidence_ledger.immutable && result.evidence_ledger.lineage_complete && result.evidence_ledger.replayable;
  const observability_valid = verifyHashedRecord(result.observability) && result.observability.complete && result.observability.deterministic;
  const certification_valid = verifyHashedRecord(result.certification) && result.certification.outcome === "PASS" && result.certification.certified;
  const warnings_valid = result.warnings.length >= 3 && result.warnings.every((warning) => verifyHashedRecord(warning) && warning.routed && warning.replayable);
  const valid = replay_hash_valid && integrity_hash_valid && constraints_valid && safety_gate_valid && intervention_valid && containment_valid && automation_valid && exceptions_valid && evidence_valid && observability_valid && certification_valid && warnings_valid && result.replay_validation.deterministic;
  return nested({ valid, outcome: result.certification.outcome, replay_hash_valid, integrity_hash_valid, constraints_valid, safety_gate_valid, intervention_valid, containment_valid, automation_valid, exceptions_valid, evidence_valid, observability_valid, certification_valid, failures: result.certification.failures });
}

export function replaySafetyBehavioralConstraints(result = runSafetyBehavioralConstraints()): boolean {
  const replayed = runSafetyBehavioralConstraints();
  return result.replay_hash === replayed.replay_hash && result.integrity_hash === replayed.integrity_hash && validateSafetyBehavioralConstraints(result).valid;
}

export function getSafetyBehavioralConstraintBundle(): SafetyBehavioralConstraintBundle {
  const result = runSafetyBehavioralConstraints();
  return Object.freeze({
    doctrine: Object.freeze({
      version: VERSION,
      owns_safety_gate: true,
      owns_behavioral_constraints: true,
      owns_intervention: true,
      owns_containment: true,
      owns_automation_eligibility: true,
      owns_exception_governance: true,
      owns_constitutional_authority: false,
      owns_policy_definition: false,
      fail_closed_required: true,
    }),
    result,
    validation: validateSafetyBehavioralConstraints(result),
  });
}

export const SafetyBehavioralConstraintService = Object.freeze({
  run: runSafetyBehavioralConstraints,
  validate: validateSafetyBehavioralConstraints,
  replay: replaySafetyBehavioralConstraints,
});
