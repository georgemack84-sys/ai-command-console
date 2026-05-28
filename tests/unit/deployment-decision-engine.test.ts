import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";

const require = createRequire(import.meta.url);
const decision = require("../../scripts/deploy-decision-engine.cjs");

function tempDir() {
  return mkdtempSync(path.join(tmpdir(), "deploy-decision-"));
}

function writeJson(dir: string, name: string, value: unknown) {
  const filePath = path.join(dir, name);
  writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
  return filePath;
}

function writeJsonl(dir: string, name: string, values: unknown[]) {
  const filePath = path.join(dir, name);
  writeFileSync(filePath, values.map((value) => JSON.stringify(value)).join("\n"));
  return filePath;
}

const evaluatedAt = "2026-05-28T00:10:00.000Z";

function baseEvidence(overrides: Record<string, unknown> = {}) {
  return {
    telemetry: {
      event: "resume_analysis_complete",
      workflowId: "Deploy",
      deploymentId: "run-123",
      runId: "run-123",
      commitSha: "abc123",
      currentStep: "Resume analysis",
      state: "PROGRESSING",
      heartbeatAt: "2026-05-28T00:09:00.000Z",
      certificateStatus: "VALID",
      checkpointStatus: "SAFE",
      resumeEligibility: "ELIGIBLE",
      failureClass: undefined,
      environmentHash: "sha256:environment",
      checkpointHash: "sha256:checkpoint",
    },
    certificate: {
      workflowId: "Deploy",
      deploymentId: "run-123",
      commitSha: "abc123",
      certificateStatus: "VALID",
      failureClass: null,
      state: "PROGRESSING",
    },
    checkpoint: {
      workflowId: "Deploy",
      deploymentId: "run-123",
      commitSha: "abc123",
      checkpointStatus: "SAFE",
      resumeEligibility: "ELIGIBLE",
      certificateStatus: "VALID",
      failureClass: null,
      state: "PROGRESSING",
      heartbeatAt: "2026-05-28T00:09:00.000Z",
      environmentHash: "sha256:environment",
      checkpointHash: "sha256:checkpoint",
    },
    resume: {
      workflowId: "Deploy",
      deploymentId: "run-123",
      commitSha: "abc123",
      checkpointStatus: "SAFE",
      resumeEligibility: "ELIGIBLE",
      certificateStatus: "VALID",
      environmentHash: "sha256:environment",
      checkpointHash: "sha256:checkpoint",
    },
    ...overrides,
  };
}

function writeEvidence(dir: string, evidence = baseEvidence()) {
  writeJsonl(dir, "deployment-telemetry.jsonl", [evidence.telemetry]);
  writeJson(dir, "deployment-summary.json", {
    latestState: (evidence.telemetry as Record<string, unknown>).state,
    latestCheckpointStatus: (evidence.telemetry as Record<string, unknown>).checkpointStatus,
    latestResumeEligibility: (evidence.telemetry as Record<string, unknown>).resumeEligibility,
  });
  writeJson(dir, "deployment-evidence.json", {
    workflowId: (evidence.telemetry as Record<string, unknown>).workflowId,
    deploymentId: (evidence.telemetry as Record<string, unknown>).deploymentId,
    commitSha: (evidence.telemetry as Record<string, unknown>).commitSha,
    latestState: (evidence.telemetry as Record<string, unknown>).state,
    telemetryEvents: [evidence.telemetry],
  });
  writeJson(dir, "certificate-verification.json", evidence.certificate);
  writeJson(dir, "checkpoint-validation.json", evidence.checkpoint);
  writeJson(dir, "resume-analysis.json", evidence.resume);
}

function evaluateEvidence(evidence = baseEvidence()) {
  const dir = tempDir();
  writeEvidence(dir, evidence);
  const result = decision.safeEvaluateDeploymentDecision({
    evidenceDir: dir,
    evaluatedAt,
  });
  rmSync(dir, { recursive: true, force: true });
  return result;
}

