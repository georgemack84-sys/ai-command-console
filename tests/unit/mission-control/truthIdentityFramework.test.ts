import { describe, expect, it } from "vitest";
import {
  buildTruthIdentityFrameworkRequest,
  buildTruthRecordContractRequest,
  sealTruthIdentityFramework,
  sealTruthRecordContract,
  type TruthCatalogReference,
  type TruthIdentityFrameworkInput,
  type TruthIdentityNodeReference,
  type TruthRecord,
  type TruthRecordContractInput,
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
    truth_record_id: hash("truth-record-identity"),
    tenant_id: "tenant-alpha",
    mission_id: "mission-alpha",
    timestamp: "2026-06-19T12:00:00.000Z",
    event_type: "OBSERVATION_CREATED",
    event_source: "OPERATOR",
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
      truth_record_id: hash("truth-record-identity"),
      tenant_id: "tenant-alpha",
      mission_id: "mission-alpha",
      timestamp: "2026-06-19T12:00:00.000Z",
      event_type: "OBSERVATION_CREATED",
      event_source: "OPERATOR",
    },
    evidenceCatalog: [evidenceRef("evidence-alpha")],
    replayCatalog: [replayRef("replay-alpha")],
    accessTenantId: "tenant-alpha",
    ...overrides,
  };
}

function sealedTruthRecord(overrides: Partial<TruthRecordContractInput> = {}) {
  return sealTruthRecordContract(truthRecordInput(overrides));
}

function node(
  truth_record_id: string,
  overrides: Partial<TruthIdentityNodeReference> = {},
): TruthIdentityNodeReference {
  return {
    truth_record_id,
    tenant_id: "tenant-alpha",
    lineage_root_id: hash("lineage-root-alpha"),
    parent_truth_ids: [],
    child_truth_ids: [],
    immutable: true,
    accessible: true,
    auditable: true,
    replayable: true,
    ...overrides,
  };
}

function identityInput(overrides: Partial<TruthIdentityFrameworkInput> = {}): TruthIdentityFrameworkInput {
  const rootId = hash("lineage-root-alpha");
  return {
    request: buildTruthIdentityFrameworkRequest({
      tenant_id: "tenant-alpha",
      now: "2026-06-19T12:01:00.000Z",
    }),
    truthRecord: sealedTruthRecord(),
    identityCatalog: [
      node(rootId, {
        lineage_root_id: rootId,
        child_truth_ids: [hash("truth-record-identity")],
      }),
      node(hash("child-truth-alpha"), {
        lineage_root_id: rootId,
        parent_truth_ids: [hash("truth-record-identity")],
      }),
    ],
    lineageRootId: rootId,
    parentTruthIds: [rootId],
    childTruthIds: [hash("child-truth-alpha")],
    accessTenantId: "tenant-alpha",
    ...overrides,
  };
}

