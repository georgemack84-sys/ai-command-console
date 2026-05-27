import { buildSimulationReadiness, orchestrateSimulation } from "@/services/planning/simulation";
import type { AdmissionBuildInput } from "@/services/planning/admission";
import { buildSimulationFixture } from "@/tests/planning/simulation/helpers";

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

export function buildAdmissionFixture(overrides: Partial<AdmissionBuildInput> = {}): AdmissionBuildInput {
  const simulationFixture = buildSimulationFixture();
  const simulationReadiness = buildSimulationReadiness(simulationFixture);
  const simulationResult = orchestrateSimulation(simulationFixture).result;

  return {
    normalizedPlan: clone(simulationFixture.normalizedPlan),
    executionTruthPackage: clone(simulationFixture.executionTruthPackage),
    executionCompatibilityContract: clone(simulationFixture.executionCompatibilityContract),
    versionedReplayArtifact: clone(simulationFixture.versionedReplayArtifact),
    simulationReadiness: clone(simulationReadiness),
    simulationResult: clone(simulationResult),
    governanceMetadata: {
      governanceSnapshotHash: "governance-snapshot-hash",
      approvalChainHash: "approval-chain-hash",
      approvalsSatisfied: true,
      conflicts: [],
      allowedTrustZones: ["SANDBOX", "RESTRICTED", "STANDARD"],
      currentTrustZone: "STANDARD",
      requiredSimulation: false,
    },
    runtimeMetadata: {
      runtimeSnapshotHash: "runtime-snapshot-hash",
      healthy: true,
      stale: false,
      lockConflict: false,
      leaseConflict: false,
      mutationAttempted: false,
      governanceEpoch: "epoch-1",
      expectedGovernanceEpoch: "epoch-1",
    },
    requestedTrustZone: "STANDARD",
    requestedAt: "2026-05-14T00:00:00.000Z",
    expectedLineage: {
      executionTruthHash: simulationFixture.executionTruthPackage.executionTruthHash,
      executionCompatibilityHash: simulationFixture.executionCompatibilityContract.executionCompatibilityHash,
      replaySnapshotHash: simulationFixture.versionedReplayArtifact.replayAuditResult.replaySnapshotHash ?? "",
      derivedSimulationHash: simulationReadiness.derivedSimulationHash,
    },
    ...overrides,
  };
}
