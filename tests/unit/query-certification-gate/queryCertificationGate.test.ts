import { describe, expect, it, vi } from "vitest";
import {
  buildQueryCertificationObservabilitySurface,
  computeQueryCertificationReportHash,
  getQueryCertificationContract,
  runQueryCertification,
  validateQueryCertificationReport,
} from "@/services/query-certification-gate";
import type { QueryCertificationFailure, QueryCertificationScenario, QueryCertificationState } from "@/types/query-certification-gate";

vi.setConfig({ testTimeout: 180000 });

describe("Mission Control Phase 8I.10 Query Certification Gate", () => {
  it("defines the query certification doctrine and states", () => {
    const contract = getQueryCertificationContract();

    expect(contract.doctrine.schema_version).toBe("query-certification-gate/v8I.10");
    expect(contract.doctrine.certification_states).toEqual(["PASS", "CONDITIONAL_PASS", "FAIL"]);
    expect(contract.doctrine.principles).toContain("fail-closed");
    expect(contract.doctrine.certification_scope).toContain("Cross-Reference Search");
    expect(contract.doctrine.certification_scope).toContain("Query Security");
  });

  it("certifies the complete 8I query subsystem for production when all tests pass", () => {
    const report = runQueryCertification();
    const validation = validateQueryCertificationReport(report);

    expect(report.phase_version).toBe("8I.10");
    expect(report.phase).toBe("8I");
    expect(report.certification_state).toBe("PASS");
    expect(report.operator_approval_status).toBe("APPROVED_FOR_PRODUCTION");
    expect(report.production_ready).toBe(true);
    expect(report.failed_tests).toEqual([]);
    expect(report.certification_tests.every((test) => test.passed)).toBe(true);
    expect(report.functional_score).toBe(1);
    expect(report.security_score).toBe(1);
    expect(validation.certified).toBe(true);
    expect(validation.validation_state).toBe("VALID");
  });

  it("allows conditional pass only for non-critical visualization gaps", () => {
    const report = runQueryCertification({ scenario: "MINOR_VISUALIZATION_GAP" });
    const validation = validateQueryCertificationReport(report);

    expect(report.certification_state).toBe("CONDITIONAL_PASS");
    expect(report.operator_approval_status).toBe("APPROVED_FOR_STAGING");
    expect(report.production_ready).toBe(false);
    expect(report.warnings).toContain("MINOR_VISUALIZATION_GAP");
    expect(report.failed_tests.every((test) => !test.mandatory)).toBe(true);
    expect(validation.validation_state).toBe("VALID");
    expect(validation.certified).toBe(false);
  });

  it.each([
    ["QUERY_CONTRACT_MISSING", "QUERY_CONTRACT_NOT_CERTIFIED"],
    ["QUERY_SCHEMA_INVALID", "QUERY_SCHEMA_NOT_CERTIFIED"],
    ["PLAN_LOOKUP_NONREPRODUCIBLE", "PLAN_LOOKUP_NOT_REPRODUCIBLE"],
    ["EXECUTION_LOOKUP_NONREPRODUCIBLE", "EXECUTION_LOOKUP_NOT_REPRODUCIBLE"],
    ["DELEGATION_LOOKUP_NONREPRODUCIBLE", "DELEGATION_LOOKUP_NOT_REPRODUCIBLE"],
    ["SUPERVISION_LOOKUP_NONREPRODUCIBLE", "SUPERVISION_LOOKUP_NOT_REPRODUCIBLE"],
    ["REPLAY_LOOKUP_NONREPRODUCIBLE", "REPLAY_LOOKUP_NOT_REPRODUCIBLE"],
    ["INTERVENTION_LOOKUP_NONREPRODUCIBLE", "INTERVENTION_LOOKUP_NOT_REPRODUCIBLE"],
    ["POLICY_LOOKUP_NONREPRODUCIBLE", "POLICY_LOOKUP_NOT_REPRODUCIBLE"],
    ["HISTORICAL_RECONSTRUCTION_NONDETERMINISTIC", "HISTORICAL_RECONSTRUCTION_NOT_DETERMINISTIC"],
    ["RECONSTRUCTION_MISMATCH_UNDETECTED", "RECONSTRUCTION_MISMATCH_NOT_DETECTED"],
    ["LINEAGE_SEARCH_NONDETERMINISTIC", "LINEAGE_SEARCH_NOT_DETERMINISTIC"],
    ["BROKEN_LINEAGE_UNDETECTED", "BROKEN_LINEAGE_NOT_DETECTED"],
    ["CROSS_REFERENCE_NONDETERMINISTIC", "CROSS_REFERENCE_SEARCH_NOT_DETERMINISTIC"],
    ["MISSING_REFERENCE_UNDETECTED", "MISSING_REFERENCE_NOT_DETECTED"],
    ["CONFLICTING_REFERENCE_UNSURFACED", "CONFLICTING_REFERENCE_NOT_SURFACED"],
    ["ORDERING_NONDETERMINISTIC", "DETERMINISTIC_ORDERING_NOT_CERTIFIED"],
    ["TENANT_ISOLATION_BROKEN", "TENANT_ISOLATION_NOT_CERTIFIED"],
    ["CROSS_TENANT_QUERY_ACCEPTED", "CROSS_TENANT_QUERY_NOT_REJECTED"],
    ["UNAUTHORIZED_QUERY_ACCEPTED", "UNAUTHORIZED_QUERY_NOT_REJECTED"],
    ["READ_ONLY_ENFORCEMENT_BROKEN", "READ_ONLY_BEHAVIOR_NOT_CERTIFIED"],
    ["QUERY_MUTATION_ACCEPTED", "QUERY_MUTATION_NOT_REJECTED"],
    ["REPLAY_REFERENCE_LOST", "REPLAY_REFERENCE_NOT_PRESERVED"],
    ["INTEGRITY_REFERENCE_LOST", "INTEGRITY_REFERENCE_NOT_PRESERVED"],
    ["HIDDEN_AUTONOMOUS_STATE_UNDETECTED", "HIDDEN_AUTONOMOUS_STATE_NOT_DETECTED"],
    ["AUDIT_RECORD_MISSING", "QUERY_AUDIT_NOT_CERTIFIED"],
  ] as readonly [QueryCertificationScenario, QueryCertificationFailure][])(
    "fails closed for %s",
    (scenario, failure) => {
      const report = runQueryCertification({ scenario });

      expect(report.certification_state).toBe("FAIL" satisfies QueryCertificationState);
      expect(report.operator_approval_status).toBe("BLOCKED");
      expect(report.production_ready).toBe(false);
      expect(report.detected_findings).toContain(failure);
      expect(report.failed_tests.map((test) => test.failure_reason)).toContain(failure);
      expect(validateQueryCertificationReport(report).validation_state).toBe("INVALID");
    },
  );

  it("produces complete evidence and a stable report hash", () => {
    const report = runQueryCertification();

    expect(report.certification_evidence.query_contract_hash).toBeTruthy();
    expect(report.certification_evidence.autonomy_search_hash).toBeTruthy();
    expect(report.certification_evidence.plan_execution_hash).toBeTruthy();
    expect(report.certification_evidence.delegation_orchestration_hash).toBeTruthy();
    expect(report.certification_evidence.supervision_intervention_boundary_hash).toBeTruthy();
    expect(report.certification_evidence.replay_reconstruction_hash).toBeTruthy();
    expect(report.certification_evidence.lineage_search_hash).toBeTruthy();
    expect(report.certification_evidence.cross_reference_hash).toBeTruthy();
    expect(report.certification_evidence.security_hash).toBeTruthy();
    expect(report.report_hash).toBe(computeQueryCertificationReportHash(report));
    expect(runQueryCertification().report_hash).toBe(report.report_hash);
  });

  it("exposes operator certification dashboard metrics", () => {
    const surface = buildQueryCertificationObservabilitySurface(runQueryCertification({ scenario: "CROSS_TENANT_QUERY_ACCEPTED" }));

    expect(surface.certification_state).toBe("FAIL");
    expect(surface.failures).toContain("CROSS_TENANT_QUERY_NOT_REJECTED");
    expect(surface.operator_approval_status).toBe("BLOCKED");
    expect(surface.production_ready).toBe(false);
    expect(surface.failed_tests).toBeGreaterThan(0);
    expect(surface.security_score).toBeLessThan(1);
  });
});
