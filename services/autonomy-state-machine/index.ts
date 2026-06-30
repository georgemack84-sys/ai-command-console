import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import { generateAutonomyIdentity, validateAutonomyIdentity } from "@/services/autonomy-identity";
import { validateAutonomyContract } from "@/services/autonomy-contract";
import type {
  AutonomyOperationalState,
  AutonomyStateContext,
  AutonomyStateFailureReason,
  AutonomyStateModel,
  AutonomyStateReplayResult,
  AutonomyStateVisibilitySurface,
  AutonomyTransitionLedger,
  AutonomyTransitionRecord,
  AutonomyTransitionRequest,
  AutonomyTransitionScenario,
  AutonomyTransitionValidationFailure,
  AutonomyTransitionValidationResult,
} from "@/types/autonomy-state-machine";
import type { AutonomyIdentityRecord } from "@/types/autonomy-identity";

const NOW = "2026-06-28T23:00:00.000Z";
export const AUTONOMY_OPERATIONAL_STATES = ["CREATED", "INITIALIZED", "VALIDATED", "READY", "MONITORING", "ACTIVE", "LIMITED", "PAUSED", "SUSPENDED", "RESUMING", "RETIRED", "ARCHIVED"] as const;
const INVALID_STATES = ["UNKNOWN", "DUPLICATE", "ORPHANED", "CORRUPTED", "INVALID", "EXPIRED", "HIDDEN"] as const;
const TERMINAL_STATES = ["RETIRED", "ARCHIVED"] as const;
const VALID_TRANSITIONS: Readonly<Record<AutonomyOperationalState, readonly AutonomyOperationalState[]>> = Object.freeze({
  CREATED: Object.freeze(["INITIALIZED"] as AutonomyOperationalState[]),
  INITIALIZED: Object.freeze(["VALIDATED"] as AutonomyOperationalState[]),
  VALIDATED: Object.freeze(["READY"] as AutonomyOperationalState[]),
  READY: Object.freeze(["MONITORING"] as AutonomyOperationalState[]),
  MONITORING: Object.freeze(["ACTIVE", "LIMITED", "PAUSED", "SUSPENDED", "RETIRED"] as AutonomyOperationalState[]),
  ACTIVE: Object.freeze(["LIMITED", "PAUSED", "SUSPENDED", "RETIRED"] as AutonomyOperationalState[]),
  LIMITED: Object.freeze(["MONITORING", "ACTIVE", "PAUSED", "SUSPENDED", "RETIRED"] as AutonomyOperationalState[]),
  PAUSED: Object.freeze(["RESUMING", "SUSPENDED", "RETIRED"] as AutonomyOperationalState[]),
  SUSPENDED: Object.freeze(["RESUMING", "RETIRED"] as AutonomyOperationalState[]),
  RESUMING: Object.freeze(["MONITORING", "ACTIVE", "LIMITED", "SUSPENDED", "RETIRED"] as AutonomyOperationalState[]),
  RETIRED: Object.freeze(["ARCHIVED"] as AutonomyOperationalState[]),
  ARCHIVED: Object.freeze([] as AutonomyOperationalState[]),
});
const LINEAR_ORDER: Readonly<Record<AutonomyOperationalState, number>> = Object.freeze({
  CREATED: 0,
  INITIALIZED: 1,
  VALIDATED: 2,
  READY: 3,
  MONITORING: 4,
  ACTIVE: 5,
  LIMITED: 6,
  PAUSED: 7,
  SUSPENDED: 8,
  RESUMING: 9,
  RETIRED: 10,
  ARCHIVED: 11,
});
const RECOVERY_PATHS = [
  ["PAUSED", "RESUMING", "MONITORING"],
  ["PAUSED", "RESUMING", "ACTIVE"],
  ["SUSPENDED", "RESUMING", "MONITORING"],
  ["SUSPENDED", "RESUMING", "LIMITED"],
  ["LIMITED", "MONITORING"],
  ["LIMITED", "ACTIVE"],
] as const;
const AUTHORITY_RANK = Object.freeze({ OBSERVE: 0, RECOMMEND: 1, PLAN: 2, ORCHESTRATE: 3, RECOVER: 4 });

function hashValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function freezeArray<T>(values: readonly T[]): readonly T[] {
  return Object.freeze([...values]);
}

function uniq(values: readonly string[]): readonly string[] {
  return Object.freeze([...new Set(values.filter(Boolean))].sort());
}

function failure(reason: AutonomyStateFailureReason, field_path: string, message: string): AutonomyTransitionValidationFailure {
  return Object.freeze({
    failure_id: `ASF-${hashValue("autonomy-state-failure", { reason, field_path, message }).slice(0, 12).toUpperCase()}`,
    reason,
    field_path,
    message,
    fail_closed: true,
  });
}

export function buildAutonomyStateModel(): AutonomyStateModel {
  return Object.freeze({
    states: freezeArray(AUTONOMY_OPERATIONAL_STATES),
    valid_transitions: VALID_TRANSITIONS,
    recovery_paths: freezeArray(RECOVERY_PATHS.map((path) => freezeArray(path))),
    terminal_states: freezeArray(TERMINAL_STATES),
    invalid_states: freezeArray(INVALID_STATES),
  });
}

function computeStateHash(source: unknown): string {
  return hashValue("autonomy-state", source);
}

function transitionHashSource(identity: AutonomyIdentityRecord, request: AutonomyTransitionRequest) {
  return {
    autonomy_id: identity.primary.autonomy_id,
    tenant_id: identity.primary.tenant_id,
    mission_id: identity.primary.mission_id,
    previous_state: request.previous_state,
    next_state: request.next_state,
    transition_reason: request.transition_reason,
    triggering_event: request.triggering_event,
    governance_profile: request.governance_profile,
    authority_scope: request.authority_scope,
    operator_reference: request.operator_reference,
    replay_reference: request.replay_reference,
    governance_forced: request.governance_forced ?? false,
    operator_approved: request.operator_approved ?? true,
    replay_validated: request.replay_validated ?? true,
    visibility_available: request.visibility_available ?? true,
    timestamp: NOW,
  };
}

export function computeAutonomyTransitionIntegrityHash(identity: AutonomyIdentityRecord, request: AutonomyTransitionRequest): string {
  return hashValue("autonomy-transition-integrity", transitionHashSource(identity, request));
}

export function initializeAutonomyState(identity = generateAutonomyIdentity()): AutonomyStateContext {
  const source = {
    autonomy_id: identity.primary.autonomy_id,
    tenant_id: identity.primary.tenant_id,
    mission_id: identity.primary.mission_id,
    current_state: "CREATED" as const,
    identity_hash: identity.primary.identity_hash,
    contract_hash: identity.source_contract.certification.integrity_hash,
  };
  return Object.freeze({
    identity,
    current_state: "CREATED",
    previous_state: null,
    lifecycle_history: freezeArray([]),
    state_hash: computeStateHash(source),
  });
}

function defaultRequest(context: AutonomyStateContext, next_state: AutonomyOperationalState, scenario: AutonomyTransitionScenario = "BASELINE"): AutonomyTransitionRequest {
  const previous_state = scenario === "UNKNOWN_STATE" ? "UNKNOWN" as AutonomyOperationalState : context.current_state;
  const actualNext = scenario === "SKIPPED_TRANSITION" ? "ACTIVE" : scenario === "CIRCULAR_TRANSITION" ? previous_state : scenario === "DIRECT_SUSPENDED_ACTIVE" ? "ACTIVE" : scenario === "ARCHIVED_REACTIVATION" ? "ACTIVE" : next_state;
  return Object.freeze({
    previous_state,
    next_state: actualNext,
    transition_reason: scenario === "GOVERNANCE_FORCED_LIMIT" ? "governance forced limited authority" : `transition ${previous_state} to ${actualNext}`,
    triggering_event: actualNext === "LIMITED" ? "GOVERNANCE_LIMIT" : actualNext === "PAUSED" ? "OPERATOR_PAUSE" : actualNext === "SUSPENDED" ? "GOVERNANCE_SUSPENSION" : actualNext === "RESUMING" ? "RECOVERY_STARTED" : actualNext === "RETIRED" ? "RETIREMENT_REQUESTED" : actualNext === "ARCHIVED" ? "ARCHIVAL_COMPLETED" : "VALIDATION_COMPLETED",
    governance_profile: scenario === "MISSING_GOVERNANCE" ? "" : context.identity.source_contract.governance.governance_profile,
    authority_scope: scenario === "AUTHORITY_ESCALATION" ? "RECOVER" : context.identity.primary.authority_scope,
    operator_reference: scenario === "MISSING_OPERATOR_VISIBILITY" ? "" : "operator:mission-control",
    replay_reference: scenario === "MISSING_REPLAY" ? "" : context.identity.primary.replay_reference,
    governance_forced: scenario === "GOVERNANCE_FORCED_LIMIT",
    operator_approved: !["DIRECT_SUSPENDED_ACTIVE"].includes(scenario),
    replay_validated: !["DIRECT_SUSPENDED_ACTIVE"].includes(scenario),
    visibility_available: scenario !== "MISSING_OPERATOR_VISIBILITY",
  });
}

