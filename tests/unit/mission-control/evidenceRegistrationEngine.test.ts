import { describe, expect, it } from "vitest";
import {
  buildTruthEvidenceContractRequest,
  buildTruthEvidenceRegistrationRequest,
  sealTruthEvidenceContract,
  sealTruthEvidenceRegistration,
} from "@/services/mission-control";

function baseEvidence(overrides: Record<string, unknown> = {}) {
  return sealTruthEvidenceContract({
    request: buildTruthEvidenceContractRequest({
      tenant_id: "tenant-alpha",
      now: "2026-06-20T14:00:00.000Z",
    }),
    missionId: "mission-alpha",
    evidenceType: "OPERATOR_INPUT",
    evidenceCategory: "OPERATOR",
    evidenceSource: "OPERATOR",
    evidencePayload: { submitted: true, score: 1 },
    payloadType: "operator_input",
    payloadVersion: "v1",
    provenance: {
      origin_system: "operator-console",
      origin_reference: "input-1",
      collection_method: "manual",
      collection_timestamp: "2026-06-20T13:59:59.000Z",
      collector_identity: "operator-1",
    },
    relationships: [],
    replayReferenceIds: ["replay-alpha"],
    accessTenantId: "tenant-alpha",
    ...overrides,
  });
}

function baseRegistration(overrides: Record<string, unknown> = {}) {
  return {
    request: buildTruthEvidenceRegistrationRequest({
      tenant_id: "tenant-alpha",
      now: "2026-06-20T14:01:00.000Z",
    }),
    evidence: baseEvidence(),
    registrationSource: "OPERATOR" as const,
    registrationType: "INPUT" as const,
    evidenceReferences: ["ref-alpha"],
    replayReferences: ["replay-alpha"],
    knownReferenceTargets: ["ref-alpha"],
    accessTenantId: "tenant-alpha",
    ...overrides,
  };
}

