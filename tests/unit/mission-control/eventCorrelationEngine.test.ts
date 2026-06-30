import { describe, expect, it } from "vitest";
import {
  buildTruthClassificationSystemRequest,
  buildTruthEventCorrelationRequest,
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
  sealTruthEventCorrelationFramework,
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
  return { referenceId, tenantId, immutable: true, accessible: true, auditable: true, resolvable: true };
}

function replayRef(referenceId: string, tenantId = "tenant-alpha"): TruthCatalogReference {
  return { referenceId, tenantId, immutable: true, accessible: true, auditable: true, deterministic: true, resolvable: true };
}

function truthRecord(overrides: Partial<TruthRecord> = {}): TruthRecord {
  return {
    truth_record_id: hash("event-corr-truth-record"),
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
    request: buildTruthRecordContractRequest({ tenant_id: "tenant-alpha", mission_id: "mission-alpha", now: "2026-06-20T12:00:30.000Z" }),
    record: truthRecord(),
    knownTenantIds: ["tenant-alpha"],
    knownMissionIds: ["mission-alpha"],
    existingTruthRecordIds: [],
    priorLifecycleState: "CREATED",
    immutableBaseline: {
      truth_record_id: hash("event-corr-truth-record"),
      tenant_id: "tenant-alpha",
      mission_id: "mission-alpha",
      timestamp: "2026-06-20T12:00:00.000Z",
      event_type: "RECOMMENDATION_APPROVED",
      event_source: "CERTIFICATION_ENGINE",
    },
    evidenceCatalog: [evidenceRef("evidence-alpha"), evidenceRef("evidence-beta")],
    replayCatalog: [replayRef("replay-alpha"), replayRef("replay-beta")],
    accessTenantId: "tenant-alpha",
    ...overrides,
  };
}

function identityNode(truth_record_id: string, overrides: Partial<TruthIdentityNodeReference> = {}): TruthIdentityNodeReference {
  return {
    truth_record_id,
    tenant_id: "tenant-alpha",
    lineage_root_id: hash("event-corr-lineage-root"),
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
    adapter_id: "sqlite-event-corr",
    adapter_type: "SQLITE",
    adapter_version: "v1",
    adapter_state: "ACTIVE",
    capabilities: [
      "create_truth_record", "get_truth_record", "update_truth_state", "append_truth_event", "list_truth_records",
      "query_truth_records", "get_lineage", "get_children", "get_parents", "write_certification_result", "read_certification_result",
    ],
    migration_status: "APPLIED",
    certification_status: "PASS",
  }];
}