describe("truthIdentityFramework", () => {
  it("seals a deterministic valid identity", () => {
    const first = sealTruthIdentityFramework(identityInput());
    const second = sealTruthIdentityFramework(identityInput());

    expect(first).toEqual(second);
    expect(first.validation.validationState).toBe("VALID");
    expect(first.replay.replayResult).toBe("REPRODUCED");
    expect(first.certification.certificationState).toBe("PASS");
  });

  it("fails duplicate identity and reuse attempts", () => {
    const duplicate = sealTruthIdentityFramework(identityInput({
      existingTruthRecordIds: [hash("truth-record-identity")],
    }));
    const reused = sealTruthIdentityFramework(identityInput({
      historicalTruthRecordIds: [hash("truth-record-identity")],
    }));

    expect(duplicate.validation.validationState).toBe("INVALID");
    expect(duplicate.validation.reasonCodes).toContain("IDENTITY_DUPLICATE");
    expect(reused.validation.reasonCodes).toContain("IDENTITY_REUSE_BLOCKED");
  });

  it("fails missing lineage root and lineage root mutation", () => {
    const missingRoot = sealTruthIdentityFramework(identityInput({
      lineageRootId: "",
    }));
    const mutatedRoot = sealTruthIdentityFramework(identityInput({
      immutableBaseline: {
        truth_record_id: hash("truth-record-identity"),
        lineage_root_id: hash("other-root"),
      },
    }));

    expect(missingRoot.validation.validationState).toBe("INVALID");
    expect(missingRoot.validation.reasonCodes).toContain("LINEAGE_ROOT_MISSING");
    expect(mutatedRoot.validation.reasonCodes).toContain("LINEAGE_ROOT_MUTATION_DETECTED");
  });

  it("fails unknown and cross-tenant parent relationships", () => {
    const unknownParent = sealTruthIdentityFramework(identityInput({
      parentTruthIds: [hash("unknown-parent")],
    }));
    const crossTenantParent = sealTruthIdentityFramework(identityInput({
      identityCatalog: [
        node(hash("lineage-root-alpha"), {
          tenant_id: "tenant-beta",
          child_truth_ids: [hash("truth-record-identity")],
        }),
        node(hash("child-truth-alpha"), {
          parent_truth_ids: [hash("truth-record-identity")],
        }),
      ],
    }));

    expect(unknownParent.validation.reasonCodes).toContain("PARENT_REFERENCES_UNKNOWN");
    expect(crossTenantParent.validation.reasonCodes).toContain("PARENT_TENANT_ISOLATION_FAILED");
  });

  it("fails unknown and cross-tenant child relationships", () => {
    const unknownChild = sealTruthIdentityFramework(identityInput({
      childTruthIds: [hash("unknown-child")],
    }));
    const crossTenantChild = sealTruthIdentityFramework(identityInput({
      identityCatalog: [
        node(hash("lineage-root-alpha"), {
          child_truth_ids: [hash("truth-record-identity")],
        }),
        node(hash("child-truth-alpha"), {
          tenant_id: "tenant-beta",
          parent_truth_ids: [hash("truth-record-identity")],
        }),
      ],
    }));

    expect(unknownChild.validation.reasonCodes).toContain("CHILD_REFERENCES_UNKNOWN");
    expect(crossTenantChild.validation.reasonCodes).toContain("CHILD_TENANT_ISOLATION_FAILED");
  });

  it("fails circular dependencies and genealogy corruption", () => {
    const cycle = sealTruthIdentityFramework(identityInput({
      identityCatalog: [
        node(hash("lineage-root-alpha"), {
          child_truth_ids: [hash("truth-record-identity")],
          parent_truth_ids: [hash("truth-record-identity")],
        }),
        node(hash("child-truth-alpha"), {
          parent_truth_ids: [hash("truth-record-identity")],
        }),
      ],
    }));
    const brokenGenealogy = sealTruthIdentityFramework(identityInput({
      identityCatalog: [
        node(hash("lineage-root-alpha"), {
          child_truth_ids: [],
        }),
        node(hash("child-truth-alpha"), {
          parent_truth_ids: [],
        }),
      ],
    }));

    expect(cycle.validation.reasonCodes).toContain("CYCLE_DETECTED");
    expect(brokenGenealogy.validation.reasonCodes).toContain("RELATIONSHIP_INTEGRITY_INVALID");
  });

  it("fails replay when relationships cannot be reconstructed", () => {
    const unreplayable = sealTruthIdentityFramework(identityInput({
      identityCatalog: [
        node(hash("lineage-root-alpha"), {
          child_truth_ids: [],
        }),
      ],
      childTruthIds: [hash("child-truth-alpha")],
    }));

    expect(unreplayable.validation.validationState).toBe("INVALID");
    expect(unreplayable.replay.replayResult).toBe("INCOMPLETE_EVIDENCE");
  });

  it("fails tenant isolation and preserves tenant-scoped visibility", () => {
    const sealed = sealTruthIdentityFramework(identityInput({
      accessTenantId: "tenant-beta",
    }));

    expect(sealed.validation.reasonCodes).toContain("TENANT_ISOLATION_FAILED");
    expect(sealed.operatorVisibility.tenantScoped).toBe(false);
  });

  it("blocks execution, approval, ranking, prioritization, scoring, resource allocation, and authority expansion", () => {
    const base = identityInput();

    expect(sealTruthIdentityFramework({ ...base, executionRequested: true }).validation.reasonCodes).toContain("EXECUTION_REQUEST_BLOCKED");
    expect(sealTruthIdentityFramework({ ...base, approvalRequested: true }).validation.reasonCodes).toContain("APPROVAL_DETECTED");
    expect(sealTruthIdentityFramework({ ...base, rankingRequested: true }).validation.reasonCodes).toContain("RANKING_DETECTED");
    expect(sealTruthIdentityFramework({ ...base, prioritizationRequested: true }).validation.reasonCodes).toContain("PRIORITIZATION_DETECTED");
    expect(sealTruthIdentityFramework({ ...base, scoringRequested: true }).validation.reasonCodes).toContain("SCORING_DETECTED");
    expect(sealTruthIdentityFramework({ ...base, resourceAllocationRequested: true }).validation.reasonCodes).toContain("RESOURCE_ALLOCATION_DETECTED");
    expect(sealTruthIdentityFramework({ ...base, authorityExpansionDetected: true }).validation.reasonCodes).toContain("AUTHORITY_EXPANSION_DETECTED");
  });
});