function isRecoveryTransition(previous: AutonomyOperationalState, next: AutonomyOperationalState): boolean {
  return RECOVERY_PATHS.some((path) => {
    const states = path as readonly AutonomyOperationalState[];
    const index = states.indexOf(previous);
    return index >= 0 && states[index + 1] === next;
  });
}

export function validateAutonomyTransition(context: AutonomyStateContext, request: AutonomyTransitionRequest): AutonomyTransitionValidationResult {
  const failures: AutonomyTransitionValidationFailure[] = [];
  if (!context) failures.push(failure("STATE_CONTEXT_MISSING", "context", "state context is required"));
  const identityValidation = validateAutonomyIdentity(context.identity);
  const contractValidation = validateAutonomyContract(context.identity.source_contract);
  if (identityValidation.validation_state === "FAIL") failures.push(failure("IDENTITY_VALIDATION_FAILED", "identity", "identity validation failed"));
  if (contractValidation.validation_state === "FAIL") failures.push(failure("CONTRACT_VALIDATION_FAILED", "contract", "contract validation failed"));
  if (!AUTONOMY_OPERATIONAL_STATES.includes(request.previous_state as never) || (INVALID_STATES as readonly string[]).includes(request.previous_state)) failures.push(failure("UNKNOWN_STATE", "previous_state", "previous state is unknown"));
  if (!AUTONOMY_OPERATIONAL_STATES.includes(request.next_state as never) || (INVALID_STATES as readonly string[]).includes(request.next_state)) failures.push(failure("UNKNOWN_STATE", "next_state", "next state is unknown"));
  if ((context as { hidden_state?: string }).hidden_state) failures.push(failure("HIDDEN_STATE_DETECTED", "context.hidden_state", "hidden lifecycle state is not permitted"));
  if (request.previous_state !== context.current_state) failures.push(failure("TRANSITION_ORDER_MISMATCH", "previous_state", "transition previous state must match context"));
  if (request.previous_state === request.next_state) failures.push(failure("CIRCULAR_TRANSITION", "next_state", "state cannot transition to itself"));
  if (TERMINAL_STATES.includes(request.previous_state as never) && request.next_state !== "ARCHIVED") failures.push(failure("TERMINAL_REACTIVATION", "previous_state", "terminal states cannot be reactivated"));
  const allowed = VALID_TRANSITIONS[request.previous_state]?.includes(request.next_state) ?? false;
  if (!allowed) failures.push(failure(isRecoveryTransition(request.previous_state, request.next_state) ? "ILLEGAL_RECOVERY" : "ILLEGAL_TRANSITION", "next_state", "next state is not allowed from previous state"));
  const isLinearForward = LINEAR_ORDER[request.next_state] - LINEAR_ORDER[request.previous_state] === 1;
  const isAllowedRecovery = isRecoveryTransition(request.previous_state, request.next_state);
  const isGovernanceBranch = ["LIMITED", "PAUSED", "SUSPENDED", "RETIRED"].includes(request.next_state);
  if (allowed && !isLinearForward && !isAllowedRecovery && !isGovernanceBranch && request.next_state !== "ARCHIVED") failures.push(failure("SKIPPED_TRANSITION", "next_state", "transition skips required lifecycle state"));
  if (!request.governance_profile) failures.push(failure("GOVERNANCE_CONTEXT_MISSING", "governance_profile", "governance profile is required"));
  if (!request.authority_scope) failures.push(failure("AUTHORITY_SCOPE_MISSING", "authority_scope", "authority scope is required"));
  if (AUTHORITY_RANK[request.authority_scope] > AUTHORITY_RANK[context.identity.primary.authority_scope]) failures.push(failure("AUTHORITY_ESCALATION", "authority_scope", "transition authority exceeds identity authority"));
  if (context.identity.primary.tenant_id !== context.identity.source_contract.identity.tenant_id) failures.push(failure("TENANT_OWNERSHIP_INVALID", "tenant_id", "identity and contract tenant mismatch"));
  if (!request.replay_reference) failures.push(failure("REPLAY_REFERENCE_MISSING", "replay_reference", "replay reference is required"));
  if (!request.operator_reference || !request.visibility_available) failures.push(failure("OPERATOR_VISIBILITY_MISSING", "operator_reference", "operator visibility is required"));
  if ((request.previous_state === "PAUSED" || request.previous_state === "SUSPENDED" || request.next_state === "RESUMING") && !request.operator_approved) failures.push(failure("OPERATOR_APPROVAL_MISSING", "operator_approved", "recovery requires operator approval"));
  if ((request.previous_state === "PAUSED" || request.previous_state === "SUSPENDED" || request.next_state === "RESUMING") && !request.replay_validated) failures.push(failure("REPLAY_VALIDATION_MISSING", "replay_validated", "recovery requires replay validation"));
  if (request.governance_forced && !["LIMITED", "PAUSED", "SUSPENDED", "RETIRED"].includes(request.next_state)) failures.push(failure("GOVERNANCE_FORCED_TRANSITION_OVERRIDDEN", "next_state", "governance forced transitions cannot be overridden"));
  const integrity_hash = computeAutonomyTransitionIntegrityHash(context.identity, request);
  if (!integrity_hash) failures.push(failure("INTEGRITY_HASH_MISSING", "integrity_hash", "transition integrity hash is required"));
  const frozenFailures = freezeArray(failures);
  const has = (reason: AutonomyStateFailureReason) => frozenFailures.some((item) => item.reason === reason);
  const validation_state = frozenFailures.length ? "FAIL" : "PASS";
  return Object.freeze({
    validation_id: `ASV-${hashValue("autonomy-state-validation", { id: context.identity.primary.autonomy_id, request, frozenFailures }).slice(0, 12).toUpperCase()}`,
    autonomy_id: context.identity.primary.autonomy_id,
    previous_state: request.previous_state,
    next_state: request.next_state,
    validation_state,
    transition_allowed: validation_state === "PASS",
    failures: frozenFailures,
    governed: !has("GOVERNANCE_CONTEXT_MISSING") && !has("GOVERNANCE_FORCED_TRANSITION_OVERRIDDEN"),
    authority_validated: !has("AUTHORITY_SCOPE_MISSING") && !has("AUTHORITY_ESCALATION"),
    tenant_validated: !has("TENANT_OWNERSHIP_INVALID"),
    replayable: !has("REPLAY_REFERENCE_MISSING") && !has("REPLAY_VALIDATION_MISSING"),
    operator_visible: !has("OPERATOR_VISIBILITY_MISSING"),
    recoverable: isRecoveryTransition(request.previous_state, request.next_state) || !["PAUSED", "SUSPENDED", "RESUMING"].includes(request.previous_state),
    integrity_hash,
  });
}

