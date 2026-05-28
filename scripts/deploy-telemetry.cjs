#!/usr/bin/env node

const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

const DEFAULT_TELEMETRY_DIR = path.join("artifacts", "deployment-telemetry");
const TELEMETRY_JSONL = "deployment-telemetry.jsonl";
const SUMMARY_JSON = "deployment-summary.json";
const EVIDENCE_JSON = "deployment-evidence.json";

const ALLOWED_STATES = new Set([
  "RUNNING",
  "PROGRESSING",
  "WAITING",
  "STALLED",
  "BLOCKED",
  "DISPUTED",
  "PASSED",
  "FAILED",
]);

const ALLOWED_CERTIFICATE_STATUSES = new Set([
  "UNVERIFIED",
  "MISSING",
  "FOUND",
  "VALID",
  "INVALID",
  "DISPUTED",
]);

const ALLOWED_CHECKPOINT_STATUSES = new Set([
  "UNVERIFIED",
  "NO_CHECKPOINT",
  "FOUND",
  "SAFE",
  "UNSAFE",
  "DRIFTED",
  "DISPUTED",
]);

const ALLOWED_RESUME_ELIGIBILITIES = new Set([
  "UNVERIFIED",
  "ELIGIBLE",
  "INELIGIBLE",
  "DISPUTED",
  "NOT_APPLICABLE",
]);

const ALLOWED_DEPLOYMENT_DECISIONS = new Set([
  "ALLOW",
  "OBSERVE",
  "PAUSE_RECOMMENDED",
  "ESCALATE",
  "BLOCK_RECOMMENDED",
  "DISPUTED",
]);

const ALLOWED_DEPLOYMENT_RISKS = new Set([
  "LOW",
  "MEDIUM",
  "HIGH",
  "CRITICAL",
  "UNKNOWN",
]);

const ALLOWED_ENFORCEMENT_MODES = new Set([
  "READ_ONLY",
  "WARN_ONLY",
  "ENFORCE_SCOPED",
]);

const ALLOWED_ENFORCEMENT_DECISIONS = new Set([
  "ALLOW_CONTINUE",
  "WARN_CONTINUE",
  "ENFORCE_BLOCK",
  "DISPUTED_NO_BLOCK",
]);

