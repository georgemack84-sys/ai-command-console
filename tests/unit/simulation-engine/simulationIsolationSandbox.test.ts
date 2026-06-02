import { describe, expect, it } from "vitest";
import {
  MAX_REPLAY_CONTEXTS,
  MAX_RESOURCE_SCOPE,
  MAX_SANDBOX_DURATION,
  sealBranchReplay,
  sealSimulationBoundaryContract,
  sealSimulationSandbox,
  type SimulationBoundaryContractInput,
  type SimulationSandboxRequest,
} from "@/services/simulation-engine";

function boundaryInput(overrides: Partial<SimulationBoundaryContractInput> = {}): SimulationBoundaryContractInput {
  return Object.freeze({
    simulationId: "simulation-54c",
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
    createdAt: "2026-06-02T16:00:00.000Z",
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

function sandboxRequest(overrides: Partial<SimulationSandboxRequest> = {}): SimulationSandboxRequest {
  const sealedContract = sealSimulationBoundaryContract(boundaryInput());
  const branchReplay = sealBranchReplay({
    request: {
      simulationId: "simulation-54c",
      contractId: sealedContract.contract.immutableHash,
      replayReferenceIds: ["lineage-1"],
      replayDepth: 1,
      branchIds: ["branch-1"],
      riskCertificationReference: "risk-certification-hash",
      replayType: "HISTORICAL_REPLAY",
    },
    sealedContract,
    tenantId: "tenant-alpha",
    lineageReferenceIds: ["lineage-1"],
  });

  return Object.freeze({
    sandboxId: "sandbox-54c",
    tenantId: "tenant-alpha",
    contractId: sealedContract.contract.immutableHash,
    sealedContract,
    branchReplay,
    permittedResources: ["lineage-inspector", "branch-comparator"],
    createdAt: "2026-06-02T16:05:00.000Z",
    isolationLevel: "STRICT",
    ...overrides,
  } satisfies SimulationSandboxRequest);
}

describe("simulationIsolationSandbox", () => {
  it("seals deterministic immutable sandbox contexts for identical inputs", () => {
    const request = sandboxRequest();
    const first = sealSimulationSandbox(request);
    const second = sealSimulationSandbox(request);

    expect(first).toEqual(second);
    expect(first.result.sandboxStatus).toBe("PASS");
    expect(first.context.sandboxStatus).toBe("ACTIVE");
    expect(first.context.immutableHash).toHaveLength(64);
    expect(first.result.isolationHash).toHaveLength(64);
  });

  it("blocks runtime, scheduler, network, workers, writes, persistence, and authority mutation", () => {
    const record = sealSimulationSandbox(sandboxRequest({
      runtimeAccessAllowed: true,
      schedulerAccessAllowed: true,
      networkAccessAllowed: true,
      workerAccessAllowed: true,
      writeAccessAllowed: true,
      persistenceAllowed: true,
      authorityMutationAllowed: true,
    }));

    expect(record.result.sandboxStatus).toBe("FREEZE");
    expect(record.validation.reasonCodes).toContain("RUNTIME_ACCESS_BLOCKED");
    expect(record.validation.reasonCodes).toContain("SCHEDULER_ACCESS_BLOCKED");
    expect(record.validation.reasonCodes).toContain("NETWORK_ACCESS_BLOCKED");
    expect(record.validation.reasonCodes).toContain("WORKERS_BLOCKED");
    expect(record.validation.reasonCodes).toContain("WRITES_BLOCKED");
    expect(record.validation.reasonCodes).toContain("PERSISTENCE_BLOCKED");
    expect(record.validation.reasonCodes).toContain("AUTHORITY_MUTATION_BLOCKED");
    expect(record.runtimeAccessAllowed).toBe(false);
    expect(record.schedulerAccessAllowed).toBe(false);
    expect(record.networkAccessAllowed).toBe(false);
    expect(record.workerAccessAllowed).toBe(false);
    expect(record.writeAccessAllowed).toBe(false);
  });

  it("preserves state and ownership by blocking permission mutation", () => {
    const record = sealSimulationSandbox(sandboxRequest({
      sandboxPermissionsMutated: true,
    }));

    expect(record.result.sandboxStatus).toBe("FREEZE");
    expect(record.validation.reasonCodes).toContain("PERMISSIONS_IMMUTABLE");
    expect(record.context.tenantId).toBe("tenant-alpha");
  });

  it("blocks cross-tenant sandbox requests", () => {
    const record = sealSimulationSandbox(sandboxRequest({
      tenantId: "tenant-beta",
    }));

    expect(record.result.sandboxStatus).toBe("FREEZE");
    expect(record.validation.reasonCodes).toContain("CROSS_TENANT_ACCESS_BLOCKED");
    expect(record.validation.reasonCodes).toContain("TENANT_CONTEXT_IMMUTABLE");
  });

  it("escalates when replay integrity is false", () => {
    const base = sandboxRequest();
    const failingReplay = {
      ...base.branchReplay,
      result: {
        ...base.branchReplay.result,
        replayStatus: "FREEZE" as const,
      },
    };
    const record = sealSimulationSandbox(sandboxRequest({
      branchReplay: failingReplay,
    }));

    expect(record.result.sandboxStatus).toBe("ESCALATE");
    expect(record.result.replayIntegrity).toBe(false);
    expect(record.validation.reasonCodes).toContain("REPLAY_INTEGRITY_FAILED");
  });

  it("limits oversized resource scope, replay contexts, and duration", () => {
    const record = sealSimulationSandbox(sandboxRequest({
      permittedResources: Array.from({ length: MAX_RESOURCE_SCOPE + 1 }, (_, index) => `resource-${index}`),
      replayContextIds: Array.from({ length: MAX_REPLAY_CONTEXTS + 1 }, (_, index) => `context-${index}`),
      requestedDurationSeconds: MAX_SANDBOX_DURATION + 1,
    }));

    expect(record.result.sandboxStatus).toBe("LIMIT_SCOPE");
    expect(record.validation.reasonCodes).toContain("RESOURCE_SCOPE_LIMITED");
    expect(record.validation.reasonCodes).toContain("REPLAY_CONTEXT_LIMITED");
    expect(record.validation.reasonCodes).toContain("SANDBOX_DURATION_LIMITED");
    expect(record.result.containmentState).toBe("LIMITED");
  });

  it("keeps sandbox observability visibility-only", () => {
    const record = sealSimulationSandbox(sandboxRequest({
      isolationLevel: "HIGH",
    }));

    expect(record.observability).toEqual({
      sandboxId: record.context.sandboxId,
      sandboxStatus: record.result.sandboxStatus,
      isolationLevel: "HIGH",
      replayIntegrity: record.result.replayIntegrity,
      containmentState: record.result.containmentState,
      isolationHash: record.result.isolationHash,
    });
  });

  it("records a deterministic lifecycle without execution hooks", () => {
    const record = sealSimulationSandbox(sandboxRequest());

    expect(record.validation.lifecycle).toEqual([
      "CREATE_SANDBOX",
      "VALIDATE_CONTRACT",
      "VALIDATE_REPLAY",
      "ISOLATE_CONTEXT",
      "GENERATE_HASH",
      "SEAL_SANDBOX",
      "ALLOW_SIMULATION",
    ]);
    expect(record.runtimeAccessAllowed).toBe(false);
    expect(record.networkAccessAllowed).toBe(false);
    expect(record.schedulerAccessAllowed).toBe(false);
  });

  it("does not mutate sealed contract or replay inputs", () => {
    const request = sandboxRequest();
    const before = JSON.stringify(request);

    sealSimulationSandbox(request);

    expect(JSON.stringify(request)).toBe(before);
  });
});
