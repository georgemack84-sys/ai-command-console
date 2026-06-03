import { describe, expect, it } from "vitest";
import {
  buildSimulationCertificationRequest,
  sealAlternatePathAnalysis,
  sealBranchReplay,
  sealGovernanceForecast,
  sealIntentSimulationCertification,
  sealSimulationBoundaryContract,
  sealSimulationReplayLedger,
  sealSimulationResultModel,
  sealSimulationSandbox,
  type AlternatePathRequest,
  type IntentSimulationCertificationInput,
  type SealedGovernanceForecastRecord,
  type SealedSimulationReplayLedgerRecord,
  type SealedSimulationResultModelRecord,
  type SealedSimulationSandboxRecord,
  type SimulationBoundaryContractInput,
} from "@/services/simulation-engine";

function boundaryInput(overrides: Partial<SimulationBoundaryContractInput> = {}): SimulationBoundaryContractInput {
  return Object.freeze({
    simulationId: "simulation-54h",
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
    createdAt: "2026-06-02T21:00:00.000Z",
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
      simulationId: "simulation-54h",
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
    sandboxId: "sandbox-54h",
    tenantId: "tenant-alpha",
    contractId: contract.contract.immutableHash,
    sealedContract: contract,
    branchReplay: replay,
    permittedResources: ["certification-inspector"],
    createdAt: "2026-06-02T21:05:00.000Z",
    isolationLevel: "STRICT",
  });
  const forecastA = sealGovernanceForecast({
    request: {
      simulationId: "simulation-54h",
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
      simulationId: "simulation-54h",
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
      simulationId: "simulation-54h",
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
    simulationId: "simulation-54h",
    tenantId: "tenant-alpha",
    createdAt: "2026-06-02T21:10:00.000Z",
    sealedContract: contract,
    branchReplays: [replay],
    sandboxes: [sandbox],
    forecasts,
    analyses,
  });
  const resultModel = sealSimulationResultModel({
    simulationId: "simulation-54h",
    tenantId: "tenant-alpha",
    createdAt: "2026-06-02T21:15:00.000Z",
    resultVersion: "simulation-result-model/v1",
    sealedContract: contract,
    branchReplays: [replay],
    sandboxes: [sandbox],
    forecasts,
    analyses,
    replayLedger: ledger,
    evidenceReferences: ["operator-review-note"],
  });

  return { contract, replay, sandbox, forecasts, analyses, ledger, resultModel };
}

function certificationInput(overrides: Partial<IntentSimulationCertificationInput> = {}): IntentSimulationCertificationInput {
  const chain = buildSealedChain();
  const base = {
    sealedContract: chain.contract,
    branchReplays: [chain.replay],
    sandboxes: [chain.sandbox],
    forecasts: chain.forecasts,
    analyses: chain.analyses,
    replayLedger: chain.ledger,
    resultModel: chain.resultModel,
  };
  const request = buildSimulationCertificationRequest(base);

  return Object.freeze({
    request,
    ...base,
    ...overrides,
  } satisfies IntentSimulationCertificationInput);
}

describe("intentSimulationCertificationGate", () => {
  it("passes when all sealed validations pass", () => {
    const input = certificationInput();
    const first = sealIntentSimulationCertification(input);
    const second = sealIntentSimulationCertification(input);

    expect(first).toEqual(second);
    expect(first.result.certificationStatus).toBe("PASS");
    expect(first.result.certificationHash).toHaveLength(64);
    expect(first.result.deterministicReplay).toBe(true);
    expect(first.result.containmentVerified).toBe(true);
    expect(first.result.governanceVerified).toBe(true);
    expect(first.result.lineageIntegrity).toBe(true);
    expect(first.result.tenantIsolationVerified).toBe(true);
    expect(first.result.authorityBounded).toBe(true);
  });

  it("fails unsealed artifacts", () => {
    const chain = buildSealedChain();
    const unsealedResult = {
      ...chain.resultModel,
      sealed: false as unknown as true,
    } satisfies SealedSimulationResultModelRecord;
    const record = sealIntentSimulationCertification(certificationInput({
      resultModel: unsealedResult,
    }));

    expect(record.result.certificationStatus).toBe("FAIL");
    expect(record.validation.reasonCodes).toContain("ARTIFACT_UNSEALED");
  });

  it("fails lineage corruption and missing lineage references", () => {
    const missingReferences = sealIntentSimulationCertification(certificationInput({
      request: {
        ...certificationInput().request,
        lineageReferences: [],
      },
    }));
    const chain = buildSealedChain();
    const brokenLedger = {
      ...chain.ledger,
      validation: {
        ...chain.ledger.validation,
        lineageIntegrity: false,
      },
    } satisfies SealedSimulationReplayLedgerRecord;
    const corrupted = sealIntentSimulationCertification(certificationInput({
      replayLedger: brokenLedger,
    }));

    expect(missingReferences.result.certificationStatus).toBe("FAIL");
    expect(missingReferences.validation.reasonCodes).toContain("LINEAGE_REFERENCES_MISSING");
    expect(corrupted.result.certificationStatus).toBe("FAIL");
    expect(corrupted.validation.reasonCodes).toContain("LINEAGE_INTEGRITY_FAILED");
  });

  it("fails hash mismatch", () => {
    const record = sealIntentSimulationCertification(certificationInput({
      request: {
        ...certificationInput().request,
        resultHash: "bad-result-hash",
      },
    }));

    expect(record.result.certificationStatus).toBe("FAIL");
    expect(record.validation.reasonCodes).toContain("ARTIFACT_HASH_MISMATCH");
  });

  it("fails sandbox containment failure and runtime access", () => {
    const chain = buildSealedChain();
    const badSandbox = {
      ...chain.sandbox,
      result: {
        ...chain.sandbox.result,
        sandboxStatus: "FREEZE" as const,
      },
      runtimeAccessAllowed: true as false,
    } satisfies SealedSimulationSandboxRecord;
    const record = sealIntentSimulationCertification(certificationInput({
      sandboxes: [badSandbox],
    }));

    expect(record.result.certificationStatus).toBe("FAIL");
    expect(record.result.containmentVerified).toBe(false);
    expect(record.validation.reasonCodes).toContain("CONTAINMENT_FAILED");
  });

  it("fails unreproducible replay", () => {
    const chain = buildSealedChain();
    const badLedger = {
      ...chain.ledger,
      bundle: {
        ...chain.ledger.bundle,
        replayable: false,
      },
    } satisfies SealedSimulationReplayLedgerRecord;
    const record = sealIntentSimulationCertification(certificationInput({
      replayLedger: badLedger,
    }));

    expect(record.result.certificationStatus).toBe("FAIL");
    expect(record.result.deterministicReplay).toBe(false);
    expect(record.validation.reasonCodes).toContain("DETERMINISTIC_REPLAY_FAILED");
  });

  it("conditionally passes missing governance version only when bounded", () => {
    const chain = buildSealedChain();
    const missingGovernanceResult = {
      ...chain.resultModel,
      result: {
        ...chain.resultModel.result,
        governanceVersion: "",
        resultStatus: "ESCALATE" as const,
      },
    } satisfies SealedSimulationResultModelRecord;
    const base = certificationInput({
      resultModel: missingGovernanceResult,
    });
    const record = sealIntentSimulationCertification({
      ...base,
      request: {
        ...base.request,
        governanceVersion: "",
      },
    });

    expect(record.result.certificationStatus).toBe("CONDITIONAL_PASS");
    expect(record.result.authorityBounded).toBe(true);
    expect(record.validation.reasonCodes).toContain("GOVERNANCE_VERSION_MISSING");
  });

  it("fails governance violations and forecast authority", () => {
    const chain = buildSealedChain();
    const authorityForecast = {
      ...chain.forecasts[0],
      approvalAuthorized: true as false,
    } satisfies SealedGovernanceForecastRecord;
    const record = sealIntentSimulationCertification(certificationInput({
      forecasts: [authorityForecast],
    }));

    expect(record.result.certificationStatus).toBe("FAIL");
    expect(record.result.governanceVerified).toBe(false);
    expect(record.validation.reasonCodes).toContain("GOVERNANCE_VIOLATION");
  });

  it("detects cross-tenant leakage", () => {
    const record = sealIntentSimulationCertification(certificationInput({
      request: {
        ...certificationInput().request,
        tenantId: "tenant-beta",
      },
    }));

    expect(record.result.certificationStatus).toBe("FAIL");
    expect(record.result.tenantIsolationVerified).toBe(false);
    expect(record.validation.reasonCodes).toContain("CROSS_TENANT_LEAKAGE");
  });

  it("fails authority expansion", () => {
    const chain = buildSealedChain();
    const authorityResult = {
      ...chain.resultModel,
      decisionAuthorized: true as false,
    } satisfies SealedSimulationResultModelRecord;
    const record = sealIntentSimulationCertification(certificationInput({
      resultModel: authorityResult,
    }));

    expect(record.result.certificationStatus).toBe("FAIL");
    expect(record.result.authorityBounded).toBe(false);
    expect(record.validation.reasonCodes).toContain("AUTHORITY_EXPANSION_DETECTED");
  });

  it("keeps certification read-only with no repair or remediation authority", () => {
    const record = sealIntentSimulationCertification(certificationInput());

    expect(record.readOnly).toBe(true);
    expect(record.certificationOnly).toBe(true);
    expect(record.executionAuthorized).toBe(false);
    expect(record.repairAuthorized).toBe(false);
    expect(record.approvalAuthorized).toBe(false);
    expect(record.remediationAllowed).toBe(false);
    expect(record.workflowMutationAllowed).toBe(false);
    expect(record.governanceMutationAllowed).toBe(false);
    expect(record.authorityMutationAllowed).toBe(false);
    expect(record.persistenceAllowed).toBe(false);
    expect(record.schedulingAllowed).toBe(false);
    expect(record.validation.reasonCodes).toContain("CERTIFICATION_IS_NOT_CONTROL");
    expect(record.validation.reasonCodes).toContain("NO_REMEDIATION_AUTHORITY");
  });

  it("exposes certification observability without controls", () => {
    const record = sealIntentSimulationCertification(certificationInput());

    expect(record.observability).toEqual({
      certificationId: record.result.certificationId,
      certificationStatus: "PASS",
      deterministicReplay: true,
      containmentVerified: true,
      governanceVerified: true,
      authorityBounded: true,
      certificationHash: record.result.certificationHash,
    });
  });

  it("does not mutate sealed inputs", () => {
    const input = certificationInput();
    const before = JSON.stringify(input);

    sealIntentSimulationCertification(input);

    expect(JSON.stringify(input)).toBe(before);
  });
});
