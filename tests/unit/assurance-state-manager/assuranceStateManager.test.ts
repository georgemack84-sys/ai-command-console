import { describe, expect, it, vi } from "vitest";
import {
  buildAssuranceStateThresholds,
  certifyAssuranceState,
  computeAssuranceStateHash,
  evaluateAssuranceState,
  getAssuranceStateManagerContract,
  publishAssuranceState,
  replayAssuranceState,
  validateAssuranceState,
  validateAssuranceStateTransition,
} from "@/services/assurance-state-manager";
import type { AssuranceRuntimeState, AssuranceStateFailure, AssuranceStateScenario } from "@/types/assurance-state-manager";

vi.setConfig({ testTimeout: 180000 });

describe("Phase 8ALT.1F Assurance State Manager", () => {
  it("defines states, lifecycle, transition matrix, and certified thresholds", () => {
    const contract = getAssuranceStateManagerContract();

    expect(contract.doctrine.manager_version).toBe("assurance-state-manager/v8ALT.1F");
    expect(contract.doctrine.states).toEqual(["ASSURED", "STABLE", "WATCH", "DEGRADED", "CRITICAL"]);
    expect(contract.doctrine.lifecycle).toEqual(["COLLECT_RUNTIME_STATE", "VALIDATE_THRESHOLDS", "VERIFY_GOVERNANCE", "VERIFY_CONSTITUTION", "VERIFY_INTEGRITY", "DETERMINE_TRANSITION", "VALIDATE_REPLAY", "RECORD_STATE_HISTORY", "PUBLISH_ASSURANCE_STATE"]);
    expect(contract.doctrine.transition_matrix.ASSURED).toEqual(["STABLE"]);
    expect(contract.doctrine.transition_matrix.DEGRADED).toEqual(["WATCH", "CRITICAL"]);
    expect(contract.doctrine.advisory_only_for_execution).toBe(true);
    expect(contract.thresholds.length).toBe(5);
    expect(contract.thresholds.every((threshold) => threshold.immutable && threshold.threshold_hash)).toBe(true);
  });

  it.each([
    ["STABLE", "ASSURED", true],
    ["ASSURED", "CRITICAL", false],
    ["WATCH", "CRITICAL", false],
    ["ASSURED", "CRITICAL", true, true],
  ] as readonly [AssuranceRuntimeState, AssuranceRuntimeState, boolean, boolean?][])(
    "validates transition %s to %s",
    (from, to, allowed, emergency = false) => {
      const transition = validateAssuranceStateTransition(from, to, emergency);
      expect(transition.allowed).toBe(allowed);
      expect(transition.failure).toBe(allowed ? null : "INVALID_TRANSITION");
    },
  );

  it.each([
    ["BASELINE", "ASSURED", "STABLE"],
    ["STABLE_VARIATION", "STABLE", "ASSURED"],
    ["WATCH_DEGRADATION", "WATCH", "STABLE"],
    ["DEGRADED_RISK", "DEGRADED", "WATCH"],
    ["CRITICAL_FAILURE", "CRITICAL", "DEGRADED"],
    ["RECOVERY_TO_STABLE", "STABLE", "WATCH"],
    ["RECOVERY_TO_WATCH", "WATCH", "DEGRADED"],
  ] as readonly [AssuranceStateScenario, AssuranceRuntimeState, AssuranceRuntimeState][])( 
    "evaluates %s state transition",
    (scenario, current, previous) => {
      const record = evaluateAssuranceState({ scenario });
      const validation = validateAssuranceState(record);

      expect(record.current_state).toBe(current);
      expect(record.previous_state).toBe(previous);
      expect(record.transition_validation.allowed).toBe(true);
      expect(record.state_history[0]?.append_only).toBe(true);
      expect(validation.valid).toBe(true);
    },
  );

  it("certifies baseline state and publishes operator-visible state", () => {
    const record = evaluateAssuranceState();
    const validation = validateAssuranceState(record);
    const certification = certifyAssuranceState(record);
    const surface = publishAssuranceState(record);

    expect(record.current_state).toBe("ASSURED");
    expect(record.recommended_action).toBe("CONTINUE");
    expect(record.escalation_required).toBe(false);
    expect(record.operator_notification_required).toBe(false);
    expect(validation.valid).toBe(true);
    expect(certification.certified).toBe(true);
    expect(certification.ready_for_runtime_assurance_ledger).toBe(true);
    expect(surface.current_state).toBe("ASSURED");
    expect(surface.advisory_only).toBe(true);
  });

  it.each([
    ["INVALID_TRANSITION", "INVALID_TRANSITION"],
    ["SKIPPED_STATE", "SKIPPED_LIFECYCLE_STAGE"],
    ["OSCILLATING_STATE", "OSCILLATING_STATE_CHANGE"],
    ["REPEATED_DEGRADATION", "REPEATED_DEGRADATION"],
    ["FAILED_RECOVERY", "FAILED_RECOVERY_ATTEMPT"],
    ["INCONSISTENT_THRESHOLDS", "INCONSISTENT_THRESHOLDS"],
    ["GOVERNANCE_FAILURE", "GOVERNANCE_VALIDATION_FAILURE"],
    ["CONSTITUTIONAL_FAILURE", "CONSTITUTIONAL_VALIDATION_FAILURE"],
    ["INTEGRITY_FAILURE", "INTEGRITY_VERIFICATION_FAILURE"],
    ["REPLAY_MISMATCH", "INTEGRITY_VERIFICATION_FAILURE"],
    ["EXECUTION_AUTHORITY_ATTEMPT", "UNAUTHORIZED_EXECUTION_CAPABILITY"],
  ] as readonly [AssuranceStateScenario, AssuranceStateFailure][])( 
    "fails closed for %s",
    (scenario, failure) => {
      const record = evaluateAssuranceState({ scenario });
      const validation = validateAssuranceState(record);
      const certification = certifyAssuranceState(record);

      expect(validation.valid).toBe(false);
      expect(validation.failures).toContain(failure);
      expect(certification.certified).toBe(false);
      expect(certification.ready_for_runtime_assurance_ledger).toBe(false);
    },
  );

  it("replays state records with identical transition and history hashes", () => {
    const first = evaluateAssuranceState({ scenario: "WATCH_DEGRADATION" });
    const second = evaluateAssuranceState({ scenario: "WATCH_DEGRADATION" });
    const replay = replayAssuranceState(first);

    expect(second.record_hash).toBe(first.record_hash);
    expect(first.record_hash).toBe(computeAssuranceStateHash(first));
    expect(replay.deterministic).toBe(true);
    expect(replay.reconstructed_current_state).toBe(first.current_state);
    expect(replay.reconstructed_transition_hash).toBe(first.transition_validation.validation_hash);
    expect(replay.reconstructed_history_hash).toBe(first.state_history[0]?.history_hash);
  });

  it("preserves execution advisory-only boundary", () => {
    const record = evaluateAssuranceState({ scenario: "DEGRADED_RISK" });

    expect(record.advisory_only).toBe(true);
    expect(record.execution_authorized).toBe(false);
    expect(record.execution_modified).toBe(false);
    expect(record.governance_modified).toBe(false);
    expect(record.operator_overridden).toBe(false);
    expect(validateAssuranceState(record).advisory_only).toBe(true);
  });

  it("exposes deterministic thresholds for all assurance states", () => {
    const thresholds = buildAssuranceStateThresholds();

    expect(thresholds.map((threshold) => threshold.state)).toEqual(["ASSURED", "STABLE", "WATCH", "DEGRADED", "CRITICAL"]);
    expect(thresholds.find((threshold) => threshold.state === "CRITICAL")?.allowed_recommendation_severities).toContain("CRITICAL");
  });
});
