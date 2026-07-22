import crypto from "crypto";
import { classifyDecision } from "@/services/decision-classification";
import type { DecisionClassificationResult } from "@/types/decision-classification";
import type {
  DecisionFailureState,
  DecisionLifecycleAnyState,
  DecisionLifecycleFailure,
  DecisionLifecycleObservability,
  DecisionLifecycleRecord,
  DecisionLifecycleRepository,
  DecisionLifecycleReplayResult,
  DecisionLifecycleState,
  DecisionLifecycleTransitionInput,
  DecisionLifecycleValidationResult,
} from "@/types/decision-lifecycle";

const NOW = "2026-07-02T09:14:00.000Z";
const TERMINAL_STATES = Object.freeze(["COMPLETED", "REJECTED", "ARCHIVED"] as const);
const FAILURE_STATES = Object.freeze(["VALIDATION_FAILED", "GOVERNANCE_FAILED", "CONSTITUTION_FAILED", "AUTHORITY_FAILED", "REPLAY_FAILED", "INTEGRITY_FAILED", "TENANT_ISOLATION_FAILED", "SERIALIZATION_FAILED", "UNKNOWN_STATE"] as const);
const LIFECYCLE_STATES = Object.freeze(["CREATED", "VALIDATING", "INPUT_ACCEPTED", "EVIDENCE_READY", "GOVERNANCE_REVIEW", "CONSTITUTION_REVIEW", "AUTHORITY_VALIDATION", "READY_FOR_ORCHESTRATION", "ORCHESTRATED", "OPERATOR_VISIBLE", "PENDING_DECISION", "APPROVED", "REJECTED", "DEFERRED", "AWAITING_INPUT", "COMPLETED", "ARCHIVED"] as const);

export const DECISION_LIFECYCLE_TRANSITIONS: Readonly<Record<DecisionLifecycleState, readonly DecisionLifecycleState[]>> = Object.freeze({
  CREATED: Object.freeze(["VALIDATING"] as const),
  VALIDATING: Object.freeze(["INPUT_ACCEPTED"] as const),
  INPUT_ACCEPTED: Object.freeze(["EVIDENCE_READY"] as const),
  EVIDENCE_READY: Object.freeze(["GOVERNANCE_REVIEW"] as const),
  GOVERNANCE_REVIEW: Object.freeze(["CONSTITUTION_REVIEW"] as const),
  CONSTITUTION_REVIEW: Object.freeze(["AUTHORITY_VALIDATION"] as const),
  AUTHORITY_VALIDATION: Object.freeze(["READY_FOR_ORCHESTRATION"] as const),
  READY_FOR_ORCHESTRATION: Object.freeze(["ORCHESTRATED"] as const),
  ORCHESTRATED: Object.freeze(["OPERATOR_VISIBLE"] as const),
  OPERATOR_VISIBLE: Object.freeze(["PENDING_DECISION"] as const),
  PENDING_DECISION: Object.freeze(["APPROVED", "REJECTED", "DEFERRED"] as const),
  APPROVED: Object.freeze(["COMPLETED"] as const),
  REJECTED: Object.freeze(["ARCHIVED"] as const),
  DEFERRED: Object.freeze(["AWAITING_INPUT"] as const),
  AWAITING_INPUT: Object.freeze(["VALIDATING"] as const),
  COMPLETED: Object.freeze(["ARCHIVED"] as const),
  ARCHIVED: Object.freeze([] as const),
});

