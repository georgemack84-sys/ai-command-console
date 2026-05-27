import { hashStableContent } from "../versioning";
import type { AdmissionBuildInput, AdmissionContext, AdmissionLineageAnchors } from "./admission-types";

export function buildAdmissionLineageAnchors(input: AdmissionBuildInput): AdmissionLineageAnchors {
  return {
    executionTruthHash: input.executionTruthPackage.executionTruthHash,
    executionCompatibilityHash: input.executionCompatibilityContract.executionCompatibilityHash,
    replaySnapshotHash: input.versionedReplayArtifact.replayAuditResult.replaySnapshotHash ?? "",
    ...(input.simulationReadiness?.derivedSimulationHash
      ? { derivedSimulationHash: input.simulationReadiness.derivedSimulationHash }
      : {}),
  };
}

export function buildAdmissionContext(input: AdmissionBuildInput): AdmissionContext {
  const lineage = buildAdmissionLineageAnchors(input);
  const trustZone = input.requestedTrustZone
    ?? input.governanceMetadata.currentTrustZone
    ?? "STANDARD";
  const requestedAt = input.requestedAt ?? input.normalizedPlan.metadata.createdAt;

  return {
    planHash: input.versionedReplayArtifact.replayAuditResult.planHash,
    lineage,
    governanceSnapshotHash: input.governanceMetadata.governanceSnapshotHash,
    approvalChainHash: input.governanceMetadata.approvalChainHash,
    runtimeSnapshotHash: input.runtimeMetadata.runtimeSnapshotHash,
    trustZone,
    requestedAt,
  };
}

export function hashAdmissionContext(context: AdmissionContext): string {
  return hashStableContent("GOVERNANCE", context);
}
