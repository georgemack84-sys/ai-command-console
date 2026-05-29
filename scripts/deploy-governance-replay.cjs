#!/usr/bin/env node

const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const auditCertification = require("./deploy-audit-certification.cjs");
const telemetry = require("./deploy-telemetry.cjs");

const DEFAULT_EVIDENCE_DIR = path.join("artifacts", "deployment-telemetry");
const DEFAULT_OUTPUT_DIR = DEFAULT_EVIDENCE_DIR;
const GOVERNANCE_REPLAY_JSON = "deployment-governance-replay.json";
const REPLAY_LINEAGE_JSON = "deployment-replay-lineage.json";
const DRIFT_REPORT_JSON = "deployment-drift-report.json";
const REPLAY_SUMMARY_JSON = "deployment-replay-summary.json";
const POLICY_VERSION = "dh-governance-replay/v1";

const REPLAY_SCOPES = Object.freeze(["TELEMETRY", "CERTIFICATE", "CHECKPOINT", "DECISION", "ENFORCEMENT", "OVERRIDE", "CERTIFICATION"]);
const CRITICAL_ARTIFACTS = Object.freeze([
  "deployment-telemetry.jsonl",
  "deployment-summary.json",
  "deployment-evidence.json",
  "certificate-verification.json",
  "deployment-decision.json",
  "deployment-enforcement.json",
  "deployment-audit-certification.json",
  "deployment-lineage.json",
  "deployment-certification-summary.json",
]);
const CONDITIONALLY_TOLERANT_ARTIFACTS = Object.freeze([
  "checkpoint-validation.json",
  "resume-analysis.json",
  "deployment-override-governance.json",
]);
const OPTIONAL_ARTIFACTS = Object.freeze([
  "deployment-decision-summary.json",
  "deployment-enforcement-summary.json",
  "deployment-override-request.json",
  "deployment-override-summary.json",
]);
const ALL_INPUT_ARTIFACTS = Object.freeze([
  ...CRITICAL_ARTIFACTS,
  ...CONDITIONALLY_TOLERANT_ARTIFACTS,
  ...OPTIONAL_ARTIFACTS,
]);
const ALLOWED_STATES = new Set(["RUNNING", "PROGRESSING", "WAITING", "STALLED", "BLOCKED", "DISPUTED", "PASSED", "FAILED"]);

