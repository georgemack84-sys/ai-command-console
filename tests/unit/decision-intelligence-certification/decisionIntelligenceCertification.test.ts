import { describe, expect, it } from "vitest";
import {
  DECISION_INTELLIGENCE_CHECKS,
  DECISION_INTELLIGENCE_SCOPES,
  computeContextCompletenessReportHash,
  getDecisionIntelligenceCertificationFoundation,
  replayDecisionIntelligenceCertification,
  runDecisionIntelligenceCertification,
} from "@/services/decision-intelligence-certification";
import type { DecisionIntelligenceCertificationFailure, DecisionIntelligenceCertificationInput } from "@/types/decision-intelligence-certification";

describe("Mission Control Phase 9.12.6 Decision Intelligence Certification", () => {
  it("publishes the decision intelligence certification foundation", () => {
    const foundation = getDecisionIntelligenceCertificationFoundation();

    expect(foundation.certification_version).toBe("decision-intelligence-certification/v1");
    expect(foundation.scopes).toEqual(DECISION_INTELLIGENCE_SCOPES);
    expect(foundation.checks).toEqual(DECISION_INTELLIGENCE_CHECKS);
    expect(foundation.result.validation.validation_status).toBe("VALID");
  });

  it("validates complete context and required evidence", () => {
    const result = runDecisionIntelligenceCertification();

    expect(computeContextCompletenessReportHash(result.context_report)).toBe(result.context_report.integrity_hash);
    expect(result.context_report.validation_state).toBe("PASS");
    expect(result.context_report.missing_contexts).toHaveLength(0);
    expect(result.context_report.evidence_refs.length).toBeGreaterThan(0);
  });

  it("validates dependency accuracy, conflict arbitration, and priority reproducibility", () => {
    const result = runDecisionIntelligenceCertification();

    expect(result.dependency_report.validation_state).toBe("PASS");
    expect(result.dependency_report.graph_consistent).toBe(true);
    expect(result.conflict_arbitration_report.validation_state).toBe("PASS");
    expect(result.conflict_arbitration_report.arbitration_deterministic).toBe(true);
    expect(result.priority_report.validation_state).toBe("PASS");
    expect(result.priority_report.tie_breaking_deterministic).toBe(true);
  });

  it("validates alternatives, rejected option explanations, and traceability", () => {
    const result = runDecisionIntelligenceCertification();

    expect(result.alternative_explainability_report.validation_state).toBe("PASS");
    expect(result.alternative_explainability_report.alternative_refs.length).toBeGreaterThan(0);
    expect(result.alternative_explainability_report.rejected_option_explanations.length).toBeGreaterThan(0);
    expect(result.alternative_explainability_report.evidence_traceability_refs.length).toBeGreaterThan(0);
    expect(result.alternative_explainability_report.hidden_reasoning_absent).toBe(true);
  });

  it("certifies decision consistency and immutable evidence", () => {
    const result = runDecisionIntelligenceCertification();

    expect(result.consistency_report.validation_state).toBe("PASS");
    expect(result.evidence_package.complete).toBe(true);
    expect(result.evidence_package.immutable).toBe(true);
    expect(result.intelligence_ledger.map((entry) => entry.sequence_number)).toEqual([1, 2, 3, 4]);
    expect(result.intelligence_ledger.every((entry) => entry.append_only && !entry.deleted)).toBe(true);
  });

  it("approves the explainability validation report for production readiness", () => {
    const result = runDecisionIntelligenceCertification();

    expect(result.explainability_report.certification_decision).toBe("PASS");
    expect(result.explainability_report.production_readiness).toBe("READY");
    expect(result.validation.context_complete).toBe(true);
    expect(result.validation.recommendations_traceable).toBe(true);
    expect(result.validation.hidden_reasoning_absent).toBe(true);
  });

  it("remains replayable and advisory-only", () => {
    const result = runDecisionIntelligenceCertification();

    expect(replayDecisionIntelligenceCertification(result)).toBe(true);
    expect(result.deterministic).toBe(true);
    expect(result.replayable).toBe(true);
    expect(result.advisory_only).toBe(true);
    expect(result.mutates_reasoning_state).toBe(false);
    expect(result.execution_authority_granted).toBe(false);
  });

  it.each([
    ["GOVERNANCE_INVALID", "GOVERNANCE_CONSTITUTIONAL_CERTIFICATION_INVALID"],
    ["INCOMPLETE_CONTEXT", "INCOMPLETE_DECISION_CONTEXT"],
    ["MISSING_EVIDENCE", "MISSING_REQUIRED_EVIDENCE"],
    ["INCORRECT_DEPENDENCY", "INCORRECT_DEPENDENCY_ANALYSIS"],
    ["GRAPH_INCONSISTENCY", "DEPENDENCY_GRAPH_INCONSISTENCY"],
    ["UNDETECTED_CONFLICT", "UNDETECTED_CONFLICT"],
    ["INCORRECT_CONFLICT_CLASSIFICATION", "INCORRECT_CONFLICT_CLASSIFICATION"],
    ["NONDETERMINISTIC_ARBITRATION", "NONDETERMINISTIC_ARBITRATION"],
    ["INCORRECT_PRIORITY", "INCORRECT_PRIORITY_CALCULATION"],
    ["INCONSISTENT_TIE_BREAKING", "INCONSISTENT_TIE_BREAKING"],
    ["MISSING_ALTERNATIVES", "MISSING_ALTERNATIVE_RECOMMENDATIONS"],
    ["MISSING_REJECTED_EXPLANATIONS", "MISSING_REJECTED_OPTION_EXPLANATIONS"],
    ["HIDDEN_REASONING", "HIDDEN_REASONING"],
    ["UNTRACEABLE_RECOMMENDATION", "UNTRACEABLE_RECOMMENDATIONS"],
    ["MISSING_GOVERNANCE_RATIONALE", "MISSING_GOVERNANCE_RATIONALE"],
    ["MISSING_CONSTITUTIONAL_RATIONALE", "MISSING_CONSTITUTIONAL_RATIONALE"],
    ["REPLAY_INCONSISTENCY", "REPLAY_INCONSISTENCY"],
    ["DECISION_INCONSISTENCY", "DECISION_INCONSISTENCY"],
    ["HASH_MISMATCH", "INTEGRITY_HASH_MISMATCH"],
    ["FAIL_OPEN", "FAIL_OPEN_REASONING"],
    ["CROSS_TENANT", "CROSS_TENANT_REASONING_CONTAMINATION"],
    ["EXECUTION_AUTHORITY", "EXECUTION_AUTHORITY_GRANTED"],
  ] as readonly [NonNullable<DecisionIntelligenceCertificationInput["scenario"]>, DecisionIntelligenceCertificationFailure][])("fails closed for %s", (scenario, failure) => {
    const result = runDecisionIntelligenceCertification({ scenario });

    expect(result.validation.validation_status).toBe("BLOCKED");
    expect(result.validation.failures).toContain(failure);
    expect(result.explainability_report.production_readiness).toBe("BLOCKED");
    expect(result.advisory_only).toBe(true);
    expect(result.mutates_reasoning_state).toBe(false);
  });

  it("fails closed when the role lacks decision intelligence visibility", () => {
    const result = runDecisionIntelligenceCertification({ role: "ADMINISTRATOR" });

    expect(result.validation.validation_status).toBe("BLOCKED");
    expect(result.validation.failures).toContain("AUTHORIZATION_FAILURE");
  });

  it("detects decision intelligence certification tampering", () => {
    const result = runDecisionIntelligenceCertification();
    const tampered = { ...result, replay_hash: "tampered" };

    expect(replayDecisionIntelligenceCertification(tampered)).toBe(false);
  });
});
