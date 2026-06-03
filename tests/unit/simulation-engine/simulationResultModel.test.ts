import { describe, expect, it } from "vitest";
import {
  buildSimulationResultModel,
  sealAlternatePathAnalysis,
  sealBranchReplay,
  sealGovernanceForecast,
  sealSimulationBoundaryContract,
  sealSimulationReplayLedger,
  sealSimulationResultModel,
  sealSimulationSandbox,
  type AlternatePathRequest,
  type SealedSimulationReplayLedgerRecord,
  type SimulationBoundaryContractInput,
  type SimulationResultModelInput,
} from "@/services/simulation-engine";

function boundaryInput(overrides: Partial<SimulationBoundaryContractInput> = {}): SimulationBoundaryContractInput {
  return Object.freeze({
    simulationId: "simulation-54g",
    tenantId: "tenant-alpha",
    missionId: "mission-alpha",
    simulationType: "ALTERNATE_PATH_ANALYSIS",
    approvedScope: ["path-1", "path-2", "path-3"],
    branchLimit: 3,
    replayReferenceIds: ["lineage-1"],
    evidenceReferences: ["evidence-1", "evidence-2"],
    riskCertificationReference: "risk-certification-hash",
    approvalReference: "approval-1",
    operatorId: "operator-alpha",
    governanceVersion: "simulation-governance/v1",
    createdAt: "2026-06-02T20:00:00.000Z",
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
      {
        branchId: "path-3",
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

function buildSealedChain() {
  const contract = sealSimulationBoundaryContract(boundaryInput());
  const replay = sealBranchReplay({
    request: {
      simulationId: "simulation-54g",
      contractId: contract.contract.immutableHash,
      replayReferenceIds: ["lineage-1"],
      replayDepth: 1,
      branchIds: ["path-1", "path-2", "path-3"],
      riskCertificationReference: "risk-certification-hash",
      replayType: "COMPARATIVE_REPLAY",
    },
    sealedContract: contract,
    tenantId: "tenant-alpha",
    lineageReferenceIds: ["lineage-1"],
  });
  const sandbox = sealSimulationSandbox({
    sandboxId: "sandbox-54g",
    tenantId: "tenant-alpha",
    contractId: contract.contract.immutableHash,
    sealedContract: contract,
    branchReplay: replay,
    permittedResources: ["result-model-inspector"],
    createdAt: "2026-06-02T20:05:00.000Z",
    isolationLevel: "STRICT",
  });
  const forecastA = sealGovernanceForecast({
    request: {
      simulationId: "simulation-54g",
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
      simulationId: "simulation-54g",
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
    approvalComplexity: 0.25,
  });
  const forecasts = [forecastA, forecastB] as const;

  function analysisRequest(overrides: Partial<AlternatePathRequest> = {}): AlternatePathRequest {
    return {
      simulationId: "simulation-54g",
      contractId: contract.contract.immutableHash,
      replayIds: [replay.result.replayId],
      sandboxIds: [sandbox.context.sandboxId],
      forecastIds: forecasts.map((forecast) => forecast.result.forecastId),
      pathIds: ["path-1", "path-2"],
      analysisType: "TRADEOFF_ANALYSIS",
      lineageReferences: [
        replay.result.replayLineageHash,
        sandbox.result.isolationHash,
        ...forecasts.map((forecast) => forecast.result.lineageHash),
      ],
      ...overrides,
    };
  }

  const analysisA = sealAlternatePathAnalysis({
    request: analysisRequest(),
    sealedContract: contract,
    branchReplays: [replay],
    sandboxes: [sandbox],
    forecasts,
    tenantId: "tenant-alpha",
  });
  const analysisB = sealAlternatePathAnalysis({
    request: analysisRequest({
      pathIds: ["path-2", "path-3"],
      analysisType: "PATH_COMPARISON",
    }),
    sealedContract: contract,
    branchReplays: [replay],
    sandboxes: [sandbox],
    forecasts,
    tenantId: "tenant-alpha",
  });
  const analyses = [analysisA, analysisB] as const;
  const ledger = sealSimulationReplayLedger({
    simulationId: "simulation-54g",
    tenantId: "tenant-alpha",
    createdAt: "2026-06-02T20:10:00.000Z",
    sealedContract: contract,
    branchReplays: [replay],
    sandboxes: [sandbox],
    forecasts,
    analyses,
  });

  return { contract, replay, sandbox, forecasts, analyses, ledger };
}

function resultInput(overrides: Partial<SimulationResultModelInput> = {}): SimulationResultModelInput {
  const chain = buildSealedChain();

  return Object.freeze({
    simulationId: "simulation-54g",
    tenantId: "tenant-alpha",
    createdAt: "2026-06-02T20:15:00.000Z",
    resultVersion: "simulation-result-model/v1",
    sealedContract: chain.contract,
    branchReplays: [chain.replay],
    sandboxes: [chain.sandbox],
    forecasts: chain.forecasts,
    analyses: chain.analyses,
    replayLedger: chain.ledger,
    evidenceReferences: ["operator-review-note"],
    ...overrides,
  } satisfies SimulationResultModelInput);
}

describe("simulationResultModel", () => {
  it("produces deterministic normalized results for identical inputs", () => {
    const input = resultInput();
    const first = sealSimulationResultModel(input);
    const second = sealSimulationResultModel(input);

    expect(first).toEqual(second);
    expect(first.result.resultStatus).toBe("PASS");
    expect(first.result.resultId).toHaveLength(64);
    expect(first.result.immutableHash).toHaveLength(64);
    expect(first.result.evidenceReferences).toEqual([...first.result.evidenceReferences].sort());
  });

  it("keeps normalized hashes reproducible when artifact ordering changes", () => {
    const chain = buildSealedChain();
    const first = sealSimulationResultModel(resultInput({
      forecasts: [chain.forecasts[1], chain.forecasts[0]],
      analyses: [chain.analyses[1], chain.analyses[0]],
    }));
    const second = sealSimulationResultModel(resultInput({
      forecasts: [chain.forecasts[0], chain.forecasts[1]],
      analyses: [chain.analyses[0], chain.analyses[1]],
    }));

    expect(first.result.forecastHash).toBe(second.result.forecastHash);
    expect(first.result.analysisHash).toBe(second.result.analysisHash);
    expect(first.result.immutableHash).toBe(second.result.immutableHash);
  });

  it("preserves lineage and hash relationships from sealed artifacts", () => {
    const record = sealSimulationResultModel(resultInput());

    expect(record.validation.lineageIntegrity).toBe(true);
    expect(record.validation.reasonCodes).toContain("LINEAGE_INTEGRITY_VALID");
    expect(record.result.contractHash).toBe(record.result.contractHash);
    expect(record.result.reconstructionHash).toBe(resultInput().replayLedger.bundle.reconstructionHash);
    expect(record.result.lineageHash).toHaveLength(64);
  });

  it("blocks cross-tenant artifacts", () => {
    const record = sealSimulationResultModel(resultInput({
      tenantId: "tenant-beta",
    }));

    expect(record.result.resultStatus).toBe("FREEZE");
    expect(record.validation.tenantBoundaryPreserved).toBe(false);
    expect(record.validation.reasonCodes).toContain("CROSS_TENANT_ARTIFACTS_BLOCKED");
  });

  it("freezes unsealed artifacts", () => {
    const chain = buildSealedChain();
    const unsealedLedger = {
      ...chain.ledger,
      sealed: false as unknown as true,
    } satisfies SealedSimulationReplayLedgerRecord;
    const record = sealSimulationResultModel(resultInput({
      replayLedger: unsealedLedger,
    }));

    expect(record.result.resultStatus).toBe("FREEZE");
    expect(record.validation.reasonCodes).toContain("LEDGER_ARTIFACT_UNSEALED");
  });

  it("freezes lineage integrity failures", () => {
    const chain = buildSealedChain();
    const brokenLedger = {
      ...chain.ledger,
      validation: {
        ...chain.ledger.validation,
        lineageIntegrity: false,
      },
      bundle: {
        ...chain.ledger.bundle,
        lineageIntegrity: false,
      },
    } satisfies SealedSimulationReplayLedgerRecord;
    const record = sealSimulationResultModel(resultInput({
      replayLedger: brokenLedger,
    }));

    expect(record.result.resultStatus).toBe("FREEZE");
    expect(record.validation.lineageIntegrity).toBe(false);
    expect(record.validation.reasonCodes).toContain("LINEAGE_INTEGRITY_FAILED");
  });

  it("escalates non-replayable ledger bundles without creating authority", () => {
    const chain = buildSealedChain();
    const nonReplayableLedger = {
      ...chain.ledger,
      bundle: {
        ...chain.ledger.bundle,
        replayable: false,
      },
    } satisfies SealedSimulationReplayLedgerRecord;
    const record = sealSimulationResultModel(resultInput({
      replayLedger: nonReplayableLedger,
    }));

    expect(record.result.resultStatus).toBe("ESCALATE");
    expect(record.validation.replayable).toBe(false);
    expect(record.validation.reasonCodes).toContain("REPLAYABLE_FALSE");
  });

  it("freezes missing reconstruction hash", () => {
    const chain = buildSealedChain();
    const missingReconstruction = {
      ...chain.ledger,
      bundle: {
        ...chain.ledger.bundle,
        reconstructionHash: "",
      },
    } satisfies SealedSimulationReplayLedgerRecord;
    const record = sealSimulationResultModel(resultInput({
      replayLedger: missingReconstruction,
    }));

    expect(record.result.resultStatus).toBe("FREEZE");
    expect(record.validation.reasonCodes).toContain("RECONSTRUCTION_HASH_MISSING");
  });

  it("escalates missing governance version", () => {
    const chain = buildSealedChain();
    const missingGovernance = {
      ...chain.contract,
      contract: {
        ...chain.contract.contract,
        governanceVersion: "",
      },
    };
    const record = sealSimulationResultModel(resultInput({
      sealedContract: missingGovernance,
    }));

    expect(record.result.resultStatus).toBe("ESCALATE");
    expect(record.validation.reasonCodes).toContain("GOVERNANCE_VERSION_MISSING");
  });

  it("freezes missing evidence references", () => {
    const chain = buildSealedChain();
    const noEvidenceContract = sealSimulationBoundaryContract(boundaryInput({
      evidenceReferences: [],
      replayReferenceIds: [],
      riskCertificationReference: "",
      approvalReference: "",
      riskCertificationEvidence: undefined,
    }));
    const emptyLedger = {
      ...chain.ledger,
      bundle: {
        ...chain.ledger.bundle,
        ledgerEntries: [],
      },
    } satisfies SealedSimulationReplayLedgerRecord;
    const record = sealSimulationResultModel(resultInput({
      sealedContract: noEvidenceContract,
      branchReplays: [],
      sandboxes: [],
      forecasts: [],
      analyses: [],
      replayLedger: emptyLedger,
      evidenceReferences: [],
    }));

    expect(record.result.resultStatus).toBe("FREEZE");
    expect(record.validation.reasonCodes).toContain("EVIDENCE_REFERENCES_MISSING");
  });

  it("reconstructs result model output deterministically", () => {
    const input = resultInput();
    const sealed = sealSimulationResultModel(input);
    const rebuilt = buildSimulationResultModel(input);

    expect(rebuilt).toEqual(sealed.result);
    expect(rebuilt.reconstructionHash).toBe(input.replayLedger.bundle.reconstructionHash);
  });

  it("exposes read-only observability and no authority controls", () => {
    const record = sealSimulationResultModel(resultInput());

    expect(record.observability).toEqual({
      resultId: record.result.resultId,
      simulationId: "simulation-54g",
      resultStatus: "PASS",
      replayable: true,
      lineageIntegrity: true,
      immutableHash: record.result.immutableHash,
    });
    expect(record.readOnly).toBe(true);
    expect(record.advisoryOnly).toBe(true);
    expect(record.decisionAuthorized).toBe(false);
    expect(record.recommendationAllowed).toBe(false);
    expect(record.rankingAllowed).toBe(false);
    expect(record.executionAuthorized).toBe(false);
    expect(record.workflowMutationAllowed).toBe(false);
    expect(record.authorityMutationAllowed).toBe(false);
    expect(record.evidenceMutationAllowed).toBe(false);
    expect(record.persistenceAllowed).toBe(false);
    expect(record.schedulingAllowed).toBe(false);
    expect(record.validation.reasonCodes).toContain("RESULT_IS_NOT_DECISION");
  });

  it("does not mutate sealed inputs", () => {
    const input = resultInput();
    const before = JSON.stringify(input);

    sealSimulationResultModel(input);

    expect(JSON.stringify(input)).toBe(before);
  });
});
