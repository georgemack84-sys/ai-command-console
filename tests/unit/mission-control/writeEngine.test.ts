import { describe, expect, it } from "vitest";
import {
  buildTruthClassificationSystemRequest,
  buildTruthFoundationCertificationRequest,
  buildTruthIdentityFrameworkRequest,
  buildTruthRecordContractRequest,
  buildTruthStateFrameworkRequest,
  buildTruthStorageFrameworkRequest,
  buildTruthWriteFrameworkRequest,
  sealTruthClassificationSystem,
  sealTruthFoundationCertificationGate,
  sealTruthIdentityFramework,
  sealTruthRecordContract,
  sealTruthStateFramework,
  sealTruthStorageFramework,
  sealTruthWriteFramework,
  type TruthCatalogReference,
  type TruthIdentityNodeReference,
  type TruthRecord,
  type TruthRecordContractInput,
  type TruthStorageAdapterRegistryEntry,
  type TruthWriteRequest,
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
    truth_record_id: hash("write-truth-record"),
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
      truth_record_id: hash("write-truth-record"),
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
    lineage_root_id: hash("write-lineage-root"),
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
  const rootId = hash("write-lineage-root");
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
  return { truthRecord, classification, identity, state, foundationCertification, storage };
}

function writeRequest(overrides: Partial<TruthWriteRequest> = {}): TruthWriteRequest {
  return {
    write_id: hash("write-id-alpha"),
    tenant_id: "tenant-alpha",
    mission_id: "mission-alpha",
    truth_record_id: hash("write-truth-record"),
    write_type: "APPEND_TRUTH_EVENT",
    write_source: "CERTIFICATION_ENGINE",
    write_timestamp: "2026-06-19T12:05:00.000Z",
    write_payload: { event_type: "RECOMMENDATION_APPROVED", valid: true },
    evidence_references: ["evidence-alpha"],
    replay_references: ["replay-alpha"],
    idempotency_key: "idem-alpha",
    schema_version: "truth-storage/v1",
    ...overrides,
  };
}

