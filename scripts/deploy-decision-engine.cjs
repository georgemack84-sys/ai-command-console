#!/usr/bin/env node

const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

const DEFAULT_EVIDENCE_DIR = path.join("artifacts", "deployment-telemetry");
const DEFAULT_OUTPUT_DIR = DEFAULT_EVIDENCE_DIR;
const DECISION_JSON = "deployment-decision.json";
const DECISION_SUMMARY_JSON = "deployment-decision-summary.json";
const POLICY_VERSION = "dh-deployment-decision/v1";

const REQUIRED_ARTIFACTS = Object.freeze([
  "deployment-telemetry.jsonl",
  "deployment-summary.json",
  "deployment-evidence.json",
  "certificate-verification.json",
  "checkpoint-validation.json",
  "resume-analysis.json",
]);

const DECISIONS = new Set(["ALLOW", "OBSERVE", "PAUSE_RECOMMENDED", "ESCALATE", "BLOCK_RECOMMENDED", "DISPUTED"]);
const RISKS = new Set(["LOW", "MEDIUM", "HIGH", "CRITICAL", "UNKNOWN"]);
const STATES = new Set(["RUNNING", "PROGRESSING", "WAITING", "STALLED", "BLOCKED", "DISPUTED", "PASSED", "FAILED"]);
const CERTIFICATE_STATUSES = new Set(["UNVERIFIED", "MISSING", "FOUND", "VALID", "INVALID", "DISPUTED"]);
const CHECKPOINT_STATUSES = new Set(["UNVERIFIED", "NO_CHECKPOINT", "FOUND", "SAFE", "UNSAFE", "DRIFTED", "DISPUTED"]);
const RESUME_ELIGIBILITIES = new Set(["UNVERIFIED", "ELIGIBLE", "INELIGIBLE", "DISPUTED", "NOT_APPLICABLE"]);
const FAILURE_CLASSES = new Set([
  "INFRA_FAILURE",
  "CODE_FAILURE",
  "TEST_FAILURE",
  "GOVERNANCE_FAILURE",
  "ENV_FAILURE",
  "TIMEOUT_FAILURE",
  "UNKNOWN_FAILURE",
]);

const DECISION_STRICTNESS = Object.freeze({
  ALLOW: 0,
  OBSERVE: 1,
  PAUSE_RECOMMENDED: 2,
  ESCALATE: 3,
  BLOCK_RECOMMENDED: 4,
  DISPUTED: 5,
});

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
  return env.DEPLOY_DECISION_EVALUATED_AT || new Date().toISOString();
}

function normalizeSet(value, allowed, fallback = "DISPUTED") {
  const normalized = String(value || "").trim().toUpperCase();
  return allowed.has(normalized) ? normalized : fallback;
}

