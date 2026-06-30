import { describe, expect, it } from "vitest";
import {
  buildTruthClassificationSystemRequest,
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
  sealTruthFoundationCertificationGate,
  sealTruthIdentityFramework,
  sealTruthPersistenceCertificationGate,
  sealTruthReadFramework,
  sealTruthRecordContract,
  sealTruthRetentionFramework,
  sealTruthStateFramework,
  sealTruthStorageFramework,
  sealTruthWriteFramework,
  sealTruthEventRecorderFramework,
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
    truth_record_id: hash("event-recorder-truth-record"),
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
      truth_record_id: hash("event-recorder-truth-record"),
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
    lineage_root_id: hash("event-recorder-lineage-root"),
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
    adapter_id: "sqlite-event-recorder",
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
  const rootId = hash("event-recorder-lineage-root");
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
      write_id: hash("event-recorder-write-id"),
      tenant_id: "tenant-alpha",
      mission_id: "mission-alpha",
      truth_record_id: record.record.truth_record_id,
      write_type: "APPEND_TRUTH_EVENT",
      write_source: "CERTIFICATION_ENGINE",
      write_timestamp: "2026-06-20T12:05:00.000Z",
      write_payload: { recorded: true },
      evidence_references: ["evidence-alpha"],
      replay_references: ["replay-alpha"],
      idempotency_key: "event-recorder-idem",
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
      read_id: hash("event-recorder-read-id"),
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
  return {
    request: buildTruthEventRecorderRequest({
      tenant_id: "tenant-alpha",
      now: "2026-06-20T12:09:00.000Z",
    }),
    persistence: base.persistence,
    knownTenantIds: ["tenant-alpha"],
    knownMissionIds: ["mission-alpha"],
    evidenceCatalog: [evidenceRef("evidence-alpha")],
    replayCatalog: [replayRef("replay-alpha")],
    accessTenantId: "tenant-alpha",
    rawEvent: {
      missionId: "mission-alpha",
      truthRecordId: base.truthRecord.record.truth_record_id,
      eventType: "TRUTH_VERIFIED",
      payload: { ok: true },
      payloadType: "truth_verification",
      payloadVersion: "v1",
      evidenceReferenceIds: ["evidence-alpha"],
      replayReferenceIds: ["replay-alpha"],
    },
    ...overrides,
  };
}

