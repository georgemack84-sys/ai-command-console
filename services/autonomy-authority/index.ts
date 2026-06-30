import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import { generateAutonomyIdentity, validateAutonomyIdentity } from "@/services/autonomy-identity";
import { initializeAutonomyState } from "@/services/autonomy-state-machine";
import type { AutonomyAuthorityScope } from "@/types/autonomy-contract";
import type { AutonomyIdentityRecord } from "@/types/autonomy-identity";
import type { AutonomyStateContext } from "@/types/autonomy-state-machine";
import type {
  AutonomyActionType,
  AutonomyAuthorityAssignment,
  AutonomyAuthorityAuditLedger,
  AutonomyAuthorityDecision,
  AutonomyAuthorityDecisionState,
  AutonomyAuthorityFailureReason,
  AutonomyAuthorityFramework,
  AutonomyAuthorityLevel,
  AutonomyAuthorityReplayResult,
  AutonomyAuthorityRequest,
  AutonomyAuthorityScenario,
  AutonomyAuthorityValidationResult,
  AutonomyAuthorityVisibilitySurface,
} from "@/types/autonomy-authority";

const NOW = "2026-06-29T00:00:00.000Z";
const AUTHORITY_STATE_VALUES = ["UNASSIGNED", "ASSIGNED", "VALIDATED", "AUTHORIZED", "LIMITED", "SUSPENDED", "REVOKED"] as const;
const LEVEL_PERMISSIONS: Readonly<Record<AutonomyAuthorityLevel, readonly AutonomyActionType[]>> = Object.freeze({
  0: Object.freeze(["OBSERVE_MISSION", "COLLECT_TELEMETRY"] as AutonomyActionType[]),
  1: Object.freeze(["OBSERVE_MISSION", "COLLECT_TELEMETRY", "GENERATE_RECOMMENDATION"] as AutonomyActionType[]),
  2: Object.freeze(["OBSERVE_MISSION", "COLLECT_TELEMETRY", "GENERATE_RECOMMENDATION", "PREPARE_WORKFLOW", "QUEUE_EXECUTION_REQUEST"] as AutonomyActionType[]),
  3: Object.freeze(["OBSERVE_MISSION", "COLLECT_TELEMETRY", "GENERATE_RECOMMENDATION", "PREPARE_WORKFLOW", "QUEUE_EXECUTION_REQUEST", "EXECUTE_APPROVED_WORKFLOW", "COORDINATE_APPROVED_AGENTS"] as AutonomyActionType[]),
  4: Object.freeze(["PAUSE_AUTONOMY", "SUSPEND_SERVICE", "ISOLATE_COMPONENT"] as AutonomyActionType[]),
});
const SCOPE_TO_LEVEL: Readonly<Record<AutonomyAuthorityScope, AutonomyAuthorityLevel>> = Object.freeze({
  OBSERVE: 0,
  RECOMMEND: 1,
  PLAN: 2,
  ORCHESTRATE: 3,
  RECOVER: 4,
});

function hashValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function freezeArray<T>(values: readonly T[]): readonly T[] {
  return Object.freeze([...values]);
}

function uniq(values: readonly string[]): readonly string[] {
  return Object.freeze([...new Set(values.filter(Boolean))].sort());
}

function assignmentHashSource(assignment: Omit<AutonomyAuthorityAssignment, "assignment_hash"> | AutonomyAuthorityAssignment) {
  return {
    assignment_id: assignment.assignment_id,
    autonomy_id: assignment.autonomy_id,
    tenant_id: assignment.tenant_id,
    mission_id: assignment.mission_id,
    authority_level: assignment.authority_level,
    authority_scope: assignment.authority_scope,
    authority_state: assignment.authority_state,
    permissions: assignment.permissions,
    restrictions: assignment.restrictions,
    approval_required: assignment.approval_required,
    assigned_by: assignment.assigned_by,
    governance_profile: assignment.governance_profile,
    policy_profile: assignment.policy_profile,
    constitutional_profile: assignment.constitutional_profile,
    replay_reference: assignment.replay_reference,
    created_timestamp: assignment.created_timestamp,
  };
}

