import { describe, expect, it } from "vitest";
import {
  buildCertificationReplayRequest,
  buildSimulationBoundaryVerificationRequest,
  buildSimulationCertificationRequest,
  buildSimulationObservabilityRequest,
  sealAlternatePathAnalysis,
  sealBranchReplay,
  sealCertificationReplay,
  sealGovernanceForecast,
  sealIntentSimulationCertification,
  sealSimulationBoundaryContract,
  sealSimulationBoundaryVerification,
  sealSimulationObservability,
  sealSimulationReplayLedger,
  sealSimulationResultModel,
  sealSimulationSandbox,
  type AlternatePathRequest,
  type IntentSimulationCertificationInput,
  type SealedGovernanceForecastRecord,
  type SealedSimulationBoundaryRecord,
  type SealedSimulationObservabilityRecord,
  type SealedSimulationReplayLedgerRecord,
  type SealedSimulationResultModelRecord,
  type SimulationBoundaryContractInput,
  type SimulationBoundaryVerificationInput,
} from "@/services/simulation-engine";

function boundaryInput(overrides: Partial<SimulationBoundaryContractInput> = {}): SimulationBoundaryContractInput {
  return Object.freeze({
    simulationId: "simulation-54k",
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
    createdAt: "2026-06-03T03:00:00.000Z",
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
      simulationId: "simulation-54k",
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
    sandboxId: "sandbox-54k",
    tenantId: "tenant-alpha",
    contractId: contract.contract.immutableHash,
    sealedContract: contract,
    branchReplay: replay,
    permittedResources: ["boundary-verifier"],
    createdAt: "2026-06-03T03:05:00.000Z",
    isolationLevel: "STRICT",
  });
  const forecastA = sealGovernanceForecast({
    request: {
      simulationId: "simulation-54k",
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
      simulationId: "simulation-54k",
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
      simulationId: "simulation-54k",
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
    simulationId: "simulation-54k",
    tenantId: "tenant-alpha",
    createdAt: "2026-06-03T03:10:00.000Z",
    sealedContract: contract,
    branchReplays: [replay],
    sandboxes: [sandbox],
    forecasts,
    analyses,
  });
  const resultModel = sealSimulationResultModel({
    simulationId: "simulation-54k",
    tenantId: "tenant-alpha",
    createdAt: "2026-06-03T03:15:00.000Z",
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
  const observabilityBase = {
    sealedContract: contract,
    branchReplays: [replay],
    sandboxes: [sandbox],
    forecasts,
    analyses,
    replayLedger: ledger,
    resultModel,
    certification,
    certificationReplay,
  };
  const observability = sealSimulationObservability({
    request: buildSimulationObservabilityRequest({
      ...observabilityBase,
      visibilityScope: "FULL",
    }),
    ...observabilityBase,
  });

  return { contract, replay, sandbox, forecasts, analyses, ledger, resultModel, certification, certificationReplay, observability };
}

function verificationInput(overrides: Partial<SimulationBoundaryVerificationInput> = {}): SimulationBoundaryVerificationInput {
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
    observability: chain.observability,
  };
  const request = buildSimulationBoundaryVerificationRequest({
    ...base,
    verificationId: "verification-54k",
    verificationScope: "FULL",
  });

  return Object.freeze({
    request,
    ...base,
    ...overrides,
  } satisfies SimulationBoundaryVerificationInput);
}

describe("simulationBoundaryVerificationHarness", () => {
  it("passes when all simulation boundaries remain sealed and contained", () => {
    const input = verificationInput();
    const first = sealSimulationBoundaryVerification(input);
    const second = sealSimulationBoundaryVerification(input);

    expect(first).toEqual(second);
    expect(first.result.verificationStatus).toBe("PASS");
    expect(first.result.executionBoundaryVerified).toBe(true);
    expect(first.result.mutationBoundaryVerified).toBe(true);
    expect(first.result.authorityBoundaryVerified).toBe(true);
    expect(first.result.governanceBoundaryVerified).toBe(true);
    expect(first.result.observabilityBoundaryVerified).toBe(true);
    expect(first.result.verificationHash).toHaveLength(64);
  });

  it("blocks execution paths and scheduler access", () => {
    const chain = buildSealedChain();
    const executionContract = {
      ...chain.contract,
      executionAuthorized: true as false,
    } satisfies SealedSimulationBoundaryRecord;
    const record = sealSimulationBoundaryVerification(verificationInput({
      sealedContract: executionContract,
    }));

    expect(record.result.verificationStatus).toBe("BLOCK");
    expect(record.result.executionBoundaryVerified).toBe(false);
    expect(record.validation.reasonCodes).toContain("EXECUTION_PATH_DETECTED");
  });

  it("blocks mutation paths across artifacts", () => {
    const chain = buildSealedChain();
    const mutableLedger = {
      ...chain.ledger,
      persistenceAllowed: true as false,
    } satisfies SealedSimulationReplayLedgerRecord;
    const record = sealSimulationBoundaryVerification(verificationInput({
      replayLedger: mutableLedger,
    }));

    expect(record.result.verificationStatus).toBe("BLOCK");
    expect(record.result.mutationBoundaryVerified).toBe(false);
    expect(record.validation.reasonCodes).toContain("MUTATION_PATH_DETECTED");
  });

  it("freezes authority expansion", () => {
    const chain = buildSealedChain();
    const authorityResult = {
      ...chain.resultModel,
      recommendationAllowed: true as false,
    } satisfies SealedSimulationResultModelRecord;
    const record = sealSimulationBoundaryVerification(verificationInput({
      resultModel: authorityResult,
    }));

    expect(record.result.verificationStatus).toBe("FREEZE");
    expect(record.result.authorityBoundaryVerified).toBe(false);
    expect(record.validation.reasonCodes).toContain("AUTHORITY_EXPANSION_DETECTED");
  });

  it("audits governance boundary violations without granting authority", () => {
    const chain = buildSealedChain();
    const governanceForecast = {
      ...chain.forecasts[0],
      validation: {
        ...chain.forecasts[0].validation,
        governanceAuthoritative: false,
      },
    } satisfies SealedGovernanceForecastRecord;
    const record = sealSimulationBoundaryVerification(verificationInput({
      forecasts: [governanceForecast],
    }));

    expect(record.result.verificationStatus).toBe("AUDIT");
    expect(record.result.governanceBoundaryVerified).toBe(false);
    expect(record.validation.reasonCodes).toContain("GOVERNANCE_BOUNDARY_VIOLATION");
  });

  it("blocks observability control paths", () => {
    const chain = buildSealedChain();
    const controlObservability = {
      ...chain.observability,
      remediationAllowed: true as false,
    } satisfies SealedSimulationObservabilityRecord;
    const record = sealSimulationBoundaryVerification(verificationInput({
      observability: controlObservability,
    }));

    expect(record.result.verificationStatus).toBe("BLOCK");
    expect(record.result.observabilityBoundaryVerified).toBe(false);
    expect(record.validation.reasonCodes).toContain("OBSERVABILITY_CONTROL_DETECTED");
  });

  it("freezes unsealed artifacts and cross-tenant artifacts", () => {
    const chain = buildSealedChain();
    const unsealedObservability = {
      ...chain.observability,
      sealed: false as unknown as true,
    } satisfies SealedSimulationObservabilityRecord;
    const unsealed = sealSimulationBoundaryVerification(verificationInput({
      observability: unsealedObservability,
    }));
    const crossTenant = sealSimulationBoundaryVerification(verificationInput({
      request: {
        ...verificationInput().request,
        tenantId: "tenant-beta",
      },
    }));

    expect(unsealed.result.verificationStatus).toBe("FREEZE");
    expect(unsealed.validation.reasonCodes).toContain("ARTIFACT_UNSEALED");
    expect(crossTenant.result.verificationStatus).toBe("FREEZE");
    expect(crossTenant.validation.reasonCodes).toContain("CROSS_TENANT_ARTIFACTS_BLOCKED");
  });

  it("escalates lineage failures and missing references", () => {
    const chain = buildSealedChain();
    const lineageReplay = {
      ...chain.certificationReplay,
      validation: {
        ...chain.certificationReplay.validation,
        lineageIntegrity: false,
      },
    };
    const lineage = sealSimulationBoundaryVerification(verificationInput({
      certificationReplay: lineageReplay,
    }));
    const missingReferences = sealSimulationBoundaryVerification(verificationInput({
      request: {
        ...verificationInput().request,
        artifactReferences: [],
        lineageReferences: [],
      },
    }));

    expect(lineage.result.verificationStatus).toBe("ESCALATE");
    expect(lineage.validation.reasonCodes).toContain("LINEAGE_INTEGRITY_FAILED");
    expect(missingReferences.result.verificationStatus).toBe("ESCALATE");
    expect(missingReferences.validation.reasonCodes).toContain("ARTIFACT_REFERENCES_MISSING");
    expect(missingReferences.validation.reasonCodes).toContain("LINEAGE_REFERENCES_MISSING");
  });

  it("keeps verification scopes deterministic", () => {
    const chain = buildSealedChain();
    const base = verificationInput();
    const execution = sealSimulationBoundaryVerification({
      ...base,
      request: buildSimulationBoundaryVerificationRequest({
        sealedContract: chain.contract,
        branchReplays: [chain.replay],
        sandboxes: [chain.sandbox],
        forecasts: chain.forecasts,
        analyses: chain.analyses,
        replayLedger: chain.ledger,
        resultModel: chain.resultModel,
        certification: chain.certification,
        certificationReplay: chain.certificationReplay,
        observability: chain.observability,
        verificationId: "verification-54k-exec",
        verificationScope: "EXECUTION_BOUNDARY",
      }),
    });
    const authority = sealSimulationBoundaryVerification({
      ...base,
      request: buildSimulationBoundaryVerificationRequest({
        sealedContract: chain.contract,
        branchReplays: [chain.replay],
        sandboxes: [chain.sandbox],
        forecasts: chain.forecasts,
        analyses: chain.analyses,
        replayLedger: chain.ledger,
        resultModel: chain.resultModel,
        certification: chain.certification,
        certificationReplay: chain.certificationReplay,
        observability: chain.observability,
        verificationId: "verification-54k-auth",
        verificationScope: "AUTHORITY_BOUNDARY",
      }),
    });

    expect(execution.result.verificationStatus).toBe("PASS");
    expect(authority.result.verificationStatus).toBe("PASS");
    expect(execution.result.verificationHash).not.toBe(authority.result.verificationHash);
  });

  it("keeps verification read-only and authority-neutral", () => {
    const record = sealSimulationBoundaryVerification(verificationInput());

    expect(record.readOnly).toBe(true);
    expect(record.verificationOnly).toBe(true);
    expect(record.executionAuthorized).toBe(false);
    expect(record.workflowMutationAllowed).toBe(false);
    expect(record.artifactMutationAllowed).toBe(false);
    expect(record.governanceMutationAllowed).toBe(false);
    expect(record.authorityMutationAllowed).toBe(false);
    expect(record.approvalAuthorized).toBe(false);
    expect(record.remediationAllowed).toBe(false);
    expect(record.persistenceAllowed).toBe(false);
    expect(record.schedulingAllowed).toBe(false);
    expect(record.validation.reasonCodes).toContain("VERIFICATION_IS_NOT_AUTHORITY");
  });

  it("does not mutate sealed inputs", () => {
    const input = verificationInput();
    const before = JSON.stringify(input);

    sealSimulationBoundaryVerification(input);

    expect(JSON.stringify(input)).toBe(before);
  });
});
