#!/usr/bin/env node

const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

const DEFAULT_EVIDENCE_DIR = path.join("artifacts", "deployment-telemetry");
const DEFAULT_OUTPUT_DIR = DEFAULT_EVIDENCE_DIR;
const ENFORCEMENT_JSON = "deployment-enforcement.json";
const ENFORCEMENT_SUMMARY_JSON = "deployment-enforcement-summary.json";
const POLICY_VERSION = "dh-scoped-enforcement/v1";

const ENFORCEMENT_MODES = new Set(["READ_ONLY", "WARN_ONLY", "ENFORCE_SCOPED"]);
const ENFORCEMENT_DECISIONS = new Set(["ALLOW_CONTINUE", "WARN_CONTINUE", "ENFORCE_BLOCK", "DISPUTED_NO_BLOCK"]);
const ENFORCEABLE_CAUSES = Object.freeze([
  ["certificateStatus", "INVALID", "CERTIFICATE_INVALID"],
  ["certificateStatus", "MISSING", "CERTIFICATE_MISSING"],
  ["checkpointStatus", "UNSAFE", "CHECKPOINT_UNSAFE"],
  ["checkpointStatus", "DRIFTED", "CHECKPOINT_DRIFTED"],
  ["resumeEligibility", "INELIGIBLE", "RESUME_INELIGIBLE"],
  ["failureClass", "GOVERNANCE_FAILURE", "GOVERNANCE_FAILURE"],
  ["failureClass", "ENV_FAILURE", "ENV_FAILURE"],
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
  return env.DEPLOY_ENFORCEMENT_EVALUATED_AT || new Date().toISOString();
}

function normalizeMode(value) {
  const raw = String(value || "warn_only").trim().toUpperCase().replace(/-/g, "_");
  return ENFORCEMENT_MODES.has(raw) ? { mode: raw, reasons: [] } : {
    mode: "WARN_ONLY",
    reasons: [`ENFORCEMENT_MODE_UNKNOWN:${String(value || "") || "missing"}`],
  };
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function normalizeString(value, fallback = "") {
  return value === undefined || value === null ? fallback : String(value).trim().toUpperCase();
}

function loadDecisionArtifact(evidenceDir = DEFAULT_EVIDENCE_DIR) {
  const filePath = path.join(evidenceDir, "deployment-decision.json");
  if (!fs.existsSync(filePath)) {
    return {
      ok: false,
      decision: null,
      reasons: ["DECISION_ARTIFACT_MISSING"],
    };
  }
  try {
    const decision = readJson(filePath);
    if (!decision || typeof decision !== "object" || Array.isArray(decision)) {
      return { ok: false, decision: null, reasons: ["DECISION_ARTIFACT_MALFORMED"] };
    }
    return { ok: true, decision, reasons: [] };
  } catch {
    return {
      ok: false,
      decision: null,
      reasons: ["DECISION_ARTIFACT_MALFORMED"],
    };
  }
}

function findDeterministicCauses(decision) {
  const causes = [];
  for (const [field, expected, cause] of ENFORCEABLE_CAUSES) {
    if (normalizeString(decision?.[field]) === expected) {
      causes.push(cause);
    }
  }
  if (normalizeString(decision?.decision) === "BLOCK_RECOMMENDED") causes.push("DECISION_BLOCK_RECOMMENDED");
  if (normalizeString(decision?.risk) === "CRITICAL") causes.push("RISK_CRITICAL");
  return [...new Set(causes)];
}

function buildResult(input) {
  const enforcementMode = ENFORCEMENT_MODES.has(input.enforcementMode) ? input.enforcementMode : "WARN_ONLY";
  const enforcementDecision = ENFORCEMENT_DECISIONS.has(input.enforcementDecision) ? input.enforcementDecision : "DISPUTED_NO_BLOCK";
  const result = {
    workflowId: input.workflowId || "unknown_workflow",
    deploymentId: input.deploymentId || "unknown_deployment",
    commitSha: input.commitSha || "",
    enforcementMode,
    enforcementDecision,
    sourceDecision: input.sourceDecision || "DISPUTED",
    sourceRisk: input.sourceRisk || "UNKNOWN",
    deterministicCauses: [...new Set(input.deterministicCauses || [])],
    blocked: Boolean(input.blocked),
    reasons: [...new Set(input.reasons || [])],
    evaluatedAt: input.evaluatedAt,
    policyVersion: POLICY_VERSION,
  };
  return {
    ...result,
    enforcementHash: hashEnforcementResult(result),
  };
}

function hashEnforcementResult(result) {
  return sha256({
    workflowId: result.workflowId,
    deploymentId: result.deploymentId,
    commitSha: result.commitSha,
    enforcementMode: result.enforcementMode,
    enforcementDecision: result.enforcementDecision,
    sourceDecision: result.sourceDecision,
    sourceRisk: result.sourceRisk,
    deterministicCauses: result.deterministicCauses,
    blocked: result.blocked,
    reasons: result.reasons,
    evaluatedAt: result.evaluatedAt,
    policyVersion: result.policyVersion,
  });
}

function evaluateScopedEnforcement(options = {}) {
  const env = options.env || process.env;
  const evaluatedAt = options.evaluatedAt || now(env);
  const modeResult = normalizeMode(options.mode || env.DH_ENFORCEMENT_MODE);
  const loaded = loadDecisionArtifact(options.evidenceDir || DEFAULT_EVIDENCE_DIR);

  if (!loaded.ok) {
    return buildResult({
      workflowId: env.GITHUB_WORKFLOW || "unknown_workflow",
      deploymentId: env.DEPLOYMENT_ID || env.GITHUB_RUN_ID || "unknown_deployment",
      commitSha: env.DEPLOY_COMMIT_SHA || env.GITHUB_SHA || "",
      enforcementMode: modeResult.mode,
      enforcementDecision: "DISPUTED_NO_BLOCK",
      sourceDecision: "DISPUTED",
      sourceRisk: "UNKNOWN",
      deterministicCauses: [],
      blocked: false,
      reasons: [...modeResult.reasons, ...loaded.reasons],
      evaluatedAt,
    });
  }

  const decision = loaded.decision;
  const sourceDecision = normalizeString(decision.decision, "DISPUTED");
  const sourceRisk = normalizeString(decision.risk, "UNKNOWN");
  const deterministicCauses = findDeterministicCauses(decision);
  const criticalCauses = deterministicCauses.filter((cause) => cause !== "DECISION_BLOCK_RECOMMENDED" && cause !== "RISK_CRITICAL");
  const canBlock =
    modeResult.mode === "ENFORCE_SCOPED"
    && sourceDecision === "BLOCK_RECOMMENDED"
    && sourceRisk === "CRITICAL"
    && criticalCauses.length > 0;

  let enforcementDecision = "ALLOW_CONTINUE";
  const reasons = [...modeResult.reasons];
  if (canBlock) {
    enforcementDecision = "ENFORCE_BLOCK";
    reasons.push("SCOPED_ENFORCEMENT_BLOCK");
  } else if (sourceDecision === "BLOCK_RECOMMENDED" && sourceRisk === "CRITICAL" && criticalCauses.length > 0) {
    enforcementDecision = "WARN_CONTINUE";
    reasons.push("SCOPED_ENFORCEMENT_WARN_ONLY");
  } else if (["DISPUTED", "ESCALATE", "PAUSE_RECOMMENDED"].includes(sourceDecision) || sourceRisk === "UNKNOWN") {
    enforcementDecision = "DISPUTED_NO_BLOCK";
    reasons.push("SCOPED_ENFORCEMENT_DISPUTED_NO_BLOCK");
  } else if (sourceRisk === "HIGH") {
    enforcementDecision = "WARN_CONTINUE";
    reasons.push("HIGH_RISK_NON_BLOCKING");
  } else if (sourceDecision === "BLOCK_RECOMMENDED" || sourceRisk === "CRITICAL") {
    enforcementDecision = "WARN_CONTINUE";
    reasons.push("STRICT_DETERMINISTIC_CAUSE_REQUIRED");
  } else {
    reasons.push("SCOPED_ENFORCEMENT_ALLOW_CONTINUE");
  }

  return buildResult({
    workflowId: decision.workflowId || env.GITHUB_WORKFLOW || "unknown_workflow",
    deploymentId: decision.deploymentId || env.DEPLOYMENT_ID || env.GITHUB_RUN_ID || "unknown_deployment",
    commitSha: decision.commitSha || env.DEPLOY_COMMIT_SHA || env.GITHUB_SHA || "",
    enforcementMode: modeResult.mode,
    enforcementDecision,
    sourceDecision,
    sourceRisk,
    deterministicCauses,
    blocked: enforcementDecision === "ENFORCE_BLOCK",
    reasons,
    evaluatedAt,
  });
}

function buildEnforcementSummary(result) {
  const summary = {
    summaryVersion: "1.0",
    workflowId: result.workflowId,
    deploymentId: result.deploymentId,
    commitSha: result.commitSha,
    enforcementMode: result.enforcementMode,
    enforcementDecision: result.enforcementDecision,
    blocked: result.blocked,
    sourceDecision: result.sourceDecision,
    sourceRisk: result.sourceRisk,
    deterministicCauses: result.deterministicCauses,
    reasons: result.reasons,
    evaluatedAt: result.evaluatedAt,
    policyVersion: result.policyVersion,
    deployment_status: result.blocked ? "blocked_by_scoped_enforcement" : "unchanged",
  };
  return {
    ...summary,
    enforcementSummaryHash: sha256(summary),
  };
}

function writeGithubOutput(result, env = process.env) {
  if (!env.GITHUB_OUTPUT) return;
  const lines = [
    `enforcement_mode=${result.enforcementMode}`,
    `enforcement_decision=${result.enforcementDecision}`,
    `enforcement_policy_version=${result.policyVersion}`,
    `enforcement_reasons=${result.reasons.join(",")}`,
    `deterministic_causes=${result.deterministicCauses.join(",")}`,
    `blocked=${result.blocked ? "true" : "false"}`,
    `telemetry_state=${result.blocked ? "BLOCKED" : result.enforcementDecision === "DISPUTED_NO_BLOCK" ? "DISPUTED" : "PROGRESSING"}`,
  ];
  fs.appendFileSync(env.GITHUB_OUTPUT, `${lines.join("\n")}\n`);
}

function safeEvaluateScopedEnforcement(options = {}) {
  const env = options.env || process.env;
  const outputDir = options.outputDir || env.DEPLOY_TELEMETRY_DIR || DEFAULT_OUTPUT_DIR;
  let result;
  let summary;
  try {
    result = evaluateScopedEnforcement(options);
    summary = buildEnforcementSummary(result);
    fs.mkdirSync(outputDir, { recursive: true });
    fs.writeFileSync(path.join(outputDir, ENFORCEMENT_JSON), `${JSON.stringify(result, null, 2)}\n`);
    fs.writeFileSync(path.join(outputDir, ENFORCEMENT_SUMMARY_JSON), `${JSON.stringify(summary, null, 2)}\n`);
    writeGithubOutput(result, env);
  } catch (error) {
    result = buildResult({
      workflowId: env.GITHUB_WORKFLOW || "unknown_workflow",
      deploymentId: env.DEPLOYMENT_ID || env.GITHUB_RUN_ID || "unknown_deployment",
      commitSha: env.DEPLOY_COMMIT_SHA || env.GITHUB_SHA || "",
      enforcementMode: normalizeMode(options.mode || env.DH_ENFORCEMENT_MODE).mode,
      enforcementDecision: "DISPUTED_NO_BLOCK",
      sourceDecision: "DISPUTED",
      sourceRisk: "UNKNOWN",
      deterministicCauses: [],
      blocked: false,
      reasons: [`SCOPED_ENFORCEMENT_ERROR:${error instanceof Error ? error.message : String(error)}`],
      evaluatedAt: now(env),
    });
    summary = buildEnforcementSummary(result);
    try {
      fs.mkdirSync(outputDir, { recursive: true });
      fs.writeFileSync(path.join(outputDir, ENFORCEMENT_JSON), `${JSON.stringify(result, null, 2)}\n`);
      fs.writeFileSync(path.join(outputDir, ENFORCEMENT_SUMMARY_JSON), `${JSON.stringify(summary, null, 2)}\n`);
      writeGithubOutput(result, env);
    } catch {
      // Evidence emission failure must not create hidden recovery behavior.
    }
  }
  return { ...result, summary };
}

function runCli() {
  const [, , command, ...rest] = process.argv;
  if (command !== "evaluate") {
    console.error("Usage: node scripts/deploy-enforcement-gate.cjs evaluate --evidence-dir <path> --mode warn_only");
    process.exitCode = 0;
    return;
  }
  const args = parseArgs(rest);
  const result = safeEvaluateScopedEnforcement({
    evidenceDir: args["evidence-dir"],
    outputDir: args["output-dir"],
    evaluatedAt: args.evaluatedAt,
    mode: args.mode,
  });
  console.log(JSON.stringify(result));
  process.exitCode = result.blocked ? 1 : 0;
}

if (require.main === module) {
  runCli();
}

module.exports = {
  DEFAULT_EVIDENCE_DIR,
  DEFAULT_OUTPUT_DIR,
  ENFORCEMENT_JSON,
  ENFORCEMENT_SUMMARY_JSON,
  POLICY_VERSION,
  buildEnforcementSummary,
  evaluateScopedEnforcement,
  findDeterministicCauses,
  hashEnforcementResult,
  normalizeMode,
  safeEvaluateScopedEnforcement,
};
