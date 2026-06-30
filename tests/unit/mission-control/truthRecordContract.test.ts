import { describe, expect, it } from "vitest";
import {
  buildTruthRecordContractRequest,
  sealTruthRecordContract,
  type TruthCatalogReference,
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
    truth_record_id: hash("truth-record-alpha"),
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

function input(overrides: Partial<TruthRecordContractInput> = {}): TruthRecordContractInput {
  return {
    request: buildTruthRecordContractRequest({
      tenant_id: "tenant-alpha",
      mission_id: "mission-alpha",
      now: "2026-06-19T12:00:30.000Z",
    }),
    record: truthRecord(),
    knownTenantIds: ["tenant-alpha", "tenant-beta"],
    knownMissionIds: ["mission-alpha", "mission-beta"],
    existingTruthRecordIds: [],
    priorLifecycleState: "CREATED",
    immutableBaseline: {
      truth_record_id: hash("truth-record-alpha"),
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

describe("truthRecordContract", () => {
  it("seals a valid truth record deterministically", () => {
    const first = sealTruthRecordContract(input());
    const second = sealTruthRecordContract(input());

    expect(first).toEqual(second);
    expect(first.validation.validationState).toBe("VALID");
    expect(first.replay.replayResult).toBe("REPRODUCED");
    expect(first.certification.certificationState).toBe("PASS");
  });

  it("produces CONDITIONAL_PASS for a bounded non-critical readiness gap", () => {
    const conditional = sealTruthRecordContract(input({
      priorLifecycleState: null,
      record: truthRecord({ lifecycle_state: "CREATED" }),
    }));

    expect(conditional.validation.validationState).toBe("VALID");
    expect(conditional.certification.certificationState).toBe("CONDITIONAL_PASS");
  });

  it("fails missing or duplicate identity requirements", () => {
    const missingId = sealTruthRecordContract(input({
      record: truthRecord({ truth_record_id: "" }),
      immutableBaseline: null,
    }));
    const duplicate = sealTruthRecordContract(input({
      existingTruthRecordIds: [hash("truth-record-alpha")],
    }));

    expect(missingId.validation.validationState).toBe("INVALID");
    expect(missingId.validation.reasonCodes).toContain("TRUTH_RECORD_ID_MISSING");
    expect(duplicate.validation.reasonCodes).toContain("TRUTH_RECORD_ID_DUPLICATE");
  });

  it("fails unknown tenant, mission, event taxonomy, and source taxonomy violations", () => {
    const badTenant = sealTruthRecordContract(input({
      record: truthRecord({ tenant_id: "tenant-unknown" }),
      accessTenantId: "tenant-unknown",
      immutableBaseline: {
        ...input().immutableBaseline!,
        tenant_id: "tenant-unknown",
      },
    }));
    const badMission = sealTruthRecordContract(input({
      record: truthRecord({ mission_id: "mission-unknown" }),
      immutableBaseline: {
        ...input().immutableBaseline!,
        mission_id: "mission-unknown",
      },
    }));
    const badEvent = sealTruthRecordContract(input({
      record: {
        ...truthRecord(),
        event_type: "BAD_EVENT" as never,
      },
    }));
    const badSource = sealTruthRecordContract(input({
      record: {
        ...truthRecord(),
        event_source: "BAD_SOURCE" as never,
      },
    }));

    expect(badTenant.validation.reasonCodes).toContain("TENANT_ID_UNKNOWN");
    expect(badMission.validation.reasonCodes).toContain("MISSION_ID_UNKNOWN");
    expect(badEvent.validation.reasonCodes).toContain("EVENT_TYPE_INVALID");
    expect(badSource.validation.reasonCodes).toContain("EVENT_SOURCE_INVALID");
  });

  it("enforces lifecycle transitions, immutability, and timestamp tolerance fail-closed", () => {
    const illegalTransition = sealTruthRecordContract(input({
      priorLifecycleState: "REVOKED",
      record: truthRecord({ lifecycle_state: "ACTIVE" }),
    }));
    const mutatedImmutableField = sealTruthRecordContract(input({
      record: truthRecord({ mission_id: "mission-beta" }),
    }));
    const futureTimestamp = sealTruthRecordContract(input({
      record: truthRecord({ timestamp: "2026-06-19T12:05:00.000Z" }),
    }));

    expect(illegalTransition.validation.reasonCodes).toContain("LIFECYCLE_TRANSITION_INVALID");
    expect(mutatedImmutableField.validation.reasonCodes).toContain("IMMUTABILITY_VIOLATED");
    expect(futureTimestamp.validation.reasonCodes).toContain("TIMESTAMP_OUT_OF_TOLERANCE");
  });

  it("fails invalid evidence, replay, and tenant isolation checks", () => {
    const missingEvidence = sealTruthRecordContract(input({
      evidenceCatalog: [],
    }));
    const invalidReplay = sealTruthRecordContract(input({
      replayCatalog: [{
        ...replayRef("replay-alpha"),
        resolvable: false,
      }],
    }));
    const crossTenantAccess = sealTruthRecordContract(input({
      accessTenantId: "tenant-beta",
    }));

    expect(missingEvidence.validation.reasonCodes).toContain("EVIDENCE_REFERENCES_INVALID");
    expect(missingEvidence.replay.replayResult).toBe("INCOMPLETE_EVIDENCE");
    expect(invalidReplay.validation.reasonCodes).toContain("REPLAY_REFERENCES_INVALID");
    expect(invalidReplay.replay.replayResult).toBe("UNREPLAYABLE");
    expect(crossTenantAccess.validation.reasonCodes).toContain("TENANT_ISOLATION_FAILED");
  });

  it("blocks execution, approval, ranking, prioritization, scoring, resource allocation, and authority expansion", () => {
    const base = input();

    expect(sealTruthRecordContract({ ...base, executionRequested: true }).validation.reasonCodes).toContain("EXECUTION_REQUEST_BLOCKED");
    expect(sealTruthRecordContract({ ...base, approvalRequested: true }).validation.reasonCodes).toContain("APPROVAL_DETECTED");
    expect(sealTruthRecordContract({ ...base, rankingRequested: true }).validation.reasonCodes).toContain("RANKING_DETECTED");
    expect(sealTruthRecordContract({ ...base, prioritizationRequested: true }).validation.reasonCodes).toContain("PRIORITIZATION_DETECTED");
    expect(sealTruthRecordContract({ ...base, scoringRequested: true }).validation.reasonCodes).toContain("SCORING_DETECTED");
    expect(sealTruthRecordContract({ ...base, resourceAllocationRequested: true }).validation.reasonCodes).toContain("RESOURCE_ALLOCATION_DETECTED");
    expect(sealTruthRecordContract({ ...base, authorityExpansionDetected: true }).validation.reasonCodes).toContain("AUTHORITY_EXPANSION_DETECTED");
  });
});
