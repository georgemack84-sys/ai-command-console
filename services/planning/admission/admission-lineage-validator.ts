import { buildAdmissionLineageAnchors } from "./admission-context";
import { createAdmissionFailure } from "./admission-errors";
import type { AdmissionBuildInput, AdmissionLineageValidation } from "./admission-types";

export function validateAdmissionLineage(input: AdmissionBuildInput): AdmissionLineageValidation {
  const failures = [];
  const anchors = buildAdmissionLineageAnchors(input);
  const expected = input.expectedLineage ?? {};
  const artifact = input.versionedReplayArtifact;

  if (!anchors.executionTruthHash) {
    failures.push(createAdmissionFailure("PHASE42L_LINEAGE_MISSING", "Execution truth hash is required for admission.", "executionTruthHash"));
  }
  if (!anchors.executionCompatibilityHash) {
    failures.push(createAdmissionFailure("PHASE42L_LINEAGE_MISSING", "Execution compatibility hash is required for admission.", "executionCompatibilityHash"));
  }
  if (!anchors.replaySnapshotHash) {
    failures.push(createAdmissionFailure("PHASE42L_LINEAGE_MISSING", "Replay snapshot hash is required for admission.", "replaySnapshotHash"));
  }

  if (artifact.immutableReplayIdentityRoot.executionTruthHash !== anchors.executionTruthHash) {
    failures.push(createAdmissionFailure("PHASE42L_LINEAGE_DRIFT", "Execution truth lineage drift detected.", "immutableReplayIdentityRoot.executionTruthHash"));
  }
  if (artifact.immutableReplayIdentityRoot.executionCompatibilityHash !== anchors.executionCompatibilityHash) {
    failures.push(createAdmissionFailure("PHASE42L_LINEAGE_DRIFT", "Execution compatibility lineage drift detected.", "immutableReplayIdentityRoot.executionCompatibilityHash"));
  }
  if (artifact.immutableReplayIdentityRoot.initialReplaySnapshotHash !== anchors.replaySnapshotHash) {
    failures.push(createAdmissionFailure("PHASE42L_LINEAGE_DRIFT", "Replay snapshot lineage drift detected.", "immutableReplayIdentityRoot.initialReplaySnapshotHash"));
  }

  if (expected.executionTruthHash && expected.executionTruthHash !== anchors.executionTruthHash) {
    failures.push(createAdmissionFailure("PHASE42L_LINEAGE_DRIFT", "Execution truth hash does not match expected lineage anchor.", "expectedLineage.executionTruthHash"));
  }
  if (expected.executionCompatibilityHash && expected.executionCompatibilityHash !== anchors.executionCompatibilityHash) {
    failures.push(createAdmissionFailure("PHASE42L_LINEAGE_DRIFT", "Execution compatibility hash does not match expected lineage anchor.", "expectedLineage.executionCompatibilityHash"));
  }
  if (expected.replaySnapshotHash && expected.replaySnapshotHash !== anchors.replaySnapshotHash) {
    failures.push(createAdmissionFailure("PHASE42L_LINEAGE_DRIFT", "Replay snapshot hash does not match expected lineage anchor.", "expectedLineage.replaySnapshotHash"));
  }

  if (
    input.simulationReadiness?.derivedSimulationHash
    && expected.derivedSimulationHash
    && input.simulationReadiness.derivedSimulationHash !== expected.derivedSimulationHash
  ) {
    failures.push(createAdmissionFailure("PHASE42L_LINEAGE_DRIFT", "Derived simulation hash does not match the expected admission anchor.", "expectedLineage.derivedSimulationHash"));
  }

  if (
    input.simulationResult
    && input.simulationReadiness
    && input.simulationResult.derivedSimulationHash !== input.simulationReadiness.derivedSimulationHash
  ) {
    failures.push(createAdmissionFailure("PHASE42L_LINEAGE_DRIFT", "Simulation readiness and simulation result disagree on the derived simulation hash.", "simulationResult.derivedSimulationHash"));
  }

  return {
    ok: failures.length === 0,
    failures,
  };
}
