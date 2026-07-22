import { describe, expect, it } from "vitest";
import {
  getOperationalSafetyIncidentResponseRollbackBundle,
  replayOperationalSafetyIncidentResponseRollback,
  runOperationalSafetyIncidentResponseRollback,
  validateOperationalSafetyIncidentResponseRollback,
} from "@/services/operational-safety-incident-response-rollback";
import type { OperationalSafetyFailure } from "@/types/operational-safety-incident-response-rollback";

describe("Mission Control Phase 15.9 Operational Safety, Incident Response & Rollback", () => {
  it("publishes operational safety doctrine", () => {
    const bundle = getOperationalSafetyIncidentResponseRollbackBundle();

    expect(bundle.doctrine.version).toBe("operational-safety-incident-response-rollback/v15.9");
    expect(bundle.doctrine.upstream_phase).toBe("production-replay-digital-twin-validation/v15.8");
    expect(bundle.doctrine.response_vocabulary).toEqual(["MONITOR", "RESTRICT_SCOPE", "FREEZE_PROMOTION", "DISABLE_CAPABILITY", "ISOLATE_TENANT", "REVOKE_RELEASE", "ROLLBACK", "FAIL_CLOSED", "REQUIRE_GOVERNANCE_REVIEW", "REQUIRE_RECERTIFICATION"]);
    expect(bundle.validation.valid).toBe(true);
  });

  it("registers and classifies incidents deterministically", () => {
    const result = runOperationalSafetyIncidentResponseRollback();

    expect(result.incident.deterministic_state).toBe(true);
    expect(result.incident.containment_status).toBe("ACTIVE");
    expect(result.classification.reproducible).toBe(true);
    expect(result.classification.unknown_incident_fail_closed).toBe(true);
  });

  it("keeps containment and rollback governed", () => {
    const result = runOperationalSafetyIncidentResponseRollback();

    expect(result.containment.deterministic).toBe(true);
    expect(result.containment.equivalent_incidents_identical).toBe(true);
    expect(result.containment.mandatory_constitutional_containment_weakened).toBe(false);
    expect(result.rollback.advisory_only).toBe(true);
    expect(result.rollback.independent_authorization_required).toBe(true);
    expect(result.rollback.authorized_execution_ref.length).toBeGreaterThan(0);
  });

  it("preserves forensic evidence, recovery qualification, and lineage", () => {
    const result = runOperationalSafetyIncidentResponseRollback();

    expect(result.forensics.immutable).toBe(true);
    expect(result.forensics.integrity_verified).toBe(true);
    expect(result.recovery.recovery_qualified).toBe(true);
    expect(result.recovery.unqualified_recovery_blocked).toBe(true);
    expect(result.lineage.complete).toBe(true);
    expect(result.lineage.searchable_after_recovery).toBe(true);
  });

  it("records append-only operational safety ledger entries", () => {
    const result = runOperationalSafetyIncidentResponseRollback();

    expect(result.ledger).toHaveLength(8);
    expect(result.ledger.every((entry, index) => entry.sequence === index + 1 && entry.append_only && entry.immutable && entry.replay_refs.length > 0)).toBe(true);
  });

  it("is deterministic and replayable", () => {
    const first = runOperationalSafetyIncidentResponseRollback();
    const second = runOperationalSafetyIncidentResponseRollback();

    expect(first.outcome).toBe("PASS");
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validateOperationalSafetyIncidentResponseRollback(first).valid).toBe(true);
    expect(replayOperationalSafetyIncidentResponseRollback(first)).toBe(true);
  });

  it("executes the Phase 15.9 certification matrix", () => {
    const result = runOperationalSafetyIncidentResponseRollback();

    expect(result.certification_tests).toHaveLength(24);
    expect(result.certification_tests.every((test) => test.expected === "PASS" && test.actual === "PASS" && test.passed && test.evidence_refs.length > 0)).toBe(true);
    expect(result.certification_tests.map((test) => test.name)).toEqual([
      "Incident lifecycle deterministic",
      "Incident classification reproducible",
      "Containment responses deterministic",
      "Equivalent incidents produce identical responses",
      "Unknown incidents fail closed",
      "Response vocabulary enforced",
      "Rollback recommendations advisory-only",
      "Production rollback independently authorized",
      "Rollback replay deterministic",
      "Rollback evidence preserved",
      "Forensic evidence immutable",
      "Forensic integrity verified",
      "Incident lineage complete",
      "Remediation never rewrites incident history",
      "Recovery qualification mandatory",
      "Recovery without qualification blocked",
      "Certification dependencies validated before recovery",
      "Governance review enforced where required",
      "Tenant containment deterministic",
      "Constitutional authority preserved",
      "Advisory boundary maintained during incidents",
      "Operational Safety Ledger append-only",
      "Replay references preserved",
      "Certification lineage maintained after recovery",
    ]);
  });

  it("supports conditional pass for non-constitutional operational safety warnings", () => {
    const result = runOperationalSafetyIncidentResponseRollback({ scenario: "NON_CONSTITUTIONAL_SAFETY_WARNING" });
    const validation = validateOperationalSafetyIncidentResponseRollback(result);

    expect(result.outcome).toBe("CONDITIONAL_PASS");
    expect(validation.valid).toBe(false);
  });

  it.each([
    "INCIDENT_LIFECYCLE_NON_DETERMINISTIC",
    "INCIDENT_CLASSIFICATION_NOT_REPRODUCIBLE",
    "CONTAINMENT_RESPONSE_NON_DETERMINISTIC",
    "EQUIVALENT_INCIDENTS_DIFFER",
    "UNKNOWN_INCIDENT_NOT_FAIL_CLOSED",
    "RESPONSE_VOCABULARY_NOT_ENFORCED",
    "ROLLBACK_RECOMMENDATION_EXECUTES",
    "ROLLBACK_NOT_INDEPENDENTLY_AUTHORIZED",
    "ROLLBACK_REPLAY_NON_DETERMINISTIC",
    "ROLLBACK_EVIDENCE_NOT_PRESERVED",
    "FORENSIC_EVIDENCE_MUTABLE",
    "FORENSIC_INTEGRITY_NOT_VERIFIED",
    "INCIDENT_LINEAGE_INCOMPLETE",
    "REMEDIATION_REWRITES_HISTORY",
    "RECOVERY_QUALIFICATION_NOT_MANDATORY",
    "UNQUALIFIED_RECOVERY_ALLOWED",
    "CERTIFICATION_DEPENDENCIES_NOT_VALIDATED",
    "GOVERNANCE_REVIEW_NOT_ENFORCED",
    "TENANT_CONTAINMENT_NON_DETERMINISTIC",
    "CONSTITUTIONAL_AUTHORITY_NOT_PRESERVED",
    "ADVISORY_BOUNDARY_BROKEN",
    "SAFETY_LEDGER_NOT_APPEND_ONLY",
    "REPLAY_REFERENCES_LOST",
    "CERTIFICATION_LINEAGE_LOST",
  ] as const)("fails certification for %s", (scenario: OperationalSafetyFailure) => {
    const result = runOperationalSafetyIncidentResponseRollback({ scenario });
    const validation = validateOperationalSafetyIncidentResponseRollback(result);

    expect(result.outcome).toBe("FAIL");
    expect(result.failures).toContain(scenario);
    expect(validation.valid).toBe(false);
  });

  it("detects nested incident tampering", () => {
    const result = runOperationalSafetyIncidentResponseRollback();
    const tampered = {
      ...result,
      incident: {
        ...result.incident,
        containment_status: "NOT_REQUIRED" as const,
      },
    };

    expect(validateOperationalSafetyIncidentResponseRollback(tampered).valid).toBe(false);
  });
});