describe("deployment decision engine", () => {
  it("returns ALLOW and LOW for valid evidence", () => {
    const result = evaluateEvidence();

    expect(result).toMatchObject({
      workflowId: "Deploy",
      deploymentId: "run-123",
      commitSha: "abc123",
      decision: "ALLOW",
      risk: "LOW",
      certificateStatus: "VALID",
      checkpointStatus: "SAFE",
      resumeEligibility: "ELIGIBLE",
      failureClass: null,
      policyVersion: "dh-deployment-decision/v1",
      evaluatedAt,
      enforcementMode: "READ_ONLY",
    });
  });

  it("returns OBSERVE and MEDIUM for unverified inputs", () => {
    const result = evaluateEvidence(baseEvidence({
      certificate: { ...baseEvidence().certificate, certificateStatus: "UNVERIFIED" },
      telemetry: { ...baseEvidence().telemetry, certificateStatus: "UNVERIFIED" },
    }));

    expect(result.decision).toBe("OBSERVE");
    expect(result.risk).toBe("MEDIUM");
  });

  it("returns PAUSE_RECOMMENDED and HIGH for stale heartbeat", () => {
    const result = evaluateEvidence(baseEvidence({
      telemetry: { ...baseEvidence().telemetry, heartbeatAt: "2026-05-27T23:50:00.000Z" },
    }));

    expect(result.decision).toBe("PAUSE_RECOMMENDED");
    expect(result.risk).toBe("HIGH");
    expect(result.reasons).toContain("HEARTBEAT_STALE");
  });

  it("returns ESCALATE and HIGH for disputed certificate", () => {
    const result = evaluateEvidence(baseEvidence({
      certificate: { ...baseEvidence().certificate, certificateStatus: "DISPUTED" },
      telemetry: { ...baseEvidence().telemetry, certificateStatus: "DISPUTED" },
      checkpoint: { ...baseEvidence().checkpoint, certificateStatus: "DISPUTED" },
      resume: { ...baseEvidence().resume, certificateStatus: "DISPUTED" },
    }));

    expect(result.decision).toBe("ESCALATE");
    expect(result.risk).toBe("HIGH");
  });

  it("returns ESCALATE and HIGH for disputed checkpoint", () => {
    const result = evaluateEvidence(baseEvidence({
      checkpoint: { ...baseEvidence().checkpoint, checkpointStatus: "DISPUTED", resumeEligibility: "DISPUTED" },
      telemetry: { ...baseEvidence().telemetry, checkpointStatus: "DISPUTED", resumeEligibility: "DISPUTED" },
      resume: { ...baseEvidence().resume, checkpointStatus: "DISPUTED", resumeEligibility: "DISPUTED" },
    }));

    expect(result.decision).toBe("ESCALATE");
    expect(result.risk).toBe("HIGH");
  });

  it("returns BLOCK_RECOMMENDED and CRITICAL for invalid certificate", () => {
    const result = evaluateEvidence(baseEvidence({
      certificate: { ...baseEvidence().certificate, certificateStatus: "INVALID", failureClass: "GOVERNANCE_FAILURE" },
      telemetry: { ...baseEvidence().telemetry, certificateStatus: "INVALID", failureClass: "GOVERNANCE_FAILURE" },
    }));

    expect(result.decision).toBe("BLOCK_RECOMMENDED");
    expect(result.risk).toBe("CRITICAL");
  });

  it("returns BLOCK_RECOMMENDED and CRITICAL for missing certificate", () => {
    const result = evaluateEvidence(baseEvidence({
      certificate: { ...baseEvidence().certificate, certificateStatus: "MISSING", failureClass: "GOVERNANCE_FAILURE" },
      telemetry: { ...baseEvidence().telemetry, certificateStatus: "MISSING", failureClass: "GOVERNANCE_FAILURE" },
    }));

    expect(result.decision).toBe("BLOCK_RECOMMENDED");
    expect(result.risk).toBe("CRITICAL");
  });

  it("returns BLOCK_RECOMMENDED and CRITICAL for unsafe checkpoint", () => {
    const result = evaluateEvidence(baseEvidence({
      checkpoint: { ...baseEvidence().checkpoint, checkpointStatus: "UNSAFE", resumeEligibility: "INELIGIBLE" },
      telemetry: { ...baseEvidence().telemetry, checkpointStatus: "UNSAFE", resumeEligibility: "INELIGIBLE" },
      resume: { ...baseEvidence().resume, checkpointStatus: "UNSAFE", resumeEligibility: "INELIGIBLE" },
    }));

    expect(result.decision).toBe("BLOCK_RECOMMENDED");
    expect(result.risk).toBe("CRITICAL");
  });

  it("returns BLOCK_RECOMMENDED and CRITICAL for environment drift", () => {
    const result = evaluateEvidence(baseEvidence({
      checkpoint: { ...baseEvidence().checkpoint, checkpointStatus: "DRIFTED", resumeEligibility: "INELIGIBLE", failureClass: "ENV_FAILURE" },
      telemetry: { ...baseEvidence().telemetry, checkpointStatus: "DRIFTED", resumeEligibility: "INELIGIBLE", failureClass: "ENV_FAILURE" },
      resume: { ...baseEvidence().resume, checkpointStatus: "DRIFTED", resumeEligibility: "INELIGIBLE" },
    }));

    expect(result.decision).toBe("BLOCK_RECOMMENDED");
    expect(result.risk).toBe("CRITICAL");
  });

  it("returns DISPUTED and UNKNOWN for missing evidence", () => {
    const result = decision.safeEvaluateDeploymentDecision({
      evidenceDir: tempDir(),
      evaluatedAt,
    });

    expect(result.decision).toBe("DISPUTED");
    expect(result.risk).toBe("UNKNOWN");
    expect(result.reasons).toContain("EVIDENCE_MISSING:deployment-telemetry.jsonl");
  });

  it("returns DISPUTED and UNKNOWN for conflicting evidence", () => {
    const result = evaluateEvidence(baseEvidence({
      certificate: { ...baseEvidence().certificate, commitSha: "different" },
    }));

    expect(result.decision).toBe("DISPUTED");
    expect(result.risk).toBe("UNKNOWN");
    expect(result.reasons).toContain("EVIDENCE_CONFLICT:commitSha");
  });

  it("returns DISPUTED and UNKNOWN for unparseable artifact", () => {
    const dir = tempDir();
    writeEvidence(dir);
    writeFileSync(path.join(dir, "certificate-verification.json"), "{ malformed");

    const result = decision.safeEvaluateDeploymentDecision({
      evidenceDir: dir,
      evaluatedAt,
    });

    expect(result.decision).toBe("DISPUTED");
    expect(result.risk).toBe("UNKNOWN");
    expect(result.reasons).toContain("EVIDENCE_UNPARSEABLE:certificate-verification.json");
    rmSync(dir, { recursive: true, force: true });
  });

  it("returns DISPUTED and UNKNOWN for unknown normalized state", () => {
    const result = evaluateEvidence(baseEvidence({
      telemetry: { ...baseEvidence().telemetry, state: "MYSTERY" },
    }));

    expect(result.decision).toBe("DISPUTED");
    expect(result.risk).toBe("UNKNOWN");
    expect(result.reasons).toContain("UNKNOWN_STATE");
  });

  it("uses the strictest outcome when multiple rules match", () => {
    const result = evaluateEvidence(baseEvidence({
      certificate: { ...baseEvidence().certificate, certificateStatus: "INVALID", failureClass: "GOVERNANCE_FAILURE" },
      telemetry: { ...baseEvidence().telemetry, certificateStatus: "INVALID", failureClass: "GOVERNANCE_FAILURE", heartbeatAt: "2026-05-27T23:50:00.000Z" },
    }));

    expect(result.decision).toBe("BLOCK_RECOMMENDED");
    expect(result.risk).toBe("CRITICAL");
  });

  it("read-only mode always exits zero", () => {
    const dir = tempDir();
    writeEvidence(dir, baseEvidence({
      certificate: { ...baseEvidence().certificate, certificateStatus: "INVALID", failureClass: "GOVERNANCE_FAILURE" },
      telemetry: { ...baseEvidence().telemetry, certificateStatus: "INVALID", failureClass: "GOVERNANCE_FAILURE" },
    }));
    const result = spawnSync(process.execPath, [
      path.join(process.cwd(), "scripts", "deploy-decision-engine.cjs"),
      "evaluate",
      "--evidence-dir",
      dir,
      "--output-dir",
      dir,
      "--evaluatedAt",
      evaluatedAt,
    ], {
      cwd: process.cwd(),
      encoding: "utf8",
    });

    expect(result.status).toBe(0);
    expect(JSON.parse(result.stdout).decision).toBe("BLOCK_RECOMMENDED");
    rmSync(dir, { recursive: true, force: true });
  });

  it("writes deterministic deployment decision artifacts", () => {
    const dir = tempDir();
    writeEvidence(dir);

    const first = decision.safeEvaluateDeploymentDecision({ evidenceDir: dir, outputDir: dir, evaluatedAt });
    const second = decision.safeEvaluateDeploymentDecision({ evidenceDir: dir, outputDir: dir, evaluatedAt });
    const artifact = JSON.parse(readFileSync(path.join(dir, "deployment-decision.json"), "utf8"));

    expect(first.decisionHash).toBe(second.decisionHash);
    expect(artifact.decisionHash).toBe(first.decisionHash);
    rmSync(dir, { recursive: true, force: true });
  });

  it("writes deterministic deployment decision summary artifacts", () => {
    const dir = tempDir();
    writeEvidence(dir);

    const first = decision.safeEvaluateDeploymentDecision({ evidenceDir: dir, outputDir: dir, evaluatedAt });
    const second = decision.safeEvaluateDeploymentDecision({ evidenceDir: dir, outputDir: dir, evaluatedAt });
    const summary = JSON.parse(readFileSync(path.join(dir, "deployment-decision-summary.json"), "utf8"));

    expect(first.summary.decisionSummaryHash).toBe(second.summary.decisionSummaryHash);
    expect(summary.decisionSummaryHash).toBe(first.summary.decisionSummaryHash);
    rmSync(dir, { recursive: true, force: true });
  });
});
