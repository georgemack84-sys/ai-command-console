import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";

const require = createRequire(import.meta.url);
const verifier = require("../../scripts/deploy-certificate-verify.cjs");

function tempDir() {
  return mkdtempSync(path.join(tmpdir(), "deploy-certificate-"));
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
  DEPLOY_CERTIFICATE_VERIFIED_AT: "2026-05-28T00:00:00.000Z",
});

const validCertificate = Object.freeze({
  schemaVersion: "dh-release-certificate/v1",
  commitSha: "abc123",
  workflowRunId: "run-123",
  testHash: "sha256:test",
  governanceStatus: "PASSED",
  residueStatus: "CLEAN",
  approvalLineage: Object.freeze(["approval:release-governance"]),
  artifactHash: "sha256:artifact",
  issuedAt: "2026-05-28T00:00:00.000Z",
});

describe("deployment certificate verification", () => {
  it("returns VALID for a valid certificate", () => {
    const result = verifier.verifyCertificateObject(validCertificate, {
      env: baseEnv,
      certificatePath: "release-evidence/certificate.json",
    });

    expect(result).toMatchObject({
      workflowId: "Deploy",
      deploymentId: "run-123",
      commitSha: "abc123",
      certificateStatus: "VALID",
      certificatePath: "release-evidence/certificate.json",
      verifiedAt: "2026-05-28T00:00:00.000Z",
      failureClass: null,
      reasons: [],
      enforcementMode: "READ_ONLY",
      state: "PROGRESSING",
    });
    expect(result.certificateHash).toMatch(/^sha256:/);
  });

  it("returns MISSING when no certificate file exists", () => {
    const result = verifier.verifyCertificateFile(path.join(tempDir(), "missing.json"), { env: baseEnv });

    expect(result.certificateStatus).toBe("MISSING");
    expect(result.failureClass).toBe("GOVERNANCE_FAILURE");
    expect(result.state).toBe("DISPUTED");
    expect(result.reasons).toContain("CERTIFICATE_MISSING");
  });

  it("returns INVALID for commit mismatch", () => {
    const result = verifier.verifyCertificateObject({ ...validCertificate, commitSha: "different" }, { env: baseEnv });

    expect(result.certificateStatus).toBe("INVALID");
    expect(result.failureClass).toBe("GOVERNANCE_FAILURE");
    expect(result.state).toBe("DISPUTED");
    expect(result.reasons).toContain("COMMIT_MISMATCH");
  });

  it("returns INVALID for malformed certificate JSON", () => {
    const dir = tempDir();
    const certificatePath = path.join(dir, "certificate.json");
    writeFileSync(certificatePath, "{ malformed");

    const result = verifier.verifyCertificateFile(certificatePath, { env: baseEnv });

    expect(result.certificateStatus).toBe("INVALID");
    expect(result.failureClass).toBe("UNKNOWN_FAILURE");
    expect(result.state).toBe("DISPUTED");
    expect(result.reasons).toContain("CERTIFICATE_MALFORMED");
    rmSync(dir, { recursive: true, force: true });
  });

  it("returns INVALID when governanceStatus is missing", () => {
    const { governanceStatus, ...certificate } = validCertificate;
    expect(verifier.verifyCertificateObject(certificate, { env: baseEnv }).reasons).toContain("GOVERNANCE_STATUS_MISSING");
    expect(governanceStatus).toBe("PASSED");
  });

  it("returns INVALID when testHash is missing", () => {
    const { testHash, ...certificate } = validCertificate;
    expect(verifier.verifyCertificateObject(certificate, { env: baseEnv }).reasons).toContain("TEST_HASH_MISSING");
    expect(testHash).toBe("sha256:test");
  });

  it("returns INVALID when artifactHash is missing", () => {
    const { artifactHash, ...certificate } = validCertificate;
    expect(verifier.verifyCertificateObject(certificate, { env: baseEnv }).reasons).toContain("ARTIFACT_HASH_MISSING");
    expect(artifactHash).toBe("sha256:artifact");
  });

  it("resolves unknown state to DISPUTED", () => {
    expect(verifier.normalizeVerificationState("mystery")).toBe("DISPUTED");
  });

  it("read-only mode never exits nonzero for invalid certificate", () => {
    const dir = tempDir();
    const certificatePath = writeJson(dir, "certificate.json", { ...validCertificate, commitSha: "different" });
    const result = spawnSync(process.execPath, [
      path.join(process.cwd(), "scripts", "deploy-certificate-verify.cjs"),
      "verify",
      "--certificate",
      certificatePath,
      "--output-dir",
      dir,
    ], {
      cwd: process.cwd(),
      env: { ...process.env, ...baseEnv },
      encoding: "utf8",
    });

    expect(result.status).toBe(0);
    expect(JSON.parse(result.stdout).certificateStatus).toBe("INVALID");
    rmSync(dir, { recursive: true, force: true });
  });

  it("writes deterministic certificate verification artifacts", () => {
    const dir = tempDir();
    const first = verifier.safeVerifyCertificate({
      certificatePath: writeJson(dir, "certificate.json", validCertificate),
      outputDir: dir,
      env: baseEnv,
    });
    const second = verifier.safeVerifyCertificate({
      certificatePath: path.join(dir, "certificate.json"),
      outputDir: dir,
      env: baseEnv,
    });
    const artifact = JSON.parse(readFileSync(path.join(dir, "certificate-verification.json"), "utf8"));

    expect(first.verificationHash).toBe(second.verificationHash);
    expect(artifact.verificationHash).toBe(first.verificationHash);
    expect(first.verificationHash).toMatch(/^sha256:/);
    rmSync(dir, { recursive: true, force: true });
  });
});