const REQUIRED_TELEMETRY_FIELDS = Object.freeze([
  "workflowId",
  "deploymentId",
  "currentStep",
  "currentPartition",
  "lastCompletedPartition",
  "elapsedTime",
  "heartbeatAt",
  "failureClass",
  "certificateStatus",
  "checkpointStatus",
  "resumeEligibility",
  "environmentHash",
  "deploymentDecision",
  "deploymentRisk",
  "decisionPolicyVersion",
  "decisionReasons",
  "enforcementMode",
  "enforcementDecision",
  "enforcementPolicyVersion",
  "enforcementReasons",
  "blocked",
  "attemptCount",
  "state",
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

function getNow(env = process.env) {
  return env.DEPLOY_TELEMETRY_NOW || new Date().toISOString();
}

function minutesBetween(startedAt, observedAt) {
  if (!startedAt) return 0;
  return Math.max(0, Math.floor((Date.parse(observedAt) - Date.parse(startedAt)) / 60_000));
}

function normalizeState(state) {
  const normalized = String(state || "PROGRESSING").trim().toUpperCase();
  return ALLOWED_STATES.has(normalized) ? normalized : "DISPUTED";
}

function normalizeCertificateStatus(status) {
  const normalized = String(status || "UNVERIFIED").trim().toUpperCase();
  if (normalized === "UNKNOWN") return "UNVERIFIED";
  return ALLOWED_CERTIFICATE_STATUSES.has(normalized) ? normalized : "DISPUTED";
}

function normalizeCheckpointStatus(status) {
  const normalized = String(status || "UNVERIFIED").trim().toUpperCase();
  if (normalized === "UNKNOWN") return "UNVERIFIED";
  return ALLOWED_CHECKPOINT_STATUSES.has(normalized) ? normalized : "DISPUTED";
}

function normalizeResumeEligibility(value) {
  const normalized = String(value || "UNVERIFIED").trim().toUpperCase();
  if (normalized === "UNKNOWN") return "UNVERIFIED";
  return ALLOWED_RESUME_ELIGIBILITIES.has(normalized) ? normalized : "DISPUTED";
}

function normalizeDeploymentDecision(value) {
  const normalized = String(value || "DISPUTED").trim().toUpperCase();
  return ALLOWED_DEPLOYMENT_DECISIONS.has(normalized) ? normalized : "DISPUTED";
}

function normalizeDeploymentRisk(value) {
  const normalized = String(value || "UNKNOWN").trim().toUpperCase();
  return ALLOWED_DEPLOYMENT_RISKS.has(normalized) ? normalized : "UNKNOWN";
}

function normalizeDecisionReasons(value) {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  return String(value || "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function normalizeEnforcementMode(value) {
  const normalized = String(value || "WARN_ONLY").trim().toUpperCase().replace(/-/g, "_");
  return ALLOWED_ENFORCEMENT_MODES.has(normalized) ? normalized : "WARN_ONLY";
}

function normalizeEnforcementDecision(value) {
  const normalized = String(value || "WARN_CONTINUE").trim().toUpperCase();
  return ALLOWED_ENFORCEMENT_DECISIONS.has(normalized) ? normalized : "DISPUTED_NO_BLOCK";
}

function normalizeBoolean(value) {
  if (typeof value === "boolean") return value;
  return String(value || "").trim().toLowerCase() === "true";
}

function classifyFailure(signal) {
  const raw = String(signal || "").toLowerCase();
  if (!raw.trim()) return undefined;
  if (raw.includes("network") || raw.includes("econnreset") || raw.includes("ssh") || raw.includes("scp") || raw.includes("npm ci")) {
    return "INFRA_FAILURE";
  }
  if (raw.includes("test:release") || raw.includes("vitest") || raw.includes("assert") || raw.includes("test failed")) {
    return "TEST_FAILURE";
  }
  if (raw.includes("governance")) return "GOVERNANCE_FAILURE";
  if (raw.includes("env") || raw.includes("secret") || raw.includes("config")) return "ENV_FAILURE";
  if (raw.includes("timeout") || raw.includes("timed out")) return "TIMEOUT_FAILURE";
  if (raw.includes("build") || raw.includes("compile")) return "CODE_FAILURE";
  return "UNKNOWN_FAILURE";
}

function buildTelemetryEvent(input, env = process.env) {
  const timestamp = input.timestamp || getNow(env);
  const startedAt = input.startedAt || env.DEPLOY_TELEMETRY_STARTED_AT || timestamp;
  const failureClass = input.failureClass || classifyFailure(input.failureSignal);

  return {
    event: input.event || "deploy_telemetry",
    timestamp,
    workflowId: input.workflowId || env.GITHUB_WORKFLOW || "unknown_workflow",
    deploymentId: input.deploymentId || env.DEPLOYMENT_ID || env.GITHUB_RUN_ID || "unknown_deployment",
    runId: input.runId || env.GITHUB_RUN_ID || "",
    commitSha: input.commitSha || env.DEPLOY_COMMIT_SHA || env.GITHUB_SHA || "",
    currentStep: input.step || input.currentStep || "unknown_step",
    currentPartition: input.partition || input.currentPartition || input.event || "unknown_partition",
    lastCompletedPartition: input.lastCompletedPartition || env.DEPLOY_LAST_COMPLETED_PARTITION || "none",
    elapsedTime: minutesBetween(startedAt, timestamp),
    heartbeatAt: timestamp,
    failureClass,
    certificateStatus: normalizeCertificateStatus(input.certificateStatus || env.DEPLOY_CERTIFICATE_STATUS),
    checkpointStatus: normalizeCheckpointStatus(input.checkpointStatus || env.DEPLOY_CHECKPOINT_STATUS),
    resumeEligibility: normalizeResumeEligibility(input.resumeEligibility || env.DEPLOY_RESUME_ELIGIBILITY),
    checkpointHash: input.checkpointHash || env.DEPLOY_CHECKPOINT_HASH || undefined,
    environmentHash: input.environmentHash || env.DEPLOY_ENVIRONMENT_HASH || "",
    deploymentDecision: normalizeDeploymentDecision(input.deploymentDecision || env.DEPLOYMENT_DECISION),
    deploymentRisk: normalizeDeploymentRisk(input.deploymentRisk || env.DEPLOYMENT_RISK),
    decisionPolicyVersion: input.decisionPolicyVersion || env.DEPLOYMENT_DECISION_POLICY_VERSION || "",
    decisionReasons: normalizeDecisionReasons(input.decisionReasons || env.DEPLOYMENT_DECISION_REASONS),
    enforcementMode: normalizeEnforcementMode(input.enforcementMode || env.DH_ENFORCEMENT_MODE || env.DEPLOYMENT_ENFORCEMENT_MODE),
    enforcementDecision: normalizeEnforcementDecision(input.enforcementDecision || env.DEPLOYMENT_ENFORCEMENT_DECISION),
    enforcementPolicyVersion: input.enforcementPolicyVersion || env.DEPLOYMENT_ENFORCEMENT_POLICY_VERSION || "",
    enforcementReasons: normalizeDecisionReasons(input.enforcementReasons || env.DEPLOYMENT_ENFORCEMENT_REASONS),
    deterministicCauses: normalizeDecisionReasons(input.deterministicCauses || env.DEPLOYMENT_DETERMINISTIC_CAUSES),
    blocked: normalizeBoolean(input.blocked || env.DEPLOYMENT_BLOCKED),
    attemptCount: Number(input.attemptCount || env.GITHUB_RUN_ATTEMPT || 1),
    state: normalizeState(input.state),
    artifact: input.artifact,
    telemetry_status: "emitted",
  };
}

function telemetryPath(dir, fileName) {
  return path.join(dir || DEFAULT_TELEMETRY_DIR, fileName);
}

function readTelemetryEvents(dir) {
  const filePath = telemetryPath(dir, TELEMETRY_JSONL);
  if (!fs.existsSync(filePath)) return [];
  return fs.readFileSync(filePath, "utf8")
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

function appendTelemetryEvent(event, options = {}) {
  const dir = options.dir || DEFAULT_TELEMETRY_DIR;
  fs.mkdirSync(dir, { recursive: true });
  fs.appendFileSync(telemetryPath(dir, TELEMETRY_JSONL), `${JSON.stringify(event)}\n`);
  return event;
}

function hashDeploymentTelemetryEvidence(evidence) {
  const preimage = {
    evidenceVersion: evidence.evidenceVersion || "1.0",
    workflowId: evidence.workflowId,
    deploymentId: evidence.deploymentId,
    runId: evidence.runId,
    commitSha: evidence.commitSha,
    generatedAt: evidence.generatedAt,
    eventCount: evidence.eventCount,
    latestState: evidence.latestState,
    latestFailureClass: evidence.latestFailureClass,
    latestCheckpointStatus: evidence.latestCheckpointStatus,
    latestResumeEligibility: evidence.latestResumeEligibility,
    latestDeploymentDecision: evidence.latestDeploymentDecision,
    latestDeploymentRisk: evidence.latestDeploymentRisk,
    latestEnforcementMode: evidence.latestEnforcementMode,
    latestEnforcementDecision: evidence.latestEnforcementDecision,
    latestBlocked: evidence.latestBlocked,
    telemetryEvents: evidence.telemetryEvents || [],
    artifactReferences: evidence.artifactReferences || [],
  };
  return sha256(preimage);
}

function buildEvidence(events, generatedAt) {
  const latest = events.at(-1) || {};
  const artifactReferences = events
    .map((event) => event.artifact)
    .filter(Boolean);
  const evidence = {
    evidenceVersion: "1.0",
    workflowId: latest.workflowId || "unknown_workflow",
    deploymentId: latest.deploymentId || "unknown_deployment",
    runId: latest.runId || "",
    commitSha: latest.commitSha || "",
    generatedAt,
    eventCount: events.length,
    latestState: latest.state || "DISPUTED",
    latestFailureClass: latest.failureClass,
    latestCheckpointStatus: latest.checkpointStatus || "UNVERIFIED",
    latestResumeEligibility: latest.resumeEligibility || "UNVERIFIED",
    latestDeploymentDecision: latest.deploymentDecision || "DISPUTED",
    latestDeploymentRisk: latest.deploymentRisk || "UNKNOWN",
    latestEnforcementMode: latest.enforcementMode || "WARN_ONLY",
    latestEnforcementDecision: latest.enforcementDecision || "WARN_CONTINUE",
    latestBlocked: Boolean(latest.blocked),
    telemetryEvents: events,
    artifactReferences,
  };
  return {
    ...evidence,
    evidenceHash: hashDeploymentTelemetryEvidence(evidence),
  };
}

function writeSummaryAndEvidence(options = {}) {
  const dir = options.dir || DEFAULT_TELEMETRY_DIR;
  const generatedAt = options.generatedAt || getNow(options.env || process.env);
  const events = readTelemetryEvents(dir);
  const latest = events.at(-1) || {};
  const summary = {
    telemetry_status: "emitted",
    deployment_status: "unchanged",
    generatedAt,
    eventCount: events.length,
    latestEvent: latest.event || null,
    latestState: latest.state || "DISPUTED",
    latestFailureClass: latest.failureClass,
    latestCheckpointStatus: latest.checkpointStatus || "UNVERIFIED",
    latestResumeEligibility: latest.resumeEligibility || "UNVERIFIED",
    latestDeploymentDecision: latest.deploymentDecision || "DISPUTED",
    latestDeploymentRisk: latest.deploymentRisk || "UNKNOWN",
    latestEnforcementMode: latest.enforcementMode || "WARN_ONLY",
    latestEnforcementDecision: latest.enforcementDecision || "WARN_CONTINUE",
    latestBlocked: Boolean(latest.blocked),
  };
  const evidence = buildEvidence(events, generatedAt);

  fs.writeFileSync(telemetryPath(dir, SUMMARY_JSON), `${JSON.stringify(summary, null, 2)}\n`);
  fs.writeFileSync(telemetryPath(dir, EVIDENCE_JSON), `${JSON.stringify(evidence, null, 2)}\n`);

  return { summary, evidence };
}

function safeEmitTelemetry(input, options = {}) {
  try {
    const existingEvents = readTelemetryEvents(options.dir || DEFAULT_TELEMETRY_DIR);
    const startedAt = input.startedAt || existingEvents[0]?.timestamp;
    const event = buildTelemetryEvent({ ...input, startedAt }, options.env || process.env);
    appendTelemetryEvent(event, { dir: options.dir });
    const { summary, evidence } = writeSummaryAndEvidence({
      dir: options.dir,
      env: options.env,
      generatedAt: event.timestamp,
    });
    return {
      ...summary,
      event,
      evidence,
    };
  } catch (error) {
    return {
      telemetry_status: "failed_to_emit",
      deployment_status: "unchanged",
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

function runCli() {
  const [, , command, ...rest] = process.argv;
  if (command !== "emit") {
    console.error("Usage: node scripts/deploy-telemetry.cjs emit --event <event> --step <step>");
    process.exitCode = 0;
    return;
  }

  const args = parseArgs(rest);
  const result = safeEmitTelemetry({
    event: args.event,
    step: args.step,
    partition: args.partition,
    lastCompletedPartition: args.lastCompletedPartition,
    state: args.state,
    failureSignal: args.failureSignal,
    failureClass: args.failureClass,
    certificateStatus: args.certificateStatus,
    checkpointStatus: args.checkpointStatus,
    resumeEligibility: args.resumeEligibility,
    checkpointHash: args.checkpointHash,
    environmentHash: args.environmentHash,
    deploymentDecision: args.deploymentDecision,
    deploymentRisk: args.deploymentRisk,
    decisionPolicyVersion: args.decisionPolicyVersion,
    decisionReasons: args.decisionReasons,
    enforcementMode: args.enforcementMode,
    enforcementDecision: args.enforcementDecision,
    enforcementPolicyVersion: args.enforcementPolicyVersion,
    enforcementReasons: args.enforcementReasons,
    deterministicCauses: args.deterministicCauses,
    blocked: args.blocked,
    artifact: args.artifact,
    startedAt: args.startedAt,
    timestamp: args.timestamp,
  }, {
    dir: process.env.DEPLOY_TELEMETRY_DIR || DEFAULT_TELEMETRY_DIR,
  });

  console.log(JSON.stringify(result));
  process.exitCode = 0;
}

if (require.main === module) {
  runCli();
}

module.exports = {
  DEFAULT_TELEMETRY_DIR,
  EVIDENCE_JSON,
  REQUIRED_TELEMETRY_FIELDS,
  SUMMARY_JSON,
  TELEMETRY_JSONL,
  appendTelemetryEvent,
  buildEvidence,
  buildTelemetryEvent,
  classifyFailure,
  hashDeploymentTelemetryEvidence,
  normalizeCertificateStatus,
  normalizeCheckpointStatus,
  normalizeDeploymentDecision,
  normalizeDeploymentRisk,
  normalizeEnforcementDecision,
  normalizeEnforcementMode,
  normalizeResumeEligibility,
  normalizeState,
  readTelemetryEvents,
  safeEmitTelemetry,
  writeSummaryAndEvidence,
};
