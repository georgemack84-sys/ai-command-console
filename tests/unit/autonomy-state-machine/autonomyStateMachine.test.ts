import { describe, expect, it } from "vitest";
import { generateAutonomyIdentity } from "@/services/autonomy-identity";
import {
  AUTONOMY_OPERATIONAL_STATES,
  buildAutonomyStateModel,
  buildAutonomyStateVisibilitySurface,
  buildAutonomyTransitionLedger,
  buildCertifiedAutonomyLifecycle,
  getAutonomyStateMachine,
  initializeAutonomyState,
  replayAutonomyStateHistory,
  transitionAutonomyState,
  validateAutonomyTransition,
} from "@/services/autonomy-state-machine";
import type { AutonomyTransitionScenario } from "@/types/autonomy-state-machine";

describe("Mission Control Phase 8A.3 Autonomy State Machine", () => {
  it("defines the official lifecycle model", () => {
    const model = buildAutonomyStateModel();
    expect(model.states).toEqual(AUTONOMY_OPERATIONAL_STATES);
    expect(model.valid_transitions.CREATED).toEqual(["INITIALIZED"]);
    expect(model.terminal_states).toContain("ARCHIVED");
    expect(model.recovery_paths.some((path) => path.join(">") === "PAUSED>RESUMING>ACTIVE")).toBe(true);
  });

  it("initializes autonomy in CREATED state", () => {
    const context = initializeAutonomyState(generateAutonomyIdentity());
    expect(context.current_state).toBe("CREATED");
    expect(context.lifecycle_history).toEqual([]);
    expect(context.state_hash).toBeTruthy();
  });

  it("performs deterministic valid transitions", () => {
    const context = initializeAutonomyState(generateAutonomyIdentity());
    const result = transitionAutonomyState(context, "INITIALIZED");
    expect(result.validation.validation_state).toBe("PASS");
    expect(result.context.current_state).toBe("INITIALIZED");
    expect(result.context.lifecycle_history).toHaveLength(1);
    expect(Object.isFrozen(result.record)).toBe(true);
  });

  it.each([
    ["UNKNOWN_STATE", "UNKNOWN_STATE"],
    ["SKIPPED_TRANSITION", "ILLEGAL_TRANSITION"],
    ["CIRCULAR_TRANSITION", "CIRCULAR_TRANSITION"],
    ["HIDDEN_STATE", "HIDDEN_STATE_DETECTED"],
    ["MISSING_GOVERNANCE", "GOVERNANCE_CONTEXT_MISSING"],
    ["MISSING_REPLAY", "REPLAY_REFERENCE_MISSING"],
    ["MISSING_OPERATOR_VISIBILITY", "OPERATOR_VISIBILITY_MISSING"],
    ["AUTHORITY_ESCALATION", "AUTHORITY_ESCALATION"],
    ["DIRECT_SUSPENDED_ACTIVE", "ILLEGAL_TRANSITION"],
  ] as readonly [AutonomyTransitionScenario, string][])("rejects invalid transition scenario %s", (scenario, reason) => {
    const context = initializeAutonomyState(generateAutonomyIdentity());
    const result = transitionAutonomyState(context, "INITIALIZED", { scenario });
    expect(result.validation.failures.some((item) => item.reason === reason)).toBe(true);
  });

  it("rejects archived reactivation", () => {
    const archived = buildCertifiedAutonomyLifecycle(generateAutonomyIdentity());
    const result = transitionAutonomyState(archived, "ACTIVE", { scenario: "ARCHIVED_REACTIVATION" });
    expect(result.validation.failures.some((item) => item.reason === "TERMINAL_REACTIVATION")).toBe(true);
  });

  it("allows governed recovery through RESUMING", () => {
    let context = initializeAutonomyState(generateAutonomyIdentity());
    for (const next of ["INITIALIZED", "VALIDATED", "READY", "MONITORING", "ACTIVE", "PAUSED", "RESUMING", "ACTIVE"] as const) {
      const result = transitionAutonomyState(context, next);
      expect(result.validation.validation_state).toBe("PASS");
      context = result.context;
    }
    expect(context.current_state).toBe("ACTIVE");
  });

  it("records an immutable transition ledger", () => {
    const context = buildCertifiedAutonomyLifecycle(generateAutonomyIdentity());
    const ledger = buildAutonomyTransitionLedger(context);
    expect(ledger.transitions.length).toBeGreaterThan(0);
    expect(ledger.lifecycle_states[0]).toBe("CREATED");
    expect(ledger.lifecycle_states.at(-1)).toBe("ARCHIVED");
    expect(ledger.ledger_hash).toBeTruthy();
  });

  it("replays lifecycle history deterministically", () => {
    const ledger = buildAutonomyTransitionLedger(buildCertifiedAutonomyLifecycle(generateAutonomyIdentity()));
    const replay = replayAutonomyStateHistory(ledger);
    expect(replay.validation_state).toBe("PASS");
    expect(replay.reconstructed_states.at(-1)).toBe("ARCHIVED");
    expect(replay.transition_ids).toHaveLength(ledger.transitions.length);
  });

  it("detects replay integrity mismatch", () => {
    const context = initializeAutonomyState(generateAutonomyIdentity());
    const result = transitionAutonomyState(context, "INITIALIZED", { scenario: "HASH_MISMATCH" });
    const replay = replayAutonomyStateHistory(buildAutonomyTransitionLedger(result.context));
    expect(replay.validation_state).toBe("FAIL");
    expect(replay.failure_reason).toBe("INTEGRITY_HASH_MISMATCH");
  });

  it("builds operator visibility surface", () => {
    const context = buildCertifiedAutonomyLifecycle(generateAutonomyIdentity());
    const visibility = buildAutonomyStateVisibilitySurface(context);
    expect(visibility.current_state).toBe("ARCHIVED");
    expect(visibility.hidden_state_visible).toBe(false);
    expect(visibility.integrity_status).toBe("VALID");
    expect(visibility.blocked_transitions).toContain("ACTIVE");
  });

  it("validates transition requests independently", () => {
    const context = initializeAutonomyState(generateAutonomyIdentity());
    const transition = transitionAutonomyState(context, "INITIALIZED");
    const validation = validateAutonomyTransition(context, transition.record);
    expect(validation.validation_state).toBe("PASS");
    expect(validation.governed).toBe(true);
    expect(validation.operator_visible).toBe(true);
  });

  it("publishes the aggregate state machine", () => {
    const machine = getAutonomyStateMachine();
    expect(machine.model.states).toContain("SUSPENDED");
    expect(machine.replay.validation_state).toBe("PASS");
    expect(machine.visibility.current_state).toBe("ARCHIVED");
  });
});
