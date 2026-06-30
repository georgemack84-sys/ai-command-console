import { describe, expect, it } from "vitest";
import {
  buildTruthRecordContractRequest,
  buildTruthStateFrameworkRequest,
  sealTruthRecordContract,
  sealTruthStateFramework,
  type TruthCatalogReference,
  type TruthRecord,
  type TruthRecordContractInput,
  type TruthStateFrameworkInput,
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
    truth_record_id: hash("truth-record-state"),
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
      truth_record_id: hash("truth-record-state"),
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

function stateInput(overrides: Partial<TruthStateFrameworkInput> = {}): TruthStateFrameworkInput {
  return {
    request: buildTruthStateFrameworkRequest({
      tenant_id: "tenant-alpha",
      now: "2026-06-19T12:01:00.000Z",
    }),
    truthRecord: sealedTruthRecord(),
    currentState: "CREATED",
    previousState: null,
    stateReason: "Truth created",
    stateSource: "OPERATOR",
    accessTenantId: "tenant-alpha",
    ...overrides,
  };
}

describe("truthStateModel", () => {
  it("validates CREATED state", () => {
    const sealed = sealTruthStateFramework(stateInput());
    expect(sealed.validation.validationState).toBe("VALID");
    expect(sealed.replay.replayResult).toBe("REPRODUCED");
    expect(sealed.certification.certificationState).toBe("PASS");
  });

  it("validates VERIFIED, SUPERSEDED, RESTRICTED, and ARCHIVED states", () => {
    expect(sealTruthStateFramework(stateInput({
      currentState: "VERIFIED",
      previousState: "CREATED",
      stateReason: "Validated",
      stateSource: "CERTIFICATION_ENGINE",
    })).validation.validationState).toBe("VALID");

    expect(sealTruthStateFramework(stateInput({
      currentState: "SUPERSEDED",
      previousState: "VERIFIED",
      stateReason: "Replaced",
      stateSource: "GOVERNANCE_ENGINE",
      replacementTruthRecordId: hash("replacement-truth"),
      supersessionReason: "Newer truth available",
      supersessionTimestamp: "2026-06-19T12:02:00.000Z",
    })).validation.validationState).toBe("VALID");

    expect(sealTruthStateFramework(stateInput({
      currentState: "RESTRICTED",
      previousState: "VERIFIED",
      stateReason: "Restricted for review",
      stateSource: "SUPERVISION_ENGINE",
      restrictionReason: "Compliance hold",
      restrictionAuthority: "GOVERNANCE_ENGINE",
      restrictionScope: "mission",
      restrictionTimestamp: "2026-06-19T12:03:00.000Z",
    })).validation.validationState).toBe("VALID");

    expect(sealTruthStateFramework(stateInput({
      currentState: "ARCHIVED",
      previousState: "VERIFIED",
      stateReason: "Archived",
      stateSource: "OPERATOR",
    })).validation.validationState).toBe("VALID");
  });

  it("fails unknown state and multiple active states", () => {
    const unknown = sealTruthStateFramework(stateInput({
      currentState: "UNKNOWN" as never,
    }));
    const multiple = sealTruthStateFramework(stateInput({
      activeStates: ["CREATED", "VERIFIED"],
    }));

    expect(unknown.validation.reasonCodes).toContain("STATE_UNSUPPORTED");
    expect(multiple.validation.reasonCodes).toContain("TRANSITION_ILLEGAL");
  });

  it("fails illegal transitions", () => {
    const illegal = sealTruthStateFramework(stateInput({
      currentState: "ARCHIVED",
      previousState: "CREATED",
      stateReason: "Illegal archive",
      stateSource: "OPERATOR",
    }));

    expect(illegal.validation.validationState).toBe("INVALID");
    expect(illegal.validation.reasonCodes).toContain("TRANSITION_ILLEGAL");
  });

  it("fails missing or unknown authority", () => {
    const missing = sealTruthStateFramework(stateInput({
      stateSource: "" as never,
    }));
    const unknown = sealTruthStateFramework(stateInput({
      stateSource: "UNKNOWN_SOURCE" as never,
    }));

    expect(missing.validation.reasonCodes).toContain("STATE_AUTHORITY_MISSING");
    expect(unknown.validation.reasonCodes).toContain("STATE_AUTHORITY_INVALID");
  });

  it("fails missing evidence", () => {
    const sealed = sealTruthStateFramework(stateInput({
      truthRecord: sealedTruthRecord({
        record: truthRecord({ evidence_references: [] }),
        evidenceCatalog: [],
        immutableBaseline: {
          truth_record_id: hash("truth-record-state"),
          tenant_id: "tenant-alpha",
          mission_id: "mission-alpha",
          timestamp: "2026-06-19T12:00:00.000Z",
          event_type: "OBSERVATION_CREATED",
          event_source: "OPERATOR",
        },
      }),
    }));

    expect(sealed.validation.reasonCodes).toContain("STATE_EVIDENCE_MISSING");
    expect(sealed.replay.replayResult).toBe("INCOMPLETE_EVIDENCE");
  });

  it("fails missing supersession target and missing restriction authority", () => {
    const missingReplacement = sealTruthStateFramework(stateInput({
      currentState: "SUPERSEDED",
      previousState: "VERIFIED",
      stateReason: "Replaced",
      stateSource: "GOVERNANCE_ENGINE",
    }));
    const missingRestrictionAuthority = sealTruthStateFramework(stateInput({
      currentState: "RESTRICTED",
      previousState: "VERIFIED",
      stateReason: "Restricted",
      stateSource: "SUPERVISION_ENGINE",
      restrictionReason: "Policy hold",
    }));

    expect(missingReplacement.validation.reasonCodes).toContain("SUPERSESSION_TARGET_MISSING");
    expect(missingRestrictionAuthority.validation.reasonCodes).toContain("RESTRICTION_AUTHORITY_MISSING");
  });

  it("fails archive mutation attempts and replay mismatches", () => {
    const archiveMutation = sealTruthStateFramework(stateInput({
      currentState: "ARCHIVED",
      previousState: "CREATED",
      stateReason: "Invalid archive",
      stateSource: "OPERATOR",
    }));

    expect(archiveMutation.validation.reasonCodes).toContain("ARCHIVE_MUTATION_DETECTED");
    expect(archiveMutation.replay.replayResult).toBe("MISMATCH");
  });

  it("fails tenant isolation and preserves tenant-scoped visibility", () => {
    const sealed = sealTruthStateFramework(stateInput({
      accessTenantId: "tenant-beta",
    }));

    expect(sealed.validation.reasonCodes).toContain("TENANT_ISOLATION_FAILED");
    expect(sealed.operatorVisibility.tenantScoped).toBe(false);
  });

  it("blocks execution, approval, ranking, prioritization, scoring, resource allocation, and authority expansion", () => {
    const base = stateInput();

    expect(sealTruthStateFramework({ ...base, executionRequested: true }).validation.reasonCodes).toContain("EXECUTION_REQUEST_BLOCKED");
    expect(sealTruthStateFramework({ ...base, approvalRequested: true }).validation.reasonCodes).toContain("APPROVAL_DETECTED");
    expect(sealTruthStateFramework({ ...base, rankingRequested: true }).validation.reasonCodes).toContain("RANKING_DETECTED");
    expect(sealTruthStateFramework({ ...base, prioritizationRequested: true }).validation.reasonCodes).toContain("PRIORITIZATION_DETECTED");
    expect(sealTruthStateFramework({ ...base, scoringRequested: true }).validation.reasonCodes).toContain("SCORING_DETECTED");
    expect(sealTruthStateFramework({ ...base, resourceAllocationRequested: true }).validation.reasonCodes).toContain("RESOURCE_ALLOCATION_DETECTED");
    expect(sealTruthStateFramework({ ...base, authorityExpansionDetected: true }).validation.reasonCodes).toContain("AUTHORITY_EXPANSION_DETECTED");
  });
});
