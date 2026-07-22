import { describe, expect, it } from "vitest";
import {
  generateAdaptationProposals,
  getAdaptationProposalGeneratorFoundation,
  replayAdaptationProposalGeneration,
} from "@/services/adaptation-proposal-generator";
import type { AdaptationProposalGeneratorFailure, AdaptationProposalGeneratorScenario } from "@/types/adaptation-proposal-generator";

describe("Mission Control Phase 10.10.2 Adaptation Proposal Generator", () => {
  it("publishes the adaptation proposal generator contract", () => {
    const foundation = getAdaptationProposalGeneratorFoundation();

    expect(foundation.adaptation_proposal_generator_version).toBe("adaptation-proposal-generator/v1");
    expect(foundation.api_surface.generate_proposals).toBe("POST /adaptation-proposal-generator/generate");
    expect(foundation.api_surface.execution_supported).toBe(false);
    expect(foundation.api_surface.production_mutation_supported).toBe(false);
    expect(foundation.supported_categories).toContain("CONFIDENCE_CALIBRATION");
    expect(foundation.supported_categories).toContain("ROLLBACK_GUIDANCE");
    expect(foundation.result.generation_state).toBe("GENERATED");
  });

  it("generates deterministic proposals from identical adaptive inputs", () => {
    const first = generateAdaptationProposals({ scenario: "BASELINE" });
    const second = generateAdaptationProposals({ scenario: "BASELINE" });

    expect(first.generated_proposals[0]?.generated_proposal_id).toBe(second.generated_proposals[0]?.generated_proposal_id);
    expect(first.opportunities[0]?.integrity_hash).toBe(second.opportunities[0]?.integrity_hash);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
  });

  it("integrates all required adaptive intelligence source domains", () => {
    const result = generateAdaptationProposals();

    expect(result.source_findings.map((finding) => finding.source_domain)).toEqual([
      "OUTCOME_OBSERVATION",
      "RECOMMENDATION_ANALYSIS",
      "PATTERN_INTELLIGENCE",
      "CONFIDENCE_ADAPTATION",
      "RISK_ADAPTATION",
      "STRATEGY_EVOLUTION",
      "OPERATOR_FEEDBACK",
    ]);
    expect(result.source_findings.every((finding) => finding.evidence_refs.length > 0)).toBe(true);
    expect(result.source_findings.every((finding) => finding.replay_refs.length > 0)).toBe(true);
  });

  it.each([
    ["CONFIDENCE_IMPROVEMENT", "CONFIDENCE_CALIBRATION"],
    ["RISK_IMPROVEMENT", "RISK_CALIBRATION"],
    ["EVIDENCE_IMPROVEMENT", "EVIDENCE_REQUIREMENT"],
    ["SIMULATION_IMPROVEMENT", "SIMULATION_SELECTION"],
    ["GOVERNANCE_ROUTING", "GOVERNANCE_ROUTING"],
    ["OPERATOR_VISIBILITY", "OPERATOR_VISIBILITY"],
    ["STRATEGIC_IMPROVEMENT", "STRATEGIC_PATTERN_RESPONSE"],
    ["ROLLBACK_IMPROVEMENT", "ROLLBACK_GUIDANCE"],
    ["PRIORITIZATION_LOGIC", "PRIORITY_WEIGHTING"],
    ["DECISION_PACKAGE_IMPROVEMENT", "DECISION_PACKAGE_FORMAT"],
  ] as const)("classifies %s deterministically", (scenario, category) => {
    const result = generateAdaptationProposals({ scenario });

    expect(result.generated_proposals[0]?.categories).toContain(category);
    expect(result.opportunities[0]?.categories).toContain(category);
    expect(result.generated_proposals[0]?.contract_result.validation_report.certified).toBe(true);
  });

  it("validates every generated proposal against the adaptation proposal contract", () => {
    const result = generateAdaptationProposals();
    const generated = result.generated_proposals[0];

    expect(generated?.contract_result.adaptation_proposal_contract_version).toBe("adaptation-proposal-contract/v1");
    expect(generated?.contract_result.validation_report.certified).toBe(true);
    expect(generated?.contract_result.proposal.simulation_required).toBe(true);
    expect(generated?.contract_result.proposal.approval_required).toBe(true);
    expect(generated?.contract_result.proposal.certification_required).toBe(true);
    expect(generated?.contract_result.proposal.rollback_plan_required).toBe(true);
  });

  it("exposes deterministic observability metrics", () => {
    const result = generateAdaptationProposals();

    expect(result.metrics.proposals_generated).toBe(1);
    expect(result.metrics.proposals_rejected).toBe(0);
    expect(result.metrics.generation_latency_ms).toBe(0);
    expect(result.metrics.evidence_utilization).toBe(1);
    expect(result.metrics.deterministic_replay_success).toBe(true);
    expect(result.metrics.source_distribution.OUTCOME_OBSERVATION).toBe(1);
    expect(result.metrics.governance_evaluation_outcomes).toEqual(["GOVERNANCE_ENFORCED"]);
    expect(result.metrics.operator_impact_classifications).toEqual(["OPERATOR_REVIEW_REQUIRED"]);
  });

  it("keeps generation advisory-only with no execution authority", () => {
    const result = generateAdaptationProposals();

    expect(result.advisory_only).toBe(true);
    expect(result.executes_changes).toBe(false);
    expect(result.deploys_changes).toBe(false);
    expect(result.mutates_production).toBe(false);
    expect(result.mutates_models).toBe(false);
    expect(result.mutates_policy).toBe(false);
    expect(result.bypasses_constitutional_review).toBe(false);
    expect(result.removes_operator_authority).toBe(false);
    expect(result.suppresses_governance_visibility).toBe(false);
  });

  it.each([
    ["MISSING_INPUT", "INPUT_INCOMPLETE"],
    ["MISSING_EVIDENCE", "EVIDENCE_MISSING"],
    ["MISSING_OUTCOMES", "OUTCOME_REFERENCES_MISSING"],
    ["MISSING_REPLAY", "REPLAY_REFERENCES_INCOMPLETE"],
    ["GOVERNANCE_FAILURE", "GOVERNANCE_ANALYSIS_FAILED"],
    ["CONSTITUTIONAL_FAILURE", "CONSTITUTIONAL_ANALYSIS_FAILED"],
    ["AUTHORITY_FAILURE", "AUTHORITY_ANALYSIS_FAILED"],
    ["CONTRACT_VALIDATION_FAILURE", "PROPOSAL_CONTRACT_VALIDATION_FAILED"],
    ["INTEGRITY_FAILURE", "INTEGRITY_VERIFICATION_FAILED"],
    ["TENANT_VIOLATION", "TENANT_ISOLATION_VIOLATED"],
    ["REPLAY_NOT_GUARANTEED", "DETERMINISTIC_REPLAY_NOT_GUARANTEED"],
    ["NONDETERMINISTIC_GENERATION", "NONDETERMINISTIC_GENERATION_DETECTED"],
    ["PRODUCTION_MUTATION_ATTEMPT", "PRODUCTION_MUTATION_ATTEMPT"],
    ["MODEL_MUTATION_ATTEMPT", "MODEL_MUTATION_ATTEMPT"],
    ["POLICY_MUTATION_ATTEMPT", "POLICY_MUTATION_ATTEMPT"],
    ["CONSTITUTIONAL_BYPASS_ATTEMPT", "CONSTITUTIONAL_BYPASS_ATTEMPT"],
    ["OPERATOR_AUTHORITY_REMOVAL", "OPERATOR_AUTHORITY_REMOVAL_ATTEMPT"],
    ["GOVERNANCE_VISIBILITY_SUPPRESSION", "GOVERNANCE_VISIBILITY_SUPPRESSION_ATTEMPT"],
  ] as readonly [AdaptationProposalGeneratorScenario, AdaptationProposalGeneratorFailure][])("fails closed for %s", (scenario, failure) => {
    const result = generateAdaptationProposals({ scenario });

    expect(result.generation_state).not.toBe("GENERATED");
    expect(result.failures).toContain(failure);
    expect(result.metrics.validation_failures).toContain(failure);
    expect(result.advisory_only).toBe(true);
    expect(result.mutates_production).toBe(false);
  });

  it("keeps missing evidence pending instead of generated", () => {
    const result = generateAdaptationProposals({ scenario: "MISSING_EVIDENCE" });

    expect(result.generation_state).toBe("PENDING_EVIDENCE");
    expect(result.evidence_backed).toBe(false);
  });

  it("replays generation and detects tampering", () => {
    const result = generateAdaptationProposals();
    const tampered = { ...result, replay_hash: "tampered" };

    expect(replayAdaptationProposalGeneration(result)).toBe(true);
    expect(replayAdaptationProposalGeneration(tampered)).toBe(false);
  });
});
