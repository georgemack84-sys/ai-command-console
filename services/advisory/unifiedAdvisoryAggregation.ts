import { hashPayloadDeterministically } from "../contracts/payloadHasher";
import type { DhReleaseCertificationAdapterResult } from "../release-certification";
import type { DeploymentOverrunAdvisoryResult } from "../deployment-overrun";
import type { OperationalRulesAdvisoryResult } from "../operational-rules";

export type UnifiedAdvisoryStatus = "NORMAL" | "WATCH" | "CAUTION" | "ESCALATE" | "DISPUTED" | "FAILED";

export type UnifiedAdvisoryRisk = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | "UNKNOWN";

export type AdvisorySource = "RELEASE_CERTIFICATION" | "OPERATIONAL_RULES" | "DEPLOYMENT_OVERRUN";

export type UnifiedAdvisorySourceStatus = Readonly<{
  source: AdvisorySource;
  status: string;
  risk?: string;
  evidenceHash?: string;
  advisoryHash?: string;
  present: boolean;
}>;

export type UnifiedAdvisoryConflict = Readonly<{
  source: AdvisorySource;
  reason: string;
}>;

export type UnifiedAdvisoryAggregationResult = Readonly<{
  status: UnifiedAdvisoryStatus;
  risk: UnifiedAdvisoryRisk;
  sourceStatuses: readonly UnifiedAdvisorySourceStatus[];
  advisoryHash: string;
  evidenceRefs: readonly string[];
  reasons: readonly string[];
  conflicts: readonly UnifiedAdvisoryConflict[];
  replayable: boolean;
  authority: "ADVISORY_ONLY";
  mayDeploy: false;
  mayBlockDeployment: false;
  mayRetry: false;
  mayCancel: false;
  mayRollback: false;
  mayResume: false;
  requiresExplicitEnforcementPhase: true;
}>;

export type UnifiedAdvisoryAggregationInput = Readonly<{
  releaseCertification?: Partial<DhReleaseCertificationAdapterResult> & Record<string, unknown>;
  operationalRules?: Partial<OperationalRulesAdvisoryResult> & Record<string, unknown>;
  deploymentOverrun?: Partial<DeploymentOverrunAdvisoryResult> & Record<string, unknown>;
}>;

type SourceInput = NonNullable<
  UnifiedAdvisoryAggregationInput["releaseCertification"]
  | UnifiedAdvisoryAggregationInput["operationalRules"]
  | UnifiedAdvisoryAggregationInput["deploymentOverrun"]
>;

const SOURCE_ORDER: readonly AdvisorySource[] = [
  "RELEASE_CERTIFICATION",
  "OPERATIONAL_RULES",
  "DEPLOYMENT_OVERRUN",
];

const STATUS_RANK: Record<UnifiedAdvisoryStatus, number> = {
  NORMAL: 0,
  WATCH: 1,
  CAUTION: 2,
  ESCALATE: 3,
  DISPUTED: 4,
  FAILED: 5,
};

const RISK_RANK: Record<UnifiedAdvisoryRisk, number> = {
  LOW: 0,
  MEDIUM: 1,
  HIGH: 2,
  CRITICAL: 3,
  UNKNOWN: 4,
};

function sha256(value: unknown) {
  return `sha256:${hashPayloadDeterministically(value)}`;
}

function asString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

function normalizeRefs(refs: readonly unknown[]) {
  return [...new Set(refs.flat().filter((value): value is string => typeof value === "string" && value.trim().length > 0))].sort();
}

function normalizeStatus(value: unknown): UnifiedAdvisoryStatus | null {
  switch (value) {
    case "COMPATIBLE":
    case "SAFE":
    case "NORMAL":
      return "NORMAL";
    case "PARTIAL":
    case "WATCH":
      return "WATCH";
    case "CAUTION":
      return "CAUTION";
    case "ESCALATE":
      return "ESCALATE";
    case "DISPUTED":
      return "DISPUTED";
    case "FAILED":
      return "FAILED";
    default:
      return null;
  }
}

function normalizeRisk(value: unknown, status: UnifiedAdvisoryStatus | null): UnifiedAdvisoryRisk | null {
  switch (value) {
    case undefined:
    case null:
      break;
    case "LOW":
    case "MEDIUM":
    case "HIGH":
    case "CRITICAL":
    case "UNKNOWN":
      return value;
    default:
      return null;
  }

  switch (status) {
    case "NORMAL":
      return "LOW";
    case "WATCH":
    case "CAUTION":
      return "MEDIUM";
    case "ESCALATE":
      return "HIGH";
    case "DISPUTED":
    case "FAILED":
      return "UNKNOWN";
    default:
      return null;
  }
}

