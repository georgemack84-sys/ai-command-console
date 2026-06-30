import { describe, expect, it } from "vitest";
import {
  buildTruthClassificationSystemRequest,
  buildTruthFoundationCertificationRequest,
  buildTruthIdentityFrameworkRequest,
  buildTruthReadFrameworkRequest,
  buildTruthRecordContractRequest,
  buildTruthRetentionFrameworkRequest,
  buildTruthStateFrameworkRequest,
  buildTruthStorageFrameworkRequest,
  buildTruthWriteFrameworkRequest,
  sealTruthClassificationSystem,
  sealTruthFoundationCertificationGate,
  sealTruthIdentityFramework,
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
    truth_record_id: hash("retention-truth-record"),
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
      truth_record_id: hash("retention-truth-record"),
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
    lineage_root_id: hash("retention-lineage-root"),
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
  const rootId = hash("retention-lineage-root");
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
      write_id: hash("retention-write-id"),
      tenant_id: "tenant-alpha",
      mission_id: "mission-alpha",
      truth_record_id: truthRecord.record.truth_record_id,
      write_type: "APPEND_TRUTH_EVENT",
      write_source: "CERTIFICATION_ENGINE",
      write_timestamp: "2026-06-19T12:05:00.000Z",
      write_payload: { event_type: "RECOMMENDATION_APPROVED", valid: true },
      evidence_references: ["evidence-alpha"],
      replay_references: ["replay-alpha"],
      idempotency_key: "retention-idem",
      schema_version: "truth-storage/v1",
    },
    knownTenantIds: ["tenant-alpha"],
    knownMissionIds: ["mission-alpha"],
  });
  const read = sealTruthReadFramework({
    request: buildTruthReadFrameworkRequest({
      tenant_id: "tenant-alpha",
      now: "2026-06-19T12:06:00.000Z",
    }),
    storage,
    write,
    readRequest: {
      read_id: hash("retention-read-id"),
      tenant_id: "tenant-alpha",
      mission_id: "mission-alpha",
      truth_record_id: truthRecord.record.truth_record_id,
      read_type: "DIRECT_LOOKUP",
      read_source: "OPERATOR",
      read_timestamp: "2026-06-19T12:06:00.000Z",
      query_parameters: { truth_record_id: truthRecord.record.truth_record_id },
      schema_version: "truth-storage/v1",
    },
  });
  return { storage, write, read };
}

