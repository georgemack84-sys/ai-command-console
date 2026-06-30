import { describe, expect, it } from "vitest";
import {
  buildTruthClassificationSystemRequest,
  buildTruthFoundationCertificationRequest,
  buildTruthIdentityFrameworkRequest,
  buildTruthPersistenceCertificationRequest,
  buildTruthReadFrameworkRequest,
  buildTruthRecordContractRequest,
  buildTruthRetentionFrameworkRequest,
  buildTruthStateFrameworkRequest,
  buildTruthStorageFrameworkRequest,
  buildTruthWriteFrameworkRequest,
  sealTruthClassificationSystem,
  sealTruthFoundationCertificationGate,
  sealTruthIdentityFramework,
  sealTruthPersistenceCertificationGate,
  sealTruthReadFramework,
  sealTruthRecordContract,
  sealTruthRetentionFramework,
  sealTruthStateFramework,
  sealTruthStorageFramework,
  sealTruthWriteFramework,
  type TruthCatalogReference,
  type TruthIdentityNodeReference,
  type TruthRecord,
  type TruthRecordContractInput,
  type TruthStorageAdapterRegistryEntry,
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
    truth_record_id: hash("persistence-truth-record"),
    tenant_id: "tenant-alpha",
    mission_id: "mission-alpha",
    timestamp: "2026-06-20T12:00:00.000Z",
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
      now: "2026-06-20T12:00:30.000Z",
    }),
    record: truthRecord(),
    knownTenantIds: ["tenant-alpha"],
    knownMissionIds: ["mission-alpha"],
    existingTruthRecordIds: [],
    priorLifecycleState: "CREATED",
    immutableBaseline: {
      truth_record_id: hash("persistence-truth-record"),
      tenant_id: "tenant-alpha",
      mission_id: "mission-alpha",
      timestamp: "2026-06-20T12:00:00.000Z",
      event_type: "RECOMMENDATION_APPROVED",
      event_source: "CERTIFICATION_ENGINE",
    },
    evidenceCatalog: [evidenceRef("evidence-alpha")],
    replayCatalog: [replayRef("replay-alpha")],
    accessTenantId: "tenant-alpha",
    ...overrides,
  };
}

function identityNode(truth_record_id: string, overrides: Partial<TruthIdentityNodeReference> = {}): TruthIdentityNodeReference {
  return {
    truth_record_id,
    tenant_id: "tenant-alpha",
    lineage_root_id: hash("persistence-lineage-root"),
    parent_truth_ids: [],
    child_truth_ids: [],
    immutable: true,
    accessible: true,
    auditable: true,
    replayable: true,
    ...overrides,
  };
}

function storageRegistry(): readonly TruthStorageAdapterRegistryEntry[] {
  return [{
    adapter_id: "sqlite-foundation",
    adapter_type: "SQLITE",
    adapter_version: "v1",
    adapter_state: "ACTIVE",
    capabilities: [
      "create_truth_record",
      "get_truth_record",
      "update_truth_state",
      "append_truth_event",
      "list_truth_records",
      "query_truth_records",
      "get_lineage",
      "get_children",
      "get_parents",
      "write_certification_result",
      "read_certification_result",
    ],
    migration_status: "APPLIED",
    certification_status: "PASS",
  }];
}

