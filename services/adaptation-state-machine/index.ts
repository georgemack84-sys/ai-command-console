import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { runLearningPermissionRegistry } from "@/services/learning-permission-registry";
import type { VisibilityRole } from "@/types/decision-observability-contract";
import type { LearningPermissionRegistryResult } from "@/types/learning-permission-registry";
import type {
  AdaptationLifecycleState,
  AdaptationStateCertificationReport,
  AdaptationStateCheck,
  AdaptationStateFailure,
  AdaptationStateLedgerRecord,
  AdaptationStateMachineFoundation,
  AdaptationStateMachineInput,
  AdaptationStateMachineResult,
  AdaptationStateRecord,
  AdaptationStateReplayModel,
  AdaptationStateValidation,
  AdaptationTransitionDecision,
  AdaptationTransitionRequest,
  AdaptationTransitionResult,
  AdaptationValidationState,
} from "@/types/adaptation-state-machine";

const STATE_MACHINE_VERSION = "adaptation-state-machine/v1" as const;

export const ADAPTATION_LIFECYCLE_STATES: readonly AdaptationLifecycleState[] = Object.freeze(["PROPOSED", "VALIDATED", "SIMULATED", "GOVERNANCE_REVIEW", "OPERATOR_REVIEW", "APPROVED", "CERTIFIED", "AVAILABLE", "REJECTED", "ROLLED_BACK"]);
export const ADAPTATION_STATE_CHECKS: readonly AdaptationStateCheck[] = Object.freeze(["PERMISSION_REGISTRY", "CURRENT_STATE", "TRANSITION_MATRIX", "GOVERNANCE_ORDER", "OPERATOR_ORDER", "CERTIFICATION_ORDER", "REPLAY", "ROLLBACK", "INTEGRITY", "LEDGER", "OBSERVABILITY", "ADVISORY_ONLY"]);

const ALLOWED_TRANSITIONS: Readonly<Record<AdaptationLifecycleState, readonly AdaptationLifecycleState[]>> = {
  PROPOSED: ["VALIDATED", "REJECTED"],
  VALIDATED: ["SIMULATED", "REJECTED"],
  SIMULATED: ["GOVERNANCE_REVIEW", "REJECTED"],
  GOVERNANCE_REVIEW: ["OPERATOR_REVIEW", "REJECTED"],
  OPERATOR_REVIEW: ["APPROVED", "REJECTED"],
  APPROVED: ["CERTIFIED", "ROLLED_BACK"],
  CERTIFIED: ["AVAILABLE", "ROLLED_BACK"],
  AVAILABLE: ["ROLLED_BACK"],
  REJECTED: [],
  ROLLED_BACK: [],
};

type Scenario = NonNullable<AdaptationStateMachineInput["scenario"]>;

function freezeArray<T>(values: readonly T[]): readonly T[] {
  return Object.freeze([...values]);
}

function hash(value: unknown): string {
  return generateDecisionIntegrityHash(value);
}

function hashWithoutIntegrity<T extends object>(value: T): string {
  const copy = { ...value } as Record<string, unknown>;
  delete copy.integrity_hash;
  return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown);
}

function state(pass: boolean): AdaptationValidationState {
  return pass ? "PASS" : "FAIL";
}

function ctx(source: LearningPermissionRegistryResult) {
  return {
    tenant_id: source.registry.tenant_id,
    mission_scope: source.request.mission_scope,
    replay_ref: source.replay_hash,
  };
}

function visibleToRole(source: LearningPermissionRegistryResult, role: VisibilityRole): boolean {
  return source.boundary_model.contract_foundation.final_certification.production_readiness.security_certification.observability_certification.ledger_certification.operator_workflow_certification.intelligence_certification.governance_certification.replay_certification.deterministic_certification.foundation_certification.certification_framework.analytics_result.operator_dashboard.replay_monitoring.governance_visibility.priority_dashboard.conflict_visualization.timeline_result.dashboard_result.observability_result.authorizations.some((auth) => auth.role === role && auth.permissions.includes("VIEW_DECISIONS"));
}

