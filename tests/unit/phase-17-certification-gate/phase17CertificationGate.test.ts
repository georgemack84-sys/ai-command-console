import { describe, expect, it } from "vitest";
import {
  getPhase17CertificationGateBundle,
  replayPhase17CertificationGate,
  runPhase17CertificationGate,
  validatePhase17CertificationGate,
} from "@/services/phase-17-certification-gate";
import type { Phase17CertificationGateFailure } from "@/types/phase-17-certification-gate";

describe("Mission Control Phase 17.12 Phase 17 Certification Gate", () => {
  it("publishes Phase 17 certification gate doctrine", () => {
    const bundle = getPhase17CertificationGateBundle();

    expect(bundle.doctrine.version).toBe("phase-17-certification-gate/v17.12");
    expect(bundle.doctrine.upstream_phase).toBe("operational-resilience-recovery-governance/v17.11");
    expect(bundle.doctrine.domains).toHaveLength(10);
    expect(bundle.doctrine.pipeline_stages).toContain("POST_RECOVERY_REQUALIFICATION_VALIDATION");
    expect(bundle.validation.valid).toBe(true);
  });

  it("evaluates every Phase 17 certification domain", () => {
    const result = runPhase17CertificationGate();

    expect(result.certification_engine.domains).toHaveLength(10);
    expect(result.certification_engine.complete_certification_required).toBe(true);
    expect(result.production_scale_framework.production_scale_certified).toBe(true);
    expect(result.production_scale_framework.global_replay_deterministic).toBe(true);
  });

  it("aggregates immutable required evidence", () => {
    const result = runPhase17CertificationGate();

    expect(result.evidence_aggregator.required_evidence.length).toBeGreaterThanOrEqual(14);
    expect(result.evidence_aggregator.evidence_manifest.length).toBeGreaterThan(0);
    expect(result.evidence_aggregator.unresolved_evidence).toHaveLength(0);
    expect(result.evidence_aggregator.immutable_audit_verified).toBe(true);
  });

  it("runs the deterministic certification decision pipeline", () => {
    const result = runPhase17CertificationGate();

    expect(result.decision_service.pipeline).toHaveLength(10);
    expect(result.decision_service.replay_validated).toBe(true);
    expect(result.decision_service.governance_validated).toBe(true);
    expect(result.decision_service.decision).toBe("PASS");
  });

  it("preserves immutable lineage and ledger history", () => {
    const result = runPhase17CertificationGate();

    expect(result.lineage_registry.artifacts).toHaveLength(10);
    expect(result.lineage_registry.immutable).toBe(true);
    expect(result.certification_ledger).toHaveLength(10);
    expect(result.certification_ledger.every((entry, index) => entry.sequence === index + 1 && entry.append_only && entry.immutable)).toBe(true);
  });

  it("issues final ecosystem production approval only on PASS", () => {
    const result = runPhase17CertificationGate({ approval_scope: "global ecosystem production" });

    expect(result.approval_report.approval_scope).toBe("global ecosystem production");
    expect(result.approval_report.outcome).toBe("PASS");
    expect(result.approval_report.production_deployment_authorized).toBe(true);
    expect(result.certification_package.platform_approved_for_ecosystem_scale_multi_tenant_production_deployment).toBe(true);
  });

  it("is deterministic and replayable", () => {
    const first = runPhase17CertificationGate();
    const second = runPhase17CertificationGate();

    expect(first.outcome).toBe("PASS");
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validatePhase17CertificationGate(first).valid).toBe(true);
    expect(replayPhase17CertificationGate(first)).toBe(true);
  });

  it("executes the Phase 17 certification matrix and exit criteria", () => {
    const result = runPhase17CertificationGate();

    expect(result.certification_tests).toHaveLength(17);
    expect(result.certification_tests.every((test) => test.expected === "PASS" && test.actual === "PASS" && test.passed && test.evidence_refs.length > 0)).toBe(true);
  }, 300000);

  it("supports conditional pass for non-constitutional Phase 17 warnings", () => {
    const result = runPhase17CertificationGate({ scenario: "NON_CONSTITUTIONAL_PHASE_17_WARNING" });
    const validation = validatePhase17CertificationGate(result);

    expect(result.outcome).toBe("CONDITIONAL_PASS");
    expect(result.approval_report.outcome).toBe("CONDITIONAL_PASS");
    expect(result.approval_report.restrictions.length).toBeGreaterThan(0);
    expect(validation.valid).toBe(false);
  });

  it("blocks certification on unresolved divergence", () => {
    const result = runPhase17CertificationGate({ scenario: "UNRESOLVED_DIVERGENCE_PRESENT" });

    expect(result.outcome).toBe("FAIL");
    expect(result.evidence_aggregator.unresolved_evidence).toContain("unresolved divergence report");
    expect(result.approval_report.production_deployment_authorized).toBe(false);
  });

  it.each([
    "MULTI_TENANT_PRODUCTION_ARCHITECTURE_NOT_VALIDATED",
    "TENANT_LIFECYCLE_GOVERNANCE_NOT_VALIDATED",
    "REGIONAL_ASSIGNMENT_CONFLICT_RESOLUTION_NOT_DETERMINISTIC",
    "RESOURCE_SCHEDULING_TENANT_ISOLATION_NOT_PRESERVED",
    "GLOBAL_WORKLOAD_DISTRIBUTION_NOT_REPLAYABLE",
    "CONTINUOUS_CERTIFICATION_NOT_OPERATIONAL",
    "FAILURE_CONTAINMENT_RECOVERY_REQUALIFICATION_NOT_VALIDATED",
    "PRODUCTION_SCALE_NOT_CERTIFIED",
    "TENANT_ISOLATION_NOT_VERIFIED_AT_SCALE",
    "GLOBAL_REPLAY_NOT_DETERMINISTIC",
    "GOVERNANCE_NOT_PRESERVED",
    "FAILURE_CONTAINMENT_NOT_VALIDATED",
    "DETERMINISTIC_RECOVERY_NOT_VERIFIED",
    "POST_RECOVERY_REQUALIFICATION_INCOMPLETE",
    "PLATFORM_NOT_APPROVED_FOR_ECOSYSTEM_PRODUCTION",
    "UNRESOLVED_DIVERGENCE_PRESENT",
    "CERTIFICATION_LINEAGE_CORRUPTED",
    "PHASE_17_11_RESILIENCE_NOT_VALID",
  ] as const)("fails certification for %s", (scenario: Phase17CertificationGateFailure) => {
    const result = runPhase17CertificationGate({ scenario });
    const validation = validatePhase17CertificationGate(result);

    expect(result.outcome).toBe("FAIL");
    expect(result.failures).toContain(scenario);
    expect(validation.valid).toBe(false);
  });

  it("detects certification decision tampering", () => {
    const result = runPhase17CertificationGate();
    const tampered = {
      ...result,
      decision_service: {
        ...result.decision_service,
        decision: "FAIL" as const,
      },
    };

    expect(validatePhase17CertificationGate(tampered).valid).toBe(false);
  });
});
