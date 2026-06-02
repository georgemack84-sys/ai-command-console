import { describe, expect, it } from "vitest";
import {
  MAX_ANALYSIS_DEPTH,
  MAX_ANALYZED_PATHS,
  sealAlternatePathAnalysis,
  sealBranchReplay,
  sealGovernanceForecast,
  sealSimulationBoundaryContract,
  sealSimulationSandbox,
  type AlternatePathAnalysisInput,
  type AlternatePathRequest,
  type SealedGovernanceForecastRecord,
  type SealedSimulationSandboxRecord,
  type SimulationBoundaryContractInput,
} from "@/services/simulation-engine";

function boundaryInput(overrides: Partial<SimulationBoundaryContractInput> = {}): SimulationBoundaryContractInput {
  return Object.freeze({
    simulationId: "simulation-54e",
    tenantId: "tenant-alpha",
    missionId: "mission-alpha",
    simulationType: "ALTERNATE_PATH_ANALYSIS",
    approvedScope: ["path-1", "path-2", "path-3"],
    branchLimit: 3,
    replayReferenceIds: ["lineage-1"],
    evidenceReferences: ["evidence-1"],
    riskCertificationReference: "risk-certification-hash",
    approvalReference: "approval-1",
    operatorId: "operator-alpha",
    governanceVersion: "simulation-governance/v1",
    createdAt: "2026-06-02T18:00:00.000Z",
    contractVersion: "simulation-boundary-contract/v1",
    branches: [
      {
        branchId: "path-1",
        depth: 1,
        generatedBySimulation: false,
        nestedSimulation: false,
      },
      {
        branchId: "path-2",
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

function buildChain() {
  const contract = sealSimulationBoundaryContract(boundaryInput());
  const replay = sealBranchReplay({
    request: {
      simulationId: "simulation-54e",
      contractId: contract.contract.immutableHash,
      replayReferenceIds: ["lineage-1"],
      replayDepth: 1,
      branchIds: ["path-1", "path-2"],
      riskCertificationReference: "risk-certification-hash",
      replayType: "COMPARATIVE_REPLAY",
    },
    sealedContract: contract,
    tenantId: "tenant-alpha",
    lineageReferenceIds: ["lineage-1"],
  });
  const sandbox = sealSimulationSandbox({
    sandboxId: "sandbox-54e",
    tenantId: "tenant-alpha",
    contractId: contract.contract.immutableHash,
    sealedContract: contract,
    branchReplay: replay,
    permittedResources: ["lineage-inspector"],
    createdAt: "2026-06-02T18:05:00.000Z",
    isolationLevel: "STRICT",
  });
  const forecastA = sealGovernanceForecast({
    request: {
      simulationId: "simulation-54e",
      sandboxId: sandbox.context.sandboxId,
      replayId: replay.result.replayId,
      contractId: contract.contract.immutableHash,
      riskCertificationReference: contract.contract.riskCertificationReference,
      governanceVersion: contract.contract.governanceVersion,
      forecastType: "ESCALATION_FORECAST",
      lineageReferences: [replay.result.replayLineageHash, sandbox.result.isolationHash],
    },
    sealedContract: contract,
    branchReplay: replay,
    sandbox,
    tenantId: "tenant-alpha",
    containmentStress: 0.1,
  });
  const forecastB = sealGovernanceForecast({
    request: {
      simulationId: "simulation-54e",
      sandboxId: sandbox.context.sandboxId,
      replayId: replay.result.replayId,
      contractId: contract.contract.immutableHash,
      riskCertificationReference: contract.contract.riskCertificationReference,
      governanceVersion: contract.contract.governanceVersion,
      forecastType: "APPROVAL_PRESSURE",
      lineageReferences: [replay.result.replayLineageHash, sandbox.result.isolationHash],
    },
    sealedContract: contract,
    branchReplay: replay,
    sandbox,
    tenantId: "tenant-alpha",
    approvalComplexity: 0.45,
  });

  return { contract, replay, sandbox, forecasts: [forecastA, forecastB] as const };
}

function analysisRequest(
  chain = buildChain(),
  overrides: Partial<AlternatePathRequest> = {},
): AlternatePathRequest {
  return {
    simulationId: "simulation-54e",
    contractId: chain.contract.contract.immutableHash,
    replayIds: [chain.replay.result.replayId],
    sandboxIds: [chain.sandbox.context.sandboxId],
    forecastIds: chain.forecasts.map((forecast) => forecast.result.forecastId),
    pathIds: ["path-1", "path-2"],
    analysisType: "TRADEOFF_ANALYSIS",
    lineageReferences: [
      chain.replay.result.replayLineageHash,
      chain.sandbox.result.isolationHash,
      ...chain.forecasts.map((forecast) => forecast.result.lineageHash),
    ],
    ...overrides,
  };
}

function analysisInput(overrides: Partial<AlternatePathAnalysisInput> = {}): AlternatePathAnalysisInput {
  const chain = buildChain();
  return Object.freeze({
    request: analysisRequest(chain),
    sealedContract: chain.contract,
    branchReplays: [chain.replay],
    sandboxes: [chain.sandbox],
    forecasts: chain.forecasts,
    tenantId: "tenant-alpha",
    ...overrides,
  } satisfies AlternatePathAnalysisInput);
}

describe("alternatePathAnalysisEngine", () => {
  it("produces deterministic analysis and hashes for identical inputs", () => {
    const input = analysisInput();
    const first = sealAlternatePathAnalysis(input);
    const second = sealAlternatePathAnalysis(input);

    expect(first).toEqual(second);
    expect(first.result.analysisStatus).toBe("PASS");
    expect(first.result.comparedPathCount).toBe(2);
    expect(first.result.analysisHash).toHaveLength(64);
    expect(first.result.lineageHash).toHaveLength(64);
  });

  it("computes governance and containment deltas reproducibly", () => {
    const record = sealAlternatePathAnalysis(analysisInput());

    expect(record.result.governancePressureDelta).toBeGreaterThan(0);
    expect(record.result.containmentDelta).toBe(0);
    expect(record.result).toEqual(sealAlternatePathAnalysis(analysisInput()).result);
  });

  it("freezes invalid forecasts", () => {
    const chain = buildChain();
    const invalidForecast = {
      ...chain.forecasts[0],
      result: {
        ...chain.forecasts[0].result,
        forecastStatus: "FREEZE" as const,
      },
    } as SealedGovernanceForecastRecord;
    const record = sealAlternatePathAnalysis(analysisInput({
      forecasts: [invalidForecast],
      request: analysisRequest(chain, {
        forecastIds: [invalidForecast.result.forecastId],
      }),
    }));

    expect(record.result.analysisStatus).toBe("FREEZE");
    expect(record.validation.reasonCodes).toContain("INVALID_FORECAST");
  });

  it("freezes replay and containment failures", () => {
    const chain = buildChain();
    const badReplay = {
      ...chain.replay,
      result: {
        ...chain.replay.result,
        replayStatus: "FREEZE" as const,
      },
    };
    const badSandbox = {
      ...chain.sandbox,
      result: {
        ...chain.sandbox.result,
        sandboxStatus: "FREEZE" as const,
      },
    } as SealedSimulationSandboxRecord;
    const replayRecord = sealAlternatePathAnalysis(analysisInput({
      branchReplays: [badReplay],
    }));
    const sandboxRecord = sealAlternatePathAnalysis(analysisInput({
      sandboxes: [badSandbox],
    }));

    expect(replayRecord.result.analysisStatus).toBe("FREEZE");
    expect(replayRecord.validation.reasonCodes).toContain("REPLAY_INTEGRITY_FAILED");
    expect(sandboxRecord.result.analysisStatus).toBe("FREEZE");
    expect(sandboxRecord.validation.reasonCodes).toContain("CONTAINMENT_INTEGRITY_FAILED");
  });

  it("blocks cross-tenant path analysis", () => {
    const record = sealAlternatePathAnalysis(analysisInput({
      tenantId: "tenant-beta",
    }));

    expect(record.result.analysisStatus).toBe("FREEZE");
    expect(record.validation.reasonCodes).toContain("CROSS_TENANT_PATHS_BLOCKED");
  });

  it("blocks generated and unapproved paths", () => {
    const generated = sealAlternatePathAnalysis(analysisInput({
      generatedPathIds: ["path-1"],
    }));
    const unapproved = sealAlternatePathAnalysis(analysisInput({
      request: analysisRequest(buildChain(), {
        pathIds: ["path-1", "new-path"],
      }),
    }));

    expect(generated.result.analysisStatus).toBe("FREEZE");
    expect(generated.validation.reasonCodes).toContain("GENERATED_PATH_BLOCKED");
    expect(unapproved.result.analysisStatus).toBe("FREEZE");
    expect(unapproved.validation.reasonCodes).toContain("UNAPPROVED_PATH_DETECTED");
  });

  it("blocks recursive and nested analysis", () => {
    const recursive = sealAlternatePathAnalysis(analysisInput({
      recursiveAnalysis: true,
    }));
    const nested = sealAlternatePathAnalysis(analysisInput({
      nestedAnalysis: true,
    }));

    expect(recursive.result.analysisStatus).toBe("FREEZE");
    expect(recursive.validation.reasonCodes).toContain("RECURSIVE_ANALYSIS_BLOCKED");
    expect(nested.result.analysisStatus).toBe("FREEZE");
    expect(nested.validation.reasonCodes).toContain("NESTED_ANALYSIS_BLOCKED");
  });

  it("limits path count and analysis depth ceilings", () => {
    const pathIds = Array.from({ length: MAX_ANALYZED_PATHS + 1 }, (_, index) => `path-${index}`);
    const chain = buildChain();
    const limited = sealAlternatePathAnalysis(analysisInput({
      request: analysisRequest(chain, {
        pathIds,
      }),
      analysisDepth: MAX_ANALYSIS_DEPTH + 1,
    }));

    expect(limited.result.analysisStatus).toBe("FREEZE");
    expect(limited.validation.reasonCodes).toContain("PATH_COUNT_LIMITED");
    expect(limited.validation.reasonCodes).toContain("ANALYSIS_DEPTH_LIMITED");
  });

  it("escalates missing lineage without fabricating analysis", () => {
    const chain = buildChain();
    const record = sealAlternatePathAnalysis(analysisInput({
      request: analysisRequest(chain, {
        lineageReferences: [],
      }),
    }));

    expect(record.result.analysisStatus).toBe("ESCALATE");
    expect(record.validation.reasonCodes).toContain("LINEAGE_MISSING");
  });

  it("freezes unsealed artifact references", () => {
    const chain = buildChain();
    const unsealedForecast = {
      ...chain.forecasts[0],
      sealed: false as true,
    };
    const record = sealAlternatePathAnalysis(analysisInput({
      forecasts: [unsealedForecast],
    }));

    expect(record.result.analysisStatus).toBe("FREEZE");
    expect(record.validation.reasonCodes).toContain("ANALYSIS_REFERENCES_UNSEALED_ARTIFACTS");
  });

  it("keeps analysis read-only and authority-neutral", () => {
    const record = sealAlternatePathAnalysis(analysisInput({
      request: analysisRequest(buildChain(), {
        analysisType: "OUTCOME_DIFFERENTIATION",
      }),
    }));

    expect(record.readOnly).toBe(true);
    expect(record.advisoryOnly).toBe(true);
    expect(record.pathSelectionAuthorized).toBe(false);
    expect(record.executionRecommended).toBe(false);
    expect(record.optimizationAllowed).toBe(false);
    expect(record.pathGenerationAllowed).toBe(false);
    expect(record.workflowMutationAllowed).toBe(false);
    expect(record.authorityMutationAllowed).toBe(false);
    expect(record.validation.reasonCodes).toContain("ANALYSIS_IS_NOT_DECISION");
  });

  it("does not mutate sealed inputs", () => {
    const input = analysisInput();
    const before = JSON.stringify(input);

    sealAlternatePathAnalysis(input);

    expect(JSON.stringify(input)).toBe(before);
  });
});