function stableSerialize(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map((entry) => stableSerialize(entry)).join(",")}]`;
  return `{${Object.entries(value)
    .filter(([, nestedValue]) => nestedValue !== undefined)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, nestedValue]) => `${JSON.stringify(key)}:${stableSerialize(nestedValue)}`)
    .join(",")}}`;
}

function sha256(value) {
  return `sha256:${crypto.createHash("sha256").update(stableSerialize(value)).digest("hex")}`;
}

function sha256Text(value) {
  return `sha256:${crypto.createHash("sha256").update(String(value).replace(/\r\n/g, "\n")).digest("hex")}`;
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
  return env.DEPLOY_REPLAYED_AT || new Date().toISOString();
}

function isRecord(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function asString(value) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function parseJsonl(raw) {
  return raw.split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line));
}

function readArtifact(evidenceDir, name) {
  const filePath = path.join(evidenceDir, name);
  if (!fs.existsSync(filePath)) {
    return { name, filePath, present: false, parseable: false, hash: null, data: null };
  }
  const raw = fs.readFileSync(filePath, "utf8");
  try {
    return {
      name,
      filePath,
      present: true,
      parseable: true,
      hash: sha256Text(raw),
      data: name.endsWith(".jsonl") ? parseJsonl(raw) : JSON.parse(raw),
    };
  } catch {
    return { name, filePath, present: true, parseable: false, hash: sha256Text(raw), data: null };
  }
}

function latestTelemetry(artifact) {
  return Array.isArray(artifact?.data) ? artifact.data.filter(isRecord).at(-1) || {} : {};
}

function recordsFromArtifacts(artifacts) {
  return artifacts
    .map((artifact) => artifact.name === "deployment-telemetry.jsonl" ? latestTelemetry(artifact) : isRecord(artifact.data) ? artifact.data : null)
    .filter(isRecord);
}

function firstValue(field, records, env = process.env) {
  return records.map((record) => asString(record[field])).find(Boolean)
    || (field === "workflowId" ? env.GITHUB_WORKFLOW : null)
    || (field === "deploymentId" ? env.DEPLOYMENT_ID || env.GITHUB_RUN_ID : null)
    || (field === "commitSha" ? env.DEPLOY_COMMIT_SHA || env.GITHUB_SHA : null)
    || "";
}

function findConflicts(field, records) {
  const values = [...new Set(records.map((record) => asString(record[field])).filter(Boolean))];
  return values.length > 1 ? [`${field.toUpperCase()}_MISMATCH`] : [];
}

function makeDrift(scope, expected, actual, severity, reason) {
  return {
    scope,
    expected: expected === undefined ? null : expected,
    actual: actual === undefined ? null : actual,
    severity,
    reason,
  };
}

function buildReplayHash(input) {
  return sha256({
    workflowId: input.workflowId,
    deploymentId: input.deploymentId,
    commitSha: input.commitSha,
    replayStatus: input.replayStatus,
    reconstructedScopes: input.reconstructedScopes,
    missingScopes: input.missingScopes,
    reconstructedLineageHash: input.reconstructedLineageHash,
    expectedLineageHash: input.expectedLineageHash,
    driftDetected: input.driftDetected,
    driftReasons: input.driftReasons,
    policyVersion: input.policyVersion,
  });
}

function buildArtifactInventory(artifacts) {
  return artifacts.map((artifact) => ({
    name: artifact.name,
    present: artifact.present,
    parseable: artifact.parseable,
    hash: artifact.hash,
    critical: CRITICAL_ARTIFACTS.includes(artifact.name),
  }));
}

function validateTelemetryEvidence(byName) {
  const evidence = byName.get("deployment-evidence.json")?.data;
  const events = byName.get("deployment-telemetry.jsonl")?.data;
  if (!isRecord(evidence) || !Array.isArray(events) || !evidence.evidenceHash) return [];
  const expected = telemetry.hashDeploymentTelemetryEvidence({ ...evidence, evidenceHash: undefined });
  const drifts = [];
  if (expected !== evidence.evidenceHash) {
    drifts.push(makeDrift("TELEMETRY", evidence.evidenceHash, expected, "CRITICAL", "ARTIFACT_HASH_MISMATCH"));
  }
  if (Array.isArray(evidence.telemetryEvents) && sha256(evidence.telemetryEvents) !== sha256(events)) {
    drifts.push(makeDrift("TELEMETRY", sha256(evidence.telemetryEvents), sha256(events), "CRITICAL", "TELEMETRY_MUTATION"));
  }
  return drifts;
}

function evaluateGovernanceReplay(options = {}) {
  const env = options.env || process.env;
  const evidenceDir = options.evidenceDir || DEFAULT_EVIDENCE_DIR;
  const replayedAt = options.replayedAt || now(env);
  const artifacts = ALL_INPUT_ARTIFACTS.map((name) => readArtifact(evidenceDir, name));
  const byName = new Map(artifacts.map((artifact) => [artifact.name, artifact]));
  const records = recordsFromArtifacts(artifacts);
  const workflowId = firstValue("workflowId", records, env);
  const deploymentId = firstValue("deploymentId", records, env);
  const commitSha = firstValue("commitSha", records, env);
  const driftReasons = [];
  const missingCritical = CRITICAL_ARTIFACTS.filter((name) => !byName.get(name)?.present);
  const unparseableCritical = CRITICAL_ARTIFACTS.filter((name) => byName.get(name)?.present && !byName.get(name)?.parseable);

  for (const name of missingCritical) {
    driftReasons.push(makeDrift("CRITICAL", name, null, "CRITICAL", "CRITICAL_ARTIFACT_MISSING"));
  }
  for (const name of unparseableCritical) {
    driftReasons.push(makeDrift("CRITICAL", name, null, "CRITICAL", "CRITICAL_ARTIFACT_UNPARSEABLE"));
  }
  for (const field of ["workflowId", "deploymentId", "commitSha"]) {
    for (const reason of findConflicts(field, records)) {
      driftReasons.push(makeDrift("EVIDENCE", field, reason, "HIGH", "CONFLICTING_EVIDENCE"));
    }
  }

  const telemetryRecord = latestTelemetry(byName.get("deployment-telemetry.jsonl"));
  if (telemetryRecord.state && !ALLOWED_STATES.has(String(telemetryRecord.state).trim().toUpperCase())) {
    driftReasons.push(makeDrift("TELEMETRY", "KNOWN_STATE", String(telemetryRecord.state), "HIGH", "UNKNOWN_NORMALIZED_STATE"));
  }

  const reconstructed = auditCertification.evaluateAuditCertification({
    evidenceDir,
    certifiedAt: "replay-reconstruction",
    env,
  });
  const expectedCertification = byName.get("deployment-audit-certification.json")?.data;
  const expectedLineage = byName.get("deployment-lineage.json")?.data;
  const expectedLineageHash = isRecord(expectedLineage)
    ? asString(expectedLineage.lineageHash)
    : isRecord(expectedCertification)
      ? asString(expectedCertification.lineageHash)
      : null;
  const reconstructedLineageHash = reconstructed.lineageHash || "";

  if (!expectedLineageHash) {
    driftReasons.push(makeDrift("CERTIFICATION", "lineageHash", null, "CRITICAL", "REQUIRED_LINEAGE_DATA_ABSENT"));
  } else if (expectedLineageHash !== reconstructedLineageHash) {
    driftReasons.push(makeDrift("CERTIFICATION", expectedLineageHash, reconstructedLineageHash, "CRITICAL", "LINEAGE_DRIFT"));
  }
  if (isRecord(expectedCertification) && expectedCertification.certificationStatus !== reconstructed.certificationStatus) {
    driftReasons.push(makeDrift("CERTIFICATION", expectedCertification.certificationStatus, reconstructed.certificationStatus, "HIGH", "CERTIFICATION_DRIFT"));
  }

  const decision = byName.get("deployment-decision.json")?.data;
  const enforcement = byName.get("deployment-enforcement.json")?.data;
  const override = byName.get("deployment-override-governance.json")?.data;
  const summary = byName.get("deployment-certification-summary.json")?.data;
  if (isRecord(decision) && isRecord(summary) && summary.decision && decision.decision !== summary.decision) {
    driftReasons.push(makeDrift("DECISION", summary.decision, decision.decision, "HIGH", "DECISION_DRIFT"));
  }
  if (isRecord(enforcement) && isRecord(override) && override.sourceEnforcementDecision && enforcement.enforcementDecision !== override.sourceEnforcementDecision) {
    driftReasons.push(makeDrift("ENFORCEMENT", override.sourceEnforcementDecision, enforcement.enforcementDecision, "HIGH", "ENFORCEMENT_DRIFT"));
  }
  if (isRecord(override) && override.overrideGovernanceHash && reconstructed.reasons.includes("HASH_MISMATCH:deployment-override-governance.json")) {
    driftReasons.push(makeDrift("OVERRIDE", override.overrideGovernanceHash, null, "HIGH", "OVERRIDE_DRIFT"));
  }
  driftReasons.push(...validateTelemetryEvidence(byName));

  const missingScopes = [];
  const reconstructedScopes = [];
  if (byName.get("deployment-telemetry.jsonl")?.present && byName.get("deployment-summary.json")?.present && byName.get("deployment-evidence.json")?.present) reconstructedScopes.push("TELEMETRY");
  if (byName.get("certificate-verification.json")?.present) reconstructedScopes.push("CERTIFICATE");
  const checkpoint = byName.get("checkpoint-validation.json")?.data;
  if (isRecord(checkpoint) && checkpoint.checkpointStatus !== "NO_CHECKPOINT") reconstructedScopes.push("CHECKPOINT");
  else missingScopes.push("CHECKPOINT");
  if (byName.get("deployment-decision.json")?.present) reconstructedScopes.push("DECISION");
  if (byName.get("deployment-enforcement.json")?.present) reconstructedScopes.push("ENFORCEMENT");
  const overrideDecision = isRecord(override) ? override.overrideDecision : undefined;
  if (isRecord(override) && overrideDecision !== "NO_OVERRIDE") reconstructedScopes.push("OVERRIDE");
  else missingScopes.push("OVERRIDE");
  if (byName.get("deployment-audit-certification.json")?.present && byName.get("deployment-lineage.json")?.present) reconstructedScopes.push("CERTIFICATION");

  const missingOptional = OPTIONAL_ARTIFACTS.filter((name) => !byName.get(name)?.present);
  for (const name of missingOptional) {
    driftReasons.push(makeDrift("OPTIONAL", name, null, "LOW", "OPTIONAL_ARTIFACT_MISSING"));
  }

  let replayStatus = "CONSISTENT";
  if (missingCritical.length > 0 || unparseableCritical.length > 0 || !expectedLineageHash) {
    replayStatus = "FAILED";
  } else if (driftReasons.some((drift) => ["LINEAGE_DRIFT", "CERTIFICATION_DRIFT", "TELEMETRY_MUTATION", "ARTIFACT_HASH_MISMATCH", "DECISION_DRIFT", "ENFORCEMENT_DRIFT", "OVERRIDE_DRIFT"].includes(drift.reason))) {
    replayStatus = "DRIFTED";
  } else if (driftReasons.some((drift) => ["CONFLICTING_EVIDENCE", "UNKNOWN_NORMALIZED_STATE"].includes(drift.reason))) {
    replayStatus = "DISPUTED";
  } else if (missingOptional.length > 0 || missingScopes.length > 0) {
    replayStatus = "PARTIAL";
  }

  const result = {
    workflowId,
    deploymentId,
    commitSha,
    replayStatus,
    reconstructedScopes: REPLAY_SCOPES.filter((scope) => reconstructedScopes.includes(scope)),
    missingScopes: REPLAY_SCOPES.filter((scope) => missingScopes.includes(scope)),
    replayHash: "",
    reconstructedLineageHash,
    expectedLineageHash: expectedLineageHash || "",
    driftDetected: driftReasons.some((drift) => drift.severity !== "LOW"),
    driftReasons,
    replayedAt,
    policyVersion: POLICY_VERSION,
  };
  return {
    ...result,
    replayHash: buildReplayHash(result),
    forensicBundle: {
      artifactInventory: buildArtifactInventory(artifacts),
      reconstructedState: {
        certificationStatus: reconstructed.certificationStatus,
        certifiedScopes: reconstructed.certifiedScopes,
        missingScopes: reconstructed.missingScopes,
      },
      expectedLineage: isRecord(expectedLineage) ? expectedLineage : {},
      reconstructedLineage: reconstructed.lineage,
      driftReport: driftReasons,
      replayMetadata: {
        replayedAt,
        policyVersion: POLICY_VERSION,
      },
      policyVersion: POLICY_VERSION,
    },
  };
}

function buildReplaySummary(result) {
  const summary = {
    summaryVersion: "1.0",
    workflowId: result.workflowId,
    deploymentId: result.deploymentId,
    commitSha: result.commitSha,
    replayStatus: result.replayStatus,
    driftDetected: result.driftDetected,
    replayHash: result.replayHash,
    reconstructedLineageHash: result.reconstructedLineageHash,
    expectedLineageHash: result.expectedLineageHash,
    replayedAt: result.replayedAt,
    policyVersion: result.policyVersion,
    deployment_status: "unchanged",
  };
  return {
    ...summary,
    replaySummaryHash: sha256(summary),
  };
}

function writeGithubOutput(result, env = process.env) {
  if (!env.GITHUB_OUTPUT) return;
  const lines = [
    `replay_status=${result.replayStatus}`,
    `drift_detected=${result.driftDetected ? "true" : "false"}`,
    `drift_reasons=${result.driftReasons.map((drift) => drift.reason).join(",")}`,
    `replay_hash=${result.replayHash}`,
    `expected_lineage_hash=${result.expectedLineageHash}`,
    `reconstructed_lineage_hash=${result.reconstructedLineageHash}`,
    `replay_policy_version=${result.policyVersion}`,
    `telemetry_state=${result.replayStatus === "FAILED" ? "FAILED" : result.replayStatus === "DISPUTED" || result.replayStatus === "DRIFTED" ? "DISPUTED" : "PROGRESSING"}`,
  ];
  fs.appendFileSync(env.GITHUB_OUTPUT, `${lines.join("\n")}\n`);
}

function safeEvaluateGovernanceReplay(options = {}) {
  const env = options.env || process.env;
  const outputDir = options.outputDir || env.DEPLOY_TELEMETRY_DIR || DEFAULT_OUTPUT_DIR;
  let result;
  let summary;
  try {
    result = evaluateGovernanceReplay(options);
    summary = buildReplaySummary(result);
    fs.mkdirSync(outputDir, { recursive: true });
    fs.writeFileSync(path.join(outputDir, GOVERNANCE_REPLAY_JSON), `${JSON.stringify(result, null, 2)}\n`);
    fs.writeFileSync(path.join(outputDir, REPLAY_LINEAGE_JSON), `${JSON.stringify(result.forensicBundle, null, 2)}\n`);
    fs.writeFileSync(path.join(outputDir, DRIFT_REPORT_JSON), `${JSON.stringify({ driftReasons: result.driftReasons }, null, 2)}\n`);
    fs.writeFileSync(path.join(outputDir, REPLAY_SUMMARY_JSON), `${JSON.stringify(summary, null, 2)}\n`);
    writeGithubOutput(result, env);
  } catch (error) {
    result = {
      workflowId: env.GITHUB_WORKFLOW || "unknown_workflow",
      deploymentId: env.DEPLOYMENT_ID || env.GITHUB_RUN_ID || "unknown_deployment",
      commitSha: env.DEPLOY_COMMIT_SHA || env.GITHUB_SHA || "",
      replayStatus: "FAILED",
      reconstructedScopes: [],
      missingScopes: [...REPLAY_SCOPES],
      replayHash: "",
      reconstructedLineageHash: "",
      expectedLineageHash: "",
      driftDetected: true,
      driftReasons: [makeDrift("REPLAY", "success", "error", "CRITICAL", `REPLAY_ENGINE_ERROR:${error instanceof Error ? error.message : String(error)}`)],
      replayedAt: now(env),
      policyVersion: POLICY_VERSION,
    };
    result.replayHash = buildReplayHash(result);
    result.forensicBundle = {
      artifactInventory: [],
      reconstructedState: {},
      expectedLineage: {},
      reconstructedLineage: {},
      driftReport: result.driftReasons,
      replayMetadata: { replayedAt: result.replayedAt, policyVersion: POLICY_VERSION },
      policyVersion: POLICY_VERSION,
    };
    summary = buildReplaySummary(result);
    try {
      fs.mkdirSync(outputDir, { recursive: true });
      fs.writeFileSync(path.join(outputDir, GOVERNANCE_REPLAY_JSON), `${JSON.stringify(result, null, 2)}\n`);
      fs.writeFileSync(path.join(outputDir, REPLAY_LINEAGE_JSON), `${JSON.stringify(result.forensicBundle, null, 2)}\n`);
      fs.writeFileSync(path.join(outputDir, DRIFT_REPORT_JSON), `${JSON.stringify({ driftReasons: result.driftReasons }, null, 2)}\n`);
      fs.writeFileSync(path.join(outputDir, REPLAY_SUMMARY_JSON), `${JSON.stringify(summary, null, 2)}\n`);
      writeGithubOutput(result, env);
    } catch {
      // Replay artifact emission must not create operational behavior.
    }
  }
  return { ...result, summary };
}

function runCli() {
  const [, , command, ...rest] = process.argv;
  if (command !== "replay") {
    console.error("Usage: node scripts/deploy-governance-replay.cjs replay --evidence-dir <path>");
    process.exitCode = 0;
    return;
  }
  const args = parseArgs(rest);
  const result = safeEvaluateGovernanceReplay({
    evidenceDir: args["evidence-dir"],
    outputDir: args["output-dir"],
    replayedAt: args.replayedAt,
  });
  console.log(JSON.stringify(result));
  process.exitCode = 0;
}

if (require.main === module) {
  runCli();
}

module.exports = {
  DEFAULT_EVIDENCE_DIR,
  DEFAULT_OUTPUT_DIR,
  DRIFT_REPORT_JSON,
  GOVERNANCE_REPLAY_JSON,
  POLICY_VERSION,
  REPLAY_LINEAGE_JSON,
  REPLAY_SUMMARY_JSON,
  buildReplayHash,
  buildReplaySummary,
  evaluateGovernanceReplay,
  safeEvaluateGovernanceReplay,
};