function statusValue(source: AdvisorySource, input: SourceInput) {
  if (source === "RELEASE_CERTIFICATION") return input.status;
  return input.advisoryStatus;
}

function sourceEvidenceHash(source: AdvisorySource, input: SourceInput) {
  if (source === "RELEASE_CERTIFICATION") {
    return asString(input.evidenceHash) || asString(input.auditCertificationHash) || asString(input.governanceReplayHash);
  }
  return asString(input.evidenceHash);
}

function sourceAdvisoryHash(source: AdvisorySource, input: SourceInput) {
  if (source === "RELEASE_CERTIFICATION") {
    return asString(input.governanceReplayHash) || asString(input.auditCertificationHash) || asString(input.evidenceHash);
  }
  if (source === "OPERATIONAL_RULES") {
    return asString(input.ruleHash) || asString(input.evidenceHash);
  }
  return asString(input.advisoryHash) || asString(input.evidenceHash);
}

function sourceEvidenceRefs(source: AdvisorySource, input: SourceInput) {
  if (Array.isArray(input.evidenceRefs)) return input.evidenceRefs;
  if (source === "RELEASE_CERTIFICATION" && Array.isArray(input.mappedArtifacts)) {
    return input.mappedArtifacts
      .map((artifact) => {
        if (!artifact || typeof artifact !== "object") return null;
        const record = artifact as Record<string, unknown>;
        return `${String(record.sourceName || "unknown")}:${String(record.hash || record.present || "missing")}`;
      })
      .filter((value): value is string => Boolean(value));
  }
  return [];
}

function hasAuthorityLeak(source: AdvisorySource, input: SourceInput): readonly UnifiedAdvisoryConflict[] {
  const keys: readonly string[] = source === "RELEASE_CERTIFICATION"
    ? ["mayBlockDeployment", "mayTriggerRetry", "mayTriggerRollback"]
    : ["mayDeploy", "mayRetry", "mayCancel", "mayRollback", "mayResume"];

  return keys
    .filter((key) => input[key] === true)
    .map((key) => ({ source, reason: `AUTHORITY_LEAK:${key}` }));
}

function isReplayable(source: AdvisorySource, input: SourceInput) {
  if (source === "RELEASE_CERTIFICATION") {
    return input.status !== "FAILED" && input.status !== "DISPUTED" && input.replayEvidenceAvailable !== false;
  }
  return input.replayable !== false;
}

function hasStatusRiskContradiction(statusText: string | null, normalizedRisk: UnifiedAdvisoryRisk | null) {
  return (
    ((statusText === "SAFE" || statusText === "COMPATIBLE" || statusText === "NORMAL") && normalizedRisk === "CRITICAL") ||
    (statusText === "FAILED" && normalizedRisk === "LOW")
  );
}

function sourceByName(input: UnifiedAdvisoryAggregationInput, source: AdvisorySource) {
  if (source === "RELEASE_CERTIFICATION") return input.releaseCertification;
  if (source === "OPERATIONAL_RULES") return input.operationalRules;
  return input.deploymentOverrun;
}

function strictestStatus(statuses: readonly UnifiedAdvisoryStatus[]) {
  return statuses.reduce<UnifiedAdvisoryStatus>(
    (strictest, status) => (STATUS_RANK[status] > STATUS_RANK[strictest] ? status : strictest),
    "NORMAL",
  );
}

function strictestRisk(risks: readonly UnifiedAdvisoryRisk[]) {
  return risks.reduce<UnifiedAdvisoryRisk>(
    (strictest, risk) => (RISK_RANK[risk] > RISK_RANK[strictest] ? risk : strictest),
    "LOW",
  );
}

