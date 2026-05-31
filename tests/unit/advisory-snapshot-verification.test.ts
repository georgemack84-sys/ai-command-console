import { describe, expect, it } from "vitest";

import { aggregateUnifiedAdvisory } from "@/services/advisory";
import { buildAdvisoryReadModel } from "@/services/advisory/advisoryReadModel";
import { buildAdvisorySnapshotExport } from "@/services/advisory/advisorySnapshotExport";
import { verifyAdvisorySnapshot } from "@/services/advisory/advisorySnapshotVerification";

function validSnapshot(generatedAt = "2026-05-29T12:00:00.000Z") {
  const aggregation = aggregateUnifiedAdvisory({
    releaseCertification: {
      status: "COMPATIBLE",
      evidenceHash: "sha256:release",
      governanceReplayHash: "sha256:release-replay",
      replayEvidenceAvailable: true,
      authority: "READ_ONLY",
      mayBlockDeployment: false,
      mayTriggerRetry: false,
      mayTriggerRollback: false,
    },
    operationalRules: {
      advisoryStatus: "SAFE",
      evidenceHash: "sha256:operational",
      ruleHash: "sha256:rules",
      evidenceRefs: ["operational-rules:evaluation"],
      replayable: true,
      authority: "ADVISORY_ONLY",
      mayDeploy: false,
      mayRetry: false,
      mayRollback: false,
      mayCancel: false,
      mayResume: false,
      requiresExplicitEnforcementPhase: true,
    },
    deploymentOverrun: {
      advisoryStatus: "NORMAL",
      risk: "LOW",
      evidenceHash: "sha256:overrun",
      advisoryHash: "sha256:overrun-advisory",
      evidenceRefs: ["deployment-overrun:evaluation"],
      replayable: true,
      authority: "ADVISORY_ONLY",
      mayDeploy: false,
      mayRetry: false,
      mayRollback: false,
      mayCancel: false,
      mayResume: false,
      requiresExplicitEnforcementPhase: true,
    },
  });

  return buildAdvisorySnapshotExport(
    buildAdvisoryReadModel({ aggregation, generatedAt }),
    generatedAt,
  );
}

describe("advisory snapshot verification", () => {
  it("verifies valid exported snapshots", () => {
    const snapshot = validSnapshot();
    const verification = verifyAdvisorySnapshot(snapshot);

    expect(verification.verificationStatus).toBe("VALID");
    expect(verification.hashMatches).toBe(true);
    expect(verification.idMatches).toBe(true);
    expect(verification.snapshotHash).toBe(snapshot.snapshotHash);
    expect(verification.expectedSnapshotHash).toBe(snapshot.snapshotHash);
    expect(verification.snapshotId).toBe(snapshot.snapshotId);
    expect(verification.expectedSnapshotId).toBe(snapshot.snapshotId);
    expect(verification.replayable).toBe(true);
    expect(verification.authority).toBe("READ_ONLY");
    expect(verification.mayDeploy).toBe(false);
    expect(verification.mayRetry).toBe(false);
    expect(verification.mayRollback).toBe(false);
    expect(verification.mayCancel).toBe(false);
    expect(verification.mayResume).toBe(false);
    expect(verification.mayApprove).toBe(false);
    expect(verification.mayOverride).toBe(false);
  });

  it("ignores generatedAt when recomputing hash and id", () => {
    const first = verifyAdvisorySnapshot(validSnapshot("2026-05-29T12:00:00.000Z"));
    const second = verifyAdvisorySnapshot(validSnapshot("2026-05-29T13:00:00.000Z"));

    expect(first.expectedSnapshotHash).toBe(second.expectedSnapshotHash);
    expect(first.expectedSnapshotId).toBe(second.expectedSnapshotId);
    expect(first.verificationStatus).toBe("VALID");
    expect(second.verificationStatus).toBe("VALID");
  });

  it("disputes snapshotHash and snapshotId tampering", () => {
    const hashTampered = verifyAdvisorySnapshot({
      ...validSnapshot(),
      snapshotHash: "sha256:tampered",
    });
    const idTampered = verifyAdvisorySnapshot({
      ...validSnapshot(),
      snapshotId: "sha256:tampered",
    });

    expect(hashTampered.verificationStatus).toBe("DISPUTED");
    expect(hashTampered.hashMatches).toBe(false);
    expect(hashTampered.reasons).toContain("SNAPSHOT_HASH_MISMATCH");
    expect(idTampered.verificationStatus).toBe("DISPUTED");
    expect(idTampered.idMatches).toBe(false);
    expect(idTampered.reasons).toContain("SNAPSHOT_ID_MISMATCH");
  });

  it("disputes authority and control leaks", () => {
    const authorityLeak = verifyAdvisorySnapshot({
      ...validSnapshot(),
      authority: "CONTROL",
    });
    const controlLeak = verifyAdvisorySnapshot({
      ...validSnapshot(),
      mayCancel: true,
    });

    expect(authorityLeak.verificationStatus).toBe("DISPUTED");
    expect(authorityLeak.authority).toBe("READ_ONLY");
    expect(authorityLeak.reasons).toContain("AUTHORITY_NOT_READ_ONLY");
    expect(controlLeak.verificationStatus).toBe("DISPUTED");
    expect(controlLeak.mayCancel).toBe(false);
    expect(controlLeak.reasons).toContain("CONTROL_AUTHORITY_LEAK:mayCancel");
  });

  it("fails closed for missing and malformed snapshots", () => {
    const missing = verifyAdvisorySnapshot(undefined);
    const malformed = verifyAdvisorySnapshot("not-a-snapshot");
    const missingField = verifyAdvisorySnapshot({
      ...validSnapshot(),
      unifiedStatus: undefined,
    });

    expect(missing.verificationStatus).toBe("FAILED");
    expect(missing.reasons).toContain("SNAPSHOT_MISSING");
    expect(malformed.verificationStatus).toBe("FAILED");
    expect(malformed.reasons).toContain("SNAPSHOT_MALFORMED");
    expect(missingField.verificationStatus).toBe("FAILED");
    expect(missingField.reasons).toContain("REQUIRED_FIELDS_MISSING");
  });

  it("disputes unknown policy versions", () => {
    const verification = verifyAdvisorySnapshot({
      ...validSnapshot(),
      exportPolicyVersion: "advisory-snapshot-export/v2",
    });

    expect(verification.verificationStatus).toBe("DISPUTED");
    expect(verification.policyVersion).toBe("advisory-snapshot-export/v2");
    expect(verification.reasons).toContain("UNKNOWN_POLICY_VERSION:advisory-snapshot-export/v2");
  });

  it("does not mutate input and is deterministic", () => {
    const snapshot = validSnapshot();
    const snapshotBefore = JSON.stringify(snapshot);
    const first = verifyAdvisorySnapshot(snapshot);
    const second = verifyAdvisorySnapshot(snapshot);

    expect(JSON.stringify(snapshot)).toBe(snapshotBefore);
    expect(first).toEqual(second);
  });
});
