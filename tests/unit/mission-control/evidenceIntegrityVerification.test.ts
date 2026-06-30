import { describe, expect, it } from "vitest";
import {
  buildTruthEvidenceContractRequest,
  buildTruthEvidenceRegistrationRequest,
  buildTruthEvidenceVerificationRequest,
  sealTruthEvidenceContract,
  sealTruthEvidenceRegistration,
  sealTruthEvidenceVerification,
} from "@/services/mission-control";

function baseEvidence(overrides: Record<string, unknown> = {}) {
  return sealTruthEvidenceContract({
    request: buildTruthEvidenceContractRequest({
      tenant_id: "tenant-alpha",
      now: "2026-06-20T15:00:00.000Z",
    }),
    missionId: "mission-alpha",
    evidenceType: "EVENT_RECORD",
    evidenceCategory: "EVENT",
    evidenceSource: "EVENT_RECORDER",
    evidencePayload: { observed: true, confidence: 90 },
    payloadType: "event_record",
    payloadVersion: "v1",
    provenance: {
      origin_system: "mission-control",
      origin_reference: "event-1",
      collection_method: "capture",
      collection_timestamp: "2026-06-20T14:59:59.000Z",
      collector_identity: "collector-1",
    },
    relationships: [],
    replayReferenceIds: ["replay-alpha"],
    accessTenantId: "tenant-alpha",
    ...overrides,
  });
}

function baseRegistration(overrides: Record<string, unknown> = {}) {
  return sealTruthEvidenceRegistration({
    request: buildTruthEvidenceRegistrationRequest({
      tenant_id: "tenant-alpha",
      now: "2026-06-20T15:01:00.000Z",
    }),
    evidence: baseEvidence(),
    registrationSource: "EVENT_RECORDER",
    registrationType: "INPUT",
    evidenceReferences: ["event-1"],
    replayReferences: ["replay-alpha"],
    knownReferenceTargets: ["event-1"],
    accessTenantId: "tenant-alpha",
    ...overrides,
  });
}

function baseVerification(overrides: Record<string, unknown> = {}) {
  return {
    request: buildTruthEvidenceVerificationRequest({
      tenant_id: "tenant-alpha",
      now: "2026-06-20T15:02:00.000Z",
    }),
    registration: baseRegistration(),
    trustRationale: "complete, consistent, authentic evidence",
    sourceConfidence: 10,
    lineageConfidence: 5,
    verificationHistoryScore: 5,
    accessTenantId: "tenant-alpha",
    ...overrides,
  };
}

describe("evidenceIntegrityVerification", () => {
  it("passes complete, consistent, authentic evidence and generates deterministic score", () => {
    const first = sealTruthEvidenceVerification(baseVerification());
    const second = sealTruthEvidenceVerification(baseVerification());

    expect(first).toEqual(second);
    expect(first.verification.verification_state).toBe("VERIFIED");
    expect(first.certification).toBe("PASS");
    expect(first.verification.verification_score).toBeGreaterThan(0);
  });

  it("fails missing required field and missing provenance", () => {
    const missingField = sealTruthEvidenceVerification(baseVerification({
      missingRequiredFieldDetected: true,
    }));
    const missingProvenance = sealTruthEvidenceVerification(baseVerification({
      missingProvenanceDetected: true,
    }));

    expect(missingField.validation.reasonCodes).toContain("COMPLETENESS_INCOMPLETE");
    expect(missingProvenance.validation.reasonCodes).toContain("COMPLETENESS_INCOMPLETE");
  });

  it("fails hash mismatch and relationship conflict", () => {
    const hashMismatch = sealTruthEvidenceVerification(baseVerification({
      hashMismatchDetected: true,
    }));
    const relationshipConflict = sealTruthEvidenceVerification(baseVerification({
      relationshipConflictDetected: true,
    }));

    expect(hashMismatch.validation.reasonCodes).toContain("CONSISTENCY_INCONSISTENT");
    expect(relationshipConflict.validation.reasonCodes).toContain("CONSISTENCY_CONFLICTING");
  });

  it("fails source spoofing and signature mismatch", () => {
    const spoofing = sealTruthEvidenceVerification(baseVerification({
      sourceSpoofingDetected: true,
    }));
    const signature = sealTruthEvidenceVerification(baseVerification({
      signatureMismatchDetected: true,
    }));

    expect(spoofing.validation.reasonCodes).toContain("AUTHENTICITY_INVALID");
    expect(signature.validation.reasonCodes).toContain("AUTHENTICITY_INVALID");
  });

  it("assigns conditional trust and fails missing trust rationale", () => {
    const conditional = sealTruthEvidenceVerification(baseVerification({
      originUnverifiableDetected: true,
    }));
    const missingRationale = sealTruthEvidenceVerification(baseVerification({
      trustRationale: "",
    }));

    expect(conditional.visibility.trust_state).toBe("CONDITIONALLY_TRUSTED");
    expect(missingRationale.validation.reasonCodes).toContain("TRUST_RATIONALE_MISSING");
  });

  it("fails non-deterministic score and replay mismatch", () => {
    const nondeterministic = sealTruthEvidenceVerification(baseVerification({
      nonDeterministicScoreDetected: true,
    }));
    const replayMismatch = sealTruthEvidenceVerification(baseVerification({
      replayMismatchDetected: true,
    }));

    expect(nondeterministic.validation.reasonCodes).toContain("INTEGRITY_SCORE_INVALID");
    expect(replayMismatch.replay.replayResult).toBe("MISMATCH");
  });

  it("blocks cross-tenant verification and trust calculation", () => {
    const verificationLeak = sealTruthEvidenceVerification(baseVerification({
      crossTenantVerificationDetected: true,
    }));
    const trustLeak = sealTruthEvidenceVerification(baseVerification({
      crossTenantTrustCalculationDetected: true,
    }));

    expect(verificationLeak.validation.reasonCodes).toContain("TENANT_ISOLATION_FAILED");
    expect(trustLeak.validation.reasonCodes).toContain("TENANT_ISOLATION_FAILED");
  });
});
