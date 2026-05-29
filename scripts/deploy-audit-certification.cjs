#!/usr/bin/env node

const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

const DEFAULT_EVIDENCE_DIR = path.join("artifacts", "deployment-telemetry");
const DEFAULT_OUTPUT_DIR = DEFAULT_EVIDENCE_DIR;
const AUDIT_CERTIFICATION_JSON = "deployment-audit-certification.json";
const LINEAGE_JSON = "deployment-lineage.json";
const CERTIFICATION_SUMMARY_JSON = "deployment-certification-summary.json";
const POLICY_VERSION = "dh-post-override-audit/v1";

const SCOPES = Object.freeze(["TELEMETRY", "CERTIFICATE", "CHECKPOINT", "DECISION", "ENFORCEMENT", "OVERRIDE"]);
const CRITICAL_ARTIFACTS = Object.freeze([
  "deployment-telemetry.jsonl",
  "deployment-summary.json",
  "deployment-evidence.json",
  "certificate-verification.json",
  "deployment-decision.json",
  "deployment-enforcement.json",
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
  return env.DEPLOY_AUDIT_CERTIFIED_AT || new Date().toISOString();
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
    return { name, filePath, present: false, parseable: false, hash: null, data: null, reason: "MISSING" };
  }
  const raw = fs.readFileSync(filePath, "utf8");
  try {
    const data = name.endsWith(".jsonl") ? parseJsonl(raw) : JSON.parse(raw);
    return { name, filePath, present: true, parseable: true, hash: sha256Text(raw), data, reason: null };
  } catch {
    return { name, filePath, present: true, parseable: false, hash: sha256Text(raw), data: null, reason: "UNPARSEABLE" };
  }
}

function latestTelemetry(artifact) {
  return Array.isArray(artifact?.data) ? artifact.data.filter(isRecord).at(-1) || {} : {};
}

function recordsFromArtifacts(artifacts) {
  return artifacts
    .map((artifact) => {
      if (artifact.name === "deployment-telemetry.jsonl") return latestTelemetry(artifact);
      return isRecord(artifact.data) ? artifact.data : null;
    })
    .filter(isRecord);
}

function findConflicts(field, records) {
  const values = [...new Set(records.map((record) => asString(record[field])).filter(Boolean))];
  return values.length > 1 ? [`${field.toUpperCase()}_MISMATCH`] : [];
}

function firstValue(field, records, env = process.env) {
  return records.map((record) => asString(record[field])).find(Boolean)
    || (field === "workflowId" ? env.GITHUB_WORKFLOW : null)
    || (field === "deploymentId" ? env.DEPLOYMENT_ID || env.GITHUB_RUN_ID : null)
    || (field === "commitSha" ? env.DEPLOY_COMMIT_SHA || env.GITHUB_SHA : null)
    || "";
}

function expectedDecisionHash(decision) {
  return sha256({
    workflowId: decision.workflowId,
    deploymentId: decision.deploymentId,
    commitSha: decision.commitSha,
    decision: decision.decision,
    risk: decision.risk,
    certificateStatus: decision.certificateStatus,
    checkpointStatus: decision.checkpointStatus,
    resumeEligibility: decision.resumeEligibility,
    failureClass: decision.failureClass,
    reasons: decision.reasons,
    policyVersion: decision.policyVersion,
    evaluatedAt: decision.evaluatedAt,
    enforcementMode: decision.enforcementMode,
  });
}

function expectedEnforcementHash(enforcement) {
  return sha256({
    workflowId: enforcement.workflowId,
    deploymentId: enforcement.deploymentId,
    commitSha: enforcement.commitSha,
    enforcementMode: enforcement.enforcementMode,
    enforcementDecision: enforcement.enforcementDecision,
    sourceDecision: enforcement.sourceDecision,
    sourceRisk: enforcement.sourceRisk,
    deterministicCauses: enforcement.deterministicCauses,
    blocked: enforcement.blocked,
    reasons: enforcement.reasons,
    evaluatedAt: enforcement.evaluatedAt,
    policyVersion: enforcement.policyVersion,
  });
}