export function aggregateUnifiedAdvisory(input: UnifiedAdvisoryAggregationInput): UnifiedAdvisoryAggregationResult {
  const conflicts: UnifiedAdvisoryConflict[] = [];
  const reasons: string[] = [];
  const sourceStatuses: UnifiedAdvisorySourceStatus[] = [];
  const normalizedStatuses: UnifiedAdvisoryStatus[] = [];
  const normalizedRisks: UnifiedAdvisoryRisk[] = [];
  const evidenceRefs: unknown[] = [];

  for (const source of SOURCE_ORDER) {
    const sourceInput = sourceByName(input, source);
    if (!sourceInput) {
      conflicts.push({ source, reason: "SOURCE_MISSING" });
      sourceStatuses.push({ source, status: "MISSING", present: false });
      normalizedStatuses.push("FAILED");
      normalizedRisks.push("UNKNOWN");
      continue;
    }

    const rawStatus = statusValue(source, sourceInput);
    const status = normalizeStatus(rawStatus);
    const risk = normalizeRisk(sourceInput.risk, status);
    const evidenceHash = sourceEvidenceHash(source, sourceInput);
    const advisoryHash = sourceAdvisoryHash(source, sourceInput);

    if (!status) {
      conflicts.push({ source, reason: `UNKNOWN_STATUS:${String(rawStatus)}` });
      normalizedStatuses.push("DISPUTED");
    } else {
      normalizedStatuses.push(status);
    }

    if (!risk) {
      conflicts.push({ source, reason: `UNKNOWN_RISK:${String(sourceInput.risk)}` });
      normalizedStatuses.push("DISPUTED");
      normalizedRisks.push("UNKNOWN");
    } else {
      normalizedRisks.push(risk);
    }

    if (!isReplayable(source, sourceInput)) {
      conflicts.push({ source, reason: "SOURCE_NOT_REPLAYABLE" });
      normalizedStatuses.push("DISPUTED");
      normalizedRisks.push("UNKNOWN");
    }

    if (!evidenceHash) {
      conflicts.push({ source, reason: "SOURCE_EVIDENCE_HASH_MISSING" });
      normalizedStatuses.push("DISPUTED");
      normalizedRisks.push("UNKNOWN");
    }

    conflicts.push(...hasAuthorityLeak(source, sourceInput));

    if (hasStatusRiskContradiction(asString(rawStatus), risk)) {
      conflicts.push({ source, reason: `STATUS_RISK_CONTRADICTION:${String(rawStatus)}:${String(risk)}` });
      normalizedStatuses.push("DISPUTED");
      normalizedRisks.push("UNKNOWN");
    }

    evidenceRefs.push(sourceEvidenceRefs(source, sourceInput));
    sourceStatuses.push({
      source,
      status: String(rawStatus),
      ...(risk ? { risk } : {}),
      ...(evidenceHash ? { evidenceHash } : {}),
      ...(advisoryHash ? { advisoryHash } : {}),
      present: true,
    });
  }

  if (conflicts.some((conflict) => conflict.reason.startsWith("AUTHORITY_LEAK:"))) {
    normalizedStatuses.push("DISPUTED");
    normalizedRisks.push("UNKNOWN");
  }

  const status = strictestStatus(normalizedStatuses);
  const risk = strictestRisk(normalizedRisks);
  reasons.push(`STRICTEST_STATUS:${status}`);
  reasons.push(`STRICTEST_RISK:${risk}`);
  for (const conflict of conflicts) {
    reasons.push(`${conflict.source}:${conflict.reason}`);
  }

  const normalizedEvidenceRefs = normalizeRefs(evidenceRefs);
  const normalizedConflicts = [...conflicts].sort((left, right) => (
    `${left.source}:${left.reason}`.localeCompare(`${right.source}:${right.reason}`)
  ));
  const normalizedReasons = [...new Set(reasons)].sort();
  const advisoryHash = sha256({
    conflicts: normalizedConflicts,
    evidenceRefs: normalizedEvidenceRefs,
    reasons: normalizedReasons,
    sources: sourceStatuses.map((source) => ({
      advisoryHash: source.advisoryHash ?? null,
      evidenceHash: source.evidenceHash ?? null,
      present: source.present,
      risk: source.risk ?? null,
      source: source.source,
      status: source.status,
    })),
    status,
    risk,
  });

  return Object.freeze({
    status,
    risk,
    sourceStatuses: Object.freeze(sourceStatuses),
    advisoryHash,
    evidenceRefs: Object.freeze(normalizedEvidenceRefs),
    reasons: Object.freeze(normalizedReasons),
    conflicts: Object.freeze(normalizedConflicts),
    replayable: status !== "FAILED" && status !== "DISPUTED",
    authority: "ADVISORY_ONLY",
    mayDeploy: false,
    mayBlockDeployment: false,
    mayRetry: false,
    mayCancel: false,
    mayRollback: false,
    mayResume: false,
    requiresExplicitEnforcementPhase: true,
  });
}
