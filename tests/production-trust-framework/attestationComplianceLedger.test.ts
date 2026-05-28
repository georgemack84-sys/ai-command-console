import { describe, expect, it } from "vitest";
import { buildComplianceEvidenceBundle, certifyProductionSurvivability } from "@/services/production-trust-framework";
import { appendLedgerFixture, buildDeploymentAttestationFixture, buildProductionTrustFixture } from "./helpers";

describe("attestation, compliance evidence, and operational ledger", () => {
  it("creates deployment attestation without deployment execution", () => {
    const { certification } = buildProductionTrustFixture();
    const attestation = buildDeploymentAttestationFixture(certification);

    expect(attestation.registryHash).toBe(certification.registryHash);
    expect(attestation.deploymentConstraints).toContain("attestation-only");
  });

  it("produces deterministic compliance evidence hashes and append-only ledger entries", () => {
    const { certification } = buildProductionTrustFixture();
    const first = buildComplianceEvidenceBundle({
      productionTrustId: "production-trust-001",
      certificationId: certification.certificationId,
      registryHash: certification.registryHash,
      certificationHash: certification.certificationHash,
      replayValidation: { valid: true, hash: certification.replayHash },
      governanceValidation: { valid: true, hash: certification.governanceHash },
      integrityValidation: { valid: true, hash: certification.integrityHash },
      adversarialValidation: { valid: true, hash: "sha256:adv" },
      survivabilityValidation: { valid: true, hash: "sha256:survive" },
      revocationStatus: "certified",
      forensicTimelineHash: "sha256:timeline",
      generatedAt: "2026-05-16T12:00:00.000Z",
    });
    const second = buildComplianceEvidenceBundle({
      productionTrustId: "production-trust-001",
      certificationId: certification.certificationId,
      registryHash: certification.registryHash,
      certificationHash: certification.certificationHash,
      replayValidation: { valid: true, hash: certification.replayHash },
      governanceValidation: { valid: true, hash: certification.governanceHash },
      integrityValidation: { valid: true, hash: certification.integrityHash },
      adversarialValidation: { valid: true, hash: "sha256:adv" },
      survivabilityValidation: { valid: true, hash: "sha256:survive" },
      revocationStatus: "certified",
      forensicTimelineHash: "sha256:timeline",
      generatedAt: "2026-05-16T12:00:00.000Z",
    });
    const ledger = appendLedgerFixture();

    expect(first.evidenceHash).toBe(second.evidenceHash);
    expect(ledger).toHaveLength(2);
    expect(ledger[0]?.eventType).toBe("certification.created");
    expect(ledger[1]?.eventType).toBe("compliance.evidence.generated");
  });

  it("denies survivability certification when recovery bypasses staged controls", () => {
    const { trustCertification } = buildProductionTrustFixture();
    const result = certifyProductionSurvivability({
      failureState: {
        ...buildProductionTrustFixture().input.failureState,
        recovery: {
          ...buildProductionTrustFixture().input.failureState.recovery,
          allowed: true,
          governanceReapprovalRequired: true,
        },
      },
      trustCertification,
    });

    expect(result.valid).toBe(false);
    expect(result.errors.some((error) => error.code === "RECOVERY_VALIDATION_FAILED")).toBe(true);
  });
});