function expectedOverrideHash(override) {
  return sha256({
    workflowId: override.workflowId,
    deploymentId: override.deploymentId,
    commitSha: override.commitSha,
    overrideMode: override.overrideMode,
    overrideDecision: override.overrideDecision,
    sourceEnforcementDecision: override.sourceEnforcementDecision,
    sourceBlocked: override.sourceBlocked,
    operatorId: override.operatorId,
    approvalReason: override.approvalReason,
    approvalArtifactHash: override.approvalArtifactHash,
    expiresAt: override.expiresAt,
    validatedAt: override.validatedAt,
    reasons: override.reasons,
    policyVersion: override.policyVersion,
  });
}

function findHashMismatches(byName) {
  const mismatches = [];
  const decision = byName.get("deployment-decision.json")?.data;
  if (isRecord(decision) && decision.decisionHash && decision.decisionHash !== expectedDecisionHash(decision)) {
    mismatches.push("HASH_MISMATCH:deployment-decision.json");
  }
  const enforcement = byName.get("deployment-enforcement.json")?.data;
  if (isRecord(enforcement) && enforcement.enforcementHash && enforcement.enforcementHash !== expectedEnforcementHash(enforcement)) {
    mismatches.push("HASH_MISMATCH:deployment-enforcement.json");
  }
  const override = byName.get("deployment-override-governance.json")?.data;
  if (isRecord(override) && override.overrideGovernanceHash && override.overrideGovernanceHash !== expectedOverrideHash(override)) {
    mismatches.push("HASH_MISMATCH:deployment-override-governance.json");
  }
  return mismatches;
}

function buildArtifactManifest(artifacts) {
  return artifacts.map((artifact) => ({
    name: artifact.name,
    present: artifact.present,
    parseable: artifact.parseable,
    hash: artifact.hash,
    critical: CRITICAL_ARTIFACTS.includes(artifact.name),
  }));
}

function buildEvidenceHash(input) {
  return sha256({
    workflowId: input.workflowId,
    deploymentId: input.deploymentId,
    commitSha: input.commitSha,
    artifacts: input.artifactManifest.map((artifact) => ({
      name: artifact.name,
      hash: artifact.hash,
      present: artifact.present,
      parseable: artifact.parseable,
    })).sort((left, right) => left.name.localeCompare(right.name)),
  });
}

function buildLineageHash(input) {
  return sha256({
    certificateHash: input.certificateHash || null,
    checkpointHash: input.checkpointHash || null,
    decisionHash: input.decisionHash || null,
    enforcementHash: input.enforcementHash || null,
    overrideHash: input.overrideHash || null,
  });
}

function buildOverrideLineageHash(input) {
  if (!input.overrideHash) return undefined;
  return sha256({
    overrideHash: input.overrideHash,
    sourceEnforcementHash: input.sourceEnforcementHash || null,
    operatorId: input.operatorId || null,
    approvalArtifactHash: input.approvalArtifactHash || null,
    expiresAt: input.expiresAt || null,
  });
}