describe("writeEngine", () => {
  it("passes a valid write deterministically", () => {
    const base = foundation();
    const first = sealTruthWriteFramework({
      request: buildTruthWriteFrameworkRequest({
        tenant_id: "tenant-alpha",
        now: "2026-06-19T12:05:00.000Z",
      }),
      storage: base.storage,
      writeRequest: writeRequest(),
      knownTenantIds: ["tenant-alpha"],
      knownMissionIds: ["mission-alpha"],
    });
    const second = sealTruthWriteFramework({
      request: buildTruthWriteFrameworkRequest({
        tenant_id: "tenant-alpha",
        now: "2026-06-19T12:05:00.000Z",
      }),
      storage: base.storage,
      writeRequest: writeRequest(),
      knownTenantIds: ["tenant-alpha"],
      knownMissionIds: ["mission-alpha"],
    });

    expect(first).toEqual(second);
    expect(first.certification).toBe("PASS");
    expect(first.ledgerEntry.write_result).toBe("COMMITTED");
    expect(first.replay.replayResult).toBe("REPRODUCED");
  });

  it("passes an append-only state transition write", () => {
    const base = foundation();
    const sealed = sealTruthWriteFramework({
      request: buildTruthWriteFrameworkRequest({
        tenant_id: "tenant-alpha",
        now: "2026-06-19T12:05:00.000Z",
      }),
      storage: base.storage,
      writeRequest: writeRequest({
        write_type: "APPEND_STATE_TRANSITION",
        write_payload: { from: "CREATED", to: "VERIFIED" },
      }),
      knownTenantIds: ["tenant-alpha"],
      knownMissionIds: ["mission-alpha"],
    });

    expect(sealed.validation.validationState).toBe("VALID");
  });

  it("blocks mutation, delete, and invalid payload attempts", () => {
    const base = foundation();
    const mutation = sealTruthWriteFramework({
      request: buildTruthWriteFrameworkRequest({ tenant_id: "tenant-alpha", now: "2026-06-19T12:05:00.000Z" }),
      storage: base.storage,
      writeRequest: writeRequest(),
      knownTenantIds: ["tenant-alpha"],
      knownMissionIds: ["mission-alpha"],
      mutationAttempted: true,
    });
    const deletion = sealTruthWriteFramework({
      request: buildTruthWriteFrameworkRequest({ tenant_id: "tenant-alpha", now: "2026-06-19T12:05:00.000Z" }),
      storage: base.storage,
      writeRequest: writeRequest(),
      knownTenantIds: ["tenant-alpha"],
      knownMissionIds: ["mission-alpha"],
      deleteAttempted: true,
    });
    const invalidPayload = sealTruthWriteFramework({
      request: buildTruthWriteFrameworkRequest({ tenant_id: "tenant-alpha", now: "2026-06-19T12:05:00.000Z" }),
      storage: base.storage,
      writeRequest: writeRequest({ write_payload: {} }),
      knownTenantIds: ["tenant-alpha"],
      knownMissionIds: ["mission-alpha"],
      payloadSchemaValid: false,
    });

    expect(mutation.validation.reasonCodes).toContain("MUTATION_ATTEMPT_DETECTED");
    expect(deletion.validation.reasonCodes).toContain("DELETE_ATTEMPT_DETECTED");
    expect(invalidPayload.validation.reasonCodes).toContain("WRITE_PAYLOAD_INVALID");
  });

  it("fails invalid evidence, replay, state transition, and identity relationship writes", () => {
    const base = foundation();
    const evidence = sealTruthWriteFramework({
      request: buildTruthWriteFrameworkRequest({ tenant_id: "tenant-alpha", now: "2026-06-19T12:05:00.000Z" }),
      storage: base.storage,
      writeRequest: writeRequest(),
      knownTenantIds: ["tenant-alpha"],
      knownMissionIds: ["mission-alpha"],
      evidenceReferencesValid: false,
    });
    const replay = sealTruthWriteFramework({
      request: buildTruthWriteFrameworkRequest({ tenant_id: "tenant-alpha", now: "2026-06-19T12:05:00.000Z" }),
      storage: base.storage,
      writeRequest: writeRequest(),
      knownTenantIds: ["tenant-alpha"],
      knownMissionIds: ["mission-alpha"],
      replayReferencesValid: false,
    });
    const stateTransition = sealTruthWriteFramework({
      request: buildTruthWriteFrameworkRequest({ tenant_id: "tenant-alpha", now: "2026-06-19T12:05:00.000Z" }),
      storage: base.storage,
      writeRequest: writeRequest({ write_type: "APPEND_STATE_TRANSITION" }),
      knownTenantIds: ["tenant-alpha"],
      knownMissionIds: ["mission-alpha"],
      stateTransitionLegal: false,
    });
    const identity = sealTruthWriteFramework({
      request: buildTruthWriteFrameworkRequest({ tenant_id: "tenant-alpha", now: "2026-06-19T12:05:00.000Z" }),
      storage: base.storage,
      writeRequest: writeRequest({ write_type: "APPEND_IDENTITY_RELATIONSHIP" }),
      knownTenantIds: ["tenant-alpha"],
      knownMissionIds: ["mission-alpha"],
      identityRelationshipValid: false,
    });

    expect(evidence.validation.reasonCodes).toContain("EVIDENCE_REFERENCES_INVALID");
    expect(replay.validation.reasonCodes).toContain("REPLAY_REFERENCES_INVALID");
    expect(stateTransition.validation.reasonCodes).toContain("STATE_TRANSITION_INVALID");
    expect(identity.validation.reasonCodes).toContain("IDENTITY_RELATIONSHIP_INVALID");
  });

  it("protects transaction rollback and cross-tenant writes", () => {
    const base = foundation();
    const partialWrite = sealTruthWriteFramework({
      request: buildTruthWriteFrameworkRequest({ tenant_id: "tenant-alpha", now: "2026-06-19T12:05:00.000Z" }),
      storage: base.storage,
      writeRequest: writeRequest(),
      knownTenantIds: ["tenant-alpha"],
      knownMissionIds: ["mission-alpha"],
      partialWriteDetected: true,
    });
    const rollbackFailure = sealTruthWriteFramework({
      request: buildTruthWriteFrameworkRequest({ tenant_id: "tenant-alpha", now: "2026-06-19T12:05:00.000Z" }),
      storage: base.storage,
      writeRequest: writeRequest(),
      knownTenantIds: ["tenant-alpha"],
      knownMissionIds: ["mission-alpha"],
      rollbackFailed: true,
    });
    const crossTenant = sealTruthWriteFramework({
      request: buildTruthWriteFrameworkRequest({ tenant_id: "tenant-alpha", now: "2026-06-19T12:05:00.000Z" }),
      storage: base.storage,
      writeRequest: writeRequest({ tenant_id: "tenant-beta" }),
      knownTenantIds: ["tenant-alpha", "tenant-beta"],
      knownMissionIds: ["mission-alpha"],
      accessTenantId: "tenant-beta",
      crossTenantEvidenceDetected: true,
    });

    expect(partialWrite.validation.reasonCodes).toContain("PARTIAL_WRITE_DETECTED");
    expect(rollbackFailure.validation.reasonCodes).toContain("ROLLBACK_FAILED");
    expect(crossTenant.validation.reasonCodes).toContain("TENANT_ISOLATION_FAILED");
  });

  it("enforces idempotency and deterministic ordering", () => {
    const base = foundation();
    const reused = sealTruthWriteFramework({
      request: buildTruthWriteFrameworkRequest({ tenant_id: "tenant-alpha", now: "2026-06-19T12:05:00.000Z" }),
      storage: base.storage,
      writeRequest: writeRequest(),
      knownTenantIds: ["tenant-alpha"],
      knownMissionIds: ["mission-alpha"],
      idempotencyKeySeen: true,
      idempotencyPayloadMatches: true,
    });
    const idempotencyConflict = sealTruthWriteFramework({
      request: buildTruthWriteFrameworkRequest({ tenant_id: "tenant-alpha", now: "2026-06-19T12:05:00.000Z" }),
      storage: base.storage,
      writeRequest: writeRequest(),
      knownTenantIds: ["tenant-alpha"],
      knownMissionIds: ["mission-alpha"],
      idempotencyKeySeen: true,
      idempotencyPayloadMatches: false,
    });
    const duplicateSequence = sealTruthWriteFramework({
      request: buildTruthWriteFrameworkRequest({ tenant_id: "tenant-alpha", now: "2026-06-19T12:05:00.000Z" }),
      storage: base.storage,
      writeRequest: writeRequest(),
      knownTenantIds: ["tenant-alpha"],
      knownMissionIds: ["mission-alpha"],
      duplicateSequenceDetected: true,
    });

    expect(reused.ledgerEntry.write_result).toBe("REUSED");
    expect(idempotencyConflict.validation.reasonCodes).toContain("IDEMPOTENCY_CONFLICT");
    expect(duplicateSequence.validation.reasonCodes).toContain("ORDERING_DUPLICATE_SEQUENCE");
  });

  it("fails replay mismatch and supports conditional certification for non-critical gaps", () => {
    const base = foundation();
    const mismatch = sealTruthWriteFramework({
      request: buildTruthWriteFrameworkRequest({ tenant_id: "tenant-alpha", now: "2026-06-19T12:05:00.000Z" }),
      storage: base.storage,
      writeRequest: writeRequest(),
      knownTenantIds: ["tenant-alpha"],
      knownMissionIds: ["mission-alpha"],
      replayMismatchDetected: true,
    });
    const conditional = sealTruthWriteFramework({
      request: buildTruthWriteFrameworkRequest({ tenant_id: "tenant-alpha", now: "2026-06-19T12:05:00.000Z" }),
      storage: base.storage,
      writeRequest: writeRequest(),
      knownTenantIds: ["tenant-alpha"],
      knownMissionIds: ["mission-alpha"],
      observabilityGapDetected: true,
      metricsLimitationDetected: true,
      remediationDocumented: true,
    });

    expect(mismatch.replay.replayResult).toBe("MISMATCH");
    expect(conditional.certification).toBe("CONDITIONAL_PASS");
  });

  it("blocks execution, approval, ranking, prioritization, scoring, resource allocation, and authority expansion", () => {
    const base = foundation();
    const common = {
      request: buildTruthWriteFrameworkRequest({ tenant_id: "tenant-alpha", now: "2026-06-19T12:05:00.000Z" }),
      storage: base.storage,
      writeRequest: writeRequest(),
      knownTenantIds: ["tenant-alpha"],
      knownMissionIds: ["mission-alpha"],
    };

    expect(sealTruthWriteFramework({ ...common, executionRequested: true }).validation.reasonCodes).toContain("EXECUTION_REQUEST_BLOCKED");
    expect(sealTruthWriteFramework({ ...common, approvalRequested: true }).validation.reasonCodes).toContain("APPROVAL_DETECTED");
    expect(sealTruthWriteFramework({ ...common, rankingRequested: true }).validation.reasonCodes).toContain("RANKING_DETECTED");
    expect(sealTruthWriteFramework({ ...common, prioritizationRequested: true }).validation.reasonCodes).toContain("PRIORITIZATION_DETECTED");
    expect(sealTruthWriteFramework({ ...common, scoringRequested: true }).validation.reasonCodes).toContain("SCORING_DETECTED");
    expect(sealTruthWriteFramework({ ...common, resourceAllocationRequested: true }).validation.reasonCodes).toContain("RESOURCE_ALLOCATION_DETECTED");
    expect(sealTruthWriteFramework({ ...common, authorityExpansionDetected: true }).validation.reasonCodes).toContain("AUTHORITY_EXPANSION_DETECTED");
  });
});
