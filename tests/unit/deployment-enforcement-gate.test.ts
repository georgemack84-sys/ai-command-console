import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";

const require = createRequire(import.meta.url);
const enforcement = require("../../scripts/deploy-enforcement-gate.cjs");

const evaluatedAt = "2026-05-28T00:00:00.000Z";

function tempDir() {
  return mkdtempSync(path.join(tmpdir(), "deploy-enforcement-"));
}

function writeDecision(dir: string, overrides: Record<string, unknown> = {}) {
  const decision = {
    workflowId: "Deploy",
    deploymentId: "run-123",
    commitSha: "abc123",
    decision: "ALLOW",
    risk: "LOW",
    certificateStatus: "VALID",
    checkpointStatus: "SAFE",
    resumeEligibility: "ELIGIBLE",
    failureClass: null,
    reasons: ["POLICY_ALLOW"],
    policyVersion: "dh-deployment-decision/v1",
    evaluatedAt,
    enforcementMode: "READ_ONLY",
    ...overrides,
  };
  writeFileSync(path.join(dir, "deployment-decision.json"), `${JSON.stringify(decision, null, 2)}\n`);
  return decision;
}

function evaluate(overrides: Record<string, unknown> = {}, mode = "warn_only") {
  const dir = tempDir();
  writeDecision(dir, overrides);
  const result = enforcement.safeEvaluateScopedEnforcement({
    evidenceDir: dir,
    outputDir: dir,
    evaluatedAt,
    mode,
    env: {
      GITHUB_WORKFLOW: "Deploy",
      GITHUB_RUN_ID: "run-123",
      GITHUB_SHA: "abc123",
    },
  });
  const artifact = JSON.parse(readFileSync(path.join(dir, "deployment-enforcement.json"), "utf8"));
  const summary = JSON.parse(readFileSync(path.join(dir, "deployment-enforcement-summary.json"), "utf8"));
  rmSync(dir, { recursive: true, force: true });
  return { result, artifact, summary };
}

const criticalBlock = {
  decision: "BLOCK_RECOMMENDED",
  risk: "CRITICAL",
  certificateStatus: "INVALID",
};

