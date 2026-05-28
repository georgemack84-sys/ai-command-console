import { describe, expect, it } from "vitest";
import {
  monitorProductionTrust,
  recommendProductionFreeze,
  verifyProductionTrustAuthority,
} from "@/services/production-trust-framework";
import { buildProductionTrustFixture, buildRevokedCertification } from "./helpers";

describe("production authority and monitoring", () => {
  it("rejects revoked and expired certifications", () => {
    const { certification } = buildProductionTrustFixture();
    const revoked = verifyProductionTrustAuthority({
      certification,
      currentTime: "2026-05-16T12:00:00.000Z",
      authorityId: "governance-authority-01",
      authorityStatus: "known",
      expectedRegistryHash: certification.registryHash,
      expectedReplayHash: certification.replayHash,
      expectedGovernanceHash: certification.governanceHash,
      expectedIntegrityHash: certification.integrityHash,
      revoked: true,
      adversarialValidationPresent: true,
    });
    const expired = verifyProductionTrustAuthority({
      certification: {
        ...certification,
        expiresAt: "2026-05-15T00:00:00.000Z",
      },
      currentTime: "2026-05-16T12:00:00.000Z",
      authorityId: "governance-authority-01",
      authorityStatus: "known",
      expectedRegistryHash: certification.registryHash,
      expectedReplayHash: certification.replayHash,
      expectedGovernanceHash: certification.governanceHash,
      expectedIntegrityHash: certification.integrityHash,
      adversarialValidationPresent: true,
    });

    expect(revoked.trusted).toBe(false);
    expect(revoked.error?.code).toBe("DEPLOYMENT_TRUST_REVOKED");
    expect(expired.trusted).toBe(false);
    expect(expired.error?.code).toBe("CERTIFICATION_EXPIRED");
    expect(buildRevokedCertification(certification)?.reason).toBe("MANUAL_GOVERNANCE_REVOKE");
  });

  it("recommends freeze on drift and recertification on expiring trust", () => {
    const { certification } = buildProductionTrustFixture();
    const freeze = monitorProductionTrust({
      certification,
      currentTime: "2026-05-16T12:00:00.000Z",
      driftDetected: true,
      governanceDrift: true,
    });
    const recert = monitorProductionTrust({
      certification: {
        ...certification,
        expiresAt: "2026-05-16T12:00:00.000Z",
      },
      currentTime: "2026-05-16T12:00:00.000Z",
      driftDetected: false,
    });
    const freezeDecision = recommendProductionFreeze({
      certificationTrusted: false,
      registryIntegrityValid: false,
      replayValid: false,
      governanceValid: false,
      adversarialValidationPassed: false,
      runtimeSupported: false,
      unknownMutationDetected: true,
    });

    expect(freeze.recommendation).toBe("freeze");
    expect(freeze.errorCode).toBe("PRODUCTION_DRIFT_DETECTED");
    expect(recert.recommendation).toBe("recertification");
    expect(recert.errorCode).toBe("RECERTIFICATION_REQUIRED");
    expect(freezeDecision.freeze).toBe(true);
    expect(freezeDecision.reasonCode).toBe("PRODUCTION_FREEZE_REQUIRED");
  });
});
