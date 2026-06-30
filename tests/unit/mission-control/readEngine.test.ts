import { describe, expect, it } from "vitest";
import {
  buildTruthClassificationSystemRequest,
  buildTruthFoundationCertificationRequest,
  buildTruthIdentityFrameworkRequest,
  buildTruthReadFrameworkRequest,
  buildTruthRecordContractRequest,
  buildTruthStateFrameworkRequest,
  buildTruthStorageFrameworkRequest,
  buildTruthWriteFrameworkRequest,
  sealTruthClassificationSystem,
  sealTruthFoundationCertificationGate,
  sealTruthIdentityFramework,
  sealTruthReadFramework,
  sealTruthRecordContract,
  sealTruthStateFramework,
  sealTruthStorageFramework,
  sealTruthWriteFramework,
  type TruthCatalogReference,
  type TruthIdentityNodeReference,
  type TruthReadRequest,
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
    truth_record_id: hash("read-truth-record"),
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
      truth_record_id: hash("read-truth-record"),
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
    lineage_root_id: hash("read-lineage-root"),
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
  const rootId = hash("read-lineage-root");
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
  const storage = sealTruthStorageFramework({
    request: buildTruthStorageFrameworkRequest({
      tenant_id: "tenant-alpha",
      now: "2026-06-19T12:04:00.000Z",
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
      now: "2026-06-19T12:05:00.000Z",
    }),
    storage,
    writeRequest: {
      write_id: hash("read-write-id"),
      tenant_id: "tenant-alpha",
      mission_id: "mission-alpha",
      truth_record_id: truthRecord.record.truth_record_id,
      write_type: "APPEND_TRUTH_EVENT",
      write_source: "CERTIFICATION_ENGINE",
      write_timestamp: "2026-06-19T12:05:00.000Z",
      write_payload: { event_type: "RECOMMENDATION_APPROVED", valid: true },
      evidence_references: ["evidence-alpha"],
      replay_references: ["replay-alpha"],
      idempotency_key: "read-idem",
      schema_version: "truth-storage/v1",
    },
    knownTenantIds: ["tenant-alpha"],
    knownMissionIds: ["mission-alpha"],
  });
  return { storage, write, truthRecord };
}

function readRequest(overrides: Partial<TruthReadRequest> = {}): TruthReadRequest {
  return {
    read_id: hash("read-id-alpha"),
    tenant_id: "tenant-alpha",
    mission_id: "mission-alpha",
    truth_record_id: hash("read-truth-record"),
    read_type: "DIRECT_LOOKUP",
    read_source: "OPERATOR",
    read_timestamp: "2026-06-19T12:06:00.000Z",
    query_parameters: { truth_record_id: hash("read-truth-record") },
    schema_version: "truth-storage/v1",
    ...overrides,
  };
}

