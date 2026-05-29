import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";

const require = createRequire(import.meta.url);
const audit = require("../../scripts/deploy-audit-certification.cjs");
const decisionEngine = require("../../scripts/deploy-decision-engine.cjs");
const enforcementGate = require("../../scripts/deploy-enforcement-gate.cjs");
const overrideGovernance = require("../../scripts/deploy-override-governance.cjs");

const certifiedAt = "2026-05-28T12:00:00.000Z";
const base = {
  workflowId: "Deploy",
  deploymentId: "run-123",
  commitSha: "abc123",
};

function tempDir() {
  return mkdtempSync(path.join(tmpdir(), "deploy-audit-"));
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
  return {
    ...decision,
    decisionHash: decisionEngine.hashDeploymentDecision(decision),
  };
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
  return {
    ...enforcement,
    enforcementHash: enforcementGate.hashEnforcementResult(enforcement),
  };
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
  return {
    ...override,
    overrideGovernanceHash: overrideGovernance.hashOverrideGovernanceResult(override),
  };
}

function writeEvidence(dir: string, options: {
  omit?: string[];
  malformed?: string[];
  overrides?: Record<string, Record<string, unknown>>;
  noCheckpoint?: boolean;
  noOverride?: boolean;
} = {}) {
  const omit = new Set(options.omit || []);
  const malformed = new Set(options.malformed || []);
  const decision = decisionArtifact(options.overrides?.decision);
  const enforcement = enforcementArtifact(options.overrides?.enforcement);
  const override = overrideArtifact(enforcement, options.noOverride ? { overrideDecision: "NO_OVERRIDE" } : options.overrides?.override);
  const checkpointStatus = options.noCheckpoint ? "NO_CHECKPOINT" : "SAFE";
  const artifacts: Record<string, unknown> = {
    "deployment-summary.json": { latestState: "PROGRESSING", latestDeploymentDecision: "ALLOW", latestDeploymentRisk: "LOW" },
    "deployment-evidence.json": { ...base, latestState: "PROGRESSING", evidenceHash: "sha256:telemetry" },
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
  const telemetry = {
    event: "operator_override_complete",
    timestamp: "2026-05-28T11:58:00.000Z",
    ...base,
    state: options.overrides?.telemetry?.state || "PROGRESSING",
    certificateStatus: "VALID",
    checkpointStatus,
    resumeEligibility: options.noCheckpoint ? "NOT_APPLICABLE" : "ELIGIBLE",
    deploymentDecision: "ALLOW",
    deploymentRisk: "LOW",
  };
  if (!omit.has("deployment-telemetry.jsonl")) {
    writeFileSync(path.join(dir, "deployment-telemetry.jsonl"), `${JSON.stringify(telemetry)}\n`);
  }
  for (const [name, value] of Object.entries(artifacts)) {
    if (omit.has(name)) continue;
    if (malformed.has(name)) {
      writeFileSync(path.join(dir, name), "{not-json");
    } else {
      writeJson(path.join(dir, name), value);
    }
  }
}

function certify(dir: string) {
  return audit.safeEvaluateAuditCertification({
    evidenceDir: dir,
    outputDir: dir,
    certifiedAt,
    env: {
      GITHUB_WORKFLOW: "Deploy",
      GITHUB_RUN_ID: "run-123",
      GITHUB_SHA: "abc123",
    },
  });
}

describe("deployment audit certification", () => {
  it("returns CERTIFIED when all required evidence is present", () => {
    const dir = tempDir();
    writeEvidence(dir);
    const result = certify(dir);

    expect(result.certificationStatus).toBe("CERTIFIED");
    expect(result.completenessScore).toBe(1);
    expect(result.evidenceHash).toMatch(/^sha256:/);
    expect(result.lineageHash).toMatch(/^sha256:/);
    rmSync(dir, { recursive: true, force: true });
  });

  it("returns PARTIAL when optional or conditionally absent evidence is missing", () => {
    const dir = tempDir();
    writeEvidence(dir, { omit: ["deployment-override-summary.json"] });

    expect(certify(dir).certificationStatus).toBe("PARTIAL");
    rmSync(dir, { recursive: true, force: true });
  });

  it("allows NO_CHECKPOINT and NO_OVERRIDE as partial lineage states", () => {
    const dir = tempDir();
    writeEvidence(dir, { noCheckpoint: true, noOverride: true });
    const result = certify(dir);

    expect(result.certificationStatus).toBe("PARTIAL");
    expect(result.missingScopes).toEqual(expect.arrayContaining(["CHECKPOINT", "OVERRIDE"]));
    rmSync(dir, { recursive: true, force: true });
  });

  it("returns FAILED for missing or unparseable critical artifacts", () => {
    const missing = tempDir();
    writeEvidence(missing, { omit: ["deployment-decision.json"] });
    expect(certify(missing).certificationStatus).toBe("FAILED");
    rmSync(missing, { recursive: true, force: true });

    const malformed = tempDir();
    writeEvidence(malformed, { malformed: ["deployment-enforcement.json"] });
    expect(certify(malformed).certificationStatus).toBe("FAILED");
    rmSync(malformed, { recursive: true, force: true });
  });

  it("returns DISPUTED for workflow, deployment, commit, and unknown state conflicts", () => {
    for (const overrides of [
      { decision: { workflowId: "Different" } },
      { decision: { deploymentId: "different" } },
      { decision: { commitSha: "different" } },
      { telemetry: { state: "MYSTERY" } },
    ]) {
      const dir = tempDir();
      writeEvidence(dir, { overrides });
      expect(certify(dir).certificationStatus).toBe("DISPUTED");
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("returns DISPUTED for override lineage mismatch and FAILED for hash mismatch", () => {
    const disputed = tempDir();
    writeEvidence(disputed, { overrides: { override: { sourceEnforcementHash: "sha256:different" } } });
    expect(certify(disputed).certificationStatus).toBe("DISPUTED");
    rmSync(disputed, { recursive: true, force: true });

    const failed = tempDir();
    writeEvidence(failed);
    const decision = JSON.parse(readFileSync(path.join(failed, "deployment-decision.json"), "utf8"));
    decision.decisionHash = "sha256:tampered";
    writeJson(path.join(failed, "deployment-decision.json"), decision);
    expect(certify(failed).certificationStatus).toBe("FAILED");
    rmSync(failed, { recursive: true, force: true });
  });

  it("writes deterministic certification artifacts and does not mutate inputs", () => {
    const dir = tempDir();
    writeEvidence(dir);
    const inputPath = path.join(dir, "deployment-evidence.json");
    const before = readFileSync(inputPath, "utf8");
    const first = certify(dir);
    const second = certify(dir);

    expect(first.certificationHash).toBe(second.certificationHash);
    expect(first.summary.certificationSummaryHash).toBe(second.summary.certificationSummaryHash);
    expect(readFileSync(inputPath, "utf8")).toBe(before);
    expect(JSON.parse(readFileSync(path.join(dir, "deployment-audit-certification.json"), "utf8")).certificationStatus).toBe("CERTIFIED");
    expect(JSON.parse(readFileSync(path.join(dir, "deployment-lineage.json"), "utf8")).lineageHash).toBe(first.lineageHash);
    rmSync(dir, { recursive: true, force: true });
  });
});
