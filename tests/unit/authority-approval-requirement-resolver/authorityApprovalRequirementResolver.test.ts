import { describe, expect, it } from "vitest";
import {
  AUTHORITY_OUTCOMES,
  AUTHORITY_SCOPES,
  AUTHORITY_TYPES,
  DELEGATION_LEVELS,
  computeAuthorityAssignmentHash,
  createApprovalChain,
  createAuthorityAssignments,
  getAuthorityApprovalResolverFoundation,
  replayAuthorityApprovalResolution,
  resolveAuthorityAndApprovals,
} from "@/services/authority-approval-requirement-resolver";
import { validateConstitutionalDecision } from "@/services/constitutional-decision-validator";
import { createGovernanceDecisionRecord } from "@/services/governance-decision-filter-contract";

describe("Mission Control Phase 9.7.4 Authority & Approval Requirement Resolver", () => {
  it("publishes the authority approval resolver foundation", () => {
    const foundation = getAuthorityApprovalResolverFoundation();

    expect(foundation.resolver_version).toBe("authority-approval-requirement-resolver/v1");
    expect(foundation.authority_types).toEqual(AUTHORITY_TYPES);
    expect(foundation.authority_outcomes).toEqual(AUTHORITY_OUTCOMES);
    expect(foundation.authority_scopes).toEqual(AUTHORITY_SCOPES);
    expect(foundation.delegation_levels).toEqual(DELEGATION_LEVELS);
    expect(foundation.result.authority_resolution_status).toBe("PASS");
    expect(foundation.replay.replay_valid).toBe(true);
  });

  it("resolves authority, approvals, evidence, and ledger records deterministically", () => {
    const first = resolveAuthorityAndApprovals();
    const second = resolveAuthorityAndApprovals();

    expect(first).toEqual(second);
    expect(first.evidence_report.authority_outcome).toBe("AUTHORIZED");
    expect(first.evaluations.every((evaluation) => evaluation.authority_result === "VALID")).toBe(true);
    expect(first.ledger_records).toHaveLength(1);
  });

  it("requires explicit approvals and deterministic escalations", () => {
    const assignments = createAuthorityAssignments();
    const partialChain = createApprovalChain(assignments).filter((entry) => entry.approval_id !== "approval_certification_service");
    const result = resolveAuthorityAndApprovals({ authority_assignments: assignments, approval_chain: partialChain });

    expect(result.authority_resolution_status).toBe("FAIL");
    expect(result.evidence_report.authority_outcome).toBe("CERTIFICATION_REQUIRED");
    expect(result.failures).toContain("MISSING_APPROVALS");
    expect(result.failures).toContain("AUTHORITY_ESCALATION_REQUIRED");
    expect(result.evidence_report.escalation_results).toContain("certification_escalation");
  });

  it("rejects constitutional authority failures before resolving authority", () => {
    const decision = createGovernanceDecisionRecord({ lifecycle_state: "READY_FOR_ENFORCEMENT" });
    const constitutional = validateConstitutionalDecision({ governance_decision: decision, authority_refs: ["execution_authority"] });
    const result = resolveAuthorityAndApprovals({ governance_decision: decision, constitutional_result: constitutional });

    expect(result.failures).toContain("CONSTITUTIONAL_AUTHORITY_INVALID");
    expect(result.fail_closed).toBe(true);
  });

  it("rejects missing, duplicate, invalid, expired, revoked, and tampered authority assignments", () => {
    const decision = createGovernanceDecisionRecord({ lifecycle_state: "READY_FOR_ENFORCEMENT" });
    const assignments = createAuthorityAssignments(decision);
    const duplicate = [assignments[0], assignments[0]];
    const invalidScope = [{ ...assignments[0], authority_scope: "OPERATOR" as const, integrity_hash: computeAuthorityAssignmentHash({ ...assignments[0], authority_scope: "OPERATOR" as const }) }];
    const expired = [{ ...assignments[0], expiration_date: "2026-01-02T00:00:00.000Z", integrity_hash: computeAuthorityAssignmentHash({ ...assignments[0], expiration_date: "2026-01-02T00:00:00.000Z" }) }];
    const revoked = [{ ...assignments[0], revoked: true, integrity_hash: computeAuthorityAssignmentHash({ ...assignments[0], revoked: true }) }];
    const tampered = [{ ...assignments[0], authority_holder: "tampered" }];

    expect(resolveAuthorityAndApprovals({ governance_decision: decision, authority_assignments: [] }).failures).toContain("MISSING_AUTHORITY_ASSIGNMENTS");
    expect(resolveAuthorityAndApprovals({ governance_decision: decision, authority_assignments: duplicate }).failures).toContain("DUPLICATE_AUTHORITY_IDENTIFIER");
    expect(resolveAuthorityAndApprovals({ governance_decision: decision, authority_assignments: invalidScope }).failures).toContain("INVALID_AUTHORITY_SCOPE");
    expect(resolveAuthorityAndApprovals({ governance_decision: decision, authority_assignments: expired }).failures).toContain("EXPIRED_AUTHORITY");
    expect(resolveAuthorityAndApprovals({ governance_decision: decision, authority_assignments: revoked }).failures).toContain("REVOKED_AUTHORITY");
    expect(resolveAuthorityAndApprovals({ governance_decision: decision, authority_assignments: tampered }).failures).toContain("AUTHORITY_INTEGRITY_MISMATCH");
  });

  it("rejects invalid delegation, circular approval chains, unresolved authority references, unauthorized access, and replay mismatch", () => {
    const valid = resolveAuthorityAndApprovals();
    const decision = createGovernanceDecisionRecord({ lifecycle_state: "READY_FOR_ENFORCEMENT" });
    const assignments = createAuthorityAssignments(decision);
    const invalidDelegation = assignments.map((assignment, index) => index === 2 ? { ...assignment, delegated_by: assignment.authority_holder, integrity_hash: computeAuthorityAssignmentHash({ ...assignment, delegated_by: assignment.authority_holder }) } : assignment);
    const circular = [{ ...createApprovalChain(assignments)[0], approver_ref: createApprovalChain(assignments)[0].source_authority_ref }];
    const unresolved = [{ ...createApprovalChain(assignments)[0], source_authority_ref: "missing_authority" }];

    expect(resolveAuthorityAndApprovals({ governance_decision: decision, authority_assignments: invalidDelegation }).failures).toContain("INVALID_DELEGATION");
    expect(resolveAuthorityAndApprovals({ governance_decision: decision, authority_assignments: assignments, approval_chain: circular }).failures).toContain("CIRCULAR_APPROVAL_CHAIN");
    expect(resolveAuthorityAndApprovals({ governance_decision: decision, authority_assignments: assignments, approval_chain: unresolved }).failures).toContain("UNRESOLVED_AUTHORITY_REFERENCE");
    expect(resolveAuthorityAndApprovals({ authorized_component: "unknown" }).failures).toContain("UNAUTHORIZED_AUTHORITY_RESOLVER_ACCESS");
    expect(resolveAuthorityAndApprovals({ replay_expected_hash: `${valid.replay_hash}_wrong` }).failures).toContain("REPLAY_DIVERGENCE");
  });

  it("replays authority evidence and ledger records deterministically", () => {
    const result = resolveAuthorityAndApprovals();
    const replay = replayAuthorityApprovalResolution(result);
    const tampered = replayAuthorityApprovalResolution({ ...result, replay_hash: "tampered" });

    expect(replay.replay_valid).toBe(true);
    expect(replay.governance_decision_id).toBe(result.governance_decision.governance_decision_id);
    expect(replay.authority_assignment_refs).toEqual(result.authority_assignments.map((assignment) => assignment.authority_assignment_id));
    expect(tampered.replay_valid).toBe(false);
    expect(tampered.failures).toContain("REPLAY_DIVERGENCE");
  });
});