function defaultTransition(input: AdaptationStateMachineInput, scenario: Scenario): { from: AdaptationLifecycleState; to: AdaptationLifecycleState } {
  if (input.from_state && input.to_state) return { from: input.from_state, to: input.to_state };
  if (scenario === "SKIPPED_TRANSITION") return { from: "PROPOSED", to: "SIMULATED" };
  if (scenario === "REVERSED_TRANSITION") return { from: "SIMULATED", to: "VALIDATED" };
  if (scenario === "DUPLICATE_APPROVAL") return { from: "APPROVED", to: "APPROVED" };
  if (scenario === "CERTIFICATION_BEFORE_APPROVAL") return { from: "OPERATOR_REVIEW", to: "CERTIFIED" };
  if (scenario === "OPERATOR_BEFORE_GOVERNANCE") return { from: "SIMULATED", to: "OPERATOR_REVIEW" };
  if (scenario === "AVAILABLE_BEFORE_CERTIFICATION") return { from: "APPROVED", to: "AVAILABLE" };
  if (scenario === "UNAUTHORIZED_ROLLBACK" || scenario === "INVALID_ROLLBACK_TARGET") return { from: "VALIDATED", to: "ROLLED_BACK" };
  if (scenario === "SIMULATION_FAILURE") return { from: "SIMULATED", to: "REJECTED" };
  if (scenario === "VALIDATION_FAILURE") return { from: "VALIDATED", to: "REJECTED" };
  if (scenario === "GOVERNANCE_BYPASS") return { from: "SIMULATED", to: "OPERATOR_REVIEW" };
  if (scenario === "OPERATOR_BYPASS") return { from: "GOVERNANCE_REVIEW", to: "APPROVED" };
  if (scenario === "CERTIFICATION_BYPASS") return { from: "APPROVED", to: "AVAILABLE" };
  return { from: "PROPOSED", to: "VALIDATED" };
}

function buildStateRecord(source: LearningPermissionRegistryResult, transition: { from: AdaptationLifecycleState; to: AdaptationLifecycleState }, scenario: Scenario): AdaptationStateRecord {
  const c = ctx(source);
  const base: Omit<AdaptationStateRecord, "integrity_hash"> = {
    adaptation_id: "adaptation:recommendation-quality:001",
    proposal_id: "proposal:recommendation-quality:001",
    tenant_id: c.tenant_id,
    mission_scope: c.mission_scope,
    current_state: scenario === "HIDDEN_STATE" ? ("HIDDEN" as AdaptationLifecycleState) : transition.from,
    previous_state: "NONE",
    transition_reason: "Advance adaptive proposal through deterministic lifecycle.",
    transition_timestamp: "2026-07-05T10:00:40.000Z",
    transition_initiator: scenario === "UNAUTHORIZED_APPROVAL" ? "unauthorized-actor" : "adaptive-lifecycle-controller",
    governance_required: true,
    governance_status: transition.from === "GOVERNANCE_REVIEW" || transition.to === "OPERATOR_REVIEW" || transition.to === "APPROVED" || transition.to === "CERTIFIED" || transition.to === "AVAILABLE" ? "APPROVED" : "PENDING",
    operator_review_required: transition.to === "APPROVED" || transition.to === "CERTIFIED" || transition.to === "AVAILABLE",
    operator_review_status: transition.from === "OPERATOR_REVIEW" || transition.to === "APPROVED" || transition.to === "CERTIFIED" || transition.to === "AVAILABLE" ? "APPROVED" : "PENDING",
    certification_required: transition.to === "CERTIFIED" || transition.to === "AVAILABLE",
    certification_status: transition.from === "CERTIFIED" || transition.to === "AVAILABLE" ? "CERTIFIED" : "PENDING",
    replay_reference: scenario === "REPLAY_OMISSION" ? "" : c.replay_ref,
    rollback_available: transition.from === "APPROVED" || transition.from === "CERTIFIED" || transition.from === "AVAILABLE",
  };
  const built = Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
  if (scenario === "HASH_MISMATCH" || scenario === "STATE_FORGERY") return Object.freeze({ ...built, integrity_hash: hash({ tampered: built.adaptation_id }) });
  return built;
}