describe("readEngine", () => {
  it("passes a direct lookup deterministically", () => {
    const base = foundation();
    const first = sealTruthReadFramework({
      request: buildTruthReadFrameworkRequest({
        tenant_id: "tenant-alpha",
        now: "2026-06-19T12:06:00.000Z",
      }),
      storage: base.storage,
      write: base.write,
      readRequest: readRequest(),
    });
    const second = sealTruthReadFramework({
      request: buildTruthReadFrameworkRequest({
        tenant_id: "tenant-alpha",
        now: "2026-06-19T12:06:00.000Z",
      }),
      storage: base.storage,
      write: base.write,
      readRequest: readRequest(),
    });

    expect(first).toEqual(second);
    expect(first.certification).toBe("PASS");
    expect(first.ledgerEntry.read_result).toBe("RETURNED");
    expect(first.replay.replayResult).toBe("REPRODUCED");
  });

  it("returns NOT_FOUND for missing direct lookup records", () => {
    const base = foundation();
    const sealed = sealTruthReadFramework({
      request: buildTruthReadFrameworkRequest({
        tenant_id: "tenant-alpha",
        now: "2026-06-19T12:06:00.000Z",
      }),
      storage: base.storage,
      write: base.write,
      readRequest: readRequest(),
      directLookupFound: false,
    });

    expect(sealed.ledgerEntry.read_result).toBe("NOT_FOUND");
  });

  it("passes lineage and replay lookups", () => {
    const base = foundation();
    const lineage = sealTruthReadFramework({
      request: buildTruthReadFrameworkRequest({
        tenant_id: "tenant-alpha",
        now: "2026-06-19T12:06:00.000Z",
      }),
      storage: base.storage,
      write: base.write,
      readRequest: readRequest({ read_type: "LINEAGE_LOOKUP" }),
      lineageNodes: [hash("read-lineage-root"), hash("read-truth-record")],
      ancestorTruthIds: [hash("read-lineage-root")],
      descendantTruthIds: [],
    });
    const replay = sealTruthReadFramework({
      request: buildTruthReadFrameworkRequest({
        tenant_id: "tenant-alpha",
        now: "2026-06-19T12:06:00.000Z",
      }),
      storage: base.storage,
      write: base.write,
      readRequest: readRequest({ read_type: "REPLAY_LOOKUP" }),
      replayArtifactsPresent: true,
      evidenceReferencesResolvable: true,
      replayReferencesResolvable: true,
    });

    expect(lineage.validation.validationState).toBe("VALID");
    expect(replay.validation.validationState).toBe("VALID");
  });

  it("fails duplicate identity, lineage cycle, and broken lineage reads", () => {
    const base = foundation();
    const duplicate = sealTruthReadFramework({
      request: buildTruthReadFrameworkRequest({ tenant_id: "tenant-alpha", now: "2026-06-19T12:06:00.000Z" }),
      storage: base.storage,
      write: base.write,
      readRequest: readRequest(),
      duplicateIdentityReturned: true,
    });
    const cycle = sealTruthReadFramework({
      request: buildTruthReadFrameworkRequest({ tenant_id: "tenant-alpha", now: "2026-06-19T12:06:00.000Z" }),
      storage: base.storage,
      write: base.write,
      readRequest: readRequest({ read_type: "LINEAGE_LOOKUP" }),
      lineageCycleDetected: true,
    });
    const broken = sealTruthReadFramework({
      request: buildTruthReadFrameworkRequest({ tenant_id: "tenant-alpha", now: "2026-06-19T12:06:00.000Z" }),
      storage: base.storage,
      write: base.write,
      readRequest: readRequest({ read_type: "LINEAGE_LOOKUP" }),
      brokenLineageDetected: true,
    });

    expect(duplicate.validation.reasonCodes).toContain("IDENTITY_MISMATCH");
    expect(cycle.validation.reasonCodes).toContain("LINEAGE_CYCLE_DETECTED");
    expect(broken.validation.reasonCodes).toContain("LINEAGE_BROKEN");
  });

  it("fails incomplete replay context and cross-tenant reads", () => {
    const base = foundation();
    const incompleteReplay = sealTruthReadFramework({
      request: buildTruthReadFrameworkRequest({ tenant_id: "tenant-alpha", now: "2026-06-19T12:06:00.000Z" }),
      storage: base.storage,
      write: base.write,
      readRequest: readRequest({ read_type: "REPLAY_LOOKUP" }),
      replayArtifactsPresent: false,
    });
    const crossTenant = sealTruthReadFramework({
      request: buildTruthReadFrameworkRequest({ tenant_id: "tenant-alpha", now: "2026-06-19T12:06:00.000Z" }),
      storage: base.storage,
      write: base.write,
      readRequest: readRequest({ tenant_id: "tenant-beta" }),
      accessTenantId: "tenant-beta",
      queryTenantScoped: false,
    });

    expect(incompleteReplay.validation.reasonCodes).toContain("REPLAY_CONTEXT_INCOMPLETE");
    expect(crossTenant.validation.reasonCodes).toContain("TENANT_ISOLATION_FAILED");
  });

  it("fails nondeterministic ordering, unstable pagination, schema mismatch, and corrupt results", () => {
    const base = foundation();
    const ordering = sealTruthReadFramework({
      request: buildTruthReadFrameworkRequest({ tenant_id: "tenant-alpha", now: "2026-06-19T12:06:00.000Z" }),
      storage: base.storage,
      write: base.write,
      readRequest: readRequest(),
      nondeterministicOrderingDetected: true,
    });
    const pagination = sealTruthReadFramework({
      request: buildTruthReadFrameworkRequest({ tenant_id: "tenant-alpha", now: "2026-06-19T12:06:00.000Z" }),
      storage: base.storage,
      write: base.write,
      readRequest: readRequest(),
      unstablePaginationDetected: true,
    });
    const schema = sealTruthReadFramework({
      request: buildTruthReadFrameworkRequest({ tenant_id: "tenant-alpha", now: "2026-06-19T12:06:00.000Z" }),
      storage: base.storage,
      write: base.write,
      readRequest: readRequest({ schema_version: "wrong-schema" }),
      schemaMismatchDetected: true,
    });
    const corrupt = sealTruthReadFramework({
      request: buildTruthReadFrameworkRequest({ tenant_id: "tenant-alpha", now: "2026-06-19T12:06:00.000Z" }),
      storage: base.storage,
      write: base.write,
      readRequest: readRequest(),
      corruptResultDetected: true,
    });

    expect(ordering.validation.reasonCodes).toContain("ORDERING_NONDETERMINISTIC");
    expect(pagination.validation.reasonCodes).toContain("PAGINATION_INVALID");
    expect(schema.validation.reasonCodes).toContain("SCHEMA_MISMATCH");
    expect(corrupt.validation.reasonCodes).toContain("RESULT_CORRUPT");
  });

  it("fails replay mismatch and supports conditional certification for non-critical gaps", () => {
    const base = foundation();
    const mismatch = sealTruthReadFramework({
      request: buildTruthReadFrameworkRequest({ tenant_id: "tenant-alpha", now: "2026-06-19T12:06:00.000Z" }),
      storage: base.storage,
      write: base.write,
      readRequest: readRequest(),
      replayMismatchDetected: true,
    });
    const conditional = sealTruthReadFramework({
      request: buildTruthReadFrameworkRequest({ tenant_id: "tenant-alpha", now: "2026-06-19T12:06:00.000Z" }),
      storage: base.storage,
      write: base.write,
      readRequest: readRequest(),
      observabilityGapDetected: true,
      analyticsLimitationDetected: true,
      remediationDocumented: true,
    });

    expect(mismatch.replay.replayResult).toBe("MISMATCH");
    expect(conditional.certification).toBe("CONDITIONAL_PASS");
  });

  it("blocks execution, approval, ranking, prioritization, scoring, resource allocation, and authority expansion", () => {
    const base = foundation();
    const common = {
      request: buildTruthReadFrameworkRequest({ tenant_id: "tenant-alpha", now: "2026-06-19T12:06:00.000Z" }),
      storage: base.storage,
      write: base.write,
      readRequest: readRequest(),
    };

    expect(sealTruthReadFramework({ ...common, executionRequested: true }).validation.reasonCodes).toContain("EXECUTION_REQUEST_BLOCKED");
    expect(sealTruthReadFramework({ ...common, approvalRequested: true }).validation.reasonCodes).toContain("APPROVAL_DETECTED");
    expect(sealTruthReadFramework({ ...common, rankingRequested: true }).validation.reasonCodes).toContain("RANKING_DETECTED");
    expect(sealTruthReadFramework({ ...common, prioritizationRequested: true }).validation.reasonCodes).toContain("PRIORITIZATION_DETECTED");
    expect(sealTruthReadFramework({ ...common, scoringRequested: true }).validation.reasonCodes).toContain("SCORING_DETECTED");
    expect(sealTruthReadFramework({ ...common, resourceAllocationRequested: true }).validation.reasonCodes).toContain("RESOURCE_ALLOCATION_DETECTED");
    expect(sealTruthReadFramework({ ...common, authorityExpansionDetected: true }).validation.reasonCodes).toContain("AUTHORITY_EXPANSION_DETECTED");
  });
});
