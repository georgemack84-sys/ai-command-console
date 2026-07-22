import { describe, expect, it } from "vitest";
import {
  analyzeWaitGraph,
  buildDeadlockRaceObservabilitySurface,
  detectDelegationLoops,
  detectRaceWindows,
  generateBlockedAgentGraph,
  generateDependencyLockMap,
  getDeadlockRaceDetection,
  recommendRecovery,
  validateDeadlockRaceDetection,
  validateStateUpdates,
} from "@/services/deadlock-race-condition-detection";
import type { DeadlockRaceFailure, DeadlockRaceScenario } from "@/types/deadlock-race-condition-detection";

describe("deadlock race condition detection", () => {
  it("publishes the 8ALT.7.9 certified doctrine bundle", () => {
    const bundle = getDeadlockRaceDetection();

    expect(bundle.doctrine.contract_version).toBe("deadlock-race-condition-detection/v8ALT.7.9");
    expect(bundle.doctrine.final_state).toBe("DEADLOCK_RACE_CONDITION_DETECTION_CERTIFIED");
    expect(bundle.validation.valid).toBe(true);
    expect(bundle.analysis.state).toBe("CERTIFIED");
  });

  it("creates a valid deterministic detection contract", () => {
    const analysis = analyzeWaitGraph();
    const validation = validateDeadlockRaceDetection(analysis);

    expect(validation.contract_valid).toBe(true);
    expect(analysis.contract.immutable).toBe(true);
    expect(analysis.contract.append_only).toBe(true);
    expect(analysis.contract.recovery_policy).toContain("ESCALATE_TO_OPERATOR");
  });

  it.each([
    ["DEADLOCK", "deadlock_detected"],
    ["CIRCULAR_WAIT", "circular_wait_detected"],
    ["DELEGATION_LOOP", "delegation_loop_detected"],
    ["SIMULTANEOUS_ACTION", "simultaneous_action_detected"],
    ["RACE_CONDITION", "race_condition_detected"],
    ["STATE_COLLISION", "state_collision_detected"],
    ["DEPENDENCY_LOCK", "dependency_lock_detected"],
  ] as const)("detects %s", (scenario, key) => {
    const validation = validateDeadlockRaceDetection(analyzeWaitGraph({ scenario }));

    expect(validation[key]).toBe(true);
    expect(validation.valid).toBe(true);
  });

  it("generates blocked graph, lock map, race window, loop records, state collisions, and recovery recommendations", () => {
    expect(generateBlockedAgentGraph({ scenario: "DEADLOCK" }).blocked_agent_nodes.length).toBeGreaterThan(0);
    expect(generateDependencyLockMap({ scenario: "DEPENDENCY_LOCK" }).timeout_status).toBe("STALE");
    expect(detectRaceWindows({ scenario: "RACE_CONDITION" }).risk_score).toBeGreaterThan(0.9);
    expect(detectDelegationLoops({ scenario: "DELEGATION_LOOP" })).toHaveLength(1);
    expect(validateStateUpdates({ scenario: "STATE_COLLISION" })).toHaveLength(1);
    expect(recommendRecovery({ scenario: "DEADLOCK" })[0]).toMatchObject({ recommended_action: "PAUSE_COORDINATION", advisory_only: true });
  });

  it.each([
    ["UNDETECTED_DEADLOCK", "UNDETECTED_DEADLOCK"],
    ["UNDETECTED_CIRCULAR_WAIT", "UNDETECTED_CIRCULAR_WAIT"],
    ["UNDETECTED_DELEGATION_LOOP", "UNDETECTED_DELEGATION_LOOP"],
    ["MISSED_SIMULTANEOUS_ACTION", "CONFLICTING_SIMULTANEOUS_ACTION_MISSED"],
    ["UNDETECTED_RACE_CONDITION", "UNDETECTED_RACE_CONDITION"],
    ["UNDETECTED_STATE_COLLISION", "UNDETECTED_STATE_COLLISION"],
    ["MISSED_DEPENDENCY_LOCK", "UNRESOLVED_DEPENDENCY_LOCK_MISSED"],
    ["MISSING_RECOVERY_RECOMMENDATION", "RECOVERY_RECOMMENDATION_MISSING"],
    ["NONDETERMINISTIC_ORDERING", "NONDETERMINISTIC_EVENT_ORDERING_DETECTED"],
    ["REPLAY_MISMATCH", "REPLAY_MISMATCH_DETECTED"],
    ["GOVERNANCE_ESCALATION_BYPASS", "GOVERNANCE_ESCALATION_BYPASSED"],
    ["CROSS_TENANT_LOCK", "CROSS_TENANT_LOCK_DETECTED"],
    ["INTEGRITY_FAILURE", "INTEGRITY_VERIFICATION_FAILED"],
  ] satisfies [DeadlockRaceScenario, DeadlockRaceFailure][])("fails closed for %s", (scenario, failure) => {
    const validation = validateDeadlockRaceDetection(analyzeWaitGraph({ scenario }));

    expect(validation.valid).toBe(false);
    expect(validation.fail_closed).toBe(true);
    expect(validation.failures).toContain(failure);
  });

  it("publishes observability for detected issues", () => {
    const surface = buildDeadlockRaceObservabilitySurface(analyzeWaitGraph({ scenario: "DEPENDENCY_LOCK" }));

    expect(surface.state).toBe("ISSUE_DETECTED");
    expect(surface.issue_count).toBe(1);
    expect(surface.recommendation_count).toBe(1);
    expect(surface.contract_hash).toBeTruthy();
  });
});