function persistenceBase() {
  const truthRecord = sealTruthRecordContract(truthRecordInput());
  const classification = sealTruthClassificationSystem({
    request: buildTruthClassificationSystemRequest({
      tenant_id: "tenant-alpha",
      now: "2026-06-20T12:01:00.000Z",
    }),
    truthRecord,
    requestedClassifications: ["DECISION"],
    details: {
      decision_authority: "CERTIFICATION_ENGINE",
      decision_rationale: "Approved recommendation",
      decision_outcome: "RECOMMENDATION_APPROVED",
    },
    evidenceCatalog: [evidenceRef("evidence-alpha")],
    replayCatalog: [replayRef("replay-alpha")],
    accessTenantId: "tenant-alpha",
  });
  const rootId = hash("persistence-lineage-root");
  const identity = sealTruthIdentityFramework({
    request: buildTruthIdentityFrameworkRequest({
      tenant_id: "tenant-alpha",
      now: "2026-06-20T12:01:30.000Z",
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
      now: "2026-06-20T12:02:00.000Z",
    }),
    truthRecord,
    currentState: "VERIFIED",
    previousState: "CREATED",
    stateReason: "Validated",
    stateSource: "CERTIFICATION_ENGINE",
    accessTenantId: "tenant-alpha",
  });
  const foundationCertification = sealTruthFoundationCertificationGate({
    request: buildTruthFoundationCertificationRequest({
      tenant_id: "tenant-alpha",
      now: "2026-06-20T12:03:00.000Z",
    }),
    truthRecord,
    classification,
    identity,
    state,
    certificationAuthority: "CERTIFICATION_ENGINE",
    certificationReason: "Foundation ready",
  });
  const storage = sealTruthStorageFramework({
    request: buildTruthStorageFrameworkRequest({
      tenant_id: "tenant-alpha",
      now: "2026-06-20T12:04:00.000Z",
    }),
    truthRecord,
    classification,
    identity,
    state,
    foundationCertification,
    adapterRegistry: storageRegistry(),
    activeAdapterType: "SQLITE",
  });
  const write = sealTruthWriteFramework({
    request: buildTruthWriteFrameworkRequest({
      tenant_id: "tenant-alpha",
      now: "2026-06-20T12:05:00.000Z",
    }),
    storage,
    writeRequest: {
      write_id: hash("persistence-write-id"),
      tenant_id: "tenant-alpha",
      mission_id: "mission-alpha",
      truth_record_id: truthRecord.record.truth_record_id,
      write_type: "APPEND_TRUTH_EVENT",
      write_source: "CERTIFICATION_ENGINE",
      write_timestamp: "2026-06-20T12:05:00.000Z",
      write_payload: { event_type: "RECOMMENDATION_APPROVED", valid: true },
      evidence_references: ["evidence-alpha"],
      replay_references: ["replay-alpha"],
      idempotency_key: "persistence-idem",
      schema_version: "truth-storage/v1",
    },
    knownTenantIds: ["tenant-alpha"],
    knownMissionIds: ["mission-alpha"],
  });
  const read = sealTruthReadFramework({
    request: buildTruthReadFrameworkRequest({
      tenant_id: "tenant-alpha",
      now: "2026-06-20T12:06:00.000Z",
    }),
    storage,
    write,
    readRequest: {
      read_id: hash("persistence-read-id"),
      tenant_id: "tenant-alpha",
      mission_id: "mission-alpha",
      truth_record_id: truthRecord.record.truth_record_id,
      read_type: "DIRECT_LOOKUP",
      read_source: "OPERATOR",
      read_timestamp: "2026-06-20T12:06:00.000Z",
      query_parameters: { truth_record_id: truthRecord.record.truth_record_id },
      schema_version: "truth-storage/v1",
    },
  });
  const retention = sealTruthRetentionFramework({
    request: buildTruthRetentionFrameworkRequest({
      tenant_id: "tenant-alpha",
      now: "2026-06-20T12:07:00.000Z",
    }),
    storage,
    write,
    read,
    retentionPolicyId: "STANDARD",
    retentionState: "ACTIVE",
    retentionExpiration: "2027-06-20T12:07:00.000Z",
    archiveEligibility: "NOT_ELIGIBLE",
    lifecycleTransitionReason: "Within retention period",
    lifecycleState: "VERIFIED",
  });

  return { storage, write, read, retention };
}

