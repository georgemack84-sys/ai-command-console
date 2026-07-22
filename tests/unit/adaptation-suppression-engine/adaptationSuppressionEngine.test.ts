import { describe, expect, it } from "vitest";
import {
  evaluateAdaptationSuppression,
  getAdaptationSuppressionFoundation,
  replayAdaptationSuppression,
} from "@/services/adaptation-suppression-engine";
import type { AdaptationSuppressionFailure, AdaptationSuppressionRule, AdaptationSuppressionScenario } from "@/types/adaptation-suppression-engine";

describe("Mission Control Phase 10.10.5 Adaptation Suppression Engine", () => {
  it("publishes the adaptation suppression engine contract", () => {
    const foundation = getAdaptationSuppressionFoundation();

    expect(foundation.adaptation_suppression_engine_version).toBe("adaptation-suppression-engine/v1");
    expect(foundation.api_surface.evaluate_suppression).toBe("POST /adaptation-suppression-engine/evaluate");
    expect(foundation.api_surface.proposal_content_mutation_supported).toBe(false);
    expect(foundation.api_surface.approval_supported).toBe(false);
    expect(foundation.supported_outcomes).toEqual(["SUPPRESSED", "REQUIRES_REWORK", "RETURN_FOR_ANALYSIS", "CONTINUE"]);
    expect(foundation.supported_rules).toContain("WEAK_EVIDENCE");
    expect(foundation.supported_rules).toContain("ROLLBACK_UNAVAILABLE");
    expect(foundation.result.suppression_state).toBe("EVALUATED");
  });

  it("evaluates suppression deterministically", () => {
    const first = evaluateAdaptationSuppression({ scenario: "BASELINE" });
    const second = evaluateAdaptationSuppression({ scenario: "BASELINE" });

    expect(first.suppression_decisions[0]?.outcome).toBe(second.suppression_decisions[0]?.outcome);
    expect(first.suppression_decisions[0]?.integrity_hash).toBe(second.suppression_decisions[0]?.integrity_hash);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
  });

  it("continues clean proposals without implying approval", () => {
    const result = evaluateAdaptationSuppression();
    const decision = result.suppression_decisions[0];

    expect(decision?.outcome).toBe("CONTINUE");
    expect(decision?.can_continue_downstream).toBe(true);
    expect(decision?.approves_proposal).toBe(false);
    expect(decision?.implements_proposal).toBe(false);
    expect(decision?.rationale).toContain("not approval");
  });

  it.each([
    ["WEAK_EVIDENCE", "WEAK_EVIDENCE", "REQUIRES_REWORK"],
    ["UNCLEAR_BENEFIT", "UNCLEAR_BENEFIT", "REQUIRES_REWORK"],
    ["EXCESSIVE_RISK", "EXCESSIVE_RISK", "REQUIRES_REWORK"],
    ["INCOMPLETE_REPLAY", "INCOMPLETE_REPLAY", "SUPPRESSED"],
    ["UNRESOLVED_GOVERNANCE", "UNRESOLVED_GOVERNANCE", "SUPPRESSED"],
    ["UNRESOLVED_AUTHORITY", "UNRESOLVED_AUTHORITY", "SUPPRESSED"],
    ["DUPLICATE_PROPOSAL", "DUPLICATE_PROPOSAL", "RETURN_FOR_ANALYSIS"],
    ["CERTIFICATION_CONFLICT", "CERTIFICATION_CONFLICT", "SUPPRESSED"],
    ["RESTRICTED_LEARNING_DOMAIN", "RESTRICTED_LEARNING_DOMAIN", "SUPPRESSED"],
    ["REDUCED_EXPLAINABILITY", "REDUCED_EXPLAINABILITY", "REQUIRES_REWORK"],
    ["INCREASED_OPERATOR_CONFUSION", "INCREASED_OPERATOR_CONFUSION", "REQUIRES_REWORK"],
    ["ROLLBACK_UNAVAILABLE", "ROLLBACK_UNAVAILABLE", "REQUIRES_REWORK"],
  ] as readonly [AdaptationSuppressionScenario, AdaptationSuppressionRule, string][])("applies %s deterministically", (scenario, rule, outcome) => {
    const result = evaluateAdaptationSuppression({ scenario });
    const decision = result.suppression_decisions[0];

    expect(decision?.triggered_rules).toContain(rule);
    expect(decision?.outcome).toBe(outcome);
    expect(decision?.explanation.violated_rules).toContain(rule);
    expect(decision?.explanation.remediation_guidance.length).toBeGreaterThan(0);
  });

  it("routes duplicates to consolidation analysis without deleting them", () => {
    const decision = evaluateAdaptationSuppression({ scenario: "DUPLICATE_PROPOSAL" }).suppression_decisions[0];

    expect(decision?.outcome).toBe("RETURN_FOR_ANALYSIS");
    expect(decision?.routed_to_consolidation).toBe(true);
    expect(decision?.duplicate_of).toContain("duplicate_");
    expect(decision?.deletes_proposal).toBe(false);
  });

  it("provides complete suppression explanations", () => {
    const decision = evaluateAdaptationSuppression({ scenario: "WEAK_EVIDENCE" }).suppression_decisions[0];
    const explanation = decision?.explanation;

    expect(explanation?.decision_version).toBe("adaptation-suppression-rules/v1");
    expect(explanation?.triggering_conditions.length).toBeGreaterThan(0);
    expect(explanation?.evidence_references.length).toBeGreaterThan(0);
    expect(explanation?.governance_considerations.length).toBeGreaterThan(0);
    expect(explanation?.constitutional_considerations.length).toBeGreaterThan(0);
    expect(explanation?.operator_impact).toBeTruthy();
    expect(explanation?.replay_references.length).toBeGreaterThan(0);
    expect(explanation?.remediation_guidance.length).toBeGreaterThan(0);
  });

  it("publishes suppression metrics", () => {
    const result = evaluateAdaptationSuppression({ scenario: "UNRESOLVED_GOVERNANCE" });

    expect(result.metrics.proposals_evaluated).toBe(1);
    expect(result.metrics.proposals_suppressed).toBe(1);
    expect(result.metrics.suppression_rate).toBe(1);
    expect(result.metrics.suppression_reasons.UNRESOLVED_GOVERNANCE).toBe(1);
    expect(result.metrics.governance_related_suppressions).toBeGreaterThan(0);
    expect(result.metrics.evaluation_latency_ms).toBe(0);
    expect(result.metrics.deterministic_replay_success).toBe(true);
  });

  it("keeps suppression advisory-only and non-mutating", () => {
    const result = evaluateAdaptationSuppression();
    const decision = result.suppression_decisions[0];

    expect(result.advisory_only).toBe(true);
    expect(result.modifies_proposals).toBe(false);
    expect(result.deletes_proposals).toBe(false);
    expect(result.approves_proposals).toBe(false);
    expect(result.rejects_proposals).toBe(false);
    expect(result.implements_proposals).toBe(false);
    expect(result.prioritizes_proposals).toBe(false);
    expect(decision?.modifies_proposal).toBe(false);
    expect(decision?.approves_proposal).toBe(false);
    expect(decision?.rejects_proposal).toBe(false);
  });

  it.each([
    ["INVALID_PROPOSAL", "PROPOSAL_VALIDATION_FAILED"],
    ["EVIDENCE_UNAVAILABLE", "EVIDENCE_CANNOT_BE_EVALUATED"],
    ["GOVERNANCE_UNAVAILABLE", "GOVERNANCE_ANALYSIS_UNAVAILABLE"],
    ["CONSTITUTIONAL_UNAVAILABLE", "CONSTITUTIONAL_ANALYSIS_UNAVAILABLE"],
    ["REPLAY_UNAVAILABLE", "REPLAY_VALIDATION_UNAVAILABLE"],
    ["INTEGRITY_FAILURE", "INTEGRITY_VERIFICATION_FAILED"],
    ["NONDETERMINISTIC_EVALUATION", "DETERMINISTIC_EVALUATION_NOT_GUARANTEED"],
    ["TENANT_VIOLATION", "TENANT_ISOLATION_VIOLATED"],
    ["MUTATION_ATTEMPT", "PROPOSAL_CONTENT_MUTATION_ATTEMPT"],
    ["FABRICATED_DEFICIENCY", "DEFICIENCY_FABRICATION_ATTEMPT"],
    ["GOVERNANCE_BYPASS", "GOVERNANCE_BYPASS_ATTEMPT"],
    ["CONSTITUTIONAL_BYPASS", "CONSTITUTIONAL_BYPASS_ATTEMPT"],
    ["UNSUPPORTED_SUPPRESSION", "UNSUPPORTED_SUPPRESSION_WITHOUT_EVIDENCE"],
    ["APPROVAL_ATTEMPT", "PROPOSAL_APPROVAL_ATTEMPT"],
    ["PRIORITIZATION_ATTEMPT", "PROPOSAL_PRIORITIZATION_ATTEMPT"],
    ["IMPLEMENTATION_ATTEMPT", "PROPOSAL_IMPLEMENTATION_ATTEMPT"],
  ] as readonly [AdaptationSuppressionScenario, AdaptationSuppressionFailure][])("fails closed for %s", (scenario, failure) => {
    const result = evaluateAdaptationSuppression({ scenario });

    expect(result.suppression_state).toBe("FAIL_CLOSED");
    expect(result.failures).toContain(failure);
    expect(result.metrics.validation_failures).toContain(failure);
    expect(result.suppression_decisions[0]?.outcome).toBe("SUPPRESSED");
    expect(result.modifies_proposals).toBe(false);
  });

  it("replays suppression and detects tampering", () => {
    const result = evaluateAdaptationSuppression();
    const tampered = { ...result, replay_hash: "tampered" };

    expect(replayAdaptationSuppression(result)).toBe(true);
    expect(replayAdaptationSuppression(tampered)).toBe(false);
  });
});
