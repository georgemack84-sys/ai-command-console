#!/usr/bin/env node

const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

const DEFAULT_EVIDENCE_DIR = path.join("artifacts", "deployment-telemetry");
const DEFAULT_OUTPUT_DIR = DEFAULT_EVIDENCE_DIR;
const DEFAULT_OVERRIDE_PATH = path.join("release-evidence", "override-authorization.json");
const OVERRIDE_GOVERNANCE_JSON = "deployment-override-governance.json";
const OVERRIDE_REQUEST_JSON = "deployment-override-request.json";
const OVERRIDE_SUMMARY_JSON = "deployment-override-summary.json";
const POLICY_VERSION = "dh-override-governance/v1";

const OVERRIDE_MODES = new Set(["OVERRIDE_DISABLED", "OVERRIDE_REQUEST_ONLY", "OVERRIDE_ALLOWED_WITH_ARTIFACT"]);
const OVERRIDE_DECISIONS = new Set([
  "NO_OVERRIDE",
  "REQUEST_CREATED",
  "OVERRIDE_VALID",
  "OVERRIDE_REJECTED",
  "OVERRIDE_EXPIRED",
  "OVERRIDE_DISPUTED",
]);
const REQUIRED_OVERRIDE_FIELDS = Object.freeze([
  "schemaVersion",
  "workflowId",
  "deploymentId",
  "commitSha",
  "operatorId",
  "reason",
  "sourceEnforcementHash",
  "createdAt",
  "expiresAt",
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
  return env.DEPLOY_OVERRIDE_VALIDATED_AT || new Date().toISOString();
}

function normalizeMode(value) {
  const raw = String(value || "request_only").trim().toUpperCase().replace(/-/g, "_");
  const mapped = raw === "DISABLED"
    ? "OVERRIDE_DISABLED"
    : raw === "REQUEST_ONLY"
      ? "OVERRIDE_REQUEST_ONLY"
      : raw === "ALLOWED_WITH_ARTIFACT"
        ? "OVERRIDE_ALLOWED_WITH_ARTIFACT"
        : raw;
  return OVERRIDE_MODES.has(mapped) ? { mode: mapped, reasons: [] } : {
    mode: "OVERRIDE_REQUEST_ONLY",
    reasons: [`OVERRIDE_MODE_UNKNOWN:${String(value || "") || "missing"}`],
  };
}

function isRecord(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function isSha256(value) {
  return typeof value === "string" && value.startsWith("sha256:") && value.length > "sha256:".length;
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function loadEnforcement(evidenceDir = DEFAULT_EVIDENCE_DIR) {
  const filePath = path.join(evidenceDir, "deployment-enforcement.json");
  if (!fs.existsSync(filePath)) {
    return {
      ok: false,
      enforcement: null,
      reasons: ["ENFORCEMENT_ARTIFACT_MISSING"],
    };
  }
  try {
    const enforcement = readJson(filePath);
    if (!isRecord(enforcement)) {
      return { ok: false, enforcement: null, reasons: ["ENFORCEMENT_ARTIFACT_MALFORMED"] };
    }
    return { ok: true, enforcement, reasons: [] };
  } catch {
    return { ok: false, enforcement: null, reasons: ["ENFORCEMENT_ARTIFACT_MALFORMED"] };
  }
}

function loadOverrideArtifact(overridePath = DEFAULT_OVERRIDE_PATH) {
  if (!fs.existsSync(overridePath)) {
    return {
      ok: false,
      override: null,
      reasons: ["OVERRIDE_ARTIFACT_MISSING"],
    };
  }
  try {
    const override = readJson(overridePath);
    if (!isRecord(override)) {
      return { ok: false, override: null, reasons: ["OVERRIDE_ARTIFACT_MALFORMED"] };
    }
    return { ok: true, override, reasons: [] };
  } catch {
    return { ok: false, override: null, reasons: ["OVERRIDE_ARTIFACT_MALFORMED"] };
  }
}

function validateOverrideArtifact(override, enforcement, validatedAt) {
  const reasons = [];
  if (!isRecord(override)) return ["OVERRIDE_ARTIFACT_MALFORMED"];

  for (const field of REQUIRED_OVERRIDE_FIELDS) {
    if (!(field in override)) {
      reasons.push(`${field.replace(/([A-Z])/g, "_$1").toUpperCase()}_MISSING`);
    }
  }
  if (override.schemaVersion !== "dh-override-authorization/v1") reasons.push("OVERRIDE_SCHEMA_INVALID");
  if (!isNonEmptyString(override.operatorId)) reasons.push("OPERATOR_ID_MISSING");
  if (!isNonEmptyString(override.reason)) reasons.push("OVERRIDE_REASON_MISSING");
  if (!isSha256(override.sourceEnforcementHash)) reasons.push("SOURCE_ENFORCEMENT_HASH_MISSING");
  if (!isNonEmptyString(override.createdAt)) reasons.push("OVERRIDE_CREATED_AT_MISSING");
  if (!isNonEmptyString(override.expiresAt)) reasons.push("OVERRIDE_EXPIRES_AT_MISSING");
  if (override.workflowId !== enforcement.workflowId) reasons.push("WORKFLOW_MISMATCH");
  if (override.deploymentId !== enforcement.deploymentId) reasons.push("DEPLOYMENT_MISMATCH");
  if (override.commitSha !== enforcement.commitSha) reasons.push("COMMIT_MISMATCH");
  if (override.sourceEnforcementHash !== enforcement.enforcementHash) reasons.push("SOURCE_ENFORCEMENT_HASH_MISMATCH");

  const expiresAtMs = Date.parse(String(override.expiresAt || ""));
  const validatedAtMs = Date.parse(String(validatedAt || ""));
  if (!Number.isFinite(expiresAtMs) || !Number.isFinite(validatedAtMs)) {
    reasons.push("OVERRIDE_EXPIRATION_UNPARSEABLE");
  } else if (expiresAtMs <= validatedAtMs) {
    reasons.push("OVERRIDE_EXPIRED");
  }

  return [...new Set(reasons)];
}

function buildApprovalRequest(enforcement, validatedAt, reasons) {
  const request = {
    schemaVersion: "dh-override-request/v1",
    workflowId: enforcement.workflowId || "unknown_workflow",
    deploymentId: enforcement.deploymentId || "unknown_deployment",
    commitSha: enforcement.commitSha || "",
    sourceEnforcementDecision: enforcement.enforcementDecision || "DISPUTED_NO_BLOCK",
    sourceBlocked: Boolean(enforcement.blocked),
    sourceEnforcementHash: enforcement.enforcementHash || "",
    requestedAt: validatedAt,
    reasons: [...new Set(reasons || [])],
    policyVersion: POLICY_VERSION,
  };
  return {
    ...request,
    requestHash: sha256(request),
  };
}

function buildResult(input) {
  const overrideMode = OVERRIDE_MODES.has(input.overrideMode) ? input.overrideMode : "OVERRIDE_REQUEST_ONLY";
  const overrideDecision = OVERRIDE_DECISIONS.has(input.overrideDecision) ? input.overrideDecision : "OVERRIDE_DISPUTED";
  const result = {
    workflowId: input.workflowId || "unknown_workflow",
    deploymentId: input.deploymentId || "unknown_deployment",
    commitSha: input.commitSha || "",
    overrideMode,
    overrideDecision,
    sourceEnforcementDecision: input.sourceEnforcementDecision || "DISPUTED_NO_BLOCK",
    sourceBlocked: Boolean(input.sourceBlocked),
    operatorId: input.operatorId,
    approvalReason: input.approvalReason,
    approvalArtifactHash: input.approvalArtifactHash,
    expiresAt: input.expiresAt,
    validatedAt: input.validatedAt,
    reasons: [...new Set(input.reasons || [])],
    policyVersion: POLICY_VERSION,
  };
  return {
    ...result,
    overrideGovernanceHash: hashOverrideGovernanceResult(result),
  };
}

function hashOverrideGovernanceResult(result) {
  return sha256({
    workflowId: result.workflowId,
    deploymentId: result.deploymentId,
    commitSha: result.commitSha,
    overrideMode: result.overrideMode,
    overrideDecision: result.overrideDecision,
    sourceEnforcementDecision: result.sourceEnforcementDecision,
    sourceBlocked: result.sourceBlocked,
    operatorId: result.operatorId,
    approvalReason: result.approvalReason,
    approvalArtifactHash: result.approvalArtifactHash,
    expiresAt: result.expiresAt,
    validatedAt: result.validatedAt,
    reasons: result.reasons,
    policyVersion: result.policyVersion,
  });
}

function evaluateOverrideGovernance(options = {}) {
  const env = options.env || process.env;
  const validatedAt = options.validatedAt || now(env);
  const modeResult = normalizeMode(options.mode || env.DH_OVERRIDE_MODE);
  const loadedEnforcement = loadEnforcement(options.evidenceDir || DEFAULT_EVIDENCE_DIR);

  if (!loadedEnforcement.ok) {
    return buildResult({
      workflowId: env.GITHUB_WORKFLOW || "unknown_workflow",
      deploymentId: env.DEPLOYMENT_ID || env.GITHUB_RUN_ID || "unknown_deployment",
      commitSha: env.DEPLOY_COMMIT_SHA || env.GITHUB_SHA || "",
      overrideMode: modeResult.mode,
      overrideDecision: "OVERRIDE_DISPUTED",
      sourceEnforcementDecision: "DISPUTED_NO_BLOCK",
      sourceBlocked: true,
      validatedAt,
      reasons: [...modeResult.reasons, ...loadedEnforcement.reasons],
    });
  }

  const enforcement = loadedEnforcement.enforcement;
  const sourceBlocked = Boolean(enforcement.blocked);
  const sourceEnforcementDecision = String(enforcement.enforcementDecision || "DISPUTED_NO_BLOCK");

  if (!sourceBlocked) {
    return buildResult({
      workflowId: enforcement.workflowId,
      deploymentId: enforcement.deploymentId,
      commitSha: enforcement.commitSha,
      overrideMode: modeResult.mode,
      overrideDecision: "NO_OVERRIDE",
      sourceEnforcementDecision,
      sourceBlocked,
      validatedAt,
      reasons: [...modeResult.reasons, "SOURCE_NOT_BLOCKED"],
    });
  }

  if (modeResult.mode === "OVERRIDE_DISABLED") {
    return buildResult({
      workflowId: enforcement.workflowId,
      deploymentId: enforcement.deploymentId,
      commitSha: enforcement.commitSha,
      overrideMode: modeResult.mode,
      overrideDecision: "OVERRIDE_REJECTED",
      sourceEnforcementDecision,
      sourceBlocked,
      validatedAt,
      reasons: [...modeResult.reasons, "OVERRIDE_DISABLED"],
    });
  }

  if (modeResult.mode === "OVERRIDE_REQUEST_ONLY") {
    return buildResult({
      workflowId: enforcement.workflowId,
      deploymentId: enforcement.deploymentId,
      commitSha: enforcement.commitSha,
      overrideMode: modeResult.mode,
      overrideDecision: "REQUEST_CREATED",
      sourceEnforcementDecision,
      sourceBlocked,
      validatedAt,
      reasons: [...modeResult.reasons, "APPROVAL_REQUEST_CREATED"],
    });
  }

  const loadedOverride = loadOverrideArtifact(options.overridePath || env.DH_OVERRIDE_ARTIFACT_PATH || DEFAULT_OVERRIDE_PATH);
  if (!loadedOverride.ok) {
    return buildResult({
      workflowId: enforcement.workflowId,
      deploymentId: enforcement.deploymentId,
      commitSha: enforcement.commitSha,
      overrideMode: modeResult.mode,
      overrideDecision: loadedOverride.reasons.includes("OVERRIDE_ARTIFACT_MALFORMED") ? "OVERRIDE_DISPUTED" : "OVERRIDE_REJECTED",
      sourceEnforcementDecision,
      sourceBlocked,
      validatedAt,
      reasons: [...modeResult.reasons, ...loadedOverride.reasons],
    });
  }

  const override = loadedOverride.override;
  const validationReasons = validateOverrideArtifact(override, enforcement, validatedAt);
  const approvalArtifactHash = sha256(override);
  const base = {
    workflowId: enforcement.workflowId,
    deploymentId: enforcement.deploymentId,
    commitSha: enforcement.commitSha,
    overrideMode: modeResult.mode,
    sourceEnforcementDecision,
    sourceBlocked,
    operatorId: override.operatorId,
    approvalReason: override.reason,
    approvalArtifactHash,
    expiresAt: override.expiresAt,
    validatedAt,
    reasons: [...modeResult.reasons, ...validationReasons],
  };

  if (validationReasons.includes("OVERRIDE_EXPIRED")) {
    return buildResult({ ...base, overrideDecision: "OVERRIDE_EXPIRED" });
  }
  if (validationReasons.length > 0) {
    return buildResult({ ...base, overrideDecision: "OVERRIDE_REJECTED" });
  }
  return buildResult({ ...base, overrideDecision: "OVERRIDE_VALID", reasons: [...modeResult.reasons, "OVERRIDE_VALIDATED"] });
}

function buildOverrideSummary(result) {
  const summary = {
    summaryVersion: "1.0",
    workflowId: result.workflowId,
    deploymentId: result.deploymentId,
    commitSha: result.commitSha,
    overrideMode: result.overrideMode,
    overrideDecision: result.overrideDecision,
    sourceEnforcementDecision: result.sourceEnforcementDecision,
    sourceBlocked: result.sourceBlocked,
    operatorId: result.operatorId,
    approvalArtifactHash: result.approvalArtifactHash,
    expiresAt: result.expiresAt,
    validatedAt: result.validatedAt,
    reasons: result.reasons,
    policyVersion: result.policyVersion,
    deployment_status: result.overrideDecision === "OVERRIDE_VALID" ? "continued_under_governed_override" : result.sourceBlocked ? "blocked" : "unchanged",
  };
  return {
    ...summary,
    overrideSummaryHash: sha256(summary),
  };
}

function shouldBlock(result) {
  return Boolean(result.sourceBlocked && result.overrideDecision !== "OVERRIDE_VALID");
}

function writeGithubOutput(result, env = process.env) {
  if (!env.GITHUB_OUTPUT) return;
  const lines = [
    `override_mode=${result.overrideMode}`,
    `override_decision=${result.overrideDecision}`,
    `override_policy_version=${result.policyVersion}`,
    `override_reasons=${result.reasons.join(",")}`,
    `operator_id=${result.operatorId || ""}`,
    `override_expires_at=${result.expiresAt || ""}`,
    `approval_artifact_hash=${result.approvalArtifactHash || ""}`,
    `source_enforcement_decision=${result.sourceEnforcementDecision}`,
    `source_blocked=${result.sourceBlocked ? "true" : "false"}`,
    `telemetry_state=${shouldBlock(result) ? "BLOCKED" : "PROGRESSING"}`,
  ];
  fs.appendFileSync(env.GITHUB_OUTPUT, `${lines.join("\n")}\n`);
}

function safeEvaluateOverrideGovernance(options = {}) {
  const env = options.env || process.env;
  const outputDir = options.outputDir || env.DEPLOY_TELEMETRY_DIR || DEFAULT_OUTPUT_DIR;
  let result;
  let request;
  let summary;
  try {
    result = evaluateOverrideGovernance(options);
    const enforcement = loadEnforcement(options.evidenceDir || DEFAULT_EVIDENCE_DIR).enforcement || {
      workflowId: result.workflowId,
      deploymentId: result.deploymentId,
      commitSha: result.commitSha,
      enforcementDecision: result.sourceEnforcementDecision,
      blocked: result.sourceBlocked,
      enforcementHash: "",
    };
    request = buildApprovalRequest(enforcement, result.validatedAt, result.reasons);
    summary = buildOverrideSummary(result);
    fs.mkdirSync(outputDir, { recursive: true });
    fs.writeFileSync(path.join(outputDir, OVERRIDE_GOVERNANCE_JSON), `${JSON.stringify(result, null, 2)}\n`);
    fs.writeFileSync(path.join(outputDir, OVERRIDE_REQUEST_JSON), `${JSON.stringify(request, null, 2)}\n`);
    fs.writeFileSync(path.join(outputDir, OVERRIDE_SUMMARY_JSON), `${JSON.stringify(summary, null, 2)}\n`);
    writeGithubOutput(result, env);
  } catch (error) {
    result = buildResult({
      workflowId: env.GITHUB_WORKFLOW || "unknown_workflow",
      deploymentId: env.DEPLOYMENT_ID || env.GITHUB_RUN_ID || "unknown_deployment",
      commitSha: env.DEPLOY_COMMIT_SHA || env.GITHUB_SHA || "",
      overrideMode: normalizeMode(options.mode || env.DH_OVERRIDE_MODE).mode,
      overrideDecision: "OVERRIDE_DISPUTED",
      sourceEnforcementDecision: "DISPUTED_NO_BLOCK",
      sourceBlocked: true,
      validatedAt: now(env),
      reasons: [`OVERRIDE_GOVERNANCE_ERROR:${error instanceof Error ? error.message : String(error)}`],
    });
    request = buildApprovalRequest(result, result.validatedAt, result.reasons);
    summary = buildOverrideSummary(result);
    try {
      fs.mkdirSync(outputDir, { recursive: true });
      fs.writeFileSync(path.join(outputDir, OVERRIDE_GOVERNANCE_JSON), `${JSON.stringify(result, null, 2)}\n`);
      fs.writeFileSync(path.join(outputDir, OVERRIDE_REQUEST_JSON), `${JSON.stringify(request, null, 2)}\n`);
      fs.writeFileSync(path.join(outputDir, OVERRIDE_SUMMARY_JSON), `${JSON.stringify(summary, null, 2)}\n`);
      writeGithubOutput(result, env);
    } catch {
      // Artifact emission failure must not create an implicit bypass.
    }
  }
  return { ...result, request, summary };
}

function runCli() {
  const [, , command, ...rest] = process.argv;
  if (command !== "evaluate") {
    console.error("Usage: node scripts/deploy-override-governance.cjs evaluate --evidence-dir <path> --mode request_only");
    process.exitCode = 1;
    return;
  }
  const args = parseArgs(rest);
  const result = safeEvaluateOverrideGovernance({
    evidenceDir: args["evidence-dir"],
    outputDir: args["output-dir"],
    overridePath: args["override"],
    validatedAt: args.validatedAt,
    mode: args.mode,
  });
  console.log(JSON.stringify(result));
  process.exitCode = shouldBlock(result) ? 1 : 0;
}

if (require.main === module) {
  runCli();
}

module.exports = {
  DEFAULT_EVIDENCE_DIR,
  DEFAULT_OUTPUT_DIR,
  DEFAULT_OVERRIDE_PATH,
  OVERRIDE_GOVERNANCE_JSON,
  OVERRIDE_REQUEST_JSON,
  OVERRIDE_SUMMARY_JSON,
  POLICY_VERSION,
  buildApprovalRequest,
  buildOverrideSummary,
  evaluateOverrideGovernance,
  hashOverrideGovernanceResult,
  normalizeMode,
  safeEvaluateOverrideGovernance,
  shouldBlock,
  validateOverrideArtifact,
};
