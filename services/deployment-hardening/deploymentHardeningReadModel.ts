import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

export type DeploymentHardeningOverallState =
  | "RUNNING"
  | "PROGRESSING"
  | "WAITING"
  | "STALLED"
  | "BLOCKED"
  | "DISPUTED"
  | "PASSED"
  | "FAILED"
  | "UNKNOWN";

export type ArtifactSummary = {
  name: string;
  path: string;
  available: boolean;
  malformed: boolean;
  hash: string | null;
  reason: string | null;
};

export type TimelineEvent = {
  event: string;
  timestamp: string | null;
  workflowId: string | null;
  deploymentId: string | null;
  commitSha: string | null;
  state: DeploymentHardeningOverallState;
  currentStep: string | null;
  currentPartition: string | null;
  lastCompletedPartition: string | null;
  certificateStatus: string;
  checkpointStatus: string;
  resumeEligibility: string;
  deploymentDecision: string;
  deploymentRisk: string;
  enforcementMode: string;
  enforcementDecision: string;
  enforcementPolicyVersion: string | null;
  enforcementReasons: string[];
  deterministicCauses: string[];
  blocked: boolean;
  overrideMode: string;
  overrideDecision: string;
  overridePolicyVersion: string | null;
  operatorId: string | null;
  overrideExpiresAt: string | null;
  overrideReasons: string[];
  sourceEnforcementDecision: string;
  sourceBlocked: boolean;
  certificationStatus: string;
  completenessScore: number;
  evidenceHash: string | null;
  lineageHash: string | null;
  overrideLineageHash: string | null;
  certificationPolicyVersion: string | null;
  certificationReasons: string[];
  replayStatus: string;
  driftDetected: boolean;
  driftReasons: string[];
  replayHash: string | null;
  expectedLineageHash: string | null;
  reconstructedLineageHash: string | null;
  replayPolicyVersion: string | null;
  failureClass: string | null;
};

export type DeploymentHardeningReadModel = {
  workflowId: string | null;
  deploymentId: string | null;
  commitSha: string | null;
  overallState: DeploymentHardeningOverallState;
  certificateStatus: string;
  checkpointStatus: string;
  resumeEligibility: string;
  deploymentDecision: string;
  deploymentRisk: string;
  enforcementMode: "READ_ONLY" | "WARN_ONLY" | "ENFORCE_SCOPED";
  enforcementDecision: string;
  enforcementPolicyVersion: string | null;
  enforcementReasons: string[];
  deterministicCauses: string[];
  blocked: boolean;
  overrideMode: "OVERRIDE_DISABLED" | "OVERRIDE_REQUEST_ONLY" | "OVERRIDE_ALLOWED_WITH_ARTIFACT";
  overrideDecision: string;
  overridePolicyVersion: string | null;
  operatorId: string | null;
  approvalReasonPresent: boolean;
  approvalArtifactHash: string | null;
  overrideExpiresAt: string | null;
  overrideReasons: string[];
  sourceEnforcementDecision: string;
  sourceBlocked: boolean;
  certificationStatus: "CERTIFIED" | "PARTIAL" | "DISPUTED" | "FAILED";
  completenessScore: number;
  evidenceHash: string | null;
  lineageHash: string | null;
  overrideLineageHash: string | null;
  certifiedScopes: string[];
  missingScopes: string[];
  certificationReasons: string[];
  certificationPolicyVersion: string | null;
  replayStatus: "CONSISTENT" | "PARTIAL" | "DRIFTED" | "DISPUTED" | "FAILED";
  driftDetected: boolean;
  driftReasons: string[];
  replayHash: string | null;
  expectedLineageHash: string | null;
  reconstructedLineageHash: string | null;
  reconstructedScopes: string[];
  replayMissingScopes: string[];
  replayPolicyVersion: string | null;
  currentStep: string | null;
  currentPartition: string | null;
  lastCompletedPartition: string | null;
  heartbeatAt: string | null;
  staleHeartbeat: boolean;
  evidenceAvailable: boolean;
  disputedReasons: string[];
  artifacts: ArtifactSummary[];
  timeline: TimelineEvent[];
};

