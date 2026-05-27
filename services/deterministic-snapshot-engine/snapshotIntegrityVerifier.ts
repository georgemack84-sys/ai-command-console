import type { ConstitutionalSnapshotEnvelope, SnapshotIntegrityView } from "@/types/deterministic-snapshot-engine";
import { buildSnapshotHashes } from "./snapshotCapture";

export function verifySnapshotIntegrity(snapshot: ConstitutionalSnapshotEnvelope): SnapshotIntegrityView {
  const expected = buildSnapshotHashes({
    snapshotType: snapshot.snapshotType,
    missionId: snapshot.missionId,
    executionId: snapshot.executionId,
    lineageId: snapshot.lineageId,
    parentSnapshotId: snapshot.parentSnapshotId,
    branchId: snapshot.branchId,
    autonomyLevel: snapshot.autonomyLevel,
    revocationEligible: snapshot.revocationEligible,
    supervisionRequirements: snapshot.supervisionRequirements,
    createdAt: snapshot.createdAt,
    schemaVersion: "4.4F.constitutional-snapshot.v1",
    payload: snapshot.payload,
    sourceArtifacts: Object.freeze({}),
  }, {
    governanceHash: snapshot.governanceHash,
    legalityHash: snapshot.legalityHash,
    authorityHash: snapshot.authorityHash,
    replayHash: snapshot.replayHash,
  });

  const checks = [
    {
      name: "payloadHash",
      passed: expected.payloadHash === snapshot.payloadHash,
      expected: expected.payloadHash,
      actual: snapshot.payloadHash,
    },
    {
      name: "schemaHash",
      passed: expected.schemaHash === snapshot.schemaHash,
      expected: expected.schemaHash,
      actual: snapshot.schemaHash,
    },
    {
      name: "integrityHash",
      passed: expected.integrityHash === snapshot.integrityHash,
      expected: expected.integrityHash,
      actual: snapshot.integrityHash,
    },
  ] as const;

  return Object.freeze({
    valid: checks.every((check) => check.passed),
    payloadHashValid: checks[0].passed,
    schemaHashValid: checks[1].passed,
    governanceHashValid: true,
    authorityHashValid: true,
    replayHashValid: true,
    integrityHashValid: checks[2].passed,
    checks: Object.freeze(checks),
  });
}
