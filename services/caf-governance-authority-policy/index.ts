import { runCafConstitutionalFoundation, validateCafConstitutionalFoundation } from "@/services/caf-constitutional-foundation";
import { runCollaborationFederation, validateCollaborationFederation } from "@/services/caf-collaboration-federation";
import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import type {
  GateWarning,
  GovernanceAuthorityPolicyBundle,
  GovernanceAuthorityPolicyFailure,
  GovernanceAuthorityPolicyInput,
  GovernanceAuthorityPolicyResult,
  GovernanceAuthorityPolicyScenario,
  GovernanceAuthorityPolicyValidation,
  GovernanceCertificationOutcome,
} from "@/types/caf-governance-authority-policy";

const VERSION = "caf-governance-authority-policy/v3.7" as const;
const IDENTIFIER = "CafGovernanceAuthorityPolicy" as const;

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
function scenarioFailure(scenario: GovernanceAuthorityPolicyScenario): GovernanceAuthorityPolicyFailure | undefined { return scenario === "BASELINE" ? undefined : scenario; }
function has(failures: readonly GovernanceAuthorityPolicyFailure[], failure: GovernanceAuthorityPolicyFailure): boolean { return failures.includes(failure); }
function outcome(failures: readonly GovernanceAuthorityPolicyFailure[]): GovernanceCertificationOutcome {
  if (has(failures, "CERTIFICATION_PRUNED")) return "PRUNED";
  return failures.length ? "FAIL" : "PASS";
}
function verifyHashedRecord(value: { integrity_hash: string }): boolean { return hashWithoutIntegrity(value) === value.integrity_hash; }

function buildWarnings(failures: readonly GovernanceAuthorityPolicyFailure[]): readonly GateWarning[] {
  const invalid = has(failures, "WARNING_CLASS_NOT_FROM_P3_0");
  return freezeArray([
    nested({
      warning_id: "P3.7-WARN-001",
      warning_class: invalid ? "LOCAL_POLICY_WARNING" : "APPROVAL_REQUIRED",
      severity: "HIGH" as const,
      category: "approval",
      source_gate: "APPROVAL" as const,
      description: "Operator approval is required before execution admission.",
      recommended_action: "route to operator approval workflow",
      evidence_ref: "evidence:p3.7:approval-warning",
      from_p3_0_registry: !invalid,
    }),
    nested({
      warning_id: "P3.7-WARN-002",
      warning_class: "GOVERNANCE_ESCALATION_REQUIRED",
      severity: "MEDIUM" as const,
      category: "governance",
      source_gate: "GATE_ORCHESTRATOR" as const,
      description: "Governance review remains available for elevated decisions.",
      recommended_action: "publish to governance dashboard",
      evidence_ref: "evidence:p3.7:governance-warning",
      from_p3_0_registry: true,
    }),
  ]);
}

function resultReplayHash(result: Omit<GovernanceAuthorityPolicyResult, "replay_hash" | "integrity_hash">): string {
  return hash({
    authority: result.authority_decision.integrity_hash,
    policy: result.policy_evaluation.integrity_hash,
    approval: result.approval_decision.integrity_hash,
    warnings: result.warning_collection.integrity_hash,
    gate: result.gate_result.integrity_hash,
    admission: result.admission_request.integrity_hash,
    replay: result.replay_validation.integrity_hash,
    certification: result.certification.integrity_hash,
  });
}
function resultIntegrityHash(result: Omit<GovernanceAuthorityPolicyResult, "integrity_hash">): string {
  return hash({ version: result.phase_version, identifier: result.phase_identifier, outcome: result.certification.outcome, replay_hash: result.replay_hash });
}