const DEFAULT_EVIDENCE_DIR = path.join(process.cwd(), "artifacts", "deployment-telemetry");
const HEARTBEAT_STALE_MS = 10 * 60 * 1000;

const REQUIRED_ARTIFACTS = Object.freeze([
  "deployment-telemetry.jsonl",
  "deployment-summary.json",
  "deployment-evidence.json",
  "certificate-verification.json",
  "checkpoint-validation.json",
  "resume-analysis.json",
  "deployment-decision.json",
  "deployment-decision-summary.json",
  "deployment-enforcement.json",
  "deployment-enforcement-summary.json",
  "deployment-override-governance.json",
  "deployment-override-request.json",
  "deployment-override-summary.json",
  "deployment-audit-certification.json",
  "deployment-lineage.json",
  "deployment-certification-summary.json",
  "deployment-governance-replay.json",
  "deployment-replay-lineage.json",
  "deployment-drift-report.json",
  "deployment-replay-summary.json",
]);

const ALLOWED_STATES = new Set([
  "RUNNING",
  "PROGRESSING",
  "WAITING",
  "STALLED",
  "BLOCKED",
  "DISPUTED",
  "PASSED",
  "FAILED",
  "UNKNOWN",
]);

const ALLOWED_CERTIFICATE_STATUSES = new Set(["UNVERIFIED", "MISSING", "FOUND", "VALID", "INVALID", "DISPUTED"]);
const ALLOWED_CHECKPOINT_STATUSES = new Set(["UNVERIFIED", "NO_CHECKPOINT", "FOUND", "SAFE", "UNSAFE", "DRIFTED", "DISPUTED"]);
const ALLOWED_RESUME_ELIGIBILITIES = new Set(["UNVERIFIED", "ELIGIBLE", "INELIGIBLE", "DISPUTED", "NOT_APPLICABLE"]);
const ALLOWED_DECISIONS = new Set(["ALLOW", "OBSERVE", "PAUSE_RECOMMENDED", "ESCALATE", "BLOCK_RECOMMENDED", "DISPUTED"]);
const ALLOWED_RISKS = new Set(["LOW", "MEDIUM", "HIGH", "CRITICAL", "UNKNOWN"]);
const ALLOWED_ENFORCEMENT_MODES = new Set(["READ_ONLY", "WARN_ONLY", "ENFORCE_SCOPED"]);
const ALLOWED_ENFORCEMENT_DECISIONS = new Set(["ALLOW_CONTINUE", "WARN_CONTINUE", "ENFORCE_BLOCK", "DISPUTED_NO_BLOCK"]);
const ALLOWED_OVERRIDE_MODES = new Set(["OVERRIDE_DISABLED", "OVERRIDE_REQUEST_ONLY", "OVERRIDE_ALLOWED_WITH_ARTIFACT"]);
const ALLOWED_OVERRIDE_DECISIONS = new Set(["NO_OVERRIDE", "REQUEST_CREATED", "OVERRIDE_VALID", "OVERRIDE_REJECTED", "OVERRIDE_EXPIRED", "OVERRIDE_DISPUTED"]);
const ALLOWED_CERTIFICATION_STATUSES = new Set(["CERTIFIED", "PARTIAL", "DISPUTED", "FAILED"]);
const ALLOWED_REPLAY_STATUSES = new Set(["CONSISTENT", "PARTIAL", "DRIFTED", "DISPUTED", "FAILED"]);

type ParsedArtifact = {
  name: string;
  filePath: string;
  summary: ArtifactSummary;
  data: unknown;
};

