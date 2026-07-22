import { describe, expect, it } from "vitest";

import {
  certifyReplay,
  getReplayCertificationContract,
  replayReplayCertification,
  validateReplayCertification,
} from "../../../services/replay-certification";
import type { ReplayCertificationFailure, ReplayCertificationScenario } from "../../../types/replay-certification";

const failureScenarios: ReadonlyArray<readonly [ReplayCertificationScenario, ReplayCertificationFailure]> = [
  ["INCOMPLETE_RECONSTRUCTION", "INCOMPLETE_REPLAY_RECONSTRUCTION"],
  ["MISSING_INPUTS", "INPUT_RECONSTRUCTION_INCOMPLETE"],
  ["MISSING_EVIDENCE", "EVIDENCE_RECONSTRUCTION_INCOMPLETE"],
  ["NORMALIZED_OUTCOME_DRIFT", "NORMALIZED_OUTCOME_REPLAY_DIVERGED"],
  ["REASONING_DIVERGENCE", "REASONING_REPLAY_DIVERGED"],
  ["RECOMMENDATION_REASONING_DIVERGENCE", "RECOMMENDATION_REASONING_REPLAY_DIVERGED"],
  ["CONFIDENCE_CALCULATION_DIVERGENCE", "CONFIDENCE_CALCULATION_REPLAY_DIVERGED"],
  ["RISK_CALCULATION_DIVERGENCE", "RISK_CALCULATION_REPLAY_DIVERGED"],
  ["PROPOSAL_GENERATION_DIVERGENCE", "PROPOSAL_GENERATION_REPLAY_DIVERGED"],
  ["OUTPUT_DIVERGENCE", "OUTPUT_REPLAY_DIVERGED"],
  ["GOVERNANCE_MISMATCH", "GOVERNANCE_REPLAY_MISMATCH"],
  ["CONSTITUTIONAL_MISMATCH", "CONSTITUTIONAL_REPLAY_MISMATCH"],
  ["SUPPRESSION_DIVERGENCE", "SUPPRESSION_REPLAY_DIVERGED"],
  ["PRIORITIZATION_DIVERGENCE", "PRIORITIZATION_REPLAY_DIVERGED"],
  ["SIMULATION_DIVERGENCE", "SIMULATION_REPLAY_DIVERGED"],
  ["COUNTERFACTUAL_DIVERGENCE", "COUNTERFACTUAL_REPLAY_DIVERGED"],
  ["DASHBOARD_DIVERGENCE", "DASHBOARD_REPLAY_DIVERGED"],
  ["CERTIFICATION_OUTCOME_DIVERGENCE", "CERTIFICATION_OUTCOME_REPLAY_DIVERGED"],
  ["LEDGER_HISTORY_INCOMPLETE", "LEDGER_HISTORY_INCOMPLETE"],
  ["REPLAY_REFERENCE_OMISSION", "REPLAY_REFERENCE_OMITTED"],
  ["EVIDENCE_LINEAGE_GAP", "EVIDENCE_LINEAGE_INCOMPLETE"],
  ["INTEGRITY_FAILURE", "INTEGRITY_HASH_MISMATCH"],
  ["APPEND_ONLY_VIOLATION", "APPEND_ONLY_LEDGER_VIOLATION"],
  ["HIDDEN_RUNTIME_DEPENDENCY", "HIDDEN_RUNTIME_DEPENDENCY_DETECTED"],
  ["REPLAY_NONDETERMINISM", "REPLAY_NONDETERMINISM_DETECTED"],
  ["EQUIVALENCE_BELOW_THRESHOLD", "REPLAY_EQUIVALENCE_BELOW_THRESHOLD"],
];