export function computeAutonomyAuthorityAssignmentHash(assignment: Omit<AutonomyAuthorityAssignment, "assignment_hash"> | AutonomyAuthorityAssignment): string {
  return hashValue("autonomy-authority-assignment", assignmentHashSource(assignment));
}

function decisionHashSource(decision: Omit<AutonomyAuthorityDecision, "integrity_hash"> | AutonomyAuthorityDecision) {
  return {
    authority_decision_id: decision.authority_decision_id,
    autonomy_id: decision.autonomy_id,
    authority_level: decision.authority_level,
    requested_action: decision.requested_action,
    mission_id: decision.mission_id,
    tenant_id: decision.tenant_id,
    operator_reference: decision.operator_reference,
    governance_profile: decision.governance_profile,
    policy_profile: decision.policy_profile,
    constitutional_profile: decision.constitutional_profile,
    approval_results: decision.approval_results,
    decision: decision.decision,
    denial_reason: decision.denial_reason,
    replay_reference: decision.replay_reference,
    timestamp: decision.timestamp,
  };
}

export function computeAutonomyAuthorityDecisionHash(decision: Omit<AutonomyAuthorityDecision, "integrity_hash"> | AutonomyAuthorityDecision): string {
  return hashValue("autonomy-authority-decision", decisionHashSource(decision));
}

export function buildAuthorityAssignment(identity = generateAutonomyIdentity(), scenario: AutonomyAuthorityScenario = "BASELINE"): AutonomyAuthorityAssignment {
  const authority_scope = identity.primary.authority_scope;
  const authority_level = scenario === "AUTHORITY_ESCALATION" ? 4 : SCOPE_TO_LEVEL[authority_scope];
  const base = {
    assignment_id: `AAA-${hashValue("autonomy-authority-assignment-id", { autonomy_id: identity.primary.autonomy_id, authority_level }).slice(0, 12).toUpperCase()}`,
    autonomy_id: identity.primary.autonomy_id,
    tenant_id: scenario === "CROSS_TENANT_AUTHORITY" ? "tenant_beta" : identity.primary.tenant_id,
    mission_id: scenario === "OUTSIDE_MISSION_SCOPE" ? "mission_external" : identity.primary.mission_id,
    authority_level,
    authority_scope,
    authority_state: scenario === "SELF_ASSIGNED" ? "UNASSIGNED" as const : "AUTHORIZED" as const,
    permissions: freezeArray(LEVEL_PERMISSIONS[authority_level]),
    restrictions: freezeArray(["no self-authorization", "no governance modification", "no constitutional bypass", "operator supremacy required"]),
    approval_required: authority_level >= 2,
    assigned_by: scenario === "SELF_ASSIGNED" ? identity.primary.autonomy_id : "governance-authority-service",
    governance_profile: scenario === "GOVERNANCE_BYPASS" ? "" : identity.source_contract.governance.governance_profile,
    policy_profile: scenario === "POLICY_VIOLATION" ? "expired-policy" : identity.source_contract.governance.policy_set[0] ?? "runtime_policy_v7a",
    constitutional_profile: scenario === "CONSTITUTIONAL_VIOLATION" ? "" : identity.source_contract.constitution.constitutional_profile,
    replay_reference: identity.primary.replay_reference,
    created_timestamp: NOW,
  };
  return Object.freeze({ ...base, assignment_hash: scenario === "HASH_MISMATCH" ? "tampered-authority-assignment" : computeAutonomyAuthorityAssignmentHash(base) });
}