describe("eventRecorder", () => {
  it("records user, system, governance, and runtime events", () => {
    const user = sealTruthEventRecorderFramework({
      ...recorderBase(),
      recorderKind: "USER",
      rawEvent: {
        ...recorderBase().rawEvent,
        action: "manual approval",
        actorId: "operator-1",
        actorTenantId: "tenant-alpha",
        eventType: "TRUTH_VERIFIED",
        eventSource: "OPERATOR",
      },
    });
    const system = sealTruthEventRecorderFramework({
      ...recorderBase(),
      recorderKind: "SYSTEM",
      rawEvent: {
        ...recorderBase().rawEvent,
        eventType: "STATE_TRANSITIONED",
        systemSource: "WRITE_ENGINE",
        componentId: "write-engine",
        operation: "append_truth_event",
        operationResult: "success",
      },
    });
    const governance = sealTruthEventRecorderFramework({
      ...recorderBase(),
      recorderKind: "GOVERNANCE",
      rawEvent: {
        ...recorderBase().rawEvent,
        eventType: "GOVERNANCE_ACTION",
        governanceAuthority: "policy-board",
        governanceRationale: "Compliant",
        governanceScope: "mission-alpha",
      },
    });
    const runtime = sealTruthEventRecorderFramework({
      ...recorderBase(),
      recorderKind: "RUNTIME",
      rawEvent: {
        ...recorderBase().rawEvent,
        eventType: "RUNTIME_EVENT",
        runtimeIdentity: "runtime-1",
        runtimeState: "STARTED",
        runtimeResult: "healthy",
      },
    });

    expect(user.recording.recording_state).toBe("RECORDED");
    expect(system.recording.recording_state).toBe("RECORDED");
    expect(governance.recording.recording_state).toBe("RECORDED");
    expect(runtime.recording.recording_state).toBe("RECORDED");
  });

  it("fails missing actor on a user event", () => {
    const result = sealTruthEventRecorderFramework({
      ...recorderBase(),
      recorderKind: "USER",
      rawEvent: {
        ...recorderBase().rawEvent,
        action: "manual approval",
        eventSource: "OPERATOR",
      },
    });

    expect(result.validation.reasonCodes).toContain("USER_ACTOR_MISSING");
    expect(result.certification).toBe("FAIL");
  });

  it("fails unknown system source", () => {
    const result = sealTruthEventRecorderFramework({
      ...recorderBase(),
      recorderKind: "SYSTEM",
      rawEvent: {
        ...recorderBase().rawEvent,
        eventType: "STATE_TRANSITIONED",
        systemSource: "UNKNOWN_SYSTEM",
        componentId: "write-engine",
        operation: "append_truth_event",
        operationResult: "success",
      },
    });

    expect(result.validation.reasonCodes).toContain("SYSTEM_SOURCE_INVALID");
  });

  it("fails missing governance authority", () => {
    const result = sealTruthEventRecorderFramework({
      ...recorderBase(),
      recorderKind: "GOVERNANCE",
      rawEvent: {
        ...recorderBase().rawEvent,
        eventType: "GOVERNANCE_ACTION",
        governanceRationale: "Compliant",
        governanceScope: "mission-alpha",
      },
    });

    expect(result.validation.reasonCodes).toContain("GOVERNANCE_AUTHORITY_MISSING");
  });

  it("fails unknown runtime state", () => {
    const result = sealTruthEventRecorderFramework({
      ...recorderBase(),
      recorderKind: "RUNTIME",
      rawEvent: {
        ...recorderBase().rawEvent,
        eventType: "RUNTIME_EVENT",
        runtimeIdentity: "runtime-1",
        runtimeState: "UNKNOWN_STATE",
        runtimeResult: "bad",
      },
    });

    expect(result.validation.reasonCodes).toContain("RUNTIME_STATE_INVALID");
  });

  it("passes normalization and integrity validation deterministically", () => {
    const first = sealTruthEventRecorderFramework({
      ...recorderBase(),
      recorderKind: "SYSTEM",
      rawEvent: {
        ...recorderBase().rawEvent,
        eventType: "CLASSIFICATION_ASSIGNED",
        systemSource: "CERTIFICATION_ENGINE",
        componentId: "classifier",
        operation: "assign_classification",
        operationResult: "success",
        unknownFields: { stable_extra: true },
      },
    });
    const second = sealTruthEventRecorderFramework({
      ...recorderBase(),
      recorderKind: "SYSTEM",
      rawEvent: {
        ...recorderBase().rawEvent,
        eventType: "CLASSIFICATION_ASSIGNED",
        systemSource: "CERTIFICATION_ENGINE",
        componentId: "classifier",
        operation: "assign_classification",
        operationResult: "success",
        unknownFields: { stable_extra: true },
      },
    });

    expect(first).toEqual(second);
    expect(first.validation.reasonCodes).toContain("NORMALIZATION_VALID");
    expect(first.validation.reasonCodes).toContain("EVENT_INTEGRITY_VALID");
  });

  it("fails contract mismatch, invalid payload, invalid evidence, and invalid replay references", () => {
    const mismatch = sealTruthEventRecorderFramework({
      ...recorderBase(),
      recorderKind: "SYSTEM",
      rawEvent: {
        ...recorderBase().rawEvent,
        eventType: "TRUTH_VERIFIED",
        eventCategory: "STATE",
        systemSource: "WRITE_ENGINE",
        componentId: "write-engine",
        operation: "append_truth_event",
        operationResult: "success",
      },
      eventContractMismatchDetected: true,
    });
    const invalidPayload = sealTruthEventRecorderFramework({
      ...recorderBase(),
      recorderKind: "SYSTEM",
      rawEvent: {
        ...recorderBase().rawEvent,
        eventType: "TRUTH_VERIFIED",
        systemSource: "WRITE_ENGINE",
        componentId: "write-engine",
        operation: "append_truth_event",
        operationResult: "success",
        payload: { bad: true } as never,
      },
      payloadSchemaValid: false,
    });
    const invalidEvidence = sealTruthEventRecorderFramework({
      ...recorderBase(),
      recorderKind: "SYSTEM",
      rawEvent: {
        ...recorderBase().rawEvent,
        eventType: "TRUTH_VERIFIED",
        systemSource: "WRITE_ENGINE",
        componentId: "write-engine",
        operation: "append_truth_event",
        operationResult: "success",
        evidenceReferenceIds: ["missing-evidence"],
      },
    });
    const invalidReplay = sealTruthEventRecorderFramework({
      ...recorderBase(),
      recorderKind: "SYSTEM",
      rawEvent: {
        ...recorderBase().rawEvent,
        eventType: "TRUTH_VERIFIED",
        systemSource: "WRITE_ENGINE",
        componentId: "write-engine",
        operation: "append_truth_event",
        operationResult: "success",
        replayReferenceIds: ["missing-replay"],
      },
    });

    expect(mismatch.validation.reasonCodes).toContain("EVENT_CONTRACT_MISMATCH");
    expect(invalidPayload.validation.reasonCodes).toContain("NORMALIZATION_FAILED");
    expect(invalidEvidence.validation.reasonCodes).toContain("EVIDENCE_REFERENCES_INVALID");
    expect(invalidReplay.validation.reasonCodes).toContain("REPLAY_REFERENCES_INVALID");
  });

  it("preserves deterministic ordering and detects duplicate sequence", () => {
    const prior = sealTruthEventRecorderFramework({
      ...recorderBase(),
      recorderKind: "SYSTEM",
      rawEvent: {
        ...recorderBase().rawEvent,
        eventType: "STATE_TRANSITIONED",
        systemSource: "WRITE_ENGINE",
        componentId: "write-engine",
        operation: "append_truth_event",
        operationResult: "success",
      },
    });
    const ordered = sealTruthEventRecorderFramework({
      ...recorderBase(),
      recorderKind: "SYSTEM",
      priorRecordings: [prior.ledgerEntry],
      rawEvent: {
        ...recorderBase().rawEvent,
        eventType: "STATE_TRANSITIONED",
        systemSource: "WRITE_ENGINE",
        componentId: "write-engine",
        operation: "append_truth_event",
        operationResult: "success",
      },
    });
    const duplicate = sealTruthEventRecorderFramework({
      ...recorderBase(),
      recorderKind: "SYSTEM",
      priorRecordings: [prior.ledgerEntry],
      eventSequence: prior.ledgerEntry.event_sequence,
      rawEvent: {
        ...recorderBase().rawEvent,
        eventType: "STATE_TRANSITIONED",
        systemSource: "WRITE_ENGINE",
        componentId: "write-engine",
        operation: "append_truth_event",
        operationResult: "success",
      },
    });

    expect(ordered.ledgerEntry.event_sequence).toBe(prior.ledgerEntry.event_sequence + 1);
    expect(duplicate.validation.reasonCodes).toContain("ORDERING_DUPLICATE_SEQUENCE");
  });

  it("protects transactions and rolls back partial records", () => {
    const committed = sealTruthEventRecorderFramework({
      ...recorderBase(),
      recorderKind: "GOVERNANCE",
      rawEvent: {
        ...recorderBase().rawEvent,
        eventType: "GOVERNANCE_ACTION",
        governanceAuthority: "policy-board",
        governanceRationale: "Compliant",
        governanceScope: "mission-alpha",
      },
    });
    const rolledBack = sealTruthEventRecorderFramework({
      ...recorderBase(),
      recorderKind: "GOVERNANCE",
      partialRecordDetected: true,
      rawEvent: {
        ...recorderBase().rawEvent,
        eventType: "GOVERNANCE_ACTION",
        governanceAuthority: "policy-board",
        governanceRationale: "Compliant",
        governanceScope: "mission-alpha",
      },
    });

    expect(committed.ledgerEntry.transaction_status).toBe("COMMITTED");
    expect(rolledBack.ledgerEntry.transaction_status).toBe("NOT_STARTED");
    expect(rolledBack.validation.reasonCodes).toContain("PARTIAL_RECORD_DETECTED");
  });

  it("reproduces replay output and detects replay mismatch", () => {
    const reproduced = sealTruthEventRecorderFramework({
      ...recorderBase(),
      recorderKind: "RUNTIME",
      rawEvent: {
        ...recorderBase().rawEvent,
        eventType: "RUNTIME_EVENT",
        runtimeIdentity: "runtime-1",
        runtimeState: "STARTED",
        runtimeResult: "healthy",
      },
    });
    const mismatch = sealTruthEventRecorderFramework({
      ...recorderBase(),
      recorderKind: "RUNTIME",
      recordingMismatchDetected: true,
      rawEvent: {
        ...recorderBase().rawEvent,
        eventType: "RUNTIME_EVENT",
        runtimeIdentity: "runtime-1",
        runtimeState: "STARTED",
        runtimeResult: "healthy",
      },
    });

    expect(reproduced.replay.replayResult).toBe("REPRODUCED");
    expect(mismatch.replay.replayResult).toBe("MISMATCH");
  });

  it("blocks cross-tenant event recording", () => {
    const result = sealTruthEventRecorderFramework({
      ...recorderBase(),
      recorderKind: "USER",
      rawEvent: {
        ...recorderBase().rawEvent,
        action: "manual escalation",
        actorId: "operator-1",
        actorTenantId: "tenant-beta",
        eventType: "ESCALATION_CREATED",
        eventSource: "OPERATOR",
      },
    });

    expect(result.validation.reasonCodes).toContain("USER_ACTOR_TENANT_FAILED");
    expect(result.recording.recording_state).toBe("REJECTED");
  });
});