describe("replay certification", () => {
  it("publishes the replay certification doctrine", () => {
    const contract = getReplayCertificationContract();

    expect(contract.doctrine.version).toBe("replay-certification/v10.15.3");
    expect(contract.doctrine.required_equivalence_score).toBe(1);
    expect(contract.doctrine.ledger_only_replay_required).toBe(true);
    expect(contract.doctrine.hidden_state_prohibited).toBe(true);
    expect(contract.doctrine.certification_required).toBe(true);
    expect(contract.doctrine.subsystems).toEqual(expect.arrayContaining(["Outcome Observation", "Adaptive Memory", "Adaptive Dashboard", "Adaptive Certification"]));
    expect(contract.doctrine.required_ledgers).toEqual(expect.arrayContaining(["OutcomeObservationLedger", "AdaptiveMemoryLedger", "AdaptiveCertificationLedger"]));
    expect(contract.validation.valid).toBe(true);
  });

  it("certifies replay with exact deterministic equivalence", () => {
    const first = certifyReplay();
    const second = certifyReplay();

    expect(first.status).toBe("PASS");
    expect(first.record.certification_status).toBe("CERTIFIED");
    expect(first.record.replay_equivalence_score).toBe(1);
    expect(first.complete).toBe(true);
    expect(first.deterministic).toBe(true);
    expect(first.integrity_protected).toBe(true);
    expect(first.ledger_only).toBe(true);
    expect(first.production_ready).toBe(true);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(validateReplayCertification(first).valid).toBe(true);
    expect(replayReplayCertification(first)).toBe(true);
  });

  it("reconstructs inputs, evidence, reasoning, outputs, governance, constitutional state, simulation, and ledger history", () => {
    const result = certifyReplay();

    expect(result.input_reconstruction.mission_context_reconstructed).toBe(true);
    expect(result.evidence_reconstruction.evidence_lineage_complete).toBe(true);
    expect(result.reasoning_equivalence.adaptive_reasoning_reproduced).toBe(true);
    expect(result.reasoning_equivalence.suppression_rationale_reproduced).toBe(true);
    expect(result.output_reconstruction.adaptive_proposals_reproduced).toBe(true);
    expect(result.output_reconstruction.dashboard_artifacts_reproduced).toBe(true);
    expect(result.governance_replay.governance_decisions_reproduced).toBe(true);
    expect(result.constitutional_replay.constitutional_evaluations_reproduced).toBe(true);
    expect(result.simulation_replay.state_transitions_identical).toBe(true);
    expect(result.ledger_replay.no_external_state_required).toBe(true);
    expect(result.replay_integrity.cryptographic_hashes_verified).toBe(true);
  });

  it("emits complete replay certification and reconstruction reports", () => {
    const result = certifyReplay();

    expect(result.certification_report.production_readiness_recommendation).toBe("READY");
    expect(result.certification_report.replay_equivalence_score).toBe(1);
    expect(result.reconstruction_report.replay_coverage_by_subsystem).toHaveLength(15);
    expect(result.reconstruction_report.ledger_utilization).toHaveLength(15);
    expect(result.reconstruction_report.evidence_lineage_verified).toBe(true);
    expect(result.reconstruction_report.integrity_verified).toBe(true);
    expect(result.validation_tests).toHaveLength(26);
  });

  it.each(failureScenarios)("fails certification for %s", (scenario, failure) => {
    const result = certifyReplay({ scenario });
    const validation = validateReplayCertification(result);

    expect(result.status).toBe("FAIL");
    expect(result.record.certification_status).toBe("REJECTED");
    expect(result.production_ready).toBe(false);
    expect(result.failures).toContain(failure);
    expect(result.record.replay_equivalence_score).toBeLessThan(1);
    expect(validation.valid).toBe(false);
    expect(validation.failures).toContain(failure);
    expect(replayReplayCertification(result)).toBe(false);
  });

  it("detects replay tampering through integrity checks", () => {
    const result = certifyReplay();
    const tampered = {
      ...result,
      record: {
        ...result.record,
        replay_equivalence_score: 0.5,
      },
    };

    expect(validateReplayCertification(tampered).integrity_hash_valid).toBe(false);
    expect(replayReplayCertification(tampered)).toBe(false);
  });
});
