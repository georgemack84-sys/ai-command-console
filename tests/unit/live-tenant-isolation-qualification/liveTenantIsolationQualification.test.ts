import { describe, expect, it } from "vitest";
import {
  getLiveTenantIsolationQualificationBundle,
  replayLiveTenantIsolationQualification,
  runLiveTenantIsolationQualification,
  validateLiveTenantIsolationQualification,
} from "@/services/live-tenant-isolation-qualification";
import type { LiveTenantIsolationFailure } from "@/types/live-tenant-isolation-qualification";

describe("Mission Control Phase 15.7 Live Tenant Isolation Qualification", () => {
  it("publishes live tenant isolation doctrine", () => {
    const bundle = getLiveTenantIsolationQualificationBundle();

    expect(bundle.doctrine.version).toBe("live-tenant-isolation-qualification/v15.7");
    expect(bundle.doctrine.upstream_phase).toBe("production-boundary-enforcement/v15.6");
    expect(bundle.doctrine.domains).toEqual(["Identity", "Memory", "Evidence", "Policy", "Artifacts", "Cache", "Telemetry", "Replay"]);
    expect(bundle.validation.valid).toBe(true);
  });

  it("collects continuous tenant isolation observations", () => {
    const result = runLiveTenantIsolationQualification();

    expect(result.observation.identity_refs).toHaveLength(1);
    expect(result.observation.continuously_verified).toBe(true);
    expect(result.observation.lineage_refs.length).toBeGreaterThan(0);
    expect(result.attestation.reproducible).toBe(true);
    expect(result.attestation.identity_integrity).toBe(true);
    expect(result.attestation.memory_ownership).toBe(true);
  });

  it("detects no cross-tenant access and preserves incidents", () => {
    const result = runLiveTenantIsolationQualification();

    expect(result.detector.deterministic).toBe(true);
    expect(result.detector.identity_crossover_detected).toBe(false);
    expect(result.detector.memory_crossover_detected).toBe(false);
    expect(result.detector.domains_validated).toHaveLength(8);
    expect(result.incident_registry).toHaveLength(1);
    expect(result.incident_registry[0].immutable).toBe(true);
    expect(result.incident_registry[0].replayable).toBe(true);
  });

  it("keeps containment externally governed and replayable", () => {
    const result = runLiveTenantIsolationQualification();

    expect(result.containment.mission_control_recommends_only).toBe(true);
    expect(result.containment.external_authorization_required).toBe(true);
    expect(result.containment.operational).toBe(true);
    expect(result.replay.deterministic_replay).toBe(true);
    expect(result.replay.preserves_original_tenant_isolation).toBe(true);
  });

  it("is deterministic and replayable", () => {
    const first = runLiveTenantIsolationQualification();
    const second = runLiveTenantIsolationQualification();

    expect(first.outcome).toBe("PASS");
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validateLiveTenantIsolationQualification(first).valid).toBe(true);
    expect(replayLiveTenantIsolationQualification(first)).toBe(true);
  });

  it("executes the Phase 15.7 certification matrix", () => {
    const result = runLiveTenantIsolationQualification();

    expect(result.certification_tests).toHaveLength(14);
    expect(result.certification_tests.every((test) => test.expected === "PASS" && test.actual === "PASS" && test.passed && test.evidence_refs.length > 0)).toBe(true);
    expect(result.certification_tests.map((test) => test.name)).toEqual([
      "No unauthorized cross-tenant access",
      "Isolation continuously verified",
      "Tenant containment operational",
      "Isolation incidents replayable",
      "Boundary attestations reproducible",
      "Cross-tenant detection deterministic",
      "Mission Control remains advisory-only",
      "Containment authority externally governed",
      "Replay preserves tenant isolation",
      "Forensic lineage immutable",
      "Continuous qualification integrated with production governance",
      "Tenant interactions attributable to exactly one tenant",
      "Tenant runtime state not visible cross-tenant",
      "Memory ownership remains tenant scoped",
    ]);
  });

  it("supports conditional pass for non-constitutional isolation warnings", () => {
    const result = runLiveTenantIsolationQualification({ scenario: "NON_CONSTITUTIONAL_ISOLATION_WARNING" });
    const validation = validateLiveTenantIsolationQualification(result);

    expect(result.outcome).toBe("CONDITIONAL_PASS");
    expect(validation.valid).toBe(false);
  });

  it.each([
    "UNAUTHORIZED_CROSS_TENANT_ACCESS",
    "ISOLATION_NOT_CONTINUOUSLY_VERIFIED",
    "TENANT_CONTAINMENT_NOT_OPERATIONAL",
    "INCIDENTS_NOT_REPLAYABLE",
    "BOUNDARY_ATTESTATIONS_NOT_REPRODUCIBLE",
    "CROSS_TENANT_DETECTION_NON_DETERMINISTIC",
    "MISSION_CONTROL_NOT_ADVISORY_ONLY",
    "CONTAINMENT_AUTHORITY_NOT_EXTERNAL",
    "REPLAY_DOES_NOT_PRESERVE_TENANT_ISOLATION",
    "FORENSIC_LINEAGE_MUTABLE",
    "CONTINUOUS_QUALIFICATION_NOT_INTEGRATED",
    "IDENTITY_NOT_ATTRIBUTABLE_TO_ONE_TENANT",
    "TENANT_RUNTIME_STATE_VISIBLE",
    "MEMORY_OWNERSHIP_CROSSES_TENANT",
  ] as const)("fails certification for %s", (scenario: LiveTenantIsolationFailure) => {
    const result = runLiveTenantIsolationQualification({ scenario });
    const validation = validateLiveTenantIsolationQualification(result);

    expect(result.outcome).toBe("FAIL");
    expect(result.failures).toContain(scenario);
    expect(validation.valid).toBe(false);
  });

  it("detects nested observation tampering", () => {
    const result = runLiveTenantIsolationQualification();
    const tampered = {
      ...result,
      observation: {
        ...result.observation,
        tenant_id: "tampered",
      },
    };

    expect(validateLiveTenantIsolationQualification(tampered).valid).toBe(false);
  });
});
