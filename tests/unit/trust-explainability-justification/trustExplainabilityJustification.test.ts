import { describe, expect, it } from "vitest";
import { getTrustExplainabilityJustificationBundle, replayTrustExplainabilityJustification, runTrustExplainabilityJustification, validateTrustExplainabilityJustification } from "@/services/trust-explainability-justification";
import type { TrustExplainabilityFailure } from "@/types/trust-explainability-justification";

const FAILURE_MATRIX: readonly TrustExplainabilityFailure[] = [
  "P5_10_SAFETY_QUALIFICATION_INVALID",
  "TRUST_EXPLANATION_ENGINE_MISSING",
  "EXPLANATION_BUILDER_MISSING",
  "EVIDENCE_TRACE_SERVICE_MISSING",
  "JUSTIFICATION_GENERATOR_MISSING",
  "CONSTITUTIONAL_EXPLAINER_MISSING",
  "POLICY_EXPLAINER_MISSING",
  "RISK_EXPLAINER_MISSING",
  "ALIGNMENT_EXPLAINER_MISSING",
  "TRANSPARENCY_SERVICE_MISSING",
  "REPORT_GENERATOR_MISSING",
  "TRUST_DECISION_MISSING",
  "MULTIPLE_EXPLANATIONS_FOR_DECISION",
  "AUTHORITATIVE_EVIDENCE_MISSING",
  "UNVERIFIABLE_EVIDENCE_REFERENCED",
  "EXPLANATION_CONTRADICTS_DECISION",
  "CONSTITUTIONAL_AUTHORITY_MISSING",
  "POLICY_AUTHORITY_MISSING",
  "AUTHORITY_CHAIN_MISSING",
  "VISIBILITY_BOUNDARY_VIOLATED",
  "REASONING_CHAIN_INCOMPLETE",
  "REASONING_CHAIN_NONDETERMINISTIC",
  "EXPLANATION_NOT_REPRODUCIBLE",
  "EXPLANATION_NOT_REPLAYABLE",
  "EXPLANATION_NOT_EVIDENCE_BACKED",
  "EXPLANATION_NOT_CONSTITUTIONALLY_GROUNDED",
  "EXPLANATION_NOT_POLICY_GROUNDED",
  "EXPLANATION_NOT_AUTHORITY_VALIDATED",
  "EXPLANATION_MUTABLE_AFTER_PUBLICATION",
  "JUSTIFICATION_REPORT_INCOMPLETE",
  "TRANSPARENCY_RECORD_MISSING",
  "TRANSPARENCY_RECORD_UNAUTHORIZED",
  "TRUST_COMPUTATION_EXECUTED",
  "EVIDENCE_GENERATED",
  "RISK_MODELING_EXECUTED",
  "POLICY_EVALUATION_EXECUTED",
  "TRUST_QUALIFICATION_EXECUTED",
];

