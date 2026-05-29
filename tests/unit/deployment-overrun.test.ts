import { describe, expect, it } from "vitest";

import {
  evaluateDeploymentOverrun,
  verifyDeploymentOverrunReplayEvidence,
} from "../../services/deployment-overrun/index.ts";

const startedAt = "2026-05-28T00:00:00.000Z";

function minutesAfter(minutes: number) {
  return new Date(Date.parse(startedAt) + minutes * 60_000).toISOString();
}

const baseSnapshot = Object.freeze({
  workflowId: "deploy",
  workflowName: "Deploy",
  runId: "run-123",
  commitSha: "abc123",
  startedAt,
  updatedAt: minutesAfter(70),
  observedAt: minutesAfter(70),
  lastProgressAt: minutesAfter(68),
  heartbeatAt: minutesAfter(69),
  activeJob: "package",
  activeStep: "Build standalone bundle",
  releaseGatePassed: true,
  approvalLineage: Object.freeze(["approval:release-governance"]),
  logs: Object.freeze([
    Object.freeze({ at: minutesAfter(1), message: "deployment started" }),
    Object.freeze({ at: minutesAfter(68), message: "build still progressing" }),
  ]),
  artifacts: Object.freeze([
    Object.freeze({ name: "ai-command-console-release.tgz", hash: "sha256:artifact" }),
  ]),
  smokeResults: Object.freeze({ status: "pending" }),
  certification: Object.freeze({
    certificateHash: "sha256:certificate",
    releaseId: "phase-3.6-rc1",
    governanceStatus: "PASSED" as const,
    residueResult: "CLEAN" as const,
    artifactHash: "sha256:artifact",
    commitSha: "abc123",
  }),
  replay: Object.freeze({
    runtimeHash: "sha256:runtime",
    replayHash: "sha256:runtime",
    replayBundlePresent: true,
  }),
});

