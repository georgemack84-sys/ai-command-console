import { describe, expect, it } from "vitest";
import {
  getProductionCertificationGateBundle,
  replayProductionCertificationGate,
  runProductionCertificationGate,
  validateProductionCertificationGate,
} from "@/services/production-certification-gate";
import type { ProductionCertificationFailure } from "@/types/production-certification-gate";

describe("Mission Control Phase 15.12 Production Certification Gate", () => {
  it("publishes production certification gate doctrine", () => {
    const bundle = getProductionCertificationGateBundle();

    expect(bundle.doctrine.version).toBe("production-certification-gate/v15.12");
    expect(bundle.doctrine.upstream_phase).toBe("production-observability-operator-control/v15.11");
    expect(bundle.doctrine.evidence_requirements).toHaveLength(10);
    expect(bundle.validation.valid).toBe(true);
  });

  it("collects complete immutable production certification evidence", () => {
    const result = runProductionCertificationGate();

    expect(result.evidence.complete).toBe(true);
    expect(result.evidence.integrity_verified).toBe(true);
    expect(result.evidence.freshness_verified).toBe(true);
    expect(result.evidence.lineage_complete).toBe(true);
    expect(result.certification_record.certification_outcome).toBe("PASS");
  });

  it("validates qualification, compliance, and operational readiness", () => {
    const result = runProductionCertificationGate();

    expect(result.qualification.production_environment_qualified).toBe(true);
    expect(result.qualification.rollback_ready).toBe(true);
    expect(result.compliance.advisory_only_operation).toBe(true);
    expect(result.compliance.direct_execution_capability_absent).toBe(true);
    expect(result.readiness.continuous_assurance_ready).toBe(true);
    expect(result.readiness.production_dashboards_ready).toBe(true);
  });

  it("records deterministic decisions, replay, ledger, and observability", () => {
    const result = runProductionCertificationGate();

    expect(result.decision.outcome).toBe("PASS");
    expect(result.decision.deterministic).toBe(true);
    expect(result.replay.deterministic).toBe(true);
    expect(result.ledger).toHaveLength(8);
    expect(result.ledger.every((entry, index) => entry.sequence === index + 1 && entry.append_only && entry.immutable)).toBe(true);
    expect(result.observability.certification_status_visible).toBe(true);
  });

  it("is deterministic and replayable", () => {
    const first = runProductionCertificationGate();
    const second = runProductionCertificationGate();

    expect(first.outcome).toBe("PASS");
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validateProductionCertificationGate(first).valid).toBe(true);
    expect(replayProductionCertificationGate(first)).toBe(true);
  });

  it("executes the Phase 15.12 core certification matrix", () => {
    const result = runProductionCertificationGate();

    expect(result.certification_tests).toHaveLength(18);
    expect(result.certification_tests.every((test) => test.expected === "PASS" && test.actual === "PASS" && test.passed && test.evidence_refs.length > 0)).toBe(true);
    expect(result.certification_tests.map((test) => test.name)).toEqual([
      "Phase 14 certification valid",
      "Release artifact matches certified artifact",
      "Build provenance complete",
      "Production environment qualified",
      "Promotion authority enforced",
      "Advisory-only boundary enforced",
      "Direct execution impossible",
      "Tenant isolation continuously verified",
      "Canary and exposure policies enforced",
      "Production replay deterministic",
      "Unexplained divergence fail-closed",
      "Rollback validated",
      "Incident evidence immutable",
      "Recovery requires requalification",
      "Continuous assurance operational",
      "Certification freshness enforced",
      "Operator actions attributable",
      "Observability complete",
    ]);
  });

  it("supports conditional pass for non-constitutional certification warnings", () => {
    const result = runProductionCertificationGate({ scenario: "NON_CONSTITUTIONAL_PRODUCTION_CERTIFICATION_WARNING" });
    const validation = validateProductionCertificationGate(result);

    expect(result.outcome).toBe("CONDITIONAL_PASS");
    expect(validation.valid).toBe(false);
  });

  it.each([
    "PHASE_14_CERTIFICATION_INVALID",
    "RELEASE_ARTIFACT_MISMATCH",
    "BUILD_PROVENANCE_INCOMPLETE",
    "PRODUCTION_ENVIRONMENT_NOT_QUALIFIED",
    "PROMOTION_AUTHORITY_NOT_ENFORCED",
    "ADVISORY_ONLY_BOUNDARY_NOT_ENFORCED",
    "DIRECT_EXECUTION_POSSIBLE",
    "TENANT_ISOLATION_NOT_CONTINUOUSLY_VERIFIED",
    "CANARY_EXPOSURE_POLICIES_NOT_ENFORCED",
    "PRODUCTION_REPLAY_NON_DETERMINISTIC",
    "UNEXPLAINED_DIVERGENCE_NOT_FAIL_CLOSED",
    "ROLLBACK_NOT_VALIDATED",
    "INCIDENT_EVIDENCE_MUTABLE",
    "RECOVERY_REQUALIFICATION_NOT_REQUIRED",
    "CONTINUOUS_ASSURANCE_NOT_OPERATIONAL",
    "CERTIFICATION_FRESHNESS_NOT_ENFORCED",
    "OPERATOR_ACTIONS_NOT_ATTRIBUTABLE",
    "OBSERVABILITY_INCOMPLETE",
    "CERTIFICATION_EVIDENCE_INCOMPLETE",
    "CERTIFICATION_REPLAY_NON_DETERMINISTIC",
    "CERTIFICATION_LEDGER_MUTABLE",
  ] as const)("fails certification for %s", (scenario: ProductionCertificationFailure) => {
    const result = runProductionCertificationGate({ scenario });
    const validation = validateProductionCertificationGate(result);

    expect(result.outcome).toBe("FAIL");
    expect(result.failures).toContain(scenario);
    expect(validation.valid).toBe(false);
  });

  it("detects nested certification record tampering", () => {
    const result = runProductionCertificationGate();
    const tampered = {
      ...result,
      certification_record: {
        ...result.certification_record,
        certification_outcome: "FAIL" as const,
      },
    };

    expect(validateProductionCertificationGate(tampered).valid).toBe(false);
  });
});
