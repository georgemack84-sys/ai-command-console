import { describe, expect, it } from "vitest";
import {
  getProposalValidationFoundation,
  replayProposalValidation,
  validateProposalIntegrity,
} from "@/services/proposal-validation-integrity-engine";
import type {
  ProposalValidationCategory,
  ProposalValidationFailure,
  ProposalValidationOutcome,
  ProposalValidationScenario,
} from "@/types/proposal-validation-integrity-engine";

describe("Mission Control Phase 10.10.11 Proposal Validation & Integrity Engine", () => {
  const expectedCategories: readonly ProposalValidationCategory[] = [
    "IDENTITY",
    "REFERENCES",
    "EVIDENCE",
    "REPLAY",
    "INTEGRITY",
    "TENANT_ISOLATION",
    "SCORING",
    "LINEAGE",
    "SIMULATION_ROUTING",
    "APPROVAL_ROUTING",
    "ROLLBACK_AVAILABILITY",
  ];

  const expectedOutcomes: readonly ProposalValidationOutcome[] = ["VALID", "INVALID", "INCOMPLETE", "CONFLICTING", "REQUIRES_REVIEW"];

  it("publishes the proposal validation integrity contract", () => {
    const foundation = getProposalValidationFoundation();

    expect(foundation.proposal_validation_integrity_engine_version).toBe("proposal-validation-integrity-engine/v1");
    expect(foundation.api_surface.validate_proposals).toBe("POST /proposal-validation-integrity-engine/validate");
    expect(foundation.api_surface.proposal_mutation_supported).toBe(false);
    expect(foundation.api_surface.implementation_authorization_supported).toBe(false);
    expect(foundation.supported_categories).toEqual(expectedCategories);
    expect(foundation.supported_outcomes).toEqual(expectedOutcomes);
    expect(foundation.result.validation_state).toBe("VALIDATED");
  });

  it("validates proposals deterministically", () => {
    const first = validateProposalIntegrity();
    const second = validateProposalIntegrity();

    expect(first.validation_reports[0]?.integrity_hash).toBe(second.validation_reports[0]?.integrity_hash);
    expect(first.validation_reports[0]?.completed_checks.map((check) => check.integrity_hash)).toEqual(second.validation_reports[0]?.completed_checks.map((check) => check.integrity_hash));
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
  });

  it("produces a complete validation report for valid proposals", () => {
    const report = validateProposalIntegrity().validation_reports[0];

    expect(report?.validation_outcome).toBe("VALID");
    expect(report?.completed_checks.map((check) => check.category)).toEqual(expectedCategories);
    expect(report?.failed_checks).toEqual([]);
    expect(report?.integrity_verification).toBe(true);
    expect(report?.replay_verification).toBe(true);
    expect(report?.tenant_isolation_verification).toBe(true);
    expect(report?.may_progress_to_governance_review).toBe(true);
  });

  it("keeps validation advisory-only and non-mutating", () => {
    const result = validateProposalIntegrity();
    const report = result.validation_reports[0];

    expect(result.advisory_only).toBe(true);
    expect(result.proposal_contents_unchanged).toBe(true);
    expect(result.modifies_proposals).toBe(false);
    expect(result.modifies_scores).toBe(false);
    expect(result.changes_governance_decisions).toBe(false);
    expect(result.authorizes_implementation).toBe(false);
    expect(report?.modifies_proposal).toBe(false);
    expect(report?.modifies_scores).toBe(false);
    expect(report?.authorizes_implementation).toBe(false);
  });

  it.each([
    ["INCOMPLETE", "ROLLBACK_MISSING", "ROLLBACK_REQUIREMENTS_MISSING"],
    ["CONFLICTING", "CONTRADICTORY_REFERENCES", "CONTRADICTORY_REFERENCES_DETECTED"],
    ["REQUIRES_REVIEW", "AMBIGUOUS_EVIDENCE", "AMBIGUOUS_EVIDENCE_REQUIRES_REVIEW"],
  ] as readonly [ProposalValidationOutcome, ProposalValidationScenario, ProposalValidationFailure][])("assigns %s outcome deterministically", (outcome, scenario, failure) => {
    const result = validateProposalIntegrity({ scenario });
    const report = result.validation_reports[0];

    expect(result.validation_state).toBe("FAIL_CLOSED");
    expect(result.validation_outcome).toBe(outcome);
    expect(result.failures).toContain(failure);
    expect(report?.validation_outcome).toBe(outcome);
    expect(report?.may_progress_to_governance_review).toBe(false);
  });

  it("publishes validation metrics", () => {
    const result = validateProposalIntegrity();

    expect(result.metrics.proposals_validated).toBe(1);
    expect(result.metrics.validation_success_rate).toBe(1);
    expect(result.metrics.validation_failures).toBe(0);
    expect(result.metrics.validation_outcomes.VALID).toBe(1);
    expect(result.metrics.integrity_verification_failures).toBe(0);
    expect(result.metrics.replay_verification_failures).toBe(0);
    expect(result.metrics.tenant_isolation_violations).toBe(0);
    expect(result.metrics.validation_latency_ms).toBe(0);
    expect(result.metrics.deterministic_replay_success).toBe(true);
  });

  it.each([
    ["CONTRACT_INVALID", "PROPOSAL_CONTRACT_INVALID", "INVALID"],
    ["IDENTITY_INVALID", "PROPOSAL_IDENTITY_INVALID", "INVALID"],
    ["MISSING_REFERENCES", "REQUIRED_REFERENCES_MISSING", "INCOMPLETE"],
    ["EVIDENCE_FAILURE", "EVIDENCE_VERIFICATION_FAILED", "INCOMPLETE"],
    ["REPLAY_FAILURE", "REPLAY_VERIFICATION_FAILED", "INVALID"],
    ["INTEGRITY_FAILURE", "INTEGRITY_VERIFICATION_FAILED", "INVALID"],
    ["TENANT_VIOLATION", "TENANT_ISOLATION_VIOLATED", "INVALID"],
    ["SCORING_INCONSISTENT", "PROPOSAL_SCORING_INCONSISTENT", "INVALID"],
    ["LINEAGE_INCOMPLETE", "PROPOSAL_LINEAGE_INCOMPLETE", "INCOMPLETE"],
    ["SIMULATION_ROUTING_INVALID", "SIMULATION_ROUTING_INVALID", "INVALID"],
    ["APPROVAL_ROUTING_INVALID", "APPROVAL_ROUTING_INVALID", "INVALID"],
    ["ROLLBACK_MISSING", "ROLLBACK_REQUIREMENTS_MISSING", "INCOMPLETE"],
    ["NONDETERMINISTIC_VALIDATION", "DETERMINISTIC_VALIDATION_NOT_GUARANTEED", "INVALID"],
    ["CONTRADICTORY_REFERENCES", "CONTRADICTORY_REFERENCES_DETECTED", "CONFLICTING"],
    ["INCONSISTENT_ROUTING", "INCONSISTENT_ROUTING_DETECTED", "CONFLICTING"],
    ["CONFLICTING_LINEAGE", "CONFLICTING_LINEAGE_DETECTED", "CONFLICTING"],
    ["AMBIGUOUS_EVIDENCE", "AMBIGUOUS_EVIDENCE_REQUIRES_REVIEW", "REQUIRES_REVIEW"],
    ["EXCEPTIONAL_GOVERNANCE", "EXCEPTIONAL_GOVERNANCE_REVIEW_REQUIRED", "REQUIRES_REVIEW"],
    ["CERTIFICATION_QUESTION", "UNRESOLVED_CERTIFICATION_QUESTION", "REQUIRES_REVIEW"],
    ["PROPOSAL_MUTATION_ATTEMPT", "PROPOSAL_CONTENT_MUTATION_ATTEMPT", "INVALID"],
    ["SCORE_MUTATION_ATTEMPT", "PROPOSAL_SCORE_MUTATION_ATTEMPT", "INVALID"],
    ["FABRICATED_VALIDATION", "VALIDATION_RESULT_FABRICATION_ATTEMPT", "INVALID"],
    ["GOVERNANCE_BYPASS", "GOVERNANCE_BYPASS_ATTEMPT", "INVALID"],
    ["REPLAY_BYPASS", "REPLAY_BYPASS_ATTEMPT", "INVALID"],
    ["INTEGRITY_BYPASS", "INTEGRITY_BYPASS_ATTEMPT", "INVALID"],
    ["TENANT_BYPASS", "TENANT_ISOLATION_BYPASS_ATTEMPT", "INVALID"],
    ["IMPLEMENTATION_ATTEMPT", "IMPLEMENTATION_AUTHORIZATION_ATTEMPT", "INVALID"],
  ] as readonly [ProposalValidationScenario, ProposalValidationFailure, ProposalValidationOutcome][])("fails closed for %s", (scenario, failure, outcome) => {
    const result = validateProposalIntegrity({ scenario });

    expect(result.validation_state).toBe("FAIL_CLOSED");
    expect(result.validation_outcome).toBe(outcome);
    expect(result.failures).toContain(failure);
    expect(result.metrics.validation_failure_reasons).toContain(failure);
    expect(result.modifies_proposals).toBe(false);
    expect(result.authorizes_implementation).toBe(false);
  });

  it("replays proposal validation and detects tampering", () => {
    const result = validateProposalIntegrity();
    const tampered = { ...result, replay_hash: "tampered" };

    expect(replayProposalValidation(result)).toBe(true);
    expect(replayProposalValidation(tampered)).toBe(false);
  });
});
