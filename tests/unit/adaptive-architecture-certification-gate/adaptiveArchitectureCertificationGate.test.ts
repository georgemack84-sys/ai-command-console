import { describe, expect, it } from "vitest";
import {
  ADAPTIVE_ARCHITECTURE_CERTIFICATION_SCOPE,
  computeAdaptiveArchitectureCertificationHash,
  getAdaptiveArchitectureCertificationGateFoundation,
  replayAdaptiveArchitectureCertificationGate,
  runAdaptiveArchitectureCertificationGate,
} from "@/services/adaptive-architecture-certification-gate";
import type { AdaptiveArchitectureCertificationGateInput, AdaptiveArchitectureFailure } from "@/types/adaptive-architecture-certification-gate";

describe("Mission Control Phase 10.0.10 Adaptive Intelligence Architecture Certification Gate", () => {
  it("publishes the architecture certification gate foundation", () => {
    const foundation = getAdaptiveArchitectureCertificationGateFoundation();

    expect(foundation.certification_gate_version).toBe("adaptive-architecture-certification-gate/v1");
    expect(foundation.scope).toEqual(ADAPTIVE_ARCHITECTURE_CERTIFICATION_SCOPE);
    expect(foundation.result.validation.validation_status).toBe("VALID");
  });

  it("issues a PASS certification for the complete Phase 10.0 architecture", () => {
    const result = runAdaptiveArchitectureCertificationGate();

    expect(result.certification.final_certification_state).toBe("PASS");
    expect(result.certification_report.certification_decision).toBe("PASS");
    expect(result.phase_10_1_authorized).toBe(true);
    expect(result.validation.production_promotion_authorized).toBe(true);
  });

  it("creates an integrity-protected certification record", () => {
    const result = runAdaptiveArchitectureCertificationGate();

    expect(computeAdaptiveArchitectureCertificationHash(result.certification)).toBe(result.certification.integrity_hash);
    expect(result.certification.certification_id).toBe("adaptive_architecture_certification_001");
    expect(result.certification.architecture_version).toBe("phase-10.0");
    expect(result.certification.certification_scope).toEqual(ADAPTIVE_ARCHITECTURE_CERTIFICATION_SCOPE);
  });

  it("passes every mandatory certification test in the baseline", () => {
    const result = runAdaptiveArchitectureCertificationGate();

    expect(result.certification_tests.length).toBeGreaterThan(30);
    expect(result.certification.failed_tests).toEqual([]);
    expect(result.certification.passed_tests).toHaveLength(result.certification_tests.length);
    expect(result.validation.all_mandatory_tests_passed).toBe(true);
  });

  it("verifies replay, governance, constitutional, authority, operator, and security validations", () => {
    const result = runAdaptiveArchitectureCertificationGate();

    expect(result.certification.replay_validation).toBe("PASS");
    expect(result.certification.governance_validation).toBe("PASS");
    expect(result.certification.constitutional_validation).toBe("PASS");
    expect(result.certification.authority_validation).toBe("PASS");
    expect(result.certification.operator_validation).toBe("PASS");
    expect(result.certification.security_validation).toBe("PASS");
  });

  it("produces complete immutable certification evidence", () => {
    const result = runAdaptiveArchitectureCertificationGate();

    expect(result.evidence_package.immutable).toBe(true);
    expect(result.evidence_package.evidence_refs.length).toBeGreaterThan(0);
    expect(result.production_readiness_report.certification_evidence_complete).toBe(true);
    expect(result.validation.evidence_consistent).toBe(true);
  });

  it("records certification evidence in an append-only ledger", () => {
    const result = runAdaptiveArchitectureCertificationGate();

    expect(result.certification_ledger).toHaveLength(1);
    expect(result.certification_ledger[0].append_only).toBe(true);
    expect(result.certification_ledger[0].deleted).toBe(false);
    expect(result.certification_ledger[0].certification_state).toBe("PASS");
  });

  it("certifies production readiness before Phase 10.1 authorization", () => {
    const result = runAdaptiveArchitectureCertificationGate();

    expect(result.production_readiness_report.production_ready).toBe(true);
    expect(result.certification_report.production_readiness_verified).toBe(true);
    expect(result.phase_10_1_authorized).toBe(true);
    expect(result.permits_uncertified_deployment).toBe(false);
    expect(result.permits_partial_certification).toBe(false);
    expect(result.permits_execution).toBe(false);
  });

  it("reports certification dashboard status", () => {
    const result = runAdaptiveArchitectureCertificationGate();

    expect(result.dashboard.certification_outcome).toBe("PASS");
    expect(result.dashboard.failed_tests).toBe(0);
    expect(result.dashboard.certification_progress).toBe(1);
    expect(result.dashboard.production_readiness).toBe("PASS");
  });

  it.each([
    ["DOCUMENTATION_DEFICIENCY", "DOCUMENTATION_DEFICIENCY"],
    ["REPORTING_DEFICIENCY", "REPORTING_DEFICIENCY"],
    ["DASHBOARD_DEFICIENCY", "DASHBOARD_DEFICIENCY"],
    ["VISUALIZATION_DEFICIENCY", "VISUALIZATION_DEFICIENCY"],
  ] as readonly [NonNullable<AdaptiveArchitectureCertificationGateInput["scenario"]>, AdaptiveArchitectureFailure][])("issues CONDITIONAL_PASS but blocks progression for %s", (scenario, failure) => {
    const result = runAdaptiveArchitectureCertificationGate({ scenario });

    expect(result.certification.final_certification_state).toBe("CONDITIONAL_PASS");
    expect(result.validation.validation_status).toBe("BLOCKED");
    expect(result.validation.failures).toContain(failure);
    expect(result.phase_10_1_authorized).toBe(false);
  });

  it.each([
    ["MANDATORY_TEST_FAILED", "MANDATORY_TEST_FAILED"],
    ["REPLAY_DIVERGED", "REPLAY_DIVERGED"],
    ["GOVERNANCE_OMITTED", "GOVERNANCE_OMITTED"],
    ["CONSTITUTIONAL_WEAKENED", "CONSTITUTIONAL_PROTECTION_WEAKENED"],
    ["AUTHORITY_EXPANDED", "AUTHORITY_EXPANDED"],
    ["DETERMINISTIC_FAILURE", "DETERMINISTIC_FAILURE"],
    ["ADVISORY_ONLY_VIOLATION", "ADVISORY_ONLY_VIOLATED"],
    ["OPERATOR_BYPASS", "OPERATOR_APPROVAL_BYPASSED"],
    ["TENANT_FAILURE", "TENANT_ISOLATION_COMPROMISED"],
    ["HIDDEN_LEARNING", "HIDDEN_LEARNING_DETECTED"],
    ["HIDDEN_MEMORY", "HIDDEN_MEMORY_DETECTED"],
    ["SELF_MODIFICATION", "SELF_MODIFICATION_DETECTED"],
    ["UNAUTHORIZED_ADAPTATION", "UNAUTHORIZED_ADAPTATION_DETECTED"],
    ["REPLAY_OMISSION", "REPLAY_OMISSION"],
    ["GOVERNANCE_BYPASS", "GOVERNANCE_BYPASS"],
    ["LEDGER_MUTATION", "IMMUTABLE_LEDGER_MUTATION"],
    ["EVIDENCE_INCONSISTENT", "CERTIFICATION_EVIDENCE_INCONSISTENT"],
    ["INTEGRITY_FAILURE", "INTEGRITY_VERIFICATION_FAILED"],
    ["UNCERTIFIED_DEPLOYMENT", "UNCERTIFIED_ADAPTIVE_DEPLOYMENT"],
    ["PARTIAL_CERTIFICATION", "PARTIAL_CERTIFICATION_ATTEMPTED"],
    ["CERTIFICATION_FORGERY", "CERTIFICATION_FORGERY"],
    ["HIDDEN_ARCHITECTURAL_CHANGE", "HIDDEN_ARCHITECTURAL_CHANGE"],
    ["UNAUTHORIZED_PRODUCTION_PROMOTION", "UNAUTHORIZED_PRODUCTION_PROMOTION"],
    ["EVIDENCE_TAMPERING", "EVIDENCE_TAMPERING"],
    ["FAIL_OPEN", "FAIL_OPEN_CERTIFICATION_BEHAVIOR"],
  ] as readonly [NonNullable<AdaptiveArchitectureCertificationGateInput["scenario"]>, AdaptiveArchitectureFailure][])("fails closed for %s", (scenario, failure) => {
    const result = runAdaptiveArchitectureCertificationGate({ scenario });

    expect(result.certification.final_certification_state).toBe("FAIL");
    expect(result.validation.validation_status).toBe("BLOCKED");
    expect(result.validation.failures).toContain(failure);
    expect(result.certification_report.certification_decision).toBe("FAIL");
    expect(result.phase_10_1_authorized).toBe(false);
    expect(result.permits_uncertified_deployment).toBe(false);
    expect(result.permits_partial_certification).toBe(false);
  });

  it("fails closed when the role lacks certification visibility", () => {
    const result = runAdaptiveArchitectureCertificationGate({ role: "ADMINISTRATOR" });

    expect(result.validation.validation_status).toBe("BLOCKED");
    expect(result.validation.failures).toContain("AUTHORIZATION_FAILURE");
    expect(result.phase_10_1_authorized).toBe(false);
  });

  it("detects certification result tampering", () => {
    const result = runAdaptiveArchitectureCertificationGate();
    const tampered = { ...result, replay_hash: "tampered" };

    expect(replayAdaptiveArchitectureCertificationGate(tampered)).toBe(false);
  });
});
