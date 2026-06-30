import { describe, expect, it } from "vitest";
import {
  buildTruthClassificationSystemRequest,
  buildTruthFoundationCertificationRequest,
  buildTruthIdentityFrameworkRequest,
  buildTruthRecordContractRequest,
  buildTruthStateFrameworkRequest,
  sealTruthClassificationSystem,
  sealTruthFoundationCertificationGate,
  sealTruthIdentityFramework,
  sealTruthRecordContract,
  sealTruthStateFramework,
  type TruthCatalogReference,
  type TruthIdentityNodeReference,
  type TruthRecord,
  type TruthRecordContractInput,
} from "@/services/mission-control";

function hash(seed: string): string {
  return seed.padEnd(64, seed).slice(0, 64);
}

function evidenceRef(referenceId: string, tenantId = "tenant-alpha"): TruthCatalogReference {
  return {
    referenceId,
    tenantId,
    immutable: true,
    accessible: true,
    auditable: true,
    resolvable: true,
  };
}

function replayRef(referenceId: string, tenantId = "tenant-alpha"): TruthCatalogReference {
  return {
    referenceId,
    tenantId,
    immutable: true,
    accessible: true,
    auditable: true,
    deterministic: true,
    resolvable: true,
  };
}

function truthRecord(overrides: Partial<TruthRecord> = {}): TruthRecord {
  return {
    truth_record_id: hash("foundation-truth-record"),
    tenant_id: "tenant-alpha",
    mission_id: "mission-alpha",
    timestamp: "2026-06-19T12:00:00.000Z",
    event_type: "RECOMMENDATION_APPROVED",
    event_source: "CERTIFICATION_ENGINE",
    lifecycle_state: "VALIDATED",
    evidence_references: ["evidence-alpha"],
    replay_references: ["replay-alpha"],
    ...overrides,
  };
}

function truthRecordInput(overrides: Partial<TruthRecordContractInput> = {}): TruthRecordContractInput {
  return {
    request: buildTruthRecordContractRequest({
      tenant_id: "tenant-alpha",
      mission_id: "mission-alpha",
      now: "2026-06-19T12:00:30.000Z",
    }),
    record: truthRecord(),
    knownTenantIds: ["tenant-alpha"],
    knownMissionIds: ["mission-alpha"],
    existingTruthRecordIds: [],
    priorLifecycleState: "CREATED",
    immutableBaseline: {
      truth_record_id: hash("foundation-truth-record"),
      tenant_id: "tenant-alpha",
      mission_id: "mission-alpha",
      timestamp: "2026-06-19T12:00:00.000Z",
      event_type: "RECOMMENDATION_APPROVED",
      event_source: "CERTIFICATION_ENGINE",
    },
    evidenceCatalog: [evidenceRef("evidence-alpha")],
    replayCatalog: [replayRef("replay-alpha")],
    accessTenantId: "tenant-alpha",
    ...overrides,
  };
}

function sealedTruthRecord(overrides: Partial<TruthRecordContractInput> = {}) {
  return sealTruthRecordContract(truthRecordInput(overrides));
}

function classificationDetails() {
  return {
    decision_authority: "CERTIFICATION_ENGINE",
    decision_rationale: "Approved recommendation",
    decision_outcome: "RECOMMENDATION_APPROVED",
  } as const;
}

function identityNode(
  truth_record_id: string,
  overrides: Partial<TruthIdentityNodeReference> = {},
): TruthIdentityNodeReference {
  return {
    truth_record_id,
    tenant_id: "tenant-alpha",
    lineage_root_id: hash("lineage-root-alpha"),
    parent_truth_ids: [],
    child_truth_ids: [],
    immutable: true,
    accessible: true,
    auditable: true,
    replayable: true,
    ...overrides,
  };
}

function validFoundation() {
  const truthRecord = sealedTruthRecord();
  const classification = sealTruthClassificationSystem({
    request: buildTruthClassificationSystemRequest({
      tenant_id: "tenant-alpha",
      now: "2026-06-19T12:01:00.000Z",
    }),
    truthRecord,
    requestedClassifications: ["DECISION"],
    details: classificationDetails(),
    evidenceCatalog: [evidenceRef("evidence-alpha")],
    replayCatalog: [replayRef("replay-alpha")],
    accessTenantId: "tenant-alpha",
  });
  const rootId = hash("lineage-root-alpha");
  const identity = sealTruthIdentityFramework({
    request: buildTruthIdentityFrameworkRequest({
      tenant_id: "tenant-alpha",
      now: "2026-06-19T12:01:30.000Z",
    }),
    truthRecord,
    identityCatalog: [
      identityNode(rootId, {
        lineage_root_id: rootId,
        child_truth_ids: [truthRecord.record.truth_record_id],
      }),
    ],
    lineageRootId: rootId,
    parentTruthIds: [rootId],
    childTruthIds: [],
    accessTenantId: "tenant-alpha",
  });
  const state = sealTruthStateFramework({
    request: buildTruthStateFrameworkRequest({
      tenant_id: "tenant-alpha",
      now: "2026-06-19T12:02:00.000Z",
    }),
    truthRecord,
    currentState: "VERIFIED",
    previousState: "CREATED",
    stateReason: "Validated",
    stateSource: "CERTIFICATION_ENGINE",
    accessTenantId: "tenant-alpha",
  });

  return { truthRecord, classification, identity, state };
}

