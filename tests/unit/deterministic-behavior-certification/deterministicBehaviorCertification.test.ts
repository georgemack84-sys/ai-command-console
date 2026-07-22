import { describe, expect, it } from "vitest";

import {
  certifyDeterministicBehavior,
  getDeterministicBehaviorContract,
  replayDeterministicBehaviorCertification,
  validateDeterministicBehaviorCertification,
} from "../../../services/deterministic-behavior-certification";
import type {
  DeterministicBehaviorFailure,
  DeterministicBehaviorScenario,
} from "../../../types/deterministic-behavior-certification";

const failureScenarios: ReadonlyArray<readonly [DeterministicBehaviorScenario, DeterministicBehaviorFailure]> = [
  ["PROPOSAL_DRIFT", "PROPOSAL_GENERATION_NONDETERMINISTIC"],
  ["PROPOSAL_ORDER_DRIFT", "PROPOSAL_ORDERING_DRIFT"],
  ["PROPOSAL_ID_DRIFT", "PROPOSAL_IDENTIFIER_DRIFT"],
  ["PROPOSAL_EVIDENCE_MISMATCH", "PROPOSAL_EVIDENCE_MISMATCH"],
  ["SCORING_DRIFT", "RECOMMENDATION_SCORING_NONDETERMINISTIC"],
  ["CONFIDENCE_DRIFT", "CONFIDENCE_SCORING_NONDETERMINISTIC"],
  ["RISK_DRIFT", "RISK_SCORING_NONDETERMINISTIC"],
  ["PATTERN_SCORE_DRIFT", "PATTERN_SCORING_NONDETERMINISTIC"],
  ["SUPPRESSION_DRIFT", "SUPPRESSION_NONDETERMINISTIC"],
  ["DUPLICATE_SUPPRESSION_DRIFT", "DUPLICATE_SUPPRESSION_DRIFT"],
  ["WEAK_SUPPRESSION_DRIFT", "WEAK_PROPOSAL_SUPPRESSION_DRIFT"],
  ["PRIORITIZATION_DRIFT", "PRIORITIZATION_NONDETERMINISTIC"],
  ["PRIORITY_ORDER_DRIFT", "PRIORITY_ORDERING_DRIFT"],
  ["SIMULATION_DRIFT", "SIMULATION_NONDETERMINISTIC"],
  ["COUNTERFACTUAL_DRIFT", "COUNTERFACTUAL_REPLAY_NONDETERMINISTIC"],
  ["REPLAY_DIVERGENCE", "REPLAY_RECONSTRUCTION_DIVERGED"],
  ["REPLAY_EQUIVALENCE_FAILURE", "REPLAY_EQUIVALENCE_FAILED"],
  ["DASHBOARD_DRIFT", "DASHBOARD_RENDERING_NONDETERMINISTIC"],
  ["DASHBOARD_LINEAGE_MISSING", "DASHBOARD_LINEAGE_INCOMPLETE"],
  ["HIDDEN_RANDOMNESS", "HIDDEN_RANDOMNESS_DETECTED"],
  ["RACE_CONDITION", "RACE_CONDITION_DEPENDENCY"],
  ["TIMESTAMP_DEPENDENCY", "TIMESTAMP_DEPENDENT_BEHAVIOR"],
  ["EXTERNAL_NONDETERMINISM", "EXTERNAL_NONDETERMINISM_DETECTED"],
  ["FLOATING_POINT_INSTABILITY", "FLOATING_POINT_STABILITY_FAILED"],
  ["EQUIVALENCE_BELOW_THRESHOLD", "DETERMINISTIC_EQUIVALENCE_BELOW_THRESHOLD"],
  ["INTEGRITY_FAILURE", "INTEGRITY_HASH_MISMATCH"],
];

