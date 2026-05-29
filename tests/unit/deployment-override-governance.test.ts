import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";

const require = createRequire(import.meta.url);
const override = require("../../scripts/deploy-override-governance.cjs");

const validatedAt = "2026-05-28T12:00:00.000Z";

function tempDir() {
  return mkdtempSync(path.join(tmpdir(), "deploy-override-"));
}

function writeJson(filePath: string, value: unknown) {
  writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function enforcementArtifact(overrides: Record<string, unknown> = {}) {
  return {
    workflowId: "Deploy",
    deploymentId: "run-123",
    commitSha: "abc123",
    enforcementMode: "ENFORCE_SCOPED",
    enforcementDecision: "ENFORCE_BLOCK",
    sourceDecision: "BLOCK_RECOMMENDED",
    sourceRisk: "CRITICAL",
    deterministicCauses: ["CERTIFICATE_INVALID"],
    blocked: true,
    reasons: ["SCOPED_ENFORCEMENT_BLOCK"],
    evaluatedAt: "2026-05-28T11:55:00.000Z",
    policyVersion: "dh-scoped-enforcement/v1",
    enforcementHash: "sha256:enforcement-hash",
    ...overrides,
  };
}

function overrideArtifact(enforcement = enforcementArtifact(), overrides: Record<string, unknown> = {}) {
  return {
    schemaVersion: "dh-override-authorization/v1",
    workflowId: enforcement.workflowId,
    deploymentId: enforcement.deploymentId,
    commitSha: enforcement.commitSha,
    operatorId: "operator@example.com",
    reason: "Bounded production exception approved by release commander.",
    sourceEnforcementHash: enforcement.enforcementHash,
    createdAt: "2026-05-28T11:58:00.000Z",
    expiresAt: "2026-05-28T12:30:00.000Z",
    ...overrides,
  };
}

function evaluate(options: {
  enforcement?: Record<string, unknown>;
  overrideValue?: Record<string, unknown> | string | null;
  mode?: string;
} = {}) {
  const dir = tempDir();
  const enforcement = options.enforcement || enforcementArtifact();
  writeJson(path.join(dir, "deployment-enforcement.json"), enforcement);
  const overridePath = path.join(dir, "override.json");
  if (typeof options.overrideValue === "string") {
    writeFileSync(overridePath, options.overrideValue);
  } else if (options.overrideValue) {
    writeJson(overridePath, options.overrideValue);
  }
  const result = override.safeEvaluateOverrideGovernance({
    evidenceDir: dir,
    outputDir: dir,
    overridePath,
    validatedAt,
    mode: options.mode || "request_only",
    env: {
      GITHUB_WORKFLOW: "Deploy",
      GITHUB_RUN_ID: "run-123",
      GITHUB_SHA: "abc123",
    },
  });
  const governance = JSON.parse(readFileSync(path.join(dir, "deployment-override-governance.json"), "utf8"));
  const request = JSON.parse(readFileSync(path.join(dir, "deployment-override-request.json"), "utf8"));
  const summary = JSON.parse(readFileSync(path.join(dir, "deployment-override-summary.json"), "utf8"));
  rmSync(dir, { recursive: true, force: true });
  return { result, governance, request, summary };
}

describe("deployment override governance", () => {
  it("returns NO_OVERRIDE when DH-6 did not block", () => {
    const { result } = evaluate({
      enforcement: enforcementArtifact({ blocked: false, enforcementDecision: "ALLOW_CONTINUE" }),
    });

    expect(result.overrideDecision).toBe("NO_OVERRIDE");
    expect(override.shouldBlock(result)).toBe(false);
  });

  it("override disabled keeps the block", () => {
    const { result } = evaluate({ mode: "disabled" });

    expect(result.overrideMode).toBe("OVERRIDE_DISABLED");
    expect(result.overrideDecision).toBe("OVERRIDE_REJECTED");
    expect(override.shouldBlock(result)).toBe(true);
  });

  it("request_only creates approval request and keeps block", () => {
    const { result, request } = evaluate({ mode: "request_only" });

    expect(result.overrideDecision).toBe("REQUEST_CREATED");
    expect(request.requestHash).toMatch(/^sha256:/);
    expect(override.shouldBlock(result)).toBe(true);
  });

  it("allowed_with_artifact validates complete override", () => {
    const enforcement = enforcementArtifact();
    const { result } = evaluate({
      enforcement,
      overrideValue: overrideArtifact(enforcement),
      mode: "allowed_with_artifact",
    });

    expect(result.overrideDecision).toBe("OVERRIDE_VALID");
    expect(result.operatorId).toBe("operator@example.com");
    expect(result.approvalReason).toContain("Bounded production exception");
    expect(override.shouldBlock(result)).toBe(false);
  });

  it("rejects missing and malformed override artifacts", () => {
    expect(evaluate({ mode: "allowed_with_artifact" }).result.overrideDecision).toBe("OVERRIDE_REJECTED");
    expect(evaluate({ mode: "allowed_with_artifact", overrideValue: "{not-json" }).result.overrideDecision).toBe("OVERRIDE_DISPUTED");
  });

  it("rejects expired override artifacts", () => {
    const enforcement = enforcementArtifact();
    const { result } = evaluate({
      enforcement,
      overrideValue: overrideArtifact(enforcement, { expiresAt: "2026-05-28T11:59:00.000Z" }),
      mode: "allowed_with_artifact",
    });

    expect(result.overrideDecision).toBe("OVERRIDE_EXPIRED");
    expect(override.shouldBlock(result)).toBe(true);
  });

  it("rejects commit, workflow, deployment, and source hash mismatches", () => {
    const enforcement = enforcementArtifact();
    for (const mismatch of [
      { commitSha: "different" },
      { workflowId: "Different" },
      { deploymentId: "different" },
      { sourceEnforcementHash: "sha256:different" },
    ]) {
      const { result } = evaluate({
        enforcement,
        overrideValue: overrideArtifact(enforcement, mismatch),
        mode: "allowed_with_artifact",
      });
      expect(result.overrideDecision).toBe("OVERRIDE_REJECTED");
      expect(override.shouldBlock(result)).toBe(true);
    }
  });

  it("rejects missing reason and missing operator", () => {
    const enforcement = enforcementArtifact();
    for (const missing of [{ reason: "" }, { operatorId: "" }]) {
      const { result } = evaluate({
        enforcement,
        overrideValue: overrideArtifact(enforcement, missing),
        mode: "allowed_with_artifact",
      });
      expect(result.overrideDecision).toBe("OVERRIDE_REJECTED");
    }
  });

  it("writes deterministic override and request artifacts", () => {
    const enforcement = enforcementArtifact();
    const first = evaluate({ enforcement, overrideValue: overrideArtifact(enforcement), mode: "allowed_with_artifact" });
    const second = evaluate({ enforcement, overrideValue: overrideArtifact(enforcement), mode: "allowed_with_artifact" });

    expect(first.governance.overrideGovernanceHash).toBe(second.governance.overrideGovernanceHash);
    expect(first.request.requestHash).toBe(second.request.requestHash);
    expect(first.summary.overrideSummaryHash).toBe(second.summary.overrideSummaryHash);
  });

  it("unknown override mode defaults to request_only", () => {
    const { result } = evaluate({ mode: "mystery" });

    expect(result.overrideMode).toBe("OVERRIDE_REQUEST_ONLY");
    expect(result.overrideDecision).toBe("REQUEST_CREATED");
    expect(result.reasons).toContain("OVERRIDE_MODE_UNKNOWN:mystery");
  });

  it("CLI exits nonzero for invalid override and zero for valid override", () => {
    const dir = tempDir();
    const enforcement = enforcementArtifact();
    writeJson(path.join(dir, "deployment-enforcement.json"), enforcement);
    const missing = spawnSync(process.execPath, [
      path.join(process.cwd(), "scripts", "deploy-override-governance.cjs"),
      "evaluate",
      "--evidence-dir",
      dir,
      "--output-dir",
      dir,
      "--mode",
      "allowed_with_artifact",
      "--override",
      path.join(dir, "missing.json"),
      "--validatedAt",
      validatedAt,
    ], { encoding: "utf8" });
    expect(missing.status).toBe(1);

    const overridePath = path.join(dir, "override.json");
    writeJson(overridePath, overrideArtifact(enforcement));
    const valid = spawnSync(process.execPath, [
      path.join(process.cwd(), "scripts", "deploy-override-governance.cjs"),
      "evaluate",
      "--evidence-dir",
      dir,
      "--output-dir",
      dir,
      "--mode",
      "allowed_with_artifact",
      "--override",
      overridePath,
      "--validatedAt",
      validatedAt,
    ], { encoding: "utf8" });
    expect(valid.status).toBe(0);
    rmSync(dir, { recursive: true, force: true });
  });
});
