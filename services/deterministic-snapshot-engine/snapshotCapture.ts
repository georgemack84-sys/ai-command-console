import type { ConstitutionalSnapshotBuildInput } from "@/types/deterministic-snapshot-engine";
import { captureAdaptationSnapshot } from "./adaptationSnapshot";
import { captureAutonomyClassificationSnapshot } from "./autonomyClassificationSnapshot";
import { captureAuthorizationSnapshot } from "./authorizationSnapshot";
import { captureGovernanceDecisionSnapshot } from "./governanceDecisionSnapshot";
import { captureRevocationSnapshot } from "./revocationSnapshot";
import { canonicalizeSnapshotValue } from "./snapshotCanonicalSerializer";
import { hashSnapshotValue } from "./snapshotHasher";

export function captureSnapshotPayload(input: ConstitutionalSnapshotBuildInput): unknown {
  switch (input.snapshotType) {
    case "governance_decision":
      if (!input.sourceArtifacts.governanceDecision) {
        throw new Error("SNAPSHOT_GOVERNANCE_INVALID");
      }
      return captureGovernanceDecisionSnapshot(input, input.sourceArtifacts.governanceDecision);
    case "authorization":
      if (!input.sourceArtifacts.authorization) {
        throw new Error("SNAPSHOT_AUTHORITY_INVALID");
      }
      return captureAuthorizationSnapshot(input, input.sourceArtifacts.authorization);
    case "revocation":
      if (!input.sourceArtifacts.revocation) {
        throw new Error("SNAPSHOT_REVOCATION_INVALID");
      }
      return captureRevocationSnapshot(input, input.sourceArtifacts.revocation);
    case "autonomy_classification":
      return captureAutonomyClassificationSnapshot(input);
    case "adaptation":
      if (!input.sourceArtifacts.adaptation) {
        throw new Error("SNAPSHOT_UNKNOWN_STATE");
      }
      return captureAdaptationSnapshot(input, input.sourceArtifacts.adaptation);
    default:
      return canonicalizeSnapshotValue({
        kind: input.snapshotType,
        payload: input.payload,
        treatyHash: input.sourceArtifacts.treaty?.hashes.treatyHash,
        validationHash: input.sourceArtifacts.validation?.result.resultHash,
        traceHash: input.sourceArtifacts.traceView?.traceProjectionHash,
        policyHash: input.sourceArtifacts.policyExplanation?.explanationHash,
        diffHash: input.sourceArtifacts.diffInspection?.deterministicHash,
        replayHash: input.sourceArtifacts.replay?.reconstructionHash,
        sourceRefs: input.sourceArtifacts.sourceRefs ?? [],
      });
  }
}

export function buildSnapshotHashes(
  input: ConstitutionalSnapshotBuildInput,
  explicit?: Readonly<{
    governanceHash: string;
    legalityHash: string;
    authorityHash: string;
    replayHash: string;
  }>,
): Readonly<{
  payloadHash: string;
  schemaHash: string;
  integrityHash: string;
}> {
  const payloadHash = hashSnapshotValue("snapshot-payload", input.payload);
  const schemaHash = hashSnapshotValue("snapshot-schema", {
    snapshotType: input.snapshotType,
    schemaVersion: input.schemaVersion ?? "4.4F.constitutional-snapshot.v1",
  });
  const integrityHash = hashSnapshotValue("snapshot-integrity", {
    snapshotType: input.snapshotType,
    missionId: input.missionId,
    executionId: input.executionId,
    lineageId: input.lineageId,
    parentSnapshotId: input.parentSnapshotId,
    branchId: input.branchId,
    autonomyLevel: input.autonomyLevel,
    governanceHash: explicit?.governanceHash,
    legalityHash: explicit?.legalityHash,
    authorityHash: explicit?.authorityHash,
    replayHash: explicit?.replayHash,
    payloadHash,
    schemaHash,
    revocationEligible: input.revocationEligible ?? true,
    supervisionRequirements: input.supervisionRequirements ?? [],
  });

  return Object.freeze({
    payloadHash,
    schemaHash,
    integrityHash,
  });
}