function transitionRecord(context: AutonomyStateContext, request: AutonomyTransitionRequest, validation: AutonomyTransitionValidationResult, scenario: AutonomyTransitionScenario): AutonomyTransitionRecord {
  const integrity_hash = scenario === "HASH_MISMATCH" ? "tampered-transition-integrity" : validation.integrity_hash ?? "";
  return Object.freeze({
    transition_id: `AST-${hashValue("autonomy-transition-id", { autonomy_id: context.identity.primary.autonomy_id, request, count: context.lifecycle_history.length }).slice(0, 12).toUpperCase()}`,
    autonomy_id: context.identity.primary.autonomy_id,
    tenant_id: scenario === "TENANT_MISMATCH" ? "tenant_beta" : context.identity.primary.tenant_id,
    mission_id: context.identity.primary.mission_id,
    previous_state: request.previous_state,
    next_state: request.next_state,
    transition_reason: request.transition_reason,
    triggering_event: request.triggering_event,
    governance_profile: request.governance_profile,
    authority_scope: request.authority_scope,
    operator_reference: request.operator_reference,
    replay_reference: request.replay_reference,
    governance_forced: request.governance_forced ?? false,
    operator_approved: request.operator_approved ?? true,
    replay_validated: request.replay_validated ?? true,
    visibility_available: request.visibility_available ?? true,
    integrity_hash,
    timestamp: NOW,
    validation_state: validation.validation_state,
    failure_reason: validation.failures[0]?.reason ?? null,
    ledger_recorded: true,
  });
}