function buildRequest(source: LearningPermissionRegistryResult, record: AdaptationStateRecord, transition: { from: AdaptationLifecycleState; to: AdaptationLifecycleState }, scenario: Scenario): AdaptationTransitionRequest {
  const c = ctx(source);
  return Object.freeze({
    request_id: "adaptation_transition_request",
    adaptation_id: record.adaptation_id,
    proposal_id: record.proposal_id,
    tenant_id: c.tenant_id,
    mission_scope: c.mission_scope,
    from_state: transition.from,
    to_state: transition.to,
    transition_reason: scenario === "INVALID_ROLLBACK_TARGET" ? "" : record.transition_reason,
    transition_initiator: record.transition_initiator,
    governance_refs: scenario === "GOVERNANCE_BYPASS" ? freezeArray([]) : source.decision.governance_refs,
    operator_refs: scenario === "OPERATOR_BYPASS" ? freezeArray([]) : freezeArray(["operator:adaptive-state-review"]),
    replay_refs: scenario === "REPLAY_OMISSION" ? freezeArray([]) : source.decision.replay_refs,
    certification_refs: scenario === "CERTIFICATION_BYPASS" ? freezeArray([]) : source.decision.certification_refs,
    rollback_refs: scenario === "UNAUTHORIZED_ROLLBACK" || scenario === "INVALID_ROLLBACK_TARGET" ? freezeArray([]) : source.decision.rollback_refs,
  });
}

function isTransitionAllowed(from: AdaptationLifecycleState, to: AdaptationLifecycleState): boolean {
  return Boolean(ALLOWED_TRANSITIONS[from]?.includes(to));
}