function evaluateAuditCertification(options = {}) {
  const env = options.env || process.env;
  const evidenceDir = options.evidenceDir || DEFAULT_EVIDENCE_DIR;
  const certifiedAt = options.certifiedAt || now(env);
  const artifacts = ALL_INPUT_ARTIFACTS.map((name) => readArtifact(evidenceDir, name));
  const byName = new Map(artifacts.map((artifact) => [artifact.name, artifact]));
  const records = recordsFromArtifacts(artifacts);
  const workflowId = firstValue("workflowId", records, env);
  const deploymentId = firstValue("deploymentId", records, env);
  const commitSha = firstValue("commitSha", records, env);
  const reasons = [];

  const missingCritical = CRITICAL_ARTIFACTS.filter((name) => !byName.get(name)?.present);
  const unparseableCritical = CRITICAL_ARTIFACTS.filter((name) => byName.get(name)?.present && !byName.get(name)?.parseable);
  for (const name of missingCritical) reasons.push(`CRITICAL_ARTIFACT_MISSING:${name}`);
  for (const name of unparseableCritical) reasons.push(`CRITICAL_ARTIFACT_UNPARSEABLE:${name}`);

  const missingOptional = OPTIONAL_ARTIFACTS.filter((name) => !byName.get(name)?.present);
  for (const name of missingOptional) reasons.push(`OPTIONAL_ARTIFACT_MISSING:${name}`);

  for (const field of ["workflowId", "deploymentId", "commitSha"]) {
    reasons.push(...findConflicts(field, records));
  }

  const telemetry = latestTelemetry(byName.get("deployment-telemetry.jsonl"));
  if (telemetry.state && !ALLOWED_STATES.has(String(telemetry.state).trim().toUpperCase())) {
    reasons.push("UNKNOWN_NORMALIZED_STATE");
  }

  const overrideGovernance = byName.get("deployment-override-governance.json")?.data;
  const enforcementArtifact = byName.get("deployment-enforcement.json")?.data;
  if (
    isRecord(overrideGovernance)
    && isRecord(enforcementArtifact)
    && overrideGovernance.sourceEnforcementHash
    && enforcementArtifact.enforcementHash
    && overrideGovernance.sourceEnforcementHash !== enforcementArtifact.enforcementHash
  ) {
    reasons.push("OVERRIDE_LINEAGE_MISMATCH");
  }

  reasons.push(...findHashMismatches(byName));

  const checkpoint = byName.get("checkpoint-validation.json")?.data;
  const override = overrideGovernance;
  const checkpointStatus = isRecord(checkpoint) ? String(checkpoint.checkpointStatus || "DISPUTED") : "MISSING";
  const overrideDecision = isRecord(override) ? String(override.overrideDecision || "OVERRIDE_DISPUTED") : "MISSING";
  const missingScopes = [];
  const certifiedScopes = [];

  if (byName.get("deployment-telemetry.jsonl")?.present && byName.get("deployment-summary.json")?.present && byName.get("deployment-evidence.json")?.present) certifiedScopes.push("TELEMETRY");
  if (byName.get("certificate-verification.json")?.present) certifiedScopes.push("CERTIFICATE");
  if (byName.get("deployment-decision.json")?.present) certifiedScopes.push("DECISION");
  if (byName.get("deployment-enforcement.json")?.present) certifiedScopes.push("ENFORCEMENT");
  if (checkpointStatus === "NO_CHECKPOINT" || !byName.get("checkpoint-validation.json")?.present) {
    missingScopes.push("CHECKPOINT");
    reasons.push(checkpointStatus === "NO_CHECKPOINT" ? "CHECKPOINT_SCOPE_NOT_APPLICABLE:NO_CHECKPOINT" : "CHECKPOINT_SCOPE_MISSING");
  } else {
    certifiedScopes.push("CHECKPOINT");
  }
  if (overrideDecision === "NO_OVERRIDE" || !byName.get("deployment-override-governance.json")?.present) {
    missingScopes.push("OVERRIDE");
    reasons.push(overrideDecision === "NO_OVERRIDE" ? "OVERRIDE_SCOPE_NOT_APPLICABLE:NO_OVERRIDE" : "OVERRIDE_SCOPE_MISSING");
  } else {
    certifiedScopes.push("OVERRIDE");
  }

  const artifactManifest = buildArtifactManifest(artifacts);
  const presentAndParseable = artifacts.filter((artifact) => artifact.present && artifact.parseable).length;
  const completenessScore = Number((presentAndParseable / artifacts.length).toFixed(4));
  const evidenceHash = buildEvidenceHash({ workflowId, deploymentId, commitSha, artifactManifest });
  const certificate = byName.get("certificate-verification.json")?.data;
  const decision = byName.get("deployment-decision.json")?.data;
  const enforcement = enforcementArtifact;
  const lineageInput = {
    certificateHash: isRecord(certificate) ? certificate.certificateHash || byName.get("certificate-verification.json")?.hash : null,
    checkpointHash: checkpointStatus !== "NO_CHECKPOINT" && isRecord(checkpoint) ? checkpoint.checkpointHash || byName.get("checkpoint-validation.json")?.hash : null,
    decisionHash: isRecord(decision) ? decision.decisionHash || byName.get("deployment-decision.json")?.hash : null,
    enforcementHash: isRecord(enforcement) ? enforcement.enforcementHash || byName.get("deployment-enforcement.json")?.hash : null,
    overrideHash: overrideDecision !== "NO_OVERRIDE" && isRecord(override) ? override.overrideGovernanceHash || byName.get("deployment-override-governance.json")?.hash : null,
  };
  const lineageHash = buildLineageHash(lineageInput);
  const overrideLineageHash = buildOverrideLineageHash({
    overrideHash: lineageInput.overrideHash,
    sourceEnforcementHash: isRecord(override) ? override.sourceEnforcementHash || enforcement?.enforcementHash : null,
    operatorId: isRecord(override) ? override.operatorId : null,
    approvalArtifactHash: isRecord(override) ? override.approvalArtifactHash : null,
    expiresAt: isRecord(override) ? override.expiresAt : null,
  });

  let certificationStatus = "CERTIFIED";
  if (missingCritical.length > 0 || unparseableCritical.length > 0 || reasons.some((reason) => reason.startsWith("HASH_MISMATCH"))) {
    certificationStatus = "FAILED";
  } else if (reasons.some((reason) => reason.endsWith("_MISMATCH") || reason === "UNKNOWN_NORMALIZED_STATE")) {
    certificationStatus = "DISPUTED";
  } else if (missingOptional.length > 0 || missingScopes.length > 0 || completenessScore < 1) {
    certificationStatus = "PARTIAL";
  }

  const result = {
    workflowId,
    deploymentId,
    commitSha,
    certificationStatus,
    certifiedScopes: SCOPES.filter((scope) => certifiedScopes.includes(scope)),
    missingScopes: SCOPES.filter((scope) => missingScopes.includes(scope)),
    evidenceHash,
    lineageHash,
    overrideLineageHash,
    completenessScore,
    reasons: [...new Set(reasons)],
    certifiedAt,
    policyVersion: POLICY_VERSION,
  };
  return {
    ...result,
    certificationHash: hashAuditCertificationResult(result),
    lineage: {
      workflowId,
      deploymentId,
      commitSha,
      evidenceHash,
      lineageHash,
      overrideLineageHash,
      artifactManifest,
      lineageInput,
      policyVersion: POLICY_VERSION,
    },
  };
}

