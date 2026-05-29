import { describe, expect, it } from "vitest";

import {
  buildReleaseEvidenceBundle,
  issueReleaseCertificate,
  verifyDeployCertificate,
  verifyReleaseReplayBundle,
} from "../../services/release-certification/index.ts";

const baseInput = Object.freeze({
  releaseId: "phase-3.7-workstream-e",
  commitSha: "abc123def456",
  testHash: "sha256:test-hash",
  artifactHash: "sha256:artifact-hash",
  governanceStatus: "PASSED" as const,
  residueResult: "CLEAN" as const,
  approvalLineage: Object.freeze(["approval:release-owner", "approval:governance-review"]),
  generatedAt: "2026-05-28T00:00:00.000Z",
});

function validCertificate() {
  const result = issueReleaseCertificate(baseInput);
  if (!result.ok) {
    throw new Error(`fixture certificate failed: ${result.reasons.join(",")}`);
  }
  return result.certificate;
}

function validBundle() {
  return buildReleaseEvidenceBundle({
    certificate: validCertificate(),
    approvals: Object.freeze({
      approvalLineage: [...baseInput.approvalLineage],
      reviewedBy: "release-governance",
    }),
    governance: Object.freeze({
      status: "PASSED",
      checks: ["fail_closed_preserved", "continuity_verified"],
    }),
    testResults: Object.freeze({
      command: "npm run test:release",
      status: "PASSED",
      partitions: 173,
    }),
    artifactHashes: Object.freeze({
      "release.tar.gz": baseInput.artifactHash,
    }),
    timeline: Object.freeze([
      { at: baseInput.generatedAt, event: "release.certificate.issued" },
    ]),
    generatedAt: baseInput.generatedAt,
  });
}

describe("release certification", () => {
  it("issues valid immutable release certificates", () => {
    const result = issueReleaseCertificate(baseInput);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(Object.isFrozen(result.certificate)).toBe(true);
    expect(result.certificate.certificateVersion).toBe("1.0");
    expect(result.certificate.commitSha).toBe(baseInput.commitSha);
    expect(result.certificate.governanceStatus).toBe("PASSED");
    expect(result.certificate.residueResult).toBe("CLEAN");
    expect(result.certificate.certificateHash).toMatch(/^sha256:/);
  });

  it("hashes certificates deterministically and excludes certificateHash from the preimage", () => {
    const first = issueReleaseCertificate({ ...baseInput, approvalLineage: [...baseInput.approvalLineage] });
    const second = issueReleaseCertificate({ ...baseInput, approvalLineage: [...baseInput.approvalLineage] });

    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);
    if (!first.ok || !second.ok) return;
    expect(first.certificate.certificateHash).toBe(second.certificate.certificateHash);
    expect(
      issueReleaseCertificate({
        ...baseInput,
        approvalLineage: [...baseInput.approvalLineage],
        certificateHash: "sha256:forged",
      }).ok,
    ).toBe(true);
  });

  it("rejects UNKNOWN governance", () => {
    const result = issueReleaseCertificate({ ...baseInput, governanceStatus: "UNKNOWN" });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reasons).toContain("GOVERNANCE_NOT_PASSED");
  });

  it("rejects dirty residue", () => {
    const result = issueReleaseCertificate({ ...baseInput, residueResult: "DIRTY" });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reasons).toContain("RESIDUE_NOT_CLEAN");
  });

  it("rejects empty approval lineage", () => {
    const result = issueReleaseCertificate({ ...baseInput, approvalLineage: [] });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reasons).toContain("APPROVAL_LINEAGE_MISSING");
  });

  it("verifies deploy certificates without rerunning release tests", () => {
    const certificate = validCertificate();
    const bundle = validBundle();

    const result = verifyDeployCertificate({
      certificate,
      expectedCommitSha: certificate.commitSha,
      expectedArtifactHash: certificate.artifactHash,
      replayBundle: bundle,
    });

    expect(result).toEqual({
      ok: true,
      status: "VERIFIED",
      reasons: [],
      certificateHash: certificate.certificateHash,
      commitSha: certificate.commitSha,
    });
  });

  it("blocks deploy verification on commit mismatch", () => {
    const certificate = validCertificate();

    const result = verifyDeployCertificate({
      certificate,
      expectedCommitSha: "different",
      expectedArtifactHash: certificate.artifactHash,
      replayBundle: validBundle(),
    });

    expect(result.ok).toBe(false);
    expect(result.status).toBe("BLOCKED");
    expect(result.reasons).toContain("COMMIT_MISMATCH");
  });

  it("blocks deploy verification on artifact mismatch", () => {
    const certificate = validCertificate();

    const result = verifyDeployCertificate({
      certificate,
      expectedCommitSha: certificate.commitSha,
      expectedArtifactHash: "sha256:different",
      replayBundle: validBundle(),
    });

    expect(result.ok).toBe(false);
    expect(result.status).toBe("BLOCKED");
    expect(result.reasons).toContain("ARTIFACT_HASH_MISMATCH");
  });

  it("blocks deploy verification on invalid governance", () => {
    const invalid = {
      ...validCertificate(),
      governanceStatus: "FAILED" as const,
    };

    const result = verifyDeployCertificate({
      certificate: invalid,
      expectedCommitSha: invalid.commitSha,
      expectedArtifactHash: invalid.artifactHash,
      replayBundle: validBundle(),
    });

    expect(result.ok).toBe(false);
    expect(result.status).toBe("BLOCKED");
    expect(result.reasons).toContain("CERTIFICATE_HASH_INVALID");
    expect(result.reasons).toContain("GOVERNANCE_NOT_PASSED");
  });

  it("detects missing replay evidence", () => {
    const bundle = validBundle();
    const result = verifyReleaseReplayBundle({
      ...bundle,
      approvals: undefined,
    });

    expect(result.ok).toBe(false);
    expect(result.status).toBe("NOT_REPLAYABLE");
    expect(result.missingEvidence).toContain("approvals.json");
  });

  it("detects replay evidence hash mismatches", () => {
    const bundle = validBundle();
    const result = verifyReleaseReplayBundle({
      ...bundle,
      artifactHashes: {
        "release.tar.gz": "sha256:mutated",
      },
    });

    expect(result.ok).toBe(false);
    expect(result.status).toBe("DISPUTED");
    expect(result.hashMismatches).toContain("artifact-hashes.json");
  });
});
