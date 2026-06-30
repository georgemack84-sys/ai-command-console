import { describe, expect, it } from "vitest";
import {
  buildTruthClassificationSystemRequest,
  buildTruthEventOrderingRequest,
  buildTruthEventRecorderRequest,
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
  sealTruthEventOrderingFramework,
  sealTruthEventRecorderFramework,
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
    truth_record_id: hash("event-order-truth-record"),
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
      truth_record_id: hash("event-order-truth-record"),
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
    lineage_root_id: hash("event-order-lineage-root"),
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
    adapter_id: "sqlite-event-order",
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
  const record = sealTruthRecordContract(truthRecordInput());
  const classification = sealTruthClassificationSystem({
    request: buildTruthClassificationSystemRequest({
      tenant_id: "tenant-alpha",
      now: "2026-06-20T12:01:00.000Z",
    }),
    truthRecord: record,
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
  const rootId = hash("event-order-lineage-root");
  const identity = sealTruthIdentityFramework({
    request: buildTruthIdentityFrameworkRequest({
      tenant_id: "tenant-alpha",
      now: "2026-06-20T12:01:30.000Z",
    }),
    truthRecord: record,
    identityCatalog: [
      identityNode(rootId, {
        lineage_root_id: rootId,
        child_truth_ids: [record.record.truth_record_id],
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
    truthRecord: record,
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
    truthRecord: record,
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
    truthRecord: record,
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
      write_id: hash("event-order-write-id"),
      tenant_id: "tenant-alpha",
      mission_id: "mission-alpha",
      truth_record_id: record.record.truth_record_id,
      write_type: "APPEND_TRUTH_EVENT",
      write_source: "CERTIFICATION_ENGINE",
      write_timestamp: "2026-06-20T12:05:00.000Z",
      write_payload: { recorded: true },
      evidence_references: ["evidence-alpha"],
      replay_references: ["replay-alpha"],
      idempotency_key: "event-order-idem",
    },
    knownTenantIds: ["tenant-alpha"],
    knownMissionIds: ["mission-alpha"],
    truthRecordExists: true,
    evidenceReferencesValid: true,
    replayReferencesValid: true,
    accessTenantId: "tenant-alpha",
  });
  const read = sealTruthReadFramework({
    request: buildTruthReadFrameworkRequest({
      tenant_id: "tenant-alpha",
      now: "2026-06-20T12:06:00.000Z",
    }),
    storage,
    write,
    readRequest: {
      read_id: hash("event-order-read-id"),
      tenant_id: "tenant-alpha",
      mission_id: "mission-alpha",
      truth_record_id: record.record.truth_record_id,
      read_type: "DIRECT_LOOKUP",
      read_source: "OPERATOR",
      read_timestamp: "2026-06-20T12:06:00.000Z",
      query_parameters: { truth_record_id: record.record.truth_record_id },
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
  const persistence = sealTruthPersistenceCertificationGate({
    request: buildTruthPersistenceCertificationRequest({
      tenant_id: "tenant-alpha",
      now: "2026-06-20T12:08:00.000Z",
    }),
    storage,
    write,
    read,
    retention,
    certificationAuthority: "CERTIFICATION_ENGINE",
    evidenceReferences: ["evidence-alpha"],
    replayReferences: ["replay-alpha"],
    accessTenantId: "tenant-alpha",
  });

  return { persistence, truthRecord: record };
}

function recorderBase(overrides: Record<string, unknown> = {}) {
  const base = persistenceBase();
  const recorder = sealTruthEventRecorderFramework({
    request: buildTruthEventRecorderRequest({
      tenant_id: "tenant-alpha",
      now: "2026-06-20T12:09:00.000Z",
    }),
    persistence: base.persistence,
    recorderKind: "SYSTEM",
    knownTenantIds: ["tenant-alpha"],
    knownMissionIds: ["mission-alpha"],
    evidenceCatalog: [evidenceRef("evidence-alpha")],
    replayCatalog: [replayRef("replay-alpha")],
    accessTenantId: "tenant-alpha",
    rawEvent: {
      missionId: "mission-alpha",
      truthRecordId: base.truthRecord.record.truth_record_id,
      eventType: "STATE_TRANSITIONED",
      payload: { ok: true },
      payloadType: "state_transition",
      payloadVersion: "v1",
      evidenceReferenceIds: ["evidence-alpha"],
      replayReferenceIds: ["replay-alpha"],
      systemSource: "WRITE_ENGINE",
      componentId: "write-engine",
      operation: "append_truth_event",
      operationResult: "success",
      eventTimestamp: "2026-06-20T12:08:30.000Z",
    },
  });

  return {
    request: buildTruthEventOrderingRequest({
      tenant_id: "tenant-alpha",
      now: "2026-06-20T12:10:00.000Z",
    }),
    persistence: base.persistence,
    recorder,
    accessTenantId: "tenant-alpha",
    ...overrides,
  };
}

describe("eventOrderingEngine", () => {
  it("assigns event, tenant, mission, and global sequences", () => {
    const result = sealTruthEventOrderingFramework(recorderBase());

    expect(result.ordering.event_sequence).toBe(1);
    expect(result.ordering.tenant_sequence).toBe(1);
    expect(result.ordering.mission_sequence).toBe(1);
    expect(result.ordering.global_sequence).toBe(1);
    expect(result.certification).toBe("PASS");
  });

  it("detects duplicate sequence", () => {
    const first = sealTruthEventOrderingFramework(recorderBase());
    const duplicate = sealTruthEventOrderingFramework(recorderBase({
      priorOrderings: [first.ledgerEntry],
      eventSequence: first.ordering.event_sequence,
    }));

    expect(duplicate.validation.reasonCodes).toContain("EVENT_SEQUENCE_DUPLICATE");
  });

  it("preserves temporal ordering and detects chronology violation", () => {
    const valid = sealTruthEventOrderingFramework(recorderBase({
      writeTimestamp: "2026-06-20T12:09:10.000Z",
      storageCommitTimestamp: "2026-06-20T12:09:20.000Z",
    }));
    const invalid = sealTruthEventOrderingFramework(recorderBase({
      writeTimestamp: "2026-06-20T12:08:00.000Z",
      storageCommitTimestamp: "2026-06-20T12:07:00.000Z",
    }));

    expect(valid.validation.reasonCodes).toContain("TEMPORAL_ORDERING_VALID");
    expect(invalid.validation.reasonCodes).toContain("CHRONOLOGY_VIOLATION_DETECTED");
  });

  it("preserves namespace isolation and detects namespace collision", () => {
    const first = sealTruthEventOrderingFramework(recorderBase());
    const isolated = sealTruthEventOrderingFramework(recorderBase({
      priorOrderings: [first.ledgerEntry],
    }));
    const collided = sealTruthEventOrderingFramework(recorderBase({
      priorOrderings: [first.ledgerEntry],
      namespaceCollisionDetected: true,
    }));

    expect(isolated.namespaces.TENANT).toBe(2);
    expect(collided.validation.reasonCodes).toContain("NAMESPACE_COLLISION_DETECTED");
  });

  it("resolves ordering conflicts deterministically and detects non-deterministic resolution", () => {
    const first = sealTruthEventOrderingFramework(recorderBase());
    const second = sealTruthEventOrderingFramework(recorderBase({
      priorOrderings: [first.ledgerEntry],
    }));
    const nondeterministic = sealTruthEventOrderingFramework(recorderBase({
      nonDeterministicResolutionDetected: true,
    }));

    expect(second.conflictResolution.resolutionKey[0]).toBe(second.recorder.ledgerEntry.storage_commit_sequence);
    expect(nondeterministic.validation.reasonCodes).toContain("CONFLICT_RESOLUTION_NON_DETERMINISTIC");
  });

  it("reconstructs chronology and detects chronology corruption", () => {
    const first = sealTruthEventOrderingFramework(recorderBase());
    const second = sealTruthEventOrderingFramework(recorderBase({
      priorOrderings: [first.ledgerEntry],
    }));
    const corrupted = sealTruthEventOrderingFramework(recorderBase({
      chronologyCorruptionDetected: true,
    }));

    expect(second.chronology.event_chain).toEqual([first.ordering.event_id, second.ordering.event_id]);
    expect(corrupted.validation.reasonCodes).toContain("CHRONOLOGY_CORRUPTED");
  });

  it("reproduces ordering replay and detects replay mismatch", () => {
    const reproduced = sealTruthEventOrderingFramework(recorderBase());
    const mismatch = sealTruthEventOrderingFramework(recorderBase({
      replayMismatchDetected: true,
    }));

    expect(reproduced.replay.replayResult).toBe("REPRODUCED");
    expect(mismatch.replay.replayResult).toBe("MISMATCH");
  });

  it("blocks cross-tenant sequence leakage and chronology access", () => {
    const leaked = sealTruthEventOrderingFramework(recorderBase({
      crossTenantSequenceLeakageDetected: true,
    }));
    const chronologyLeak = sealTruthEventOrderingFramework(recorderBase({
      crossTenantChronologyAccessDetected: true,
    }));

    expect(leaked.validation.reasonCodes).toContain("TENANT_ISOLATION_FAILED");
    expect(chronologyLeak.validation.reasonCodes).toContain("TENANT_ISOLATION_FAILED");
  });
});
