import { describe, expect, it } from "vitest";
import {
  buildCertificationReplayRequest,
  buildSimulationCertificationRequest,
  sealAlternatePathAnalysis,
  sealBranchReplay,
  sealCertificationReplay,
  sealGovernanceForecast,
  sealIntentSimulationCertification,
  sealSimulationBoundaryContract,
  sealSimulationReplayLedger,
  sealSimulationResultModel,
  sealSimulationSandbox,
  type AlternatePathRequest,
  type CertificationReplayInput,
  type IntentSimulationCertificationInput,
  type SealedIntentSimulationCertificationRecord,
  type SealedSimulationReplayLedgerRecord,
  type SimulationBoundaryContractInput,
} from "@/services/simulation-engine";

function boundaryInput(overrides: Partial<SimulationBoundaryContractInput> = {}): SimulationBoundaryContractInput {
  return Object.freeze({
    simulationId: "simulation-54i",
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
    createdAt: "2026-06-03T01:00:00.000Z",
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
      simulationId: "simulation-54i",
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
    sandboxId: "sandbox-54i",
    tenantId: "tenant-alpha",
    contractId: contract.contract.immutableHash,
    sealedContract: contract,
    branchReplay: replay,
    permittedResources: ["certification-replay-inspector"],
    createdAt: "2026-06-03T01:05:00.000Z",
    isolationLevel: "STRICT",
  });
  const forecastA = sealGovernanceForecast({
    request: {
      simulationId: "simulation-54i",
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
      simulationId: "simulation-54i",
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
    approvalComplexity: 0.2,
  });
  const forecasts = [forecastA, forecastB] as const;

  function analysisRequest(overrides: Partial<AlternatePathRequest> = {}): AlternatePathRequest {
    return {
      simulationId: "simulation-54i",
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
  const analyses = [analysisA, analysisB] as const;
  const ledger = sealSimulationReplayLedger({
    simulationId: "simulation-54i",
    tenantId: "tenant-alpha",
    createdAt: "2026-06-03T01:10:00.000Z",
    sealedContract: contract,
    branchReplays: [replay],
    sandboxes: [sandbox],
    forecasts,
    analyses,
  });
  const resultModel = sealSimulationResultModel({
    simulationId: "simulation-54i",
    tenantId: "tenant-alpha",
    createdAt: "2026-06-03T01:15:00.000Z",
    resultVersion: "simulation-result-model/v1",
    sealedContract: contract,
    branchReplays: [replay],
    sandboxes: [sandbox],
    forecasts,
    analyses,
    replayLedger: ledger,
    evidenceReferences: ["operator-review-note"],
  });
  const certificationBase = {
    sealedContract: contract,
    branchReplays: [replay],
    sandboxes: [sandbox],
    forecasts,
    analyses,
    replayLedger: ledger,
    resultModel,
  } satisfies Omit<IntentSimulationCertificationInput, "request">;
  const certificationRequest = buildSimulationCertificationRequest(certificationBase);
  const certification = sealIntentSimulationCertification({
    request: certificationRequest,
    ...certificationBase,
  });

  return { contract, replay, sandbox, forecasts, analyses, ledger, resultModel, certification, certificationRequest };
}

function replayInput(overrides: Partial<CertificationReplayInput> = {}): CertificationReplayInput {
  const chain = buildSealedChain();
  const request = buildCertificationReplayRequest({
    certification: chain.certification,
    replayLedger: chain.ledger,
    resultModel: chain.resultModel,
    reconstructionMode: "FULL_REPLAY",
    certificationLineageReferences: chain.certificationRequest.lineageReferences,
  });

  return Object.freeze({
    request,
    certification: chain.certification,
    replayLedger: chain.ledger,
    resultModel: chain.resultModel,
    ...overrides,
  } satisfies CertificationReplayInput);
}

describe("simulationCertificationReplayFramework", () => {
  it("produces deterministic replay outputs for identical inputs", () => {
    const input = replayInput();
    const first = sealCertificationReplay(input);
    const second = sealCertificationReplay(input);

    expect(first).toEqual(second);
    expect(first.result.replayStatus).toBe("PASS");
    expect(first.result.reconstructedHash).toBe(input.certification.result.certificationHash);
    expect(first.result.replayable).toBe(true);
    expect(first.result.replayId).toHaveLength(64);
  });

  it("supports deterministic lineage and hash replay modes", () => {
    const chain = buildSealedChain();
    const lineage = sealCertificationReplay(replayInput({
      request: buildCertificationReplayRequest({
        certification: chain.certification,
        replayLedger: chain.ledger,
        resultModel: chain.resultModel,
        reconstructionMode: "LINEAGE_REPLAY",
        certificationLineageReferences: chain.certificationRequest.lineageReferences,
      }),
    }));
    const hash = sealCertificationReplay(replayInput({
      request: buildCertificationReplayRequest({
        certification: chain.certification,
        replayLedger: chain.ledger,
        resultModel: chain.resultModel,
        reconstructionMode: "HASH_REPLAY",
        certificationLineageReferences: chain.certificationRequest.lineageReferences,
      }),
    }));

    expect(lineage.result.replayStatus).toBe("PASS");
    expect(hash.result.replayStatus).toBe("PASS");
    expect(lineage.result.reconstructedHash).toBe(hash.result.reconstructedHash);
  });

  it("fails hash mismatch", () => {
    const record = sealCertificationReplay(replayInput({
      request: {
        ...replayInput().request,
        certificationHash: "bad-certification-hash",
      },
    }));

    expect(record.result.replayStatus).toBe("FAIL");
    expect(record.validation.reasonCodes).toContain("RECONSTRUCTED_HASH_MISMATCH");
  });

  it("escalates missing replay evidence without recertifying", () => {
    const chain = buildSealedChain();
    const missingEvidenceLedger = {
      ...chain.ledger,
      entries: [],
      bundle: {
        ...chain.ledger.bundle,
        ledgerEntries: [],
      },
    } satisfies SealedSimulationReplayLedgerRecord;
    const record = sealCertificationReplay(replayInput({
      replayLedger: missingEvidenceLedger,
    }));

    expect(record.result.replayStatus).toBe("ESCALATE");
    expect(record.validation.reasonCodes).toContain("REPLAY_EVIDENCE_MISSING");
    expect(record.recertificationAllowed).toBe(false);
  });

  it("fails unsealed certification artifacts", () => {
    const chain = buildSealedChain();
    const unsealedCertification = {
      ...chain.certification,
      sealed: false as unknown as true,
    } satisfies SealedIntentSimulationCertificationRecord;
    const record = sealCertificationReplay(replayInput({
      certification: unsealedCertification,
    }));

    expect(record.result.replayStatus).toBe("FAIL");
    expect(record.validation.reasonCodes).toContain("CERTIFICATION_ARTIFACT_UNSEALED");
  });

  it("fails lineage corruption and replay reference mutation", () => {
    const missingLineage = sealCertificationReplay(replayInput({
      request: {
        ...replayInput().request,
        lineageReferences: [],
      },
    }));
    const chain = buildSealedChain();
    const brokenCertification = {
      ...chain.certification,
      validation: {
        ...chain.certification.validation,
        lineageIntegrity: false,
      },
    } satisfies SealedIntentSimulationCertificationRecord;
    const corrupted = sealCertificationReplay(replayInput({
      certification: brokenCertification,
    }));

    expect(missingLineage.result.replayStatus).toBe("FAIL");
    expect(missingLineage.validation.reasonCodes).toContain("REPLAY_REFERENCES_MUTATED");
    expect(corrupted.result.replayStatus).toBe("FAIL");
    expect(corrupted.validation.reasonCodes).toContain("LINEAGE_INTEGRITY_FAILED");
  });

  it("blocks cross-tenant replay", () => {
    const record = sealCertificationReplay(replayInput({
      request: {
        ...replayInput().request,
        tenantId: "tenant-beta",
      },
    }));

    expect(record.result.replayStatus).toBe("FAIL");
    expect(record.validation.tenantBoundaryPreserved).toBe(false);
    expect(record.validation.reasonCodes).toContain("CROSS_TENANT_REFERENCES_BLOCKED");
  });

  it("preserves certification artifacts as immutable inputs", () => {
    const input = replayInput();
    const before = JSON.stringify(input.certification);

    sealCertificationReplay(input);

    expect(JSON.stringify(input.certification)).toBe(before);
  });

  it("exposes read-only observability without controls", () => {
    const record = sealCertificationReplay(replayInput());

    expect(record.observability).toEqual({
      replayId: record.result.replayId,
      certificationId: record.result.certificationId,
      replayStatus: "PASS",
      replayable: true,
      lineageIntegrity: true,
      reconstructedHash: record.result.reconstructedHash,
    });
    expect(record.readOnly).toBe(true);
    expect(record.replayOnly).toBe(true);
    expect(record.recertificationAllowed).toBe(false);
    expect(record.artifactMutationAllowed).toBe(false);
    expect(record.lineageMutationAllowed).toBe(false);
    expect(record.executionAuthorized).toBe(false);
    expect(record.workflowMutationAllowed).toBe(false);
    expect(record.governanceMutationAllowed).toBe(false);
    expect(record.authorityMutationAllowed).toBe(false);
    expect(record.remediationAllowed).toBe(false);
    expect(record.persistenceAllowed).toBe(false);
    expect(record.schedulingAllowed).toBe(false);
    expect(record.validation.reasonCodes).toContain("REPLAY_IS_NOT_RECERTIFICATION");
  });

  it("does not mutate replay inputs", () => {
    const input = replayInput();
    const before = JSON.stringify(input);

    sealCertificationReplay(input);

    expect(JSON.stringify(input)).toBe(before);
  });
});