describe("evidenceRegistrationEngine", () => {
  it("registers valid input evidence", () => {
    const result = sealTruthEvidenceRegistration(baseRegistration());
    expect(result.registration.registration_state).toBe("REGISTERED");
    expect(result.certification).toBe("PASS");
  });

  it("fails missing input source", () => {
    const result = sealTruthEvidenceRegistration(baseRegistration({
      registrationSource: "" as never,
    }));
    expect(result.validation.reasonCodes).toContain("INPUT_SOURCE_MISSING");
  });

  it("registers valid reference evidence and fails unresolvable reference", () => {
    const valid = sealTruthEvidenceRegistration(baseRegistration({
      registrationType: "REFERENCE",
      evidence: baseEvidence({
        evidenceType: "EXTERNAL_REFERENCE",
        evidenceCategory: "EXTERNAL",
        evidenceSource: "EXTERNAL_SYSTEM",
      }),
      registrationSource: "EXTERNAL_SYSTEM",
      evidenceReferences: ["doc-123"],
      knownReferenceTargets: ["doc-123"],
    }));
    const invalid = sealTruthEvidenceRegistration(baseRegistration({
      registrationType: "REFERENCE",
      evidence: baseEvidence({
        evidenceType: "EXTERNAL_REFERENCE",
        evidenceCategory: "EXTERNAL",
        evidenceSource: "EXTERNAL_SYSTEM",
      }),
      registrationSource: "EXTERNAL_SYSTEM",
      evidenceReferences: [],
      knownReferenceTargets: [],
      unresolvableReferenceDetected: true,
    }));

    expect(valid.registration.registration_state).toBe("REGISTERED");
    expect(invalid.validation.reasonCodes).toContain("REFERENCE_UNRESOLVABLE");
  });

  it("registers valid supporting signal and fails unknown signal type", () => {
    const valid = sealTruthEvidenceRegistration(baseRegistration({
      registrationType: "SUPPORTING_SIGNAL",
      evidence: baseEvidence({
        evidenceType: "RUNTIME_RECORD",
        evidenceCategory: "RUNTIME",
        evidenceSource: "MISSION_CONTROL",
      }),
      registrationSource: "MISSION_CONTROL",
      signalType: "risk",
    }));
    const invalid = sealTruthEvidenceRegistration(baseRegistration({
      registrationType: "SUPPORTING_SIGNAL",
      evidence: baseEvidence({
        evidenceType: "RUNTIME_RECORD",
        evidenceCategory: "RUNTIME",
        evidenceSource: "MISSION_CONTROL",
      }),
      registrationSource: "MISSION_CONTROL",
      signalType: "unknown",
    }));

    expect(valid.registration.registration_state).toBe("REGISTERED");
    expect(invalid.validation.reasonCodes).toContain("SIGNAL_TYPE_INVALID");
  });

  it("registers valid observation and fails missing observation context", () => {
    const valid = sealTruthEvidenceRegistration(baseRegistration({
      registrationType: "OBSERVATION",
      evidence: baseEvidence({
        evidenceType: "AUDIT_RECORD",
        evidenceCategory: "AUDIT",
        evidenceSource: "MISSION_CONTROL",
      }),
      registrationSource: "MISSION_CONTROL",
      observationContext: "runtime anomaly observed",
      observationScope: "system",
    }));
    const invalid = sealTruthEvidenceRegistration(baseRegistration({
      registrationType: "OBSERVATION",
      evidence: baseEvidence({
        evidenceType: "AUDIT_RECORD",
        evidenceCategory: "AUDIT",
        evidenceSource: "MISSION_CONTROL",
      }),
      registrationSource: "MISSION_CONTROL",
      observationContext: "",
      observationScope: "system",
    }));

    expect(valid.registration.registration_state).toBe("REGISTERED");
    expect(invalid.validation.reasonCodes).toContain("OBSERVATION_CONTEXT_MISSING");
  });

  it("fails unknown and multiple classifications", () => {
    const unknown = sealTruthEvidenceRegistration(baseRegistration({
      unknownClassificationDetected: true,
    }));
    const multiple = sealTruthEvidenceRegistration(baseRegistration({
      multipleClassificationsDetected: true,
    }));

    expect(unknown.validation.reasonCodes).toContain("CLASSIFICATION_INVALID");
    expect(multiple.validation.reasonCodes).toContain("CLASSIFICATION_MULTIPLE_DETECTED");
  });

  it("accepts valid evidence and rejects invalid evidence", () => {
    const valid = sealTruthEvidenceRegistration(baseRegistration());
    const invalid = sealTruthEvidenceRegistration(baseRegistration({
      evidence: baseEvidence({ payloadSchemaValid: false }),
      invalidPayloadDetected: true,
    }));

    expect(valid.validation.reasonCodes).toContain("INTEGRITY_VALID");
    expect(invalid.validation.reasonCodes).toContain("INTEGRITY_INVALID");
  });

  it("enforces atomic registration, replay protection, and tenant isolation", () => {
    const partial = sealTruthEvidenceRegistration(baseRegistration({
      partialRegistrationDetected: true,
    }));
    const replayMismatch = sealTruthEvidenceRegistration(baseRegistration({
      replayMismatchDetected: true,
    }));
    const crossTenant = sealTruthEvidenceRegistration(baseRegistration({
      crossTenantRegistrationDetected: true,
    }));
    const crossTenantRef = sealTruthEvidenceRegistration(baseRegistration({
      crossTenantReferenceDetected: true,
    }));

    expect(partial.validation.reasonCodes).toContain("PARTIAL_REGISTRATION_DETECTED");
    expect(replayMismatch.replay.replayResult).toBe("MISMATCH");
    expect(crossTenant.validation.reasonCodes).toContain("TENANT_ISOLATION_FAILED");
    expect(crossTenantRef.validation.reasonCodes).toContain("TENANT_ISOLATION_FAILED");
  });
});
