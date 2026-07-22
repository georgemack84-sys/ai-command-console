import { describe, expect, it } from "vitest";
import {
  getContinuousAssuranceCertificationBundle,
  replayContinuousAssuranceCertification,
  runContinuousAssuranceCertification,
  validateContinuousAssuranceCertification,
} from "@/services/continuous-assurance-certification";
import type { ContinuousAssuranceFailure } from "@/types/continuous-assurance-certification";

describe("Mission Control Phase 15.10 Continuous Assurance & Certification", () => {
  it("publishes continuous assurance doctrine", () => {
    const bundle = getContinuousAssuranceCertificationBundle();

    expect(bundle.doctrine.version).toBe("continuous-assurance-certification/v15.10");
    expect(bundle.doctrine.upstream_phase).toBe("operational-safety-incident-response-rollback/v15.9");
    expect(bundle.doctrine.health_states).toEqual(["HEALTHY", "DEGRADED", "REQUIRES_REVIEW", "RECERTIFICATION_REQUIRED", "INVALID"]);
    expect(bundle.validation.valid).toBe(true);
  });

  it("evaluates certification continuously and monitors health", () => {
    const result = runContinuousAssuranceCertification();

    expect(result.evaluation.decision).toBe("CERTIFICATION_VALID");
    expect(result.evaluation.deterministic).toBe(true);
    expect(result.health.state).toBe("HEALTHY");
    expect(result.health.invalid_certification_identified).toBe(true);
  });

  it("enforces evidence freshness and dependency reverification", () => {
    const result = runContinuousAssuranceCertification();

    expect(result.freshness.status).toBe("CURRENT");
    expect(result.freshness.expired_evidence_rejected).toBe(true);
    expect(result.freshness.superseded_evidence_rejected).toBe(true);
    expect(result.dependency_reverification.status).toBe("VERIFIED");
    expect(result.dependency_reverification.reproducible).toBe(true);
  });

  it("schedules deterministic recertification and records certification state", () => {
    const result = runContinuousAssuranceCertification();

    expect(result.recertification_schedule.triggers).toHaveLength(10);
    expect(result.recertification_schedule.deterministic_triggers).toBe(true);
    expect(result.recertification_schedule.reproducible_schedule).toBe(true);
    expect(result.certification_record.certification_status).toBe("ACTIVE");
    expect(result.certification_record.recertification_due).toBe(false);
  });

  it("maintains append-only production certification ledger", () => {
    const result = runContinuousAssuranceCertification();

    expect(result.ledger).toHaveLength(8);
    expect(result.ledger.every((entry, index) => entry.sequence === index + 1 && entry.append_only && entry.immutable && entry.replayable && entry.tenant_isolated)).toBe(true);
  });

  it("is deterministic and replayable", () => {
    const first = runContinuousAssuranceCertification();
    const second = runContinuousAssuranceCertification();

    expect(first.outcome).toBe("PASS");
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validateContinuousAssuranceCertification(first).valid).toBe(true);
    expect(replayContinuousAssuranceCertification(first)).toBe(true);
  });

  it("executes the Phase 15.10 certification matrix", () => {
    const result = runContinuousAssuranceCertification();

    expect(result.certification_tests).toHaveLength(12);
    expect(result.certification_tests.every((test) => test.expected === "PASS" && test.actual === "PASS" && test.passed && test.evidence_refs.length > 0)).toBe(true);
    expect(result.certification_tests.map((test) => test.name)).toEqual([
      "Continuous assurance deterministic",
      "Certification health monitored",
      "Evidence freshness enforced",
      "Expired evidence rejected",
      "Dependency reverification reproducible",
      "Material change detection deterministic",
      "Recertification scheduling deterministic",
      "Certification lineage immutable",
      "Replay reproducible",
      "Fail-closed certification enforced",
      "Invalid certifications blocked",
      "Ledger append-only",
    ]);
  });

  it("supports conditional pass for non-constitutional assurance warnings", () => {
    const result = runContinuousAssuranceCertification({ scenario: "NON_CONSTITUTIONAL_ASSURANCE_WARNING" });
    const validation = validateContinuousAssuranceCertification(result);

    expect(result.outcome).toBe("CONDITIONAL_PASS");
    expect(validation.valid).toBe(false);
  });

  it.each([
    "ASSURANCE_NON_DETERMINISTIC",
    "CERTIFICATION_HEALTH_NOT_MONITORED",
    "EVIDENCE_FRESHNESS_NOT_ENFORCED",
    "EXPIRED_EVIDENCE_ACCEPTED",
    "DEPENDENCY_REVERIFICATION_NOT_REPRODUCIBLE",
    "MATERIAL_CHANGE_DETECTION_NON_DETERMINISTIC",
    "RECERTIFICATION_SCHEDULING_NON_DETERMINISTIC",
    "CERTIFICATION_LINEAGE_MUTABLE",
    "REPLAY_NOT_REPRODUCIBLE",
    "FAIL_CLOSED_NOT_ENFORCED",
    "INVALID_CERTIFICATION_ACTIVE",
    "LEDGER_NOT_APPEND_ONLY",
  ] as const)("fails certification for %s", (scenario: ContinuousAssuranceFailure) => {
    const result = runContinuousAssuranceCertification({ scenario });
    const validation = validateContinuousAssuranceCertification(result);

    expect(result.outcome).toBe("FAIL");
    expect(result.failures).toContain(scenario);
    expect(validation.valid).toBe(false);
  });

  it("detects nested certification record tampering", () => {
    const result = runContinuousAssuranceCertification();
    const tampered = {
      ...result,
      certification_record: {
        ...result.certification_record,
        certification_status: "INVALID" as const,
      },
    };

    expect(validateContinuousAssuranceCertification(tampered).valid).toBe(false);
  });
});
