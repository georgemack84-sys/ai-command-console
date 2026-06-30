import { describe, expect, it } from "vitest";
import {
  buildTruthEvidenceCertificationRequest,
  buildTruthEvidenceContractRequest,
  buildTruthEvidenceRegistrationRequest,
  buildTruthEvidenceRelationshipGraphRequest,
  buildTruthEvidenceVerificationRequest,
  sealTruthEvidenceCertificationGate,
  sealTruthEvidenceContract,
  sealTruthEvidenceRegistration,
  sealTruthEvidenceRelationshipGraph,
  sealTruthEvidenceVerification,
} from "@/services/mission-control";

function baseEvidence(
  evidenceId: string,
  originReference: string,
  overrides: Record<string, unknown> = {},
) {
  return sealTruthEvidenceContract({
    request: buildTruthEvidenceContractRequest({
      tenant_id: "tenant-alpha",
      now: "2026-06-20T17:00:00.000Z",
    }),
    missionId: "mission-alpha",
    evidenceType: "EVENT_RECORD",
    evidenceCategory: "EVENT",
    evidenceSource: "EVENT_RECORDER",
    evidencePayload: { evidenceId, signal: originReference },
    payloadType: "event_record",
    payloadVersion: "v1",
    provenance: {
      origin_system: "mission-control",
      origin_reference: originReference,
      collection_method: "capture",
      collection_timestamp: "2026-06-20T16:59:00.000Z",
      collector_identity: "collector-cert",
    },
    relationships: [],
    replayReferenceIds: [`replay-${evidenceId}`],
    accessTenantId: "tenant-alpha",
    ...overrides,
  });
}

function baseRegistration(
  evidenceId: string,
  originReference: string,
  overrides: Record<string, unknown> = {},
) {
  return sealTruthEvidenceRegistration({
    request: buildTruthEvidenceRegistrationRequest({
      tenant_id: "tenant-alpha",
      now: "2026-06-20T17:01:00.000Z",
    }),
    evidence: baseEvidence(evidenceId, originReference),
    registrationSource: "EVENT_RECORDER",
    registrationType: "INPUT",
    evidenceReferences: [originReference],
    replayReferences: [`replay-${evidenceId}`],
    knownReferenceTargets: [originReference],
    accessTenantId: "tenant-alpha",
    ...overrides,
  });
}

function baseVerification(
  evidenceId: string,
  originReference: string,
  overrides: Record<string, unknown> = {},
) {
  return sealTruthEvidenceVerification({
    request: buildTruthEvidenceVerificationRequest({
      tenant_id: "tenant-alpha",
      now: "2026-06-20T17:02:00.000Z",
    }),
    registration: baseRegistration(evidenceId, originReference),
    trustRationale: "complete, consistent, authentic evidence",
    sourceConfidence: 10,
    lineageConfidence: 5,
    verificationHistoryScore: 5,
    accessTenantId: "tenant-alpha",
    ...overrides,
  });
}

function evidenceStack() {
  const sourceVerification = baseVerification("evidence-source", "event-source");
  const targetVerification = baseVerification("evidence-target", "event-target");
  const sourceEvidenceId = sourceVerification.registration.evidence.evidence.evidence_id;
  const targetEvidenceId = targetVerification.registration.evidence.evidence.evidence_id;
  const evidenceGraph = sealTruthEvidenceRelationshipGraph({
    request: buildTruthEvidenceRelationshipGraphRequest({
      tenant_id: "tenant-alpha",
      now: "2026-06-20T17:03:00.000Z",
    }),
    sourceVerification,
    targetVerification,
    relationshipType: "DEPENDS_ON",
    relationshipReason: "source depends on target evidence",
    knownEvidenceIds: [sourceEvidenceId, targetEvidenceId],
    accessTenantId: "tenant-alpha",
  });

  return {
    evidenceContract: sourceVerification.registration.evidence,
    evidenceRegistration: sourceVerification.registration,
    evidenceIntegrity: sourceVerification,
    evidenceGraph,
  };
}