describe("deterministic behavior certification", () => {
  it("publishes the deterministic behavior doctrine", () => {
    const contract = getDeterministicBehaviorContract();

    expect(contract.doctrine.version).toBe("deterministic-behavior-certification/v10.15.2");
    expect(contract.doctrine.required_equivalence_score).toBe(1);
    expect(contract.doctrine.deterministic_required).toBe(true);
    expect(contract.doctrine.replay_required).toBe(true);
    expect(contract.doctrine.domains).toEqual(expect.arrayContaining(["PROPOSAL_GENERATION", "SCORING", "SIMULATION", "REPLAY", "DASHBOARD_RENDERING"]));
    expect(contract.doctrine.hidden_randomness_sources).toEqual(expect.arrayContaining(["RANDOM_NUMBER_GENERATION", "RACE_CONDITION", "TIMESTAMP_DEPENDENT_LOGIC", "EXTERNAL_SERVICE_VARIABILITY"]));
    expect(contract.validation.valid).toBe(true);
  });

  it("certifies deterministic behavior with exact replay equivalence", () => {
    const first = certifyDeterministicBehavior();
    const second = certifyDeterministicBehavior();

    expect(first.status).toBe("PASS");
    expect(first.record.certification_status).toBe("CERTIFIED");
    expect(first.record.deterministic_equivalence_score).toBe(1);
    expect(first.production_ready).toBe(true);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(validateDeterministicBehaviorCertification(first).valid).toBe(true);
    expect(replayDeterministicBehaviorCertification(first)).toBe(true);
  });

  it("validates all deterministic domains", () => {
    const result = certifyDeterministicBehavior();

    expect(result.proposal_validation.proposal_hashes_identical).toBe(true);
    expect(result.proposal_validation.ordering_reproducible).toBe(true);
    expect(result.scoring_validation.tie_breaking_deterministic).toBe(true);
    expect(result.suppression_validation.suppression_rationale_identical).toBe(true);
    expect(result.prioritization_validation.sorting_stable).toBe(true);
    expect(result.simulation_validation.state_transitions_reproducible).toBe(true);
    expect(result.replay_validation.replay_equivalence_verified).toBe(true);
    expect(result.dashboard_validation.dashboard_query_hash_identical).toBe(true);
    expect(result.hidden_randomness_validation.hidden_randomness_absent).toBe(true);
    expect(result.hidden_randomness_validation.detected_sources).toHaveLength(0);
  });

  it("emits complete determinism reports", () => {
    const result = certifyDeterministicBehavior();

    expect(result.certification_report.production_readiness_recommendation).toBe("READY");
    expect(result.certification_report.deterministic_equivalence_score).toBe(1);
    expect(result.consistency_report.stable_ordering_verified).toBe(true);
    expect(result.consistency_report.evidence_reproducible).toBe(true);
    expect(result.consistency_report.governance_constitutional_consistency).toBe(true);
    expect(result.validation_tests).toHaveLength(27);
  });

  it.each(failureScenarios)("fails certification for %s", (scenario, failure) => {
    const result = certifyDeterministicBehavior({ scenario });
    const validation = validateDeterministicBehaviorCertification(result);

    expect(result.status).toBe("FAIL");
    expect(result.record.certification_status).toBe("REJECTED");
    expect(result.production_ready).toBe(false);
    expect(result.failures).toContain(failure);
    expect(result.record.deterministic_equivalence_score).toBeLessThan(1);
    expect(validation.valid).toBe(false);
    expect(validation.failures).toContain(failure);
    expect(replayDeterministicBehaviorCertification(result)).toBe(false);
  });

  it("detects tampering through integrity and replay checks", () => {
    const result = certifyDeterministicBehavior();
    const tampered = {
      ...result,
      record: {
        ...result.record,
        deterministic_equivalence_score: 0.5,
      },
    };

    expect(validateDeterministicBehaviorCertification(tampered).integrity_hash_valid).toBe(false);
    expect(replayDeterministicBehaviorCertification(tampered)).toBe(false);
  });
});