describe("retentionManager", () => {
  it("passes with a valid retention policy and active state", () => {
    const base = foundation();
    const first = sealTruthRetentionFramework({
      request: buildTruthRetentionFrameworkRequest({
        tenant_id: "tenant-alpha",
        now: "2026-06-19T12:07:00.000Z",
      }),
      ...base,
      retentionPolicyId: "STANDARD",
      retentionState: "ACTIVE",
      retentionExpiration: "2027-06-19T12:07:00.000Z",
      archiveEligibility: "NOT_ELIGIBLE",
      lifecycleTransitionReason: "Within active retention period",
      lifecycleState: "VERIFIED",
    });
    const second = sealTruthRetentionFramework({
      request: buildTruthRetentionFrameworkRequest({
        tenant_id: "tenant-alpha",
        now: "2026-06-19T12:07:00.000Z",
      }),
      ...base,
      retentionPolicyId: "STANDARD",
      retentionState: "ACTIVE",
      retentionExpiration: "2027-06-19T12:07:00.000Z",
      archiveEligibility: "NOT_ELIGIBLE",
      lifecycleTransitionReason: "Within active retention period",
      lifecycleState: "VERIFIED",
    });

    expect(first).toEqual(second);
    expect(first.certification).toBe("PASS");
    expect(first.replay.replayResult).toBe("REPRODUCED");
  });

  it("fails unknown policy and unknown retention state", () => {
    const base = foundation();
    const unknownPolicy = sealTruthRetentionFramework({
      request: buildTruthRetentionFrameworkRequest({ tenant_id: "tenant-alpha", now: "2026-06-19T12:07:00.000Z" }),
      ...base,
      retentionPolicyId: "UNKNOWN" as never,
      retentionState: "ACTIVE",
      retentionExpiration: "2027-06-19T12:07:00.000Z",
      archiveEligibility: "NOT_ELIGIBLE",
      lifecycleTransitionReason: "Bad policy",
    });
    const unknownState = sealTruthRetentionFramework({
      request: buildTruthRetentionFrameworkRequest({ tenant_id: "tenant-alpha", now: "2026-06-19T12:07:00.000Z" }),
      ...base,
      retentionPolicyId: "STANDARD",
      retentionState: "UNKNOWN" as never,
      retentionExpiration: "2027-06-19T12:07:00.000Z",
      archiveEligibility: "NOT_ELIGIBLE",
      lifecycleTransitionReason: "Bad state",
    });

    expect(unknownPolicy.validation.reasonCodes).toContain("RETENTION_POLICY_UNSUPPORTED");
    expect(unknownState.validation.reasonCodes).toContain("RETENTION_STATE_UNSUPPORTED");
  });

  it("passes archived and expired retention states when valid", () => {
    const base = foundation();
    const archived = sealTruthRetentionFramework({
      request: buildTruthRetentionFrameworkRequest({ tenant_id: "tenant-alpha", now: "2026-06-19T12:07:00.000Z" }),
      ...base,
      retentionPolicyId: "LONG_TERM",
      retentionState: "ARCHIVED",
      retentionExpiration: "2028-06-19T12:07:00.000Z",
      archiveEligibility: "ELIGIBLE",
      archiveExecuted: true,
      lifecycleTransitionReason: "Archive period reached",
      lifecycleState: "ARCHIVED",
    });
    const expired = sealTruthRetentionFramework({
      request: buildTruthRetentionFrameworkRequest({ tenant_id: "tenant-alpha", now: "2026-06-19T12:07:00.000Z" }),
      ...base,
      retentionPolicyId: "SHORT_TERM",
      retentionState: "EXPIRED",
      retentionExpiration: "2026-06-19T12:07:00.000Z",
      archiveEligibility: "NOT_ELIGIBLE",
      lifecycleTransitionReason: "Retention obligation completed",
      expirationStatus: "EXPIRED",
      lifecycleState: "ARCHIVED",
    });

    expect(archived.validation.validationState).toBe("VALID");
    expect(expired.validation.validationState).toBe("VALID");
  });

  it("fails archive without eligibility and archive preservation failures", () => {
    const base = foundation();
    const ineligibleArchive = sealTruthRetentionFramework({
      request: buildTruthRetentionFrameworkRequest({ tenant_id: "tenant-alpha", now: "2026-06-19T12:07:00.000Z" }),
      ...base,
      retentionPolicyId: "STANDARD",
      retentionState: "ARCHIVED",
      retentionExpiration: "2027-06-19T12:07:00.000Z",
      archiveEligibility: "NOT_ELIGIBLE",
      archiveExecuted: true,
      lifecycleTransitionReason: "Bad archive",
      lifecycleState: "ARCHIVED",
    });
    const replayFailure = sealTruthRetentionFramework({
      request: buildTruthRetentionFrameworkRequest({ tenant_id: "tenant-alpha", now: "2026-06-19T12:07:00.000Z" }),
      ...base,
      retentionPolicyId: "LONG_TERM",
      retentionState: "ARCHIVED",
      retentionExpiration: "2028-06-19T12:07:00.000Z",
      archiveEligibility: "ELIGIBLE",
      archiveExecuted: true,
      archiveReplayFailureDetected: true,
      lifecycleTransitionReason: "Archive replay failed",
      lifecycleState: "ARCHIVED",
    });

    expect(ineligibleArchive.validation.reasonCodes).toContain("ARCHIVE_EXECUTION_INVALID");
    expect(replayFailure.validation.reasonCodes).toContain("ARCHIVE_REPLAY_FAILURE");
  });

  it("enforces governance and legal holds against expiration", () => {
    const base = foundation();
    const governanceHold = sealTruthRetentionFramework({
      request: buildTruthRetentionFrameworkRequest({ tenant_id: "tenant-alpha", now: "2026-06-19T12:07:00.000Z" }),
      ...base,
      retentionPolicyId: "STANDARD",
      retentionState: "RESTRICTED",
      retentionExpiration: "2026-06-19T12:07:00.000Z",
      archiveEligibility: "RESTRICTED",
      lifecycleTransitionReason: "Governance hold active",
      governanceRestricted: true,
      expirationStatus: "HELD",
      lifecycleState: "RESTRICTED",
    });
    const illegalExpiration = sealTruthRetentionFramework({
      request: buildTruthRetentionFrameworkRequest({ tenant_id: "tenant-alpha", now: "2026-06-19T12:07:00.000Z" }),
      ...base,
      retentionPolicyId: "STANDARD",
      retentionState: "EXPIRED",
      retentionExpiration: "2026-06-19T12:07:00.000Z",
      archiveEligibility: "NOT_ELIGIBLE",
      lifecycleTransitionReason: "Expired despite hold",
      governanceRestricted: true,
      expirationStatus: "EXPIRED",
      lifecycleState: "ARCHIVED",
    });
    const legalHoldViolation = sealTruthRetentionFramework({
      request: buildTruthRetentionFrameworkRequest({ tenant_id: "tenant-alpha", now: "2026-06-19T12:07:00.000Z" }),
      ...base,
      retentionPolicyId: "STANDARD",
      retentionState: "EXPIRED",
      retentionExpiration: "2026-06-19T12:07:00.000Z",
      archiveEligibility: "NOT_ELIGIBLE",
      lifecycleTransitionReason: "Expired despite legal hold",
      legalHoldActive: true,
      expirationStatus: "EXPIRED",
      lifecycleState: "ARCHIVED",
    });

    expect(governanceHold.validation.validationState).toBe("VALID");
    expect(illegalExpiration.validation.reasonCodes).toContain("GOVERNANCE_HOLD_VIOLATED");
    expect(legalHoldViolation.validation.reasonCodes).toContain("LEGAL_HOLD_VIOLATED");
  });

  it("fails illegal lifecycle transitions and unauthorized governance actions", () => {
    const base = foundation();
    const illegalTransition = sealTruthRetentionFramework({
      request: buildTruthRetentionFrameworkRequest({ tenant_id: "tenant-alpha", now: "2026-06-19T12:07:00.000Z" }),
      ...base,
      retentionPolicyId: "STANDARD",
      retentionState: "ACTIVE",
      retentionExpiration: "2027-06-19T12:07:00.000Z",
      archiveEligibility: "NOT_ELIGIBLE",
      lifecycleTransitionReason: "Illegal transition",
      lifecycleTransitionLegal: false,
    });
    const unauthorizedGovernance = sealTruthRetentionFramework({
      request: buildTruthRetentionFrameworkRequest({ tenant_id: "tenant-alpha", now: "2026-06-19T12:07:00.000Z" }),
      ...base,
      retentionPolicyId: "STANDARD",
      retentionState: "RESTRICTED",
      retentionExpiration: "2027-06-19T12:07:00.000Z",
      archiveEligibility: "RESTRICTED",
      lifecycleTransitionReason: "Unauthorized governance",
      governanceAction: "PLACE_HOLD",
      governanceActionAuthorized: false,
    });

    expect(illegalTransition.validation.reasonCodes).toContain("LIFECYCLE_TRANSITION_INVALID");
    expect(unauthorizedGovernance.validation.reasonCodes).toContain("GOVERNANCE_ACTION_UNAUTHORIZED");
  });

  it("fails replay mismatch and cross-tenant retention access", () => {
    const base = foundation();
    const replayMismatch = sealTruthRetentionFramework({
      request: buildTruthRetentionFrameworkRequest({ tenant_id: "tenant-alpha", now: "2026-06-19T12:07:00.000Z" }),
      ...base,
      retentionPolicyId: "STANDARD",
      retentionState: "ACTIVE",
      retentionExpiration: "2027-06-19T12:07:00.000Z",
      archiveEligibility: "NOT_ELIGIBLE",
      lifecycleTransitionReason: "Replay mismatch",
      replayMismatchDetected: true,
    });
    const crossTenant = sealTruthRetentionFramework({
      request: buildTruthRetentionFrameworkRequest({ tenant_id: "tenant-alpha", now: "2026-06-19T12:07:00.000Z" }),
      ...base,
      retentionPolicyId: "STANDARD",
      retentionState: "ACTIVE",
      retentionExpiration: "2027-06-19T12:07:00.000Z",
      archiveEligibility: "NOT_ELIGIBLE",
      lifecycleTransitionReason: "Cross tenant",
      accessTenantId: "tenant-beta",
      crossTenantAccessDetected: true,
    });

    expect(replayMismatch.replay.replayResult).toBe("MISMATCH");
    expect(crossTenant.validation.reasonCodes).toContain("TENANT_ISOLATION_FAILED");
  });

  it("supports conditional certification for non-critical observability gaps", () => {
    const base = foundation();
    const conditional = sealTruthRetentionFramework({
      request: buildTruthRetentionFrameworkRequest({ tenant_id: "tenant-alpha", now: "2026-06-19T12:07:00.000Z" }),
      ...base,
      retentionPolicyId: "STANDARD",
      retentionState: "ACTIVE",
      retentionExpiration: "2027-06-19T12:07:00.000Z",
      archiveEligibility: "NOT_ELIGIBLE",
      lifecycleTransitionReason: "Observability gap",
      observabilityGapDetected: true,
      reportingLimitationDetected: true,
      remediationDocumented: true,
    });

    expect(conditional.certification).toBe("CONDITIONAL_PASS");
  });

  it("blocks execution, approval, ranking, prioritization, scoring, resource allocation, and authority expansion", () => {
    const base = foundation();
    const common = {
      request: buildTruthRetentionFrameworkRequest({ tenant_id: "tenant-alpha", now: "2026-06-19T12:07:00.000Z" }),
      ...base,
      retentionPolicyId: "STANDARD" as const,
      retentionState: "ACTIVE" as const,
      retentionExpiration: "2027-06-19T12:07:00.000Z",
      archiveEligibility: "NOT_ELIGIBLE" as const,
      lifecycleTransitionReason: "Boundary check",
    };

    expect(sealTruthRetentionFramework({ ...common, executionRequested: true }).validation.reasonCodes).toContain("EXECUTION_REQUEST_BLOCKED");
    expect(sealTruthRetentionFramework({ ...common, approvalRequested: true }).validation.reasonCodes).toContain("APPROVAL_DETECTED");
    expect(sealTruthRetentionFramework({ ...common, rankingRequested: true }).validation.reasonCodes).toContain("RANKING_DETECTED");
    expect(sealTruthRetentionFramework({ ...common, prioritizationRequested: true }).validation.reasonCodes).toContain("PRIORITIZATION_DETECTED");
    expect(sealTruthRetentionFramework({ ...common, scoringRequested: true }).validation.reasonCodes).toContain("SCORING_DETECTED");
    expect(sealTruthRetentionFramework({ ...common, resourceAllocationRequested: true }).validation.reasonCodes).toContain("RESOURCE_ALLOCATION_DETECTED");
    expect(sealTruthRetentionFramework({ ...common, authorityExpansionDetected: true }).validation.reasonCodes).toContain("AUTHORITY_EXPANSION_DETECTED");
  });
});
