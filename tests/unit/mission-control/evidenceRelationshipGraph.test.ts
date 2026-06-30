import { describe, expect, it } from "vitest";
import {
  buildTruthEvidenceContractRequest,
  buildTruthEvidenceRegistrationRequest,
  buildTruthEvidenceRelationshipGraphRequest,
  buildTruthEvidenceVerificationRequest,
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
      now: "2026-06-20T16:00:00.000Z",
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
      collection_timestamp: "2026-06-20T15:59:00.000Z",
      collector_identity: "collector-graph",
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
      now: "2026-06-20T16:01:00.000Z",
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
      now: "2026-06-20T16:02:00.000Z",
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

function baseGraphInput(overrides: Record<string, unknown> = {}) {
  const sourceVerification = baseVerification("evidence-source", "event-source");
  const targetVerification = baseVerification("evidence-target", "event-target");
  const sourceEvidenceId = sourceVerification.registration.evidence.evidence.evidence_id;
  const targetEvidenceId = targetVerification.registration.evidence.evidence.evidence_id;

  return {
    request: buildTruthEvidenceRelationshipGraphRequest({
      tenant_id: "tenant-alpha",
      now: "2026-06-20T16:03:00.000Z",
    }),
    sourceVerification,
    targetVerification,
    relationshipType: "REFERENCES" as const,
    relationshipReason: "source references target evidence",
    knownEvidenceIds: [sourceEvidenceId, targetEvidenceId],
    accessTenantId: "tenant-alpha",
    ...overrides,
  };
}

describe("evidenceRelationshipGraph", () => {
  it("passes deterministic dependency mapping and traversal queries", () => {
    const result = sealTruthEvidenceRelationshipGraph(baseGraphInput({
      relationshipType: "DEPENDS_ON",
    }));
    const sourceEvidenceId = result.relationship.source_evidence_id;
    const targetEvidenceId = result.relationship.target_evidence_id;

    expect(result.certification).toBe("PASS");
    expect(result.validation.reasonCodes).toContain("DEPENDENCY_MAPPED");
    expect(result.queries.dependencies_by_evidence_id).toEqual([targetEvidenceId]);
    expect(result.queries.evidence_path_between_ids).toEqual([sourceEvidenceId, targetEvidenceId]);
  });

  it("passes supporting evidence mapping and fails when support rationale is missing", () => {
    const supporting = sealTruthEvidenceRelationshipGraph(baseGraphInput({
      relationshipType: "SUPPORTS",
    }));
    const missingRationale = sealTruthEvidenceRelationshipGraph(baseGraphInput({
      relationshipType: "SUPPORTS",
      missingSupportRationaleDetected: true,
    }));

    expect(supporting.certification).toBe("PASS");
    expect(supporting.validation.reasonCodes).toContain("SUPPORT_MAPPED");
    expect(missingRationale.validation.reasonCodes).toContain("SUPPORT_RATIONALE_MISSING");
    expect(missingRationale.certification).toBe("FAIL");
  });

  it("passes conflicting evidence mapping with severity and fails missing conflict rationale", () => {
    const conflicting = sealTruthEvidenceRelationshipGraph(baseGraphInput({
      relationshipType: "CONTRADICTS",
      relationshipReason: "source contradicts target evidence",
    }));
    const missingRationale = sealTruthEvidenceRelationshipGraph(baseGraphInput({
      relationshipType: "CONTRADICTS",
      missingConflictRationaleDetected: true,
    }));

    expect(conflicting.certification).toBe("PASS");
    expect(conflicting.validation.reasonCodes).toContain("CONFLICT_MAPPED");
    expect(conflicting.validation.reasonCodes).toContain("CONFLICT_SEVERITY_ASSIGNED");
    expect(conflicting.visibility.conflict_severity).toBe("CRITICAL");
    expect(missingRationale.validation.reasonCodes).toContain("CONFLICT_RATIONALE_MISSING");
    expect(missingRationale.certification).toBe("FAIL");
  });

  it("fails unknown evidence nodes and orphaned edges", () => {
    const baseInput = baseGraphInput();
    const sourceEvidenceId = baseInput.sourceVerification.registration.evidence.evidence.evidence_id;
    const unknownNode = sealTruthEvidenceRelationshipGraph({
      ...baseInput,
      knownEvidenceIds: [sourceEvidenceId],
    });
    const orphaned = sealTruthEvidenceRelationshipGraph(baseGraphInput({
      orphanedEdgeDetected: true,
    }));

    expect(unknownNode.validation.reasonCodes).toContain("TARGET_EVIDENCE_UNKNOWN");
    expect(unknownNode.certification).toBe("FAIL");
    expect(orphaned.validation.graphValid).toBe(false);
    expect(orphaned.ledgerEntry.failure_reason).toContain("orphaned edge detected");
  });

  it("fails invalid relationship outputs and direction errors", () => {
    const invalidType = sealTruthEvidenceRelationshipGraph(baseGraphInput({
      unsupportedRelationshipOutputDetected: true,
    }));
    const directionError = sealTruthEvidenceRelationshipGraph(baseGraphInput({
      relationshipDirectionErrorDetected: true,
    }));

    expect(invalidType.validation.reasonCodes).toContain("RELATIONSHIP_TYPE_INVALID");
    expect(invalidType.certification).toBe("FAIL");
    expect(directionError.validation.relationshipValid).toBe(false);
    expect(directionError.ledgerEntry.failure_reason).toContain("relationship direction error");
  });

  it("fails missing conflict severity and undetected conflicts", () => {
    const missingSeverity = sealTruthEvidenceRelationshipGraph(baseGraphInput({
      relationshipType: "CONFLICTS_WITH",
      conflictSeverity: undefined,
      missingConflictSeverityDetected: true,
    }));
    const undetectedConflict = sealTruthEvidenceRelationshipGraph(baseGraphInput({
      relationshipType: "REFUTES",
      conflictUndetected: true,
    }));

    expect(missingSeverity.validation.reasonCodes).toContain("CONFLICT_SEVERITY_MISSING");
    expect(missingSeverity.certification).toBe("FAIL");
    expect(undetectedConflict.observability.conflict_detection_failures).toBe(1);
    expect(undetectedConflict.certification).toBe("FAIL");
  });

  it("blocks unbounded traversal and cross-tenant edges and traversals", () => {
    const unbounded = sealTruthEvidenceRelationshipGraph(baseGraphInput({
      unboundedTraversalDetected: true,
    }));
    const crossTenant = sealTruthEvidenceRelationshipGraph(baseGraphInput({
      crossTenantEdgeDetected: true,
      crossTenantTraversalDetected: true,
    }));

    expect(unbounded.validation.reasonCodes).toContain("TRAVERSAL_UNBOUNDED");
    expect(unbounded.validation.traversalValid).toBe(false);
    expect(crossTenant.validation.reasonCodes).toContain("TENANT_ISOLATION_FAILED");
    expect(crossTenant.certification).toBe("FAIL");
  });

  it("reproduces graph replay and fails replay mismatches", () => {
    const reproduced = sealTruthEvidenceRelationshipGraph(baseGraphInput());
    const mismatch = sealTruthEvidenceRelationshipGraph(baseGraphInput({
      replayMismatchDetected: true,
    }));

    expect(reproduced.replay.replayResult).toBe("REPRODUCED");
    expect(reproduced.certification).toBe("PASS");
    expect(mismatch.replay.replayResult).toBe("MISMATCH");
    expect(mismatch.certification).toBe("FAIL");
  });
});
