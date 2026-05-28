import { describe, expect, it } from "vitest";

import {
  evaluateDeploymentHardening,
  issueDeploymentHardeningCertificate,
  verifyDeploymentEvidenceReplay,
} from "../../services/deployment-hardening/index.ts";

const startedAt = "2026-05-28T00:00:00.000Z";

function minutesAfter(minutes: number) {
  return new Date(Date.parse(startedAt) + minutes * 60_000).toISOString();
}

const certificateInput = Object.freeze({
  commitSHA: "abc123",
  workflowRunId: "run-123",
  testHash: "sha256:test",
  residueStatus: "CLEAN" as const,
  governanceStatus: "PASSED" as const,
  approvalLineage: Object.freeze(["approval:release-governance"]),
  timestamp: startedAt,
});

function validCertificate() {
  const result = issueDeploymentHardeningCertificate(certificateInput);
  if (!result.ok) {
    throw new Error(result.reasons.join(","));
  }
  return result.certificate;
}

const baseSnapshot = Object.freeze({
  workflowId: "Deploy",
  deploymentId: "deploy:phase-3.7",
  workflowRunId: "run-123",
  commitSHA: "abc123",
  currentStep: "Build standalone bundle",
  currentPartition: "package",
  lastCompletedPartition: "test:release",
  startedAt,
  updatedAt: minutesAfter(12),
  observedAt: minutesAfter(12),
  heartbeatAt: minutesAfter(11),
  lastProgressAt: minutesAfter(11),
  attemptCount: 1,
  lockfileHash: "sha256:lockfile",
  environmentHash: "sha256:environment",
  certificateStatus: "VALID" as const,
  certificate: validCertificate(),
  logs: Object.freeze([
    Object.freeze({ at: minutesAfter(1), message: "release gate passed" }),
    Object.freeze({ at: minutesAfter(11), message: "bundle progressing" }),
  ]),
  artifacts: Object.freeze([
    Object.freeze({ name: "ai-command-console-release.tgz", hash: "sha256:artifact" }),
  ]),
  replay: Object.freeze({
    runtimeHash: "sha256:runtime",
    replayHash: "sha256:runtime",
    replayBundlePresent: true,
  }),
});