function persistenceBase() {
  const record = sealTruthRecordContract(truthRecordInput());
  const classification = sealTruthClassificationSystem({
    request: buildTruthClassificationSystemRequest({ tenant_id: "tenant-alpha", now: "2026-06-20T12:01:00.000Z" }),
    truthRecord: record,
    requestedClassifications: ["DECISION"],
    details: { decision_authority: "CERTIFICATION_ENGINE", decision_rationale: "Approved recommendation", decision_outcome: "RECOMMENDATION_APPROVED" },
    evidenceCatalog: [evidenceRef("evidence-alpha"), evidenceRef("evidence-beta")],
    replayCatalog: [replayRef("replay-alpha"), replayRef("replay-beta")],
    accessTenantId: "tenant-alpha",
  });
  const rootId = hash("event-corr-lineage-root");
  const identity = sealTruthIdentityFramework({
    request: buildTruthIdentityFrameworkRequest({ tenant_id: "tenant-alpha", now: "2026-06-20T12:01:30.000Z" }),
    truthRecord: record,
    identityCatalog: [identityNode(rootId, { lineage_root_id: rootId, child_truth_ids: [record.record.truth_record_id] })],
    lineageRootId: rootId,
    parentTruthIds: [rootId],
    childTruthIds: [],
    accessTenantId: "tenant-alpha",
  });
  const state = sealTruthStateFramework({
    request: buildTruthStateFrameworkRequest({ tenant_id: "tenant-alpha", now: "2026-06-20T12:02:00.000Z" }),
    truthRecord: record,
    currentState: "VERIFIED",
    previousState: "CREATED",
    stateReason: "Validated",
    stateSource: "CERTIFICATION_ENGINE",
    accessTenantId: "tenant-alpha",
  });
  const foundationCertification = sealTruthFoundationCertificationGate({
    request: buildTruthFoundationCertificationRequest({ tenant_id: "tenant-alpha", now: "2026-06-20T12:03:00.000Z" }),
    truthRecord: record,
    classification,
    identity,
    state,
    certificationAuthority: "CERTIFICATION_ENGINE",
    certificationReason: "Foundation ready",
  });
  const storage = sealTruthStorageFramework({
    request: buildTruthStorageFrameworkRequest({ tenant_id: "tenant-alpha", now: "2026-06-20T12:04:00.000Z" }),
    truthRecord: record,
    classification,
    identity,
    state,
    foundationCertification,
    adapterRegistry: storageRegistry(),
    activeAdapterType: "SQLITE",
  });
  const write = sealTruthWriteFramework({
    request: buildTruthWriteFrameworkRequest({ tenant_id: "tenant-alpha", now: "2026-06-20T12:05:00.000Z" }),
    storage,
    writeRequest: {
      write_id: hash("event-corr-write-id"),
      tenant_id: "tenant-alpha",
      mission_id: "mission-alpha",
      truth_record_id: record.record.truth_record_id,
      write_type: "APPEND_TRUTH_EVENT",
      write_source: "CERTIFICATION_ENGINE",
      write_timestamp: "2026-06-20T12:05:00.000Z",
      write_payload: { recorded: true },
      evidence_references: ["evidence-alpha"],
      replay_references: ["replay-alpha"],
      idempotency_key: "event-corr-idem",
    },
    knownTenantIds: ["tenant-alpha"],
    knownMissionIds: ["mission-alpha"],
    truthRecordExists: true,
    evidenceReferencesValid: true,
    replayReferencesValid: true,
    accessTenantId: "tenant-alpha",
  });
  const read = sealTruthReadFramework({
    request: buildTruthReadFrameworkRequest({ tenant_id: "tenant-alpha", now: "2026-06-20T12:06:00.000Z" }),
    storage,
    write,
    readRequest: {
      read_id: hash("event-corr-read-id"),
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
    request: buildTruthRetentionFrameworkRequest({ tenant_id: "tenant-alpha", now: "2026-06-20T12:07:00.000Z" }),
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
    request: buildTruthPersistenceCertificationRequest({ tenant_id: "tenant-alpha", now: "2026-06-20T12:08:00.000Z" }),
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

function orderedPair() {
  const base = persistenceBase();
  const common = {
    persistence: base.persistence,
    knownTenantIds: ["tenant-alpha"],
    knownMissionIds: ["mission-alpha"],
    evidenceCatalog: [evidenceRef("evidence-alpha"), evidenceRef("evidence-beta")],
    replayCatalog: [replayRef("replay-alpha"), replayRef("replay-beta")],
    accessTenantId: "tenant-alpha",
  };
  const firstRecorder = sealTruthEventRecorderFramework({
    request: buildTruthEventRecorderRequest({ tenant_id: "tenant-alpha", now: "2026-06-20T12:09:00.000Z" }),
    recorderKind: "SYSTEM",
    rawEvent: {
      missionId: "mission-alpha",
      truthRecordId: base.truthRecord.record.truth_record_id,
      eventType: "STATE_TRANSITIONED",
      payload: { state: true },
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
    ...common,
  });
  const secondRecorder = sealTruthEventRecorderFramework({
    request: buildTruthEventRecorderRequest({ tenant_id: "tenant-alpha", now: "2026-06-20T12:09:10.000Z" }),
    recorderKind: "SYSTEM",
    rawEvent: {
      missionId: "mission-alpha",
      truthRecordId: base.truthRecord.record.truth_record_id,
      eventType: "CERTIFICATION_COMPLETED",
      payload: { certified: true },
      payloadType: "certification",
      payloadVersion: "v1",
      evidenceReferenceIds: ["evidence-alpha"],
      replayReferenceIds: ["replay-alpha"],
      systemSource: "CERTIFICATION_ENGINE",
      componentId: "cert-engine",
      operation: "certify",
      operationResult: "success",
      eventTimestamp: "2026-06-20T12:08:40.000Z",
    },
    priorRecordings: [firstRecorder.ledgerEntry],
    ...common,
  });
  const firstOrdering = sealTruthEventOrderingFramework({
    request: buildTruthEventOrderingRequest({ tenant_id: "tenant-alpha", now: "2026-06-20T12:10:00.000Z" }),
    persistence: base.persistence,
    recorder: firstRecorder,
    accessTenantId: "tenant-alpha",
  });
  const secondOrdering = sealTruthEventOrderingFramework({
    request: buildTruthEventOrderingRequest({ tenant_id: "tenant-alpha", now: "2026-06-20T12:10:10.000Z" }),
    persistence: base.persistence,
    recorder: secondRecorder,
    priorOrderings: [firstOrdering.ledgerEntry],
    accessTenantId: "tenant-alpha",
  });
  return { base, firstOrdering, secondOrdering };
}

describe("eventCorrelationEngine", () => {
  it("links related events, same lineage events, same evidence events, and assigns confidence", () => {
    const { base, firstOrdering, secondOrdering } = orderedPair();
    const related = sealTruthEventCorrelationFramework({
      request: buildTruthEventCorrelationRequest({ tenant_id: "tenant-alpha", now: "2026-06-20T12:11:00.000Z" }),
      persistence: base.persistence,
      sourceOrdering: firstOrdering,
      targetOrdering: secondOrdering,
      knownEventIds: [firstOrdering.ordering.event_id, secondOrdering.ordering.event_id],
      confidenceRationale: "shared truth, lineage, evidence, and replay",
      accessTenantId: "tenant-alpha",
    });

    expect(["RELATED_TO", "SAME_LINEAGE", "SAME_EVIDENCE", "RESULTED_IN"]).toContain(related.correlation.correlation_type);
    expect(["HIGH", "CERTAIN"]).toContain(related.correlation.correlation_confidence);
    expect(related.certification).toBe("PASS");
  });

  it("creates a causal chain with root and downstream event", () => {
    const { base, firstOrdering, secondOrdering } = orderedPair();
    const chain = sealTruthEventCorrelationFramework({
      request: buildTruthEventCorrelationRequest({ tenant_id: "tenant-alpha", now: "2026-06-20T12:11:00.000Z" }),
      persistence: base.persistence,
      sourceOrdering: firstOrdering,
      targetOrdering: secondOrdering,
      correlationType: "RESULTED_IN",
      knownEventIds: [firstOrdering.ordering.event_id, secondOrdering.ordering.event_id],
      confidenceRationale: "certification followed transition",
      accessTenantId: "tenant-alpha",
    });

    expect(chain.causalChain.root_event_id).toBe(firstOrdering.ordering.event_id);
    expect(chain.queries.downstream_effects_by_event_id).toContain(secondOrdering.ordering.event_id);
  });

  it("fails unknown source or target event", () => {
    const { base, firstOrdering, secondOrdering } = orderedPair();
    const unknownSource = sealTruthEventCorrelationFramework({
      request: buildTruthEventCorrelationRequest({ tenant_id: "tenant-alpha", now: "2026-06-20T12:11:00.000Z" }),
      persistence: base.persistence,
      sourceOrdering: firstOrdering,
      targetOrdering: secondOrdering,
      knownEventIds: [secondOrdering.ordering.event_id],
      confidenceRationale: "known target only",
      accessTenantId: "tenant-alpha",
    });
    const unknownTarget = sealTruthEventCorrelationFramework({
      request: buildTruthEventCorrelationRequest({ tenant_id: "tenant-alpha", now: "2026-06-20T12:11:00.000Z" }),
      persistence: base.persistence,
      sourceOrdering: firstOrdering,
      targetOrdering: secondOrdering,
      knownEventIds: [firstOrdering.ordering.event_id],
      confidenceRationale: "known source only",
      accessTenantId: "tenant-alpha",
    });

    expect(unknownSource.validation.reasonCodes).toContain("SOURCE_EVENT_UNKNOWN");
    expect(unknownTarget.validation.reasonCodes).toContain("TARGET_EVENT_UNKNOWN");
  });

  it("fails invalid relationship type and invalid causal direction", () => {
    const { base, firstOrdering, secondOrdering } = orderedPair();
    const invalidType = sealTruthEventCorrelationFramework({
      request: buildTruthEventCorrelationRequest({ tenant_id: "tenant-alpha", now: "2026-06-20T12:11:00.000Z" }),
      persistence: base.persistence,
      sourceOrdering: firstOrdering,
      targetOrdering: secondOrdering,
      correlationType: "BAD_RELATION" as never,
      knownEventIds: [firstOrdering.ordering.event_id, secondOrdering.ordering.event_id],
      confidenceRationale: "bad type",
      accessTenantId: "tenant-alpha",
    });
    const invalidDirection = sealTruthEventCorrelationFramework({
      request: buildTruthEventCorrelationRequest({ tenant_id: "tenant-alpha", now: "2026-06-20T12:11:00.000Z" }),
      persistence: base.persistence,
      sourceOrdering: secondOrdering,
      targetOrdering: firstOrdering,
      correlationType: "RESULTED_IN",
      knownEventIds: [firstOrdering.ordering.event_id, secondOrdering.ordering.event_id],
      confidenceRationale: "reversed direction",
      invalidCausalDirectionDetected: true,
      accessTenantId: "tenant-alpha",
    });

    expect(invalidType.validation.reasonCodes).toContain("CORRELATION_TYPE_INVALID");
    expect(invalidDirection.validation.reasonCodes).toContain("CAUSAL_DIRECTION_INVALID");
  });

  it("detects causal cycle and broken causal chain", () => {
    const { base, firstOrdering, secondOrdering } = orderedPair();
    const cycle = sealTruthEventCorrelationFramework({
      request: buildTruthEventCorrelationRequest({ tenant_id: "tenant-alpha", now: "2026-06-20T12:11:00.000Z" }),
      persistence: base.persistence,
      sourceOrdering: firstOrdering,
      targetOrdering: secondOrdering,
      knownEventIds: [firstOrdering.ordering.event_id, secondOrdering.ordering.event_id],
      confidenceRationale: "cycle",
      causalCycleDetected: true,
      accessTenantId: "tenant-alpha",
    });
    const broken = sealTruthEventCorrelationFramework({
      request: buildTruthEventCorrelationRequest({ tenant_id: "tenant-alpha", now: "2026-06-20T12:11:00.000Z" }),
      persistence: base.persistence,
      sourceOrdering: firstOrdering,
      targetOrdering: secondOrdering,
      knownEventIds: [firstOrdering.ordering.event_id, secondOrdering.ordering.event_id],
      confidenceRationale: "broken",
      brokenCausalChainDetected: true,
      accessTenantId: "tenant-alpha",
    });

    expect(cycle.validation.reasonCodes).toContain("CAUSAL_CYCLE_DETECTED");
    expect(broken.validation.reasonCodes).toContain("CAUSAL_CHAIN_BROKEN");
  });

  it("blocks cross-tenant correlation and cross-tenant causal chain", () => {
    const { base, firstOrdering, secondOrdering } = orderedPair();
    const crossTenant = sealTruthEventCorrelationFramework({
      request: buildTruthEventCorrelationRequest({ tenant_id: "tenant-alpha", now: "2026-06-20T12:11:00.000Z" }),
      persistence: base.persistence,
      sourceOrdering: firstOrdering,
      targetOrdering: secondOrdering,
      knownEventIds: [firstOrdering.ordering.event_id, secondOrdering.ordering.event_id],
      confidenceRationale: "cross tenant",
      crossTenantCorrelationDetected: true,
      accessTenantId: "tenant-alpha",
    });
    const crossChain = sealTruthEventCorrelationFramework({
      request: buildTruthEventCorrelationRequest({ tenant_id: "tenant-alpha", now: "2026-06-20T12:11:00.000Z" }),
      persistence: base.persistence,
      sourceOrdering: firstOrdering,
      targetOrdering: secondOrdering,
      knownEventIds: [firstOrdering.ordering.event_id, secondOrdering.ordering.event_id],
      confidenceRationale: "cross chain",
      crossTenantCausalChainDetected: true,
      accessTenantId: "tenant-alpha",
    });

    expect(crossTenant.validation.reasonCodes).toContain("TENANT_ISOLATION_FAILED");
    expect(crossChain.validation.reasonCodes).toContain("TENANT_ISOLATION_FAILED");
  });

  it("fails missing confidence rationale and reproduces replay mismatch", () => {
    const { base, firstOrdering, secondOrdering } = orderedPair();
    const missingRationale = sealTruthEventCorrelationFramework({
      request: buildTruthEventCorrelationRequest({ tenant_id: "tenant-alpha", now: "2026-06-20T12:11:00.000Z" }),
      persistence: base.persistence,
      sourceOrdering: firstOrdering,
      targetOrdering: secondOrdering,
      knownEventIds: [firstOrdering.ordering.event_id, secondOrdering.ordering.event_id],
      missingConfidenceRationale: true,
      accessTenantId: "tenant-alpha",
    });
    const replayMismatch = sealTruthEventCorrelationFramework({
      request: buildTruthEventCorrelationRequest({ tenant_id: "tenant-alpha", now: "2026-06-20T12:11:00.000Z" }),
      persistence: base.persistence,
      sourceOrdering: firstOrdering,
      targetOrdering: secondOrdering,
      knownEventIds: [firstOrdering.ordering.event_id, secondOrdering.ordering.event_id],
      confidenceRationale: "replay mismatch",
      replayMismatchDetected: true,
      accessTenantId: "tenant-alpha",
    });

    expect(missingRationale.validation.reasonCodes).toContain("CONFIDENCE_RATIONALE_MISSING");
    expect(replayMismatch.replay.replayResult).toBe("MISMATCH");
  });
});
