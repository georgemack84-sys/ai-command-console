import { describe, expect, it } from "vitest";
import {
  sealBranchReplay,
  sealGovernanceForecast,
  sealSimulationBoundaryContract,
  sealSimulationSandbox,
  type GovernanceForecastInput,
  type GovernanceForecastRequest,
  type SealedBranchReplayRecord,
  type SealedSimulationSandboxRecord,
  type SimulationBoundaryContractInput,
} from "@/services/simulation-engine";

function boundaryInput(overrides: Partial<SimulationBoundaryContractInput> = {}): SimulationBoundaryContractInput {
  return Object.freeze({
    simulationId: "simulation-54d",
    tenantId: "tenant-alpha",
    missionId: "mission-alpha",
    simulationType: "BRANCH_REPLAY",
    approvedScope: ["branch-1", "branch-2"],
    branchLimit: 2,
    replayReferenceIds: ["lineage-1"],
    evidenceReferences: ["evidence-1"],
    riskCertificationReference: "risk-certification-hash",
    approvalReference: "approval-1",
    operatorId: "operator-alpha",
    governanceVersion: "simulation-governance/v1",
    createdAt: "2026-06-02T17:00:00.000Z",
    contractVersion: "simulation-boundary-contract/v1",
    branches: [
      {
        branchId: "branch-1",
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
      simulationId: "simulation-54d",
      contractId: contract.contract.immutableHash,
      replayReferenceIds: ["lineage-1"],
      replayDepth: 1,
      branchIds: ["branch-1"],
      riskCertificationReference: "risk-certification-hash",
      replayType: "HISTORICAL_REPLAY",
    },
    sealedContract: contract,
    tenantId: "tenant-alpha",
    lineageReferenceIds: ["lineage-1"],
  });
  const sandbox = sealSimulationSandbox({
    sandboxId: "sandbox-54d",
    tenantId: "tenant-alpha",
    contractId: contract.contract.immutableHash,
    sealedContract: contract,
    branchReplay: replay,
    permittedResources: ["lineage-inspector"],
    createdAt: "2026-06-02T17:05:00.000Z",
    isolationLevel: "STRICT",
  });

  return { contract, replay, sandbox };
}

function forecastRequest(
  chain = buildChain(),
  overrides: Partial<GovernanceForecastRequest> = {},
): GovernanceForecastRequest {
  return {
    simulationId: "simulation-54d",
    sandboxId: chain.sandbox.context.sandboxId,
    replayId: chain.replay.result.replayId,
    contractId: chain.contract.contract.immutableHash,
    riskCertificationReference: chain.contract.contract.riskCertificationReference,
    governanceVersion: chain.contract.contract.governanceVersion,
    forecastType: "ESCALATION_FORECAST",
    lineageReferences: [chain.replay.result.replayLineageHash, chain.sandbox.result.isolationHash],
    ...overrides,
  };
}

function forecastInput(overrides: Partial<GovernanceForecastInput> = {}): GovernanceForecastInput {
  const chain = buildChain();
  return Object.freeze({
    request: forecastRequest(chain),
    sealedContract: chain.contract,
    branchReplay: chain.replay,
    sandbox: chain.sandbox,
    tenantId: "tenant-alpha",
    ...overrides,
  } satisfies GovernanceForecastInput);
}

describe("governanceForecastingEngine", () => {
  it("produces deterministic forecasts and hashes for identical inputs", () => {
    const input = forecastInput();
    const first = sealGovernanceForecast(input);
    const second = sealGovernanceForecast(input);

    expect(first).toEqual(second);
    expect(first.result.forecastStatus).toBe("PASS");
    expect(first.result.forecastHash).toHaveLength(64);
    expect(first.result.lineageHash).toHaveLength(64);
    expect(first.sealed).toBe(true);
  });

  it("surfaces policy conflicts without mutating governance", () => {
    const record = sealGovernanceForecast(forecastInput({
      policyConflict: true,
      request: forecastRequest(buildChain(), {
        forecastType: "POLICY_ALIGNMENT",
      }),
    }));

    expect(record.validation.reasonCodes).toContain("POLICY_CONFLICT_SURFACED");
    expect(record.result.forecastStatus).toBe("ESCALATE");
    expect(record.policyMutationAllowed).toBe(false);
  });

  it("escalates when governance version is missing", () => {
    const chain = buildChain();
    const record = sealGovernanceForecast(forecastInput({
      request: forecastRequest(chain, {
        governanceVersion: "",
      }),
    }));

    expect(record.result.forecastStatus).toBe("ESCALATE");
    expect(record.validation.reasonCodes).toContain("GOVERNANCE_VERSION_MISSING");
  });

  it("freezes invalid contracts", () => {
    const chain = buildChain();
    const invalidContract = {
      ...chain.contract,
      sealed: false as true,
    };
    const record = sealGovernanceForecast(forecastInput({
      sealedContract: invalidContract,
    }));

    expect(record.result.forecastStatus).toBe("FREEZE");
    expect(record.validation.reasonCodes).toContain("CONTRACT_INVALID");
  });

  it("freezes replay failures", () => {
    const chain = buildChain();
    const failingReplay = {
      ...chain.replay,
      result: {
        ...chain.replay.result,
        replayStatus: "FREEZE" as const,
      },
    } as SealedBranchReplayRecord;
    const record = sealGovernanceForecast(forecastInput({
      branchReplay: failingReplay,
    }));

    expect(record.result.forecastStatus).toBe("FREEZE");
    expect(record.result.replayIntegrity).toBe(false);
    expect(record.validation.reasonCodes).toContain("REPLAY_INTEGRITY_FAILED");
  });

  it("freezes sandbox containment failures", () => {
    const chain = buildChain();
    const failingSandbox = {
      ...chain.sandbox,
      result: {
        ...chain.sandbox.result,
        sandboxStatus: "FREEZE" as const,
        replayIntegrity: false,
      },
    } as SealedSimulationSandboxRecord;
    const record = sealGovernanceForecast(forecastInput({
      sandbox: failingSandbox,
    }));

    expect(record.result.forecastStatus).toBe("FREEZE");
    expect(record.result.containmentIntegrity).toBe(false);
    expect(record.validation.reasonCodes).toContain("SANDBOX_CONTAINMENT_FAILED");
  });

  it("freezes invalid risk certification references", () => {
    const chain = buildChain();
    const record = sealGovernanceForecast(forecastInput({
      request: forecastRequest(chain, {
        riskCertificationReference: "other-certification",
      }),
    }));

    expect(record.result.forecastStatus).toBe("FREEZE");
    expect(record.validation.reasonCodes).toContain("CERTIFICATION_INVALID");
  });

  it("blocks cross-tenant forecast inputs", () => {
    const record = sealGovernanceForecast(forecastInput({
      tenantId: "tenant-beta",
    }));

    expect(record.result.forecastStatus).toBe("FREEZE");
    expect(record.validation.reasonCodes).toContain("CROSS_TENANT_INPUTS_BLOCKED");
  });

  it("freezes missing lineage and unsealed artifact references", () => {
    const chain = buildChain();
    const missingLineage = sealGovernanceForecast(forecastInput({
      request: forecastRequest(chain, {
        lineageReferences: [],
      }),
    }));
    const unsealedSandbox = {
      ...chain.sandbox,
      sealed: false as true,
    };
    const unsealed = sealGovernanceForecast(forecastInput({
      sandbox: unsealedSandbox,
    }));

    expect(missingLineage.result.forecastStatus).toBe("FREEZE");
    expect(missingLineage.validation.reasonCodes).toContain("LINEAGE_MISSING");
    expect(unsealed.result.forecastStatus).toBe("FREEZE");
    expect(unsealed.validation.reasonCodes).toContain("FORECAST_REFERENCES_UNSEALED_ARTIFACTS");
  });

  it("limits scope for moderate approval pressure", () => {
    const chain = buildChain();
    const record = sealGovernanceForecast(forecastInput({
      request: forecastRequest(chain, {
        forecastType: "APPROVAL_PRESSURE",
      }),
      approvalComplexity: 0.7,
    }));

    expect(record.result.forecastStatus).toBe("LIMIT_SCOPE");
    expect(record.result.governancePressure).toBeGreaterThanOrEqual(0.35);
  });

  it("keeps forecasting read-only and authority-neutral", () => {
    const record = sealGovernanceForecast(forecastInput());

    expect(record.readOnly).toBe(true);
    expect(record.advisoryOnly).toBe(true);
    expect(record.approvalAuthorized).toBe(false);
    expect(record.rejectionAuthorized).toBe(false);
    expect(record.policyMutationAllowed).toBe(false);
    expect(record.executionAuthorized).toBe(false);
    expect(record.authorityMutationAllowed).toBe(false);
    expect(record.validation.reasonCodes).toContain("FORECAST_IS_NOT_APPROVAL");
    expect(record.validation.reasonCodes).toContain("AUTHORITY_BOUNDARY_PRESERVED");
  });

  it("does not mutate sealed inputs", () => {
    const input = forecastInput();
    const before = JSON.stringify(input);

    sealGovernanceForecast(input);

    expect(JSON.stringify(input)).toBe(before);
  });
});