describe("deployment hardening", () => {
  it("issues deterministic deployment certificates", () => {
    const first = issueDeploymentHardeningCertificate(certificateInput);
    const second = issueDeploymentHardeningCertificate({ ...certificateInput });

    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);
    if (!first.ok || !second.ok) return;
    expect(first.certificate.certificateHash).toBe(second.certificate.certificateHash);
    expect(first.certificate.certificateHash).toMatch(/^sha256:/);
    expect(Object.isFrozen(first.certificate)).toBe(true);
  });

  it("rejects certificates with disputed governance or dirty residue", () => {
    expect(issueDeploymentHardeningCertificate({ ...certificateInput, governanceStatus: "DISPUTED" }).ok).toBe(false);
    expect(issueDeploymentHardeningCertificate({ ...certificateInput, residueStatus: "DIRTY" }).ok).toBe(false);
  });

  it("passes the normal path with live telemetry and replayable evidence", () => {
    const result = evaluateDeploymentHardening(baseSnapshot);

    expect(result.ok).toBe(true);
    expect(result.state).toBe("PROGRESSING");
    expect(result.telemetry).toMatchObject({
      workflowId: "Deploy",
      deploymentId: "deploy:phase-3.7",
      currentStep: "Build standalone bundle",
      currentPartition: "package",
      lastCompletedPartition: "test:release",
      failureClass: undefined,
      certificateStatus: "VALID",
      attemptCount: 1,
    });
    expect(result.evidence.evidenceHash).toMatch(/^sha256:/);
    expect(verifyDeploymentEvidenceReplay(result.evidence).ok).toBe(true);
  });

  it("classifies stalled deployments automatically", () => {
    const result = evaluateDeploymentHardening({
      ...baseSnapshot,
      observedAt: minutesAfter(50),
      updatedAt: minutesAfter(15),
      heartbeatAt: minutesAfter(15),
      lastProgressAt: minutesAfter(15),
    });

    expect(result.ok).toBe(false);
    expect(result.state).toBe("STALLED");
    expect(result.containment.frozen).toBe(true);
    expect(result.reasons).toContain("NO_PROGRESS_CONTAINMENT_CANDIDATE");
  });

  it("classifies workflow timeouts as timeout failures", () => {
    const result = evaluateDeploymentHardening({
      ...baseSnapshot,
      failureSignal: "workflow timeout after 75 minutes",
      observedAt: minutesAfter(76),
      updatedAt: minutesAfter(75),
      heartbeatAt: minutesAfter(75),
    });

    expect(result.ok).toBe(false);
    expect(result.state).toBe("FAILED");
    expect(result.failureClass).toBe("TIMEOUT_FAILURE");
  });

  it("disputes unknown deployment state", () => {
    const result = evaluateDeploymentHardening({
      ...baseSnapshot,
      state: "MYSTERY",
    });

    expect(result.ok).toBe(false);
    expect(result.state).toBe("DISPUTED");
    expect(result.reasons).toContain("UNKNOWN_DEPLOYMENT_STATE");
  });

  it("blocks deployment when certificate governance is invalid", () => {
    const invalid = {
      ...validCertificate(),
      governanceStatus: "FAILED" as const,
    };

    const result = evaluateDeploymentHardening({
      ...baseSnapshot,
      certificate: invalid,
      certificateStatus: "INVALID",
      operatorAction: "START_DEPLOY",
    });

    expect(result.ok).toBe(false);
    expect(result.state).toBe("BLOCKED");
    expect(result.operatorActions.deployAllowed).toBe(false);
    expect(result.reasons).toContain("CERTIFICATE_INVALID");
  });

  it("blocks duplicate deployment attempts", () => {
    const result = evaluateDeploymentHardening({
      ...baseSnapshot,
      operatorAction: "START_DEPLOY",
      activeDeployment: {
        deploymentId: "deploy:other",
        state: "RUNNING",
      },
    });

    expect(result.ok).toBe(false);
    expect(result.state).toBe("BLOCKED");
    expect(result.reasons).toContain("ACTIVE_DEPLOYMENT_EXISTS");
  });

  it("blocks retry without legal failure classification", () => {
    const result = evaluateDeploymentHardening({
      ...baseSnapshot,
      operatorAction: "RETRY",
      failureClass: "UNKNOWN_FAILURE",
    });

    expect(result.ok).toBe(false);
    expect(result.state).toBe("DISPUTED");
    expect(result.operatorActions.retryAllowed).toBe(false);
    expect(result.reasons).toContain("RETRY_REQUIRES_CLASSIFICATION");
  });

  it("invalidates checkpoint when commit changes", () => {
    const result = evaluateDeploymentHardening({
      ...baseSnapshot,
      operatorAction: "RESUME",
      checkpoint: {
        deploymentId: baseSnapshot.deploymentId,
        commitSHA: "different",
        lockfileHash: baseSnapshot.lockfileHash,
        environmentHash: baseSnapshot.environmentHash,
        certificateHash: baseSnapshot.certificate.certificateHash,
        lastCompletedPartition: baseSnapshot.lastCompletedPartition,
        timestamp: minutesAfter(10),
      },
    });

    expect(result.ok).toBe(false);
    expect(result.state).toBe("BLOCKED");
    expect(result.checkpoint.status).toBe("INVALID");
    expect(result.checkpoint.reasons).toContain("CHECKPOINT_COMMIT_CHANGED");
  });

  it("allows checkpoint resume only when commit, lockfile, environment, and certificate match", () => {
    const result = evaluateDeploymentHardening({
      ...baseSnapshot,
      operatorAction: "RESUME",
      checkpoint: {
        deploymentId: baseSnapshot.deploymentId,
        commitSHA: baseSnapshot.commitSHA,
        lockfileHash: baseSnapshot.lockfileHash,
        environmentHash: baseSnapshot.environmentHash,
        certificateHash: baseSnapshot.certificate.certificateHash,
        lastCompletedPartition: baseSnapshot.lastCompletedPartition,
        timestamp: minutesAfter(10),
      },
    });

    expect(result.ok).toBe(true);
    expect(result.checkpoint.status).toBe("VALID");
    expect(result.operatorActions.resumeAllowed).toBe(true);
  });

  it("detects replay tampering in evidence bundles", () => {
    const result = evaluateDeploymentHardening(baseSnapshot);
    const replay = verifyDeploymentEvidenceReplay({
      ...result.evidence,
      logs: [{ at: minutesAfter(1), message: "tampered" }],
    });

    expect(replay.ok).toBe(false);
    expect(replay.status).toBe("DISPUTED");
    expect(replay.hashMismatches).toContain("deployment-hardening-evidence");
  });

  it("blocks rollback without certificate and evidence", () => {
    const result = evaluateDeploymentHardening({
      ...baseSnapshot,
      operatorAction: "ROLLBACK",
      certificate: undefined,
      logs: [],
    });

    expect(result.ok).toBe(false);
    expect(result.state).toBe("BLOCKED");
    expect(result.operatorActions.rollbackAllowed).toBe(false);
    expect(result.reasons).toContain("CERTIFICATE_MISSING");
    expect(result.reasons).toContain("LOG_EVIDENCE_MISSING");
  });
});
