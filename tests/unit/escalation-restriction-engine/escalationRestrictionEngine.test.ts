import { describe, expect, it } from "vitest";
import {
  determineEscalationRestriction,
  getEscalationRestrictionEngineFoundation,
  replayEscalationRestrictionDecision,
} from "@/services/escalation-restriction-engine";
import type { EscalationRestrictionDecisionState, EscalationRestrictionFailure, EscalationRestrictionScenario } from "@/types/escalation-restriction-engine";

describe("Mission Control Phase 10.8.8 Escalation & Restriction Engine", () => {
  it("publishes the escalation restriction foundation", () => {
    const foundation = getEscalationRestrictionEngineFoundation();

    expect(foundation.escalation_restriction_engine_version).toBe("escalation-restriction-engine/v1");
    expect(foundation.api_surface.determine_escalation).toBe("POST /escalation-restriction-engine/determine");
    expect(foundation.api_surface.execution_authorization_supported).toBe(false);
    expect(foundation.api_surface.governance_override_supported).toBe(false);
    expect(foundation.api_surface.fail_open_supported).toBe(false);
    expect(foundation.result.final_decision).toBe("APPROVED_FOR_SIMULATION");
  });

  it("routes approved proposals deterministically without active restrictions", () => {
    const first = determineEscalationRestriction({ scenario: "APPROVED_FOR_SIMULATION" });
    const second = determineEscalationRestriction({ scenario: "APPROVED_FOR_SIMULATION" });

    expect(first.decision.decision_id).toBe(second.decision.decision_id);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(first.final_decision).toBe("APPROVED_FOR_SIMULATION");
    expect(first.simulation_authorization_decision).toBe("AUTHORIZED_FOR_SIMULATION");
    expect(first.decision.restrictions).toHaveLength(0);
  });

  it("remains advisory-only, human-controlled, least-authority, and immutable", () => {
    const result = determineEscalationRestriction();

    expect(result.advisory_only).toBe(true);
    expect(result.human_controlled).toBe(true);
    expect(result.least_authority).toBe(true);
    expect(result.immutable).toBe(true);
    expect(result.fail_closed).toBe(false);
  });

  it.each([
    ["APPROVED_FOR_SIMULATION", "APPROVED_FOR_SIMULATION"],
    ["OPERATOR_REVIEW_REQUIRED", "OPERATOR_REVIEW_REQUIRED"],
    ["GOVERNANCE_REVIEW_REQUIRED", "GOVERNANCE_REVIEW_REQUIRED"],
    ["CONSTITUTIONAL_REVIEW_REQUIRED", "CONSTITUTIONAL_REVIEW_REQUIRED"],
    ["MULTI_LEVEL_REVIEW_REQUIRED", "MULTI_LEVEL_REVIEW_REQUIRED"],
    ["RESTRICTED", "RESTRICTED"],
    ["REJECTED", "REJECTED"],
  ] as readonly [EscalationRestrictionScenario, EscalationRestrictionDecisionState][])("routes %s to %s", (scenario, state) => {
    const result = determineEscalationRestriction({ scenario });

    expect(result.final_decision).toBe(state);
  });

  it("assigns mandatory reviewers and blocking workflow for multi-level review", () => {
    const result = determineEscalationRestriction({ scenario: "MULTI_LEVEL_REVIEW_REQUIRED" });

    expect(result.decision.required_reviewers.map((reviewer) => reviewer.reviewer_role)).toEqual([
      "governance_authority",
      "constitutional_authority",
      "risk_authority",
    ]);
    expect(result.decision.review_workflow).toHaveLength(3);
    expect(result.decision.review_workflow.every((step) => step.blocking)).toBe(true);
    expect(result.simulation_authorization_decision).toBe("PENDING_REVIEW");
  });

  it("applies restrictions for escalation triggers", () => {
    const result = determineEscalationRestriction({ scenario: "CONSTITUTIONAL_REVIEW_REQUIRED" });

    expect(result.decision.escalation_triggers[0].category).toBe("CONSTITUTIONAL");
    expect(result.decision.restrictions[0].restriction_type).toBe("PROHIBITED");
    expect(result.restriction_enforcement_report[0]).toContain("enforced");
  });

  it.each([
    ["RULE_EVALUATION_FAILURE", "ESCALATION_RULES_UNEVALUABLE"],
    ["AUTHORITY_UNDETERMINED", "REVIEW_AUTHORITY_UNDETERMINED"],
    ["AMBIGUOUS_REVIEWERS", "MANDATORY_REVIEWER_ASSIGNMENT_AMBIGUOUS"],
    ["UNRESOLVED_CONSTITUTIONAL_IMPACT", "CONSTITUTIONAL_IMPACT_UNRESOLVED"],
    ["GOVERNANCE_MODIFICATION_WITHOUT_APPROVAL", "GOVERNANCE_MODIFICATION_WITHOUT_APPROVAL"],
    ["AUTHORITY_EXPANSION", "AUTHORITY_EXPANSION_DETECTED"],
    ["UNRESOLVED_POLICY_CONFLICTS", "POLICY_CONFLICTS_UNRESOLVED"],
    ["AUDIT_DEGRADATION", "AUDIT_DEGRADATION_UNMITIGATED"],
    ["REPLAY_DEGRADATION", "REPLAY_DEGRADATION_UNRESOLVED"],
    ["TENANT_RISK", "TENANT_ISOLATION_RISK_UNRESOLVED"],
    ["OPERATOR_VISIBILITY_REDUCTION", "OPERATOR_VISIBILITY_REDUCED"],
    ["RESTRICTION_ENFORCEMENT_FAILURE", "RESTRICTION_ENFORCEMENT_FAILED"],
    ["NONDETERMINISTIC_WORKFLOW", "REVIEW_WORKFLOW_NONDETERMINISTIC"],
    ["NONDETERMINISTIC_REASONING", "NONDETERMINISTIC_VALIDATION_REASONING"],
    ["REPLAY_DIVERGENCE", "REPLAY_DIVERGENCE"],
    ["HASH_MISMATCH", "INTEGRITY_VERIFICATION_FAILED"],
    ["RECORDING_FAILURE", "ESCALATION_DECISION_RECORDING_FAILED"],
  ] as readonly [EscalationRestrictionScenario, EscalationRestrictionFailure][])("fails closed for %s", (scenario, failure) => {
    const result = determineEscalationRestriction({ scenario });

    expect(result.failures).toContain(failure);
    expect(result.final_decision).toBe("FAIL_CLOSED");
    expect(result.fail_closed).toBe(true);
    expect(result.simulation_authorization_decision).toBe("DENIED");
  });

  it("fails closed when upstream evidence validation is fail-closed", () => {
    const evidenceFailure = determineEscalationRestriction({ scenario: "APPROVED_FOR_SIMULATION", evidence_result: { fail_closed: true } as never });

    expect(evidenceFailure.failures).toContain("ESCALATION_RULES_UNEVALUABLE");
    expect(evidenceFailure.final_decision).toBe("FAIL_CLOSED");
  });

  it("records immutable escalation ledger decisions", () => {
    const result = determineEscalationRestriction({ scenario: "GOVERNANCE_REVIEW_REQUIRED" });

    expect(result.ledger_entry.append_only).toBe(true);
    expect(result.ledger_entry.immutable).toBe(true);
    expect(result.ledger_entry.decision_id).toBe(result.decision.decision_id);
    expect(result.ledger_entry.required_reviewers.length).toBe(result.decision.required_reviewers.length);
  });

  it("replays escalation decisions and detects tampering", () => {
    const result = determineEscalationRestriction({ scenario: "BASELINE" });
    const tampered = { ...result, replay_hash: "tampered" };

    expect(replayEscalationRestrictionDecision(result)).toBe(true);
    expect(replayEscalationRestrictionDecision(tampered)).toBe(false);
  });
});
