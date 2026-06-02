import { describe, expect, it } from "vitest";
import {
  MAX_BRANCH_REPLAY_COUNT,
  MAX_REPLAY_DEPTH,
  sealBranchReplay,
  sealSimulationBoundaryContract,
  type BranchReplayInput,
  type ReplayRequest,
  type SealedSimulationBoundaryRecord,
  type SimulationBoundaryContractInput,
} from "@/services/simulation-engine";

function boundaryInput(overrides: Partial<SimulationBoundaryContractInput> = {}): SimulationBoundaryContractInput {
  return Object.freeze({
    simulationId: "simulation-54b",
    tenantId: "tenant-alpha",
    missionId: "mission-alpha",
    simulationType: "BRANCH_REPLAY",
    approvedScope: ["branch-1", "branch-2", "branch-3"],
    branchLimit: 3,
    replayReferenceIds: ["lineage-1", "lineage-2"],
    evidenceReferences: ["evidence-1"],
    riskCertificationReference: "risk-certification-hash",
    approvalReference: "approval-1",
    operatorId: "operator-alpha",
    governanceVersion: "simulation-governance/v1",
    createdAt: "2026-06-02T15:00:00.000Z",
    contractVersion: "simulation-boundary-contract/v1",
    branches: [
      {
        branchId: "branch-1",
        depth: 1,
        generatedBySimulation: false,
        nestedSimulation: false,
      },
      {
        branchId: "branch-2",
        depth: 1,
        generatedBySimulation: false,
        nestedSimulation: false,
      },
      {
        branchId: "branch-3",
        depth: 1,
        generatedBySimulation: false,
        nestedSimulation: false,
      },
    ],
    riskCertificationEvidence: {
      certificationState: "PASS",
      certificationHash: "risk-certification-hash",
      certificationLineageHash: "risk-certification-lineage-hash",
      replayValidation: true,
      containmentState: "LINEAGE_VALIDATED",
    },
    ...overrides,
  } satisfies SimulationBoundaryContractInput);
}

function replayRequest(overrides: Partial<ReplayRequest> = {}): ReplayRequest {
  return {
    simulationId: "simulation-54b",
    contractId: "contract-54b",
    replayReferenceIds: ["lineage-1", "lineage-2"],
    replayDepth: 2,
    branchIds: ["branch-1", "branch-2"],
    riskCertificationReference: "risk-certification-hash",
    replayType: "HISTORICAL_REPLAY",
    ...overrides,
  };
}

function replayInput(overrides: Partial<BranchReplayInput> = {}): BranchReplayInput {
  const sealedContract = sealSimulationBoundaryContract(boundaryInput());
  return Object.freeze({
    request: replayRequest(),
    sealedContract,
    tenantId: "tenant-alpha",
    lineageReferenceIds: ["lineage-1", "lineage-2"],
    ...overrides,
  } satisfies BranchReplayInput);
}

