import { describe, expect, it } from "vitest";
import {
  buildSimulationReconstructionHash,
  sealAlternatePathAnalysis,
  sealBranchReplay,
  sealGovernanceForecast,
  sealSimulationBoundaryContract,
  sealSimulationReplayLedger,
  sealSimulationSandbox,
  type AlternatePathRequest,
  type SealedAlternatePathAnalysisRecord,
  type SealedBranchReplayRecord,
  type SimulationBoundaryContractInput,
  type SimulationReplayLedgerInput,
} from "@/services/simulation-engine";

function boundaryInput(overrides: Partial<SimulationBoundaryContractInput> = {}): SimulationBoundaryContractInput {
  return Object.freeze({
    simulationId: "simulation-54f",
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
    createdAt: "2026-06-02T19:00:00.000Z",
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
      simulationId: "simulation-54f",
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
    sandboxId: "sandbox-54f",
    tenantId: "tenant-alpha",
    contractId: contract.contract.immutableHash,
    sealedContract: contract,
    branchReplay: replay,
    permittedResources: ["ledger-inspector"],
    createdAt: "2026-06-02T19:05:00.000Z",
    isolationLevel: "STRICT",
  });
  const forecastA = sealGovernanceForecast({
    request: {
      simulationId: "simulation-54f",
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
      simulationId: "simulation-54f",
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
    approvalComplexity: 0.3,
  });
  const forecasts = [forecastA, forecastB] as const;

  function analysisRequest(overrides: Partial<AlternatePathRequest> = {}): AlternatePathRequest {
    return {
      simulationId: "simulation-54f",
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
      analysisType: "OUTCOME_DIFFERENTIATION",
    }),
    sealedContract: contract,
    branchReplays: [replay],
    sandboxes: [sandbox],
    forecasts,
    tenantId: "tenant-alpha",
  });

  return { contract, replay, sandbox, forecasts, analyses: [analysisA, analysisB] as const };
}

function ledgerInput(overrides: Partial<SimulationReplayLedgerInput> = {}): SimulationReplayLedgerInput {
  const chain = buildSealedChain();

  return Object.freeze({
    simulationId: "simulation-54f",
    tenantId: "tenant-alpha",
    createdAt: "2026-06-02T19:10:00.000Z",
    sealedContract: chain.contract,
    branchReplays: [chain.replay],
    sandboxes: [chain.sandbox],
    forecasts: chain.forecasts,
    analyses: chain.analyses,
    ...overrides,
  } satisfies SimulationReplayLedgerInput);
}

