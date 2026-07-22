import { describe, expect, it } from "vitest";
import {
  getAdaptationProposalContractFoundation,
  replayAdaptationProposalContract,
  validateAdaptationProposalContract,
} from "@/services/adaptation-proposal-contract";
import type { AdaptationProposalFailure, AdaptationProposalScenario } from "@/types/adaptation-proposal-contract";

describe("Mission Control Phase 10.10.1 Adaptation Proposal Contract", () => {
  it("publishes the canonical adaptation proposal contract", () => {
    const foundation = getAdaptationProposalContractFoundation();

    expect(foundation.adaptation_proposal_contract_version).toBe("adaptation-proposal-contract/v1");
    expect(foundation.api_surface.validate_proposal).toBe("POST /adaptation-proposal-contract/validate");
    expect(foundation.api_surface.production_mutation_supported).toBe(false);
    expect(foundation.api_surface.operator_bypass_supported).toBe(false);
    expect(foundation.schema_fields).toContain("proposal_id");
    expect(foundation.schema_fields).toContain("integrity_hash");
    expect(foundation.legal_lifecycle_states).toContain("REQUIRES_SIMULATION");
    expect(foundation.result.validation_state).toBe("CERTIFIED");
  });

  it("constructs proposals deterministically", () => {
    const first = validateAdaptationProposalContract({ scenario: "BASELINE" });
    const second = validateAdaptationProposalContract({ scenario: "BASELINE" });

    expect(first.proposal.proposal_id).toBe(second.proposal.proposal_id);
    expect(first.proposal.integrity_hash).toBe(second.proposal.integrity_hash);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
  });

  it("defines the canonical proposal identity, scope, intent, and lineage", () => {
    const result = validateAdaptationProposalContract();
    const proposal = result.proposal;

    expect(proposal.proposal_version).toBe("adaptation-proposal/v1");
    expect(proposal.contract_version).toBe("adaptation-proposal-contract/v1");
    expect(proposal.tenant_id).toBeTruthy();
    expect(proposal.mission_scope).toBeTruthy();
    expect(proposal.workflow_scope).toBeTruthy();
    expect(proposal.capability_scope).toBeTruthy();
    expect(proposal.adaptation_type).toBe("STRATEGY_IMPROVEMENT");
    expect(proposal.proposal_summary).toBeTruthy();
    expect(proposal.proposed_change).toBeTruthy();
    expect(proposal.reason_for_change).toBeTruthy();
    expect(proposal.lineage_refs.length).toBeGreaterThan(0);
  });

  it("supports all canonical adaptation types", () => {
    expect(validateAdaptationProposalContract({ scenario: "CONFIDENCE" }).proposal.adaptation_type).toBe("CONFIDENCE_CALIBRATION");
    expect(validateAdaptationProposalContract({ scenario: "RISK" }).proposal.adaptation_type).toBe("RISK_RECALIBRATION");
    expect(validateAdaptationProposalContract({ scenario: "GOVERNANCE" }).proposal.adaptation_type).toBe("GOVERNANCE_REFINEMENT");
    expect(validateAdaptationProposalContract({ scenario: "EVIDENCE_REQUIREMENT" }).proposal.adaptation_type).toBe("EVIDENCE_REQUIREMENT");
    expect(validateAdaptationProposalContract({ scenario: "SIMULATION_REQUIREMENT" }).proposal.adaptation_type).toBe("SIMULATION_REQUIREMENT");
    expect(validateAdaptationProposalContract({ scenario: "OPERATOR_WORKFLOW" }).proposal.adaptation_type).toBe("OPERATOR_WORKFLOW");
  });

  it("requires evidence, feedback, outcomes, replay, and simulation history", () => {
    const proposal = validateAdaptationProposalContract().proposal;

    expect(proposal.supporting_outcome_refs.length).toBeGreaterThan(0);
    expect(proposal.supporting_pattern_refs.length).toBeGreaterThan(0);
    expect(proposal.supporting_feedback_refs.length).toBeGreaterThan(0);
    expect(proposal.supporting_evidence_refs.length).toBeGreaterThan(0);
    expect(proposal.supporting_replay_history_refs.length).toBeGreaterThan(0);
    expect(proposal.supporting_simulation_history_refs.length).toBeGreaterThan(0);
  });

  it("requires benefit, risk, governance, constitutional, authority, and operator analyses", () => {
    const result = validateAdaptationProposalContract();
    const proposal = result.proposal;

    expect(proposal.expected_benefit.required).toBe(true);
    expect(proposal.expected_risk.required).toBe(true);
    expect(proposal.governance_impact.required).toBe(true);
    expect(proposal.constitutional_impact.required).toBe(true);
    expect(proposal.authority_impact.required).toBe(true);
    expect(proposal.operator_impact.required).toBe(true);
    expect(result.validation_report.governance_complete).toBe(true);
    expect(result.validation_report.constitutional_complete).toBe(true);
    expect(result.validation_report.authority_complete).toBe(true);
  });

  it("requires simulation, replay, approval, certification, and rollback before advancement", () => {
    const proposal = validateAdaptationProposalContract().proposal;

    expect(proposal.simulation_required).toBe(true);
    expect(proposal.replay_required).toBe(true);
    expect(proposal.approval_required).toBe(true);
    expect(proposal.certification_required).toBe(true);
    expect(proposal.rollback_plan_required).toBe(true);
    expect(proposal.approval_requirements.operator_approval_required).toBe(true);
    expect(proposal.certification_requirements.replay_validation_required).toBe(true);
    expect(proposal.rollback_plan.rollback_evidence_refs.length).toBeGreaterThan(0);
  });

  it("keeps the contract advisory-only and non-mutating", () => {
    const result = validateAdaptationProposalContract();
    const proposal = result.proposal;

    expect(result.advisory_only).toBe(true);
    expect(proposal.advisory_only).toBe(true);
    expect(proposal.mutates_production).toBe(false);
    expect(proposal.mutates_policy).toBe(false);
    expect(proposal.deploys_recommendations).toBe(false);
    expect(proposal.retrains_models).toBe(false);
    expect(proposal.changes_governance).toBe(false);
    expect(proposal.calibrates_confidence).toBe(false);
    expect(proposal.calibrates_risk).toBe(false);
    expect(proposal.mutates_strategy).toBe(false);
    expect(proposal.modifies_evidence).toBe(false);
    expect(proposal.bypasses_operator).toBe(false);
  });

  it.each([
    ["MISSING_PROPOSAL_ID", "PROPOSAL_ID_MISSING"],
    ["MISSING_TENANT", "TENANT_MISSING"],
    ["MISSING_ADAPTATION_TYPE", "ADAPTATION_TYPE_MISSING"],
    ["MISSING_EVIDENCE", "EVIDENCE_MISSING"],
    ["MISSING_REPLAY", "REPLAY_REFERENCES_MISSING"],
    ["MISSING_GOVERNANCE_ANALYSIS", "GOVERNANCE_ANALYSIS_MISSING"],
    ["MISSING_CONSTITUTIONAL_ANALYSIS", "CONSTITUTIONAL_ANALYSIS_MISSING"],
    ["MISSING_AUTHORITY_ANALYSIS", "AUTHORITY_ANALYSIS_MISSING"],
    ["MISSING_BENEFIT_ANALYSIS", "BENEFIT_ANALYSIS_MISSING"],
    ["MISSING_RISK_ANALYSIS", "RISK_ANALYSIS_MISSING"],
    ["MISSING_OPERATOR_IMPACT", "OPERATOR_IMPACT_MISSING"],
    ["INVALID_LIFECYCLE_STATE", "LIFECYCLE_STATE_INVALID"],
    ["INVALID_INTEGRITY_HASH", "INTEGRITY_HASH_INVALID"],
    ["CROSS_TENANT_REFERENCE", "CROSS_TENANT_REFERENCE_DETECTED"],
    ["SCHEMA_VERSION_MISMATCH", "SCHEMA_VERSION_MISMATCH"],
    ["LINEAGE_INCOMPLETE", "PROPOSAL_LINEAGE_INCOMPLETE"],
    ["ADVISORY_ONLY_VIOLATION", "ADVISORY_ONLY_GUARANTEE_VIOLATED"],
    ["PRODUCTION_MUTATION_ATTEMPT", "PRODUCTION_MUTATION_ATTEMPT"],
    ["POLICY_MUTATION_ATTEMPT", "POLICY_MUTATION_ATTEMPT"],
    ["RECOMMENDATION_DEPLOYMENT_ATTEMPT", "RECOMMENDATION_DEPLOYMENT_ATTEMPT"],
    ["MODEL_RETRAINING_ATTEMPT", "MODEL_RETRAINING_ATTEMPT"],
    ["GOVERNANCE_CHANGE_ATTEMPT", "GOVERNANCE_CHANGE_ATTEMPT"],
    ["CONFIDENCE_CALIBRATION_ATTEMPT", "CONFIDENCE_CALIBRATION_ATTEMPT"],
    ["RISK_CALIBRATION_ATTEMPT", "RISK_CALIBRATION_ATTEMPT"],
    ["STRATEGY_MUTATION_ATTEMPT", "STRATEGY_MUTATION_ATTEMPT"],
    ["EVIDENCE_MODIFICATION_ATTEMPT", "EVIDENCE_MODIFICATION_ATTEMPT"],
    ["OPERATOR_BYPASS_ATTEMPT", "OPERATOR_BYPASS_ATTEMPT"],
  ] as readonly [AdaptationProposalScenario, AdaptationProposalFailure][])("fails closed for %s", (scenario, failure) => {
    const result = validateAdaptationProposalContract({ scenario });

    expect(result.validation_report.certified).toBe(false);
    expect(result.validation_state).toBe("FAILED");
    expect(result.failures).toContain(failure);
    expect(result.fail_closed).toBe(true);
    expect(result.advisory_only).toBe(true);
  });

  it("replays contract validation and detects tampering", () => {
    const result = validateAdaptationProposalContract();
    const tampered = { ...result, replay_hash: "tampered" };

    expect(replayAdaptationProposalContract(result)).toBe(true);
    expect(replayAdaptationProposalContract(tampered)).toBe(false);
  });
});
