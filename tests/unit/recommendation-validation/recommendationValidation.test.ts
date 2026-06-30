import { describe, expect, it } from "vitest";
import {
  buildRecommendationValidationContract,
  buildRecommendationValidationDoctrine,
  buildRecommendationValidationObservabilitySurface,
  computeRecommendationValidationHash,
  replayRecommendationValidation,
  validateRecommendation,
} from "@/services/recommendation-validation";

describe("Mission Control Phase 7E.4 Recommendation Validation", () => {
  it("defines the validation doctrine, decision states, baseline contract, and PASS certification", () => {
    const doctrine = buildRecommendationValidationDoctrine();
    const contract = buildRecommendationValidationContract();
    expect(doctrine.contract_version).toBe("RECOMMENDATION-VALIDATION-V1");
    expect(doctrine.validation_states).toEqual(["VALIDATED", "CONDITIONAL_VALIDATION", "REJECTED", "BLOCKED"]);
    expect(doctrine.area_statuses).toEqual(["PASS", "WARNING", "FAIL", "BLOCK"]);
    expect(contract.baseline_validation.certification_state).toBe("PASS");
  });

  it("validates a complete governed recommendation and all validation areas pass", () => {
    const result = validateRecommendation();
    expect(result.validation.validation_state).toBe("VALIDATED");
    expect(result.certification_state).toBe("PASS");
    expect(result.validation.blocking_findings).toHaveLength(0);
    expect(result.validation.contract_result.status).toBe("PASS");
    expect(result.validation.evidence_result.status).toBe("PASS");
    expect(result.validation.risk_result.status).toBe("PASS");
    expect(result.validation.confidence_result.status).toBe("PASS");
    expect(result.validation.governance_result.status).toBe("PASS");
    expect(result.validation.advisory_only_result.status).toBe("PASS");
    expect(result.validation.alternative_path_result.status).toBe("PASS");
    expect(result.validation.tenant_isolation_result.status).toBe("PASS");
    expect(result.validation.replay_readiness_result.status).toBe("PASS");
    expect(result.validation.truth_ledger_result.status).toBe("PASS");
  });

  it("allows conditional validation only for non-critical operator-review gaps", () => {
    const result = validateRecommendation({ scenario: "PARTIAL_EVIDENCE" });
    expect(result.validation.validation_state).toBe("CONDITIONAL_VALIDATION");
    expect(result.certification_state).toBe("CONDITIONAL_PASS");
    expect(result.validation.conditional_findings.some((finding) => finding.code === "EVIDENCE_INCOMPLETE")).toBe(true);
    expect(result.validation.blocking_findings).toHaveLength(0);
  });

  it("rejects missing contract, unsupported recommendation type, missing evidence, and unsupported evidence", () => {
    expect(validateRecommendation({ scenario: "MISSING_CONTRACT" }).validation.validation_state).toBe("REJECTED");
    expect(validateRecommendation({ scenario: "UNSUPPORTED_RECOMMENDATION" }).validation.contract_result.findings.some((finding) => finding.code === "UNSUPPORTED_RECOMMENDATION_TYPE")).toBe(true);
    expect(validateRecommendation({ scenario: "MISSING_EVIDENCE" }).validation.validation_state).toBe("REJECTED");
    expect(validateRecommendation({ scenario: "UNSUPPORTED_EVIDENCE" }).validation.evidence_result.findings.some((finding) => finding.code === "EVIDENCE_UNSUPPORTED")).toBe(true);
  });

  it("validates risk assessment and blocks critical risk without escalation", () => {
    const baseline = validateRecommendation();
    expect(baseline.validation.risk_result.status).toBe("PASS");
    expect(validateRecommendation({ scenario: "MISSING_RISK" }).validation.risk_result.findings.some((finding) => finding.code === "RISK_ASSESSMENT_MISSING")).toBe(true);
    const critical = validateRecommendation({ scenario: "CRITICAL_WITHOUT_ESCALATION" });
    expect(critical.validation.validation_state).toBe("BLOCKED");
    expect(critical.validation.risk_result.findings.some((finding) => finding.code === "CRITICAL_ESCALATION_MISSING")).toBe(true);
  });

  it("validates confidence justification and detects unsupported or inflated confidence", () => {
    expect(validateRecommendation().validation.confidence_result.status).toBe("PASS");
    expect(validateRecommendation({ scenario: "UNSUPPORTED_CONFIDENCE" }).validation.confidence_result.findings.some((finding) => finding.code === "CONFIDENCE_MISSING")).toBe(true);
    expect(validateRecommendation({ scenario: "INFLATED_CONFIDENCE" }).validation.confidence_result.findings.some((finding) => finding.code === "CONFIDENCE_INFLATED")).toBe(true);
  });

  it("validates governance constraints, rejects policy violations, and blocks constitutional conflicts", () => {
    expect(validateRecommendation().validation.governance_result.status).toBe("PASS");
    expect(validateRecommendation({ scenario: "POLICY_VIOLATION" }).validation.governance_result.findings.some((finding) => finding.code === "POLICY_VIOLATION")).toBe(true);
    const conflict = validateRecommendation({ scenario: "CONSTITUTIONAL_CONFLICT" });
    expect(conflict.validation.validation_state).toBe("BLOCKED");
    expect(conflict.validation.governance_result.findings.some((finding) => finding.code === "CONSTITUTIONAL_CONFLICT")).toBe(true);
  });

  it("validates preferred and conservative paths and rejects missing required paths", () => {
    const baseline = validateRecommendation();
    expect(baseline.source_paths.paths.map((path) => path.path_type)).toEqual(expect.arrayContaining(["PREFERRED_PATH", "CONSERVATIVE_PATH"]));
    expect(validateRecommendation({ scenario: "MISSING_PREFERRED" }).validation.alternative_path_result.findings.some((finding) => finding.code === "PREFERRED_PATH_MISSING")).toBe(true);
    expect(validateRecommendation({ scenario: "MISSING_CONSERVATIVE" }).validation.alternative_path_result.findings.some((finding) => finding.code === "CONSERVATIVE_PATH_MISSING")).toBe(true);
    expect(validateRecommendation({ scenario: "MISSING_ESCALATION" }).validation.alternative_path_result.findings.some((finding) => finding.code === "REQUIRED_ESCALATION_PATH_MISSING")).toBe(true);
    expect(validateRecommendation({ scenario: "MISSING_REMEDIATION" }).validation.alternative_path_result.findings.some((finding) => finding.code === "REQUIRED_REMEDIATION_PATH_MISSING")).toBe(true);
  });

  it("detects path evidence, confidence, ordering, and comparison failures", () => {
    expect(validateRecommendation({ scenario: "MISSING_PATH_EVIDENCE" }).validation.alternative_path_result.findings.some((finding) => finding.code === "PATH_EVIDENCE_MISSING")).toBe(true);
    expect(validateRecommendation({ scenario: "CONFIDENCE_MISMATCH" }).validation.alternative_path_result.findings.some((finding) => finding.code === "PATH_CONFIDENCE_UNSUPPORTED")).toBe(true);
    expect(validateRecommendation({ scenario: "ORDERING_MISMATCH" }).validation.alternative_path_result.findings.some((finding) => finding.code === "PATH_ORDERING_MISMATCH")).toBe(true);
    expect(validateRecommendation({ scenario: "COMPARISON_MISMATCH" }).validation.alternative_path_result.findings.some((finding) => finding.code === "PATH_COMPARISON_MISMATCH")).toBe(true);
  });

  it("enforces advisory-only boundaries and blocks execution or mutation authority", () => {
    const baseline = validateRecommendation();
    expect(baseline.validation.advisory_only_result.status).toBe("PASS");
    expect(validateRecommendation({ scenario: "EXECUTION_AUTHORITY" }).validation.validation_state).toBe("BLOCKED");
    const mutation = validateRecommendation({ scenario: "MUTATION_AUTHORITY" });
    expect(mutation.validation.validation_state).toBe("BLOCKED");
    expect(mutation.validation.advisory_only_result.findings.some((finding) => finding.code === "MUTATION_AUTHORITY_DETECTED")).toBe(true);
  });

  it("preserves tenant isolation and blocks cross-tenant evidence or paths", () => {
    expect(validateRecommendation().validation.tenant_isolation_result.status).toBe("PASS");
    const crossTenant = validateRecommendation({ scenario: "CROSS_TENANT" });
    expect(crossTenant.validation.validation_state).toBe("BLOCKED");
    expect(crossTenant.validation.tenant_isolation_result.findings.some((finding) => finding.code === "TENANT_BOUNDARY_VIOLATION")).toBe(true);
  });

  it("validates replay readiness and blocks replay-impossible recommendations", () => {
    const baseline = validateRecommendation();
    expect(baseline.replay_state).toBe("REPRODUCED");
    expect(baseline.validation.replay_readiness_result.status).toBe("PASS");
    expect(validateRecommendation({ scenario: "MISSING_REPLAY_REFS" }).validation.replay_readiness_result.findings.some((finding) => finding.code === "REPLAY_REFS_MISSING")).toBe(true);
    const impossible = validateRecommendation({ scenario: "REPLAY_IMPOSSIBLE" });
    expect(impossible.validation.validation_state).toBe("BLOCKED");
    expect(impossible.validation.replay_readiness_result.findings.some((finding) => finding.code === "REPLAY_IMPOSSIBLE")).toBe(true);
  });

  it("validates Truth Ledger linkage and blocks ledger mutation attempts", () => {
    expect(validateRecommendation().validation.truth_ledger_result.status).toBe("PASS");
    expect(validateRecommendation({ scenario: "MISSING_LEDGER_LINKAGE" }).validation.truth_ledger_result.findings.some((finding) => finding.code === "LEDGER_LINKAGE_MISSING")).toBe(true);
    const mutation = validateRecommendation({ scenario: "LEDGER_MUTATION_ATTEMPT" });
    expect(mutation.validation.validation_state).toBe("BLOCKED");
    expect(mutation.validation.truth_ledger_result.findings.some((finding) => finding.code === "LEDGER_MUTATION_ATTEMPT")).toBe(true);
  });

  it("records validation decisions in a ledger and exposes operator-visible status", () => {
    const result = validateRecommendation();
    const surface = buildRecommendationValidationObservabilitySurface(result);
    expect(result.ledger_record.validation_ledger_id).toBeTruthy();
    expect(result.ledger_record.alternative_path_refs.length).toBeGreaterThan(0);
    expect(surface.validation_state).toBe("VALIDATED");
    expect(surface.passed_checks).toContain("contract");
    expect(surface.evidence_basis.length).toBeGreaterThan(0);
    expect(surface.risk_basis.length).toBeGreaterThan(0);
    expect(surface.governance_constraints.length).toBeGreaterThan(0);
    expect(surface.alternative_path_status).toBe("PASS");
    expect(surface.advisory_only_status).toBe("PASS");
    expect(surface.replay_readiness).toBe("PASS");
    expect(surface.truth_ledger_linkage).toBe("PASS");
  });

  it("replays validation decisions and detects validation mismatches", () => {
    const result = validateRecommendation();
    expect(computeRecommendationValidationHash(result.validation)).toBe(result.validation.validation_hash);
    expect(replayRecommendationValidation(result.validation).replay_state).toBe("REPRODUCED");
    const mismatch = validateRecommendation({ scenario: "VALIDATION_MISMATCH" });
    expect(replayRecommendationValidation(mismatch.validation).replay_state).toBe("MISMATCH");
    expect(mismatch.certification_state).toBe("FAIL");
  });
});