export function buildAuthorityRequest(assignment: AutonomyAuthorityAssignment, scenario: AutonomyAuthorityScenario = "BASELINE"): AutonomyAuthorityRequest {
  const requested_action: AutonomyActionType =
    scenario === "UNAUTHORIZED_DELEGATION" ? "DELEGATE_TASK" :
    scenario === "GOVERNANCE_BYPASS" ? "MODIFY_GOVERNANCE_POLICY" :
    scenario === "EMERGENCY_BYPASS" ? "ISOLATE_COMPONENT" :
    assignment.authority_level >= 3 ? "EXECUTE_APPROVED_WORKFLOW" :
    assignment.authority_level === 2 ? "QUEUE_EXECUTION_REQUEST" :
    assignment.authority_level === 1 ? "GENERATE_RECOMMENDATION" : "OBSERVE_MISSION";
  return Object.freeze({
    requested_action,
    requested_authority_level: scenario === "AUTHORITY_ESCALATION" ? 4 : assignment.authority_level,
    operator_reference: scenario === "MISSING_OPERATOR_APPROVAL" ? "" : "operator:mission-control",
    operator_role: scenario === "EMERGENCY_BYPASS" ? "OBSERVER" : "GOVERNANCE_ADMIN",
    operator_approved: scenario !== "MISSING_OPERATOR_APPROVAL",
    governance_approved: scenario !== "GOVERNANCE_BYPASS",
    policy_approved: scenario !== "POLICY_VIOLATION",
    constitutional_approved: scenario !== "CONSTITUTIONAL_VIOLATION" && scenario !== "EMERGENCY_BYPASS",
    mission_approved: scenario !== "OUTSIDE_MISSION_SCOPE",
    replay_reference: assignment.replay_reference,
    tenant_id: scenario === "CROSS_TENANT_AUTHORITY" ? "tenant_beta" : assignment.tenant_id,
    mission_id: scenario === "OUTSIDE_MISSION_SCOPE" ? "mission_external" : assignment.mission_id,
    self_assigned: scenario === "SELF_ASSIGNED",
    implicit_permission: scenario === "IMPLICIT_PERMISSION",
    delegated: scenario === "UNAUTHORIZED_DELEGATION",
    inherited_privilege: scenario === "PRIVILEGE_INHERITANCE",
    modified_during_execution: scenario === "AUTHORITY_MODIFIED_DURING_EXECUTION",
  });
}

export function validateAuthorityRequest(
  identity: AutonomyIdentityRecord,
  stateContext: AutonomyStateContext,
  assignment: AutonomyAuthorityAssignment,
  request: AutonomyAuthorityRequest,
): AutonomyAuthorityValidationResult {
  const failures: AutonomyAuthorityFailureReason[] = [];
  if (!assignment) failures.push("AUTHORITY_ASSIGNMENT_MISSING");
  if (!AUTHORITY_STATE_VALUES.includes(assignment.authority_state as never)) failures.push("UNKNOWN_AUTHORITY_STATE");
  if (assignment.assigned_by === identity.primary.autonomy_id || request.self_assigned) failures.push("SELF_ASSIGNED_AUTHORITY");
  if (request.implicit_permission) failures.push("IMPLICIT_PERMISSION");
  if (request.requested_authority_level > assignment.authority_level || assignment.authority_level > SCOPE_TO_LEVEL[identity.primary.authority_scope]) failures.push("AUTHORITY_ESCALATION");
  if (!request.operator_reference) failures.push("OPERATOR_UNAUTHORIZED");
  if (assignment.approval_required && !request.operator_approved) failures.push("OPERATOR_APPROVAL_MISSING");
  if (!assignment.governance_profile || !request.governance_approved) failures.push("GOVERNANCE_BYPASS");
  if (!request.policy_approved || assignment.policy_profile.includes("expired")) failures.push(assignment.policy_profile.includes("expired") ? "POLICY_EXPIRED" : "POLICY_VIOLATION");
  if (!assignment.constitutional_profile || !request.constitutional_approved) failures.push("CONSTITUTIONAL_VIOLATION");
  if (!assignment.permissions.includes(request.requested_action)) failures.push(request.delegated ? "UNAUTHORIZED_DELEGATION" : "UNAUTHORIZED_EXECUTION");
  if (request.inherited_privilege) failures.push("PRIVILEGE_INHERITANCE");
  if (assignment.tenant_id !== identity.primary.tenant_id || request.tenant_id !== identity.primary.tenant_id) failures.push("CROSS_TENANT_AUTHORITY");
  if (assignment.mission_id !== identity.primary.mission_id || request.mission_id !== identity.primary.mission_id || !request.mission_approved) failures.push("MISSION_SCOPE_VIOLATION");
  if (request.modified_during_execution || ["ACTIVE", "LIMITED"].includes(stateContext.current_state)) failures.push(request.modified_during_execution ? "AUTHORITY_MODIFIED_DURING_EXECUTION" : "FAIL_CLOSED");
  if (!request.replay_reference) failures.push("REPLAY_REFERENCE_MISSING");
  if ((assignment.authority_level === 4 || ["PAUSE_AUTONOMY", "SUSPEND_SERVICE", "ISOLATE_COMPONENT"].includes(request.requested_action)) && (!request.constitutional_approved || request.operator_role !== "EMERGENCY_CONTROLLER")) failures.push("EMERGENCY_AUTHORITY_UNBOUNDED");
  if (computeAutonomyAuthorityAssignmentHash(assignment) !== assignment.assignment_hash) failures.push("INTEGRITY_HASH_MISMATCH");
  if (validateAutonomyIdentity(identity).validation_state === "FAIL") failures.push("FAIL_CLOSED");
  const uniqueFailures = freezeArray([...new Set(failures)]);
  const decision: AutonomyAuthorityDecisionState = uniqueFailures.length ? "DENIED" : "APPROVED";
  return Object.freeze({
    validation_id: `AAV-${hashValue("autonomy-authority-validation", { id: identity.primary.autonomy_id, request, uniqueFailures }).slice(0, 12).toUpperCase()}`,
    autonomy_id: identity.primary.autonomy_id,
    decision,
    failures: uniqueFailures,
    operator_validated: !uniqueFailures.includes("OPERATOR_UNAUTHORIZED") && !uniqueFailures.includes("OPERATOR_APPROVAL_MISSING"),
    governance_validated: !uniqueFailures.includes("GOVERNANCE_BYPASS") && !uniqueFailures.includes("GOVERNANCE_CONFLICT"),
    policy_validated: !uniqueFailures.includes("POLICY_VIOLATION") && !uniqueFailures.includes("POLICY_EXPIRED"),
    constitution_validated: !uniqueFailures.includes("CONSTITUTIONAL_VIOLATION") && !uniqueFailures.includes("CONSTITUTIONAL_CONFLICT"),
    execution_validated: !uniqueFailures.includes("UNAUTHORIZED_EXECUTION") && !uniqueFailures.includes("UNAUTHORIZED_DELEGATION") && !uniqueFailures.includes("AUTHORITY_ESCALATION"),
    mission_scope_validated: !uniqueFailures.includes("MISSION_SCOPE_VIOLATION"),
    tenant_isolated: !uniqueFailures.includes("CROSS_TENANT_AUTHORITY"),
    fail_closed: decision === "DENIED",
    integrity_hash: hashValue("autonomy-authority-validation-integrity", { request, uniqueFailures, decision }),
  });
}

