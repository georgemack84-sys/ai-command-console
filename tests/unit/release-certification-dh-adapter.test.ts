import { describe, expect, it } from "vitest";

import {
  adaptDhArtifactsForReleaseCertification,
  hashReleaseValue,
} from "../../services/release-certification/index.ts";

const commitSha = "abc123def456";

function completeDhArtifacts(overrides: Record<string, unknown> = {}) {
  return {
    "certificate-verification.json": {
      workflowId: "deploy",
      deploymentId: "run-100",
      commitSha,
      certificateStatus: "VALID",
      certificateHash: "sha256:certificate",
      artifactHash: "sha256:artifact",
      failureClass: null,
    },
    "deployment-evidence.json": {
      workflowId: "deploy",
      deploymentId: "run-100",
      commitSha,
      evidenceHash: "sha256:evidence",
      artifactHash: "sha256:artifact",
    },
    "deployment-audit-certification.json": {
      workflowId: "deploy",
      deploymentId: "run-100",
      commitSha,
      certificationStatus: "CERTIFIED",
      evidenceHash: "sha256:audit-evidence",
      lineageHash: "sha256:audit-lineage",
      certificateHash: "sha256:certificate",
      completenessScore: 1,
    },
    "deployment-governance-replay.json": {
      workflowId: "deploy",
      deploymentId: "run-100",
      commitSha,
      replayStatus: "CONSISTENT",
      replayHash: "sha256:governance-replay",
      expectedLineageHash: "sha256:audit-lineage",
      reconstructedLineageHash: "sha256:audit-lineage",
      driftDetected: false,
    },
    "deployment-summary.json": {
      workflowId: "deploy",
      deploymentId: "run-100",
      commitSha,
    },
    ...overrides,
  };
}

function withoutArtifact(name: string) {
  const artifacts = completeDhArtifacts();
  delete artifacts[name as keyof typeof artifacts];
  return artifacts;
}