describe("P5.11 Trust Explainability & Justification", () => {
  it("publishes a doctrine that explains existing decisions without creating them", () => {
    const bundle = getTrustExplainabilityJustificationBundle();

    expect(bundle.doctrine.version).toBe("trust-explainability-justification/v5.11");
    expect(bundle.doctrine.owns_explainability).toBe(true);
    expect(bundle.doctrine.owns_trust_reasoning).toBe(true);
    expect(bundle.doctrine.owns_decision_justification).toBe(true);
    expect(bundle.doctrine.owns_transparency).toBe(true);
    expect(bundle.doctrine.creates_trust_decisions).toBe(false);
    expect(bundle.doctrine.computes_trust).toBe(false);
    expect(bundle.doctrine.generates_evidence).toBe(false);
    expect(bundle.doctrine.models_risk).toBe(false);
    expect(bundle.doctrine.evaluates_policy).toBe(false);
    expect(bundle.doctrine.qualifies_trust).toBe(false);
    expect(bundle.validation.valid).toBe(true);
  });

  it("builds deterministic explanations, traces, justifications, and transparency records", () => {
    const first = runTrustExplainabilityJustification();
    const second = runTrustExplainabilityJustification();

    expect(first.phase_identifier).toBe("TrustExplainabilityJustification");
    expect(first.safety_qualification_ref).toBe("trust-safety-qualification/v5.10");
    expect(first.explanation.reasoning_chain).toEqual(["Input Evidence", "Evidence Evaluation", "Confidence Assessment", "Risk Assessment", "Alignment Assessment", "Compliance Assessment", "Trust Evaluation", "Final Trust Decision"]);
    expect(first.explanation.evidence_refs.length).toBeGreaterThan(0);
    expect(first.explanation.constitutional_refs.length).toBeGreaterThan(0);
    expect(first.explanation.policy_refs.length).toBeGreaterThan(0);
    expect(first.explanation.alignment_refs.length).toBeGreaterThan(0);
    expect(first.explanation.safety_refs.length).toBeGreaterThan(0);
    expect(first.explanation.confidence_refs.length).toBeGreaterThan(0);
    expect(first.explanation.replay_refs.length).toBeGreaterThan(0);
    expect(first.trace.evidence_status).toBe("AUTHORITATIVE");
    expect(first.trace.complete).toBe(true);
    expect(first.graph.deterministic).toBe(true);
    expect(first.graph.reproducible).toBe(true);
    expect(first.graph.replayable).toBe(true);
    expect(first.graph.immutable_after_publication).toBe(true);
    expect(first.justification.final_justification).toBe("Existing trust decision is explained without recomputation.");
    expect(first.transparency.visibility_boundary_preserved).toBe(true);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validateTrustExplainabilityJustification(first).valid).toBe(true);
    expect(replayTrustExplainabilityJustification(first)).toBe(true);
  });

  it("passes only when all explainability exit criteria and invariants are satisfied", () => {
    const result = runTrustExplainabilityJustification();

    expect(result.certification.outcome).toBe("PASS");
    expect(result.certification.phase_ready).toBe(true);
    expect(result.certification.all_decisions_explained).toBe(true);
    expect(result.certification.exactly_one_explanation_per_decision).toBe(true);
    expect(result.certification.evidence_traceability_complete).toBe(true);
    expect(result.certification.constitutional_reasoning_documented).toBe(true);
    expect(result.certification.policy_reasoning_documented).toBe(true);
    expect(result.certification.authority_reasoning_documented).toBe(true);
    expect(result.certification.transparency_records_generated).toBe(true);
    expect(result.certification.replay_reproduces_explanation).toBe(true);
    expect(result.certification.justification_reports_complete).toBe(true);
    expect(result.certification.invariants_satisfied).toBe(true);
    expect(result.certification.boundary_respected).toBe(true);
    expect(result.certification.failures).toHaveLength(0);
  });

  it.each(FAILURE_MATRIX)("fails explainability certification for %s", (failure) => {
    const result = runTrustExplainabilityJustification({ scenario: failure });
    const validation = validateTrustExplainabilityJustification(result);

    expect(result.certification.outcome).toBe("FAIL");
    expect(result.certification.phase_ready).toBe(false);
    expect(result.certification.failures).toContain(failure);
    expect(validation.valid).toBe(false);
  });

  it("routes governance-review scenarios without explainability readiness", () => {
    const result = runTrustExplainabilityJustification({ scenario: "GOVERNANCE_REVIEW_REQUIRED" });

    expect(result.certification.outcome).toBe("REQUIRES_GOVERNANCE_REVIEW");
    expect(result.certification.phase_ready).toBe(false);
    expect(result.certification.failures).toContain("GOVERNANCE_REVIEW_REQUIRED");
    expect(validateTrustExplainabilityJustification(result).valid).toBe(false);
  });

  it("invalidates explanations with missing or unverifiable evidence", () => {
    const missing = runTrustExplainabilityJustification({ scenario: "AUTHORITATIVE_EVIDENCE_MISSING" });
    const unverifiable = runTrustExplainabilityJustification({ scenario: "UNVERIFIABLE_EVIDENCE_REFERENCED" });

    expect(missing.trace.evidence_status).toBe("MISSING");
    expect(missing.certification.evidence_traceability_complete).toBe(false);
    expect(missing.certification.failures).toContain("AUTHORITATIVE_EVIDENCE_MISSING");
    expect(unverifiable.trace.evidence_status).toBe("UNVERIFIABLE");
    expect(unverifiable.certification.evidence_traceability_complete).toBe(false);
    expect(unverifiable.certification.failures).toContain("UNVERIFIABLE_EVIDENCE_REFERENCED");
  });

  it("detects visibility boundary leaks in transparency records", () => {
    const result = runTrustExplainabilityJustification({ scenario: "TRANSPARENCY_RECORD_UNAUTHORIZED" });

    expect(result.transparency.visible_reasoning).toContain("restricted:evidence:raw");
    expect(result.transparency.visibility_boundary_preserved).toBe(false);
    expect(result.certification.boundary_respected).toBe(true);
    expect(result.certification.failures).toContain("VISIBILITY_BOUNDARY_VIOLATED");
  });
});
