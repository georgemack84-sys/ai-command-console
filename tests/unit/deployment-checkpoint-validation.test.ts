import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";

const require = createRequire(import.meta.url);
const checkpoint = require("../../scripts/deploy-checkpoint-validate.cjs");

function tempDir() {
  return mkdtempSync(path.join(tmpdir(), "deploy-checkpoint-"));
}

function writeJson(dir: string, name: string, value: unknown) {
  const filePath = path.join(dir, name);
  writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
  return filePath;
}

const baseEnv = Object.freeze({
  GITHUB_WORKFLOW: "Deploy",
  GITHUB_RUN_ID: "run-123",
  GITHUB_SHA: "abc123",
  GITHUB_RUN_ATTEMPT: "1",
  RUNNER_OS: "Windows",
  DEPLOY_CHECKPOINT_VALIDATED_AT: "2026-05-28T00:00:00.000Z",
});

const baseOptions = Object.freeze({
  env: baseEnv,
  commitSha: "abc123",
  certificateStatus: "VALID",
  certificateId: "sha256:certificate",
  packageLockHash: "sha256:lockfile",
  nodeVersion: "v24.0.0",
});

function environmentHash(overrides = {}) {
  return checkpoint.buildEnvironmentHash({
    workflowId: "Deploy",
    workflowRunId: "run-123",
    commitSha: "abc123",
    runnerOs: "Windows",
    nodeVersion: "v24.0.0",
    packageLockHash: "sha256:lockfile",
    certificateStatus: "VALID",
    certificateId: "sha256:certificate",
    ...overrides,
  });
}

function validCheckpoint(overrides = {}) {
  const preimage = {
    checkpointHash: undefined,
    lastCompletedPartition: "unit-11",
    commitSha: "abc123",
    certificateId: "sha256:certificate",
    environmentHash: environmentHash(),
    createdAt: "2026-05-28T00:00:00.000Z",
    ...overrides,
  };
  return {
    ...preimage,
    checkpointHash: checkpoint.hashCheckpoint(preimage),
  };
}

