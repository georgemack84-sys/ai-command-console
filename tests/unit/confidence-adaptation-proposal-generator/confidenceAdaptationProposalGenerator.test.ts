import { describe, expect, it } from "vitest";
import {
  generateConfidenceAdaptationProposal,
  getConfidenceAdaptationProposalFoundation,
  replayConfidenceAdaptationProposal,
} from "@/services/confidence-adaptation-proposal-generator";
import type {
  ConfidenceAdaptationProposalFailure,
  ConfidenceAdaptationProposalScenario,
} from "@/types/confidence-adaptation-proposal-generator";

describe("Mission Control Phase 10.6.5 Confidence Adaptation Proposal Generator", () => {
  it("publishes the confidence adaptation proposal foundation", () => {
    const foundation = getConfidenceAdaptationProposalFoundation();

    expect(foundation.confidence_adaptation_proposal_generator_version).toBe("confidence-adaptation-proposal-generator/v1");
    expect(foundation.api_surface.generate_proposal).toBe("POST /confidence-adaptation-proposal-generator/analyze");
    expect(foundation.result.validation.state).toBe("CERTIFIED");
  });

  it("generates proposals deterministically", () => {
    const first = generateConfidenceAdaptationProposal({ scenario: "HIGH_PRIORITY" });
    const second = generateConfidenceAdaptationProposal({ scenario: "HIGH_PRIORITY" });

    expect(first.proposals[0].proposal_id).toBe(second.proposals[0].proposal_id);
    expect(first.priorities[0].overall_priority_score).toBe(second.priorities[0].overall_priority_score);
    expect(first.integrity_hash).toBe(second.integrity_hash);
  });

  it("supports all required proposal types", () => {
    expect(generateConfidenceAdaptationProposal({ scenario: "THRESHOLD" }).proposals[0].proposal_type).toBe("CONFIDENCE_THRESHOLD_ADJUSTMENT");
    expect(generateConfidenceAdaptationProposal({ scenario: "EVIDENCE_WEIGHTING" }).proposals[0].proposal_type).toBe("EVIDENCE_WEIGHTING_REFINEMENT");
    expect(generateConfidenceAdaptationProposal({ scenario: "SOURCE_WEIGHTING" }).proposals[0].proposal_type).toBe("SOURCE_WEIGHTING_ADJUSTMENT");
    expect(generateConfidenceAdaptationProposal({ scenario: "UNCERTAINTY_MODELING" }).proposals[0].proposal_type).toBe("ADDITIONAL_UNCERTAINTY_MODELING");
    expect(generateConfidenceAdaptationProposal({ scenario: "MISSION_CALIBRATION" }).proposals[0].proposal_type).toBe("MISSION_SPECIFIC_CALIBRATION");
    expect(generateConfidenceAdaptationProposal({ scenario: "RISK_AWARE" }).proposals[0].proposal_type).toBe("RISK_AWARE_CALIBRATION");
    expect(generateConfidenceAdaptationProposal({ scenario: "GOVERNANCE_SENSITIVE" }).proposals[0].proposal_type).toBe("GOVERNANCE_SENSITIVE_CALIBRATION");
    expect(generateConfidenceAdaptationProposal({ scenario: "OPERATOR_VISIBILITY" }).proposals[0].proposal_type).toBe("OPERATOR_VISIBILITY_IMPROVEMENT");
  });

  it("assigns reproducible priority levels and scores", () => {
    expect(generateConfidenceAdaptationProposal({ scenario: "LOW_PRIORITY" }).priorities[0].priority_level).toBe("LOW");
    expect(generateConfidenceAdaptationProposal({ scenario: "MEDIUM_PRIORITY" }).priorities[0].priority_level).toBe("MEDIUM");
    expect(generateConfidenceAdaptationProposal({ scenario: "HIGH_PRIORITY" }).priorities[0].priority_level).toBe("HIGH");
    expect(generateConfidenceAdaptationProposal({ scenario: "CRITICAL_PRIORITY" }).priorities[0].priority_level).toBe("CRITICAL");
    expect(generateConfidenceAdaptationProposal({ scenario: "CRITICAL_PRIORITY" }).priorities[0].overall_priority_score).toBeGreaterThan(0.7);
  });

  it("includes all mandatory proposal contents", () => {
    const result = generateConfidenceAdaptationProposal({ scenario: "RISK_AWARE" });
    const proposal = result.proposals[0];

    expect(proposal.current_calibration.length).toBeGreaterThan(0);
    expect(proposal.observed_problem.length).toBeGreaterThan(0);
    expect(proposal.supporting_evidence_refs.length).toBeGreaterThan(0);
    expect(proposal.supporting_outcome_refs.length).toBeGreaterThan(0);
    expect(proposal.proposed_calibration_change.length).toBeGreaterThan(0);
    expect(proposal.expected_confidence_gain).toBeGreaterThan(0);
    expect(proposal.potential_risks.length).toBeGreaterThan(0);
    expect(proposal.governance_implications.length).toBeGreaterThan(0);
    expect(proposal.simulation_required).toBe(true);
    expect(proposal.rollback_strategy.length).toBeGreaterThan(0);
    expect(proposal.approval_requirements).toContain("operator_explicit_approval");
    expect(proposal.replay_refs.length).toBeGreaterThan(0);
  });

  it("records immutable proposal registry lifecycle state", () => {
    const result = generateConfidenceAdaptationProposal({ scenario: "THRESHOLD" });
    const proposal = result.proposals[0];
    const priority = result.priorities[0];
    const registryRecord = result.registry_records[0];

    expect(registryRecord.proposal_status).toBe("SIMULATION_REQUIRED");
    expect(registryRecord.governance_status).toBe("REQUIRED");
    expect(registryRecord.approval_status).toBe("OPERATOR_APPROVAL_REQUIRED");
    expect(registryRecord.implementation_status).toBe("NOT_IMPLEMENTED");
    expect(result.registry.append_only).toBe(true);
    expect(result.registry.immutable).toBe(true);
    expect(result.registry.deleted).toBe(false);
    expect(result.registry.type_index[proposal.proposal_type]).toContain(proposal.proposal_id);
    expect(result.registry.priority_index[priority.priority_level]).toContain(proposal.proposal_id);
  });

  it("keeps proposals advisory-only and unable to modify production behavior", () => {
    const result = generateConfidenceAdaptationProposal({ scenario: "CRITICAL_PRIORITY" });
    const proposal = result.proposals[0];

    expect(result.advisory_only).toBe(true);
    expect(result.modifies_production_confidence).toBe(false);
    expect(result.updates_confidence_model).toBe(false);
    expect(result.changes_governance_requirements).toBe(false);
    expect(result.bypasses_simulation).toBe(false);
    expect(result.bypasses_operator_approval).toBe(false);
    expect(result.mutates_historical_records).toBe(false);
    expect(proposal.advisory_only).toBe(true);
  });

  it("replays proposal generation", () => {
    const result = generateConfidenceAdaptationProposal({ scenario: "THRESHOLD" });

    expect(replayConfidenceAdaptationProposal(result)).toBe(true);
  });

  it.each([
    ["MISSING_EVIDENCE", "SUPPORTING_EVIDENCE_MISSING"],
    ["MISSING_OUTCOME", "OUTCOME_VALIDATION_MISSING"],
    ["MISSING_REPLAY", "REPLAY_REFERENCES_MISSING"],
    ["MISSING_GOVERNANCE", "GOVERNANCE_REFERENCES_MISSING"],
    ["MISSING_SIMULATION", "SIMULATION_REQUIREMENT_MISSING"],
    ["MISSING_OPERATOR_APPROVAL", "OPERATOR_APPROVAL_REQUIREMENT_MISSING"],
    ["MISSING_ROLLBACK", "ROLLBACK_STRATEGY_MISSING"],
    ["CROSS_TENANT", "TENANT_ISOLATION_VIOLATED"],
    ["HASH_MISMATCH", "INTEGRITY_HASH_MISMATCH"],
    ["PRODUCTION_MUTATION", "PRODUCTION_CONFIDENCE_MUTATION_DETECTED"],
    ["MODEL_UPDATE", "CONFIDENCE_MODEL_UPDATE_DETECTED"],
    ["GOVERNANCE_BYPASS", "GOVERNANCE_BYPASS_DETECTED"],
    ["SIMULATION_BYPASS", "SIMULATION_BYPASS_DETECTED"],
    ["OPERATOR_APPROVAL_BYPASS", "OPERATOR_APPROVAL_BYPASS_DETECTED"],
    ["HISTORICAL_RECORD_MUTATION", "HISTORICAL_RECORD_MUTATION_DETECTED"],
    ["REGISTRY_MUTATION", "REGISTRY_MUTATION_DETECTED"],
    ["NONDETERMINISTIC", "NONDETERMINISTIC_PROPOSAL_GENERATION"],
    ["FAIL_OPEN", "FAIL_OPEN_BEHAVIOR"],
  ] as readonly [ConfidenceAdaptationProposalScenario, ConfidenceAdaptationProposalFailure][])("fails closed for %s", (scenario, failure) => {
    const result = generateConfidenceAdaptationProposal({ scenario });

    expect(result.validation.certified).toBe(false);
    expect(result.validation.failures).toContain(failure);
    expect(result.updates_confidence_model).toBe(false);
  });

  it("rejects missing outcome validation instead of certifying", () => {
    const result = generateConfidenceAdaptationProposal({ scenario: "MISSING_OUTCOME" });

    expect(result.validation.state).toBe("REJECTED");
    expect(result.validation.outcome_validation_complete).toBe(false);
  });

  it("detects proposal tampering during replay", () => {
    const result = generateConfidenceAdaptationProposal({ scenario: "THRESHOLD" });
    const tampered = { ...result, replay_hash: "tampered" };

    expect(replayConfidenceAdaptationProposal(tampered)).toBe(false);
  });
});
