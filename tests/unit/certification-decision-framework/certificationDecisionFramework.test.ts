import { describe, expect, it } from "vitest";

import {
  getCertificationDecisionFrameworkContract,
  replayCertificationDecisionFramework,
  runCertificationDecisionFramework,
  validateCertificationDecisionFramework,
} from "../../../services/certification-decision-framework";
import type { CertificationDecisionScenario } from "../../../types/certification-decision-framework";

describe("certification decision framework", () => {
  it("creates deterministic certified decisions", () => {
    const first = runCertificationDecisionFramework();
    const second = runCertificationDecisionFramework();

    expect(first.certification.status).toBe("PASS");
    expect(first.contract.certification_outcome).toBe("PASS");
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(validateCertificationDecisionFramework(first).valid).toBe(true);
    expect(replayCertificationDecisionFramework(first)).toBe(true);
  });

  it("publishes certification decision doctrine", () => {
    const bundle = getCertificationDecisionFrameworkContract();

    expect(bundle.doctrine.single_decision_required).toBe(true);
    expect(bundle.doctrine.closed_outcome_vocabulary).toBe(true);
    expect(bundle.doctrine.deterministic_aggregation_required).toBe(true);
    expect(bundle.doctrine.evidence_binding_required).toBe(true);
    expect(bundle.doctrine.governance_supremacy_required).toBe(true);
    expect(bundle.doctrine.advisory_only).toBe(true);
  });

  it("aggregates required and optional assurance deterministically", () => {
    const result = runCertificationDecisionFramework();

    expect(result.aggregation_rules.required_outcomes).toEqual(["PASS", "PASS", "PASS"]);
    expect(result.aggregation_rules.optional_outcomes).toEqual(["PASS"]);
    expect(result.aggregation_rules.optional_cannot_override_required).toBe(true);
    expect(result.aggregation_rules.pruned_preserved_distinct).toBe(true);
    expect(result.ledger.entries).toHaveLength(1);
  });

  it("binds evidence and explains the decision", () => {
    const result = runCertificationDecisionFramework();

    expect(result.evidence_binder.immutable).toBe(true);
    expect(result.evidence_binder.lineage_complete).toBe(true);
    expect(result.explanation.succeeded_reason).toContain("Every required");
    expect(result.explanation.hidden_reasoning_eliminated).toBe(true);
  });

  it("replays and ledgers certification decisions", () => {
    const result = runCertificationDecisionFramework();

    expect(result.replay.outcome_reproduced).toBe(true);
    expect(result.replay.evidence_preserved).toBe(true);
    expect(result.ledger.append_only).toBe(true);
    expect(result.ledger.tenant_isolated).toBe(true);
  });

  it("runs the phase 13.4 certification suite", () => {
    const result = runCertificationDecisionFramework();

    expect(result.certification.tests).toHaveLength(18);
    expect(result.certification.tests.every((test) => test.passed)).toBe(true);
  });

  it("fails closed for certification decision violations", () => {
    const scenarios: readonly CertificationDecisionScenario[] = [
      "CONTRACT_INVALID",
      "AGGREGATION_NONDETERMINISTIC",
      "MULTIPLE_DECISIONS",
      "VOCABULARY_OPEN",
      "REQUIRED_ASSURANCE_FAILED",
      "PRUNED_NORMALIZED_TO_FAIL",
      "OPTIONAL_OVERRIDES_REQUIRED",
      "CONDITIONS_IMPLICIT",
      "GOVERNANCE_REVIEW_BYPASSED",
      "OPERATOR_REVIEW_BYPASSED",
      "EVIDENCE_MUTABLE",
      "EVIDENCE_LINEAGE_INCOMPLETE",
      "EXPLANATION_INCOMPLETE",
      "REPLAY_MISMATCH",
      "LEDGER_MUTABLE",
      "TENANT_ISOLATION_FAILURE",
      "ADVISORY_BOUNDARY_VIOLATION",
      "INTEGRITY_FAILURE",
    ];

    for (const scenario of scenarios) {
      const result = runCertificationDecisionFramework({ scenario });

      expect(result.certification.status).toBe("FAIL");
      expect(result.certification.certified).toBe(false);
      expect(result.certification.failures).toContain(scenario);
      expect(validateCertificationDecisionFramework(result).valid).toBe(false);
    }
  });
});