describe("scoped deployment enforcement gate", () => {
  it("warn_only never blocks", () => {
    const { result } = evaluate(criticalBlock, "warn_only");

    expect(result.enforcementMode).toBe("WARN_ONLY");
    expect(result.enforcementDecision).toBe("WARN_CONTINUE");
    expect(result.blocked).toBe(false);
  });

  it("read_only never blocks", () => {
    const { result } = evaluate(criticalBlock, "read_only");

    expect(result.enforcementMode).toBe("READ_ONLY");
    expect(result.enforcementDecision).toBe("WARN_CONTINUE");
    expect(result.blocked).toBe(false);
  });

  it("enforce_scoped blocks invalid certificate with block recommendation and critical risk", () => {
    const { result } = evaluate(criticalBlock, "enforce_scoped");

    expect(result.enforcementDecision).toBe("ENFORCE_BLOCK");
    expect(result.blocked).toBe(true);
    expect(result.deterministicCauses).toContain("CERTIFICATE_INVALID");
  });

  it("enforce_scoped blocks missing certificate with block recommendation and critical risk", () => {
    const { result } = evaluate({
      decision: "BLOCK_RECOMMENDED",
      risk: "CRITICAL",
      certificateStatus: "MISSING",
    }, "enforce_scoped");

    expect(result.enforcementDecision).toBe("ENFORCE_BLOCK");
    expect(result.deterministicCauses).toContain("CERTIFICATE_MISSING");
  });

  it("enforce_scoped blocks unsafe checkpoint with block recommendation and critical risk", () => {
    const { result } = evaluate({
      decision: "BLOCK_RECOMMENDED",
      risk: "CRITICAL",
      checkpointStatus: "UNSAFE",
    }, "enforce_scoped");

    expect(result.enforcementDecision).toBe("ENFORCE_BLOCK");
    expect(result.deterministicCauses).toContain("CHECKPOINT_UNSAFE");
  });

  it("enforce_scoped blocks drifted checkpoint with block recommendation and critical risk", () => {
    const { result } = evaluate({
      decision: "BLOCK_RECOMMENDED",
      risk: "CRITICAL",
      checkpointStatus: "DRIFTED",
    }, "enforce_scoped");

    expect(result.enforcementDecision).toBe("ENFORCE_BLOCK");
    expect(result.deterministicCauses).toContain("CHECKPOINT_DRIFTED");
  });

  it("enforce_scoped blocks ineligible resume with block recommendation and critical risk", () => {
    const { result } = evaluate({
      decision: "BLOCK_RECOMMENDED",
      risk: "CRITICAL",
      resumeEligibility: "INELIGIBLE",
    }, "enforce_scoped");

    expect(result.enforcementDecision).toBe("ENFORCE_BLOCK");
    expect(result.deterministicCauses).toContain("RESUME_INELIGIBLE");
  });

  it("does not block disputed, escalate, pause recommended, unknown risk, or high risk", () => {
    for (const override of [
      { decision: "DISPUTED", risk: "UNKNOWN", certificateStatus: "INVALID" },
      { decision: "ESCALATE", risk: "HIGH", certificateStatus: "INVALID" },
      { decision: "PAUSE_RECOMMENDED", risk: "HIGH", certificateStatus: "INVALID" },
      { decision: "BLOCK_RECOMMENDED", risk: "UNKNOWN", certificateStatus: "INVALID" },
      { decision: "BLOCK_RECOMMENDED", risk: "HIGH", certificateStatus: "INVALID" },
    ]) {
      const { result } = evaluate(override, "enforce_scoped");
      expect(result.blocked).toBe(false);
      expect(result.enforcementDecision).not.toBe("ENFORCE_BLOCK");
    }
  });

  it("returns disputed no block for missing and malformed decision artifact", () => {
    const missingDir = tempDir();
    const missing = enforcement.safeEvaluateScopedEnforcement({
      evidenceDir: missingDir,
      outputDir: missingDir,
      evaluatedAt,
      mode: "enforce_scoped",
    });
    expect(missing.enforcementDecision).toBe("DISPUTED_NO_BLOCK");
    expect(missing.blocked).toBe(false);
    rmSync(missingDir, { recursive: true, force: true });

    const malformedDir = tempDir();
    writeFileSync(path.join(malformedDir, "deployment-decision.json"), "{not-json");
    const malformed = enforcement.safeEvaluateScopedEnforcement({
      evidenceDir: malformedDir,
      outputDir: malformedDir,
      evaluatedAt,
      mode: "enforce_scoped",
    });
    expect(malformed.enforcementDecision).toBe("DISPUTED_NO_BLOCK");
    expect(malformed.blocked).toBe(false);
    rmSync(malformedDir, { recursive: true, force: true });
  });

  it("unknown enforcement mode defaults to warn only with a reason", () => {
    const { result } = evaluate(criticalBlock, "mystery_mode");

    expect(result.enforcementMode).toBe("WARN_ONLY");
    expect(result.blocked).toBe(false);
    expect(result.reasons).toContain("ENFORCEMENT_MODE_UNKNOWN:mystery_mode");
  });

  it("requires a strict deterministic cause", () => {
    const { result } = evaluate({
      decision: "BLOCK_RECOMMENDED",
      risk: "CRITICAL",
      certificateStatus: "VALID",
      checkpointStatus: "SAFE",
      resumeEligibility: "ELIGIBLE",
      failureClass: null,
    }, "enforce_scoped");

    expect(result.enforcementDecision).toBe("WARN_CONTINUE");
    expect(result.blocked).toBe(false);
    expect(result.reasons).toContain("STRICT_DETERMINISTIC_CAUSE_REQUIRED");
  });

  it("writes deterministic enforcement artifacts", () => {
    const first = evaluate(criticalBlock, "enforce_scoped");
    const second = evaluate(criticalBlock, "enforce_scoped");

    expect(first.artifact.enforcementHash).toBe(second.artifact.enforcementHash);
    expect(first.summary.enforcementSummaryHash).toBe(second.summary.enforcementSummaryHash);
  });

  it("CLI exits nonzero only for enforce scoped block", () => {
    const dir = tempDir();
    writeDecision(dir, criticalBlock);
    const blocked = spawnSync(process.execPath, [
      path.join(process.cwd(), "scripts", "deploy-enforcement-gate.cjs"),
      "evaluate",
      "--evidence-dir",
      dir,
      "--output-dir",
      dir,
      "--mode",
      "enforce_scoped",
      "--evaluatedAt",
      evaluatedAt,
    ], { encoding: "utf8" });
    expect(blocked.status).toBe(1);

    const warned = spawnSync(process.execPath, [
      path.join(process.cwd(), "scripts", "deploy-enforcement-gate.cjs"),
      "evaluate",
      "--evidence-dir",
      dir,
      "--output-dir",
      dir,
      "--mode",
      "warn_only",
      "--evaluatedAt",
      evaluatedAt,
    ], { encoding: "utf8" });
    expect(warned.status).toBe(0);
    rmSync(dir, { recursive: true, force: true });
  });
});
