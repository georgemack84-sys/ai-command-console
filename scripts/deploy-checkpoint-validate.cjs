#!/usr/bin/env node

const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

const DEFAULT_CHECKPOINT_PATH = path.join(".codex-temp", "test-release-progress.json");
const DEFAULT_OUTPUT_DIR = path.join("artifacts", "deployment-telemetry");
const CHECKPOINT_VALIDATION_JSON = "checkpoint-validation.json";
const RESUME_ANALYSIS_JSON = "resume-analysis.json";

const CHECKPOINT_STATUSES = new Set([
  "UNVERIFIED",
  "NO_CHECKPOINT",
  "FOUND",
  "SAFE",
  "UNSAFE",
  "DRIFTED",
  "DISPUTED",
]);

const RESUME_ELIGIBILITIES = new Set([
  "UNVERIFIED",
  "ELIGIBLE",
  "INELIGIBLE",
  "DISPUTED",
  "NOT_APPLICABLE",
]);

const DEPLOYMENT_STATES = new Set(["RUNNING", "PROGRESSING", "WAITING", "STALLED", "BLOCKED", "DISPUTED", "PASSED", "FAILED"]);

const REQUIRED_CHECKPOINT_FIELDS = Object.freeze([
  "checkpointHash",
  "lastCompletedPartition",
  "commitSha",
  "certificateId",
  "environmentHash",
  "createdAt",
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

function sha256Raw(value) {
  return `sha256:${crypto.createHash("sha256").update(value).digest("hex")}`;
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
  return env.DEPLOY_CHECKPOINT_VALIDATED_AT || new Date().toISOString();
}

function normalizeCheckpointStatus(value) {
  const normalized = String(value || "UNVERIFIED").trim().toUpperCase();
  return CHECKPOINT_STATUSES.has(normalized) ? normalized : "DISPUTED";
}

function normalizeResumeEligibility(value) {
  const normalized = String(value || "UNVERIFIED").trim().toUpperCase();
  return RESUME_ELIGIBILITIES.has(normalized) ? normalized : "DISPUTED";
}

function normalizeState(value) {
  const normalized = String(value || "PROGRESSING").trim().toUpperCase();
  return DEPLOYMENT_STATES.has(normalized) ? normalized : "DISPUTED";
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function isSha256(value) {
  return typeof value === "string" && value.startsWith("sha256:") && value.length > "sha256:".length;
}

function readFileHashIfExists(filePath) {
  try {
    if (!filePath || !fs.existsSync(filePath)) return "MISSING";
    return sha256Raw(fs.readFileSync(filePath));
  } catch {
    return "MISSING";
  }
}

function buildEnvironmentHash(input = {}) {
  return sha256({
    certificateId: input.certificateId || input.certificateHash || "",
    certificateStatus: input.certificateStatus || "UNVERIFIED",
    commitSha: input.commitSha || "",
    nodeVersion: input.nodeVersion || "",
    packageLockHash: input.packageLockHash || "MISSING",
    runnerOs: input.runnerOs || "",
    workflowId: input.workflowId || "",
    workflowRunId: input.workflowRunId || "",
  });
}

function checkpointPreimage(checkpoint) {
  const { checkpointHash, ...preimage } = checkpoint || {};
  return preimage;
}

function hashCheckpoint(checkpoint) {
  return sha256(checkpointPreimage(checkpoint));
}

function buildResult(input) {
  const checkpointStatus = normalizeCheckpointStatus(input.checkpointStatus);
  const resumeEligibility = normalizeResumeEligibility(input.resumeEligibility);
  const state = checkpointStatus === "SAFE" || checkpointStatus === "NO_CHECKPOINT"
    ? normalizeState(input.state || "PROGRESSING")
    : "DISPUTED";
  const result = {
    workflowId: input.workflowId,
    deploymentId: input.deploymentId,
    commitSha: input.commitSha,
    checkpointStatus,
    resumeEligibility,
    checkpointPath: input.checkpointPath,
    checkpointHash: input.checkpointHash,
    environmentHash: input.environmentHash,
    certificateStatus: input.certificateStatus || "UNVERIFIED",
    validatedAt: input.validatedAt,
    failureClass: input.failureClass,
    reasons: [...new Set(input.reasons || [])],
    enforcementMode: "READ_ONLY",
    state,
  };
  return {
    ...result,
    validationHash: hashCheckpointValidationResult(result),
  };
}

function hashCheckpointValidationResult(result) {
  return sha256({
    workflowId: result.workflowId,
    deploymentId: result.deploymentId,
    commitSha: result.commitSha,
    checkpointStatus: result.checkpointStatus,
    resumeEligibility: result.resumeEligibility,
    checkpointPath: result.checkpointPath,
    checkpointHash: result.checkpointHash,
    environmentHash: result.environmentHash,
    certificateStatus: result.certificateStatus,
    validatedAt: result.validatedAt,
    failureClass: result.failureClass,
    reasons: result.reasons || [],
    enforcementMode: result.enforcementMode,
    state: result.state,
  });
}

function buildContext(options = {}) {
  const env = options.env || process.env;
  const commitSha = options.commitSha || env.DEPLOY_COMMIT_SHA || env.GITHUB_SHA || "";
  const workflowId = options.workflowId || env.GITHUB_WORKFLOW || "unknown_workflow";
  const workflowRunId = options.workflowRunId || env.GITHUB_RUN_ID || "";
  const deploymentId = options.deploymentId || env.DEPLOYMENT_ID || env.GITHUB_RUN_ID || "unknown_deployment";
  const packageLockHash = options.packageLockHash || readFileHashIfExists(options.packageLockPath || path.join(process.cwd(), "package-lock.json"));
  const certificateStatus = options.certificateStatus || env.DEPLOY_CERTIFICATE_STATUS || "UNVERIFIED";
  const certificateId = options.certificateId || options.certificateHash || env.DEPLOY_CERTIFICATE_ID || env.DEPLOY_CERTIFICATE_HASH || "";
  const nodeVersion = options.nodeVersion || env.NODE_VERSION || process.version;
  const runnerOs = options.runnerOs || env.RUNNER_OS || process.platform;
  const environmentHash = buildEnvironmentHash({
    workflowId,
    workflowRunId,
    commitSha,
    runnerOs,
    nodeVersion,
    packageLockHash,
    certificateStatus,
    certificateId,
  });

  return {
    env,
    commitSha,
    workflowId,
    workflowRunId,
    deploymentId,
    packageLockHash,
    certificateStatus,
    certificateId,
    nodeVersion,
    runnerOs,
    environmentHash,
    validatedAt: options.validatedAt || now(env),
  };
}

function validateCheckpointShape(checkpoint) {
  const reasons = [];
  if (!checkpoint || typeof checkpoint !== "object" || Array.isArray(checkpoint)) {
    return ["CHECKPOINT_MALFORMED"];
  }
  for (const field of REQUIRED_CHECKPOINT_FIELDS) {
    if (!(field in checkpoint)) {
      reasons.push(`${field.replace(/([A-Z])/g, "_$1").toUpperCase()}_MISSING`);
    }
  }
  if (!isSha256(checkpoint.checkpointHash)) reasons.push("CHECKPOINT_HASH_MISSING");
  if (!isNonEmptyString(checkpoint.lastCompletedPartition)) reasons.push("LAST_COMPLETED_PARTITION_MISSING");
  if (!isNonEmptyString(checkpoint.commitSha)) reasons.push("COMMIT_SHA_MISSING");
  if (!isNonEmptyString(checkpoint.certificateId)) reasons.push("CERTIFICATE_ID_MISSING");
  if (!isSha256(checkpoint.environmentHash)) reasons.push("ENVIRONMENT_HASH_MISSING");
  if (!isNonEmptyString(checkpoint.createdAt)) reasons.push("CREATED_AT_MISSING");
  return [...new Set(reasons)];
}

function verifyCheckpointObject(checkpoint, options = {}) {
  const context = buildContext(options);
  const reasons = validateCheckpointShape(checkpoint);

  if (reasons.includes("CHECKPOINT_MALFORMED") || reasons.length > 0) {
    return buildResult({
      ...context,
      checkpointPath: options.checkpointPath,
      checkpointHash: checkpoint?.checkpointHash,
      checkpointStatus: "UNSAFE",
      resumeEligibility: "INELIGIBLE",
      failureClass: "UNKNOWN_FAILURE",
      reasons,
      state: "DISPUTED",
    });
  }

  const expectedHash = hashCheckpoint(checkpoint);
  if (checkpoint.checkpointHash !== expectedHash) {
    reasons.push("CHECKPOINT_HASH_MISMATCH");
  }
  if (checkpoint.commitSha !== context.commitSha) {
    reasons.push("CHECKPOINT_COMMIT_MISMATCH");
  }
  if (checkpoint.environmentHash !== context.environmentHash) {
    reasons.push("CHECKPOINT_ENVIRONMENT_DRIFT");
  }
  if (context.certificateId && checkpoint.certificateId !== context.certificateId) {
    reasons.push("CHECKPOINT_CERTIFICATE_MISMATCH");
  }

  const uniqueReasons = [...new Set(reasons)];
  let checkpointStatus = "SAFE";
  let failureClass = null;
  if (uniqueReasons.includes("CHECKPOINT_ENVIRONMENT_DRIFT")) {
    checkpointStatus = "DRIFTED";
    failureClass = "ENV_FAILURE";
  } else if (uniqueReasons.length > 0) {
    checkpointStatus = "UNSAFE";
    failureClass = uniqueReasons.some((reason) => reason.includes("COMMIT") || reason.includes("CERTIFICATE"))
      ? "GOVERNANCE_FAILURE"
      : "UNKNOWN_FAILURE";
  }

  return buildResult({
    ...context,
    checkpointPath: options.checkpointPath,
    checkpointHash: checkpoint.checkpointHash,
    checkpointStatus,
    resumeEligibility: checkpointStatus === "SAFE" ? "ELIGIBLE" : "INELIGIBLE",
    failureClass,
    reasons: uniqueReasons,
    state: checkpointStatus === "SAFE" ? "PROGRESSING" : "DISPUTED",
  });
}

function verifyCheckpointFile(checkpointPath = DEFAULT_CHECKPOINT_PATH, options = {}) {
  const context = buildContext(options);
  const resolvedPath = checkpointPath || DEFAULT_CHECKPOINT_PATH;

  if (!fs.existsSync(resolvedPath)) {
    return buildResult({
      ...context,
      checkpointPath: resolvedPath,
      checkpointStatus: "NO_CHECKPOINT",
      resumeEligibility: "NOT_APPLICABLE",
      failureClass: null,
      reasons: ["CHECKPOINT_NOT_FOUND"],
      state: "PROGRESSING",
    });
  }

  try {
    const checkpoint = JSON.parse(fs.readFileSync(resolvedPath, "utf8"));
    return verifyCheckpointObject(checkpoint, {
      ...options,
      checkpointPath: resolvedPath,
    });
  } catch {
    return buildResult({
      ...context,
      checkpointPath: resolvedPath,
      checkpointStatus: "UNSAFE",
      resumeEligibility: "INELIGIBLE",
      failureClass: "UNKNOWN_FAILURE",
      reasons: ["CHECKPOINT_MALFORMED"],
      state: "DISPUTED",
    });
  }
}

function buildResumeAnalysis(result) {
  const analysis = {
    analysisVersion: "1.0",
    workflowId: result.workflowId,
    deploymentId: result.deploymentId,
    commitSha: result.commitSha,
    checkpointStatus: result.checkpointStatus,
    resumeEligibility: result.resumeEligibility,
    checkpointHash: result.checkpointHash,
    environmentHash: result.environmentHash,
    certificateStatus: result.certificateStatus,
    analyzedAt: result.validatedAt,
    reasons: result.reasons,
    enforcementMode: "READ_ONLY",
    deployment_status: "unchanged",
  };
  return {
    ...analysis,
    resumeAnalysisHash: sha256(analysis),
  };
}

function writeGithubOutput(result, env = process.env) {
  if (!env.GITHUB_OUTPUT) return;
  const lines = [
    `checkpoint_status=${result.checkpointStatus}`,
    `resume_eligibility=${result.resumeEligibility}`,
    `failure_class=${result.failureClass || ""}`,
    `telemetry_state=${result.state}`,
    `checkpoint_hash=${result.checkpointHash || ""}`,
    `environment_hash=${result.environmentHash || ""}`,
  ];
  fs.appendFileSync(env.GITHUB_OUTPUT, `${lines.join("\n")}\n`);
}

function safeValidateCheckpoint(options = {}) {
  const env = options.env || process.env;
  const outputDir = options.outputDir || env.DEPLOY_TELEMETRY_DIR || DEFAULT_OUTPUT_DIR;
  try {
    const result = verifyCheckpointFile(options.checkpointPath || env.DEPLOY_CHECKPOINT_PATH || DEFAULT_CHECKPOINT_PATH, options);
    const resumeAnalysis = buildResumeAnalysis(result);
    fs.mkdirSync(outputDir, { recursive: true });
    fs.writeFileSync(path.join(outputDir, CHECKPOINT_VALIDATION_JSON), `${JSON.stringify(result, null, 2)}\n`);
    fs.writeFileSync(path.join(outputDir, RESUME_ANALYSIS_JSON), `${JSON.stringify(resumeAnalysis, null, 2)}\n`);
    writeGithubOutput(result, env);
    return {
      ...result,
      resumeAnalysis,
    };
  } catch (error) {
    const context = buildContext(options);
    const result = buildResult({
      ...context,
      checkpointStatus: "DISPUTED",
      resumeEligibility: "DISPUTED",
      failureClass: "UNKNOWN_FAILURE",
      reasons: [`CHECKPOINT_VALIDATION_ERROR:${error instanceof Error ? error.message : String(error)}`],
      state: "DISPUTED",
    });
    const resumeAnalysis = buildResumeAnalysis(result);
    try {
      fs.mkdirSync(outputDir, { recursive: true });
      fs.writeFileSync(path.join(outputDir, CHECKPOINT_VALIDATION_JSON), `${JSON.stringify(result, null, 2)}\n`);
      fs.writeFileSync(path.join(outputDir, RESUME_ANALYSIS_JSON), `${JSON.stringify(resumeAnalysis, null, 2)}\n`);
      writeGithubOutput(result, env);
    } catch {
      // Read-only checkpoint validation must not alter deployment outcome if artifact emission fails.
    }
    return {
      ...result,
      resumeAnalysis,
    };
  }
}

function runCli() {
  const [, , command, ...rest] = process.argv;
  if (command !== "verify") {
    console.error("Usage: node scripts/deploy-checkpoint-validate.cjs verify --checkpoint <path>");
    process.exitCode = 0;
    return;
  }
  const args = parseArgs(rest);
  const result = safeValidateCheckpoint({
    checkpointPath: args.checkpoint,
    outputDir: args["output-dir"],
    commitSha: args.commit,
    certificateStatus: args.certificateStatus,
    certificateId: args.certificateId,
    certificateHash: args.certificateHash,
    workflowRunId: args.workflowRunId,
    nodeVersion: args.nodeVersion,
    runnerOs: args.runnerOs,
    packageLockHash: args.packageLockHash,
    packageLockPath: args.packageLockPath,
  });
  console.log(JSON.stringify(result));
  process.exitCode = 0;
}

if (require.main === module) {
  runCli();
}

module.exports = {
  CHECKPOINT_STATUSES,
  CHECKPOINT_VALIDATION_JSON,
  DEFAULT_CHECKPOINT_PATH,
  DEFAULT_OUTPUT_DIR,
  REQUIRED_CHECKPOINT_FIELDS,
  RESUME_ANALYSIS_JSON,
  RESUME_ELIGIBILITIES,
  buildEnvironmentHash,
  buildResumeAnalysis,
  hashCheckpoint,
  hashCheckpointValidationResult,
  normalizeCheckpointStatus,
  normalizeResumeEligibility,
  safeValidateCheckpoint,
  validateCheckpointShape,
  verifyCheckpointFile,
  verifyCheckpointObject,
};