function canonicalize(value: unknown): string {
  if (value === null) return "null";
  if (Array.isArray(value)) return `[${value.map((item) => canonicalize(item)).join(",")}]`;
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record).sort().filter((key) => record[key] !== undefined).map((key) => `${JSON.stringify(key)}:${canonicalize(record[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function hashValue(value: unknown): string {
  return crypto.createHash("sha256").update(canonicalize(value), "utf8").digest("hex");
}

function withoutHash<T extends Record<string, unknown>>(value: T): Record<string, unknown> {
  const copy = { ...value };
  delete copy.integrity_hash;
  return copy;
}

function recordHash(record: Omit<DecisionLifecycleRecord, "integrity_hash"> | DecisionLifecycleRecord): string {
  return hashValue(withoutHash(record as Record<string, unknown>));
}

function repositoryHash(repository: Omit<DecisionLifecycleRepository, "integrity_hash"> | DecisionLifecycleRepository): string {
  return hashValue(withoutHash(repository as Record<string, unknown>));
}

function makeRecord(input: {
  lifecycle_id: string;
  orchestration_id: string;
  previous_state: DecisionLifecycleAnyState | null;
  current_state: DecisionLifecycleAnyState;
  transition_reason: string;
  transition_timestamp?: string;
  actor_type?: DecisionLifecycleRecord["actor_type"];
  actor_id?: string;
  governance_status?: "PASSED" | "FAILED";
  constitutional_status?: "PASSED" | "FAILED";
  authority_status?: "PASSED" | "FAILED";
  replay_reference?: string;
  tenant_id: string;
  mission_id: string;
  execution_authorized?: boolean;
}): DecisionLifecycleRecord {
  const base: Omit<DecisionLifecycleRecord, "integrity_hash"> = {
    lifecycle_id: input.lifecycle_id,
    orchestration_id: input.orchestration_id,
    previous_state: input.previous_state,
    current_state: input.current_state,
    transition_reason: input.transition_reason,
    transition_timestamp: input.transition_timestamp ?? NOW,
    actor_type: input.actor_type ?? "SYSTEM",
    actor_id: input.actor_id,
    governance_status: input.governance_status ?? "PASSED",
    constitutional_status: input.constitutional_status ?? "PASSED",
    authority_status: input.authority_status ?? "PASSED",
    replay_reference: input.replay_reference ?? `replay_${input.orchestration_id}_${input.current_state}`,
    tenant_id: input.tenant_id,
    mission_id: input.mission_id,
    append_only: true,
    advisory_only: true,
    execution_authorized: (input.execution_authorized ?? false) as false,
  };
  return Object.freeze({ ...base, integrity_hash: recordHash(base) });
}

function failureStateFor(failures: readonly DecisionLifecycleFailure[]): DecisionFailureState {
  if (failures.includes("GOVERNANCE_BYPASS")) return "GOVERNANCE_FAILED";
  if (failures.includes("CONSTITUTIONAL_BYPASS")) return "CONSTITUTION_FAILED";
  if (failures.includes("AUTHORITY_ESCALATION") || failures.includes("ADVISORY_ONLY_VIOLATION")) return "AUTHORITY_FAILED";
  if (failures.includes("REPLAY_REFERENCE_MISSING") || failures.includes("REPLAY_MISMATCH")) return "REPLAY_FAILED";
  if (failures.includes("INTEGRITY_HASH_MISMATCH")) return "INTEGRITY_FAILED";
  if (failures.includes("TENANT_ISOLATION_VIOLATION")) return "TENANT_ISOLATION_FAILED";
  if (failures.includes("SERIALIZATION_NONDETERMINISTIC")) return "SERIALIZATION_FAILED";
  if (failures.includes("INVALID_STATE")) return "UNKNOWN_STATE";
  return "VALIDATION_FAILED";
}

function isLifecycleState(state: DecisionLifecycleAnyState): state is DecisionLifecycleState {
  return LIFECYCLE_STATES.includes(state as DecisionLifecycleState);
}

function isTerminal(state: DecisionLifecycleAnyState): boolean {
  return TERMINAL_STATES.includes(state as never) || FAILURE_STATES.includes(state as never);
}

function allowedTransition(from: DecisionLifecycleAnyState, to: DecisionLifecycleState): boolean {
  return isLifecycleState(from) && DECISION_LIFECYCLE_TRANSITIONS[from].includes(to);
}

export function createDecisionLifecycle(classification: DecisionClassificationResult = classifyDecision()): DecisionLifecycleRepository {
  const lifecycle_id = `DLC-9-1-4-${classification.orchestration_id}`;
  const initial = makeRecord({
    lifecycle_id,
    orchestration_id: classification.orchestration_id,
    previous_state: null,
    current_state: "CREATED",
    transition_reason: "Decision lifecycle initialized.",
    tenant_id: classification.tenant_id,
    mission_id: classification.mission_id,
  });
  const base: Omit<DecisionLifecycleRepository, "integrity_hash"> = {
    lifecycle_id,
    orchestration_id: classification.orchestration_id,
    tenant_id: classification.tenant_id,
    mission_id: classification.mission_id,
    classification,
    current_state: "CREATED",
    history: Object.freeze([initial]),
    failures: Object.freeze([]),
    terminal: false,
    archived: false,
    advisory_only: true,
    execution_authorized: false,
  };
  return Object.freeze({ ...base, integrity_hash: repositoryHash(base) });
}

export function validateStateTransition(input: DecisionLifecycleTransitionInput): DecisionLifecycleValidationResult {
  const lifecycle = input.lifecycle;
  const failures: DecisionLifecycleFailure[] = [];
  if (!isLifecycleState(lifecycle.current_state)) failures.push("INVALID_STATE");
  if (lifecycle.current_state === "ARCHIVED") failures.push("ARCHIVED_STATE_IMMUTABLE");
  if (isTerminal(lifecycle.current_state) && lifecycle.current_state !== "COMPLETED" && lifecycle.current_state !== "REJECTED") failures.push("TERMINAL_STATE_IMMUTABLE");
  if (!allowedTransition(lifecycle.current_state, input.next_state)) failures.push("INVALID_TRANSITION");
  if ((input.governance_status ?? "PASSED") !== "PASSED") failures.push("GOVERNANCE_BYPASS");
  if ((input.constitutional_status ?? "PASSED") !== "PASSED") failures.push("CONSTITUTIONAL_BYPASS");
  if ((input.authority_status ?? "PASSED") !== "PASSED" || input.execution_authorized === true) failures.push("AUTHORITY_ESCALATION");
  if (!input.replay_reference && input.next_state !== "VALIDATING") failures.push("REPLAY_REFERENCE_MISSING");
  if (input.tenant_id && input.tenant_id !== lifecycle.tenant_id) failures.push("TENANT_ISOLATION_VIOLATION");
  if (!lifecycle.advisory_only || lifecycle.execution_authorized) failures.push("ADVISORY_ONLY_VIOLATION");
  if (repositoryHash(lifecycle) !== lifecycle.integrity_hash) failures.push("INTEGRITY_HASH_MISMATCH");
  return validationResult(lifecycle, failures, failures.length === 0);
}

export function transitionDecisionState(input: DecisionLifecycleTransitionInput): DecisionLifecycleRepository {
  const validation = validateStateTransition(input);
  const lifecycle = input.lifecycle;
  const failures = Object.freeze([...new Set([...lifecycle.failures, ...validation.failures])]);
  const nextState: DecisionLifecycleAnyState = validation.validation_status === "VALID" ? input.next_state : failureStateFor(validation.failures);
  const transitionRecord = makeRecord({
    lifecycle_id: lifecycle.lifecycle_id,
    orchestration_id: lifecycle.orchestration_id,
    previous_state: lifecycle.current_state,
    current_state: nextState,
    transition_reason: input.transition_reason ?? (validation.validation_status === "VALID" ? `Transitioned to ${input.next_state}.` : `Failed closed during transition to ${input.next_state}.`),
    transition_timestamp: input.transition_timestamp,
    actor_type: input.actor_type,
    actor_id: input.actor_id,
    governance_status: input.governance_status,
    constitutional_status: input.constitutional_status,
    authority_status: input.execution_authorized ? "FAILED" : input.authority_status,
    replay_reference: input.replay_reference,
    tenant_id: input.tenant_id ?? lifecycle.tenant_id,
    mission_id: lifecycle.mission_id,
    execution_authorized: input.execution_authorized,
  });
  const history = Object.freeze([...lifecycle.history, transitionRecord]);
  const base: Omit<DecisionLifecycleRepository, "integrity_hash"> = {
    ...lifecycle,
    current_state: nextState,
    history,
    failures,
    terminal: isTerminal(nextState),
    archived: nextState === "ARCHIVED",
  };
  return Object.freeze({ ...base, integrity_hash: repositoryHash(base) });
}

export function validateLifecycleState(lifecycle: DecisionLifecycleRepository): DecisionLifecycleValidationResult {
  const failures: DecisionLifecycleFailure[] = [];
  if (!isLifecycleState(lifecycle.current_state) && !FAILURE_STATES.includes(lifecycle.current_state as DecisionFailureState)) failures.push("INVALID_STATE");
  if (!lifecycle.history.every((record, index) => index === 0 || lifecycle.history[index - 1]?.current_state === record.previous_state)) failures.push("REPLAY_MISMATCH");
  if (!lifecycle.history.every((record) => record.append_only && recordHash(record) === record.integrity_hash)) failures.push("INTEGRITY_HASH_MISMATCH");
  if (!lifecycle.history.every((record) => record.tenant_id === lifecycle.tenant_id)) failures.push("TENANT_ISOLATION_VIOLATION");
  if (!lifecycle.advisory_only || lifecycle.execution_authorized || lifecycle.history.some((record) => !record.advisory_only || record.execution_authorized)) failures.push("ADVISORY_ONLY_VIOLATION");
  if (repositoryHash(lifecycle) !== lifecycle.integrity_hash) failures.push("INTEGRITY_HASH_MISMATCH");
  return validationResult(lifecycle, Object.freeze([...new Set([...lifecycle.failures, ...failures])]), true);
}

function validationResult(lifecycle: DecisionLifecycleRepository, failures: readonly DecisionLifecycleFailure[], transitionAllowed: boolean): DecisionLifecycleValidationResult {
  const has = (failure: DecisionLifecycleFailure) => failures.includes(failure);
  return Object.freeze({
    validation_status: failures.length ? "FAILED_CLOSED" : "VALID",
    lifecycle_id: lifecycle.lifecycle_id,
    current_state: lifecycle.current_state,
    failures,
    checks: Object.freeze({
      state_known: !has("INVALID_STATE"),
      transition_allowed: transitionAllowed && !has("INVALID_TRANSITION"),
      terminal_immutable: !has("TERMINAL_STATE_IMMUTABLE") && !has("ARCHIVED_STATE_IMMUTABLE"),
      governance_valid: !has("GOVERNANCE_BYPASS"),
      constitutional_valid: !has("CONSTITUTIONAL_BYPASS"),
      authority_valid: !has("AUTHORITY_ESCALATION"),
      replay_valid: !has("REPLAY_REFERENCE_MISSING") && !has("REPLAY_MISMATCH"),
      integrity_valid: !has("INTEGRITY_HASH_MISMATCH"),
      tenant_isolated: !has("TENANT_ISOLATION_VIOLATION"),
      advisory_only_enforced: !has("ADVISORY_ONLY_VIOLATION"),
      append_only_history: !has("REPLAY_MISMATCH"),
    }),
  });
}

export function replayDecisionLifecycle(lifecycle: DecisionLifecycleRepository): DecisionLifecycleReplayResult {
  const state_sequence = Object.freeze(lifecycle.history.map((record) => record.current_state));
  const reconstructed_hash = repositoryHash({ ...lifecycle, integrity_hash: undefined });
  const expected_hash = lifecycle.integrity_hash;
  const failures = reconstructed_hash === expected_hash ? Object.freeze([]) : Object.freeze(["REPLAY_MISMATCH"] as const);
  return Object.freeze({ lifecycle_id: lifecycle.lifecycle_id, replay_valid: failures.length === 0, state_sequence, reconstructed_hash, expected_hash, failures });
}

export function buildDecisionLifecycleObservability(lifecycles: readonly DecisionLifecycleRepository[]): DecisionLifecycleObservability {
  const states = lifecycles.reduce<Record<string, number>>((counts, lifecycle) => {
    counts[lifecycle.current_state] = (counts[lifecycle.current_state] ?? 0) + 1;
    return counts;
  }, {});
  const failures = lifecycles.flatMap((lifecycle) => lifecycle.failures);
  return Object.freeze({
    active_lifecycle_states: Object.freeze(states),
    transition_count: lifecycles.reduce((count, lifecycle) => count + Math.max(0, lifecycle.history.length - 1), 0),
    transition_failures: lifecycles.filter((lifecycle) => lifecycle.failures.length > 0).length,
    invalid_transition_attempts: failures.filter((failure) => failure === "INVALID_TRANSITION").length,
    average_state_duration_ms: 0,
    replay_mismatches: failures.filter((failure) => failure === "REPLAY_MISMATCH").length,
    lifecycle_completion_rate: lifecycles.length === 0 ? 0 : lifecycles.filter((lifecycle) => lifecycle.current_state === "COMPLETED" || lifecycle.current_state === "ARCHIVED").length / lifecycles.length,
    failure_state_frequency: Object.freeze(lifecycles.reduce<Record<string, number>>((counts, lifecycle) => {
      if (FAILURE_STATES.includes(lifecycle.current_state as DecisionFailureState)) counts[lifecycle.current_state] = (counts[lifecycle.current_state] ?? 0) + 1;
      return counts;
    }, {})),
    deferred_decision_count: lifecycles.filter((lifecycle) => lifecycle.current_state === "DEFERRED" || lifecycle.history.some((record) => record.current_state === "DEFERRED")).length,
    archived_decision_count: lifecycles.filter((lifecycle) => lifecycle.archived).length,
  });
}

export function getDecisionLifecycleModel() {
  const lifecycle = createDecisionLifecycle();
  return Object.freeze({
    states: LIFECYCLE_STATES,
    failure_states: FAILURE_STATES,
    terminal_states: TERMINAL_STATES,
    transitions: DECISION_LIFECYCLE_TRANSITIONS,
    lifecycle,
    validation: validateLifecycleState(lifecycle),
    replay: replayDecisionLifecycle(lifecycle),
    observability: buildDecisionLifecycleObservability([lifecycle]),
  });
}
