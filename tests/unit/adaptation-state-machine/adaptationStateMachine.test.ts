import { describe, expect, it } from "vitest";
import {
  ADAPTATION_LIFECYCLE_STATES,
  ADAPTATION_STATE_CHECKS,
  computeAdaptationStateHash,
  getAdaptationStateMachineFoundation,
  replayAdaptationStateMachine,
  runAdaptationStateMachine,
} from "@/services/adaptation-state-machine";
import type { AdaptationStateFailure, AdaptationStateMachineInput } from "@/types/adaptation-state-machine";

describe("Mission Control Phase 10.0.4 Adaptation State Machine", () => {
  it("publishes the adaptation state machine foundation", () => {
    const foundation = getAdaptationStateMachineFoundation();

    expect(foundation.state_machine_version).toBe("adaptation-state-machine/v1");
    expect(foundation.checks).toEqual(ADAPTATION_STATE_CHECKS);
    expect(foundation.states).toEqual(ADAPTATION_LIFECYCLE_STATES);
    expect(foundation.result.validation.validation_status).toBe("VALID");
  });

  it("creates an integrity-protected adaptation state record", () => {
    const result = runAdaptationStateMachine();

    expect(computeAdaptationStateHash(result.state_record)).toBe(result.state_record.integrity_hash);
    expect(result.state_record.current_state).toBe("PROPOSED");
    expect(result.transition_result.current_state).toBe("VALIDATED");
    expect(result.transition_result.validation_result).toBe("ALLOW");
  });

  it("allows every canonical forward transition", () => {
    const transitions = [
      ["PROPOSED", "VALIDATED"],
      ["VALIDATED", "SIMULATED"],
      ["SIMULATED", "GOVERNANCE_REVIEW"],
      ["GOVERNANCE_REVIEW", "OPERATOR_REVIEW"],
      ["OPERATOR_REVIEW", "APPROVED"],
      ["APPROVED", "CERTIFIED"],
      ["CERTIFIED", "AVAILABLE"],
    ] as const;

    for (const [from_state, to_state] of transitions) {
      const result = runAdaptationStateMachine({ from_state, to_state });
      expect(result.transition_result.validation_result).toBe("ALLOW");
      expect(result.validation.validation_status).toBe("VALID");
    }
  });

  it("allows rollback only from approved, certified, or available states", () => {
    const approved = runAdaptationStateMachine({ from_state: "APPROVED", to_state: "ROLLED_BACK" });
    const certified = runAdaptationStateMachine({ from_state: "CERTIFIED", to_state: "ROLLED_BACK" });
    const available = runAdaptationStateMachine({ from_state: "AVAILABLE", to_state: "ROLLED_BACK" });
    const invalid = runAdaptationStateMachine({ from_state: "VALIDATED", to_state: "ROLLED_BACK" });

    expect(approved.validation.validation_status).toBe("VALID");
    expect(certified.validation.validation_status).toBe("VALID");
    expect(available.validation.validation_status).toBe("VALID");
    expect(invalid.validation.failures).toContain("UNAUTHORIZED_ROLLBACK");
  });

  it("records replayable transitions and append-only state ledger entries", () => {
    const result = runAdaptationStateMachine();

    expect(result.replay_model.deterministic_reconstruction).toBe(true);
    expect(result.replay_model.integrity_reproducible).toBe(true);
    expect(result.state_ledger.map((entry) => entry.sequence_number)).toEqual([1]);
    expect(result.state_ledger.every((entry) => entry.append_only && !entry.deleted)).toBe(true);
  });

  it("remains replayable, advisory-only, and non-executing", () => {
    const result = runAdaptationStateMachine();

    expect(replayAdaptationStateMachine(result)).toBe(true);
    expect(result.deterministic).toBe(true);
    expect(result.replayable).toBe(true);
    expect(result.advisory_only).toBe(true);
    expect(result.permits_execution).toBe(false);
    expect(result.mutates_adaptive_behavior).toBe(false);
  });

  it.each([
    ["PERMISSION_INVALID", "LEARNING_PERMISSION_INVALID"],
    ["HIDDEN_STATE", "HIDDEN_LIFECYCLE_STATE"],
    ["SKIPPED_TRANSITION", "SKIPPED_TRANSITION"],
    ["REVERSED_TRANSITION", "REVERSED_TRANSITION"],
    ["DUPLICATE_APPROVAL", "DUPLICATE_APPROVAL"],
    ["CERTIFICATION_BEFORE_APPROVAL", "CERTIFICATION_BEFORE_APPROVAL"],
    ["OPERATOR_BEFORE_GOVERNANCE", "OPERATOR_REVIEW_BEFORE_GOVERNANCE"],
    ["AVAILABLE_BEFORE_CERTIFICATION", "AVAILABILITY_BEFORE_CERTIFICATION"],
    ["REPLAY_OMISSION", "REPLAY_OMISSION"],
    ["GOVERNANCE_BYPASS", "GOVERNANCE_BYPASS"],
    ["OPERATOR_BYPASS", "OPERATOR_BYPASS"],
    ["CERTIFICATION_BYPASS", "CERTIFICATION_BYPASS"],
    ["UNAUTHORIZED_APPROVAL", "UNAUTHORIZED_APPROVAL"],
    ["UNAUTHORIZED_ROLLBACK", "UNAUTHORIZED_ROLLBACK"],
    ["INVALID_ROLLBACK_TARGET", "INVALID_ROLLBACK_TARGET"],
    ["SIMULATION_FAILURE", "SIMULATION_FAILURE"],
    ["VALIDATION_FAILURE", "VALIDATION_FAILURE"],
    ["STATE_FORGERY", "STATE_FORGERY"],
    ["LIFECYCLE_TAMPERING", "LIFECYCLE_TAMPERING"],
    ["HASH_MISMATCH", "INTEGRITY_HASH_MISMATCH"],
    ["FAIL_OPEN", "FAIL_OPEN_STATE_BEHAVIOR"],
    ["EXECUTION_AUTHORITY", "EXECUTION_AUTHORITY_GRANTED"],
  ] as readonly [NonNullable<AdaptationStateMachineInput["scenario"]>, AdaptationStateFailure][])("fails closed for %s", (scenario, failure) => {
    const result = runAdaptationStateMachine({ scenario });

    expect(result.validation.validation_status).toBe("BLOCKED");
    expect(result.validation.failures).toContain(failure);
    expect(result.certification_report.certification_decision).toBe("FAIL");
    expect(result.permits_execution).toBe(false);
  });

  it("fails closed when the role lacks adaptation state visibility", () => {
    const result = runAdaptationStateMachine({ role: "ADMINISTRATOR" });

    expect(result.validation.validation_status).toBe("BLOCKED");
    expect(result.validation.failures).toContain("AUTHORIZATION_FAILURE");
  });

  it("detects adaptation state machine tampering", () => {
    const result = runAdaptationStateMachine();
    const tampered = { ...result, replay_hash: "tampered" };

    expect(replayAdaptationStateMachine(tampered)).toBe(false);
  });
});
