import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";

const require = createRequire(import.meta.url);
const telemetry = require("../../scripts/deploy-telemetry.cjs");

function tempTelemetryDir() {
  return mkdtempSync(path.join(tmpdir(), "deploy-telemetry-"));
}

const baseEnv = Object.freeze({
  GITHUB_WORKFLOW: "Deploy",
  GITHUB_RUN_ID: "123456",
  GITHUB_SHA: "abc123",
  DEPLOY_TELEMETRY_NOW: "2026-05-28T00:00:00.000Z",
});

describe("deploy telemetry script", () => {
  it("emits deploy_start telemetry with required fields", () => {
    const event = telemetry.buildTelemetryEvent({
      event: "deploy_start",
      step: "Resolve deployment metadata",
      state: "RUNNING",
      partition: "metadata",
      lastCompletedPartition: "none",
      certificateStatus: "UNVERIFIED",
    }, baseEnv);

    expect(event).toMatchObject({
      event: "deploy_start",
      workflowId: "Deploy",
      deploymentId: "123456",
      currentStep: "Resolve deployment metadata",
      currentPartition: "metadata",
      lastCompletedPartition: "none",
      heartbeatAt: "2026-05-28T00:00:00.000Z",
      failureClass: undefined,
      certificateStatus: "UNVERIFIED",
      checkpointStatus: "UNVERIFIED",
      resumeEligibility: "UNVERIFIED",
      environmentHash: "",
      deploymentDecision: "DISPUTED",
      deploymentRisk: "UNKNOWN",
      decisionPolicyVersion: "",
      decisionReasons: [],
      attemptCount: 1,
      state: "RUNNING",
    });
    expect(typeof event.elapsedTime).toBe("number");
  });

  it("emits deploy_complete telemetry", () => {
    const event = telemetry.buildTelemetryEvent({
      event: "deploy_complete",
      step: "Summarize deployment",
      state: "PASSED",
    }, baseEnv);

    expect(event.event).toBe("deploy_complete");
    expect(event.state).toBe("PASSED");
  });

  it("emits deploy_failed telemetry", () => {
    const event = telemetry.buildTelemetryEvent({
      event: "deploy_failed",
      step: "Deploy workflow",
      state: "FAILED",
      failureSignal: "npm run test:release failed",
    }, baseEnv);

    expect(event.event).toBe("deploy_failed");
    expect(event.state).toBe("FAILED");
    expect(event.failureClass).toBe("TEST_FAILURE");
  });

  it("emits heartbeat events with workflow, deployment, and elapsed fields", () => {
    const event = telemetry.buildTelemetryEvent({
      event: "release_test_running",
      step: "Test",
      partition: "test:release",
      startedAt: "2026-05-28T00:00:00.000Z",
    }, {
      ...baseEnv,
      DEPLOY_TELEMETRY_NOW: "2026-05-28T00:05:00.000Z",
    });

    expect(event.workflowId).toBe("Deploy");
    expect(event.deploymentId).toBe("123456");
    expect(event.elapsedTime).toBe(5);
    expect(event.heartbeatAt).toBe("2026-05-28T00:05:00.000Z");
  });

  it("classifies npm and network failures as infrastructure failures", () => {
    expect(telemetry.classifyFailure("npm ci network ECONNRESET")).toBe("INFRA_FAILURE");
    expect(telemetry.classifyFailure("ssh upload failed")).toBe("INFRA_FAILURE");
  });

  it("classifies test failures as test failures", () => {
    expect(telemetry.classifyFailure("npm run test:release failed")).toBe("TEST_FAILURE");
    expect(telemetry.classifyFailure("vitest assertion failure")).toBe("TEST_FAILURE");
  });

  it("maps unknown failures to UNKNOWN_FAILURE", () => {
    expect(telemetry.classifyFailure("something strange happened")).toBe("UNKNOWN_FAILURE");
  });

  it("normalizes unknown certificate status to UNVERIFIED and invalid status to DISPUTED", () => {
    expect(telemetry.normalizeCertificateStatus("UNKNOWN")).toBe("UNVERIFIED");
    expect(telemetry.normalizeCertificateStatus("mystery")).toBe("DISPUTED");
  });

  it("normalizes unknown checkpoint and resume states for read-only visibility", () => {
    expect(telemetry.normalizeCheckpointStatus("UNKNOWN")).toBe("UNVERIFIED");
    expect(telemetry.normalizeCheckpointStatus("mystery")).toBe("DISPUTED");
    expect(telemetry.normalizeResumeEligibility("UNKNOWN")).toBe("UNVERIFIED");
    expect(telemetry.normalizeResumeEligibility("mystery")).toBe("DISPUTED");
  });

  it("emits checkpoint and resume visibility fields", () => {
    const event = telemetry.buildTelemetryEvent({
      event: "checkpoint_validate_complete",
      step: "Checkpoint validation",
      state: "PROGRESSING",
      checkpointStatus: "SAFE",
      resumeEligibility: "ELIGIBLE",
      checkpointHash: "sha256:checkpoint",
      environmentHash: "sha256:environment",
    }, baseEnv);

    expect(event).toMatchObject({
      checkpointStatus: "SAFE",
      resumeEligibility: "ELIGIBLE",
      checkpointHash: "sha256:checkpoint",
      environmentHash: "sha256:environment",
    });
  });

  it("normalizes deployment decision and risk fields", () => {
    expect(telemetry.normalizeDeploymentDecision("allow")).toBe("ALLOW");
    expect(telemetry.normalizeDeploymentDecision("mystery")).toBe("DISPUTED");
    expect(telemetry.normalizeDeploymentRisk("critical")).toBe("CRITICAL");
    expect(telemetry.normalizeDeploymentRisk("mystery")).toBe("UNKNOWN");
  });

  it("emits deployment decision visibility fields", () => {
    const event = telemetry.buildTelemetryEvent({
      event: "deployment_decision_complete",
      step: "Deployment decision",
      state: "PROGRESSING",
      deploymentDecision: "BLOCK_RECOMMENDED",
      deploymentRisk: "CRITICAL",
      decisionPolicyVersion: "dh-deployment-decision/v1",
      decisionReasons: "POLICY_BLOCK_RECOMMENDED,HEARTBEAT_STALE",
    }, baseEnv);

    expect(event).toMatchObject({
      deploymentDecision: "BLOCK_RECOMMENDED",
      deploymentRisk: "CRITICAL",
      decisionPolicyVersion: "dh-deployment-decision/v1",
      decisionReasons: ["POLICY_BLOCK_RECOMMENDED", "HEARTBEAT_STALE"],
    });
  });

  it("telemetry emission failure does not alter deploy result", () => {
    const filePath = path.join(tmpdir(), `deploy-telemetry-file-${Date.now()}.json`);
    writeFileSync(filePath, "not a directory");

    const result = telemetry.safeEmitTelemetry({
      event: "deploy_start",
      step: "Resolve deployment metadata",
      state: "RUNNING",
    }, {
      dir: filePath,
      env: baseEnv,
    });

    expect(result).toMatchObject({
      telemetry_status: "failed_to_emit",
      deployment_status: "unchanged",
    });
    rmSync(filePath, { force: true });
  });

  it("writes deterministic evidence artifacts", () => {
    const dir = tempTelemetryDir();
    const first = telemetry.safeEmitTelemetry({
      event: "deploy_start",
      step: "Resolve deployment metadata",
      state: "RUNNING",
    }, { dir, env: baseEnv });
    const second = telemetry.safeEmitTelemetry({
      event: "deploy_complete",
      step: "Summarize deployment",
      state: "PASSED",
    }, { dir, env: { ...baseEnv, DEPLOY_TELEMETRY_NOW: "2026-05-28T00:01:00.000Z" } });

    expect(first.telemetry_status).toBe("emitted");
    expect(second.telemetry_status).toBe("emitted");
    expect(second.evidence.evidenceHash).toMatch(/^sha256:/);
    expect(second.evidence.evidenceHash).toBe(telemetry.hashDeploymentTelemetryEvidence({
      ...second.evidence,
      evidenceHash: undefined,
    }));
    rmSync(dir, { recursive: true, force: true });
  });

  it("preserves all required telemetry fields", () => {
    const event = telemetry.buildTelemetryEvent({
      event: "build_start",
      step: "Build standalone bundle",
      state: "PROGRESSING",
    }, baseEnv);

    for (const field of telemetry.REQUIRED_TELEMETRY_FIELDS) {
      expect(Object.prototype.hasOwnProperty.call(event, field)).toBe(true);
    }
  });
});
