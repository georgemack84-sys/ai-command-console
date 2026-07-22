import { describe, expect, it } from "vitest";

import {
  getOutcomeObservationEvaluationContract,
  replayOutcomeObservationEvaluation,
  runOutcomeObservationEvaluation,
  validateOutcomeObservationEvaluation,
} from "../../../services/outcome-observation-evaluation";
import type { ObservationScenario } from "../../../types/outcome-observation-evaluation";

describe("outcome observation evaluation", () => {
  it("creates deterministic certified observations", () => {
    const first = runOutcomeObservationEvaluation();
    const second = runOutcomeObservationEvaluation();

    expect(first.certification.status).toBe("PASS");
    expect(first.certification.organizational_intelligence_ready).toBe(true);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(validateOutcomeObservationEvaluation(first).valid).toBe(true);
    expect(replayOutcomeObservationEvaluation(first)).toBe(true);
  });

  it("publishes observation doctrine", () => {
    const bundle = getOutcomeObservationEvaluationContract();

    expect(bundle.doctrine.recommendation_history_immutable).toBe(true);
    expect(bundle.doctrine.observation_windows_policy_bound).toBe(true);
    expect(bundle.doctrine.qualified_evidence_required).toBe(true);
    expect(bundle.doctrine.late_evidence_append_only).toBe(true);
  });

  it("manages deterministic windows, collection, qualification, and closure", () => {
    const result = runOutcomeObservationEvaluation();

    expect(result.window.opened_once).toBe(true);
    expect(result.window.closed_once).toBe(true);
    expect(result.evidence.evidence_refs).toHaveLength(3);
    expect(result.qualification.status).toBe("QUALIFIED");
    expect(result.closure.outcome).toBe("COMPLETED");
  });

  it("evaluates recommendation effectiveness and handles late evidence append-only", () => {
    const result = runOutcomeObservationEvaluation();

    expect(result.evaluation.outcome).toBe("MET_EXPECTATIONS");
    expect(result.evaluation.effectiveness_score).toBe(0.8);
    expect(result.missing_late_evidence.historical_evaluation_mutated).toBe(false);
    expect(result.missing_late_evidence.late_evidence_refs).toHaveLength(1);
  });

  it("preserves replay, ledger, and observability", () => {
    const result = runOutcomeObservationEvaluation();

    expect(result.replay.outcome).toBe("MATCH");
    expect(result.ledger.append_only).toBe(true);
    expect(result.observability.observable).toBe(true);
  });

  it("runs the phase 12.10 certification suite", () => {
    const result = runOutcomeObservationEvaluation();

    expect(result.certification.tests).toHaveLength(25);
    expect(result.certification.tests.every((test) => test.passed)).toBe(true);
  });

  it("fails closed for window, evidence, qualification, closure, evaluation, replay, governance, and tenant violations", () => {
    const scenarios: readonly ObservationScenario[] = [
      "OBSERVATION_IDENTITY_NONDETERMINISTIC",
      "WINDOW_MISSING",
      "WINDOW_REOPENED",
      "WINDOW_OVERLAP",
      "WINDOW_TIMING_MUTABLE",
      "EVIDENCE_COLLECTION_INCOMPLETE",
      "EVIDENCE_INTEGRITY_FAILED",
      "RECOMMENDATION_MUTATED",
      "QUALIFICATION_FAILED",
      "DUPLICATE_EVIDENCE",
      "TEMPORAL_VALIDITY_FAILED",
      "SOURCE_AUTHENTICITY_FAILED",
      "CLOSURE_NONDETERMINISTIC",
      "EVALUATION_INCOMPLETE",
      "EFFECTIVENESS_NONDETERMINISTIC",
      "LATE_EVIDENCE_MUTATED_HISTORY",
      "MISSING_EVIDENCE_UNRECORDED",
      "REPLAY_MISMATCH",
      "POLICY_BINDING_INVALID",
      "GOVERNANCE_FAILURE",
      "ADVISORY_BOUNDARY_VIOLATION",
      "TENANT_ISOLATION_BREACH",
      "LEDGER_NOT_APPEND_ONLY",
      "OBSERVABILITY_MISSING",
    ];

    for (const scenario of scenarios) {
      const result = runOutcomeObservationEvaluation({ scenario });

      expect(result.certification.status).toBe("FAIL");
      expect(result.certification.organizational_intelligence_ready).toBe(false);
      expect(result.certification.failures).toContain(scenario);
      expect(validateOutcomeObservationEvaluation(result).valid).toBe(false);
    }
  });
});
