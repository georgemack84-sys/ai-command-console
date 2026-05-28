import type { ExecutionCompatibilityContract } from "../execution-compatibility";
import { createVersioningFailure } from "./versioning-errors";
import type {
  ApprovalImpactState,
  VersionedReplayArtifact,
  VersioningFailure,
} from "./versioning-types";

function hashApprovalSurface(contract: ExecutionCompatibilityContract) {
  return JSON.stringify(contract.approvalContracts);
}

function hashRollbackSurface(contract: ExecutionCompatibilityContract) {
  return JSON.stringify(contract.rollbackContracts);
}

export function assessGovernanceMigrationImpact(
  sourceContract: ExecutionCompatibilityContract,
  targetContract: ExecutionCompatibilityContract,
): { approvalImpact: ApprovalImpactState; governanceImpact: ApprovalImpactState; failures: readonly VersioningFailure[] } {
  const failures: VersioningFailure[] = [];

  const approvalImpact = hashApprovalSurface(sourceContract) === hashApprovalSurface(targetContract)
    ? "PRESERVED"
    : "INVALIDATED";
  const governanceImpact = hashRollbackSurface(sourceContract) === hashRollbackSurface(targetContract)
    && JSON.stringify(sourceContract.compatibilitySnapshot.scopeBoundaries) === JSON.stringify(targetContract.compatibilitySnapshot.scopeBoundaries)
    ? "PRESERVED"
    : "REQUIRES_REVIEW";

  if (approvalImpact === "INVALIDATED") {
    failures.push(createVersioningFailure(
      "APPROVAL_INVALIDATED",
      "Migration changed approval semantics.",
      "approvalContracts",
    ));
  }
  if (governanceImpact !== "PRESERVED") {
    failures.push(createVersioningFailure(
      "GOVERNANCE_MIGRATION_BLOCKED",
      "Migration introduced governance-sensitive changes.",
      "compatibilitySnapshot",
    ));
  }

  return { approvalImpact, governanceImpact, failures };
}

export function validateLineagePreservation(artifact: VersionedReplayArtifact): readonly VersioningFailure[] {
  const failures: VersioningFailure[] = [];
  if (artifact.immutableReplayIdentityRoot.executionTruthHash !== artifact.replayLineageInvariant.originalExecutionTruthHash) {
    failures.push(createVersioningFailure("HASH_LINEAGE_MISMATCH", "Execution truth lineage drift detected.", "replayLineageInvariant.originalExecutionTruthHash"));
  }
  if (artifact.immutableReplayIdentityRoot.executionCompatibilityHash !== artifact.replayLineageInvariant.originalExecutionCompatibilityHash) {
    failures.push(createVersioningFailure("HASH_LINEAGE_MISMATCH", "Execution compatibility lineage drift detected.", "replayLineageInvariant.originalExecutionCompatibilityHash"));
  }
  if (artifact.immutableReplayIdentityRoot.initialReplaySnapshotHash !== artifact.replayLineageInvariant.replaySnapshotHash) {
    failures.push(createVersioningFailure("REPLAY_COMPATIBILITY_FAILED", "Replay snapshot lineage drift detected.", "replayLineageInvariant.replaySnapshotHash"));
  }
  return failures;
}
