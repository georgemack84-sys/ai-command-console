import { describe, expect, it } from "vitest";
import {
  buildDecisionTestingObservability,
  generateCoverageReport,
  generateTestEvidence,
  getDecisionTestingReplayValidationFramework,
  injectDecisionFailure,
  runDecisionOrchestrationTests,
  validateDecisionReplay,
} from "@/services/decision-testing-replay-validation";

describe("decision testing and replay validation framework", () => {
  it("runs the complete Phase 9.1 testing matrix", () => {
    const report = runDecisionOrchestrationTests();

    expect(report.validation_status).toBe("PASS");
    expect(report.certification_ready).toBe(true);
    expect(report.advisory_only).toBe(true);
    expect(report.test_matrix).toEqual(["UNIT", "INTEGRATION", "REPLAY", "BOUNDARY", "FAILURE_INJECTION", "SERIALIZATION", "TENANT_ISOLATION"]);
    expect(report.evidence_records.every((record) => record.actual_result === "PASS")).toBe(true);
    expect(report.integrity_hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it("validates deterministic replay fidelity", () => {
    const replay = validateDecisionReplay();

    expect(replay.replay_valid).toBe(true);
    expect(replay.original_hash).toBe(replay.replayed_hash);
    expect(replay.metadata.replay_status).toBe("PASS");
    expect(replay.metadata.integrity_hash).toMatch(/^[a-f0-9]{64}$/);
    expect(replay.evidence.actual_result).toBe("PASS");
  });

  it.each([
    "HASH_CORRUPTION",
    "REPLAY_CORRUPTION",
    "SERIALIZATION_CORRUPTION",
    "POLICY_CORRUPTION",
    "LINEAGE_CORRUPTION",
    "MISSING_REFERENCES",
    "AUTHORITY_FAILURE",
    "API_FAILURE",
    "VALIDATION_FAILURE",
    "TIMEOUT",
  ] as const)("fails closed for injected %s", (scenario) => {
    const result = injectDecisionFailure(scenario);

    expect(result.actual_result).toBe("PASS");
    expect(result.prevented_orchestration).toBe(true);
    expect(result.diagnostics.length).toBeGreaterThan(0);
    expect(result.evidence.actual_result).toBe("PASS");
  });

  it("generates immutable evidence records", () => {
    const evidence = generateTestEvidence({
      test_category: "SERIALIZATION",
      test_name: "canonical serialization sample",
      actual_result: "PASS",
    });

    expect(evidence.expected_result).toBe("PASS");
    expect(evidence.integrity_hash).toMatch(/^[a-f0-9]{64}$/);
    expect(evidence.replay_reference).toContain("replay_serialization");
  });

  it("reports full required coverage", () => {
    const report = runDecisionOrchestrationTests();
    const coverage = generateCoverageReport(report.evidence_records);

    expect(coverage.coverage_status).toBe("PASS");
    expect(coverage.total_coverage).toBe(100);
    expect(coverage.public_api_coverage).toBe(100);
    expect(coverage.sdk_interface_coverage).toBe(100);
  });

  it("emits testing observability", () => {
    const report = runDecisionOrchestrationTests();
    const observability = buildDecisionTestingObservability(report);

    expect(observability.test_execution_count).toBe(report.evidence_records.length);
    expect(observability.pass_rate).toBe(1);
    expect(observability.fail_rate).toBe(0);
    expect(observability.boundary_rejection_rate).toBe(1);
    expect(observability.serialization_consistency).toBe(1);
    expect(observability.tenant_isolation_violations).toBe(0);
    expect(observability.coverage_percentage).toBe(100);
  });

  it("exposes the framework package for certification gating", () => {
    const framework = getDecisionTestingReplayValidationFramework();

    expect(framework.report.validation_status).toBe("PASS");
    expect(framework.replay_validation.replay_valid).toBe(true);
    expect(framework.coverage.coverage_status).toBe("PASS");
    expect(framework.observability.deterministic_validation_rate).toBe(1);
  });
});
