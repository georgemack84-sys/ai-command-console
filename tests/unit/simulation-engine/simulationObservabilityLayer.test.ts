import { describe, expect, it } from "vitest";
import {
  buildCertificationReplayRequest,
  buildSimulationCertificationRequest,
  buildSimulationObservabilityRequest,
  sealAlternatePathAnalysis,
  sealBranchReplay,
  sealCertificationReplay,
  sealGovernanceForecast,
  sealIntentSimulationCertification,
  sealSimulationBoundaryContract,
  sealSimulationObservability,
  sealSimulationReplayLedger,
  sealSimulationResultModel,
  sealSimulationSandbox,
  type AlternatePathRequest,
  type IntentSimulationCertificationInput,
  type SealedCertificationReplayRecord,
  type SealedIntentSimulationCertificationRecord,
  type SealedSimulationSandboxRecord,
  type SimulationBoundaryContractInput,
  type SimulationObservabilityInput,
} from "@/services/simulation-engine";

function boundaryInput(overrides: Partial<SimulationBoundaryContractInput> = {}): SimulationBoundaryContractInput {
  return Object.freeze({
    simulationId: "simulation-54j",
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
    createdAt: "2026-06-03T02:00:00.000Z",
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
      simulationId: "simulation-54j",
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
    sandboxId: "sandbox-54j",
    tenantId: "tenant-alpha",
    contractId: contract.contract.immutableHash,
    sealedContract: contract,
    branchReplay: replay,
    permittedResources: ["observability-inspector"],
    createdAt: "2026-06-03T02:05:00.000Z",
    isolationLevel: "STRICT",
  });
  const forecastA = sealGovernanceForecast({
    request: {
      simulationId: "simulation-54j",
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
      simulationId: "simulation-54j",
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
      simulationId: "simulation-54j",
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
    simulationId: "simulation-54j",
    tenantId: "tenant-alpha",
    createdAt: "2026-06-03T02:10:00.000Z",
    sealedContract: contract,
    branchReplays: [replay],
    sandboxes: [sandbox],
    forecasts,
    analyses,
  });
  const resultModel = sealSimulationResultModel({
    simulationId: "simulation-54j",
    tenantId: "tenant-alpha",
    createdAt: "2026-06-03T02:15:00.000Z",
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
  const certificationReplay = sealCertificationReplay({
    request: buildCertificationReplayRequest({
      certification,
      replayLedger: ledger,
      resultModel,
      reconstructionMode: "FULL_REPLAY",
      certificationLineageReferences: certificationRequest.lineageReferences,
    }),
    certification,
    replayLedger: ledger,
    resultModel,
  });

  return { contract, replay, sandbox, forecasts, analyses, ledger, resultModel, certification, certificationReplay };
}

function observabilityInput(overrides: Partial<SimulationObservabilityInput> = {}): SimulationObservabilityInput {
  const chain = buildSealedChain();
  const base = {
    sealedContract: chain.contract,
    branchReplays: [chain.replay],
    sandboxes: [chain.sandbox],
    forecasts: chain.forecasts,
    analyses: chain.analyses,
    replayLedger: chain.ledger,
    resultModel: chain.resultModel,
    certification: chain.certification,
    certificationReplay: chain.certificationReplay,
  };
  const request = buildSimulationObservabilityRequest({
    ...base,
    visibilityScope: "FULL",
  });

  return Object.freeze({
    request,
    ...base,
    ...overrides,
  } satisfies SimulationObservabilityInput);
}

describe("simulationObservabilityLayer", () => {
  it("produces deterministic full visibility projections", () => {
    const input = observabilityInput();
    const first = sealSimulationObservability(input);
    const second = sealSimulationObservability(input);

    expect(first).toEqual(second);
    expect(first.result.observabilityState).toBe("HEALTHY");
    expect(first.result.replayVisible).toBe(true);
    expect(first.result.lineageVisible).toBe(true);
    expect(first.result.certificationVisible).toBe(true);
    expect(first.result.containmentVisible).toBe(true);
    expect(first.result.reconstructionVisible).toBe(true);
    expect(first.result.observabilityHash).toHaveLength(64);
  });

  it("keeps visibility scopes stable", () => {
    const chain = buildSealedChain();
    const base = observabilityInput();
    const health = sealSimulationObservability({
      ...base,
      request: buildSimulationObservabilityRequest({
        sealedContract: chain.contract,
        branchReplays: [chain.replay],
        sandboxes: [chain.sandbox],
        forecasts: chain.forecasts,
        analyses: chain.analyses,
        replayLedger: chain.ledger,
        resultModel: chain.resultModel,
        certification: chain.certification,
        certificationReplay: chain.certificationReplay,
        visibilityScope: "HEALTH",
      }),
    });
    const containment = sealSimulationObservability({
      ...base,
      request: buildSimulationObservabilityRequest({
        sealedContract: chain.contract,
        branchReplays: [chain.replay],
        sandboxes: [chain.sandbox],
        forecasts: chain.forecasts,
        analyses: chain.analyses,
        replayLedger: chain.ledger,
        resultModel: chain.resultModel,
        certification: chain.certification,
        certificationReplay: chain.certificationReplay,
        visibilityScope: "CONTAINMENT",
      }),
    });

    expect(health.result.lineageVisible).toBe(false);
    expect(health.result.certificationVisible).toBe(false);
    expect(containment.result.containmentVisible).toBe(true);
    expect(containment.result.certificationVisible).toBe(false);
  });

  it("blocks cross-tenant visibility", () => {
    const record = sealSimulationObservability(observabilityInput({
      request: {
        ...observabilityInput().request,
        tenantId: "tenant-beta",
      },
    }));

    expect(record.result.observabilityState).toBe("FROZEN");
    expect(record.validation.reasonCodes).toContain("CROSS_TENANT_ARTIFACTS_BLOCKED");
  });

  it("freezes unsealed artifacts", () => {
    const chain = buildSealedChain();
    const unsealedReplay = {
      ...chain.certificationReplay,
      sealed: false as unknown as true,
    } satisfies SealedCertificationReplayRecord;
    const record = sealSimulationObservability(observabilityInput({
      certificationReplay: unsealedReplay,
    }));

    expect(record.result.observabilityState).toBe("FROZEN");
    expect(record.validation.reasonCodes).toContain("ARTIFACT_UNSEALED");
  });

  it("surfaces lineage failures as escalated visibility", () => {
    const chain = buildSealedChain();
    const brokenReplay = {
      ...chain.certificationReplay,
      validation: {
        ...chain.certificationReplay.validation,
        lineageIntegrity: false,
      },
    } satisfies SealedCertificationReplayRecord;
    const record = sealSimulationObservability(observabilityInput({
      certificationReplay: brokenReplay,
    }));

    expect(record.result.observabilityState).toBe("ESCALATED");
    expect(record.result.lineageIntegrity).toBe(false);
    expect(record.validation.reasonCodes).toContain("LINEAGE_INTEGRITY_FAILED");
  });

  it("surfaces containment failures as escalated visibility", () => {
    const chain = buildSealedChain();
    const badSandbox = {
      ...chain.sandbox,
      result: {
        ...chain.sandbox.result,
        sandboxStatus: "FREEZE" as const,
      },
    } satisfies SealedSimulationSandboxRecord;
    const record = sealSimulationObservability(observabilityInput({
      sandboxes: [badSandbox],
    }));

    expect(record.result.observabilityState).toBe("ESCALATED");
    expect(record.validation.reasonCodes).toContain("CONTAINMENT_FAILURE");
  });

  it("surfaces certification failures as limited visibility", () => {
    const chain = buildSealedChain();
    const failedCertification = {
      ...chain.certification,
      result: {
        ...chain.certification.result,
        certificationStatus: "FAIL" as const,
      },
    } satisfies SealedIntentSimulationCertificationRecord;
    const record = sealSimulationObservability(observabilityInput({
      certification: failedCertification,
    }));

    expect(record.result.observabilityState).toBe("LIMITED");
    expect(record.validation.reasonCodes).toContain("CERTIFICATION_FAILURE");
  });

  it("escalates missing artifact references", () => {
    const record = sealSimulationObservability(observabilityInput({
      request: {
        ...observabilityInput().request,
        artifactReferences: [],
      },
    }));

    expect(record.result.observabilityState).toBe("ESCALATED");
    expect(record.validation.reasonCodes).toContain("ARTIFACT_REFERENCES_MISSING");
  });

  it("preserves deterministic artifact ordering in the observability hash", () => {
    const input = observabilityInput();
    const shuffled = sealSimulationObservability({
      ...input,
      request: {
        ...input.request,
        artifactReferences: [...input.request.artifactReferences].reverse(),
      },
    });
    const normal = sealSimulationObservability(input);

    expect(shuffled.result.observabilityHash).toBe(normal.result.observabilityHash);
  });

  it("keeps observability read-only and authority-neutral", () => {
    const record = sealSimulationObservability(observabilityInput());

    expect(record.readOnly).toBe(true);
    expect(record.visibilityOnly).toBe(true);
    expect(record.executionAuthorized).toBe(false);
    expect(record.workflowMutationAllowed).toBe(false);
    expect(record.governanceMutationAllowed).toBe(false);
    expect(record.authorityMutationAllowed).toBe(false);
    expect(record.artifactMutationAllowed).toBe(false);
    expect(record.remediationAllowed).toBe(false);
    expect(record.persistenceAllowed).toBe(false);
    expect(record.schedulingAllowed).toBe(false);
    expect(record.validation.reasonCodes).toContain("OBSERVABILITY_IS_NOT_CONTROL");
  });

  it("does not mutate sealed inputs", () => {
    const input = observabilityInput();
    const before = JSON.stringify(input);

    sealSimulationObservability(input);

    expect(JSON.stringify(input)).toBe(before);
  });
});
