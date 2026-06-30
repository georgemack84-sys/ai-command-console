import { describe, expect, it } from "vitest";
import {
  buildTruthClassificationSystemRequest,
  buildTruthEventFrameworkRequest,
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
  sealTruthEventFramework,
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
    truth_record_id: hash("event-truth-record"),
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
      truth_record_id: hash("event-truth-record"),
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
    lineage_root_id: hash("event-lineage-root"),
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
  const rootId = hash("event-lineage-root");
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
      write_id: hash("event-write-id"),
      tenant_id: "tenant-alpha",
      mission_id: "mission-alpha",
      truth_record_id: truthRecord.record.truth_record_id,
      write_type: "APPEND_TRUTH_EVENT",
      write_source: "CERTIFICATION_ENGINE",
      write_timestamp: "2026-06-20T12:05:00.000Z",
      write_payload: { event_type: "RECOMMENDATION_APPROVED", valid: true },
      evidence_references: ["evidence-alpha"],
      replay_references: ["replay-alpha"],
      idempotency_key: "event-idem",
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
      read_id: hash("event-read-id"),
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
    certificationReason: "Persistence ready",
  });
  return { persistence, truthRecord };
}

describe("eventContract", () => {
  it("passes a valid event contract deterministically", () => {
    const base = persistenceBase();
    const first = sealTruthEventFramework({
      request: buildTruthEventFrameworkRequest({
        tenant_id: "tenant-alpha",
        now: "2026-06-20T12:09:00.000Z",
      }),
      persistence: base.persistence,
      missionId: "mission-alpha",
      truthRecordId: base.truthRecord.record.truth_record_id,
      eventType: "TRUTH_VERIFIED",
      eventCategory: "TRUTH",
      eventSource: "WRITE_ENGINE",
      eventPayload: { verified: true, version: 1 },
      payloadType: "truth_verification",
      payloadVersion: "v1",
      evidenceReferenceIds: ["evidence-alpha"],
      replayReferenceIds: ["replay-alpha"],
    });
    const second = sealTruthEventFramework({
      request: buildTruthEventFrameworkRequest({
        tenant_id: "tenant-alpha",
        now: "2026-06-20T12:09:00.000Z",
      }),
      persistence: base.persistence,
      missionId: "mission-alpha",
      truthRecordId: base.truthRecord.record.truth_record_id,
      eventType: "TRUTH_VERIFIED",
      eventCategory: "TRUTH",
      eventSource: "WRITE_ENGINE",
      eventPayload: { verified: true, version: 1 },
      payloadType: "truth_verification",
      payloadVersion: "v1",
      evidenceReferenceIds: ["evidence-alpha"],
      replayReferenceIds: ["replay-alpha"],
    });

    expect(first).toEqual(second);
    expect(first.certification).toBe("PASS");
    expect(first.replay.replayResult).toBe("REPRODUCED");
  });

  it("fails duplicate event identity and identity mutation", () => {
    const base = persistenceBase();
    const duplicate = sealTruthEventFramework({
      request: buildTruthEventFrameworkRequest({ tenant_id: "tenant-alpha", now: "2026-06-20T12:09:00.000Z" }),
      persistence: base.persistence,
      eventId: "event-duplicate",
      missionId: "mission-alpha",
      truthRecordId: base.truthRecord.record.truth_record_id,
      eventType: "TRUTH_VERIFIED",
      eventCategory: "TRUTH",
      eventSource: "WRITE_ENGINE",
      eventPayload: { verified: true },
      payloadType: "truth_verification",
      payloadVersion: "v1",
      evidenceReferenceIds: ["evidence-alpha"],
      replayReferenceIds: ["replay-alpha"],
      priorEventIds: ["event-duplicate"],
    });
    const mutated = sealTruthEventFramework({
      request: buildTruthEventFrameworkRequest({ tenant_id: "tenant-alpha", now: "2026-06-20T12:09:00.000Z" }),
      persistence: base.persistence,
      missionId: "mission-alpha",
      truthRecordId: base.truthRecord.record.truth_record_id,
      eventType: "TRUTH_VERIFIED",
      eventCategory: "TRUTH",
      eventSource: "WRITE_ENGINE",
      eventPayload: { verified: true },
      payloadType: "truth_verification",
      payloadVersion: "v1",
      evidenceReferenceIds: ["evidence-alpha"],
      replayReferenceIds: ["replay-alpha"],
      identityMutated: true,
    });

    expect(duplicate.validation.reasonCodes).toContain("EVENT_ID_DUPLICATE");
    expect(mutated.validation.reasonCodes).toContain("EVENT_ID_MUTATED");
  });

  it("fails unknown event type, category mismatch, and unknown source", () => {
    const base = persistenceBase();
    const badType = sealTruthEventFramework({
      request: buildTruthEventFrameworkRequest({ tenant_id: "tenant-alpha", now: "2026-06-20T12:09:00.000Z" }),
      persistence: base.persistence,
      missionId: "mission-alpha",
      truthRecordId: base.truthRecord.record.truth_record_id,
      eventType: "UNKNOWN" as never,
      eventCategory: "TRUTH",
      eventSource: "WRITE_ENGINE",
      eventPayload: { ok: true },
      payloadType: "bad_type",
      payloadVersion: "v1",
      evidenceReferenceIds: ["evidence-alpha"],
      replayReferenceIds: ["replay-alpha"],
    });
    const badCategory = sealTruthEventFramework({
      request: buildTruthEventFrameworkRequest({ tenant_id: "tenant-alpha", now: "2026-06-20T12:09:00.000Z" }),
      persistence: base.persistence,
      missionId: "mission-alpha",
      truthRecordId: base.truthRecord.record.truth_record_id,
      eventType: "TRUTH_VERIFIED",
      eventCategory: "STATE",
      eventSource: "WRITE_ENGINE",
      eventPayload: { ok: true },
      payloadType: "bad_category",
      payloadVersion: "v1",
      evidenceReferenceIds: ["evidence-alpha"],
      replayReferenceIds: ["replay-alpha"],
      categoryMatchesType: false,
    });
    const badSource = sealTruthEventFramework({
      request: buildTruthEventFrameworkRequest({ tenant_id: "tenant-alpha", now: "2026-06-20T12:09:00.000Z" }),
      persistence: base.persistence,
      missionId: "mission-alpha",
      truthRecordId: base.truthRecord.record.truth_record_id,
      eventType: "TRUTH_VERIFIED",
      eventCategory: "TRUTH",
      eventSource: "UNKNOWN_SOURCE" as never,
      eventPayload: { ok: true },
      payloadType: "bad_source",
      payloadVersion: "v1",
      evidenceReferenceIds: ["evidence-alpha"],
      replayReferenceIds: ["replay-alpha"],
    });

    expect(badType.validation.reasonCodes).toContain("EVENT_TYPE_UNSUPPORTED");
    expect(badCategory.validation.reasonCodes).toContain("EVENT_CATEGORY_MISMATCH");
    expect(badSource.validation.reasonCodes).toContain("EVENT_SOURCE_INVALID");
  });

  it("fails invalid payload schema and payload hash mismatch", () => {
    const base = persistenceBase();
    const invalidPayload = sealTruthEventFramework({
      request: buildTruthEventFrameworkRequest({ tenant_id: "tenant-alpha", now: "2026-06-20T12:09:00.000Z" }),
      persistence: base.persistence,
      missionId: "mission-alpha",
      truthRecordId: base.truthRecord.record.truth_record_id,
      eventType: "TRUTH_VERIFIED",
      eventCategory: "TRUTH",
      eventSource: "WRITE_ENGINE",
      eventPayload: { bad: true },
      payloadType: "bad_payload",
      payloadVersion: "v1",
      evidenceReferenceIds: ["evidence-alpha"],
      replayReferenceIds: ["replay-alpha"],
      payloadSchemaValid: false,
    });
    const payloadHashMismatch = sealTruthEventFramework({
      request: buildTruthEventFrameworkRequest({ tenant_id: "tenant-alpha", now: "2026-06-20T12:09:00.000Z" }),
      persistence: base.persistence,
      missionId: "mission-alpha",
      truthRecordId: base.truthRecord.record.truth_record_id,
      eventType: "TRUTH_VERIFIED",
      eventCategory: "TRUTH",
      eventSource: "WRITE_ENGINE",
      eventPayload: { ok: true },
      payloadType: "payload_hash_bad",
      payloadVersion: "v1",
      evidenceReferenceIds: ["evidence-alpha"],
      replayReferenceIds: ["replay-alpha"],
      payloadHashMismatchDetected: true,
    });

    expect(invalidPayload.validation.reasonCodes).toContain("PAYLOAD_SCHEMA_INVALID");
    expect(payloadHashMismatch.validation.reasonCodes).toContain("PAYLOAD_HASH_MISMATCH");
  });

  it("fails unknown parent and cross-tenant relationship bindings", () => {
    const base = persistenceBase();
    const unknownParent = sealTruthEventFramework({
      request: buildTruthEventFrameworkRequest({ tenant_id: "tenant-alpha", now: "2026-06-20T12:09:00.000Z" }),
      persistence: base.persistence,
      missionId: "mission-alpha",
      truthRecordId: base.truthRecord.record.truth_record_id,
      eventType: "IDENTITY_LINKED",
      eventCategory: "IDENTITY",
      eventSource: "WRITE_ENGINE",
      eventPayload: { linked: true },
      payloadType: "identity_link",
      payloadVersion: "v1",
      parentEventId: "unknown-parent",
      knownParentEventIds: [],
      evidenceReferenceIds: ["evidence-alpha"],
      replayReferenceIds: ["replay-alpha"],
    });
    const crossTenant = sealTruthEventFramework({
      request: buildTruthEventFrameworkRequest({ tenant_id: "tenant-alpha", now: "2026-06-20T12:09:00.000Z" }),
      persistence: base.persistence,
      missionId: "mission-alpha",
      truthRecordId: base.truthRecord.record.truth_record_id,
      eventType: "IDENTITY_LINKED",
      eventCategory: "IDENTITY",
      eventSource: "WRITE_ENGINE",
      eventPayload: { linked: true },
      payloadType: "identity_link",
      payloadVersion: "v1",
      parentEventId: "parent-event",
      knownParentEventIds: ["parent-event"],
      crossTenantRelationshipDetected: true,
      evidenceReferenceIds: ["evidence-alpha"],
      replayReferenceIds: ["replay-alpha"],
    });

    expect(unknownParent.validation.reasonCodes).toContain("PARENT_EVENT_UNKNOWN");
    expect(crossTenant.validation.reasonCodes).toContain("RELATIONSHIP_TENANT_FAILED");
  });

  it("fails missing evidence or replay bindings", () => {
    const base = persistenceBase();
    const missingEvidence = sealTruthEventFramework({
      request: buildTruthEventFrameworkRequest({ tenant_id: "tenant-alpha", now: "2026-06-20T12:09:00.000Z" }),
      persistence: base.persistence,
      missionId: "mission-alpha",
      truthRecordId: base.truthRecord.record.truth_record_id,
      eventType: "EVIDENCE_ATTACHED",
      eventCategory: "EVIDENCE",
      eventSource: "WRITE_ENGINE",
      eventPayload: { attached: true },
      payloadType: "evidence_attach",
      payloadVersion: "v1",
      evidenceReferenceIds: [],
      replayReferenceIds: ["replay-alpha"],
      evidenceReferencesResolvable: false,
    });
    const missingReplay = sealTruthEventFramework({
      request: buildTruthEventFrameworkRequest({ tenant_id: "tenant-alpha", now: "2026-06-20T12:09:00.000Z" }),
      persistence: base.persistence,
      missionId: "mission-alpha",
      truthRecordId: base.truthRecord.record.truth_record_id,
      eventType: "REPLAY_ATTACHED",
      eventCategory: "REPLAY",
      eventSource: "WRITE_ENGINE",
      eventPayload: { attached: true },
      payloadType: "replay_attach",
      payloadVersion: "v1",
      evidenceReferenceIds: ["evidence-alpha"],
      replayReferenceIds: [],
      replayReferencesResolvable: false,
    });

    expect(missingEvidence.validation.reasonCodes).toContain("EVIDENCE_BINDING_INVALID");
    expect(missingReplay.validation.reasonCodes).toContain("REPLAY_BINDING_INVALID");
  });

  it("fails event replay mismatch", () => {
    const base = persistenceBase();
    const mismatch = sealTruthEventFramework({
      request: buildTruthEventFrameworkRequest({ tenant_id: "tenant-alpha", now: "2026-06-20T12:09:00.000Z" }),
      persistence: base.persistence,
      missionId: "mission-alpha",
      truthRecordId: base.truthRecord.record.truth_record_id,
      eventType: "TRUTH_VERIFIED",
      eventCategory: "TRUTH",
      eventSource: "WRITE_ENGINE",
      eventPayload: { ok: true },
      payloadType: "truth_verification",
      payloadVersion: "v1",
      evidenceReferenceIds: ["evidence-alpha"],
      replayReferenceIds: ["replay-alpha"],
      replayMismatchDetected: true,
    });

    expect(mismatch.replay.replayResult).toBe("MISMATCH");
  });

  it("blocks execution, approval, ranking, prioritization, scoring, resource allocation, and authority expansion", () => {
    const base = persistenceBase();
    const common = {
      request: buildTruthEventFrameworkRequest({ tenant_id: "tenant-alpha", now: "2026-06-20T12:09:00.000Z" }),
      persistence: base.persistence,
      missionId: "mission-alpha",
      truthRecordId: base.truthRecord.record.truth_record_id,
      eventType: "TRUTH_VERIFIED" as const,
      eventCategory: "TRUTH" as const,
      eventSource: "WRITE_ENGINE" as const,
      eventPayload: { ok: true },
      payloadType: "truth_verification",
      payloadVersion: "v1",
      evidenceReferenceIds: ["evidence-alpha"],
      replayReferenceIds: ["replay-alpha"],
    };

    expect(sealTruthEventFramework({ ...common, executionRequested: true }).validation.reasonCodes).toContain("EXECUTION_REQUEST_BLOCKED");
    expect(sealTruthEventFramework({ ...common, approvalRequested: true }).validation.reasonCodes).toContain("APPROVAL_DETECTED");
    expect(sealTruthEventFramework({ ...common, rankingRequested: true }).validation.reasonCodes).toContain("RANKING_DETECTED");
    expect(sealTruthEventFramework({ ...common, prioritizationRequested: true }).validation.reasonCodes).toContain("PRIORITIZATION_DETECTED");
    expect(sealTruthEventFramework({ ...common, scoringRequested: true }).validation.reasonCodes).toContain("SCORING_DETECTED");
    expect(sealTruthEventFramework({ ...common, resourceAllocationRequested: true }).validation.reasonCodes).toContain("RESOURCE_ALLOCATION_DETECTED");
    expect(sealTruthEventFramework({ ...common, authorityExpansionDetected: true }).validation.reasonCodes).toContain("AUTHORITY_EXPANSION_DETECTED");
  });
});