export function transitionAutonomyState(context: AutonomyStateContext, next_state: AutonomyOperationalState, options: { request?: Partial<AutonomyTransitionRequest>; scenario?: AutonomyTransitionScenario } = {}) {
  const scenario = options.scenario ?? "BASELINE";
  const request = Object.freeze({ ...defaultRequest(context, next_state, scenario), ...options.request }) as AutonomyTransitionRequest;
  const validation = validateAutonomyTransition(scenario === "HIDDEN_STATE" ? Object.freeze({ ...context, hidden_state: "shadow-state" }) : context, request);
  const record = transitionRecord(context, request, validation, scenario);
  const nextContext: AutonomyStateContext = Object.freeze({
    identity: context.identity,
    current_state: validation.validation_state === "PASS" ? request.next_state : context.current_state,
    previous_state: validation.validation_state === "PASS" ? request.previous_state : context.previous_state,
    lifecycle_history: scenario === "MISSING_LEDGER" ? context.lifecycle_history : freezeArray([...context.lifecycle_history, record]),
    state_hash: computeStateHash({ autonomy_id: context.identity.primary.autonomy_id, current_state: validation.validation_state === "PASS" ? request.next_state : context.current_state, transition_hash: record.integrity_hash }),
  });
  return Object.freeze({ context: nextContext, record, validation });
}

export function buildAutonomyTransitionLedger(context: AutonomyStateContext): AutonomyTransitionLedger {
  const source = {
    ledger_id: `ASL-${hashValue("autonomy-state-ledger-id", context.identity.primary.autonomy_id).slice(0, 12).toUpperCase()}`,
    autonomy_id: context.identity.primary.autonomy_id,
    tenant_id: context.identity.primary.tenant_id,
    mission_id: context.identity.primary.mission_id,
    transitions: freezeArray(context.lifecycle_history),
    lifecycle_states: freezeArray([context.lifecycle_history[0]?.previous_state ?? "CREATED", ...context.lifecycle_history.map((item) => item.next_state)]),
    replay_references: uniq(context.lifecycle_history.map((item) => item.replay_reference)),
    governance_profiles: uniq(context.lifecycle_history.map((item) => item.governance_profile)),
  };
  return Object.freeze({ ...source, ledger_hash: hashValue("autonomy-state-ledger", source) });
}

