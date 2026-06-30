import { describe, expect, it } from "vitest";
import {
  buildTruthClassificationSystemRequest,
  buildTruthFoundationCertificationRequest,
  buildTruthIdentityFrameworkRequest,
  buildTruthRecordContractRequest,
  buildTruthStateFrameworkRequest,
  buildTruthStorageFrameworkRequest,
  sealTruthClassificationSystem,
  sealTruthFoundationCertificationGate,
  sealTruthIdentityFramework,
  sealTruthRecordContract,
  sealTruthStateFramework,
  sealTruthStorageFramework,
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
    truth_record_id: hash("storage-truth-record"),
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
      truth_record_id: hash("storage-truth-record"),
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

function identityNode(truth_record_id: string, overrides: Partial<TruthIdentityNodeReference> = {}): TruthIdentityNodeReference {
  return {
    truth_record_id,
    tenant_id: "tenant-alpha",
    lineage_root_id: hash("storage-lineage-root"),
    parent_truth_ids: [],
    child_truth_ids: [],
    immutable: true,
    accessible: true,
    auditable: true,
    replayable: true,
    ...overrides,
  };
}

function foundation() {
  const truthRecord = sealTruthRecordContract(truthRecordInput());
  const classification = sealTruthClassificationSystem({
    request: buildTruthClassificationSystemRequest({
      tenant_id: "tenant-alpha",
      now: "2026-06-19T12:01:00.000Z",
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
  const rootId = hash("storage-lineage-root");
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
  const foundationCertification = sealTruthFoundationCertificationGate({
    request: buildTruthFoundationCertificationRequest({
      tenant_id: "tenant-alpha",
      now: "2026-06-19T12:03:00.000Z",
    }),
    truthRecord,
    classification,
    identity,
    state,
    certificationAuthority: "CERTIFICATION_ENGINE",
    certificationReason: "Foundation ready",
  });
  return { truthRecord, classification, identity, state, foundationCertification };
}

function activeSqliteRegistry(): readonly TruthStorageAdapterRegistryEntry[] {
  return [
    {
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
    },
  ];
}

describe("storageAbstractionLayer", () => {
  it("passes with an active sqlite adapter and deterministic storage behavior", () => {
    const input = foundation();
    const first = sealTruthStorageFramework({
      request: buildTruthStorageFrameworkRequest({
        tenant_id: "tenant-alpha",
        now: "2026-06-19T12:04:00.000Z",
      }),
      ...input,
      adapterRegistry: activeSqliteRegistry(),
      activeAdapterType: "SQLITE",
    });
    const second = sealTruthStorageFramework({
      request: buildTruthStorageFrameworkRequest({
        tenant_id: "tenant-alpha",
        now: "2026-06-19T12:04:00.000Z",
      }),
      ...input,
      adapterRegistry: activeSqliteRegistry(),
      activeAdapterType: "SQLITE",
    });

    expect(first).toEqual(second);
    expect(first.certification).toBe("PASS");
    expect(first.replay.replayResult).toBe("REPRODUCED");
  });

  it("fails unsupported adapter activation and disabled adapter writes", () => {
    const input = foundation();
    const unsupported = sealTruthStorageFramework({
      request: buildTruthStorageFrameworkRequest({
        tenant_id: "tenant-alpha",
        now: "2026-06-19T12:04:00.000Z",
      }),
      ...input,
      activeAdapterType: "UNKNOWN" as never,
    });
    const disabled = sealTruthStorageFramework({
      request: buildTruthStorageFrameworkRequest({
        tenant_id: "tenant-alpha",
        now: "2026-06-19T12:04:00.000Z",
      }),
      ...input,
      adapterRegistry: [{
        ...activeSqliteRegistry()[0],
        adapter_state: "DISABLED",
      }],
      activeAdapterType: "SQLITE",
    });

    expect(unsupported.validation.reasonCodes).toContain("ADAPTER_UNSUPPORTED");
    expect(disabled.validation.reasonCodes).toContain("ADAPTER_DISABLED");
  });

  it("fails cross-tenant queries and nondeterministic ordering", () => {
    const input = foundation();
    const crossTenant = sealTruthStorageFramework({
      request: buildTruthStorageFrameworkRequest({
        tenant_id: "tenant-alpha",
        now: "2026-06-19T12:04:00.000Z",
      }),
      ...input,
      adapterRegistry: activeSqliteRegistry(),
      activeAdapterType: "SQLITE",
      accessTenantId: "tenant-beta",
    });
    const ordering = sealTruthStorageFramework({
      request: buildTruthStorageFrameworkRequest({
        tenant_id: "tenant-alpha",
        now: "2026-06-19T12:04:00.000Z",
      }),
      ...input,
      adapterRegistry: activeSqliteRegistry(),
      activeAdapterType: "SQLITE",
      nondeterministicOrderingDetected: true,
    });

    expect(crossTenant.validation.reasonCodes).toContain("TENANT_ISOLATION_FAILED");
    expect(ordering.validation.reasonCodes).toContain("QUERY_ORDERING_NONDETERMINISTIC");
    expect(ordering.replay.replayResult).toBe("MISMATCH");
  });

  it("fails partial writes, rollback failures, and schema mismatch", () => {
    const input = foundation();
    const partialWrite = sealTruthStorageFramework({
      request: buildTruthStorageFrameworkRequest({
        tenant_id: "tenant-alpha",
        now: "2026-06-19T12:04:00.000Z",
      }),
      ...input,
      adapterRegistry: activeSqliteRegistry(),
      activeAdapterType: "SQLITE",
      partialWriteDetected: true,
    });
    const rollbackFailure = sealTruthStorageFramework({
      request: buildTruthStorageFrameworkRequest({
        tenant_id: "tenant-alpha",
        now: "2026-06-19T12:04:00.000Z",
      }),
      ...input,
      adapterRegistry: activeSqliteRegistry(),
      activeAdapterType: "SQLITE",
      rollbackFailed: true,
    });
    const schemaMismatch = sealTruthStorageFramework({
      request: buildTruthStorageFrameworkRequest({
        tenant_id: "tenant-alpha",
        now: "2026-06-19T12:04:00.000Z",
      }),
      ...input,
      adapterRegistry: activeSqliteRegistry(),
      activeAdapterType: "SQLITE",
      schemaMismatchDetected: true,
    });

    expect(partialWrite.validation.reasonCodes).toContain("PARTIAL_WRITE_DETECTED");
    expect(rollbackFailure.validation.reasonCodes).toContain("ROLLBACK_FAILED");
    expect(schemaMismatch.validation.reasonCodes).toContain("SCHEMA_MISMATCH");
  });

  it("fails replay reconstruction when event or reference data is missing", () => {
    const input = foundation();
    const missingHistory = sealTruthStorageFramework({
      request: buildTruthStorageFrameworkRequest({
        tenant_id: "tenant-alpha",
        now: "2026-06-19T12:04:00.000Z",
      }),
      ...input,
      adapterRegistry: activeSqliteRegistry(),
      activeAdapterType: "SQLITE",
      storageEvents: [],
    });
    const missingReplay = sealTruthStorageFramework({
      request: buildTruthStorageFrameworkRequest({
        tenant_id: "tenant-alpha",
        now: "2026-06-19T12:04:00.000Z",
      }),
      ...input,
      adapterRegistry: activeSqliteRegistry(),
      activeAdapterType: "SQLITE",
      resolvableReplayReferences: [],
    });

    expect(missingHistory.validation.reasonCodes).toContain("EVENT_HISTORY_MISSING");
    expect(missingHistory.replay.replayResult).toBe("INCOMPLETE_EVIDENCE");
    expect(missingReplay.validation.reasonCodes).toContain("REPLAY_REFERENCES_MISSING");
    expect(missingReplay.replay.replayResult).toBe("UNREPLAYABLE");
  });

  it("fails adapter leakage, non-idempotent distributed writes, and missing conflict metadata", () => {
    const input = foundation();
    const leakage = sealTruthStorageFramework({
      request: buildTruthStorageFrameworkRequest({
        tenant_id: "tenant-alpha",
        now: "2026-06-19T12:04:00.000Z",
      }),
      ...input,
      adapterRegistry: activeSqliteRegistry(),
      activeAdapterType: "SQLITE",
      adapterLeakageDetected: true,
    });
    const nonIdempotent = sealTruthStorageFramework({
      request: buildTruthStorageFrameworkRequest({
        tenant_id: "tenant-alpha",
        now: "2026-06-19T12:04:00.000Z",
      }),
      ...input,
      adapterRegistry: activeSqliteRegistry(),
      activeAdapterType: "SQLITE",
      nonIdempotentDistributedWriteDetected: true,
    });
    const missingConflictMetadata = sealTruthStorageFramework({
      request: buildTruthStorageFrameworkRequest({
        tenant_id: "tenant-alpha",
        now: "2026-06-19T12:04:00.000Z",
      }),
      ...input,
      adapterRegistry: activeSqliteRegistry(),
      activeAdapterType: "SQLITE",
      missingConflictMetadata: true,
    });

    expect(leakage.validation.reasonCodes).toContain("ADAPTER_LEAKAGE_DETECTED");
    expect(nonIdempotent.validation.reasonCodes).toContain("NON_IDEMPOTENT_DISTRIBUTED_WRITE");
    expect(missingConflictMetadata.validation.reasonCodes).toContain("CONFLICT_METADATA_MISSING");
  });

  it("supports conditional certification for non-critical observability or future-adapter gaps", () => {
    const input = foundation();
    const conditional = sealTruthStorageFramework({
      request: buildTruthStorageFrameworkRequest({
        tenant_id: "tenant-alpha",
        now: "2026-06-19T12:04:00.000Z",
      }),
      ...input,
      adapterRegistry: activeSqliteRegistry(),
      activeAdapterType: "SQLITE",
      observabilityGapDetected: true,
      futureAdapterLimitationDetected: true,
      remediationDocumented: true,
    });

    expect(conditional.certification).toBe("CONDITIONAL_PASS");
  });

  it("blocks execution, approval, ranking, prioritization, scoring, resource allocation, and authority expansion", () => {
    const input = foundation();
    const base = {
      request: buildTruthStorageFrameworkRequest({
        tenant_id: "tenant-alpha",
        now: "2026-06-19T12:04:00.000Z",
      }),
      ...input,
      adapterRegistry: activeSqliteRegistry(),
      activeAdapterType: "SQLITE" as const,
    };

    expect(sealTruthStorageFramework({ ...base, executionRequested: true }).validation.reasonCodes).toContain("EXECUTION_REQUEST_BLOCKED");
    expect(sealTruthStorageFramework({ ...base, approvalRequested: true }).validation.reasonCodes).toContain("APPROVAL_DETECTED");
    expect(sealTruthStorageFramework({ ...base, rankingRequested: true }).validation.reasonCodes).toContain("RANKING_DETECTED");
    expect(sealTruthStorageFramework({ ...base, prioritizationRequested: true }).validation.reasonCodes).toContain("PRIORITIZATION_DETECTED");
    expect(sealTruthStorageFramework({ ...base, scoringRequested: true }).validation.reasonCodes).toContain("SCORING_DETECTED");
    expect(sealTruthStorageFramework({ ...base, resourceAllocationRequested: true }).validation.reasonCodes).toContain("RESOURCE_ALLOCATION_DETECTED");
    expect(sealTruthStorageFramework({ ...base, authorityExpansionDetected: true }).validation.reasonCodes).toContain("AUTHORITY_EXPANSION_DETECTED");
  });
});
