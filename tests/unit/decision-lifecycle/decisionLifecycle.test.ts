import { describe, expect, it } from "vitest";
import {
  DECISION_LIFECYCLE_TRANSITIONS,
  buildDecisionLifecycleObservability,
  createDecisionLifecycle,
  getDecisionLifecycleModel,
  replayDecisionLifecycle,
  transitionDecisionState,
  validateLifecycleState,
  validateStateTransition,
} from "@/services/decision-lifecycle";
import type { DecisionLifecycleRepository, DecisionLifecycleState } from "@/types/decision-lifecycle";

function advance(lifecycle: DecisionLifecycleRepository, next_state: DecisionLifecycleState): DecisionLifecycleRepository {
  return transitionDecisionState({
    lifecycle,
    next_state,
    replay_reference: `replay_${lifecycle.orchestration_id}_${next_state}`,
  });
}

describe("Mission Control Phase 9.1.4 Decision Lifecycle Model", () => {
  it("publishes the canonical lifecycle state machine, failure states, terminal states, and baseline lifecycle", () => {
    const model = getDecisionLifecycleModel();

    expect(model.states).toContain("INPUT_ACCEPTED");
    expect(model.states).toContain("PENDING_DECISION");
    expect(model.failure_states).toContain("GOVERNANCE_FAILED");
    expect(model.terminal_states).toEqual(["COMPLETED", "REJECTED", "ARCHIVED"]);
    expect(model.lifecycle.current_state).toBe("CREATED");
    expect(model.validation.validation_status).toBe("VALID");
    expect(model.replay.replay_valid).toBe(true);
  });

  it("defines deterministic allowed transitions and rejects skipped stages", () => {
    const lifecycle = createDecisionLifecycle();

    expect(DECISION_LIFECYCLE_TRANSITIONS.CREATED).toEqual(["VALIDATING"]);
    expect(validateStateTransition({ lifecycle, next_state: "VALIDATING" }).validation_status).toBe("VALID");
    expect(validateStateTransition({ lifecycle, next_state: "ORCHESTRATED", replay_reference: "replay_skip" }).failures).toContain("INVALID_TRANSITION");
  });

  it("walks the successful lifecycle path through completed and archived states", () => {
    const path: readonly DecisionLifecycleState[] = [
      "VALIDATING",
      "INPUT_ACCEPTED",
      "EVIDENCE_READY",
      "GOVERNANCE_REVIEW",
      "CONSTITUTION_REVIEW",
      "AUTHORITY_VALIDATION",
      "READY_FOR_ORCHESTRATION",
      "ORCHESTRATED",
      "OPERATOR_VISIBLE",
      "PENDING_DECISION",
      "APPROVED",
      "COMPLETED",
      "ARCHIVED",
    ];
    const lifecycle = path.reduce((current, state) => advance(current, state), createDecisionLifecycle());

    expect(lifecycle.current_state).toBe("ARCHIVED");
    expect(lifecycle.archived).toBe(true);
    expect(lifecycle.history.map((record) => record.current_state)).toEqual(["CREATED", ...path]);
    expect(validateLifecycleState(lifecycle).validation_status).toBe("VALID");
  });

  it("supports rejected and deferred lifecycle branches", () => {
    const pending = ["VALIDATING", "INPUT_ACCEPTED", "EVIDENCE_READY", "GOVERNANCE_REVIEW", "CONSTITUTION_REVIEW", "AUTHORITY_VALIDATION", "READY_FOR_ORCHESTRATION", "ORCHESTRATED", "OPERATOR_VISIBLE", "PENDING_DECISION"].reduce((current, state) => advance(current, state as DecisionLifecycleState), createDecisionLifecycle());
    const rejected = advance(pending, "REJECTED");
    const archived = advance(rejected, "ARCHIVED");
    const deferred = advance(pending, "DEFERRED");
    const awaitingInput = advance(deferred, "AWAITING_INPUT");
    const revalidating = advance(awaitingInput, "VALIDATING");

    expect(archived.current_state).toBe("ARCHIVED");
    expect(revalidating.current_state).toBe("VALIDATING");
    expect(validateLifecycleState(revalidating).validation_status).toBe("VALID");
  });

  it("fails closed for invalid transitions and terminal or archived reactivation", () => {
    const invalid = transitionDecisionState({ lifecycle: createDecisionLifecycle(), next_state: "ORCHESTRATED", replay_reference: "replay_invalid" });
    const completed = ["VALIDATING", "INPUT_ACCEPTED", "EVIDENCE_READY", "GOVERNANCE_REVIEW", "CONSTITUTION_REVIEW", "AUTHORITY_VALIDATION", "READY_FOR_ORCHESTRATION", "ORCHESTRATED", "OPERATOR_VISIBLE", "PENDING_DECISION", "APPROVED", "COMPLETED"].reduce((current, state) => advance(current, state as DecisionLifecycleState), createDecisionLifecycle());
    const terminalReactivation = transitionDecisionState({ lifecycle: completed, next_state: "VALIDATING", replay_reference: "replay_reactivate" });
    const archived = advance(completed, "ARCHIVED");
    const archivedReactivation = transitionDecisionState({ lifecycle: archived, next_state: "VALIDATING", replay_reference: "replay_archived" });

    expect(invalid.current_state).toBe("VALIDATION_FAILED");
    expect(invalid.failures).toContain("INVALID_TRANSITION");
    expect(terminalReactivation.failures).toContain("INVALID_TRANSITION");
    expect(archivedReactivation.failures).toContain("ARCHIVED_STATE_IMMUTABLE");
  });

  it("maps governance, constitutional, authority, replay, integrity, and tenant failures to failure states", () => {
    const validating = advance(createDecisionLifecycle(), "VALIDATING");
    const governance = transitionDecisionState({ lifecycle: validating, next_state: "INPUT_ACCEPTED", governance_status: "FAILED", replay_reference: "replay_governance" });
    const constitutional = transitionDecisionState({ lifecycle: validating, next_state: "INPUT_ACCEPTED", constitutional_status: "FAILED", replay_reference: "replay_constitution" });
    const authority = transitionDecisionState({ lifecycle: validating, next_state: "INPUT_ACCEPTED", execution_authorized: true, replay_reference: "replay_authority" });
    const replay = transitionDecisionState({ lifecycle: validating, next_state: "INPUT_ACCEPTED" });
    const tenant = transitionDecisionState({ lifecycle: validating, next_state: "INPUT_ACCEPTED", tenant_id: "tenant_beta", replay_reference: "replay_tenant" });

    expect(governance.current_state).toBe("GOVERNANCE_FAILED");
    expect(constitutional.current_state).toBe("CONSTITUTION_FAILED");
    expect(authority.current_state).toBe("AUTHORITY_FAILED");
    expect(replay.current_state).toBe("REPLAY_FAILED");
    expect(tenant.current_state).toBe("TENANT_ISOLATION_FAILED");
  });

  it("records immutable lifecycle metadata for each transition", () => {
    const lifecycle = advance(createDecisionLifecycle(), "VALIDATING");
    const record = lifecycle.history.at(-1)!;

    expect(record.previous_state).toBe("CREATED");
    expect(record.current_state).toBe("VALIDATING");
    expect(record.append_only).toBe(true);
    expect(record.advisory_only).toBe(true);
    expect(record.execution_authorized).toBe(false);
    expect(record.integrity_hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it("replays lifecycle history deterministically and detects tampering", () => {
    const lifecycle = ["VALIDATING", "INPUT_ACCEPTED", "EVIDENCE_READY"].reduce((current, state) => advance(current, state as DecisionLifecycleState), createDecisionLifecycle());
    const replay = replayDecisionLifecycle(lifecycle);
    const tampered = { ...lifecycle, integrity_hash: "tampered" };

    expect(replay.replay_valid).toBe(true);
    expect(replay.state_sequence).toEqual(["CREATED", "VALIDATING", "INPUT_ACCEPTED", "EVIDENCE_READY"]);
    expect(replayDecisionLifecycle(tampered).failures).toContain("REPLAY_MISMATCH");
    expect(validateLifecycleState(tampered).failures).toContain("INTEGRITY_HASH_MISMATCH");
  });

  it("reports lifecycle observability metrics", () => {
    const completed = ["VALIDATING", "INPUT_ACCEPTED", "EVIDENCE_READY", "GOVERNANCE_REVIEW", "CONSTITUTION_REVIEW", "AUTHORITY_VALIDATION", "READY_FOR_ORCHESTRATION", "ORCHESTRATED", "OPERATOR_VISIBLE", "PENDING_DECISION", "APPROVED", "COMPLETED"].reduce((current, state) => advance(current, state as DecisionLifecycleState), createDecisionLifecycle());
    const deferred = advance(["VALIDATING", "INPUT_ACCEPTED", "EVIDENCE_READY", "GOVERNANCE_REVIEW", "CONSTITUTION_REVIEW", "AUTHORITY_VALIDATION", "READY_FOR_ORCHESTRATION", "ORCHESTRATED", "OPERATOR_VISIBLE", "PENDING_DECISION"].reduce((current, state) => advance(current, state as DecisionLifecycleState), createDecisionLifecycle()), "DEFERRED");
    const invalid = transitionDecisionState({ lifecycle: createDecisionLifecycle(), next_state: "ORCHESTRATED", replay_reference: "replay_invalid" });
    const metrics = buildDecisionLifecycleObservability([completed, deferred, invalid]);

    expect(metrics.transition_count).toBeGreaterThan(0);
    expect(metrics.transition_failures).toBe(1);
    expect(metrics.invalid_transition_attempts).toBe(1);
    expect(metrics.deferred_decision_count).toBe(1);
    expect(metrics.active_lifecycle_states.COMPLETED).toBe(1);
    expect(metrics.failure_state_frequency.VALIDATION_FAILED).toBe(1);
  });
});