function hashAuditCertificationResult(result) {
  return sha256({
    workflowId: result.workflowId,
    deploymentId: result.deploymentId,
    commitSha: result.commitSha,
    certificationStatus: result.certificationStatus,
    certifiedScopes: result.certifiedScopes,
    missingScopes: result.missingScopes,
    evidenceHash: result.evidenceHash,
    lineageHash: result.lineageHash,
    overrideLineageHash: result.overrideLineageHash,
    completenessScore: result.completenessScore,
    reasons: result.reasons,
    certifiedAt: result.certifiedAt,
    policyVersion: result.policyVersion,
  });
}

function buildCertificationSummary(result) {
  const summary = {
    summaryVersion: "1.0",
    workflowId: result.workflowId,
    deploymentId: result.deploymentId,
    commitSha: result.commitSha,
    certificationStatus: result.certificationStatus,
    completenessScore: result.completenessScore,
    evidenceHash: result.evidenceHash,
    lineageHash: result.lineageHash,
    overrideLineageHash: result.overrideLineageHash,
    certifiedAt: result.certifiedAt,
    reasons: result.reasons,
    policyVersion: result.policyVersion,
    deployment_status: "unchanged",
  };
  return {
    ...summary,
    certificationSummaryHash: sha256(summary),
  };
}

function writeGithubOutput(result, env = process.env) {
  if (!env.GITHUB_OUTPUT) return;
  const lines = [
    `certification_status=${result.certificationStatus}`,
    `completeness_score=${result.completenessScore}`,
    `evidence_hash=${result.evidenceHash}`,
    `lineage_hash=${result.lineageHash}`,
    `override_lineage_hash=${result.overrideLineageHash || ""}`,
    `certification_policy_version=${result.policyVersion}`,
    `certification_reasons=${result.reasons.join(",")}`,
    `telemetry_state=${result.certificationStatus === "FAILED" ? "FAILED" : result.certificationStatus === "DISPUTED" ? "DISPUTED" : "PROGRESSING"}`,
  ];
  fs.appendFileSync(env.GITHUB_OUTPUT, `${lines.join("\n")}\n`);
}

