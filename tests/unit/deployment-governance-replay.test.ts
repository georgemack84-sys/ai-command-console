import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";

const require = createRequire(import.meta.url);
const replay = require("../../scripts/deploy-governance-replay.cjs");
const audit = require("../../scripts/deploy-audit-certification.cjs");
const decisionEngine = require("../../scripts/deploy-decision-engine.cjs");
const enforcementGate = require("../../scripts/deploy-enforcement-gate.cjs");
const overrideGovernance = require("../../scripts/deploy-override-governance.cjs");
const telemetry = require("../../scripts/deploy-telemetry.cjs");

const base = {
  workflowId: "Deploy",
  deploymentId: "run-123",
  commitSha: "abc123",
};
const fixedEnv = {
  GITHUB_WORKFLOW: "Deploy",
  GITHUB_RUN_ID: "run-123",
  GITHUB_SHA: "abc123",
  DEPLOY_TELEMETRY_NOW: "2026-05-28T11:58:00.000Z",
};

function tempDir() {
  return mkdtempSync(path.join(tmpdir(), "deploy-replay-"));
}

function writeJson(filePath: string, value: unknown) {
  writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function decisionArtifact(overrides: Record<string, unknown> = {}) {
  const decision = {
    ...base,
    decision: "ALLOW",
    risk: "LOW",
    certificateStatus: "VALID",
    checkpointStatus: "SAFE",
    resumeEligibility: "ELIGIBLE",
    failureClass: null,
    reasons: ["POLICY_ALLOW"],
    policyVersion: "dh-deployment-decision/v1",
    evaluatedAt: "2026-05-28T11:55:00.000Z",
    enforcementMode: "READ_ONLY",
    ...overrides,
  };
  return { ...decision, decisionHash: decisionEngine.hashDeploymentDecision(decision) };
}

function enforcementArtifact(overrides: Record<string, unknown> = {}) {
  const enforcement = {
    ...base,
    enforcementMode: "WARN_ONLY",
    enforcementDecision: "ALLOW_CONTINUE",
    sourceDecision: "ALLOW",
    sourceRisk: "LOW",
    deterministicCauses: [],
    blocked: false,
    reasons: ["SCOPED_ENFORCEMENT_ALLOW_CONTINUE"],
    evaluatedAt: "2026-05-28T11:56:00.000Z",
    policyVersion: "dh-scoped-enforcement/v1",
    ...overrides,
  };
  return { ...enforcement, enforcementHash: enforcementGate.hashEnforcementResult(enforcement) };
}

function overrideArtifact(enforcement = enforcementArtifact(), overrides: Record<string, unknown> = {}) {
  const override = {
    ...base,
    overrideMode: "OVERRIDE_ALLOWED_WITH_ARTIFACT",
    overrideDecision: "OVERRIDE_VALID",
    sourceEnforcementDecision: enforcement.enforcementDecision,
    sourceBlocked: true,
    operatorId: "operator@example.com",
    approvalReason: "Bounded release exception.",
    approvalArtifactHash: "sha256:approval",
    expiresAt: "2026-05-28T12:30:00.000Z",
    validatedAt: "2026-05-28T11:57:00.000Z",
    reasons: ["OVERRIDE_VALIDATED"],
    policyVersion: "dh-override-governance/v1",
    ...overrides,
  };
  return { ...override, overrideGovernanceHash: overrideGovernance.hashOverrideGovernanceResult(override) };
}

function writeValidEvidence(dir: string, options: { noCheckpoint?: boolean; noOverride?: boolean; omit?: string[] } = {}) {
  const omit = new Set(options.omit || []);
  telemetry.safeEmitTelemetry({
    event: "operator_override_complete",
    step: "Operator override governance",
    state: "PROGRESSING",
    workflowId: base.workflowId,
    deploymentId: base.deploymentId,
    commitSha: base.commitSha,
    certificateStatus: "VALID",
    checkpointStatus: options.noCheckpoint ? "NO_CHECKPOINT" : "SAFE",
    resumeEligibility: options.noCheckpoint ? "NOT_APPLICABLE" : "ELIGIBLE",
    deploymentDecision: "ALLOW",
    deploymentRisk: "LOW",
  }, { dir, env: fixedEnv });

  const decision = decisionArtifact();
  const enforcement = enforcementArtifact();
  const override = overrideArtifact(enforcement, options.noOverride ? { overrideDecision: "NO_OVERRIDE" } : {});
  const checkpointStatus = options.noCheckpoint ? "NO_CHECKPOINT" : "SAFE";
  const artifacts: Record<string, unknown> = {
    "certificate-verification.json": { ...base, certificateStatus: "VALID", certificateHash: "sha256:certificate", failureClass: null },
    "checkpoint-validation.json": { ...base, checkpointStatus, resumeEligibility: options.noCheckpoint ? "NOT_APPLICABLE" : "ELIGIBLE", checkpointHash: "sha256:checkpoint", environmentHash: "sha256:environment" },
    "resume-analysis.json": { ...base, checkpointStatus, resumeEligibility: options.noCheckpoint ? "NOT_APPLICABLE" : "ELIGIBLE", checkpointHash: "sha256:checkpoint", environmentHash: "sha256:environment" },
    "deployment-decision.json": decision,
    "deployment-decision-summary.json": { ...base, decision: "ALLOW", risk: "LOW", policyVersion: "dh-deployment-decision/v1" },
    "deployment-enforcement.json": enforcement,
    "deployment-enforcement-summary.json": { ...base, enforcementMode: "WARN_ONLY", enforcementDecision: "ALLOW_CONTINUE", blocked: false, policyVersion: "dh-scoped-enforcement/v1" },
    "deployment-override-governance.json": override,
    "deployment-override-request.json": { ...base, sourceEnforcementHash: enforcement.enforcementHash, requestHash: "sha256:request" },
    "deployment-override-summary.json": { ...base, overrideMode: override.overrideMode, overrideDecision: override.overrideDecision, policyVersion: "dh-override-governance/v1" },
  };
  for (const [name, value] of Object.entries(artifacts)) {
    if (!omit.has(name)) writeJson(path.join(dir, name), value);
  }
  audit.safeEvaluateAuditCertification({ evidenceDir: dir, outputDir: dir, certifiedAt: "2026-05-28T12:00:00.000Z", env: fixedEnv });
}

function runReplay(dir: string) {
  return replay.safeEvaluateGovernanceReplay({
    evidenceDir: dir,
    outputDir: dir,
    replayedAt: "2026-05-28T12:01:00.000Z",
    env: fixedEnv,
  });
}

describe("deployment governance replay", () => {
  it("returns CONSISTENT for a full artifact chain", () => {
    const dir = tempDir();
    writeValidEvidence(dir);
    const result = runReplay(dir);

    expect(result.replayStatus).toBe("CONSISTENT");
    expect(result.driftDetected).toBe(false);
    expect(result.replayHash).toMatch(/^sha256:/);
    rmSync(dir, { recursive: true, force: true });
  });

  it("returns PARTIAL when optional or non-critical scopes are unavailable", () => {
    const dir = tempDir();
    writeValidEvidence(dir, { noCheckpoint: true, noOverride: true, omit: ["deployment-override-summary.json"] });

    expect(runReplay(dir).replayStatus).toBe("PARTIAL");
    rmSync(dir, { recursive: true, force: true });
  });

  it("detects decision, enforcement, override, certification, lineage, and telemetry drift", () => {
    for (const mutate of [
      (dir: string) => {
        const value = JSON.parse(readFileSync(path.join(dir, "deployment-decision.json"), "utf8"));
        value.decision = "BLOCK_RECOMMENDED";
        writeJson(path.join(dir, "deployment-decision.json"), value);
      },
      (dir: string) => {
        const value = JSON.parse(readFileSync(path.join(dir, "deployment-enforcement.json"), "utf8"));
        value.enforcementDecision = "ENFORCE_BLOCK";
        writeJson(path.join(dir, "deployment-enforcement.json"), value);
      },
      (dir: string) => {
        const value = JSON.parse(readFileSync(path.join(dir, "deployment-override-governance.json"), "utf8"));
        value.overrideGovernanceHash = "sha256:tampered";
        writeJson(path.join(dir, "deployment-override-governance.json"), value);
      },
      (dir: string) => {
        const value = JSON.parse(readFileSync(path.join(dir, "deployment-audit-certification.json"), "utf8"));
        value.certificationStatus = "FAILED";
        writeJson(path.join(dir, "deployment-audit-certification.json"), value);
      },
      (dir: string) => {
        const value = JSON.parse(readFileSync(path.join(dir, "deployment-lineage.json"), "utf8"));
        value.lineageHash = "sha256:tampered";
        writeJson(path.join(dir, "deployment-lineage.json"), value);
      },
      (dir: string) => {
        writeFileSync(path.join(dir, "deployment-telemetry.jsonl"), `${JSON.stringify({ ...base, event: "tampered", state: "PROGRESSING" })}\n`);
      },
    ]) {
      const dir = tempDir();
      writeValidEvidence(dir);
      mutate(dir);
      expect(runReplay(dir).replayStatus).toBe("DRIFTED");
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("returns DISPUTED for conflicting evidence and unknown state", () => {
    for (const mutate of [
      (dir: string) => {
        const value = JSON.parse(readFileSync(path.join(dir, "deployment-decision.json"), "utf8"));
        value.workflowId = "Different";
        value.decisionHash = decisionEngine.hashDeploymentDecision(value);
        writeJson(path.join(dir, "deployment-decision.json"), value);
      },
      (dir: string) => {
        const line = JSON.parse(readFileSync(path.join(dir, "deployment-telemetry.jsonl"), "utf8").trim());
        line.state = "MYSTERY";
        writeFileSync(path.join(dir, "deployment-telemetry.jsonl"), `${JSON.stringify(line)}\n`);
        const evidence = JSON.parse(readFileSync(path.join(dir, "deployment-evidence.json"), "utf8"));
        evidence.latestState = "MYSTERY";
        evidence.telemetryEvents = [line];
        evidence.evidenceHash = telemetry.hashDeploymentTelemetryEvidence({ ...evidence, evidenceHash: undefined });
        writeJson(path.join(dir, "deployment-evidence.json"), evidence);
        const summary = JSON.parse(readFileSync(path.join(dir, "deployment-summary.json"), "utf8"));
        summary.latestState = "MYSTERY";
        writeJson(path.join(dir, "deployment-summary.json"), summary);
      },
    ]) {
      const dir = tempDir();
      writeValidEvidence(dir);
      mutate(dir);
      audit.safeEvaluateAuditCertification({ evidenceDir: dir, outputDir: dir, certifiedAt: "2026-05-28T12:00:00.000Z", env: fixedEnv });
      expect(runReplay(dir).replayStatus).toBe("DISPUTED");
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("returns FAILED for missing or unparseable critical evidence", () => {
    const missing = tempDir();
    writeValidEvidence(missing);
    rmSync(path.join(missing, "deployment-audit-certification.json"), { force: true });
    expect(runReplay(missing).replayStatus).toBe("FAILED");
    rmSync(missing, { recursive: true, force: true });

    const malformed = tempDir();
    writeValidEvidence(malformed);
    writeFileSync(path.join(malformed, "deployment-enforcement.json"), "{not-json");
    expect(runReplay(malformed).replayStatus).toBe("FAILED");
    rmSync(malformed, { recursive: true, force: true });
  });

  it("writes deterministic forensic replay artifacts without mutating inputs", () => {
    const dir = tempDir();
    writeValidEvidence(dir);
    const target = path.join(dir, "deployment-evidence.json");
    const before = readFileSync(target, "utf8");
    const first = runReplay(dir);
    const second = runReplay(dir);

    expect(first.replayHash).toBe(second.replayHash);
    expect(first.summary.replaySummaryHash).toBe(second.summary.replaySummaryHash);
    expect(readFileSync(target, "utf8")).toBe(before);
    expect(JSON.parse(readFileSync(path.join(dir, "deployment-governance-replay.json"), "utf8")).replayStatus).toBe("CONSISTENT");
    expect(JSON.parse(readFileSync(path.join(dir, "deployment-replay-lineage.json"), "utf8")).policyVersion).toBe("dh-governance-replay/v1");
    expect(JSON.parse(readFileSync(path.join(dir, "deployment-drift-report.json"), "utf8")).driftReasons).toEqual([]);
    rmSync(dir, { recursive: true, force: true });
  });
});
