#!/usr/bin/env node

const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

const DEFAULT_CERTIFICATE_PATH = path.join("release-evidence", "certificate.json");
const DEFAULT_OUTPUT_DIR = path.join("artifacts", "deployment-telemetry");
const CERTIFICATE_VERIFICATION_JSON = "certificate-verification.json";

const CERTIFICATE_STATUSES = new Set(["UNVERIFIED", "MISSING", "FOUND", "VALID", "INVALID", "DISPUTED"]);
const DEPLOYMENT_STATES = new Set(["RUNNING", "PROGRESSING", "WAITING", "STALLED", "BLOCKED", "DISPUTED", "PASSED", "FAILED"]);
const REQUIRED_FIELDS = Object.freeze([
  "schemaVersion",
  "commitSha",
  "workflowRunId",
  "testHash",
  "governanceStatus",
  "residueStatus",
  "approvalLineage",
  "artifactHash",
  "issuedAt",
]);

function stableSerialize(value) {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((entry) => stableSerialize(entry)).join(",")}]`;
  }
  return `{${Object.entries(value)
    .filter(([, nestedValue]) => nestedValue !== undefined)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, nestedValue]) => `${JSON.stringify(key)}:${stableSerialize(nestedValue)}`)
    .join(",")}}`;
}

function sha256(value) {
  return `sha256:${crypto.createHash("sha256").update(stableSerialize(value)).digest("hex")}`;
}

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const item = argv[index];
    if (!item.startsWith("--")) continue;
    const key = item.slice(2);
    const next = argv[index + 1];
    if (!next || next.startsWith("--")) {
      args[key] = "true";
      continue;
    }
    args[key] = next;
    index += 1;
  }
  return args;
}

function now(env = process.env) {
  return env.DEPLOY_CERTIFICATE_VERIFIED_AT || new Date().toISOString();
}

function normalizeCertificateStatus(value) {
  const normalized = String(value || "UNVERIFIED").trim().toUpperCase();
  return CERTIFICATE_STATUSES.has(normalized) ? normalized : "DISPUTED";
}

function normalizeVerificationState(value) {
  const normalized = String(value || "DISPUTED").trim().toUpperCase();
  return DEPLOYMENT_STATES.has(normalized) ? normalized : "DISPUTED";
}

function isSha256(value) {
  return typeof value === "string" && value.startsWith("sha256:") && value.length > "sha256:".length;
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function validateCertificateShape(certificate) {
  const reasons = [];

  if (!certificate || typeof certificate !== "object" || Array.isArray(certificate)) {
    return ["CERTIFICATE_MALFORMED"];
  }

  for (const field of REQUIRED_FIELDS) {
    if (!(field in certificate)) {
      reasons.push(`${field.replace(/([A-Z])/g, "_$1").toUpperCase()}_MISSING`);
    }
  }

  if (certificate.schemaVersion !== "dh-release-certificate/v1") reasons.push("SCHEMA_VERSION_INVALID");
  if (!isNonEmptyString(certificate.commitSha)) reasons.push("COMMIT_SHA_MISSING");
  if (!isNonEmptyString(certificate.workflowRunId)) reasons.push("WORKFLOW_RUN_ID_MISSING");
  if (!isSha256(certificate.testHash)) reasons.push("TEST_HASH_MISSING");
  if (!isSha256(certificate.artifactHash)) reasons.push("ARTIFACT_HASH_MISSING");
  if (certificate.governanceStatus !== "PASSED") reasons.push("GOVERNANCE_NOT_PASSED");
  if (certificate.residueStatus !== "CLEAN") reasons.push("RESIDUE_NOT_CLEAN");
  if (!Array.isArray(certificate.approvalLineage) || certificate.approvalLineage.filter(isNonEmptyString).length === 0) {
    reasons.push("APPROVAL_LINEAGE_MISSING");
  }
  if (!isNonEmptyString(certificate.issuedAt)) reasons.push("ISSUED_AT_MISSING");

  return [...new Set(reasons)];
}

function buildResult(input) {
  const certificateStatus = normalizeCertificateStatus(input.certificateStatus);
  const state =
    certificateStatus === "VALID"
      ? normalizeVerificationState(input.state || "PROGRESSING")
      : "DISPUTED";
  const result = {
    workflowId: input.workflowId,
    deploymentId: input.deploymentId,
    commitSha: input.commitSha,
    certificateStatus,
    certificatePath: input.certificatePath,
    certificateHash: input.certificateHash,
    verifiedAt: input.verifiedAt,
    failureClass: input.failureClass,
    reasons: [...new Set(input.reasons || [])],
    enforcementMode: "READ_ONLY",
    state,
  };
  return {
    ...result,
    verificationHash: hashCertificateVerificationResult(result),
  };
}

function hashCertificateVerificationResult(result) {
  return sha256({
    workflowId: result.workflowId,
    deploymentId: result.deploymentId,
    commitSha: result.commitSha,
    certificateStatus: result.certificateStatus,
    certificatePath: result.certificatePath,
    certificateHash: result.certificateHash,
    verifiedAt: result.verifiedAt,
    failureClass: result.failureClass,
    reasons: result.reasons || [],
    enforcementMode: result.enforcementMode,
    state: result.state,
  });
}

function verifyCertificateObject(certificate, options = {}) {
  const env = options.env || process.env;
  const commitSha = options.commitSha || env.DEPLOY_COMMIT_SHA || env.GITHUB_SHA || "";
  const workflowRunId = options.workflowRunId || env.GITHUB_RUN_ID || "";
  const reasons = validateCertificateShape(certificate);

  if (certificate && typeof certificate === "object" && !Array.isArray(certificate)) {
    if (certificate.commitSha && commitSha && certificate.commitSha !== commitSha) reasons.push("COMMIT_MISMATCH");
    if (certificate.workflowRunId && workflowRunId && certificate.workflowRunId !== workflowRunId) {
      reasons.push("WORKFLOW_RUN_MISMATCH");
    }
  }

  const uniqueReasons = [...new Set(reasons)];
  const certificateHash = uniqueReasons.includes("CERTIFICATE_MALFORMED")
    ? undefined
    : sha256(certificate);
  let failureClass = null;
  if (uniqueReasons.length > 0) {
    failureClass = uniqueReasons.includes("CERTIFICATE_MALFORMED") ? "UNKNOWN_FAILURE" : "GOVERNANCE_FAILURE";
  }

  return buildResult({
    workflowId: options.workflowId || env.GITHUB_WORKFLOW || "unknown_workflow",
    deploymentId: options.deploymentId || env.DEPLOYMENT_ID || env.GITHUB_RUN_ID || "unknown_deployment",
    commitSha,
    certificateStatus: uniqueReasons.length === 0 ? "VALID" : "INVALID",
    certificatePath: options.certificatePath,
    certificateHash,
    verifiedAt: options.verifiedAt || now(env),
    failureClass,
    reasons: uniqueReasons,
    state: uniqueReasons.length === 0 ? "PROGRESSING" : "DISPUTED",
  });
}

function verifyCertificateFile(certificatePath = DEFAULT_CERTIFICATE_PATH, options = {}) {
  const env = options.env || process.env;
  const resolvedPath = certificatePath || DEFAULT_CERTIFICATE_PATH;

  if (!fs.existsSync(resolvedPath)) {
    return buildResult({
      workflowId: options.workflowId || env.GITHUB_WORKFLOW || "unknown_workflow",
      deploymentId: options.deploymentId || env.DEPLOYMENT_ID || env.GITHUB_RUN_ID || "unknown_deployment",
      commitSha: options.commitSha || env.DEPLOY_COMMIT_SHA || env.GITHUB_SHA || "",
      certificateStatus: "MISSING",
      certificatePath: resolvedPath,
      verifiedAt: options.verifiedAt || now(env),
      failureClass: "GOVERNANCE_FAILURE",
      reasons: ["CERTIFICATE_MISSING"],
      state: "DISPUTED",
    });
  }

  try {
    const certificate = JSON.parse(fs.readFileSync(resolvedPath, "utf8"));
    return verifyCertificateObject(certificate, {
      ...options,
      certificatePath: resolvedPath,
    });
  } catch {
    return buildResult({
      workflowId: options.workflowId || env.GITHUB_WORKFLOW || "unknown_workflow",
      deploymentId: options.deploymentId || env.DEPLOYMENT_ID || env.GITHUB_RUN_ID || "unknown_deployment",
      commitSha: options.commitSha || env.DEPLOY_COMMIT_SHA || env.GITHUB_SHA || "",
      certificateStatus: "INVALID",
      certificatePath: resolvedPath,
      verifiedAt: options.verifiedAt || now(env),
      failureClass: "UNKNOWN_FAILURE",
      reasons: ["CERTIFICATE_MALFORMED"],
      state: "DISPUTED",
    });
  }
}

function writeGithubOutput(result, env = process.env) {
  if (!env.GITHUB_OUTPUT) return;
  const lines = [
    `certificate_status=${result.certificateStatus}`,
    `failure_class=${result.failureClass || ""}`,
    `telemetry_state=${result.state}`,
    `certificate_hash=${result.certificateHash || ""}`,
  ];
  fs.appendFileSync(env.GITHUB_OUTPUT, `${lines.join("\n")}\n`);
}

function safeVerifyCertificate(options = {}) {
  const env = options.env || process.env;
  const outputDir = options.outputDir || env.DEPLOY_TELEMETRY_DIR || DEFAULT_OUTPUT_DIR;
  try {
    const result = verifyCertificateFile(options.certificatePath || env.DEPLOY_CERTIFICATE_PATH || DEFAULT_CERTIFICATE_PATH, {
      env,
      commitSha: options.commitSha,
      workflowRunId: options.workflowRunId,
    });
    fs.mkdirSync(outputDir, { recursive: true });
    fs.writeFileSync(path.join(outputDir, CERTIFICATE_VERIFICATION_JSON), `${JSON.stringify(result, null, 2)}\n`);
    writeGithubOutput(result, env);
    return result;
  } catch (error) {
    const result = buildResult({
      workflowId: env.GITHUB_WORKFLOW || "unknown_workflow",
      deploymentId: env.DEPLOYMENT_ID || env.GITHUB_RUN_ID || "unknown_deployment",
      commitSha: env.DEPLOY_COMMIT_SHA || env.GITHUB_SHA || "",
      certificateStatus: "DISPUTED",
      verifiedAt: now(env),
      failureClass: "UNKNOWN_FAILURE",
      reasons: [`CERTIFICATE_VERIFICATION_ERROR:${error instanceof Error ? error.message : String(error)}`],
      state: "DISPUTED",
    });
    try {
      fs.mkdirSync(outputDir, { recursive: true });
      fs.writeFileSync(path.join(outputDir, CERTIFICATE_VERIFICATION_JSON), `${JSON.stringify(result, null, 2)}\n`);
      writeGithubOutput(result, env);
    } catch {
      // Read-only verifier must not alter deployment outcome if telemetry artifact emission fails.
    }
    return result;
  }
}

function runCli() {
  const [, , command, ...rest] = process.argv;
  if (command !== "verify") {
    console.error("Usage: node scripts/deploy-certificate-verify.cjs verify --certificate <path>");
    process.exitCode = 0;
    return;
  }
  const args = parseArgs(rest);
  const result = safeVerifyCertificate({
    certificatePath: args.certificate,
    outputDir: args["output-dir"],
    commitSha: args.commit,
    workflowRunId: args.workflowRunId,
  });
  console.log(JSON.stringify(result));
  process.exitCode = 0;
}

if (require.main === module) {
  runCli();
}

module.exports = {
  CERTIFICATE_STATUSES,
  CERTIFICATE_VERIFICATION_JSON,
  DEFAULT_CERTIFICATE_PATH,
  DEFAULT_OUTPUT_DIR,
  REQUIRED_FIELDS,
  buildResult,
  hashCertificateVerificationResult,
  normalizeCertificateStatus,
  normalizeVerificationState,
  safeVerifyCertificate,
  validateCertificateShape,
  verifyCertificateFile,
  verifyCertificateObject,
};