describe("deployment overrun response", () => {
  it("keeps a long-running deploy active when progress evidence is fresh", () => {
    const result = evaluateDeploymentOverrun({
      ...baseSnapshot,
      observedAt: minutesAfter(108),
      updatedAt: minutesAfter(107),
      lastProgressAt: minutesAfter(104),
      heartbeatAt: minutesAfter(107),
    });

    expect(result.ok).toBe(true);
    expect(result.state).toBe("ACTIVE_SLOW");
    expect(result.containment.frozen).toBe(false);
    expect(result.telemetry.elapsedMinutes).toBe(108);
  });

  it("classifies a slow but healthy deploy as observe-only before stuck thresholds", () => {
    const result = evaluateDeploymentOverrun({
      ...baseSnapshot,
      observedAt: minutesAfter(82),
      updatedAt: minutesAfter(81),
      lastProgressAt: minutesAfter(80),
      heartbeatAt: minutesAfter(81),
    });

    expect(result.ok).toBe(true);
    expect(result.state).toBe("OBSERVE_ONLY");
    expect(result.operatorActions.newDeployAllowed).toBe(false);
  });

  it("contains stalled deployments after sustained no-progress evidence", () => {
    const result = evaluateDeploymentOverrun({
      ...baseSnapshot,
      observedAt: minutesAfter(96),
      updatedAt: minutesAfter(64),
      lastProgressAt: minutesAfter(64),
      heartbeatAt: minutesAfter(95),
    });

    expect(result.ok).toBe(false);
    expect(result.state).toBe("STALLED");
    expect(result.containment).toMatchObject({
      frozen: true,
      blockRetries: true,
      blockNewDeploys: true,
      preserveLogs: true,
      preserveArtifacts: true,
      preserveCertificationLineage: true,
    });
  });

  it("classifies manual cancellation as operator-interrupted and preserves evidence", () => {
    const result = evaluateDeploymentOverrun({
      ...baseSnapshot,
      sourceStatus: "cancelled",
      failureSignal: "manual cancellation by operator",
      observedAt: minutesAfter(40),
      updatedAt: minutesAfter(40),
      heartbeatAt: minutesAfter(39),
    });

    expect(result.state).toBe("FAILED");
    expect(result.classification).toBe("OPERATOR_INTERRUPTED");
    expect(result.evidence.logs).toHaveLength(2);
    expect(result.evidence.artifacts).toHaveLength(1);
  });

  it("classifies workflow timeout as timeout failure and freezes recovery actions", () => {
    const result = evaluateDeploymentOverrun({
      ...baseSnapshot,
      sourceStatus: "timed_out",
      failureSignal: "workflow timeout after 75 minutes",
      observedAt: minutesAfter(76),
      updatedAt: minutesAfter(75),
      heartbeatAt: minutesAfter(75),
    });

    expect(result.ok).toBe(false);
    expect(result.state).toBe("TIMEOUT_FAILURE");
    expect(result.classification).toBe("TIMEOUT_FAILURE");
    expect(result.operatorActions.retryAllowed).toBe(false);
  });

  it("disputes deployments with missing logs", () => {
    const result = evaluateDeploymentOverrun({
      ...baseSnapshot,
      logs: [],
    });

    expect(result.ok).toBe(false);
    expect(result.state).toBe("DISPUTED");
    expect(result.reasons).toContain("LOG_EVIDENCE_MISSING");
  });

  it("disputes deployments with missing heartbeat", () => {
    const result = evaluateDeploymentOverrun({
      ...baseSnapshot,
      heartbeatAt: undefined,
    });

    expect(result.ok).toBe(false);
    expect(result.state).toBe("DISPUTED");
    expect(result.reasons).toContain("HEARTBEAT_MISSING");
  });

  it("blocks duplicate deployment attempts while another deployment is active", () => {
    const result = evaluateDeploymentOverrun({
      ...baseSnapshot,
      operatorAction: "START_DEPLOY",
      activeDeployment: {
        runId: "run-previous",
        state: "RUNNING",
      },
    });

    expect(result.ok).toBe(false);
    expect(result.state).toBe("BLOCKED");
    expect(result.operatorActions.newDeployAllowed).toBe(false);
    expect(result.reasons).toContain("DUPLICATE_DEPLOYMENT_ATTEMPT");
  });

  it("blocks retries without a legal failure classification", () => {
    const result = evaluateDeploymentOverrun({
      ...baseSnapshot,
      operatorAction: "RETRY",
      failureClassification: "UNKNOWN_FAILURE",
    });

    expect(result.ok).toBe(false);
    expect(result.state).toBe("DISPUTED");
    expect(result.operatorActions.retryAllowed).toBe(false);
    expect(result.reasons).toContain("RETRY_REQUIRES_CLASSIFICATION");
  });

  it("disputes classification mismatches instead of trusting operator input", () => {
    const result = evaluateDeploymentOverrun({
      ...baseSnapshot,
      sourceStatus: "failure",
      failureSignal: "network ECONNRESET during scp upload",
      failureClassification: "CODE_FAILURE",
      observedAt: minutesAfter(30),
      updatedAt: minutesAfter(30),
      heartbeatAt: minutesAfter(30),
    });

    expect(result.ok).toBe(false);
    expect(result.state).toBe("DISPUTED");
    expect(result.classification).toBe("UNKNOWN_FAILURE");
    expect(result.reasons).toContain("CLASSIFICATION_MISMATCH");
  });

  it("blocks release gate bypass attempts", () => {
    const result = evaluateDeploymentOverrun({
      ...baseSnapshot,
      operatorAction: "START_DEPLOY",
      releaseGatePassed: false,
    });

    expect(result.ok).toBe(false);
    expect(result.state).toBe("BLOCKED");
    expect(result.reasons).toContain("RELEASE_GATE_NOT_PASSED");
  });

  it("preserves artifacts and certification lineage during containment", () => {
    const result = evaluateDeploymentOverrun({
      ...baseSnapshot,
      observedAt: minutesAfter(106),
      updatedAt: minutesAfter(70),
      lastProgressAt: minutesAfter(70),
      heartbeatAt: minutesAfter(105),
    });

    expect(result.containment.frozen).toBe(true);
    expect(result.evidence.artifacts).toEqual(baseSnapshot.artifacts);
    expect(result.evidence.approvalLineage).toEqual(baseSnapshot.approvalLineage);
    expect(result.evidence.certification).toEqual(baseSnapshot.certification);
    expect(result.evidence.evidenceHash).toMatch(/^sha256:/);
    expect(Object.isFrozen(result.evidence)).toBe(true);
  });

  it("reconstructs replay evidence deterministically and detects tampering", () => {
    const first = evaluateDeploymentOverrun({
      ...baseSnapshot,
      observedAt: minutesAfter(106),
      updatedAt: minutesAfter(70),
      lastProgressAt: minutesAfter(70),
      heartbeatAt: minutesAfter(105),
    });
    const second = evaluateDeploymentOverrun({
      ...baseSnapshot,
      observedAt: minutesAfter(106),
      updatedAt: minutesAfter(70),
      lastProgressAt: minutesAfter(70),
      heartbeatAt: minutesAfter(105),
    });

    expect(first.evidence.evidenceHash).toBe(second.evidence.evidenceHash);
    expect(verifyDeploymentOverrunReplayEvidence(first.evidence)).toMatchObject({
      ok: true,
      status: "REPLAYABLE",
      hashMismatches: [],
    });

    expect(
      verifyDeploymentOverrunReplayEvidence({
        ...first.evidence,
        logs: [{ at: minutesAfter(1), message: "tampered" }],
      }),
    ).toMatchObject({
      ok: false,
      status: "DISPUTED",
      hashMismatches: ["deployment-overrun-evidence"],
    });
  });

  it("blocks cancellation when there is no evidence of stuck, failed, or unsafe deployment", () => {
    const result = evaluateDeploymentOverrun({
      ...baseSnapshot,
      operatorAction: "CANCEL",
      observedAt: minutesAfter(40),
      updatedAt: minutesAfter(39),
      lastProgressAt: minutesAfter(39),
      heartbeatAt: minutesAfter(39),
    });

    expect(result.ok).toBe(false);
    expect(result.state).toBe("BLOCKED");
    expect(result.operatorActions.cancelAllowed).toBe(false);
    expect(result.reasons).toContain("CANCELLATION_REQUIRES_STUCK_FAILED_OR_UNSAFE_EVIDENCE");
  });
});