function normalizeFailureClass(value) {
  if (value == null || value === "") return null;
  const normalized = String(value).trim().toUpperCase();
  return FAILURE_CLASSES.has(normalized) ? normalized : "UNKNOWN_FAILURE";
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function readJsonl(filePath) {
  return fs.readFileSync(filePath, "utf8")
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

function pickLatestTelemetry(events) {
  return events.at(-1) || null;
}

function valuesFor(field, records) {
  return records
    .map((record) => record?.[field])
    .filter((value) => value !== undefined && value !== null && String(value).trim() !== "")
    .map(String);
}

function unique(values) {
  return [...new Set(values)];
}

function detectConflict(field, records) {
  return unique(valuesFor(field, records)).length > 1;
}

function heartbeatAgeMinutes(heartbeatAt, evaluatedAt) {
  const heartbeatMs = Date.parse(String(heartbeatAt || ""));
  const evaluatedMs = Date.parse(String(evaluatedAt || ""));
  if (!Number.isFinite(heartbeatMs) || !Number.isFinite(evaluatedMs)) return null;
  return Math.floor((evaluatedMs - heartbeatMs) / 60_000);
}

function chooseStrictest(candidates) {
  return candidates.reduce((strictest, candidate) => {
    return DECISION_STRICTNESS[candidate.decision] > DECISION_STRICTNESS[strictest.decision] ? candidate : strictest;
  }, { decision: "ALLOW", risk: "LOW", reasons: [] });
}

function hashDeploymentDecision(result) {
  return sha256({
    workflowId: result.workflowId,
    deploymentId: result.deploymentId,
    commitSha: result.commitSha,
    decision: result.decision,
    risk: result.risk,
    certificateStatus: result.certificateStatus,
    checkpointStatus: result.checkpointStatus,
    resumeEligibility: result.resumeEligibility,
    failureClass: result.failureClass,
    reasons: result.reasons,
    policyVersion: result.policyVersion,
    evaluatedAt: result.evaluatedAt,
    enforcementMode: result.enforcementMode,
  });
}

function buildResult(input) {
  const decision = normalizeSet(input.decision, DECISIONS, "DISPUTED");
  const risk = RISKS.has(input.risk) ? input.risk : "UNKNOWN";
  const result = {
    workflowId: input.workflowId || "unknown_workflow",
    deploymentId: input.deploymentId || "unknown_deployment",
    commitSha: input.commitSha || "",
    decision,
    risk: decision === "DISPUTED" ? "UNKNOWN" : risk,
    certificateStatus: normalizeSet(input.certificateStatus || "UNVERIFIED", CERTIFICATE_STATUSES),
    checkpointStatus: normalizeSet(input.checkpointStatus || "UNVERIFIED", CHECKPOINT_STATUSES),
    resumeEligibility: normalizeSet(input.resumeEligibility || "UNVERIFIED", RESUME_ELIGIBILITIES),
    failureClass: normalizeFailureClass(input.failureClass),
    reasons: [...new Set(input.reasons || [])],
    policyVersion: POLICY_VERSION,
    evaluatedAt: input.evaluatedAt,
    enforcementMode: "READ_ONLY",
  };
  return {
    ...result,
    decisionHash: hashDeploymentDecision(result),
  };
}

function buildDisputedResult(context, reasons) {
  return buildResult({
    workflowId: context.workflowId,
    deploymentId: context.deploymentId,
    commitSha: context.commitSha,
    decision: "DISPUTED",
    risk: "UNKNOWN",
    certificateStatus: context.certificateStatus || "DISPUTED",
    checkpointStatus: context.checkpointStatus || "DISPUTED",
    resumeEligibility: context.resumeEligibility || "DISPUTED",
    failureClass: context.failureClass || "UNKNOWN_FAILURE",
    reasons,
    evaluatedAt: context.evaluatedAt,
  });
}

function loadEvidence(evidenceDir = DEFAULT_EVIDENCE_DIR) {
  const reasons = [];
  const artifacts = {};

  for (const artifact of REQUIRED_ARTIFACTS) {
    const filePath = path.join(evidenceDir, artifact);
    if (!fs.existsSync(filePath)) {
      reasons.push(`EVIDENCE_MISSING:${artifact}`);
      continue;
    }
    try {
      artifacts[artifact] = artifact.endsWith(".jsonl") ? readJsonl(filePath) : readJson(filePath);
    } catch {
      reasons.push(`EVIDENCE_UNPARSEABLE:${artifact}`);
    }
  }

  return { artifacts, reasons };
}

function normalizeEvidenceContext(artifacts, evaluatedAt) {
  const telemetryEvents = artifacts["deployment-telemetry.jsonl"] || [];
  const latestTelemetry = pickLatestTelemetry(telemetryEvents);
  const deploymentEvidence = artifacts["deployment-evidence.json"] || {};
  const certificate = artifacts["certificate-verification.json"] || {};
  const checkpoint = artifacts["checkpoint-validation.json"] || {};
  const resume = artifacts["resume-analysis.json"] || {};
  const records = [latestTelemetry, deploymentEvidence, certificate, checkpoint, resume].filter(Boolean);
  const reasons = [];

  if (!latestTelemetry) reasons.push("EVIDENCE_MISSING:latest_telemetry");

  for (const field of ["workflowId", "deploymentId", "commitSha"]) {
    if (detectConflict(field, records)) reasons.push(`EVIDENCE_CONFLICT:${field}`);
  }

  const statusRecords = [latestTelemetry, certificate].filter(Boolean);
  if (detectConflict("certificateStatus", statusRecords)) reasons.push("EVIDENCE_CONFLICT:certificateStatus");
  const checkpointStatusRecords = [latestTelemetry, checkpoint, resume].filter(Boolean);
  if (detectConflict("checkpointStatus", checkpointStatusRecords)) reasons.push("EVIDENCE_CONFLICT:checkpointStatus");
  if (detectConflict("resumeEligibility", checkpointStatusRecords)) reasons.push("EVIDENCE_CONFLICT:resumeEligibility");

  const workflowId = valuesFor("workflowId", records)[0] || "unknown_workflow";
  const deploymentId = valuesFor("deploymentId", records)[0] || "unknown_deployment";
  const commitSha = valuesFor("commitSha", records)[0] || "";
  const certificateStatus = normalizeSet(certificate.certificateStatus || latestTelemetry?.certificateStatus || "UNVERIFIED", CERTIFICATE_STATUSES);
  const checkpointStatus = normalizeSet(checkpoint.checkpointStatus || latestTelemetry?.checkpointStatus || "UNVERIFIED", CHECKPOINT_STATUSES);
  const resumeEligibility = normalizeSet(resume.resumeEligibility || checkpoint.resumeEligibility || latestTelemetry?.resumeEligibility || "UNVERIFIED", RESUME_ELIGIBILITIES);
  const failureClass = normalizeFailureClass(
    certificate.failureClass || checkpoint.failureClass || latestTelemetry?.failureClass || null,
  );
  const state = normalizeSet(latestTelemetry?.state || deploymentEvidence.latestState || "DISPUTED", STATES);
  const heartbeatAt = latestTelemetry?.heartbeatAt;
  const currentStep = latestTelemetry?.currentStep || "";
  const environmentHash = checkpoint.environmentHash || resume.environmentHash || latestTelemetry?.environmentHash;
  const checkpointHash = checkpoint.checkpointHash || resume.checkpointHash || latestTelemetry?.checkpointHash;

  if (!workflowId || workflowId === "unknown_workflow") reasons.push("EVIDENCE_REQUIRED_FIELD_MISSING:workflowId");
  if (!deploymentId || deploymentId === "unknown_deployment") reasons.push("EVIDENCE_REQUIRED_FIELD_MISSING:deploymentId");
  if (!commitSha) reasons.push("EVIDENCE_REQUIRED_FIELD_MISSING:commitSha");
  if (!heartbeatAt) reasons.push("HEARTBEAT_MISSING");
  if (heartbeatAt && heartbeatAgeMinutes(heartbeatAt, evaluatedAt) === null) reasons.push("HEARTBEAT_UNPARSEABLE");
  if (state === "DISPUTED" && String(latestTelemetry?.state || "").trim().toUpperCase() !== "DISPUTED") reasons.push("UNKNOWN_STATE");
  if (!environmentHash) reasons.push("EVIDENCE_REQUIRED_FIELD_MISSING:environmentHash");
  if (!checkpointHash && checkpointStatus !== "NO_CHECKPOINT") reasons.push("EVIDENCE_REQUIRED_FIELD_MISSING:checkpointHash");
  if (failureClass === "UNKNOWN_FAILURE") reasons.push("UNKNOWN_FAILURE_CLASS");

  return {
    workflowId,
    deploymentId,
    commitSha,
    certificateStatus,
    checkpointStatus,
    resumeEligibility,
    failureClass,
    state,
    heartbeatAt,
    currentStep,
    environmentHash,
    checkpointHash,
    evaluatedAt,
    reasons,
  };
}

function evaluatePolicy(context) {
  if (context.reasons.length > 0) {
    return buildDisputedResult(context, context.reasons);
  }

  const candidates = [];
  const heartbeatAge = heartbeatAgeMinutes(context.heartbeatAt, context.evaluatedAt);

  if (
    context.certificateStatus === "VALID"
    && (context.checkpointStatus === "SAFE" || context.checkpointStatus === "NO_CHECKPOINT")
    && (context.resumeEligibility === "ELIGIBLE" || context.resumeEligibility === "NOT_APPLICABLE")
    && context.failureClass === null
  ) {
    candidates.push({ decision: "ALLOW", risk: "LOW", reasons: ["POLICY_ALLOW"] });
  }

  if (
    context.certificateStatus === "UNVERIFIED"
    || context.checkpointStatus === "UNVERIFIED"
    || context.resumeEligibility === "UNVERIFIED"
  ) {
    candidates.push({ decision: "OBSERVE", risk: "MEDIUM", reasons: ["POLICY_OBSERVE_UNVERIFIED"] });
  }

  if (context.state === "STALLED" || context.failureClass === "TIMEOUT_FAILURE" || (heartbeatAge !== null && heartbeatAge > 10)) {
    candidates.push({
      decision: "PAUSE_RECOMMENDED",
      risk: "HIGH",
      reasons: [
        ...(context.state === "STALLED" ? ["STATE_STALLED"] : []),
        ...(context.failureClass === "TIMEOUT_FAILURE" ? ["TIMEOUT_FAILURE"] : []),
        ...(heartbeatAge !== null && heartbeatAge > 10 ? ["HEARTBEAT_STALE"] : []),
      ],
    });
  }

  if (
    context.certificateStatus === "DISPUTED"
    || context.checkpointStatus === "DISPUTED"
    || context.resumeEligibility === "DISPUTED"
  ) {
    candidates.push({ decision: "ESCALATE", risk: "HIGH", reasons: ["POLICY_ESCALATE_DISPUTED_EVIDENCE"] });
  }

  if (
    context.certificateStatus === "INVALID"
    || context.certificateStatus === "MISSING"
    || context.checkpointStatus === "UNSAFE"
    || context.checkpointStatus === "DRIFTED"
    || context.resumeEligibility === "INELIGIBLE"
    || context.failureClass === "GOVERNANCE_FAILURE"
    || context.failureClass === "ENV_FAILURE"
  ) {
    candidates.push({ decision: "BLOCK_RECOMMENDED", risk: "CRITICAL", reasons: ["POLICY_BLOCK_RECOMMENDED"] });
  }

  const selected = chooseStrictest(candidates.length > 0 ? candidates : [
    { decision: "DISPUTED", risk: "UNKNOWN", reasons: ["NO_POLICY_MATCH"] },
  ]);

  return buildResult({
    ...context,
    decision: selected.decision,
    risk: selected.risk,
    reasons: selected.reasons,
  });
}

function buildDecisionSummary(result) {
  const summary = {
    summaryVersion: "1.0",
    workflowId: result.workflowId,
    deploymentId: result.deploymentId,
    commitSha: result.commitSha,
    decision: result.decision,
    risk: result.risk,
    policyVersion: result.policyVersion,
    evaluatedAt: result.evaluatedAt,
    enforcementMode: "READ_ONLY",
    deployment_status: "unchanged",
    reasons: result.reasons,
  };
  return {
    ...summary,
    decisionSummaryHash: sha256(summary),
  };
}

function evaluateDeploymentDecision(options = {}) {
  const evaluatedAt = options.evaluatedAt || now(options.env || process.env);
  const { artifacts, reasons } = loadEvidence(options.evidenceDir || DEFAULT_EVIDENCE_DIR);
  const context = normalizeEvidenceContext(artifacts, evaluatedAt);
  if (reasons.length > 0) {
    return buildDisputedResult(context, [...reasons, ...context.reasons]);
  }
  return evaluatePolicy(context);
}

function writeGithubOutput(result, env = process.env) {
  if (!env.GITHUB_OUTPUT) return;
  const lines = [
    `deployment_decision=${result.decision}`,
    `deployment_risk=${result.risk}`,
    `decision_policy_version=${result.policyVersion}`,
    `decision_reasons=${result.reasons.join(",")}`,
    `failure_class=${result.failureClass || ""}`,
    `telemetry_state=${result.decision === "DISPUTED" ? "DISPUTED" : "PROGRESSING"}`,
  ];
  fs.appendFileSync(env.GITHUB_OUTPUT, `${lines.join("\n")}\n`);
}

function safeEvaluateDeploymentDecision(options = {}) {
  const env = options.env || process.env;
  const outputDir = options.outputDir || env.DEPLOY_TELEMETRY_DIR || DEFAULT_OUTPUT_DIR;
  try {
    const result = evaluateDeploymentDecision(options);
    const summary = buildDecisionSummary(result);
    fs.mkdirSync(outputDir, { recursive: true });
    fs.writeFileSync(path.join(outputDir, DECISION_JSON), `${JSON.stringify(result, null, 2)}\n`);
    fs.writeFileSync(path.join(outputDir, DECISION_SUMMARY_JSON), `${JSON.stringify(summary, null, 2)}\n`);
    writeGithubOutput(result, env);
    return {
      ...result,
      summary,
    };
  } catch (error) {
    const result = buildDisputedResult({
      workflowId: env.GITHUB_WORKFLOW || "unknown_workflow",
      deploymentId: env.DEPLOYMENT_ID || env.GITHUB_RUN_ID || "unknown_deployment",
      commitSha: env.DEPLOY_COMMIT_SHA || env.GITHUB_SHA || "",
      evaluatedAt: now(env),
    }, [`POLICY_EVALUATION_ERROR:${error instanceof Error ? error.message : String(error)}`]);
    const summary = buildDecisionSummary(result);
    try {
      fs.mkdirSync(outputDir, { recursive: true });
      fs.writeFileSync(path.join(outputDir, DECISION_JSON), `${JSON.stringify(result, null, 2)}\n`);
      fs.writeFileSync(path.join(outputDir, DECISION_SUMMARY_JSON), `${JSON.stringify(summary, null, 2)}\n`);
      writeGithubOutput(result, env);
    } catch {
      // Read-only decision evaluation must not alter deployment outcome if artifact emission fails.
    }
    return {
      ...result,
      summary,
    };
  }
}

function runCli() {
  const [, , command, ...rest] = process.argv;
  if (command !== "evaluate") {
    console.error("Usage: node scripts/deploy-decision-engine.cjs evaluate --evidence-dir <path>");
    process.exitCode = 0;
    return;
  }
  const args = parseArgs(rest);
  const result = safeEvaluateDeploymentDecision({
    evidenceDir: args["evidence-dir"],
    outputDir: args["output-dir"],
    evaluatedAt: args.evaluatedAt,
  });
  console.log(JSON.stringify(result));
  process.exitCode = 0;
}

if (require.main === module) {
  runCli();
}

module.exports = {
  DECISION_JSON,
  DECISION_SUMMARY_JSON,
  DEFAULT_EVIDENCE_DIR,
  DEFAULT_OUTPUT_DIR,
  POLICY_VERSION,
  buildDecisionSummary,
  evaluateDeploymentDecision,
  evaluatePolicy,
  hashDeploymentDecision,
  safeEvaluateDeploymentDecision,
};