export function decideAutonomyAuthority(
  identity = generateAutonomyIdentity(),
  stateContext = initializeAutonomyState(identity),
  scenario: AutonomyAuthorityScenario = "BASELINE",
): { assignment: AutonomyAuthorityAssignment; request: AutonomyAuthorityRequest; validation: AutonomyAuthorityValidationResult; decision: AutonomyAuthorityDecision } {
  const assignment = buildAuthorityAssignment(identity, scenario);
  const request = buildAuthorityRequest(assignment, scenario);
  const validation = validateAuthorityRequest(identity, stateContext, assignment, request);
  const base = {
    authority_decision_id: `AAD-${hashValue("autonomy-authority-decision-id", { autonomy_id: identity.primary.autonomy_id, action: request.requested_action, scenario }).slice(0, 12).toUpperCase()}`,
    autonomy_id: identity.primary.autonomy_id,
    authority_level: request.requested_authority_level,
    requested_action: request.requested_action,
    mission_id: request.mission_id,
    tenant_id: request.tenant_id,
    operator_reference: request.operator_reference,
    governance_profile: assignment.governance_profile,
    policy_profile: assignment.policy_profile,
    constitutional_profile: assignment.constitutional_profile,
    approval_results: Object.freeze({
      operator: validation.operator_validated,
      governance: validation.governance_validated,
      policy: validation.policy_validated,
      constitution: validation.constitution_validated,
      mission: validation.mission_scope_validated,
      execution: validation.execution_validated,
    }),
    decision: validation.decision,
    denial_reason: validation.failures[0] ?? null,
    replay_reference: request.replay_reference,
    timestamp: NOW,
  };
  const decision = Object.freeze({ ...base, integrity_hash: scenario === "HASH_MISMATCH" ? "tampered-authority-decision" : computeAutonomyAuthorityDecisionHash(base) });
  return Object.freeze({ assignment, request, validation, decision });
}

