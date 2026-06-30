import { describe, expect, it } from "vitest";
import {
  buildGovernanceQueryCertificationObservabilitySurface,
  computeGovernanceQueryCertificationHash,
  getGovernanceQueryCertificationContract,
  runGovernanceQueryCertification,
  validateGovernanceQueryCertification,
} from "@/services/governance-query-certification";
import type { GovernanceQueryCertificationScenario } from "@/types/governance-query-certification";

describe("Mission Control Phase 7J.5 Query Certification Gate", () => {
  it("defines the deterministic query certification doctrine", () => {
    const contract = getGovernanceQueryCertificationContract();

    expect(contract.doctrine.schema_version).toBe("governance-query-certification/v7J.5");
    expect(contract.doctrine.principles).toContain("deterministic");
    expect(contract.doctrine.principles).toContain("auditable");
    expect(contract.doctrine.certified_phases).toContain("7J.4 Cross-Ledger Governance Correlation");
    expect(contract.doctrine.decision_outcomes).toEqual(["PASS", "CONDITIONAL_PASS", "FAIL"]);
  });

  it("issues PASS when the complete 7J framework is certified", () => {
    const response = runGovernanceQueryCertification();

    expect(response.phase_version).toBe("7J.5");
    expect(response.status).toBe("PASS");
    expect(response.downstream_governance_enabled).toBe(true);
    expect(response.report.overall_status).toBe("PASS");
    expect(response.report.tests_failed).toBe(0);
    expect(response.report.replay_validation).toBe(true);
    expect(response.report.lineage_validation).toBe(true);
    expect(response.report.evidence_validation).toBe(true);
    expect(response.report.security_validation).toBe(true);
    expect(response.report.tenant_validation).toBe(true);
    expect(response.report.visibility_validation).toBe(true);
  });

  it("produces immutable, reproducible certification reports", () => {
    const first = runGovernanceQueryCertification();
    const second = runGovernanceQueryCertification();

    expect(second.report.certification_hash).toBe(first.report.certification_hash);
    expect(computeGovernanceQueryCertificationHash(first)).toBe(first.report.certification_hash);
    expect(first.report.truth_ledger_record.report_hash).toBe(first.report.certification_hash);
    expect(first.report.truth_ledger_record.immutable).toBe(true);
  });

  it("issues CONDITIONAL_PASS only for non-critical optimization gaps", () => {
    const response = runGovernanceQueryCertification({ scenario: "MINOR_PERFORMANCE_OPTIMIZATION" });
    const validation = validateGovernanceQueryCertification({ scenario: "MINOR_PERFORMANCE_OPTIMIZATION" });

    expect(response.status).toBe("CONDITIONAL_PASS");
    expect(response.downstream_governance_enabled).toBe(false);
    expect(response.report.tests_failed).toBe(0);
    expect(response.report.category_results.some((category) => category.category_status === "CONDITIONAL_PASS")).toBe(true);
    expect(validation.status).toBe("CONDITIONAL_PASS");
  });

  it.each([
    "MISSING_QUERY_CONTRACT",
    "QUERY_SCHEMA_INVALID",
    "POLICY_LOOKUP_MISMATCH",
    "RECOMMENDATION_REPLAY_MISMATCH",
    "VIOLATION_MISMATCH",
    "ESCALATION_MISMATCH",
    "RECONSTRUCTION_MISMATCH",
    "CORRELATION_MISMATCH",
    "REPLAY_RECONSTRUCTION_MISMATCH",
    "LINEAGE_MISMATCH",
    "EVIDENCE_MISMATCH",
    "NONDETERMINISTIC_ORDERING",
    "CROSS_TENANT_QUERY_PERMITTED",
    "UNAUTHORIZED_QUERY_ACCEPTED",
    "LEDGER_REFERENCE_MUTATION",
    "REPLAY_FAILURE",
    "HIDDEN_GOVERNANCE_RECORDS",
    "HASH_MISMATCH",
    "UNEXPLAINED_GOVERNANCE_RELATIONSHIP",
    "MISSING_AUDIT_HISTORY",
  ] as readonly GovernanceQueryCertificationScenario[])("blocks downstream governance on %s", (scenario) => {
    const response = runGovernanceQueryCertification({ scenario });

    expect(response.status).toBe("FAIL");
    expect(response.downstream_governance_enabled).toBe(false);
    expect(response.report.tests_failed).toBeGreaterThan(0);
    expect(response.tests.some((test) => test.actual === "FAIL" && test.critical)).toBe(true);
  });

  it("exposes operator observability for certification failures", () => {
    const surface = buildGovernanceQueryCertificationObservabilitySurface({ scenario: "HASH_MISMATCH" });

    expect(surface.status).toBe("FAIL");
    expect(surface.downstream_governance_enabled).toBe(false);
    expect(surface.tests_failed).toBeGreaterThan(0);
    expect(surface.critical_failures).toBeGreaterThan(0);
    expect(surface.certification_hash).toBeTruthy();
  });
});