describe("foundationCertificationGate", () => {
  it("certifies the full foundation when all component domains pass", () => {
    const foundation = validFoundation();

    const first = sealTruthFoundationCertificationGate({
      request: buildTruthFoundationCertificationRequest({
        tenant_id: "tenant-alpha",
        now: "2026-06-19T12:03:00.000Z",
      }),
      ...foundation,
      certificationAuthority: "CERTIFICATION_ENGINE",
      certificationReason: "Foundation ready",
    });
    const second = sealTruthFoundationCertificationGate({
      request: buildTruthFoundationCertificationRequest({
        tenant_id: "tenant-alpha",
        now: "2026-06-19T12:03:00.000Z",
      }),
      ...foundation,
      certificationAuthority: "CERTIFICATION_ENGINE",
      certificationReason: "Foundation ready",
    });

    expect(first).toEqual(second);
    expect(first.certification.certification_state).toBe("PASS");
    expect(first.completionGate).toBe("FOUNDATION_CERTIFIED");
    expect(first.replay.replayResult).toBe("REPRODUCED");
  });

  it("fails when evidence or replay references are missing", () => {
    const foundation = validFoundation();

    const missingEvidence = sealTruthFoundationCertificationGate({
      request: buildTruthFoundationCertificationRequest({
        tenant_id: "tenant-alpha",
        now: "2026-06-19T12:03:00.000Z",
      }),
      ...foundation,
      evidenceReferences: [],
      certificationAuthority: "CERTIFICATION_ENGINE",
      certificationReason: "Foundation check",
    });
    const missingReplay = sealTruthFoundationCertificationGate({
      request: buildTruthFoundationCertificationRequest({
        tenant_id: "tenant-alpha",
        now: "2026-06-19T12:03:00.000Z",
      }),
      ...foundation,
      replayReferences: [],
      certificationAuthority: "CERTIFICATION_ENGINE",
      certificationReason: "Foundation check",
    });

    expect(missingEvidence.validation.reasonCodes).toContain("CERTIFICATION_EVIDENCE_MISSING");
    expect(missingEvidence.replay.replayResult).toBe("INCOMPLETE_EVIDENCE");
    expect(missingReplay.validation.reasonCodes).toContain("CERTIFICATION_REPLAY_MISSING");
    expect(missingReplay.replay.replayResult).toBe("UNREPLAYABLE");
  });

  it("fails when classification, identity, or state certification fails", () => {
    const foundation = validFoundation();

    const classificationFailure = sealTruthFoundationCertificationGate({
      request: buildTruthFoundationCertificationRequest({
        tenant_id: "tenant-alpha",
        now: "2026-06-19T12:03:00.000Z",
      }),
      ...foundation,
      classification: sealTruthClassificationSystem({
        request: buildTruthClassificationSystemRequest({
          tenant_id: "tenant-alpha",
          now: "2026-06-19T12:01:00.000Z",
        }),
        truthRecord: foundation.truthRecord,
        requestedClassifications: ["UNKNOWN" as never],
        evidenceCatalog: [evidenceRef("evidence-alpha")],
        replayCatalog: [replayRef("replay-alpha")],
        accessTenantId: "tenant-alpha",
      }),
      certificationAuthority: "CERTIFICATION_ENGINE",
      certificationReason: "Foundation check",
    });

    expect(classificationFailure.validation.reasonCodes).toContain("CLASSIFICATION_CERTIFICATION_FAIL");
    expect(classificationFailure.completionGate).toBe("FOUNDATION_FAILED");
  });

  it("fails on replay mismatch and cross-tenant access", () => {
    const foundation = validFoundation();

    const replayFailure = sealTruthFoundationCertificationGate({
      request: buildTruthFoundationCertificationRequest({
        tenant_id: "tenant-alpha",
        now: "2026-06-19T12:03:00.000Z",
      }),
      ...foundation,
      state: sealTruthStateFramework({
        request: buildTruthStateFrameworkRequest({
          tenant_id: "tenant-alpha",
          now: "2026-06-19T12:02:00.000Z",
        }),
        truthRecord: foundation.truthRecord,
        currentState: "ARCHIVED",
        previousState: "CREATED",
        stateReason: "Illegal archive",
        stateSource: "OPERATOR",
        accessTenantId: "tenant-alpha",
      }),
      certificationAuthority: "CERTIFICATION_ENGINE",
      certificationReason: "Foundation check",
    });
    const tenantFailure = sealTruthFoundationCertificationGate({
      request: buildTruthFoundationCertificationRequest({
        tenant_id: "tenant-alpha",
        now: "2026-06-19T12:03:00.000Z",
      }),
      ...foundation,
      accessTenantId: "tenant-beta",
      certificationAuthority: "CERTIFICATION_ENGINE",
      certificationReason: "Foundation check",
    });

    expect(replayFailure.validation.reasonCodes).toContain("REPLAY_CERTIFICATION_FAIL");
    expect(replayFailure.replay.replayResult).toBe("MISMATCH");
    expect(tenantFailure.validation.reasonCodes).toContain("TENANT_ISOLATION_CERTIFICATION_FAIL");
  });

  it("fails governance bypass and hidden visibility failures", () => {
    const foundation = validFoundation();

    const governanceFailure = sealTruthFoundationCertificationGate({
      request: buildTruthFoundationCertificationRequest({
        tenant_id: "tenant-alpha",
        now: "2026-06-19T12:03:00.000Z",
      }),
      ...foundation,
      authorityExpansionDetected: true,
      certificationAuthority: "CERTIFICATION_ENGINE",
      certificationReason: "Foundation check",
    });
    const visibilityFailure = sealTruthFoundationCertificationGate({
      request: buildTruthFoundationCertificationRequest({
        tenant_id: "tenant-alpha",
        now: "2026-06-19T12:03:00.000Z",
      }),
      ...foundation,
      identity: sealTruthIdentityFramework({
        request: buildTruthIdentityFrameworkRequest({
          tenant_id: "tenant-alpha",
          now: "2026-06-19T12:01:30.000Z",
        }),
        truthRecord: foundation.truthRecord,
        identityCatalog: [
          identityNode(hash("lineage-root-alpha"), {
            tenant_id: "tenant-beta",
            child_truth_ids: [foundation.truthRecord.record.truth_record_id],
          }),
        ],
        lineageRootId: hash("lineage-root-alpha"),
        parentTruthIds: [hash("lineage-root-alpha")],
        childTruthIds: [],
        accessTenantId: "tenant-beta",
      }),
      certificationAuthority: "CERTIFICATION_ENGINE",
      certificationReason: "Foundation check",
    });

    expect(governanceFailure.validation.reasonCodes).toContain("GOVERNANCE_CERTIFICATION_FAIL");
    expect(visibilityFailure.validation.reasonCodes).toContain("VISIBILITY_CERTIFICATION_FAIL");
  });

  it("supports conditional certification for non-critical observability and analytics gaps with governance approval", () => {
    const foundation = validFoundation();

    const conditional = sealTruthFoundationCertificationGate({
      request: buildTruthFoundationCertificationRequest({
        tenant_id: "tenant-alpha",
        now: "2026-06-19T12:03:00.000Z",
      }),
      ...foundation,
      certificationAuthority: "CERTIFICATION_ENGINE",
      certificationReason: "Foundation conditionally ready",
      observabilityGapDetected: true,
      analyticsGapDetected: true,
      remediationPlanExists: true,
      governanceApproved: true,
      evidenceReferences: [],
    });

    expect(conditional.certification.certification_state).toBe("CONDITIONAL_PASS");
    expect(conditional.completionGate).toBe("FOUNDATION_CONDITIONAL");
  });

  it("blocks execution, approval, ranking, prioritization, scoring, resource allocation, and authority expansion", () => {
    const foundation = validFoundation();
    const base = {
      request: buildTruthFoundationCertificationRequest({
        tenant_id: "tenant-alpha",
        now: "2026-06-19T12:03:00.000Z",
      }),
      ...foundation,
      certificationAuthority: "CERTIFICATION_ENGINE" as const,
      certificationReason: "Foundation check",
    };

    expect(sealTruthFoundationCertificationGate({ ...base, executionRequested: true }).validation.reasonCodes).toContain("EXECUTION_REQUEST_BLOCKED");
    expect(sealTruthFoundationCertificationGate({ ...base, approvalRequested: true }).validation.reasonCodes).toContain("APPROVAL_DETECTED");
    expect(sealTruthFoundationCertificationGate({ ...base, rankingRequested: true }).validation.reasonCodes).toContain("RANKING_DETECTED");
    expect(sealTruthFoundationCertificationGate({ ...base, prioritizationRequested: true }).validation.reasonCodes).toContain("PRIORITIZATION_DETECTED");
    expect(sealTruthFoundationCertificationGate({ ...base, scoringRequested: true }).validation.reasonCodes).toContain("SCORING_DETECTED");
    expect(sealTruthFoundationCertificationGate({ ...base, resourceAllocationRequested: true }).validation.reasonCodes).toContain("RESOURCE_ALLOCATION_DETECTED");
    expect(sealTruthFoundationCertificationGate({ ...base, authorityExpansionDetected: true }).validation.reasonCodes).toContain("AUTHORITY_EXPANSION_DETECTED");
  });
});