describe("simulationReplayLedger", () => {
  it("produces deterministic ledger entries and replay bundles", () => {
    const input = ledgerInput();
    const first = sealSimulationReplayLedger(input);
    const second = sealSimulationReplayLedger(input);

    expect(first).toEqual(second);
    expect(first.bundle.bundleStatus).toBe("PASS");
    expect(first.entries).toHaveLength(2);
    expect(first.entries[0]?.immutableHash).toHaveLength(64);
    expect(first.bundle.reconstructionHash).toHaveLength(64);
    expect(first.bundle.replayable).toBe(true);
  });

  it("preserves deterministic ordering even when artifact arrays are shuffled", () => {
    const chain = buildSealedChain();
    const first = sealSimulationReplayLedger(ledgerInput({
      forecasts: [chain.forecasts[1], chain.forecasts[0]],
      analyses: [chain.analyses[1], chain.analyses[0]],
    }));
    const second = sealSimulationReplayLedger(ledgerInput({
      forecasts: [chain.forecasts[0], chain.forecasts[1]],
      analyses: [chain.analyses[0], chain.analyses[1]],
    }));

    expect(first.entries.map((entry) => entry.ledgerId)).toEqual(second.entries.map((entry) => entry.ledgerId));
    expect(first.bundle.reconstructionHash).toBe(second.bundle.reconstructionHash);
  });

  it("preserves lineage and cross-phase references", () => {
    const record = sealSimulationReplayLedger(ledgerInput());

    expect(record.validation.lineageIntegrity).toBe(true);
    expect(record.validation.reasonCodes).toContain("LINEAGE_INTEGRITY_VALID");
    expect(record.entries[0]?.contractHash).toBe(record.entries[1]?.contractHash);
    expect(record.entries.every((entry) => entry.lineageHash.length === 64)).toBe(true);
  });

  it("blocks cross-tenant artifacts and preserves tenant boundaries", () => {
    const record = sealSimulationReplayLedger(ledgerInput({
      tenantId: "tenant-beta",
    }));

    expect(record.bundle.bundleStatus).toBe("FREEZE");
    expect(record.validation.tenantBoundaryPreserved).toBe(false);
    expect(record.validation.reasonCodes).toContain("CROSS_TENANT_ARTIFACTS_BLOCKED");
  });

  it("freezes unsealed artifacts", () => {
    const chain = buildSealedChain();
    const unsealedReplay = {
      ...chain.replay,
      sealed: false as unknown as true,
    } satisfies SealedBranchReplayRecord;
    const record = sealSimulationReplayLedger(ledgerInput({
      branchReplays: [unsealedReplay],
    }));

    expect(record.bundle.bundleStatus).toBe("FREEZE");
    expect(record.validation.reasonCodes).toContain("REPLAY_ARTIFACT_UNSEALED");
  });

  it("freezes lineage corruption", () => {
    const chain = buildSealedChain();
    const corruptedAnalysis = {
      ...chain.analyses[0],
      validation: {
        ...chain.analyses[0].validation,
        reasonCodes: chain.analyses[0].validation.reasonCodes.filter((reason) => reason !== "LINEAGE_PRESENT"),
      },
    } satisfies SealedAlternatePathAnalysisRecord;
    const record = sealSimulationReplayLedger(ledgerInput({
      analyses: [corruptedAnalysis],
    }));

    expect(record.bundle.bundleStatus).toBe("FREEZE");
    expect(record.validation.lineageIntegrity).toBe(false);
    expect(record.validation.reasonCodes).toContain("LINEAGE_INTEGRITY_FAILED");
  });

  it("enforces deterministic replay ordering", () => {
    const record = sealSimulationReplayLedger(ledgerInput({
      replayOrder: ["unexpected-analysis-id"],
    }));

    expect(record.bundle.bundleStatus).toBe("FREEZE");
    expect(record.validation.replayOrderValid).toBe(false);
    expect(record.validation.reasonCodes).toContain("REPLAY_ORDER_INVALID");
  });

  it("escalates when governance version is missing from the sealed lineage", () => {
    const chain = buildSealedChain();
    const missingGovernance = {
      ...chain.contract,
      contract: {
        ...chain.contract.contract,
        governanceVersion: "",
      },
    };
    const record = sealSimulationReplayLedger(ledgerInput({
      sealedContract: missingGovernance,
    }));

    expect(record.bundle.bundleStatus).toBe("ESCALATE");
    expect(record.validation.reasonCodes).toContain("GOVERNANCE_VERSION_MISSING");
  });

  it("freezes reconstruction hash mismatch", () => {
    const record = sealSimulationReplayLedger(ledgerInput({
      expectedReconstructionHash: "bad-reconstruction-hash",
    }));

    expect(record.bundle.bundleStatus).toBe("FREEZE");
    expect(record.validation.reconstructionHashValid).toBe(false);
    expect(record.validation.reasonCodes).toContain("RECONSTRUCTION_HASH_MISMATCH");
  });

  it("reconstructs replay bundles reproducibly from sealed entries", () => {
    const record = sealSimulationReplayLedger(ledgerInput());
    const reconstructed = buildSimulationReconstructionHash(record.entries);

    expect(reconstructed).toBe(record.bundle.reconstructionHash);
    expect(record.bundle.ledgerEntries).toEqual(record.entries.map((entry) => entry.ledgerId));
  });

  it("exposes observability without controls or mutation capability", () => {
    const record = sealSimulationReplayLedger(ledgerInput());

    expect(record.observability).toEqual({
      ledgerId: record.entries[0]?.ledgerId,
      simulationId: "simulation-54f",
      replayOrder: 1,
      reconstructionHash: record.bundle.reconstructionHash,
      lineageIntegrity: true,
      bundleStatus: "PASS",
    });
    expect(record.readOnly).toBe(true);
    expect(record.advisoryOnly).toBe(true);
    expect(record.executionAuthorized).toBe(false);
    expect(record.workflowMutationAllowed).toBe(false);
    expect(record.authorityMutationAllowed).toBe(false);
    expect(record.persistenceAllowed).toBe(false);
    expect(record.schedulingAllowed).toBe(false);
  });

  it("does not mutate sealed inputs", () => {
    const input = ledgerInput();
    const before = JSON.stringify(input);

    sealSimulationReplayLedger(input);

    expect(JSON.stringify(input)).toBe(before);
  });
});
