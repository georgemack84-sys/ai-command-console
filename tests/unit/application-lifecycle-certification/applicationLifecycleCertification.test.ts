import { describe, expect, it } from "vitest";
import {
  getApplicationLifecycleCertificationBundle,
  replayApplicationLifecycleCertification,
  runApplicationLifecycleCertification,
  validateApplicationLifecycleCertification,
} from "@/services/application-lifecycle-certification";
import type { ApplicationLifecycleCertificationScenario } from "@/types/application-lifecycle-certification";

describe("Program 4 P4.5 Application Lifecycle and Certification", () => {
  it("publishes lifecycle certification doctrine and requires certification for production eligibility", () => {
    const bundle = getApplicationLifecycleCertificationBundle();

    expect(bundle.doctrine.version).toBe("application-lifecycle-certification/v4.5");
    expect(bundle.doctrine.owns_application_lifecycle).toBe(true);
    expect(bundle.doctrine.owns_application_version_lineage).toBe(true);
    expect(bundle.doctrine.owns_certification_execution).toBe(true);
    expect(bundle.doctrine.owns_certification_governance).toBe(true);
    expect(bundle.doctrine.owns_certification_evidence).toBe(true);
    expect(bundle.doctrine.owns_certification_status_management).toBe(true);
    expect(bundle.doctrine.supports_renewal_suspension_revocation_expiration).toBe(true);
    expect(bundle.doctrine.production_requires_certification).toBe(true);
    expect(bundle.validation.valid).toBe(true);
  });

  it("executes deterministic lifecycle certification and generates a production-eligible certificate", () => {
    const first = runApplicationLifecycleCertification();
    const second = runApplicationLifecycleCertification();

    expect(first.application_identity_ref).toBe("application-identity-tenancy-namespace/v4.4");
    expect(first.lifecycle_model).toEqual(["REGISTERED", "DEVELOPMENT", "VALIDATION", "CERTIFICATION", "ACTIVE", "SUSPENDED", "RETIRED", "ARCHIVED"]);
    expect(first.lifecycle_record.lifecycle_state).toBe("ACTIVE");
    expect(first.certificate.certificate_status).toBe("CERTIFIED");
    expect(first.certificate.production_eligible).toBe(true);
    expect(first.status_registry.current_status).toBe("CERTIFIED");
    expect(first.certification.outcome).toBe("PASS");
    expect(first.certification.phase_ready).toBe(true);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validateApplicationLifecycleCertification(first).valid).toBe(true);
    expect(replayApplicationLifecycleCertification(first)).toBe(true);
  });

  it("enforces lineage, evidence, governance, tenant compatibility, and immutable ledgers", () => {
    const result = runApplicationLifecycleCertification();

    expect(result.version_lineage.complete).toBe(true);
    expect(result.version_lineage.immutable).toBe(true);
    expect(result.certification_execution.constitutional_compliance_validated).toBe(true);
    expect(result.certification_evidence.complete).toBe(true);
    expect(result.certification_evidence.immutable).toBe(true);
    expect(result.certification_governance.renewal_supported).toBe(true);
    expect(result.certification_governance.suspension_supported).toBe(true);
    expect(result.certification_governance.revocation_supported).toBe(true);
    expect(result.certification_governance.expiration_supported).toBe(true);
    expect(result.certification_governance.revocation_invalidates_production).toBe(true);
    expect(result.certification_governance.expired_requires_requalification).toBe(true);
    expect(result.tenant_qualification.result).toBe("PASS");
    expect(result.ledgers.complete).toBe(true);
    expect(result.ledgers.immutable).toBe(true);
  });

  it.each([
    "P4_4_IDENTITY_INVALID",
    "CCI_LIFECYCLE_SERVICES_INVALID",
    "CCI_CERTIFICATION_INFRASTRUCTURE_INVALID",
    "TQF_TENANT_CONTRACT_INVALID",
    "LIFECYCLE_MODEL_INCOMPLETE",
    "MULTIPLE_LIFECYCLES_DETECTED",
    "LIFECYCLE_TRANSITION_INVALID",
    "LIFECYCLE_TRANSITION_NON_DETERMINISTIC",
    "VERSION_LINEAGE_INCOMPLETE",
    "VERSION_LINEAGE_MUTABLE",
    "CERTIFICATION_FRAMEWORK_MISSING",
    "CERTIFICATION_EXECUTION_FAILED",
    "CERTIFICATION_PREREQUISITES_MISSING",
    "CONSTITUTIONAL_COMPLIANCE_NOT_VALIDATED",
    "DEPENDENCY_VERIFICATION_FAILED",
    "POLICY_VALIDATION_FAILED",
    "GOVERNANCE_VALIDATION_FAILED",
    "TENANT_CONTRACT_COMPATIBILITY_FAILED",
    "CERTIFICATION_EVIDENCE_MISSING",
    "CERTIFICATION_EVIDENCE_MUTABLE",
    "CERTIFICATION_DECISION_NOT_AUDITABLE",
    "CERTIFICATE_NOT_GENERATED",
    "CERTIFICATION_STATUS_REGISTRY_INVALID",
    "CERTIFICATION_RENEWAL_UNSUPPORTED",
    "CERTIFICATION_SUSPENSION_UNSUPPORTED",
    "CERTIFICATION_REVOCATION_UNSUPPORTED",
    "CERTIFICATION_EXPIRATION_UNSUPPORTED",
    "REVOCATION_DOES_NOT_INVALIDATE_PRODUCTION",
    "EXPIRED_CERTIFICATION_REQUALIFICATION_MISSING",
    "CERTIFICATION_ACTION_LEDGER_INCOMPLETE",
    "LIFECYCLE_TRANSITION_LEDGER_INCOMPLETE",
  ] as const)("fails lifecycle certification for %s", (scenario: ApplicationLifecycleCertificationScenario) => {
    const result = runApplicationLifecycleCertification({ scenario });
    const validation = validateApplicationLifecycleCertification(result);

    expect(result.certification.outcome).toBe("FAIL");
    expect(result.certification.phase_ready).toBe(false);
    expect(result.certification.failures).toContain(scenario);
    expect(validation.valid).toBe(false);
  }, 300000);

  it("supports pruned certification outcomes", () => {
    const result = runApplicationLifecycleCertification({ scenario: "CERTIFICATION_PRUNED" });

    expect(result.certification.outcome).toBe("PRUNED");
    expect(result.certification.failures).toContain("CERTIFICATION_PRUNED");
  });
});