describe("deployment checkpoint validation", () => {
  it("returns SAFE and ELIGIBLE for a valid checkpoint", () => {
    const result = checkpoint.verifyCheckpointObject(validCheckpoint(), baseOptions);

    expect(result).toMatchObject({
      workflowId: "Deploy",
      deploymentId: "run-123",
      commitSha: "abc123",
      checkpointStatus: "SAFE",
      resumeEligibility: "ELIGIBLE",
      certificateStatus: "VALID",
      validatedAt: "2026-05-28T00:00:00.000Z",
      failureClass: null,
      reasons: [],
      enforcementMode: "READ_ONLY",
      state: "PROGRESSING",
    });
    expect(result.checkpointHash).toMatch(/^sha256:/);
    expect(result.environmentHash).toMatch(/^sha256:/);
  });

  it("returns NO_CHECKPOINT and NOT_APPLICABLE when no checkpoint exists", () => {
    const result = checkpoint.verifyCheckpointFile(path.join(tempDir(), "missing.json"), baseOptions);

    expect(result.checkpointStatus).toBe("NO_CHECKPOINT");
    expect(result.resumeEligibility).toBe("NOT_APPLICABLE");
    expect(result.failureClass).toBeNull();
    expect(result.state).toBe("PROGRESSING");
    expect(result.reasons).toContain("CHECKPOINT_NOT_FOUND");
  });

  it("returns UNSAFE and INELIGIBLE for malformed checkpoint JSON", () => {
    const dir = tempDir();
    const checkpointPath = path.join(dir, "checkpoint.json");
    writeFileSync(checkpointPath, "{ malformed");

    const result = checkpoint.verifyCheckpointFile(checkpointPath, baseOptions);

    expect(result.checkpointStatus).toBe("UNSAFE");
    expect(result.resumeEligibility).toBe("INELIGIBLE");
    expect(result.failureClass).toBe("UNKNOWN_FAILURE");
    expect(result.state).toBe("DISPUTED");
    expect(result.reasons).toContain("CHECKPOINT_MALFORMED");
    rmSync(dir, { recursive: true, force: true });
  });

  it("returns UNSAFE and INELIGIBLE for commit mismatch", () => {
    const result = checkpoint.verifyCheckpointObject(validCheckpoint({ commitSha: "different" }), baseOptions);

    expect(result.checkpointStatus).toBe("UNSAFE");
    expect(result.resumeEligibility).toBe("INELIGIBLE");
    expect(result.failureClass).toBe("GOVERNANCE_FAILURE");
    expect(result.reasons).toContain("CHECKPOINT_COMMIT_MISMATCH");
  });

  it("returns DRIFTED and INELIGIBLE for environment drift", () => {
    const result = checkpoint.verifyCheckpointObject(
      validCheckpoint({ environmentHash: environmentHash({ nodeVersion: "v23.0.0" }) }),
      baseOptions,
    );

    expect(result.checkpointStatus).toBe("DRIFTED");
    expect(result.resumeEligibility).toBe("INELIGIBLE");
    expect(result.failureClass).toBe("ENV_FAILURE");
    expect(result.reasons).toContain("CHECKPOINT_ENVIRONMENT_DRIFT");
  });

  it("returns UNSAFE and INELIGIBLE for certificate mismatch", () => {
    const result = checkpoint.verifyCheckpointObject(validCheckpoint({ certificateId: "sha256:other" }), baseOptions);

    expect(result.checkpointStatus).toBe("UNSAFE");
    expect(result.resumeEligibility).toBe("INELIGIBLE");
    expect(result.failureClass).toBe("GOVERNANCE_FAILURE");
    expect(result.reasons).toContain("CHECKPOINT_CERTIFICATE_MISMATCH");
  });

  it("resolves unknown status and eligibility to DISPUTED", () => {
    expect(checkpoint.normalizeCheckpointStatus("mystery")).toBe("DISPUTED");
    expect(checkpoint.normalizeResumeEligibility("mystery")).toBe("DISPUTED");
  });

  it("read-only mode never exits nonzero for invalid checkpoint", () => {
    const dir = tempDir();
    const checkpointPath = writeJson(dir, "checkpoint.json", validCheckpoint({ commitSha: "different" }));
    const result = spawnSync(process.execPath, [
      path.join(process.cwd(), "scripts", "deploy-checkpoint-validate.cjs"),
      "verify",
      "--checkpoint",
      checkpointPath,
      "--output-dir",
      dir,
      "--commit",
      "abc123",
      "--certificateStatus",
      "VALID",
      "--certificateId",
      "sha256:certificate",
      "--packageLockHash",
      "sha256:lockfile",
      "--nodeVersion",
      "v24.0.0",
    ], {
      cwd: process.cwd(),
      env: { ...process.env, ...baseEnv },
      encoding: "utf8",
    });

    expect(result.status).toBe(0);
    expect(JSON.parse(result.stdout).checkpointStatus).toBe("UNSAFE");
    rmSync(dir, { recursive: true, force: true });
  });

  it("writes deterministic checkpoint validation artifacts", () => {
    const dir = tempDir();
    const checkpointPath = writeJson(dir, "checkpoint.json", validCheckpoint());

    const first = checkpoint.safeValidateCheckpoint({
      checkpointPath,
      outputDir: dir,
      ...baseOptions,
    });
    const second = checkpoint.safeValidateCheckpoint({
      checkpointPath,
      outputDir: dir,
      ...baseOptions,
    });
    const artifact = JSON.parse(readFileSync(path.join(dir, "checkpoint-validation.json"), "utf8"));

    expect(first.validationHash).toBe(second.validationHash);
    expect(artifact.validationHash).toBe(first.validationHash);
    expect(first.validationHash).toMatch(/^sha256:/);
    rmSync(dir, { recursive: true, force: true });
  });

  it("writes deterministic resume analysis artifacts", () => {
    const dir = tempDir();
    const checkpointPath = writeJson(dir, "checkpoint.json", validCheckpoint());

    const first = checkpoint.safeValidateCheckpoint({
      checkpointPath,
      outputDir: dir,
      ...baseOptions,
    });
    const second = checkpoint.safeValidateCheckpoint({
      checkpointPath,
      outputDir: dir,
      ...baseOptions,
    });
    const resumeAnalysis = JSON.parse(readFileSync(path.join(dir, "resume-analysis.json"), "utf8"));

    expect(first.resumeAnalysis.resumeAnalysisHash).toBe(second.resumeAnalysis.resumeAnalysisHash);
    expect(resumeAnalysis.resumeAnalysisHash).toBe(first.resumeAnalysis.resumeAnalysisHash);
    expect(resumeAnalysis.resumeEligibility).toBe("ELIGIBLE");
    rmSync(dir, { recursive: true, force: true });
  });
});