describe("persistenceCertificationGate", () => {
  it("certifies the full persistence layer when all domains pass", () => {
    const base = persistenceBase();
    const first = sealTruthPersistenceCertificationGate({
      request: buildTruthPersistenceCertificationRequest({
        tenant_id: "tenant-alpha",
        now: "2026-06-20T12:08:00.000Z",
      }),
      ...base,
      certificationAuthority: "CERTIFICATION_ENGINE",
      certificationReason: "Persistence ready",
    });
    const second = sealTruthPersistenceCertificationGate({
      request: buildTruthPersistenceCertificationRequest({
        tenant_id: "tenant-alpha",
        now: "2026-06-20T12:08:00.000Z",
      }),
      ...base,
      certificationAuthority: "CERTIFICATION_ENGINE",
      certificationReason: "Persistence ready",
    });

    expect(first).toEqual(second);
    expect(first.certification.certification_state).toBe("PASS");
    expect(first.completionGate).toBe("PERSISTENCE_CERTIFIED");
    expect(first.replay.replayResult).toBe("REPRODUCED");
  });

  it("fails when evidence or replay references are missing", () => {
    const base = persistenceBase();
    const missingEvidence = sealTruthPersistenceCertificationGate({
      request: buildTruthPersistenceCertificationRequest({
        tenant_id: "tenant-alpha",
        now: "2026-06-20T12:08:00.000Z",
      }),
      ...base,
      evidenceReferences: [],
      certificationAuthority: "CERTIFICATION_ENGINE",
      certificationReason: "Persistence check",
    });
    const missingReplay = sealTruthPersistenceCertificationGate({
      request: buildTruthPersistenceCertificationRequest({
        tenant_id: "tenant-alpha",
        now: "2026-06-20T12:08:00.000Z",
      }),
      ...base,
      replayReferences: [],
      certificationAuthority: "CERTIFICATION_ENGINE",
      certificationReason: "Persistence check",
    });

    expect(missingEvidence.validation.reasonCodes).toContain("CERTIFICATION_EVIDENCE_PRESENT");
    expect(missingReplay.validation.reasonCodes).toContain("CERTIFICATION_REPLAY_PRESENT");
  });

  it("fails when storage, write, read, or retention certification fails", () => {
    const base = persistenceBase();
    const writeFailure = sealTruthPersistenceCertificationGate({
      request: buildTruthPersistenceCertificationRequest({
        tenant_id: "tenant-alpha",
        now: "2026-06-20T12:08:00.000Z",
      }),
      ...base,
      write: sealTruthWriteFramework({
        request: buildTruthWriteFrameworkRequest({
          tenant_id: "tenant-alpha",
          now: "2026-06-20T12:05:00.000Z",
        }),
        storage: base.storage,
        writeRequest: {
          write_id: hash("bad-write-id"),
          tenant_id: "tenant-alpha",
          mission_id: "mission-alpha",
          truth_record_id: base.storage.primarySnapshot.truth_record_id,
          write_type: "APPEND_TRUTH_EVENT",
          write_source: "CERTIFICATION_ENGINE",
          write_timestamp: "2026-06-20T12:05:00.000Z",
          write_payload: {},
          evidence_references: ["evidence-alpha"],
          replay_references: ["replay-alpha"],
          idempotency_key: "bad",
          schema_version: "truth-storage/v1",
        },
        knownTenantIds: ["tenant-alpha"],
        knownMissionIds: ["mission-alpha"],
        payloadSchemaValid: false,
      }),
      certificationAuthority: "CERTIFICATION_ENGINE",
      certificationReason: "Persistence check",
    });

    expect(writeFailure.validation.reasonCodes).toContain("WRITE_CERTIFICATION_FAIL");
    expect(writeFailure.completionGate).toBe("PERSISTENCE_FAILED");
  });

  it("fails on replay mismatch and cross-tenant access", () => {
    const base = persistenceBase();
    const replayFailure = sealTruthPersistenceCertificationGate({
      request: buildTruthPersistenceCertificationRequest({
        tenant_id: "tenant-alpha",
        now: "2026-06-20T12:08:00.000Z",
      }),
      ...base,
      retention: sealTruthRetentionFramework({
        request: buildTruthRetentionFrameworkRequest({
          tenant_id: "tenant-alpha",
          now: "2026-06-20T12:07:00.000Z",
        }),
        storage: base.storage,
        write: base.write,
        read: base.read,
        retentionPolicyId: "STANDARD",
        retentionState: "ACTIVE",
        retentionExpiration: "2027-06-20T12:07:00.000Z",
        archiveEligibility: "NOT_ELIGIBLE",
        lifecycleTransitionReason: "Replay mismatch",
        replayMismatchDetected: true,
      }),
      certificationAuthority: "CERTIFICATION_ENGINE",
      certificationReason: "Persistence check",
    });
    const tenantFailure = sealTruthPersistenceCertificationGate({
      request: buildTruthPersistenceCertificationRequest({
        tenant_id: "tenant-alpha",
        now: "2026-06-20T12:08:00.000Z",
      }),
      ...base,
      accessTenantId: "tenant-beta",
      certificationAuthority: "CERTIFICATION_ENGINE",
      certificationReason: "Persistence check",
    });

    expect(replayFailure.validation.reasonCodes).toContain("REPLAY_CERTIFICATION_FAIL");
    expect(replayFailure.replay.replayResult).toBe("MISMATCH");
    expect(tenantFailure.validation.reasonCodes).toContain("TENANT_ISOLATION_CERTIFICATION_FAIL");
  });

  it("fails governance bypass and hidden visibility failures", () => {
    const base = persistenceBase();
    const governanceFailure = sealTruthPersistenceCertificationGate({
      request: buildTruthPersistenceCertificationRequest({
        tenant_id: "tenant-alpha",
        now: "2026-06-20T12:08:00.000Z",
      }),
      ...base,
      authorityExpansionDetected: true,
      certificationAuthority: "CERTIFICATION_ENGINE",
      certificationReason: "Persistence check",
    });
    const visibilityFailure = sealTruthPersistenceCertificationGate({
      request: buildTruthPersistenceCertificationRequest({
        tenant_id: "tenant-alpha",
        now: "2026-06-20T12:08:00.000Z",
      }),
      ...base,
      read: sealTruthReadFramework({
        request: buildTruthReadFrameworkRequest({
          tenant_id: "tenant-alpha",
          now: "2026-06-20T12:06:00.000Z",
        }),
        storage: base.storage,
        write: base.write,
        readRequest: {
          read_id: hash("hidden-read-id"),
          tenant_id: "tenant-alpha",
          mission_id: "mission-alpha",
          truth_record_id: base.storage.primarySnapshot.truth_record_id,
          read_type: "DIRECT_LOOKUP",
          read_source: "OPERATOR",
          read_timestamp: "2026-06-20T12:06:00.000Z",
          query_parameters: { truth_record_id: base.storage.primarySnapshot.truth_record_id },
          schema_version: "truth-storage/v1",
        },
        accessTenantId: "tenant-beta",
        queryTenantScoped: false,
      }),
      certificationAuthority: "CERTIFICATION_ENGINE",
      certificationReason: "Persistence check",
    });

    expect(governanceFailure.validation.reasonCodes).toContain("GOVERNANCE_CERTIFICATION_FAIL");
    expect(visibilityFailure.validation.reasonCodes).toContain("VISIBILITY_CERTIFICATION_FAIL");
  });

  it("supports conditional certification for non-critical observability and analytics gaps with governance approval", () => {
    const base = persistenceBase();
    const conditional = sealTruthPersistenceCertificationGate({
      request: buildTruthPersistenceCertificationRequest({
        tenant_id: "tenant-alpha",
        now: "2026-06-20T12:08:00.000Z",
      }),
      ...base,
      certificationAuthority: "CERTIFICATION_ENGINE",
      certificationReason: "Persistence conditionally ready",
      observabilityGapDetected: true,
      analyticsGapDetected: true,
      remediationPlanExists: true,
      governanceApproved: true,
    });

    expect(conditional.certification.certification_state).toBe("CONDITIONAL_PASS");
    expect(conditional.completionGate).toBe("PERSISTENCE_CONDITIONAL");
  });

  it("blocks execution, approval, ranking, prioritization, scoring, resource allocation, and authority expansion", () => {
    const base = persistenceBase();
    const common = {
      request: buildTruthPersistenceCertificationRequest({
        tenant_id: "tenant-alpha",
        now: "2026-06-20T12:08:00.000Z",
      }),
      ...base,
      certificationAuthority: "CERTIFICATION_ENGINE" as const,
      certificationReason: "Persistence check",
    };

    expect(sealTruthPersistenceCertificationGate({ ...common, executionRequested: true }).validation.reasonCodes).toContain("EXECUTION_REQUEST_BLOCKED");
    expect(sealTruthPersistenceCertificationGate({ ...common, approvalRequested: true }).validation.reasonCodes).toContain("APPROVAL_DETECTED");
    expect(sealTruthPersistenceCertificationGate({ ...common, rankingRequested: true }).validation.reasonCodes).toContain("RANKING_DETECTED");
    expect(sealTruthPersistenceCertificationGate({ ...common, prioritizationRequested: true }).validation.reasonCodes).toContain("PRIORITIZATION_DETECTED");
    expect(sealTruthPersistenceCertificationGate({ ...common, scoringRequested: true }).validation.reasonCodes).toContain("SCORING_DETECTED");
    expect(sealTruthPersistenceCertificationGate({ ...common, resourceAllocationRequested: true }).validation.reasonCodes).toContain("RESOURCE_ALLOCATION_DETECTED");
    expect(sealTruthPersistenceCertificationGate({ ...common, authorityExpansionDetected: true }).validation.reasonCodes).toContain("AUTHORITY_EXPANSION_DETECTED");
  });
});
