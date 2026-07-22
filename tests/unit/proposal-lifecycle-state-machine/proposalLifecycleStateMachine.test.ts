import { describe, expect, it } from "vitest";
import {
  evaluateProposalLifecycle,
  getProposalLifecycleFoundation,
  replayProposalLifecycle,
} from "@/services/proposal-lifecycle-state-machine";
import type {
  ProposalLifecycleFailure,
  ProposalLifecycleScenario,
  ProposalLifecycleState,
} from "@/types/proposal-lifecycle-state-machine";

describe("Mission Control Phase 10.10.9 Proposal Lifecycle State Machine", () => {
  const expectedStates: readonly ProposalLifecycleState[] = [
    "DRAFT",
    "VALIDATED",
    "REQUIRES_SIMULATION",
    "REQUIRES_GOVERNANCE_REVIEW",
    "REQUIRES_OPERATOR_REVIEW",
    "APPROVED_FOR_CERTIFICATION",
    "CERTIFIED",
    "REJECTED",
    "SUPPRESSED",
    "ROLLED_BACK",
    "ARCHIVED",
  ];

  it("publishes the proposal lifecycle state machine contract", () => {
    const foundation = getProposalLifecycleFoundation();

    expect(foundation.proposal_lifecycle_state_machine_version).toBe("proposal-lifecycle-state-machine/v1");
    expect(foundation.api_surface.evaluate_lifecycle).toBe("POST /proposal-lifecycle-state-machine/evaluate");
    expect(foundation.api_surface.implementation_authorization_supported).toBe(false);
    expect(foundation.api_surface.automatic_deployment_supported).toBe(false);
    expect(foundation.canonical_states).toEqual(expectedStates);
    expect(foundation.result.state_machine_state).toBe("EVALUATED");
  });

  it("defines legal transitions for every canonical state", () => {
    const allowed = getProposalLifecycleFoundation().allowed_transitions;

    expect(allowed.DRAFT).toEqual(["VALIDATED", "REJECTED"]);
    expect(allowed.VALIDATED).toEqual(["REQUIRES_SIMULATION", "REQUIRES_GOVERNANCE_REVIEW", "REQUIRES_OPERATOR_REVIEW", "SUPPRESSED", "REJECTED"]);
    expect(allowed.REQUIRES_SIMULATION).toContain("REQUIRES_GOVERNANCE_REVIEW");
    expect(allowed.REQUIRES_GOVERNANCE_REVIEW).toContain("REQUIRES_OPERATOR_REVIEW");
    expect(allowed.REQUIRES_OPERATOR_REVIEW).toContain("APPROVED_FOR_CERTIFICATION");
    expect(allowed.APPROVED_FOR_CERTIFICATION).toContain("CERTIFIED");
    expect(allowed.CERTIFIED).toEqual(["ROLLED_BACK", "ARCHIVED"]);
    expect(allowed.ARCHIVED).toEqual([]);
  });

  it("evaluates canonical lifecycle progression deterministically", () => {
    const first = evaluateProposalLifecycle();
    const second = evaluateProposalLifecycle();

    expect(first.transitions.map((transition) => transition.integrity_hash)).toEqual(second.transitions.map((transition) => transition.integrity_hash));
    expect(first.current_states).toEqual(second.current_states);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
  });

  it("moves proposals through the canonical flow without authorizing deployment", () => {
    const result = evaluateProposalLifecycle();
    const states = result.transitions.map((transition) => transition.destination_state);

    expect(states).toEqual(["VALIDATED", "REQUIRES_SIMULATION", "REQUIRES_GOVERNANCE_REVIEW", "REQUIRES_OPERATOR_REVIEW", "APPROVED_FOR_CERTIFICATION", "CERTIFIED", "ARCHIVED"]);
    expect(Object.values(result.current_states)).toEqual(["ARCHIVED"]);
    expect(result.transitions.every((transition) => transition.outcome === "ACCEPTED")).toBe(true);
    expect(result.transitions.every((transition) => transition.authorizes_implementation === false)).toBe(true);
    expect(result.transitions.every((transition) => transition.performs_deployment === false)).toBe(true);
  });

  it.each([
    ["REJECTION_PATH", ["VALIDATED", "REJECTED", "ARCHIVED"]],
    ["SUPPRESSION_PATH", ["VALIDATED", "SUPPRESSED", "ARCHIVED"]],
    ["ROLLBACK_PATH", ["VALIDATED", "REQUIRES_SIMULATION", "REQUIRES_GOVERNANCE_REVIEW", "REQUIRES_OPERATOR_REVIEW", "APPROVED_FOR_CERTIFICATION", "CERTIFIED", "ROLLED_BACK", "ARCHIVED"]],
  ] as readonly [ProposalLifecycleScenario, readonly ProposalLifecycleState[]][])("supports %s deterministically", (scenario, expectedDestinations) => {
    const result = evaluateProposalLifecycle({ scenario });

    expect(result.state_machine_state).toBe("EVALUATED");
    expect(result.transitions.map((transition) => transition.destination_state)).toEqual(expectedDestinations);
    expect(result.transitions.every((transition) => transition.outcome === "ACCEPTED")).toBe(true);
    expect(Object.values(result.current_states)).toEqual([expectedDestinations.at(-1)]);
  });

  it.each([
    ["UNAUTHORIZED_DESTINATION", "DRAFT", "CERTIFIED"],
    ["GOVERNANCE_BYPASS", "DRAFT", "CERTIFIED"],
    ["OPERATOR_REVIEW_BYPASS", "VALIDATED", "APPROVED_FOR_CERTIFICATION"],
    ["CERTIFICATION_BYPASS", "REQUIRES_OPERATOR_REVIEW", "CERTIFIED"],
    ["ARCHIVED_REACTIVATION", "ARCHIVED", "DRAFT"],
    ["REJECTED_REACTIVATION", "REJECTED", "VALIDATED"],
  ] as readonly [ProposalLifecycleScenario, ProposalLifecycleState, ProposalLifecycleState][])("audits illegal transition %s", (scenario, source, destination) => {
    const result = evaluateProposalLifecycle({ scenario });
    const transition = result.transitions[0];

    expect(transition?.source_state).toBe(source);
    expect(transition?.destination_state).toBe(destination);
    expect(transition?.allowed_transition).toBe(false);
    expect(transition?.outcome).toBe("REJECTED_AUDITED");
    expect(transition?.audit_event).toBe(true);
    expect(result.metrics.illegal_transition_attempts).toBe(1);
  });

  it("publishes lifecycle metrics", () => {
    const result = evaluateProposalLifecycle({ scenario: "ROLLBACK_PATH" });

    expect(result.metrics.proposals_by_state.ARCHIVED).toBe(1);
    expect(result.metrics.transition_frequency["CERTIFIED->ROLLED_BACK"]).toBe(1);
    expect(result.metrics.transition_latency_ms).toBe(0);
    expect(result.metrics.rejected_transitions).toBe(0);
    expect(result.metrics.certification_progression).toBe(1);
    expect(result.metrics.rollback_frequency).toBe(1);
    expect(result.metrics.archival_frequency).toBe(1);
    expect(result.metrics.replay_success_rate).toBe(1);
  });

  it("keeps lifecycle progression advisory-only and non-mutating", () => {
    const result = evaluateProposalLifecycle();
    const transition = result.transitions[0];

    expect(result.advisory_only).toBe(true);
    expect(result.modifies_proposals).toBe(false);
    expect(result.rewrites_lifecycle_history).toBe(false);
    expect(result.overwrites_historical_states).toBe(false);
    expect(result.authorizes_implementation).toBe(false);
    expect(result.performs_automatic_deployment).toBe(false);
    expect(result.changes_production_behavior).toBe(false);
    expect(transition?.modifies_proposal).toBe(false);
    expect(transition?.authorizes_implementation).toBe(false);
  });

  it.each([
    ["INVALID_CURRENT_STATE", "CURRENT_STATE_INVALID"],
    ["UNAUTHORIZED_DESTINATION", "DESTINATION_STATE_UNAUTHORIZED"],
    ["PREREQUISITES_INCOMPLETE", "TRANSITION_PREREQUISITES_INCOMPLETE"],
    ["GOVERNANCE_FAILURE", "GOVERNANCE_VALIDATION_FAILED"],
    ["CONSTITUTIONAL_FAILURE", "CONSTITUTIONAL_VALIDATION_FAILED"],
    ["AUTHORITY_VIOLATION", "AUTHORITY_BOUNDARY_VIOLATED"],
    ["REPLAY_FAILURE", "REPLAY_VERIFICATION_FAILED"],
    ["INTEGRITY_FAILURE", "INTEGRITY_VERIFICATION_FAILED"],
    ["NONDETERMINISTIC_TRANSITION", "DETERMINISTIC_TRANSITION_NOT_GUARANTEED"],
    ["TENANT_VIOLATION", "TENANT_ISOLATION_VIOLATED"],
    ["LEDGER_UNAVAILABLE", "LEDGER_HISTORY_UNAVAILABLE"],
    ["ARCHIVED_REACTIVATION", "ARCHIVED_PROPOSAL_REACTIVATION_ATTEMPT"],
    ["REJECTED_REACTIVATION", "REJECTED_PROPOSAL_REACTIVATION_ATTEMPT"],
    ["GOVERNANCE_BYPASS", "GOVERNANCE_BYPASS_ATTEMPT"],
    ["OPERATOR_REVIEW_BYPASS", "OPERATOR_REVIEW_BYPASS_ATTEMPT"],
    ["CERTIFICATION_BYPASS", "CERTIFICATION_BYPASS_ATTEMPT"],
    ["HISTORY_REWRITE_ATTEMPT", "LIFECYCLE_HISTORY_REWRITE_ATTEMPT"],
    ["STATE_OVERWRITE_ATTEMPT", "HISTORICAL_STATE_OVERWRITE_ATTEMPT"],
    ["PROPOSAL_MUTATION_ATTEMPT", "PROPOSAL_CONTENT_MUTATION_ATTEMPT"],
    ["IMPLEMENTATION_ATTEMPT", "PRODUCTION_IMPLEMENTATION_AUTHORIZATION_ATTEMPT"],
    ["AUTOMATIC_DEPLOYMENT_ATTEMPT", "AUTOMATIC_DEPLOYMENT_ATTEMPT"],
  ] as readonly [ProposalLifecycleScenario, ProposalLifecycleFailure][])("fails closed for %s", (scenario, failure) => {
    const result = evaluateProposalLifecycle({ scenario });

    expect(result.state_machine_state).toBe("FAIL_CLOSED");
    expect(result.failures).toContain(failure);
    expect(result.metrics.lifecycle_validation_failures).toContain(failure);
    expect(result.transitions.every((transition) => transition.outcome === "REJECTED_AUDITED")).toBe(true);
    expect(result.authorizes_implementation).toBe(false);
  });

  it("replays lifecycle evaluation and detects tampering", () => {
    const result = evaluateProposalLifecycle({ scenario: "ROLLBACK_PATH" });
    const tampered = { ...result, replay_hash: "tampered" };

    expect(replayProposalLifecycle(result)).toBe(true);
    expect(replayProposalLifecycle(tampered)).toBe(false);
  });
});