function buildTransitionResult(request: AdaptationTransitionRequest, scenario: Scenario): AdaptationTransitionResult {
  const allowed = isTransitionAllowed(request.from_state, request.to_state);
  const validation_result: AdaptationTransitionDecision = scenario === "FAIL_OPEN" ? "ALLOW" : allowed ? "ALLOW" : "REJECT";
  const base: Omit<AdaptationTransitionResult, "integrity_hash"> = {
    transition_result_id: "adaptation_transition_result",
    adaptation_id: request.adaptation_id,
    proposal_id: request.proposal_id,
    previous_state: request.from_state,
    current_state: request.to_state,
    validation_result,
    transition_allowed: validation_result === "ALLOW",
    governance_refs: request.governance_refs,
    operator_refs: request.operator_refs,
    replay_refs: request.replay_refs,
    certification_refs: request.certification_refs,
    rollback_refs: request.rollback_refs,
    reason: validation_result === "ALLOW" ? "Transition is permitted by the canonical adaptation lifecycle." : "Transition rejected by the canonical adaptation lifecycle.",
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildReplay(request: AdaptationTransitionRequest, result: AdaptationTransitionResult, scenario: Scenario): AdaptationStateReplayModel {
  const base: Omit<AdaptationStateReplayModel, "integrity_hash"> = {
    replay_model_id: "adaptation_state_replay_model",
    adaptation_id: request.adaptation_id,
    previous_state: request.from_state,
    new_state: request.to_state,
    transition_reason: request.transition_reason,
    initiating_actor: request.transition_initiator,
    validation_evidence: freezeArray([result.transition_result_id]),
    governance_refs: request.governance_refs,
    replay_refs: request.replay_refs,
    deterministic_reconstruction: scenario !== "REPLAY_OMISSION" && scenario !== "LIFECYCLE_TAMPERING",
    integrity_reproducible: scenario !== "HASH_MISMATCH" && scenario !== "LIFECYCLE_TAMPERING",
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function collectFailures(input: {
  permission: LearningPermissionRegistryResult;
  record: AdaptationStateRecord;
  request: AdaptationTransitionRequest;
  result: AdaptationTransitionResult;
  replay: AdaptationStateReplayModel;
  ledger: readonly AdaptationStateLedgerRecord[];
  role: VisibilityRole;
  scenario: Scenario;
}): readonly AdaptationStateFailure[] {
  const failures: AdaptationStateFailure[] = [];
  if (input.permission.validation.validation_status !== "VALID" || !input.permission.permits_learning) failures.push("LEARNING_PERMISSION_INVALID");
  if (!ADAPTATION_LIFECYCLE_STATES.includes(input.record.current_state)) failures.push("HIDDEN_LIFECYCLE_STATE");
  if (!isTransitionAllowed(input.request.from_state, input.request.to_state)) {
    if (input.scenario === "SKIPPED_TRANSITION") failures.push("SKIPPED_TRANSITION");
    if (input.scenario === "REVERSED_TRANSITION") failures.push("REVERSED_TRANSITION");
    if (input.scenario === "DUPLICATE_APPROVAL") failures.push("DUPLICATE_APPROVAL");
    if (input.scenario === "CERTIFICATION_BEFORE_APPROVAL") failures.push("CERTIFICATION_BEFORE_APPROVAL");
    if (input.scenario === "OPERATOR_BEFORE_GOVERNANCE") failures.push("OPERATOR_REVIEW_BEFORE_GOVERNANCE");
    if (input.scenario === "AVAILABLE_BEFORE_CERTIFICATION") failures.push("AVAILABILITY_BEFORE_CERTIFICATION");
  }
  if (!input.request.replay_refs.length || !input.replay.deterministic_reconstruction) failures.push("REPLAY_OMISSION");
  if (!input.request.governance_refs.length || input.scenario === "GOVERNANCE_BYPASS") failures.push("GOVERNANCE_BYPASS");
  if ((input.request.to_state === "APPROVED" || input.request.to_state === "CERTIFIED" || input.request.to_state === "AVAILABLE") && !input.request.operator_refs.length) failures.push("OPERATOR_BYPASS");
  if ((input.request.to_state === "CERTIFIED" || input.request.to_state === "AVAILABLE") && !input.request.certification_refs.length) failures.push("CERTIFICATION_BYPASS");
  if (input.scenario === "UNAUTHORIZED_APPROVAL") failures.push("UNAUTHORIZED_APPROVAL");
  if (input.request.to_state === "ROLLED_BACK" && !["APPROVED", "CERTIFIED", "AVAILABLE"].includes(input.request.from_state)) failures.push("UNAUTHORIZED_ROLLBACK");
  if (input.scenario === "INVALID_ROLLBACK_TARGET") failures.push("INVALID_ROLLBACK_TARGET");
  if (input.scenario === "SIMULATION_FAILURE") failures.push("SIMULATION_FAILURE");
  if (input.scenario === "VALIDATION_FAILURE") failures.push("VALIDATION_FAILURE");
  if (input.scenario === "STATE_FORGERY") failures.push("STATE_FORGERY");
  if (input.scenario === "LIFECYCLE_TAMPERING") failures.push("LIFECYCLE_TAMPERING");
  if (
    hashWithoutIntegrity(input.record) !== input.record.integrity_hash
    || hashWithoutIntegrity(input.result) !== input.result.integrity_hash
    || hashWithoutIntegrity(input.replay) !== input.replay.integrity_hash
    || input.ledger.some((entry) => hashWithoutIntegrity(entry) !== entry.integrity_hash)
  ) failures.push("INTEGRITY_HASH_MISMATCH");
  if (input.ledger.some((entry) => !entry.append_only || entry.deleted) || (input.result.validation_result === "ALLOW" && !isTransitionAllowed(input.request.from_state, input.request.to_state))) failures.push("FAIL_OPEN_STATE_BEHAVIOR");
  if (!visibleToRole(input.permission, input.role)) failures.push("AUTHORIZATION_FAILURE");
  if (input.scenario === "EXECUTION_AUTHORITY") failures.push("EXECUTION_AUTHORITY_GRANTED");
  return freezeArray([...new Set(failures)]);
}

function buildReport(tenantId: string, replay: AdaptationStateReplayModel, failures: readonly AdaptationStateFailure[]): AdaptationStateCertificationReport {
  const has = (failure: AdaptationStateFailure) => failures.includes(failure);
  const base: Omit<AdaptationStateCertificationReport, "integrity_hash"> = {
    report_id: "adaptation_state_machine_certification_report",
    tenant_id: tenantId,
    checks: ADAPTATION_STATE_CHECKS,
    transition_matrix_valid: !has("SKIPPED_TRANSITION") && !has("REVERSED_TRANSITION") && !has("DUPLICATE_APPROVAL"),
    no_hidden_states: !has("HIDDEN_LIFECYCLE_STATE"),
    no_skipped_transitions: !has("SKIPPED_TRANSITION"),
    governance_order_valid: !has("GOVERNANCE_BYPASS") && !has("OPERATOR_REVIEW_BEFORE_GOVERNANCE"),
    operator_order_valid: !has("OPERATOR_BYPASS"),
    certification_order_valid: !has("CERTIFICATION_BEFORE_APPROVAL") && !has("AVAILABILITY_BEFORE_CERTIFICATION") && !has("CERTIFICATION_BYPASS"),
    rollback_valid: !has("UNAUTHORIZED_ROLLBACK") && !has("INVALID_ROLLBACK_TARGET"),
    replay_verified: replay.deterministic_reconstruction && !has("REPLAY_OMISSION"),
    ledger_immutable: !has("FAIL_OPEN_STATE_BEHAVIOR"),
    observability_complete: !has("HIDDEN_LIFECYCLE_STATE"),
    advisory_only_preserved: !has("EXECUTION_AUTHORITY_GRANTED"),
    integrity_verified: !has("INTEGRITY_HASH_MISMATCH") && !has("STATE_FORGERY") && !has("LIFECYCLE_TAMPERING"),
    failure_analysis: failures,
    certification_decision: failures.length ? "FAIL" : "PASS",
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildLedger(request: AdaptationTransitionRequest, result: AdaptationTransitionResult, scenario: Scenario): readonly AdaptationStateLedgerRecord[] {
  const event: Omit<AdaptationStateLedgerRecord, "integrity_hash"> = {
    record_id: "adaptation_state_ledger_001",
    adaptation_id: request.adaptation_id,
    proposal_id: request.proposal_id,
    previous_state: request.from_state,
    current_state: request.to_state,
    transition_reason: request.transition_reason,
    validation_result: result.validation_result,
    governance_refs: request.governance_refs,
    operator_refs: request.operator_refs,
    replay_refs: request.replay_refs,
    certification_refs: request.certification_refs,
    event_timestamp: "2026-07-05T10:00:41.000Z",
    sequence_number: 1,
    append_only: (scenario === "FAIL_OPEN" ? false : true) as true,
    deleted: false,
  };
  return freezeArray([Object.freeze({ ...event, integrity_hash: hashWithoutIntegrity(event) })]);
}

function buildValidation(failures: readonly AdaptationStateFailure[]): AdaptationStateValidation {
  const has = (failure: AdaptationStateFailure) => failures.includes(failure);
  const base: Omit<AdaptationStateValidation, "integrity_hash"> = {
    validation_id: "adaptation_state_machine_validation",
    validation_status: failures.length ? "BLOCKED" : "VALID",
    learning_permission_valid: !has("LEARNING_PERMISSION_INVALID"),
    current_state_valid: !has("HIDDEN_LIFECYCLE_STATE") && !has("STATE_FORGERY"),
    transition_allowed: !has("SKIPPED_TRANSITION") && !has("REVERSED_TRANSITION") && !has("DUPLICATE_APPROVAL") && !has("CERTIFICATION_BEFORE_APPROVAL") && !has("OPERATOR_REVIEW_BEFORE_GOVERNANCE") && !has("AVAILABILITY_BEFORE_CERTIFICATION"),
    governance_order_valid: !has("GOVERNANCE_BYPASS"),
    operator_order_valid: !has("OPERATOR_BYPASS"),
    certification_order_valid: !has("CERTIFICATION_BYPASS"),
    replay_present: !has("REPLAY_OMISSION"),
    rollback_valid: !has("UNAUTHORIZED_ROLLBACK") && !has("INVALID_ROLLBACK_TARGET"),
    ledger_immutable: !has("FAIL_OPEN_STATE_BEHAVIOR"),
    no_hidden_states: !has("HIDDEN_LIFECYCLE_STATE"),
    integrity_verified: !has("INTEGRITY_HASH_MISMATCH") && !has("LIFECYCLE_TAMPERING"),
    advisory_only: !has("EXECUTION_AUTHORITY_GRANTED"),
    authorization_valid: !has("AUTHORIZATION_FAILURE"),
    execution_authority_absent: !has("EXECUTION_AUTHORITY_GRANTED"),
    failures,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function resultReplayHash(result: Omit<AdaptationStateMachineResult, "integrity_hash" | "replay_hash">): string {
  return hash({
    state: result.state_record,
    request: result.transition_request,
    transition: result.transition_result,
    replay: result.replay_model,
    report: result.certification_report,
    ledger: result.state_ledger,
    validation: result.validation,
  });
}

export function runAdaptationStateMachine(input: AdaptationStateMachineInput = {}): AdaptationStateMachineResult {
  const scenario = input.scenario ?? "BASELINE";
  const role = input.role ?? "OPERATOR";
  const learning_permission = input.learning_permission ?? runLearningPermissionRegistry({ scenario: scenario === "PERMISSION_INVALID" ? "MISSING_PERMISSION" : "BASELINE" });
  const transition = defaultTransition(input, scenario);
  const state_record = buildStateRecord(learning_permission, transition, scenario);
  const transition_request = buildRequest(learning_permission, state_record, transition, scenario);
  const transition_result = buildTransitionResult(transition_request, scenario);
  const replay_model = buildReplay(transition_request, transition_result, scenario);
  const preFailures = collectFailures({ permission: learning_permission, record: state_record, request: transition_request, result: transition_result, replay: replay_model, ledger: [], role, scenario });
  const state_ledger = buildLedger(transition_request, transition_result, scenario);
  const failures = collectFailures({ permission: learning_permission, record: state_record, request: transition_request, result: transition_result, replay: replay_model, ledger: state_ledger, role, scenario });
  const certification_report = buildReport(state_record.tenant_id, replay_model, failures.length === preFailures.length ? failures : failures);
  const validation = buildValidation(failures);
  const base: Omit<AdaptationStateMachineResult, "integrity_hash" | "replay_hash"> = {
    state_machine_version: STATE_MACHINE_VERSION,
    learning_permission,
    state_record,
    transition_request,
    transition_result,
    replay_model,
    certification_report,
    state_ledger,
    validation,
    deterministic: true,
    replayable: true,
    advisory_only: true,
    proposal_available: transition_result.current_state === "AVAILABLE" && failures.length === 0,
    permits_execution: false,
    mutates_adaptive_behavior: false,
    execution_authority_granted: false,
  };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: hashWithoutIntegrity({ ...base, replay_hash }) });
}

export function replayAdaptationStateMachine(result: AdaptationStateMachineResult): boolean {
  return resultReplayHash(result) === result.replay_hash && hashWithoutIntegrity(result) === result.integrity_hash;
}

export function computeAdaptationStateHash(record: Omit<AdaptationStateRecord, "integrity_hash"> | AdaptationStateRecord): string {
  return hashWithoutIntegrity(record);
}

export function getAdaptationStateMachineFoundation(): AdaptationStateMachineFoundation {
  return Object.freeze({
    state_machine_version: STATE_MACHINE_VERSION,
    checks: ADAPTATION_STATE_CHECKS,
    states: ADAPTATION_LIFECYCLE_STATES,
    result: runAdaptationStateMachine(),
  });
}

export const AdaptationStateMachine = Object.freeze({
  run: runAdaptationStateMachine,
  replay: replayAdaptationStateMachine,
});
