import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { GET } from "@/app/api/deployment-hardening/status/route";
import { buildDeploymentHardeningReadModel } from "@/services/deployment-hardening/deploymentHardeningReadModel";

const ORIGINAL_EVIDENCE_DIR = process.env.DEPLOYMENT_HARDENING_EVIDENCE_DIR;

function makeDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "dh5-status-"));
}

function writeJson(filePath: string, value: unknown) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function writeValidEvidence(dir: string) {
  const base = {
    workflowId: "deploy",
    deploymentId: "run_100",
    commitSha: "abc123",
  };
  const first = {
    event: "deployment_decision_complete",
    timestamp: "2026-05-28T12:00:00.000Z",
    ...base,
    currentStep: "deployment_decision",
    currentPartition: "decision",
    lastCompletedPartition: "checkpoint",
    heartbeatAt: "2026-05-28T12:00:00.000Z",
    certificateStatus: "VALID",
    checkpointStatus: "SAFE",
    resumeEligibility: "ELIGIBLE",
    deploymentDecision: "ALLOW",
    deploymentRisk: "LOW",
    enforcementMode: "WARN_ONLY",
    enforcementDecision: "ALLOW_CONTINUE",
    enforcementPolicyVersion: "dh-scoped-enforcement/v1",
    enforcementReasons: ["SCOPED_ENFORCEMENT_ALLOW_CONTINUE"],
    deterministicCauses: [],
    blocked: false,
    state: "PROGRESSING",
  };
  const earlier = {
    ...first,
    event: "deploy_start",
    timestamp: "2026-05-28T11:59:00.000Z",
    currentStep: "deploy_start",
    deploymentDecision: "DISPUTED",
    deploymentRisk: "UNKNOWN",
    certificateStatus: "UNVERIFIED",
    checkpointStatus: "UNVERIFIED",
    resumeEligibility: "UNVERIFIED",
    state: "RUNNING",
  };
  fs.writeFileSync(path.join(dir, "deployment-telemetry.jsonl"), `${JSON.stringify(first)}\n${JSON.stringify(earlier)}\n${JSON.stringify(first)}\n`);
  writeJson(path.join(dir, "deployment-summary.json"), {
    latestState: "PROGRESSING",
    latestDeploymentDecision: "ALLOW",
    latestDeploymentRisk: "LOW",
  });
  writeJson(path.join(dir, "deployment-evidence.json"), {
    ...base,
    latestState: "PROGRESSING",
    evidenceHash: "sha256:evidence",
  });
  writeJson(path.join(dir, "certificate-verification.json"), {
    ...base,
    certificateStatus: "VALID",
    certificateHash: "sha256:certificate",
    failureClass: null,
  });
  writeJson(path.join(dir, "checkpoint-validation.json"), {
    ...base,
    checkpointStatus: "SAFE",
    resumeEligibility: "ELIGIBLE",
    checkpointHash: "sha256:checkpoint",
    environmentHash: "sha256:environment",
  });
  writeJson(path.join(dir, "resume-analysis.json"), {
    ...base,
    checkpointStatus: "SAFE",
    resumeEligibility: "ELIGIBLE",
    checkpointHash: "sha256:checkpoint",
    environmentHash: "sha256:environment",
  });
  writeJson(path.join(dir, "deployment-decision.json"), {
    ...base,
    decision: "ALLOW",
    risk: "LOW",
    policyVersion: "dh-deployment-decision/v1",
    enforcementMode: "READ_ONLY",
    reasons: ["POLICY_ALLOW"],
  });
  writeJson(path.join(dir, "deployment-decision-summary.json"), {
    ...base,
    decision: "ALLOW",
    risk: "LOW",
    policyVersion: "dh-deployment-decision/v1",
  });
  writeJson(path.join(dir, "deployment-enforcement.json"), {
    ...base,
    enforcementMode: "WARN_ONLY",
    enforcementDecision: "ALLOW_CONTINUE",
    sourceDecision: "ALLOW",
    sourceRisk: "LOW",
    deterministicCauses: [],
    blocked: false,
    reasons: ["SCOPED_ENFORCEMENT_ALLOW_CONTINUE"],
    policyVersion: "dh-scoped-enforcement/v1",
  });
  writeJson(path.join(dir, "deployment-enforcement-summary.json"), {
    ...base,
    enforcementMode: "WARN_ONLY",
    enforcementDecision: "ALLOW_CONTINUE",
    blocked: false,
    deterministicCauses: [],
    reasons: ["SCOPED_ENFORCEMENT_ALLOW_CONTINUE"],
    policyVersion: "dh-scoped-enforcement/v1",
  });
}

describe("deployment hardening status API", () => {
  let evidenceDir: string;

  beforeEach(() => {
    evidenceDir = makeDir();
    process.env.DEPLOYMENT_HARDENING_EVIDENCE_DIR = evidenceDir;
  });

  afterEach(() => {
    if (ORIGINAL_EVIDENCE_DIR === undefined) {
      delete process.env.DEPLOYMENT_HARDENING_EVIDENCE_DIR;
    } else {
      process.env.DEPLOYMENT_HARDENING_EVIDENCE_DIR = ORIGINAL_EVIDENCE_DIR;
    }
    fs.rmSync(evidenceDir, { recursive: true, force: true });
  });

  it("returns a normalized read model", async () => {
    writeValidEvidence(evidenceDir);

    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(payload.data.overallState).toBe("PROGRESSING");
    expect(payload.data.certificateStatus).toBe("VALID");
    expect(payload.data.checkpointStatus).toBe("SAFE");
    expect(payload.data.deploymentDecision).toBe("ALLOW");
    expect(payload.data.enforcementMode).toBe("WARN_ONLY");
    expect(payload.data.enforcementDecision).toBe("ALLOW_CONTINUE");
    expect(payload.data.blocked).toBe(false);
    expect(payload.data.timeline.map((event: { event: string }) => event.event)).toEqual([
      "deploy_start",
      "deployment_decision_complete",
      "deployment_decision_complete",
    ]);
  });

  it("normalizes missing evidence to disputed without throwing", async () => {
    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(payload.data.overallState).toBe("DISPUTED");
    expect(payload.data.evidenceAvailable).toBe(false);
    expect(payload.data.disputedReasons).toContain("EVIDENCE_MISSING:deployment-telemetry.jsonl");
  });

  it("normalizes malformed artifacts to disputed", () => {
    writeValidEvidence(evidenceDir);
    fs.writeFileSync(path.join(evidenceDir, "deployment-decision.json"), "{not-json");

    const model = buildDeploymentHardeningReadModel({
      evidenceDir,
      now: "2026-05-28T12:00:00.000Z",
    });

    expect(model.overallState).toBe("DISPUTED");
    expect(model.evidenceAvailable).toBe(false);
    expect(model.disputedReasons).toContain("EVIDENCE_UNPARSEABLE:deployment-decision.json");
  });

  it("preserves read-only behavior and does not mutate artifacts", () => {
    writeValidEvidence(evidenceDir);
    const target = path.join(evidenceDir, "deployment-evidence.json");
    const before = fs.readFileSync(target, "utf8");

    buildDeploymentHardeningReadModel({
      evidenceDir,
      now: "2026-05-28T12:00:00.000Z",
    });

    expect(fs.readFileSync(target, "utf8")).toBe(before);
  });
});
