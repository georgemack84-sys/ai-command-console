import { readFileSync } from "node:fs";
import path from "node:path";

import {
  buildConstitutionalSnapshot,
  buildSnapshotLineage,
  detectSnapshotMutationViolations,
  hashSnapshotValue,
  verifySnapshotIntegrity,
} from "@/services/deterministic-snapshot-engine";
import type {
  AdaptationEnvelopeSnapshot,
  AuthorizationSnapshot,
  AutonomyLevel,
  ConstitutionalSnapshotBuildInput,
  GovernanceDecisionRecord,
  RevocationSnapshot,
  SnapshotType,
} from "@/types/deterministic-snapshot-engine";
import { buildReplayFixture } from "@/tests/replay-reconstruction-engine/helpers";

export function buildSnapshotFixture(overrides: Partial<{
  snapshotType: SnapshotType;
  autonomyLevel: AutonomyLevel;
  payload: unknown;
  createdAt: string;
  parentSnapshotId: string;
  branchId: string;
  revocationEligible: boolean;
}> = {}) {
  const replayFixture = buildReplayFixture();
  const governanceDecision: GovernanceDecisionRecord = Object.freeze({
    decisionId: "decision-record-001",
    decisionType: "approve",
    targetArtifactId: replayFixture.input.treaty.manifest.treatyId,
    participants: Object.freeze(["operator-01", "operator-02"]),
    quorumSatisfied: true,
    rationale: "validated bounded operation",
    timestamp: "2026-05-16T14:01:00.000Z",
  });
  const authorization: AuthorizationSnapshot = Object.freeze({
    authorizationId: "authorization-001",
    autonomyLevel: overrides.autonomyLevel ?? "A2",
    executionConstraints: Object.freeze(["no-execute", "bounded-scope"]),
    supervisionRequirements: Object.freeze(["operator-visible", "revocable"]),
    revocationRules: Object.freeze(["quorum-loss", "policy-drift"]),
    authorityHash: hashSnapshotValue("fixture-authorization-authority", {
      decisionId: governanceDecision.decisionId,
      approvalChainHash: replayFixture.input.treaty.manifest.approvalChainHash,
    }),
    replayHash: replayFixture.replay.reconstructionHash,
  });
  const revocation: RevocationSnapshot = Object.freeze({
    revocationId: "revocation-001",
    targetArtifactId: authorization.authorizationId,
    revokedBy: Object.freeze(["operator-03"]),
    revocationReason: "operator-initiated review",
    revocationTimestamp: "2026-05-16T14:02:00.000Z",
    supersededAuthorities: Object.freeze([authorization.authorizationId]),
    replayContinuityPreserved: true,
  });
  const adaptation: AdaptationEnvelopeSnapshot = Object.freeze({
    envelopeId: "adaptation-envelope-001",
    allowedVariations: Object.freeze(["re-sequence-approved-step"]),
    prohibitedTransitions: Object.freeze(["expand-scope", "self-authorize"]),
    supervisionRequirements: Object.freeze(["operator-visible", "replay-bound"]),
    revocationTriggers: Object.freeze(["policy-drift", "governance-mismatch"]),
    replayHash: replayFixture.replay.reconstructionHash,
  });

  const input: ConstitutionalSnapshotBuildInput = Object.freeze({
    snapshotType: overrides.snapshotType ?? "execution",
    missionId: "mission-001",
    executionId: replayFixture.input.treaty.manifest.planId,
    lineageId: "lineage-001",
    parentSnapshotId: overrides.parentSnapshotId ?? "snapshot-parent-001",
    branchId: overrides.branchId ?? "branch-primary",
    autonomyLevel: overrides.autonomyLevel ?? "A2",
    revocationEligible: overrides.revocationEligible ?? true,
    supervisionRequirements: Object.freeze(["operator-visible", "revocable"]),
    createdAt: overrides.createdAt ?? "2026-05-16T14:00:00.000Z",
    schemaVersion: "4.4F.constitutional-snapshot.v1",
    payload: overrides.payload ?? Object.freeze({
      executionState: "prepared",
      evidenceRefs: Object.freeze([
        replayFixture.input.treaty.hashes.treatyHash,
        replayFixture.replay.reconstructionHash,
      ]),
      memory: Object.freeze({
        contextWindow: "mission-control",
        markers: Object.freeze(["checkpoint-a", "checkpoint-b"]),
      }),
    }),
    sourceArtifacts: Object.freeze({
      treaty: replayFixture.input.treaty,
      validation: replayFixture.input.validation,
      traceView: replayFixture.input.traceView,
      policyExplanation: replayFixture.input.policyExplanation,
      diffInspection: replayFixture.artifacts
        ? undefined
        : undefined,
      replay: replayFixture.replay,
      governanceDecision,
      authorization,
      revocation,
      adaptation,
      sourceRefs: Object.freeze([
        replayFixture.input.treaty.manifest.treatyId,
        replayFixture.replay.replayId,
      ]),
    }),
  });

  return {
    replayFixture,
    governanceDecision,
    authorization,
    revocation,
    adaptation,
    input,
    snapshot: buildConstitutionalSnapshot(input),
    lineage: buildSnapshotLineage(input),
  };
}

export function loadDeterministicSnapshotSources() {
  const root = path.resolve("services", "deterministic-snapshot-engine");
  return [
    "index.ts",
    "deterministicSnapshotEngine.ts",
    "snapshotCapture.ts",
    "snapshotHasher.ts",
    "snapshotLineage.ts",
    "snapshotIntegrityVerifier.ts",
    "snapshotCanonicalSerializer.ts",
    "constitutionalSnapshotGuards.ts",
    "governanceDecisionSnapshot.ts",
    "authorizationSnapshot.ts",
    "revocationSnapshot.ts",
    "autonomyClassificationSnapshot.ts",
    "adaptationSnapshot.ts",
  ].map((file) => ({
    path: path.join(root, file),
    content: readFileSync(path.join(root, file), "utf8"),
  }));
}

export {
  buildConstitutionalSnapshot,
  buildSnapshotLineage,
  detectSnapshotMutationViolations,
  verifySnapshotIntegrity,
};