describe("branchReplayEngine", () => {
  it("produces deterministic replay hashes and outputs for identical input", () => {
    const input = replayInput();
    const first = sealBranchReplay(input);
    const second = sealBranchReplay(input);

    expect(first).toEqual(second);
    expect(first.result.replayStatus).toBe("PASS");
    expect(first.result.reconstructedBranches).toEqual(["branch-1", "branch-2"]);
    expect(first.result.replayHash).toHaveLength(64);
    expect(first.result.deterministicHash).toHaveLength(64);
  });

  it("does not mutate sealed contracts or source replay input", () => {
    const input = replayInput();
    const before = JSON.stringify(input);

    sealBranchReplay(input);

    expect(JSON.stringify(input)).toBe(before);
    expect(input.sealedContract?.contract.executionAuthorized).toBe(false);
    expect(input.sealedContract?.contract.runtimeMutationAllowed).toBe(false);
  });

  it("does not create branches outside the approved contract scope", () => {
    const record = sealBranchReplay(replayInput({
      request: replayRequest({
        branchIds: ["branch-1", "branch-new"],
      }),
    }));

    expect(record.result.replayStatus).toBe("FREEZE");
    expect(record.validation.reasonCodes).toContain("BRANCH_SCOPE_INVALID");
    expect(record.result.reconstructedBranches).toEqual(["branch-1"]);
    expect(record.branchGenerationAllowed).toBe(false);
  });

  it("cannot schedule work or expose execution authority", () => {
    const record = sealBranchReplay(replayInput());

    expect(record.executionAuthorized).toBe(false);
    expect(record.runtimeMutationAllowed).toBe(false);
    expect(record.schedulingAllowed).toBe(false);
    expect(record.authorityMutationAllowed).toBe(false);
    expect(record.persistenceAllowed).toBe(false);
  });

  it("preserves tenant isolation and blocks cross-tenant replay", () => {
    const record = sealBranchReplay(replayInput({
      tenantId: "tenant-beta",
    }));

    expect(record.result.replayStatus).toBe("FREEZE");
    expect(record.validation.reasonCodes).toContain("CROSS_TENANT_REPLAY_BLOCKED");
  });

  it("limits replay depth above the ceiling", () => {
    const record = sealBranchReplay(replayInput({
      request: replayRequest({
        replayDepth: MAX_REPLAY_DEPTH + 1,
      }),
    }));

    expect(record.result.replayStatus).toBe("LIMIT_SCOPE");
    expect(record.validation.reasonCodes).toContain("REPLAY_DEPTH_LIMITED");
    expect(record.result.replayDepth).toBe(MAX_REPLAY_DEPTH);
  });

  it("limits branch count above the replay ceiling", () => {
    const branchIds = Array.from({ length: MAX_BRANCH_REPLAY_COUNT + 1 }, (_, index) => `branch-${index}`);
    const sealedContract = sealSimulationBoundaryContract(boundaryInput({
      approvedScope: branchIds,
      branchLimit: MAX_BRANCH_REPLAY_COUNT,
      branches: branchIds.slice(0, 3).map((branchId) => ({
        branchId,
        depth: 1,
        generatedBySimulation: false,
        nestedSimulation: false,
      })),
    }));
    const record = sealBranchReplay(replayInput({
      sealedContract,
      request: replayRequest({
        branchIds,
      }),
    }));

    expect(record.result.replayStatus).toBe("LIMIT_SCOPE");
    expect(record.validation.reasonCodes).toContain("BRANCH_COUNT_LIMITED");
  });

  it("blocks recursive and nested replay", () => {
    const recursive = sealBranchReplay(replayInput({
      request: replayRequest({
        contractId: "lineage-1",
      }),
    }));
    const nested = sealBranchReplay(replayInput({
      nestedReplay: true,
    }));

    expect(recursive.result.replayStatus).toBe("LIMIT_SCOPE");
    expect(recursive.validation.reasonCodes).toContain("RECURSIVE_REPLAY_BLOCKED");
    expect(nested.result.replayStatus).toBe("LIMIT_SCOPE");
    expect(nested.validation.reasonCodes).toContain("NESTED_REPLAY_BLOCKED");
  });

  it("blocks self-generated branches", () => {
    const record = sealBranchReplay(replayInput({
      generatedBranchIds: ["branch-1"],
    }));

    expect(record.result.replayStatus).toBe("FREEZE");
    expect(record.validation.reasonCodes).toContain("BRANCH_GENERATION_BLOCKED");
  });

  it("freezes invalid sealed contracts", () => {
    const invalidContract = {
      ...sealSimulationBoundaryContract(boundaryInput()),
      validation: {
        ...sealSimulationBoundaryContract(boundaryInput()).validation,
        status: "FREEZE" as const,
      },
    } as SealedSimulationBoundaryRecord;
    const record = sealBranchReplay(replayInput({
      sealedContract: invalidContract,
    }));

    expect(record.result.replayStatus).toBe("FREEZE");
    expect(record.validation.reasonCodes).toContain("SEALED_CONTRACT_MISSING");
  });

  it("escalates missing or mismatched risk certification references", () => {
    const missing = sealBranchReplay(replayInput({
      request: replayRequest({
        riskCertificationReference: "",
      }),
    }));
    const mismatched = sealBranchReplay(replayInput({
      request: replayRequest({
        riskCertificationReference: "other-certification",
      }),
    }));

    expect(missing.result.replayStatus).toBe("ESCALATE");
    expect(missing.validation.reasonCodes).toContain("RISK_CERTIFICATION_MISSING");
    expect(mismatched.result.replayStatus).toBe("ESCALATE");
    expect(mismatched.validation.reasonCodes).toContain("RISK_CERTIFICATION_MISMATCH");
  });

  it("freezes missing lineage references", () => {
    const record = sealBranchReplay(replayInput({
      lineageReferenceIds: [],
    }));

    expect(record.result.replayStatus).toBe("FREEZE");
    expect(record.validation.reasonCodes).toContain("LINEAGE_REFERENCE_MISSING");
  });

  it("exposes visibility-only replay observability", () => {
    const record = sealBranchReplay(replayInput({
      request: replayRequest({
        replayType: "LINEAGE_REPLAY",
      }),
    }));

    expect(record.observability).toEqual({
      replayId: record.result.replayId,
      replayType: "LINEAGE_REPLAY",
      replayDepth: record.result.replayDepth,
      branchCount: record.result.branchCount,
      replayHash: record.result.replayHash,
      replayStatus: record.result.replayStatus,
      escalationState: record.validation.escalationState,
    });
  });
});
