import { describe, expect, it } from "vitest";
import {
  buildTruthEvidenceContractRequest,
  sealTruthEvidenceContract,
} from "@/services/mission-control";

function baseInput(overrides: Record<string, unknown> = {}) {
  return {
    request: buildTruthEvidenceContractRequest({
      tenant_id: "tenant-alpha",
      now: "2026-06-20T13:00:00.000Z",
    }),
    missionId: "mission-alpha",
    evidenceType: "EVENT_RECORD" as const,
    evidenceCategory: "EVENT" as const,
    evidenceSource: "EVENT_RECORDER" as const,
    evidencePayload: { recorded: true, version: 1 },
    payloadType: "event_record",
    payloadVersion: "v1",
    provenance: {
      origin_system: "mission-control",
      origin_reference: "event-123",
      collection_method: "append",
      collection_timestamp: "2026-06-20T12:59:59.000Z",
      collector_identity: "recorder-1",
    },
    relationships: [{
      source_evidence_id: "evidence-source",
      target_evidence_id: "evidence-target",
      relationship_type: "SUPPORTS" as const,
      relationship_reason: "Supports recorded event",
    }],
    replayReferenceIds: ["replay-alpha"],
    knownEvidenceIds: ["evidence-target"],
    accessTenantId: "tenant-alpha",
    ...overrides,
  };
}

describe("evidenceContract", () => {
  it("passes a valid evidence contract deterministically", () => {
    const first = sealTruthEvidenceContract(baseInput());
    const second = sealTruthEvidenceContract(baseInput());

    expect(first).toEqual(second);
    expect(first.certification).toBe("PASS");
    expect(first.replay.replayResult).toBe("REPRODUCED");
  });

  it("fails duplicate identity and identity mutation", () => {
    const duplicate = sealTruthEvidenceContract(baseInput({
      evidenceId: "evidence-duplicate",
      priorEvidenceIds: ["evidence-duplicate"],
    }));
    const mutated = sealTruthEvidenceContract(baseInput({
      identityMutated: true,
    }));

    expect(duplicate.validation.reasonCodes).toContain("EVIDENCE_ID_DUPLICATE");
    expect(mutated.validation.reasonCodes).toContain("EVIDENCE_ID_MUTATED");
  });

  it("fails unknown evidence type, category mismatch, and unknown source", () => {
    const badType = sealTruthEvidenceContract(baseInput({
      evidenceType: "BAD_TYPE" as never,
    }));
    const badCategory = sealTruthEvidenceContract(baseInput({
      evidenceCategory: "TRUTH",
      typeCategoryMatches: false,
    }));
    const badSource = sealTruthEvidenceContract(baseInput({
      evidenceSource: "BAD_SOURCE" as never,
    }));

    expect(badType.validation.reasonCodes).toContain("EVIDENCE_TYPE_INVALID");
    expect(badCategory.validation.reasonCodes).toContain("EVIDENCE_CATEGORY_MISMATCH");
    expect(badSource.validation.reasonCodes).toContain("EVIDENCE_SOURCE_INVALID");
  });

  it("fails payload corruption and hash mismatch", () => {
    const invalidPayload = sealTruthEvidenceContract(baseInput({
      payloadSchemaValid: false,
    }));
    const payloadHashMismatch = sealTruthEvidenceContract(baseInput({
      payloadHashMismatchDetected: true,
    }));

    expect(invalidPayload.validation.reasonCodes).toContain("PAYLOAD_SCHEMA_INVALID");
    expect(payloadHashMismatch.validation.reasonCodes).toContain("PAYLOAD_HASH_MISMATCH");
  });

  it("fails missing provenance and provenance mismatch", () => {
    const missingProvenance = sealTruthEvidenceContract(baseInput({
      provenanceValid: false,
    }));
    const mismatch = sealTruthEvidenceContract(baseInput({
      provenanceHashMismatchDetected: true,
    }));

    expect(missingProvenance.validation.reasonCodes).toContain("PROVENANCE_MISSING");
    expect(mismatch.validation.reasonCodes).toContain("PROVENANCE_HASH_MISMATCH");
  });

  it("fails cross-tenant relationship corruption", () => {
    const result = sealTruthEvidenceContract(baseInput({
      crossTenantRelationshipDetected: true,
    }));

    expect(result.validation.reasonCodes).toContain("RELATIONSHIP_TENANT_FAILED");
  });

  it("fails missing replay reference and replay mismatch", () => {
    const missingReplay = sealTruthEvidenceContract(baseInput({
      replayReferenceIds: [],
      replayReferencesResolvable: false,
    }));
    const mismatch = sealTruthEvidenceContract(baseInput({
      replayMismatchDetected: true,
    }));

    expect(missingReplay.validation.reasonCodes).toContain("REPLAY_BINDING_INVALID");
    expect(mismatch.replay.replayResult).toBe("MISMATCH");
  });

  it("blocks execution, approval, ranking, prioritization, scoring, resource allocation, and authority expansion", () => {
    expect(sealTruthEvidenceContract(baseInput({ executionRequested: true })).validation.reasonCodes).toContain("EXECUTION_REQUEST_BLOCKED");
    expect(sealTruthEvidenceContract(baseInput({ approvalRequested: true })).validation.reasonCodes).toContain("APPROVAL_DETECTED");
    expect(sealTruthEvidenceContract(baseInput({ rankingRequested: true })).validation.reasonCodes).toContain("RANKING_DETECTED");
    expect(sealTruthEvidenceContract(baseInput({ prioritizationRequested: true })).validation.reasonCodes).toContain("PRIORITIZATION_DETECTED");
    expect(sealTruthEvidenceContract(baseInput({ scoringRequested: true })).validation.reasonCodes).toContain("SCORING_DETECTED");
    expect(sealTruthEvidenceContract(baseInput({ resourceAllocationRequested: true })).validation.reasonCodes).toContain("RESOURCE_ALLOCATION_DETECTED");
    expect(sealTruthEvidenceContract(baseInput({ authorityExpansionDetected: true })).validation.reasonCodes).toContain("AUTHORITY_EXPANSION_DETECTED");
  });
});