export function buildAuthorityAuditLedger(decisions: readonly AutonomyAuthorityDecision[]): AutonomyAuthorityAuditLedger {
  const first = decisions[0];
  const source = {
    ledger_id: `AAL-${hashValue("autonomy-authority-ledger-id", decisions.map((item) => item.authority_decision_id)).slice(0, 12).toUpperCase()}`,
    autonomy_id: first?.autonomy_id ?? "",
    tenant_id: first?.tenant_id ?? "",
    mission_id: first?.mission_id ?? "",
    decisions: freezeArray(decisions),
    approval_chain: uniq(decisions.flatMap((item) => [item.operator_reference, item.governance_profile, item.policy_profile, item.constitutional_profile])),
    denied_requests: freezeArray(decisions.filter((item) => item.decision === "DENIED")),
    replay_references: uniq(decisions.map((item) => item.replay_reference)),
  };
  return Object.freeze({ ...source, ledger_hash: hashValue("autonomy-authority-ledger", source) });
}

export function replayAuthorityDecisions(ledger: AutonomyAuthorityAuditLedger): AutonomyAuthorityReplayResult {
  const failures: AutonomyAuthorityFailureReason[] = [];
  for (const decision of ledger.decisions) {
    if (!decision.replay_reference) failures.push("REPLAY_REFERENCE_MISSING");
    if (!decision.integrity_hash || decision.integrity_hash.startsWith("tampered") || computeAutonomyAuthorityDecisionHash(decision) !== decision.integrity_hash) failures.push("INTEGRITY_HASH_MISMATCH");
    if (decision.tenant_id !== ledger.tenant_id) failures.push("CROSS_TENANT_AUTHORITY");
  }
  const source = {
    replay_id: `AAR-${hashValue("autonomy-authority-replay-id", ledger.ledger_id).slice(0, 12).toUpperCase()}`,
    autonomy_id: ledger.autonomy_id,
    reconstructed_outcomes: freezeArray(ledger.decisions.map((item) => item.decision)),
    denial_reasons: freezeArray(ledger.decisions.map((item) => item.denial_reason)),
    replay_references: ledger.replay_references,
    validation_state: failures.length ? "FAIL" as const : "PASS" as const,
    failure_reason: failures[0] ?? null,
  };
  return Object.freeze({ ...source, replay_hash: hashValue("autonomy-authority-replay", source) });
}

export function buildAuthorityVisibilitySurface(assignment: AutonomyAuthorityAssignment, ledger: AutonomyAuthorityAuditLedger): AutonomyAuthorityVisibilitySurface {
  return Object.freeze({
    autonomy_id: assignment.autonomy_id,
    assigned_authority_level: assignment.authority_level,
    current_authority_status: assignment.authority_state,
    validation_results: freezeArray(ledger.decisions.map((item) => item.decision)),
    denied_requests: ledger.denied_requests,
    approval_chain: ledger.approval_chain,
    governance_influence: assignment.governance_profile || "BLOCKED",
    constitutional_influence: assignment.constitutional_profile || "BLOCKED",
    policy_influence: assignment.policy_profile,
    execution_permissions: assignment.permissions,
    replay_references: ledger.replay_references,
    authority_history: ledger.decisions,
    hidden_decisions_visible: false,
  });
}

export function getAutonomyAuthorityFramework(): AutonomyAuthorityFramework {
  const identity = generateAutonomyIdentity();
  const state_context = initializeAutonomyState(identity);
  const { assignment, validation, decision } = decideAutonomyAuthority(identity, state_context);
  const denied = decideAutonomyAuthority(identity, state_context, "MISSING_OPERATOR_APPROVAL").decision;
  const ledger = buildAuthorityAuditLedger([decision, denied]);
  return Object.freeze({
    identity,
    state_context,
    assignment,
    decision,
    validation,
    ledger,
    replay: replayAuthorityDecisions(ledger),
    visibility: buildAuthorityVisibilitySurface(assignment, ledger),
  });
}