describe("evidenceCertificationGate", () => {
  it("passes when all evidence layer domains pass", () => {
    const base = evidenceStack();
    const result = sealTruthEvidenceCertificationGate({
      request: buildTruthEvidenceCertificationRequest({
        tenant_id: "tenant-alpha",
        now: "2026-06-20T17:04:00.000Z",
      }),
      ...base,
      certificationAuthority: "CERTIFICATION_ENGINE",
      certificationReason: "Evidence layer ready",
      accessTenantId: "tenant-alpha",
    });

    expect(result.certification.certification_state).toBe("PASS");
    expect(result.completionGate).toBe("EVIDENCE_LAYER_CERTIFIED");
    expect(result.replay.replayResult).toBe("REPRODUCED");
  });

  it("fails when evidence or replay references are missing", () => {
    const base = evidenceStack();
    const missingEvidence = sealTruthEvidenceCertificationGate({
      request: buildTruthEvidenceCertificationRequest({
        tenant_id: "tenant-alpha",
        now: "2026-06-20T17:04:00.000Z",
      }),
      ...base,
      certificationAuthority: "CERTIFICATION_ENGINE",
      certificationReason: "Missing evidence",
      evidenceReferences: [],
    });
    const missingReplay = sealTruthEvidenceCertificationGate({
      request: buildTruthEvidenceCertificationRequest({
        tenant_id: "tenant-alpha",
        now: "2026-06-20T17:04:00.000Z",
      }),
      ...base,
      certificationAuthority: "CERTIFICATION_ENGINE",
      certificationReason: "Missing replay",
      replayReferences: [],
    });

    expect(missingEvidence.validation.reasonCodes).toContain("EVIDENCE_REFERENCES_MISSING");
    expect(missingReplay.validation.reasonCodes).toContain("REPLAY_REFERENCES_MISSING");
  });

  it("fails aggregate certification when contract, registration, integrity, or graph domains fail", () => {
    const base = evidenceStack();
    const contractFail = sealTruthEvidenceCertificationGate({
      request: buildTruthEvidenceCertificationRequest({
        tenant_id: "tenant-alpha",
        now: "2026-06-20T17:04:00.000Z",
      }),
      ...base,
      evidenceContract: { ...base.evidenceContract, certification: "FAIL" },
      certificationAuthority: "CERTIFICATION_ENGINE",
      certificationReason: "Contract failure",
    });
    const registrationFail = sealTruthEvidenceCertificationGate({
      request: buildTruthEvidenceCertificationRequest({
        tenant_id: "tenant-alpha",
        now: "2026-06-20T17:04:00.000Z",
      }),
      ...base,
      evidenceRegistration: { ...base.evidenceRegistration, certification: "FAIL" },
      certificationAuthority: "CERTIFICATION_ENGINE",
      certificationReason: "Registration failure",
    });
    const integrityFail = sealTruthEvidenceCertificationGate({
      request: buildTruthEvidenceCertificationRequest({
        tenant_id: "tenant-alpha",
        now: "2026-06-20T17:04:00.000Z",
      }),
      ...base,
      evidenceIntegrity: { ...base.evidenceIntegrity, certification: "FAIL" },
      certificationAuthority: "CERTIFICATION_ENGINE",
      certificationReason: "Integrity failure",
    });
    const graphFail = sealTruthEvidenceCertificationGate({
      request: buildTruthEvidenceCertificationRequest({
        tenant_id: "tenant-alpha",
        now: "2026-06-20T17:04:00.000Z",
      }),
      ...base,
      evidenceGraph: { ...base.evidenceGraph, certification: "FAIL" },
      certificationAuthority: "CERTIFICATION_ENGINE",
      certificationReason: "Graph failure",
    });

    expect(contractFail.validation.reasonCodes).toContain("EVIDENCE_CONTRACT_FAILED");
    expect(registrationFail.validation.reasonCodes).toContain("EVIDENCE_REGISTRATION_FAILED");
    expect(integrityFail.validation.reasonCodes).toContain("EVIDENCE_INTEGRITY_FAILED");
    expect(graphFail.validation.reasonCodes).toContain("EVIDENCE_GRAPH_FAILED");
  });

  it("fails replay mismatch and cross-tenant graph access", () => {
    const base = evidenceStack();
    const replayFail = sealTruthEvidenceCertificationGate({
      request: buildTruthEvidenceCertificationRequest({
        tenant_id: "tenant-alpha",
        now: "2026-06-20T17:04:00.000Z",
      }),
      ...base,
      evidenceGraph: {
        ...base.evidenceGraph,
        replay: { ...base.evidenceGraph.replay, replayResult: "MISMATCH" },
        certification: "FAIL",
      },
      certificationAuthority: "CERTIFICATION_ENGINE",
      certificationReason: "Replay mismatch",
    });
    const tenantFail = sealTruthEvidenceCertificationGate({
      request: buildTruthEvidenceCertificationRequest({
        tenant_id: "tenant-alpha",
        now: "2026-06-20T17:04:00.000Z",
      }),
      ...base,
      evidenceGraph: {
        ...base.evidenceGraph,
        visibility: { ...base.evidenceGraph.visibility, tenantScoped: false },
        certification: "FAIL",
      },
      certificationAuthority: "CERTIFICATION_ENGINE",
      certificationReason: "Cross-tenant graph access",
    });

    expect(replayFail.validation.reasonCodes).toContain("EVIDENCE_REPLAY_FAILED");
    expect(tenantFail.validation.reasonCodes).toContain("TENANT_ISOLATION_FAILED");
  });

  it("fails governance bypass and hidden failure", () => {
    const base = evidenceStack();
    const governanceFail = sealTruthEvidenceCertificationGate({
      request: buildTruthEvidenceCertificationRequest({
        tenant_id: "tenant-alpha",
        now: "2026-06-20T17:04:00.000Z",
      }),
      ...base,
      certificationAuthority: "CERTIFICATION_ENGINE",
      certificationReason: "Governance bypass",
      governanceBypassDetected: true,
    });
    const hiddenFail = sealTruthEvidenceCertificationGate({
      request: buildTruthEvidenceCertificationRequest({
        tenant_id: "tenant-alpha",
        now: "2026-06-20T17:04:00.000Z",
      }),
      ...base,
      certificationAuthority: "CERTIFICATION_ENGINE",
      certificationReason: "Hidden failure",
      hiddenFailureDetected: true,
    });

    expect(governanceFail.validation.reasonCodes).toContain("GOVERNANCE_FAILED");
    expect(hiddenFail.validation.reasonCodes).toContain("VISIBILITY_FAILED");
  });

  it("allows conditional pass for non-critical observability and reporting gaps with remediation and governance approval", () => {
    const base = evidenceStack();
    const conditional = sealTruthEvidenceCertificationGate({
      request: buildTruthEvidenceCertificationRequest({
        tenant_id: "tenant-alpha",
        now: "2026-06-20T17:04:00.000Z",
      }),
      ...base,
      certificationAuthority: "CERTIFICATION_ENGINE",
      certificationReason: "Conditional evidence readiness",
      observabilityGapDetected: true,
      reportingLimitationDetected: true,
      remediationPlanExists: true,
      governanceApproved: true,
    });

    expect(conditional.certification.certification_state).toBe("CONDITIONAL_PASS");
    expect(conditional.completionGate).toBe("EVIDENCE_LAYER_CONDITIONAL");
  });
});
