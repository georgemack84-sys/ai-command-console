import type {
  ConstitutionalSnapshotBuildInput,
  ConstitutionalSnapshotEnvelope,
  ConstitutionalSnapshotError,
} from "@/types/deterministic-snapshot-engine";
import { buildSnapshotHashes, captureSnapshotPayload } from "./snapshotCapture";
import {
  buildFailClosedSnapshot,
  guardSnapshotInput,
  mapSnapshotErrors,
} from "./constitutionalSnapshotGuards";
import { verifySnapshotIntegrity } from "./snapshotIntegrityVerifier";
import { buildSnapshotLineage } from "./snapshotLineage";
import { hashSnapshotValue } from "./snapshotHasher";

function freezeStrings(values: readonly string[]): readonly string[] {
  return Object.freeze([...values].sort((left, right) => left.localeCompare(right)));
}

function buildGovernanceHash(input: ConstitutionalSnapshotBuildInput): string {
  return hashSnapshotValue("snapshot-governance", {
    governanceSnapshotHash: input.sourceArtifacts.treaty?.manifest.governanceSnapshotHash,
    governanceInheritanceHash: input.sourceArtifacts.treaty?.manifest.governanceInheritanceHash,
    policyExplanationHash: input.sourceArtifacts.policyExplanation?.explanationHash,
    governanceReasoningHash: input.sourceArtifacts.policyExplanation?.governanceReasoning.governanceEvidenceHash,
    governanceDecision: input.sourceArtifacts.governanceDecision,
  });
}

function buildAuthorityHash(input: ConstitutionalSnapshotBuildInput): string {
  return hashSnapshotValue("snapshot-authority", {
    approvalChainHash: input.sourceArtifacts.treaty?.manifest.approvalChainHash,
    authorization: input.sourceArtifacts.authorization,
    governanceDecision: input.sourceArtifacts.governanceDecision,
    revocation: input.sourceArtifacts.revocation,
  });
}

function buildReplayHash(input: ConstitutionalSnapshotBuildInput): string {
  return hashSnapshotValue("snapshot-replay", {
    reconstructionHash: input.sourceArtifacts.replay?.reconstructionHash,
    replayBindingHash: input.sourceArtifacts.replay?.lineage.replayBindingHash
      ?? input.sourceArtifacts.treaty?.manifest.replayBindingHash,
    replaySnapshotHash: input.sourceArtifacts.replay?.lineage.replaySnapshotHash
      ?? input.sourceArtifacts.treaty?.manifest.replaySnapshotHash,
    replayLineageHash: input.sourceArtifacts.treaty?.evidence.replayLineageHash,
  });
}

function buildLegalityHash(
  input: ConstitutionalSnapshotBuildInput,
  governanceHash: string,
  authorityHash: string,
  replayHash: string,
): string {
  return hashSnapshotValue("snapshot-legality", {
    snapshotType: input.snapshotType,
    autonomyLevel: input.autonomyLevel,
    revocationEligible: input.revocationEligible ?? true,
    supervisionRequirements: input.supervisionRequirements ?? [],
    handoffStatus: input.sourceArtifacts.treaty?.manifest.handoffStatus,
    revocationStatus: input.sourceArtifacts.treaty?.manifest.preExecutionRevocationStatus,
    validationStatus: input.sourceArtifacts.validation?.result.status,
    policyDecision: input.sourceArtifacts.policyExplanation?.finalDecision,
    governanceHash,
    authorityHash,
    replayHash,
  });
}

export function buildConstitutionalSnapshot(
  input: ConstitutionalSnapshotBuildInput,
): ConstitutionalSnapshotEnvelope {
  const guardErrors = guardSnapshotInput(input);
  if (guardErrors.length > 0) {
    return buildFailClosedSnapshot(input, guardErrors);
  }

  try {
    const canonicalPayload = captureSnapshotPayload(input);
    const lineage = buildSnapshotLineage(input);
    const governanceHash = buildGovernanceHash(input);
    const authorityHash = buildAuthorityHash(input);
    const replayHash = buildReplayHash(input);
    const legalityHash = buildLegalityHash(input, governanceHash, authorityHash, replayHash);

    const payloadInput = {
      ...input,
      payload: canonicalPayload,
      supervisionRequirements: freezeStrings(input.supervisionRequirements ?? []),
    } as const;

    const hashes = buildSnapshotHashes(payloadInput, {
      governanceHash,
      legalityHash,
      authorityHash,
      replayHash,
    });

    const snapshot = Object.freeze({
      snapshotId: hashSnapshotValue("snapshot-id", {
        snapshotType: input.snapshotType,
        missionId: input.missionId,
        executionId: input.executionId,
        lineageId: input.lineageId,
        parentSnapshotId: input.parentSnapshotId,
        branchId: input.branchId,
        createdAt: input.createdAt,
      }),
      snapshotType: input.snapshotType,
      missionId: input.missionId,
      executionId: input.executionId,
      lineageId: input.lineageId,
      parentSnapshotId: input.parentSnapshotId,
      branchId: input.branchId,
      autonomyLevel: input.autonomyLevel,
      governanceHash,
      legalityHash,
      authorityHash,
      replayHash,
      payloadHash: hashes.payloadHash,
      schemaHash: hashes.schemaHash,
      integrityHash: hashes.integrityHash,
      revocationEligible: input.revocationEligible ?? true,
      supervisionRequirements: freezeStrings(input.supervisionRequirements ?? []),
      immutable: true as const,
      createdAt: input.createdAt,
      payload: canonicalPayload,
    });

    const integrity = verifySnapshotIntegrity(snapshot);
    const errors: ConstitutionalSnapshotError[] = [
      ...mapSnapshotErrors({
        lineageValid: lineage.valid,
        integrity,
        governanceHash,
        authorityHash,
        legalityHash,
        replayHash,
      }),
    ];

    if (errors.length > 0) {
      return buildFailClosedSnapshot(input, Object.freeze(errors));
    }

    return snapshot;
  } catch (error) {
    return buildFailClosedSnapshot(input, Object.freeze([{
      code: "SNAPSHOT_UNKNOWN_STATE",
      message: error instanceof Error ? error.message : "unknown snapshot state",
    }]));
  }
}