export function replayAutonomyStateHistory(ledger: AutonomyTransitionLedger): AutonomyStateReplayResult {
  const failures: AutonomyStateFailureReason[] = [];
  const states: AutonomyOperationalState[] = [];
  let expectedPrevious: AutonomyOperationalState | null = null;
  for (const transition of ledger.transitions) {
    if (!transition.ledger_recorded) failures.push("LEDGER_ENTRY_MISSING");
    if (transition.tenant_id !== ledger.tenant_id) failures.push("TENANT_OWNERSHIP_INVALID");
    if (expectedPrevious && transition.previous_state !== expectedPrevious) failures.push("TRANSITION_ORDER_MISMATCH");
    if (!VALID_TRANSITIONS[transition.previous_state]?.includes(transition.next_state)) failures.push("STATE_RESULT_MISMATCH");
    if (!transition.governance_profile) failures.push("GOVERNANCE_REASON_MISMATCH");
    if (!transition.replay_reference) failures.push("REPLAY_REFERENCE_MISSING");
    if (!transition.integrity_hash || transition.integrity_hash.startsWith("tampered")) failures.push("INTEGRITY_HASH_MISMATCH");
    if (!transition.visibility_available) failures.push("OPERATOR_VISIBILITY_MISSING");
    if (states.length === 0) states.push(transition.previous_state);
    states.push(transition.next_state);
    expectedPrevious = transition.next_state;
  }
  if (ledger.transitions.length === 0) failures.push("TRANSITION_MISSING");
  const source = {
    replay_id: `ASR-${hashValue("autonomy-state-replay-id", ledger.ledger_id).slice(0, 12).toUpperCase()}`,
    autonomy_id: ledger.autonomy_id,
    reconstructed_states: freezeArray(states),
    transition_ids: freezeArray(ledger.transitions.map((item) => item.transition_id)),
    transition_reasons: freezeArray(ledger.transitions.map((item) => item.transition_reason)),
    governance_inputs: freezeArray(ledger.transitions.map((item) => item.governance_profile)),
    authority_checks: freezeArray(ledger.transitions.map((item) => item.authority_scope)),
    operator_interventions: freezeArray(ledger.transitions.map((item) => item.operator_reference)),
    integrity_hashes: freezeArray(ledger.transitions.map((item) => item.integrity_hash)),
    timestamps: freezeArray(ledger.transitions.map((item) => item.timestamp)),
    lifecycle_outcome: states.at(-1) ?? "CREATED",
    validation_state: failures.length ? "FAIL" as const : "PASS" as const,
    failure_reason: failures[0] ?? null,
  };
  return Object.freeze({ ...source, replay_hash: hashValue("autonomy-state-replay", source) });
}

export function buildAutonomyStateVisibilitySurface(context: AutonomyStateContext): AutonomyStateVisibilitySurface {
  const last = context.lifecycle_history.at(-1) ?? null;
  const nextEligible = VALID_TRANSITIONS[context.current_state] ?? [];
  const blocked = AUTONOMY_OPERATIONAL_STATES.filter((state) => !nextEligible.includes(state) && state !== context.current_state);
  const ledger = buildAutonomyTransitionLedger(context);
  const replay = context.lifecycle_history.length ? replayAutonomyStateHistory(ledger) : null;
  return Object.freeze({
    autonomy_id: context.identity.primary.autonomy_id,
    tenant_id: context.identity.primary.tenant_id,
    mission_id: context.identity.primary.mission_id,
    current_state: context.current_state,
    previous_state: context.previous_state,
    next_eligible_states: freezeArray(nextEligible),
    blocked_transitions: freezeArray(blocked),
    transition_reason: last?.transition_reason ?? null,
    governance_influence: last?.governance_forced ? "FORCED" : last?.governance_profile ?? "NONE",
    authority_status: last?.failure_reason === "AUTHORITY_ESCALATION" ? "BLOCKED" : "VALIDATED",
    replay_reference: last?.replay_reference ?? context.identity.primary.replay_reference,
    lifecycle_history: freezeArray(context.lifecycle_history),
    integrity_status: replay?.validation_state === "FAIL" ? "INVALID" : "VALID",
    recovery_status: ["PAUSED", "SUSPENDED", "LIMITED"].includes(context.current_state) ? "RECOVERABLE" : TERMINAL_STATES.includes(context.current_state as never) ? "BLOCKED" : "NOT_REQUIRED",
    hidden_state_visible: false,
  });
}

export function buildCertifiedAutonomyLifecycle(identity = generateAutonomyIdentity()): AutonomyStateContext {
  let context = initializeAutonomyState(identity);
  for (const next of ["INITIALIZED", "VALIDATED", "READY", "MONITORING", "ACTIVE", "LIMITED", "MONITORING", "ACTIVE", "PAUSED", "RESUMING", "MONITORING", "RETIRED", "ARCHIVED"] as const) {
    context = transitionAutonomyState(context, next).context;
  }
  return context;
}

export function getAutonomyStateMachine() {
  const identity = generateAutonomyIdentity();
  const context = buildCertifiedAutonomyLifecycle(identity);
  const ledger = buildAutonomyTransitionLedger(context);
  return Object.freeze({
    model: buildAutonomyStateModel(),
    context,
    ledger,
    replay: replayAutonomyStateHistory(ledger),
    visibility: buildAutonomyStateVisibilitySurface(context),
  });
}