describe("release certification DH adapter", () => {
  it("maps complete DH evidence to COMPATIBLE", () => {
    const result = adaptDhArtifactsForReleaseCertification({
      artifacts: completeDhArtifacts(),
    });

    expect(result.status).toBe("COMPATIBLE");
    expect(result.commitSha).toBe(commitSha);
    expect(result.certificateStatus).toBe("VALID");
    expect(result.evidenceHash).toBe("sha256:evidence");
    expect(result.artifactHash).toBe("sha256:artifact");
    expect(result.auditCertificationHash).toBe("sha256:audit-lineage");
    expect(result.governanceReplayHash).toBe("sha256:governance-replay");
    expect(result.replayEvidenceAvailable).toBe(true);
    expect(result.reasons).toEqual([]);
  });

  it("fails closed when minimum certificate evidence is missing", () => {
    const result = adaptDhArtifactsForReleaseCertification({ artifacts: withoutArtifact("certificate-verification.json") });

    expect(result.status).toBe("FAILED");
    expect(result.reasons).toContain("REQUIRED_DH_ARTIFACT_MISSING:certificate-verification.json");
  });

  it("fails closed when audit certification evidence is missing", () => {
    const result = adaptDhArtifactsForReleaseCertification({ artifacts: withoutArtifact("deployment-audit-certification.json") });

    expect(result.status).toBe("FAILED");
    expect(result.reasons).toContain("REQUIRED_DH_ARTIFACT_MISSING:deployment-audit-certification.json");
  });

  it("fails closed when governance replay evidence is missing", () => {
    const result = adaptDhArtifactsForReleaseCertification({ artifacts: withoutArtifact("deployment-governance-replay.json") });

    expect(result.status).toBe("FAILED");
    expect(result.replayEvidenceAvailable).toBe(false);
    expect(result.reasons).toContain("REQUIRED_DH_ARTIFACT_MISSING:deployment-governance-replay.json");
  });

  it("returns PARTIAL when optional artifacts are missing", () => {
    const result = adaptDhArtifactsForReleaseCertification({
      artifacts: completeDhArtifacts({
        "deployment-summary.json": undefined,
      }),
    });

    expect(result.status).toBe("PARTIAL");
    expect(result.reasons).toContain("OPTIONAL_DH_ARTIFACT_MISSING:deployment-summary.json");
  });

  it("normalizes commitSha and commitSHA deterministically", () => {
    const result = adaptDhArtifactsForReleaseCertification({
      artifacts: completeDhArtifacts({
        "deployment-evidence.json": {
          workflowId: "deploy",
          deploymentId: "run-100",
          commitSHA: commitSha,
          evidenceHash: "sha256:evidence",
          artifactHash: "sha256:artifact",
        },
      }),
    });

    expect(result.status).toBe("COMPATIBLE");
    expect(result.commitSha).toBe(commitSha);
    expect(result.schemaMismatches).toContainEqual({
      sourceField: "deployment-evidence.json.commitSHA",
      targetField: "commitSha",
      resolution: "NORMALIZED",
      reason: "commitSHA normalized to commitSha",
    });
  });

  it("reports artifactHash absence explicitly", () => {
    const result = adaptDhArtifactsForReleaseCertification({
      artifacts: completeDhArtifacts({
        "deployment-evidence.json": {
          workflowId: "deploy",
          deploymentId: "run-100",
          commitSha,
          evidenceHash: "sha256:evidence",
        },
        "certificate-verification.json": {
          workflowId: "deploy",
          deploymentId: "run-100",
          commitSha,
          certificateStatus: "VALID",
          certificateHash: "sha256:certificate",
          failureClass: null,
        },
      }),
    });

    expect(result.status).toBe("PARTIAL");
    expect(result.artifactHash).toBeNull();
    expect(result.schemaMismatches).toContainEqual({
      sourceField: "deployment-evidence.json.artifactHash",
      targetField: "artifactHash",
      resolution: "MISSING",
      reason: "DH evidence did not expose a release artifact hash",
    });
  });

  it("returns DISPUTED for conflicting commit evidence", () => {
    const result = adaptDhArtifactsForReleaseCertification({
      artifacts: completeDhArtifacts({
        "deployment-governance-replay.json": {
          workflowId: "deploy",
          deploymentId: "run-100",
          commitSha: "different",
          replayStatus: "CONSISTENT",
          replayHash: "sha256:governance-replay",
          expectedLineageHash: "sha256:audit-lineage",
          reconstructedLineageHash: "sha256:audit-lineage",
          driftDetected: false,
        },
      }),
    });

    expect(result.status).toBe("DISPUTED");
    expect(result.reasons).toContain("COMMIT_SHA_CONFLICT");
  });

  it("returns DISPUTED for conflicting certificate evidence", () => {
    const result = adaptDhArtifactsForReleaseCertification({
      artifacts: completeDhArtifacts({
        "deployment-audit-certification.json": {
          workflowId: "deploy",
          deploymentId: "run-100",
          commitSha,
          certificationStatus: "CERTIFIED",
          evidenceHash: "sha256:audit-evidence",
          lineageHash: "sha256:audit-lineage",
          certificateHash: "sha256:different-certificate",
          completenessScore: 1,
        },
      }),
    });

    expect(result.status).toBe("DISPUTED");
    expect(result.reasons).toContain("CERTIFICATE_HASH_CONFLICT");
  });

  it("returns DISPUTED for artifact hash mismatch", () => {
    const artifact = {
      name: "certificate-verification.json",
      data: completeDhArtifacts()["certificate-verification.json"],
      hash: "sha256:forged",
    };

    const result = adaptDhArtifactsForReleaseCertification({
      artifacts: [
        artifact,
        ...Object.entries(completeDhArtifacts())
          .filter(([name]) => name !== artifact.name)
          .map(([name, data]) => ({ name, data })),
      ],
    });

    expect(result.status).toBe("DISPUTED");
    expect(result.reasons).toContain("DH_ARTIFACT_HASH_MISMATCH:certificate-verification.json");
  });

  it("produces deterministic mapped artifact and schema mismatch reports", () => {
    const first = adaptDhArtifactsForReleaseCertification({
      artifacts: completeDhArtifacts({
        "deployment-evidence.json": {
          workflowId: "deploy",
          deploymentId: "run-100",
          commitSHA: commitSha,
          evidenceHash: "sha256:evidence",
        },
      }),
    });
    const second = adaptDhArtifactsForReleaseCertification({
      artifacts: completeDhArtifacts({
        "deployment-evidence.json": {
          evidenceHash: "sha256:evidence",
          deploymentId: "run-100",
          commitSHA: commitSha,
          workflowId: "deploy",
        },
      }),
    });

    expect(first.mappedArtifacts).toEqual(second.mappedArtifacts);
    expect(first.schemaMismatches).toEqual(second.schemaMismatches);
    expect(hashReleaseValue(first.mappedArtifacts)).toBe(hashReleaseValue(second.mappedArtifacts));
  });

  it("contains authority as read-only and cannot control deployment", () => {
    const result = adaptDhArtifactsForReleaseCertification({
      artifacts: completeDhArtifacts(),
    });
    const serialized = JSON.stringify(result);

    expect(result.authority).toBe("READ_ONLY");
    expect(result.mayBlockDeployment).toBe(false);
    expect(result.mayTriggerRetry).toBe(false);
    expect(result.mayTriggerRollback).toBe(false);
    expect(serialized).not.toContain("deployable");
    expect(serialized).not.toContain("retryAllowed");
    expect(serialized).not.toContain("cancelAllowed");
    expect(serialized).not.toContain("rollbackAllowed");
    expect(serialized).not.toContain("newDeployAllowed");
  });
});