function sha256Raw(value: Buffer | string) {
  return `sha256:${crypto.createHash("sha256").update(value).digest("hex")}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function asString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeEnum(value: unknown, allowed: Set<string>, fallback = "DISPUTED") {
  const normalized = String(value || "").trim().toUpperCase();
  return allowed.has(normalized) ? normalized : fallback;
}

function normalizeState(value: unknown): DeploymentHardeningOverallState {
  return normalizeEnum(value, ALLOWED_STATES, "DISPUTED") as DeploymentHardeningOverallState;
}

function normalizeStringList(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  return String(value || "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function normalizeBoolean(value: unknown) {
  if (typeof value === "boolean") return value;
  return String(value || "").trim().toLowerCase() === "true";
}

function readJson(filePath: string): unknown {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function readJsonl(filePath: string): unknown[] {
  return fs.readFileSync(filePath, "utf8")
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

function readArtifact(evidenceDir: string, name: string): ParsedArtifact {
  const filePath = path.join(evidenceDir, name);
  if (!fs.existsSync(filePath)) {
    return {
      name,
      filePath,
      data: null,
      summary: {
        name,
        path: filePath,
        available: false,
        malformed: false,
        hash: null,
        reason: "missing",
      },
    };
  }

  try {
    const raw = fs.readFileSync(filePath);
    const data = name.endsWith(".jsonl") ? readJsonl(filePath) : JSON.parse(raw.toString("utf8"));
    return {
      name,
      filePath,
      data,
      summary: {
        name,
        path: filePath,
        available: true,
        malformed: false,
        hash: sha256Raw(raw),
        reason: null,
      },
    };
  } catch {
    return {
      name,
      filePath,
      data: null,
      summary: {
        name,
        path: filePath,
        available: true,
        malformed: true,
        hash: null,
        reason: "malformed",
      },
    };
  }
}

function valuesFor(field: string, records: Record<string, unknown>[]) {
  return records
    .map((record) => asString(record[field]))
    .filter((value): value is string => Boolean(value));
}

function firstValue(field: string, records: Record<string, unknown>[]) {
  return valuesFor(field, records)[0] || null;
}

function findConflicts(field: string, records: Record<string, unknown>[]) {
  const values = [...new Set(valuesFor(field, records))];
  return values.length > 1 ? [`EVIDENCE_CONFLICT:${field}`] : [];
}

function latestTelemetryRecord(events: unknown[]) {
  const records = events.filter(isRecord);
  return records.at(-1) || null;
}

function normalizeTimelineEvent(record: Record<string, unknown>): TimelineEvent {
  return {
    event: asString(record.event) || "unknown_event",
    timestamp: asString(record.timestamp),
    workflowId: asString(record.workflowId),
    deploymentId: asString(record.deploymentId),
    commitSha: asString(record.commitSha),
    state: normalizeState(record.state),
    currentStep: asString(record.currentStep),
    currentPartition: asString(record.currentPartition),
    lastCompletedPartition: asString(record.lastCompletedPartition),
    certificateStatus: normalizeEnum(record.certificateStatus, ALLOWED_CERTIFICATE_STATUSES),
    checkpointStatus: normalizeEnum(record.checkpointStatus, ALLOWED_CHECKPOINT_STATUSES),
    resumeEligibility: normalizeEnum(record.resumeEligibility, ALLOWED_RESUME_ELIGIBILITIES),
    deploymentDecision: normalizeEnum(record.deploymentDecision, ALLOWED_DECISIONS),
    deploymentRisk: normalizeEnum(record.deploymentRisk, ALLOWED_RISKS, "UNKNOWN"),
    enforcementMode: normalizeEnum(record.enforcementMode, ALLOWED_ENFORCEMENT_MODES, "WARN_ONLY") as "READ_ONLY" | "WARN_ONLY" | "ENFORCE_SCOPED",
    enforcementDecision: normalizeEnum(record.enforcementDecision, ALLOWED_ENFORCEMENT_DECISIONS, "WARN_CONTINUE"),
    enforcementPolicyVersion: asString(record.enforcementPolicyVersion),
    enforcementReasons: normalizeStringList(record.enforcementReasons),
    deterministicCauses: normalizeStringList(record.deterministicCauses),
    blocked: normalizeBoolean(record.blocked),
    overrideMode: normalizeEnum(record.overrideMode, ALLOWED_OVERRIDE_MODES, "OVERRIDE_REQUEST_ONLY"),
    overrideDecision: normalizeEnum(record.overrideDecision, ALLOWED_OVERRIDE_DECISIONS, "NO_OVERRIDE"),
    overridePolicyVersion: asString(record.overridePolicyVersion),
    operatorId: asString(record.operatorId),
    overrideExpiresAt: asString(record.overrideExpiresAt),
    overrideReasons: normalizeStringList(record.overrideReasons),
    sourceEnforcementDecision: normalizeEnum(record.sourceEnforcementDecision, ALLOWED_ENFORCEMENT_DECISIONS, "WARN_CONTINUE"),
    sourceBlocked: normalizeBoolean(record.sourceBlocked),
    certificationStatus: normalizeEnum(record.certificationStatus, ALLOWED_CERTIFICATION_STATUSES),
    completenessScore: Number(record.completenessScore || 0),
    evidenceHash: asString(record.evidenceHash),
    lineageHash: asString(record.lineageHash),
    overrideLineageHash: asString(record.overrideLineageHash),
    certificationPolicyVersion: asString(record.certificationPolicyVersion),
    certificationReasons: normalizeStringList(record.certificationReasons),
    replayStatus: normalizeEnum(record.replayStatus, ALLOWED_REPLAY_STATUSES),
    driftDetected: normalizeBoolean(record.driftDetected),
    driftReasons: normalizeStringList(record.driftReasons),
    replayHash: asString(record.replayHash),
    expectedLineageHash: asString(record.expectedLineageHash),
    reconstructedLineageHash: asString(record.reconstructedLineageHash),
    replayPolicyVersion: asString(record.replayPolicyVersion),
    failureClass: asString(record.failureClass),
  };
}

function compareTimelineEvents(left: TimelineEvent, right: TimelineEvent) {
  const leftTime = Date.parse(left.timestamp || "");
  const rightTime = Date.parse(right.timestamp || "");
  const leftValid = Number.isFinite(leftTime);
  const rightValid = Number.isFinite(rightTime);
  if (leftValid && rightValid && leftTime !== rightTime) return leftTime - rightTime;
  if (leftValid !== rightValid) return leftValid ? -1 : 1;
  return left.event.localeCompare(right.event);
}

function computeStaleHeartbeat(heartbeatAt: string | null, now: string) {
  if (!heartbeatAt) return true;
  const heartbeatMs = Date.parse(heartbeatAt);
  const nowMs = Date.parse(now);
  if (!Number.isFinite(heartbeatMs) || !Number.isFinite(nowMs)) return true;
  return nowMs - heartbeatMs > HEARTBEAT_STALE_MS;
}

export function getDeploymentHardeningEvidenceDir(env: NodeJS.ProcessEnv = process.env) {
  return env.DEPLOYMENT_HARDENING_EVIDENCE_DIR || env.DEPLOY_TELEMETRY_DIR || DEFAULT_EVIDENCE_DIR;
}

export function buildDeploymentHardeningReadModel(options: {
  evidenceDir?: string;
  now?: string;
} = {}): DeploymentHardeningReadModel {
  const evidenceDir = options.evidenceDir || getDeploymentHardeningEvidenceDir();
  const now = options.now || new Date().toISOString();
  const parsed = REQUIRED_ARTIFACTS.map((name) => readArtifact(evidenceDir, name));
  const byName = new Map(parsed.map((artifact) => [artifact.name, artifact]));
  const reasons: string[] = [];

  for (const artifact of parsed) {
    if (!artifact.summary.available) reasons.push(`EVIDENCE_MISSING:${artifact.name}`);
    if (artifact.summary.malformed) reasons.push(`EVIDENCE_UNPARSEABLE:${artifact.name}`);
  }

  const telemetryEvents = Array.isArray(byName.get("deployment-telemetry.jsonl")?.data)
    ? (byName.get("deployment-telemetry.jsonl")?.data as unknown[])
    : [];
  const timeline = telemetryEvents
    .filter(isRecord)
    .map(normalizeTimelineEvent)
    .sort(compareTimelineEvents);
  const latestTelemetry = latestTelemetryRecord(telemetryEvents);
  const deploymentSummary = isRecord(byName.get("deployment-summary.json")?.data) ? byName.get("deployment-summary.json")?.data as Record<string, unknown> : {};
  const deploymentEvidence = isRecord(byName.get("deployment-evidence.json")?.data) ? byName.get("deployment-evidence.json")?.data as Record<string, unknown> : {};
  const certificate = isRecord(byName.get("certificate-verification.json")?.data) ? byName.get("certificate-verification.json")?.data as Record<string, unknown> : {};
  const checkpoint = isRecord(byName.get("checkpoint-validation.json")?.data) ? byName.get("checkpoint-validation.json")?.data as Record<string, unknown> : {};
  const resume = isRecord(byName.get("resume-analysis.json")?.data) ? byName.get("resume-analysis.json")?.data as Record<string, unknown> : {};
  const decision = isRecord(byName.get("deployment-decision.json")?.data) ? byName.get("deployment-decision.json")?.data as Record<string, unknown> : {};
  const decisionSummary = isRecord(byName.get("deployment-decision-summary.json")?.data) ? byName.get("deployment-decision-summary.json")?.data as Record<string, unknown> : {};
  const enforcement = isRecord(byName.get("deployment-enforcement.json")?.data) ? byName.get("deployment-enforcement.json")?.data as Record<string, unknown> : {};
  const enforcementSummary = isRecord(byName.get("deployment-enforcement-summary.json")?.data) ? byName.get("deployment-enforcement-summary.json")?.data as Record<string, unknown> : {};
  const overrideGovernance = isRecord(byName.get("deployment-override-governance.json")?.data) ? byName.get("deployment-override-governance.json")?.data as Record<string, unknown> : {};
  const overrideRequest = isRecord(byName.get("deployment-override-request.json")?.data) ? byName.get("deployment-override-request.json")?.data as Record<string, unknown> : {};
  const overrideSummary = isRecord(byName.get("deployment-override-summary.json")?.data) ? byName.get("deployment-override-summary.json")?.data as Record<string, unknown> : {};
  const auditCertification = isRecord(byName.get("deployment-audit-certification.json")?.data) ? byName.get("deployment-audit-certification.json")?.data as Record<string, unknown> : {};
  const lineage = isRecord(byName.get("deployment-lineage.json")?.data) ? byName.get("deployment-lineage.json")?.data as Record<string, unknown> : {};
  const certificationSummary = isRecord(byName.get("deployment-certification-summary.json")?.data) ? byName.get("deployment-certification-summary.json")?.data as Record<string, unknown> : {};
  const governanceReplay = isRecord(byName.get("deployment-governance-replay.json")?.data) ? byName.get("deployment-governance-replay.json")?.data as Record<string, unknown> : {};
  const replayLineage = isRecord(byName.get("deployment-replay-lineage.json")?.data) ? byName.get("deployment-replay-lineage.json")?.data as Record<string, unknown> : {};
  const driftReport = isRecord(byName.get("deployment-drift-report.json")?.data) ? byName.get("deployment-drift-report.json")?.data as Record<string, unknown> : {};
  const replaySummary = isRecord(byName.get("deployment-replay-summary.json")?.data) ? byName.get("deployment-replay-summary.json")?.data as Record<string, unknown> : {};

  const records = [
    latestTelemetry,
    deploymentEvidence,
    certificate,
    checkpoint,
    resume,
    decision,
    decisionSummary,
    enforcement,
    enforcementSummary,
    overrideGovernance,
    overrideRequest,
    overrideSummary,
    auditCertification,
    lineage,
    certificationSummary,
    governanceReplay,
    replayLineage,
    replaySummary,
  ].filter(isRecord);

  for (const field of ["workflowId", "deploymentId", "commitSha"]) {
    reasons.push(...findConflicts(field, records));
  }

  const workflowId = firstValue("workflowId", records);
  const deploymentId = firstValue("deploymentId", records);
  const commitSha = firstValue("commitSha", records);
  const heartbeatAt = asString(latestTelemetry?.heartbeatAt) || null;
  const certificateStatus = normalizeEnum(certificate.certificateStatus || latestTelemetry?.certificateStatus, ALLOWED_CERTIFICATE_STATUSES);
  const checkpointStatus = normalizeEnum(checkpoint.checkpointStatus || latestTelemetry?.checkpointStatus, ALLOWED_CHECKPOINT_STATUSES);
  const resumeEligibility = normalizeEnum(resume.resumeEligibility || checkpoint.resumeEligibility || latestTelemetry?.resumeEligibility, ALLOWED_RESUME_ELIGIBILITIES);
  const deploymentDecision = normalizeEnum(decision.decision || decisionSummary.decision || latestTelemetry?.deploymentDecision, ALLOWED_DECISIONS);
  const deploymentRisk = normalizeEnum(decision.risk || decisionSummary.risk || latestTelemetry?.deploymentRisk, ALLOWED_RISKS, "UNKNOWN");
  const enforcementMode = normalizeEnum(enforcement.enforcementMode || enforcementSummary.enforcementMode || latestTelemetry?.enforcementMode, ALLOWED_ENFORCEMENT_MODES, "WARN_ONLY") as "READ_ONLY" | "WARN_ONLY" | "ENFORCE_SCOPED";
  const enforcementDecision = normalizeEnum(enforcement.enforcementDecision || enforcementSummary.enforcementDecision || latestTelemetry?.enforcementDecision, ALLOWED_ENFORCEMENT_DECISIONS, "WARN_CONTINUE");
  const enforcementPolicyVersion = asString(enforcement.policyVersion) || asString(enforcementSummary.policyVersion) || asString(latestTelemetry?.enforcementPolicyVersion);
  const enforcementReasons = [
    ...normalizeStringList(enforcement.reasons),
    ...normalizeStringList(enforcementSummary.reasons),
    ...normalizeStringList(latestTelemetry?.enforcementReasons),
  ];
  const deterministicCauses = [
    ...normalizeStringList(enforcement.deterministicCauses),
    ...normalizeStringList(enforcementSummary.deterministicCauses),
    ...normalizeStringList(latestTelemetry?.deterministicCauses),
  ];
  const blocked = normalizeBoolean(enforcement.blocked ?? enforcementSummary.blocked ?? latestTelemetry?.blocked);
  const overrideMode = normalizeEnum(overrideGovernance.overrideMode || overrideSummary.overrideMode || latestTelemetry?.overrideMode, ALLOWED_OVERRIDE_MODES, "OVERRIDE_REQUEST_ONLY") as "OVERRIDE_DISABLED" | "OVERRIDE_REQUEST_ONLY" | "OVERRIDE_ALLOWED_WITH_ARTIFACT";
  const overrideDecision = normalizeEnum(overrideGovernance.overrideDecision || overrideSummary.overrideDecision || latestTelemetry?.overrideDecision, ALLOWED_OVERRIDE_DECISIONS, "NO_OVERRIDE");
  const overridePolicyVersion = asString(overrideGovernance.policyVersion) || asString(overrideSummary.policyVersion) || asString(latestTelemetry?.overridePolicyVersion);
  const operatorId = asString(overrideGovernance.operatorId) || asString(overrideSummary.operatorId) || asString(latestTelemetry?.operatorId);
  const approvalReason = asString(overrideGovernance.approvalReason);
  const approvalArtifactHash = asString(overrideGovernance.approvalArtifactHash) || asString(overrideSummary.approvalArtifactHash);
  const overrideExpiresAt = asString(overrideGovernance.expiresAt) || asString(overrideSummary.expiresAt) || asString(latestTelemetry?.overrideExpiresAt);
  const overrideReasons = [
    ...normalizeStringList(overrideGovernance.reasons),
    ...normalizeStringList(overrideSummary.reasons),
    ...normalizeStringList(latestTelemetry?.overrideReasons),
  ];
  const sourceEnforcementDecision = normalizeEnum(overrideGovernance.sourceEnforcementDecision || overrideSummary.sourceEnforcementDecision || latestTelemetry?.sourceEnforcementDecision, ALLOWED_ENFORCEMENT_DECISIONS, "WARN_CONTINUE");
  const sourceBlocked = normalizeBoolean(overrideGovernance.sourceBlocked ?? overrideSummary.sourceBlocked ?? latestTelemetry?.sourceBlocked);
  const certificationStatus = normalizeEnum(auditCertification.certificationStatus || certificationSummary.certificationStatus || latestTelemetry?.certificationStatus, ALLOWED_CERTIFICATION_STATUSES) as "CERTIFIED" | "PARTIAL" | "DISPUTED" | "FAILED";
  const completenessScore = Number(auditCertification.completenessScore ?? certificationSummary.completenessScore ?? latestTelemetry?.completenessScore ?? 0);
  const evidenceHash = asString(auditCertification.evidenceHash) || asString(certificationSummary.evidenceHash) || asString(lineage.evidenceHash) || asString(latestTelemetry?.evidenceHash);
  const lineageHash = asString(auditCertification.lineageHash) || asString(certificationSummary.lineageHash) || asString(lineage.lineageHash) || asString(latestTelemetry?.lineageHash);
  const overrideLineageHash = asString(auditCertification.overrideLineageHash) || asString(certificationSummary.overrideLineageHash) || asString(lineage.overrideLineageHash) || asString(latestTelemetry?.overrideLineageHash);
  const certifiedScopes = normalizeStringList(auditCertification.certifiedScopes);
  const missingScopes = normalizeStringList(auditCertification.missingScopes);
  const certificationPolicyVersion = asString(auditCertification.policyVersion) || asString(certificationSummary.policyVersion) || asString(latestTelemetry?.certificationPolicyVersion);
  const certificationReasons = [
    ...normalizeStringList(auditCertification.reasons),
    ...normalizeStringList(certificationSummary.reasons),
    ...normalizeStringList(latestTelemetry?.certificationReasons),
  ];
  const replayStatus = normalizeEnum(governanceReplay.replayStatus || replaySummary.replayStatus || latestTelemetry?.replayStatus, ALLOWED_REPLAY_STATUSES) as "CONSISTENT" | "PARTIAL" | "DRIFTED" | "DISPUTED" | "FAILED";
  const driftReasonsFromReport = Array.isArray(driftReport.driftReasons)
    ? driftReport.driftReasons.map((entry) => isRecord(entry) ? String(entry.reason || "") : String(entry)).filter(Boolean)
    : [];
  const driftReasons = [
    ...normalizeStringList(governanceReplay.driftReasons).map((reason) => reason),
    ...driftReasonsFromReport,
    ...normalizeStringList(latestTelemetry?.driftReasons),
  ];
  const driftDetected = normalizeBoolean(governanceReplay.driftDetected ?? replaySummary.driftDetected ?? latestTelemetry?.driftDetected);
  const replayHash = asString(governanceReplay.replayHash) || asString(replaySummary.replayHash) || asString(latestTelemetry?.replayHash);
  const expectedLineageHash = asString(governanceReplay.expectedLineageHash) || asString(replaySummary.expectedLineageHash) || asString(replayLineage.expectedLineageHash) || asString(latestTelemetry?.expectedLineageHash);
  const reconstructedLineageHash = asString(governanceReplay.reconstructedLineageHash) || asString(replaySummary.reconstructedLineageHash) || asString(replayLineage.reconstructedLineageHash) || asString(latestTelemetry?.reconstructedLineageHash);
  const reconstructedScopes = normalizeStringList(governanceReplay.reconstructedScopes);
  const replayMissingScopes = normalizeStringList(governanceReplay.missingScopes);
  const replayPolicyVersion = asString(governanceReplay.policyVersion) || asString(replaySummary.policyVersion) || asString(latestTelemetry?.replayPolicyVersion);
  const currentStep = asString(latestTelemetry?.currentStep);
  const currentPartition = asString(latestTelemetry?.currentPartition);
  const lastCompletedPartition = asString(latestTelemetry?.lastCompletedPartition);
  const staleHeartbeat = computeStaleHeartbeat(heartbeatAt, now);

  let overallState = normalizeState(latestTelemetry?.state || deploymentEvidence.latestState || deploymentSummary.latestState || decision.state);
  if (overallState === "DISPUTED" && latestTelemetry?.state && String(latestTelemetry.state).trim().toUpperCase() !== "DISPUTED") {
    reasons.push("UNKNOWN_STATE");
  }
  if (!workflowId) reasons.push("EVIDENCE_REQUIRED_FIELD_MISSING:workflowId");
  if (!deploymentId) reasons.push("EVIDENCE_REQUIRED_FIELD_MISSING:deploymentId");
  if (!commitSha) reasons.push("EVIDENCE_REQUIRED_FIELD_MISSING:commitSha");
  if (certificateStatus === "DISPUTED") reasons.push("CERTIFICATE_STATUS_DISPUTED");
  if (checkpointStatus === "DISPUTED") reasons.push("CHECKPOINT_STATUS_DISPUTED");
  if (resumeEligibility === "DISPUTED") reasons.push("RESUME_ELIGIBILITY_DISPUTED");
  if (deploymentDecision === "DISPUTED") reasons.push("DEPLOYMENT_DECISION_DISPUTED");
  if (enforcementDecision === "DISPUTED_NO_BLOCK") reasons.push("ENFORCEMENT_DISPUTED_NO_BLOCK");
  if (overrideDecision === "OVERRIDE_DISPUTED") reasons.push("OVERRIDE_GOVERNANCE_DISPUTED");
  if (certificationStatus === "DISPUTED") reasons.push("AUDIT_CERTIFICATION_DISPUTED");
  if (certificationStatus === "FAILED") reasons.push("AUDIT_CERTIFICATION_FAILED");
  if (replayStatus === "DRIFTED") reasons.push("GOVERNANCE_REPLAY_DRIFTED");
  if (replayStatus === "DISPUTED") reasons.push("GOVERNANCE_REPLAY_DISPUTED");
  if (replayStatus === "FAILED") reasons.push("GOVERNANCE_REPLAY_FAILED");
  if (staleHeartbeat) reasons.push("HEARTBEAT_STALE_OR_MISSING");

  const evidenceAvailable = parsed.every((artifact) => artifact.summary.available && !artifact.summary.malformed);
  const disputedReasons = [...new Set(reasons)];
  if (!evidenceAvailable || disputedReasons.length > 0) {
    overallState = "DISPUTED";
  }

  return {
    workflowId,
    deploymentId,
    commitSha,
    overallState,
    certificateStatus,
    checkpointStatus,
    resumeEligibility,
    deploymentDecision,
    deploymentRisk,
    enforcementMode,
    enforcementDecision,
    enforcementPolicyVersion,
    enforcementReasons: [...new Set(enforcementReasons)],
    deterministicCauses: [...new Set(deterministicCauses)],
    blocked,
    overrideMode,
    overrideDecision,
    overridePolicyVersion,
    operatorId,
    approvalReasonPresent: Boolean(approvalReason),
    approvalArtifactHash,
    overrideExpiresAt,
    overrideReasons: [...new Set(overrideReasons)],
    sourceEnforcementDecision,
    sourceBlocked,
    certificationStatus,
    completenessScore,
    evidenceHash,
    lineageHash,
    overrideLineageHash,
    certifiedScopes: [...new Set(certifiedScopes)],
    missingScopes: [...new Set(missingScopes)],
    certificationReasons: [...new Set(certificationReasons)],
    certificationPolicyVersion,
    replayStatus,
    driftDetected,
    driftReasons: [...new Set(driftReasons)],
    replayHash,
    expectedLineageHash,
    reconstructedLineageHash,
    reconstructedScopes: [...new Set(reconstructedScopes)],
    replayMissingScopes: [...new Set(replayMissingScopes)],
    replayPolicyVersion,
    currentStep,
    currentPartition,
    lastCompletedPartition,
    heartbeatAt,
    staleHeartbeat,
    evidenceAvailable,
    disputedReasons,
    artifacts: parsed.map((artifact) => artifact.summary),
    timeline,
  };
}
