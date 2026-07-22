import { describe, expect, it } from "vitest";

import {
  getAssuranceEvaluationContractBundle,
  replayAssuranceEvaluationContract,
  runAssuranceEvaluationContract,
  validateAssuranceEvaluationContract,
} from "../../../services/assurance-evaluation-contract";
import type { AssuranceEvaluationScenario } from "../../../types/assurance-evaluation-contract";

describe("assurance evaluation contract", () => {
  it("creates deterministic certified evaluations", () => {
    const first = runAssuranceEvaluationContract();
    const second = runAssuranceEvaluationContract();

    expect(first.certification.status).toBe("PASS");
    expect(first.certification.certified).toBe(true);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(validateAssuranceEvaluationContract(first).valid).toBe(true);
    expect(replayAssuranceEvaluationContract(first)).toBe(true);
  });

  it("publishes evaluation doctrine", () => {
    const bundle = getAssuranceEvaluationContractBundle();

    expect(bundle.doctrine.closed_terminal_vocabulary).toBe(true);
    expect(bundle.doctrine.deterministic_inputs_required).toBe(true);
    expect(bundle.doctrine.deterministic_evidence_required).toBe(true);
    expect(bundle.doctrine.immutable_evaluation_ledger_required).toBe(true);
    expect(bundle.doctrine.reproducible_explanations_required).toBe(true);
    expect(bundle.doctrine.replay_required).toBe(true);
  });

  it("defines lifecycle, inputs, evidence, and closed terminal vocabulary", () => {
    const result = runAssuranceEvaluationContract();

    expect(result.contract.lifecycle).toEqual(["REGISTERED", "READY", "EVALUATING", "PASS", "FAIL", "PRUNED"]);
    expect(result.contract.terminal_outcomes).toEqual(["PASS", "FAIL", "PRUNED"]);
    expect(result.inputs.complete).toBe(true);
    expect(result.inputs.hidden_runtime_state_prohibited).toBe(true);
    expect(result.evidence.deterministic).toBe(true);
    expect(result.vocabulary.closed).toBe(true);
  });

  it("executes deterministic sequence and produces reproducible explanations", () => {
    const result = runAssuranceEvaluationContract();

    expect(result.execution.sequence[0]).toBe("Validate Inputs");
    expect(result.execution.sequence.at(-1)).toBe("Commit Ledger");
    expect(result.explanation.complete).toBe(true);
    expect(result.explanation.deterministic).toBe(true);
    expect(result.explanation.result_determination).toBe("PASS");
  });

  it("preserves immutable ledger and exact replay", () => {
    const result = runAssuranceEvaluationContract();

    expect(result.ledger.append_only).toBe(true);
    expect(result.ledger.immutable).toBe(true);
    expect(result.ledger.entries).toHaveLength(1);
    expect(result.replay.explanations_reproduced).toBe(true);
    expect(result.replay.outcomes_reproduced).toBe(true);
  });

  it("runs the phase 13.3 certification suite", () => {
    const result = runAssuranceEvaluationContract();

    expect(result.certification.tests).toHaveLength(15);
    expect(result.certification.tests.every((test) => test.passed)).toBe(true);
  });

  it("fails closed for evaluation contract violations", () => {
    const scenarios: readonly AssuranceEvaluationScenario[] = [
      "CONTRACT_INCOMPLETE",
      "INPUTS_NONDETERMINISTIC",
      "ORDERING_NONDETERMINISTIC",
      "EVIDENCE_QUALIFICATION_NONDETERMINISTIC",
      "VOCABULARY_OPEN",
      "PASS_SEMANTICS_INVALID",
      "FAIL_SEMANTICS_INVALID",
      "PRUNED_SEMANTICS_INVALID",
      "CUSTOM_TERMINAL_OUTCOME_ACCEPTED",
      "EXPLANATION_NONDETERMINISTIC",
      "LEDGER_MUTABLE",
      "REPLAY_EXPLANATION_MISMATCH",
      "REPLAY_OUTCOME_MISMATCH",
      "TENANT_ISOLATION_FAILURE",
      "INTEGRITY_FAILURE",
    ];

    for (const scenario of scenarios) {
      const result = runAssuranceEvaluationContract({ scenario });

      expect(result.certification.status).toBe("FAIL");
      expect(result.certification.certified).toBe(false);
      expect(result.certification.failures).toContain(scenario);
      expect(validateAssuranceEvaluationContract(result).valid).toBe(false);
    }
  });
});
