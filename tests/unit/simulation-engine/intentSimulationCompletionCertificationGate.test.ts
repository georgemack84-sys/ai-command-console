import { describe, expect, it } from "vitest";
import {
  buildCertificationReplayRequest,
  buildSimulationBoundaryVerificationRequest,
  buildSimulationCertificationRequest,
  buildSimulationCompletionCertificationRequest,
  buildSimulationObservabilityRequest,
  sealAlternatePathAnalysis,
  sealBranchReplay,
  sealCertificationReplay,
  sealGovernanceForecast,
  sealIntentSimulationCertification,
  sealSimulationBoundaryContract,
  sealSimulationBoundaryVerification,
  sealSimulationCompletionCertification,
  sealSimulationObservability,
  sealSimulationReplayLedger,
  sealSimulationResultModel,
  sealSimulationSandbox,
  type AlternatePathRequest,
  type IntentSimulationCertificationInput,
  type SealedSimulationBoundaryVerificationRecord,
  type SealedSimulationObservabilityRecord,
  type SealedSimulationResultModelRecord,
  type SimulationBoundaryContractInput,
  type SimulationCompletionCertificationInput,
} from "@/services/simulation-engine";

function boundaryInput(overrides: Partial<SimulationBoundaryContractInput> = {}): SimulationBoundaryContractInput {
  return Object.freeze({
    simulationId: "simulation-54l",
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
    createdAt: "2026-06-03T04:00:00.000Z",
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
      simulationId: "simulation-54l",
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
    sandboxId: "sandbox-54l",
    tenantId: "tenant-alpha",
    contractId: contract.contract.immutableHash,
    sealedContract: contract,
    branchReplay: replay,
    permittedResources: ["completion-certifier"],
    createdAt: "2026-06-03T04:05:00.000Z",
    isolationLevel: "STRICT",
  });
  const forecastA = sealGovernanceForecast({
    request: {
      simulationId: "simulation-54l",
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
      simulationId: "simulation-54l",
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
      simulationId: "simulation-54l",
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
    simulationId: "simulation-54l",
    tenantId: "tenant-alpha",
    createdAt: "2026-06-03T04:10:00.000Z",
    sealedContract: contract,
    branchReplays: [replay],
    sandboxes: [sandbox],
    forecasts,
    analyses,
  });
  const resultModel = sealSimulationResultModel({
    simulationId: "simulation-54l",
    tenantId: "tenant-alpha",
    createdAt: "2026-06-03T04:15:00.000Z",
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
  const verificationBase = {
    ...observabilityBase,
    observability,
  };
  const verification = sealSimulationBoundaryVerification({
    request: buildSimulationBoundaryVerificationRequest({
      ...verificationBase,
      verificationId: "verification-54l",
      verificationScope: "FULL",
    }),
    ...verificationBase,
  });

  return {
    contract,
    replay,
    sandbox,
    forecasts,
    analyses,
    ledger,
    resultModel,
    certification,
    certificationReplay,
    observability,
    verification,
  };
}

function completionInput(overrides: Partial<SimulationCompletionCertificationInput> = {}): SimulationCompletionCertificationInput {
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
    verification: chain.verification,
  };
  const request = buildSimulationCompletionCertificationRequest(base);

  return Object.freeze({
    request,
    ...base,
    ...overrides,
  } satisfies SimulationCompletionCertificationInput);
}

describe("intentSimulationCompletionCertificationGate", () => {
  it("passes when the full sealed architecture remains deterministic and bounded", () => {
    const input = completionInput();
    const first = sealSimulationCompletionCertification(input);
    const second = sealSimulationCompletionCertification(input);

    expect(first).toEqual(second);
    expect(first.result.completionStatus).toBe("PASS");
    expect(first.result.replayDeterministic).toBe(true);
    expect(first.result.containmentOperational).toBe(true);
    expect(first.result.governanceAuthoritative).toBe(true);
    expect(first.result.tenantIsolationVerified).toBe(true);
    expect(first.result.lineageIntegrity).toBe(true);
    expect(first.result.observabilityOperational).toBe(true);
    expect(first.result.verificationOperational).toBe(true);
    expect(first.result.authorityBounded).toBe(true);
    expect(first.result.completionHash).toHaveLength(64);
  });

  it("fails unsealed artifacts and hash mismatches", () => {
    const chain = buildSealedChain();
    const unsealedVerification = {
      ...chain.verification,
      sealed: false as unknown as true,
    } satisfies SealedSimulationBoundaryVerificationRecord;
    const unsealed = sealSimulationCompletionCertification(completionInput({
      verification: unsealedVerification,
    }));
    const base = completionInput();
    const mismatched = sealSimulationCompletionCertification({
      ...base,
      request: {
        ...base.request,
        verificationHash: "bad-verification-hash",
      },
    });

    expect(unsealed.result.completionStatus).toBe("FAIL");
    expect(unsealed.validation.reasonCodes).toContain("ARTIFACT_UNSEALED");
    expect(mismatched.result.completionStatus).toBe("FAIL");
    expect(mismatched.validation.reasonCodes).toContain("ARTIFACT_HASH_MISMATCH");
  });

  it("fails lineage corruption and missing lineage references", () => {
    const chain = buildSealedChain();
    const brokenResult = {
      ...chain.resultModel,
      validation: {
        ...chain.resultModel.validation,
        lineageIntegrity: false,
      },
    } satisfies SealedSimulationResultModelRecord;
    const corrupted = sealSimulationCompletionCertification(completionInput({
      resultModel: brokenResult,
    }));
    const base = completionInput();
    const missing = sealSimulationCompletionCertification({
      ...base,
      request: {
        ...base.request,
        lineageReferences: [],
      },
    });

    expect(corrupted.result.completionStatus).toBe("FAIL");
    expect(corrupted.validation.reasonCodes).toContain("LINEAGE_INTEGRITY_FAILED");
    expect(missing.result.completionStatus).toBe("FAIL");
    expect(missing.validation.reasonCodes).toContain("LINEAGE_REFERENCES_MISSING");
  });

  it("fails containment, verification, and cross-tenant leakage", () => {
    const chain = buildSealedChain();
    const badObservability = {
      ...chain.observability,
      result: {
        ...chain.observability.result,
        observabilityState: "ESCALATED" as const,
      },
    } satisfies SealedSimulationObservabilityRecord;
    const badVerification = {
      ...chain.verification,
      result: {
        ...chain.verification.result,
        verificationStatus: "AUDIT" as const,
      },
    } satisfies SealedSimulationBoundaryVerificationRecord;
    const badContainment = sealSimulationCompletionCertification(completionInput({
      observability: badObservability,
    }));
    const verificationFailure = sealSimulationCompletionCertification(completionInput({
      verification: badVerification,
    }));
    const crossTenant = sealSimulationCompletionCertification({
      ...completionInput(),
      request: {
        ...completionInput().request,
        tenantId: "tenant-beta",
      },
    });

    expect(badContainment.result.completionStatus).toBe("FAIL");
    expect(badContainment.validation.reasonCodes).toContain("OBSERVABILITY_FAILED");
    expect(verificationFailure.result.completionStatus).toBe("FAIL");
    expect(verificationFailure.validation.reasonCodes).toContain("VERIFICATION_FAILED");
    expect(crossTenant.result.completionStatus).toBe("FAIL");
    expect(crossTenant.validation.reasonCodes).toContain("CROSS_TENANT_LEAKAGE");
  });

  it("conditionally passes when observability is degraded but bounded", () => {
    const chain = buildSealedChain();
    const degradedObservability = {
      ...chain.observability,
      result: {
        ...chain.observability.result,
        observabilityState: "DEGRADED" as const,
      },
    } satisfies SealedSimulationObservabilityRecord;
    const record = sealSimulationCompletionCertification(completionInput({
      observability: degradedObservability,
    }));

    expect(record.result.completionStatus).toBe("CONDITIONAL_PASS");
    expect(record.result.observabilityOperational).toBe(true);
    expect(record.validation.reasonCodes).toContain("OBSERVABILITY_DEGRADED");
  });

  it("conditionally passes when governance version is missing but boundaries hold", () => {
    const chain = buildSealedChain();
    const missingGovernance = {
      ...chain.resultModel,
      result: {
        ...chain.resultModel.result,
        governanceVersion: "",
      },
    } satisfies SealedSimulationResultModelRecord;
    const base = completionInput({
      resultModel: missingGovernance,
    });
    const record = sealSimulationCompletionCertification({
      ...base,
      request: {
        ...base.request,
        governanceVersion: "",
      },
    });

    expect(record.result.completionStatus).toBe("CONDITIONAL_PASS");
    expect(record.result.governanceAuthoritative).toBe(false);
    expect(record.validation.reasonCodes).toContain("GOVERNANCE_VERSION_MISSING");
  });

  it("fails authority expansion and preserves read-only certification boundaries", () => {
    const chain = buildSealedChain();
    const authorityVerification = {
      ...chain.verification,
      authorityMutationAllowed: true as false,
    } satisfies SealedSimulationBoundaryVerificationRecord;
    const record = sealSimulationCompletionCertification(completionInput({
      verification: authorityVerification,
    }));

    expect(record.result.completionStatus).toBe("FAIL");
    expect(record.result.authorityBounded).toBe(false);
    expect(record.validation.reasonCodes).toContain("AUTHORITY_EXPANSION_DETECTED");
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
  });

  it("exposes read-only completion observability", () => {
    const record = sealSimulationCompletionCertification(completionInput());

    expect(record.observability).toEqual({
      completionId: record.result.completionId,
      completionStatus: "PASS",
      replayDeterministic: true,
      containmentOperational: true,
      governanceAuthoritative: true,
      verificationOperational: true,
      completionHash: record.result.completionHash,
    });
  });

  it("does not mutate sealed inputs", () => {
    const input = completionInput();
    const before = JSON.stringify(input);

    sealSimulationCompletionCertification(input);

    expect(JSON.stringify(input)).toBe(before);
  });
});