function safeEvaluateAuditCertification(options = {}) {
  const env = options.env || process.env;
  const outputDir = options.outputDir || env.DEPLOY_TELEMETRY_DIR || DEFAULT_OUTPUT_DIR;
  let result;
  let summary;
  try {
    result = evaluateAuditCertification(options);
    summary = buildCertificationSummary(result);
    fs.mkdirSync(outputDir, { recursive: true });
    fs.writeFileSync(path.join(outputDir, AUDIT_CERTIFICATION_JSON), `${JSON.stringify(result, null, 2)}\n`);
    fs.writeFileSync(path.join(outputDir, LINEAGE_JSON), `${JSON.stringify(result.lineage, null, 2)}\n`);
    fs.writeFileSync(path.join(outputDir, CERTIFICATION_SUMMARY_JSON), `${JSON.stringify(summary, null, 2)}\n`);
    writeGithubOutput(result, env);
  } catch (error) {
    result = {
      workflowId: env.GITHUB_WORKFLOW || "unknown_workflow",
      deploymentId: env.DEPLOYMENT_ID || env.GITHUB_RUN_ID || "unknown_deployment",
      commitSha: env.DEPLOY_COMMIT_SHA || env.GITHUB_SHA || "",
      certificationStatus: "FAILED",
      certifiedScopes: [],
      missingScopes: [...SCOPES],
      evidenceHash: "",
      lineageHash: "",
      completenessScore: 0,
      reasons: [`AUDIT_CERTIFICATION_ERROR:${error instanceof Error ? error.message : String(error)}`],
      certifiedAt: now(env),
      policyVersion: POLICY_VERSION,
    };
    result.certificationHash = hashAuditCertificationResult(result);
    result.lineage = {
      workflowId: result.workflowId,
      deploymentId: result.deploymentId,
      commitSha: result.commitSha,
      evidenceHash: result.evidenceHash,
      lineageHash: result.lineageHash,
      artifactManifest: [],
      lineageInput: {},
      policyVersion: POLICY_VERSION,
    };
    summary = buildCertificationSummary(result);
    try {
      fs.mkdirSync(outputDir, { recursive: true });
      fs.writeFileSync(path.join(outputDir, AUDIT_CERTIFICATION_JSON), `${JSON.stringify(result, null, 2)}\n`);
      fs.writeFileSync(path.join(outputDir, LINEAGE_JSON), `${JSON.stringify(result.lineage, null, 2)}\n`);
      fs.writeFileSync(path.join(outputDir, CERTIFICATION_SUMMARY_JSON), `${JSON.stringify(summary, null, 2)}\n`);
      writeGithubOutput(result, env);
    } catch {
      // Certification artifact emission must not add enforcement or recovery behavior.
    }
  }
  return { ...result, summary };
}

function runCli() {
  const [, , command, ...rest] = process.argv;
  if (command !== "certify") {
    console.error("Usage: node scripts/deploy-audit-certification.cjs certify --evidence-dir <path>");
    process.exitCode = 0;
    return;
  }
  const args = parseArgs(rest);
  const result = safeEvaluateAuditCertification({
    evidenceDir: args["evidence-dir"],
    outputDir: args["output-dir"],
    certifiedAt: args.certifiedAt,
  });
  console.log(JSON.stringify(result));
  process.exitCode = 0;
}

if (require.main === module) {
  runCli();
}

module.exports = {
  AUDIT_CERTIFICATION_JSON,
  CERTIFICATION_SUMMARY_JSON,
  DEFAULT_EVIDENCE_DIR,
  DEFAULT_OUTPUT_DIR,
  LINEAGE_JSON,
  POLICY_VERSION,
  buildCertificationSummary,
  buildEvidenceHash,
  buildLineageHash,
  buildOverrideLineageHash,
  evaluateAuditCertification,
  hashAuditCertificationResult,
  safeEvaluateAuditCertification,
};
