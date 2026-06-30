import { describe, expect, it } from "vitest";
import {
  buildTruthClassificationSystemRequest,
  buildTruthEventCertificationRequest,
  buildTruthEventCorrelationRequest,
  buildTruthEventOrderingRequest,
  buildTruthEventRecorderRequest,
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
  sealTruthEventCertificationGate,
  sealTruthEventCorrelationFramework,
  sealTruthEventFramework,
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
    truth_record_id: hash("event-cert-truth-record"),
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
      truth_record_id: hash("event-cert-truth-record"),
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
    lineage_root_id: hash("event-cert-lineage-root"),
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
    adapter_id: "sqlite-event-cert",
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

function fullEventStack() {
  const record = sealTruthRecordContract(truthRecordInput());
  const classification = sealTruthClassificationSystem({
    request: buildTruthClassificationSystemRequest({ tenant_id: "tenant-alpha", now: "2026-06-20T12:01:00.000Z" }),
    truthRecord: record,
    requestedClassifications: ["DECISION"],
    details: { decision_authority: "CERTIFICATION_ENGINE", decision_rationale: "Approved recommendation", decision_outcome: "RECOMMENDATION_APPROVED" },
    evidenceCatalog: [evidenceRef("evidence-alpha")],
    replayCatalog: [replayRef("replay-alpha")],
    accessTenantId: "tenant-alpha",
  });
  const rootId = hash("event-cert-lineage-root");
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
      write_id: hash("event-cert-write-id"),
      tenant_id: "tenant-alpha",
      mission_id: "mission-alpha",
      truth_record_id: record.record.truth_record_id,
      write_type: "APPEND_TRUTH_EVENT",
      write_source: "CERTIFICATION_ENGINE",
      write_timestamp: "2026-06-20T12:05:00.000Z",
      write_payload: { recorded: true },
      evidence_references: ["evidence-alpha"],
      replay_references: ["replay-alpha"],
      idempotency_key: "event-cert-idem",
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
      read_id: hash("event-cert-read-id"),
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
  const eventContract = sealTruthEventFramework({
    request: buildTruthEventFrameworkRequest({ tenant_id: "tenant-alpha", now: "2026-06-20T12:09:00.000Z" }),
    persistence,
    missionId: "mission-alpha",
    truthRecordId: record.record.truth_record_id,
    eventType: "TRUTH_VERIFIED",
    eventCategory: "TRUTH",
    eventSource: "WRITE_ENGINE",
    eventPayload: { verified: true },
    payloadType: "truth_verification",
    payloadVersion: "v1",
    evidenceReferenceIds: ["evidence-alpha"],
    replayReferenceIds: ["replay-alpha"],
  });
  const eventRecorder = sealTruthEventRecorderFramework({
    request: buildTruthEventRecorderRequest({ tenant_id: "tenant-alpha", now: "2026-06-20T12:09:10.000Z" }),
    persistence,
    recorderKind: "SYSTEM",
    knownTenantIds: ["tenant-alpha"],
    knownMissionIds: ["mission-alpha"],
    evidenceCatalog: [evidenceRef("evidence-alpha")],
    replayCatalog: [replayRef("replay-alpha")],
    accessTenantId: "tenant-alpha",
    rawEvent: {
      missionId: "mission-alpha",
      truthRecordId: record.record.truth_record_id,
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
  });
  const eventOrdering = sealTruthEventOrderingFramework({
    request: buildTruthEventOrderingRequest({ tenant_id: "tenant-alpha", now: "2026-06-20T12:10:00.000Z" }),
    persistence,
    recorder: eventRecorder,
    accessTenantId: "tenant-alpha",
  });
  const eventCorrelation = sealTruthEventCorrelationFramework({
    request: buildTruthEventCorrelationRequest({ tenant_id: "tenant-alpha", now: "2026-06-20T12:11:00.000Z" }),
    persistence,
    sourceOrdering: eventOrdering,
    targetOrdering: eventOrdering,
    knownEventIds: [eventOrdering.ordering.event_id],
    confidenceRationale: "self correlation for certification fixture",
    accessTenantId: "tenant-alpha",
  });

  return { persistence, eventContract, eventRecorder, eventOrdering, eventCorrelation };
}

describe("eventCertificationGate", () => {
  it("passes when all event infrastructure domains pass", () => {
    const base = fullEventStack();
    const result = sealTruthEventCertificationGate({
      request: buildTruthEventCertificationRequest({ tenant_id: "tenant-alpha", now: "2026-06-20T12:12:00.000Z" }),
      ...base,
      certificationAuthority: "CERTIFICATION_ENGINE",
      certificationReason: "Event infrastructure ready",
    });

    expect(result.certification.certification_state).toBe("PASS");
    expect(result.completionGate).toBe("EVENT_INFRASTRUCTURE_CERTIFIED");
    expect(result.replay.replayResult).toBe("REPRODUCED");
  });

  it("fails when evidence or replay references are missing", () => {
    const base = fullEventStack();
    const missingEvidence = sealTruthEventCertificationGate({
      request: buildTruthEventCertificationRequest({ tenant_id: "tenant-alpha", now: "2026-06-20T12:12:00.000Z" }),
      ...base,
      certificationAuthority: "CERTIFICATION_ENGINE",
      certificationReason: "Missing evidence",
      evidenceReferences: [],
    });
    const missingReplay = sealTruthEventCertificationGate({
      request: buildTruthEventCertificationRequest({ tenant_id: "tenant-alpha", now: "2026-06-20T12:12:00.000Z" }),
      ...base,
      certificationAuthority: "CERTIFICATION_ENGINE",
      certificationReason: "Missing replay",
      replayReferences: [],
    });

    expect(missingEvidence.validation.reasonCodes).toContain("EVIDENCE_REFERENCES_MISSING");
    expect(missingReplay.validation.reasonCodes).toContain("REPLAY_REFERENCES_MISSING");
  });

  it("fails duplicate event identity, partial commit, sequence drift, and causal cycle via domain failures", () => {
    const base = fullEventStack();
    const contractFail = sealTruthEventCertificationGate({
      request: buildTruthEventCertificationRequest({ tenant_id: "tenant-alpha", now: "2026-06-20T12:12:00.000Z" }),
      ...base,
      eventContract: { ...base.eventContract, certification: "FAIL" },
      certificationAuthority: "CERTIFICATION_ENGINE",
      certificationReason: "Contract failure",
    });
    const recorderFail = sealTruthEventCertificationGate({
      request: buildTruthEventCertificationRequest({ tenant_id: "tenant-alpha", now: "2026-06-20T12:12:00.000Z" }),
      ...base,
      eventRecorder: { ...base.eventRecorder, certification: "FAIL" },
      certificationAuthority: "CERTIFICATION_ENGINE",
      certificationReason: "Recorder failure",
    });
    const orderingFail = sealTruthEventCertificationGate({
      request: buildTruthEventCertificationRequest({ tenant_id: "tenant-alpha", now: "2026-06-20T12:12:00.000Z" }),
      ...base,
      eventOrdering: { ...base.eventOrdering, certification: "FAIL" },
      certificationAuthority: "CERTIFICATION_ENGINE",
      certificationReason: "Ordering failure",
    });
    const correlationFail = sealTruthEventCertificationGate({
      request: buildTruthEventCertificationRequest({ tenant_id: "tenant-alpha", now: "2026-06-20T12:12:00.000Z" }),
      ...base,
      eventCorrelation: { ...base.eventCorrelation, certification: "FAIL" },
      certificationAuthority: "CERTIFICATION_ENGINE",
      certificationReason: "Correlation failure",
    });

    expect(contractFail.validation.reasonCodes).toContain("EVENT_CONTRACT_FAILED");
    expect(recorderFail.validation.reasonCodes).toContain("EVENT_RECORDER_FAILED");
    expect(orderingFail.validation.reasonCodes).toContain("EVENT_ORDERING_FAILED");
    expect(correlationFail.validation.reasonCodes).toContain("EVENT_CORRELATION_FAILED");
  });

  it("fails replay mismatch and cross-tenant correlation through aggregate checks", () => {
    const base = fullEventStack();
    const replayFail = sealTruthEventCertificationGate({
      request: buildTruthEventCertificationRequest({ tenant_id: "tenant-alpha", now: "2026-06-20T12:12:00.000Z" }),
      ...base,
      eventCorrelation: { ...base.eventCorrelation, replay: { ...base.eventCorrelation.replay, replayResult: "MISMATCH" }, certification: "FAIL" },
      certificationAuthority: "CERTIFICATION_ENGINE",
      certificationReason: "Replay mismatch",
    });
    const tenantFail = sealTruthEventCertificationGate({
      request: buildTruthEventCertificationRequest({ tenant_id: "tenant-alpha", now: "2026-06-20T12:12:00.000Z" }),
      ...base,
      eventCorrelation: { ...base.eventCorrelation, visibility: { ...base.eventCorrelation.visibility, tenantScoped: false }, certification: "FAIL" },
      certificationAuthority: "CERTIFICATION_ENGINE",
      certificationReason: "Cross tenant correlation",
    });

    expect(replayFail.validation.reasonCodes).toContain("EVENT_REPLAY_FAILED");
    expect(tenantFail.validation.reasonCodes).toContain("TENANT_ISOLATION_FAILED");
  });

  it("fails governance bypass and hidden failure", () => {
    const base = fullEventStack();
    const governanceFail = sealTruthEventCertificationGate({
      request: buildTruthEventCertificationRequest({ tenant_id: "tenant-alpha", now: "2026-06-20T12:12:00.000Z" }),
      ...base,
      certificationAuthority: "CERTIFICATION_ENGINE",
      certificationReason: "Governance bypass",
      governanceBypassDetected: true,
    });
    const hiddenFail = sealTruthEventCertificationGate({
      request: buildTruthEventCertificationRequest({ tenant_id: "tenant-alpha", now: "2026-06-20T12:12:00.000Z" }),
      ...base,
      certificationAuthority: "CERTIFICATION_ENGINE",
      certificationReason: "Hidden failure",
      hiddenFailureDetected: true,
    });

    expect(governanceFail.validation.reasonCodes).toContain("GOVERNANCE_FAILED");
    expect(hiddenFail.validation.reasonCodes).toContain("VISIBILITY_FAILED");
  });

  it("allows conditional pass for non-critical observability and analytics gaps with remediation and governance approval", () => {
    const base = fullEventStack();
    const conditional = sealTruthEventCertificationGate({
      request: buildTruthEventCertificationRequest({ tenant_id: "tenant-alpha", now: "2026-06-20T12:12:00.000Z" }),
      ...base,
      certificationAuthority: "CERTIFICATION_ENGINE",
      certificationReason: "Conditional readiness",
      observabilityGapDetected: true,
      analyticsGapDetected: true,
      remediationPlanExists: true,
      governanceApproved: true,
    });

    expect(conditional.certification.certification_state).toBe("CONDITIONAL_PASS");
    expect(conditional.completionGate).toBe("EVENT_INFRASTRUCTURE_CONDITIONAL");
  });
});