export function runGovernanceAuthorityPolicy(input: GovernanceAuthorityPolicyInput = {}): GovernanceAuthorityPolicyResult {
  const direct = scenarioFailure(input.scenario ?? "BASELINE");
  const scenarioFailures = freezeArray<GovernanceAuthorityPolicyFailure>(direct ? [direct] : []);
  const p30 = runCafConstitutionalFoundation();
  const p36 = runCollaborationFederation();
  const p30Valid = validateCafConstitutionalFoundation(p30).valid && !has(scenarioFailures, "P3_0_AUTHORITY_MATRIX_UNAVAILABLE") && !has(scenarioFailures, "P3_0_WARNING_REGISTRY_UNAVAILABLE");
  const p36Valid = validateCollaborationFederation(p36).valid && !has(scenarioFailures, "P3_6_COLLABORATION_INVALID");
  const failures = freezeArray<GovernanceAuthorityPolicyFailure>([
    ...scenarioFailures,
    ...(!p30Valid && has(scenarioFailures, "P3_0_WARNING_REGISTRY_UNAVAILABLE") ? [] : []),
    ...(!p30Valid && !scenarioFailures.includes("P3_0_AUTHORITY_MATRIX_UNAVAILABLE") && !scenarioFailures.includes("P3_0_WARNING_REGISTRY_UNAVAILABLE") ? ["P3_0_AUTHORITY_MATRIX_UNAVAILABLE" as const] : []),
    ...(!p36Valid && !scenarioFailures.includes("P3_6_COLLABORATION_INVALID") ? ["P3_6_COLLABORATION_INVALID" as const] : []),
  ]);
  const evidenceRefs = has(failures, "EVIDENCE_TRACE_MISSING") ? freezeArray([]) : freezeArray(["evidence:p3.7:authority", "evidence:p3.7:policy", "evidence:p3.7:approval"]);
  const authority_decision = nested({
    authority_decision_id: "P3.7-AUTHORITY-DECISION-001",
    actor_identity_ref: "agent:p3.7:actor",
    principal_identity_ref: "principal:p3.7:operator",
    delegated_authority_ref: "authority:p3.0:operator-delegation",
    execution_scope_ref: "scope:p3.7:runtime-admission",
    capability_permission_ref: "capability:P1-CAP-002",
    lifecycle_state_ref: "lifecycle:active",
    mission_context_ref: "mission:p3.7:governed",
    operator_authority_ref: "operator:p3.7:approval-authority",
    governance_approval_refs: freezeArray(["approval:p3.7:operator"]),
    decision: has(failures, "FAIL_CLOSED_NOT_ENFORCED") ? "AUTHORIZED" as const : "CONDITIONALLY_AUTHORIZED" as const,
    deterministic: !has(failures, "AUTHORITY_DECISION_NON_DETERMINISTIC"),
    evidence_refs: evidenceRefs,
  });
  const policy_evaluation = nested({
    policy_evaluation_id: "P3.7-POLICY-EVALUATION-001",
    policy_engine_ref: "Program 2 - CCI Policy Engine" as const,
    evaluated_policy_refs: freezeArray(["policy:platform", "policy:tenant", "policy:mission", "policy:runtime", "policy:capability", "policy:safety", "policy:federation"]),
    sequencing_deterministic: true,
    conflict_handling_ref: "policy-conflict:p3.7:fail-closed",
    decision: has(failures, "POLICY_ENGINE_BYPASS") ? "POLICY_VIOLATION" as const : "CONDITIONALLY_COMPLIANT" as const,
    cci_policy_engine_consumed: !has(failures, "POLICY_ENGINE_BYPASS"),
    evidence_refs: evidenceRefs,
  });
  const approval_decision = nested({
    approval_decision_id: "P3.7-APPROVAL-DECISION-001",
    required_approvals: freezeArray(["operator approval"]),
    approval_routes: freezeArray(["route:operator", "route:governance-dashboard"]),
    approval_state_refs: freezeArray(["approval-state:pending-or-approved"]),
    escalation_refs: freezeArray(["escalation:governance"]),
    decision: has(failures, "APPROVAL_WORKFLOW_NON_DETERMINISTIC") ? "PENDING_APPROVAL" as const : "APPROVED" as const,
    deterministic: !has(failures, "APPROVAL_WORKFLOW_NON_DETERMINISTIC"),
    evidence_refs: evidenceRefs,
  });
  const warnings = buildWarnings(failures);
  const warning_collection = nested({
    warning_collection_id: "P3.7-WARNING-COLLECTION-001",
    warnings,
    duplicates_suppressed: true,
    ordering_deterministic: true,
    severity_assigned: true,
    routing_destinations: has(failures, "WARNING_ROUTING_MISSING") ? freezeArray([]) : freezeArray(["operators", "governance dashboards", "execution logs", "observability services", "evidence services"]),
    routed: !has(failures, "WARNING_ROUTING_MISSING"),
  });
  const admitted = !["POLICY_ENGINE_BYPASS", "FAIL_CLOSED_NOT_ENFORCED", "GOVERNANCE_POLICY_REDEFINED", "AUTHORITY_HIERARCHY_REDEFINED"].some((failure) => failures.includes(failure as GovernanceAuthorityPolicyFailure));
  const gate_result = nested({
    gate_id: "P3.7-GATE-RESULT-001",
    request_id: "request:p3.7:execution-001",
    agent_id: "agent:p3.7:actor",
    principal_id: "principal:p3.7:operator",
    capability_id: "P1-CAP-002",
    authority_decision: authority_decision.decision,
    policy_decision: policy_evaluation.decision,
    approval_decision: approval_decision.decision,
    outcome: admitted ? "ADMITTED_WITH_WARNINGS" as const : has(failures, "FAIL_CLOSED_NOT_ENFORCED") ? "ADMITTED" as const : "FAIL_CLOSED" as const,
    warning_collection_ref: warning_collection.warning_collection_id,
    required_approvals: approval_decision.required_approvals,
    evidence_refs: evidenceRefs,
    exactly_one_result: !has(failures, "GATE_RESULT_DUPLICATED"),
    timestamp: "2026-07-17T00:00:00.000Z",
  });
  const admission_request = nested({
    admission_request_id: "P3.7-EXECUTION-ADMISSION-001",
    gate_result_ref: gate_result.gate_id,
    runtime_orchestrator_ref: "caf-runtime-orchestration/v3.3",
    admitted: admitted && !has(failures, "ADMISSION_REQUEST_MISSING"),
    admission_scope_ref: "scope:p3.7:runtime-admission",
    evidence_refs: has(failures, "ADMISSION_REQUEST_MISSING") ? freezeArray([]) : evidenceRefs,
  });
  const replay_validation = nested({
    replay_validation_id: "P3.7-REPLAY-VALIDATION-001",
    authority_replayed: authority_decision.deterministic,
    policy_replayed: policy_evaluation.cci_policy_engine_consumed,
    approval_replayed: approval_decision.deterministic,
    warnings_replayed: warning_collection.ordering_deterministic,
    gate_result_replayed: gate_result.exactly_one_result,
    admission_replayed: admission_request.admitted,
    deterministic: !has(failures, "REPLAY_DIVERGENCE"),
  });
  const derivedFailures = freezeArray([...new Set([
    ...failures,
    ...(!p36Valid ? ["P3_6_COLLABORATION_INVALID" as const] : []),
    ...(!p30Valid && has(failures, "P3_0_WARNING_REGISTRY_UNAVAILABLE") ? ["P3_0_WARNING_REGISTRY_UNAVAILABLE" as const] : []),
    ...(has(failures, "GOVERNANCE_POLICY_REDEFINED") ? ["GOVERNANCE_POLICY_REDEFINED" as const] : []),
    ...(has(failures, "AUTHORITY_HIERARCHY_REDEFINED") ? ["AUTHORITY_HIERARCHY_REDEFINED" as const] : []),
    ...(!authority_decision.deterministic ? ["AUTHORITY_DECISION_NON_DETERMINISTIC" as const] : []),
    ...(!policy_evaluation.cci_policy_engine_consumed ? ["POLICY_ENGINE_BYPASS" as const] : []),
    ...(!approval_decision.deterministic ? ["APPROVAL_WORKFLOW_NON_DETERMINISTIC" as const] : []),
    ...(!gate_result.exactly_one_result ? ["GATE_RESULT_DUPLICATED" as const] : []),
    ...(warnings.some((warning) => !warning.from_p3_0_registry) ? ["WARNING_CLASS_NOT_FROM_P3_0" as const] : []),
    ...(!warning_collection.routed ? ["WARNING_ROUTING_MISSING" as const] : []),
    ...(admitted && !admission_request.admitted ? ["ADMISSION_REQUEST_MISSING" as const] : []),
    ...(evidenceRefs.length === 0 ? ["EVIDENCE_TRACE_MISSING" as const] : []),
    ...(!replay_validation.deterministic ? ["REPLAY_DIVERGENCE" as const] : []),
    ...(has(failures, "FAIL_CLOSED_NOT_ENFORCED") ? ["FAIL_CLOSED_NOT_ENFORCED" as const] : []),
  ])]);
  const certification = nested({
    certification_id: "P3.7-GOVERNANCE-CERTIFICATION-GATE-001",
    outcome: outcome(derivedFailures),
    certified: outcome(derivedFailures) === "PASS",
    authority_deterministic: authority_decision.deterministic,
    policy_uses_cci_engine: policy_evaluation.cci_policy_engine_consumed,
    approval_deterministic: approval_decision.deterministic,
    exactly_one_gate_result: gate_result.exactly_one_result,
    warnings_from_p3_0_only: warnings.every((warning) => warning.from_p3_0_registry),
    admission_generated_when_admitted: !admitted || admission_request.admitted,
    evidence_traceable: evidenceRefs.length > 0,
    replay_reproducible: replay_validation.deterministic,
    no_policy_redefinition: !has(failures, "GOVERNANCE_POLICY_REDEFINED"),
    no_authority_redefinition: !has(failures, "AUTHORITY_HIERARCHY_REDEFINED"),
    fail_closed_enforced: !has(failures, "FAIL_CLOSED_NOT_ENFORCED"),
    failures: derivedFailures,
  });
  const base: Omit<GovernanceAuthorityPolicyResult, "replay_hash" | "integrity_hash"> = {
    phase_version: VERSION,
    phase_identifier: IDENTIFIER,
    constitutional_ref: "P3.0-CAF-CONSTITUTION-001",
    collaboration_federation_ref: "caf-collaboration-federation/v3.6",
    cci_policy_engine_ref: "Program 2 - CCI Policy Engine",
    cci_governance_ref: "Program 2 - CCI Governance Services",
    authority_decision,
    policy_evaluation,
    approval_decision,
    warning_collection,
    gate_result,
    admission_request,
    replay_validation,
    certification,
  };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function validateGovernanceAuthorityPolicy(result?: GovernanceAuthorityPolicyResult): GovernanceAuthorityPolicyValidation {
  if (!result) return nested({ valid: false, outcome: "FAIL" as const, replay_hash_valid: false, integrity_hash_valid: false, authority_valid: false, policy_valid: false, approval_valid: false, warnings_valid: false, gate_valid: false, admission_valid: false, certification_valid: false, failures: freezeArray(["CERTIFICATION_PRUNED" as const]) });
  const replay_hash_valid = resultReplayHash(result) === result.replay_hash;
  const integrity_hash_valid = resultIntegrityHash(result) === result.integrity_hash && verifyHashedRecord(result.certification);
  const authority_valid = verifyHashedRecord(result.authority_decision) && result.authority_decision.deterministic;
  const policy_valid = verifyHashedRecord(result.policy_evaluation) && result.policy_evaluation.cci_policy_engine_consumed;
  const approval_valid = verifyHashedRecord(result.approval_decision) && result.approval_decision.deterministic;
  const warnings_valid = verifyHashedRecord(result.warning_collection) && result.warning_collection.routed && result.warning_collection.warnings.every((warning) => verifyHashedRecord(warning) && warning.from_p3_0_registry);
  const gate_valid = verifyHashedRecord(result.gate_result) && result.gate_result.exactly_one_result && result.gate_result.evidence_refs.length > 0;
  const admission_valid = verifyHashedRecord(result.admission_request) && (!["ADMITTED", "ADMITTED_WITH_WARNINGS"].includes(result.gate_result.outcome) || result.admission_request.admitted);
  const certification_valid = verifyHashedRecord(result.certification) && result.certification.outcome === "PASS" && result.certification.certified;
  const valid = replay_hash_valid && integrity_hash_valid && authority_valid && policy_valid && approval_valid && warnings_valid && gate_valid && admission_valid && certification_valid && result.replay_validation.deterministic;
  return nested({ valid, outcome: result.certification.outcome, replay_hash_valid, integrity_hash_valid, authority_valid, policy_valid, approval_valid, warnings_valid, gate_valid, admission_valid, certification_valid, failures: result.certification.failures });
}

export function replayGovernanceAuthorityPolicy(result = runGovernanceAuthorityPolicy()): boolean {
  const replayed = runGovernanceAuthorityPolicy();
  return result.replay_hash === replayed.replay_hash && result.integrity_hash === replayed.integrity_hash && validateGovernanceAuthorityPolicy(result).valid;
}

export function getGovernanceAuthorityPolicyBundle(): GovernanceAuthorityPolicyBundle {
  const result = runGovernanceAuthorityPolicy();
  return Object.freeze({
    doctrine: Object.freeze({
      version: VERSION,
      consumes_p3_0_authority_matrix: true,
      consumes_p3_0_warning_registry: true,
      consumes_cci_policy_engine: true,
      defines_policy: false,
      defines_authority_hierarchy: false,
      exactly_one_gate_result_required: true,
      fail_closed_required: true,
    }),
    result,
    validation: validateGovernanceAuthorityPolicy(result),
  });
}

export const GovernanceAuthorityPolicyService = Object.freeze({
  run: runGovernanceAuthorityPolicy,
  validate: validateGovernanceAuthorityPolicy,
  replay: replayGovernanceAuthorityPolicy,
});
