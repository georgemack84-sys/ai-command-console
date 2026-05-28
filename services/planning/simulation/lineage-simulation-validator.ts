import {
  buildImmutableReplayIdentityRoot,
  buildReplayLineageInvariant,
  validateLineagePreservation,
} from "../versioning";
import { createSimulationFailure } from "./simulation-errors";
import { buildSimulationLineageContext } from "./simulation-context";
import type { SimulationBuildInput, SimulationFailure } from "./simulation-types";

export function validateSimulationLineage(input: SimulationBuildInput): {
  failures: readonly SimulationFailure[];
} {
  const failures: SimulationFailure[] = [];
  const artifact = input.versionedReplayArtifact;
  const replayAuditResult = artifact.replayAuditResult;
  const replayArtifacts = replayAuditResult.artifacts;

  if (!input.executionTruthPackage.executionTruthHash) {
    failures.push(createSimulationFailure("SIMULATION_LINEAGE_MISSING", "Execution truth hash is required for simulation.", "executionTruthPackage.executionTruthHash"));
  }
  if (!input.executionCompatibilityContract.executionCompatibilityHash) {
    failures.push(createSimulationFailure("SIMULATION_LINEAGE_MISSING", "Execution compatibility hash is required for simulation.", "executionCompatibilityContract.executionCompatibilityHash"));
  }
  if (!replayAuditResult.replaySnapshotHash) {
    failures.push(createSimulationFailure("SIMULATION_LINEAGE_MISSING", "Replay snapshot hash is required for simulation.", "versionedReplayArtifact.replayAuditResult.replaySnapshotHash"));
  }
  if (!artifact.migrationLineage || !Array.isArray(artifact.migrationLineage)) {
    failures.push(createSimulationFailure("SIMULATION_LINEAGE_MISSING", "Migration lineage is required for simulation.", "versionedReplayArtifact.migrationLineage"));
  }

  const replayFailures = validateLineagePreservation(artifact);
  for (const failure of replayFailures) {
    failures.push(createSimulationFailure("SIMULATION_LINEAGE_DIVERGENCE", failure.message, failure.path));
  }

  const expectedRoot = buildImmutableReplayIdentityRoot(replayAuditResult, input.executionCompatibilityContract);
  if (JSON.stringify(expectedRoot) !== JSON.stringify(artifact.immutableReplayIdentityRoot)) {
    failures.push(createSimulationFailure(
      "SIMULATION_LINEAGE_DIVERGENCE",
      "Simulation detected a replay identity root mismatch.",
      "versionedReplayArtifact.immutableReplayIdentityRoot",
    ));
  }

  const expectedInvariant = buildReplayLineageInvariant(expectedRoot, artifact.migrationLineage);
  if (JSON.stringify(expectedInvariant) !== JSON.stringify(artifact.replayLineageInvariant)) {
    failures.push(createSimulationFailure(
      "SIMULATION_LINEAGE_DIVERGENCE",
      "Simulation detected replay lineage invariant drift.",
      "versionedReplayArtifact.replayLineageInvariant",
    ));
  }

  const lineageContext = buildSimulationLineageContext(artifact);
  if (lineageContext.executionTruthHash !== input.executionTruthPackage.executionTruthHash) {
    failures.push(createSimulationFailure(
      "SIMULATION_LINEAGE_DIVERGENCE",
      "Simulation execution truth hash diverged from the lineage anchor.",
      "executionTruthPackage.executionTruthHash",
    ));
  }
  if (lineageContext.executionCompatibilityHash !== input.executionCompatibilityContract.executionCompatibilityHash) {
    failures.push(createSimulationFailure(
      "SIMULATION_LINEAGE_DIVERGENCE",
      "Simulation execution compatibility hash diverged from the lineage anchor.",
      "executionCompatibilityContract.executionCompatibilityHash",
    ));
  }
  if (lineageContext.replaySnapshotHash !== replayAuditResult.replaySnapshotHash) {
    failures.push(createSimulationFailure(
      "SIMULATION_LINEAGE_DIVERGENCE",
      "Simulation replay snapshot hash diverged from the lineage anchor.",
      "versionedReplayArtifact.replayAuditResult.replaySnapshotHash",
    ));
  }

  if (
    replayAuditResult.executionTruthHash !== input.executionTruthPackage.executionTruthHash
    || replayAuditResult.executionCompatibilityHash !== input.executionCompatibilityContract.executionCompatibilityHash
  ) {
    failures.push(createSimulationFailure(
      "SIMULATION_LINEAGE_DIVERGENCE",
      "Replay audit artifact does not preserve upstream truth hashes for simulation.",
      "versionedReplayArtifact.replayAuditResult",
    ));
  }

  if (replayArtifacts) {
    if (replayAuditResult.planHash !== replayArtifacts.replayInputSnapshot.planHash) {
      failures.push(createSimulationFailure(
        "SIMULATION_LINEAGE_DIVERGENCE",
        "Replay audit plan hash diverged from the replay snapshot anchor.",
        "versionedReplayArtifact.replayAuditResult.planHash",
      ));
    }
    if (replayAuditResult.planHash !== replayArtifacts.auditArtifact.planHash) {
      failures.push(createSimulationFailure(
        "SIMULATION_LINEAGE_DIVERGENCE",
        "Replay audit plan hash diverged from the audit artifact anchor.",
        "versionedReplayArtifact.replayAuditResult.artifacts.auditArtifact.planHash",
      ));
    }
  }

  return { failures };
}
