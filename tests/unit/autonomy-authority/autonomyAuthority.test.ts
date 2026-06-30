import { describe, expect, it } from "vitest";
import { generateAutonomyIdentity } from "@/services/autonomy-identity";
import { initializeAutonomyState } from "@/services/autonomy-state-machine";
import {
  buildAuthorityAuditLedger,
  buildAuthorityAssignment,
  buildAuthorityVisibilitySurface,
  computeAutonomyAuthorityAssignmentHash,
  computeAutonomyAuthorityDecisionHash,
  decideAutonomyAuthority,
  getAutonomyAuthorityFramework,
  replayAuthorityDecisions,
} from "@/services/autonomy-authority";
import type { AutonomyAuthorityScenario } from "@/types/autonomy-authority";

describe("Mission Control Phase 8A.4 Authority Model", () => {
  it("assigns explicit authority with deterministic permissions", () => {
    const identity = generateAutonomyIdentity();
    const assignment = buildAuthorityAssignment(identity);
    expect(assignment.authority_level).toBe(3);
    expect(assignment.permissions).toContain("EXECUTE_APPROVED_WORKFLOW");
    expect(assignment.assigned_by).toBe("governance-authority-service");
    expect(computeAutonomyAuthorityAssignmentHash(assignment)).toBe(assignment.assignment_hash);
  });

  it("approves an explicitly granted governed action", () => {
    const identity = generateAutonomyIdentity();
    const result = decideAutonomyAuthority(identity, initializeAutonomyState(identity));
    expect(result.validation.decision).toBe("APPROVED");
    expect(result.validation.failures).toEqual([]);
    expect(result.decision.decision).toBe("APPROVED");
    expect(computeAutonomyAuthorityDecisionHash(result.decision)).toBe(result.decision.integrity_hash);
  });

  it.each([
    ["SELF_ASSIGNED", "SELF_ASSIGNED_AUTHORITY"],
    ["IMPLICIT_PERMISSION", "IMPLICIT_PERMISSION"],
    ["AUTHORITY_ESCALATION", "AUTHORITY_ESCALATION"],
    ["MISSING_OPERATOR_APPROVAL", "OPERATOR_UNAUTHORIZED"],
    ["GOVERNANCE_BYPASS", "GOVERNANCE_BYPASS"],
    ["POLICY_VIOLATION", "POLICY_EXPIRED"],
    ["CONSTITUTIONAL_VIOLATION", "CONSTITUTIONAL_VIOLATION"],
    ["UNAUTHORIZED_DELEGATION", "UNAUTHORIZED_DELEGATION"],
    ["PRIVILEGE_INHERITANCE", "PRIVILEGE_INHERITANCE"],
    ["CROSS_TENANT_AUTHORITY", "CROSS_TENANT_AUTHORITY"],
    ["OUTSIDE_MISSION_SCOPE", "MISSION_SCOPE_VIOLATION"],
    ["AUTHORITY_MODIFIED_DURING_EXECUTION", "AUTHORITY_MODIFIED_DURING_EXECUTION"],
    ["EMERGENCY_BYPASS", "EMERGENCY_AUTHORITY_UNBOUNDED"],
    ["HASH_MISMATCH", "INTEGRITY_HASH_MISMATCH"],
  ] as readonly [AutonomyAuthorityScenario, string][])("denies scenario %s", (scenario, reason) => {
    const identity = generateAutonomyIdentity();
    const result = decideAutonomyAuthority(identity, initializeAutonomyState(identity), scenario);
    expect(result.validation.decision).toBe("DENIED");
    expect(result.validation.failures).toContain(reason as never);
    expect(result.decision.denial_reason).toBeTruthy();
  });

  it("fails closed during active execution authority modification", () => {
    const identity = generateAutonomyIdentity();
    const activeState = { ...initializeAutonomyState(identity), current_state: "ACTIVE" as const };
    const result = decideAutonomyAuthority(identity, activeState);
    expect(result.validation.decision).toBe("DENIED");
    expect(result.validation.failures).toContain("FAIL_CLOSED");
  });

  it("records immutable approval and denial history", () => {
    const identity = generateAutonomyIdentity();
    const state = initializeAutonomyState(identity);
    const approved = decideAutonomyAuthority(identity, state).decision;
    const denied = decideAutonomyAuthority(identity, state, "GOVERNANCE_BYPASS").decision;
    const ledger = buildAuthorityAuditLedger([approved, denied]);
    expect(ledger.decisions).toHaveLength(2);
    expect(ledger.denied_requests).toHaveLength(1);
    expect(ledger.approval_chain).toContain("governance_profile_controlled_autonomy");
    expect(ledger.ledger_hash).toBeTruthy();
  });

  it("replays authority decisions deterministically", () => {
    const identity = generateAutonomyIdentity();
    const state = initializeAutonomyState(identity);
    const ledger = buildAuthorityAuditLedger([decideAutonomyAuthority(identity, state).decision]);
    const replay = replayAuthorityDecisions(ledger);
    expect(replay.validation_state).toBe("PASS");
    expect(replay.reconstructed_outcomes).toEqual(["APPROVED"]);
  });

  it("detects authority replay integrity mismatch", () => {
    const identity = generateAutonomyIdentity();
    const state = initializeAutonomyState(identity);
    const ledger = buildAuthorityAuditLedger([decideAutonomyAuthority(identity, state, "HASH_MISMATCH").decision]);
    const replay = replayAuthorityDecisions(ledger);
    expect(replay.validation_state).toBe("FAIL");
    expect(replay.failure_reason).toBe("INTEGRITY_HASH_MISMATCH");
  });

  it("exposes complete operator authority visibility", () => {
    const identity = generateAutonomyIdentity();
    const state = initializeAutonomyState(identity);
    const result = decideAutonomyAuthority(identity, state, "MISSING_OPERATOR_APPROVAL");
    const ledger = buildAuthorityAuditLedger([result.decision]);
    const visibility = buildAuthorityVisibilitySurface(result.assignment, ledger);
    expect(visibility.assigned_authority_level).toBe(result.assignment.authority_level);
    expect(visibility.denied_requests).toHaveLength(1);
    expect(visibility.hidden_decisions_visible).toBe(false);
  });

  it("publishes aggregate authority framework", () => {
    const framework = getAutonomyAuthorityFramework();
    expect(framework.assignment.authority_state).toBe("AUTHORIZED");
    expect(framework.ledger.decisions.length).toBeGreaterThan(0);
    expect(framework.visibility.authority_history.length).toBe(framework.ledger.decisions.length);
  });
});
