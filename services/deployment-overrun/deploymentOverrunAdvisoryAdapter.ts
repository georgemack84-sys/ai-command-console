import type { OperationalRulesAdvisoryResult } from "../operational-rules";
import { hashDeploymentOverrunEvidence } from "./deploymentOverrunEvidence";
import type { DeploymentOverrunEvaluation } from "./types";

export type OverrunAdvisoryStatus = "NORMAL" | "WATCH" | "CAUTION" | "ESCALATE" | "DISPUTED" | "FAILED";

export type OverrunRisk = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | "UNKNOWN";

export type DeploymentOverrunAdvisoryResult = Readonly<{
  advisoryStatus: OverrunAdvisoryStatus;
  risk: OverrunRisk;
  evidenceHash: string;
  advisoryHash: string;
  evidenceRefs: readonly string[];
  advisoryReasons: readonly string[];
  durationMs?: number;
  replayable: boolean;
  authority: "ADVISORY_ONLY";
  mayCancel: false;
  mayRetry: false;
  mayRollback: false;
  mayResume: false;
  mayDeploy: false;
  requiresExplicitEnforcementPhase: true;
}>;

export type DeploymentOverrunAdvisoryInput = Readonly<{
  evaluation: Partial<DeploymentOverrunEvaluation> & Record<string, unknown>;
  operationalRules?: OperationalRulesAdvisoryResult;
  evidenceRefs?: readonly string[];
  expectedEvidenceHash?: string;
}>;

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function normalizeRefs(refs: readonly string[] | undefined) {
  return [...new Set((refs || []).filter(isNonEmptyString))].sort();
}

function normalizeReasons(reasons: unknown) {
  return Array.isArray(reasons) ? reasons.filter(isNonEmptyString).sort() : [];
}

function hasPolicyFlag(evaluation: Record<string, unknown>, key: string) {
  const policy = evaluation.operatorActions;
  if (policy && typeof policy === "object" && key in policy) {
    return (policy as Record<string, unknown>)[key] === true;
  }
  return evaluation[key] === true;
}

function containmentFrozen(evaluation: Record<string, unknown>) {
  const containment = evaluation.containment;
  return Boolean(containment && typeof containment === "object" && (containment as Record<string, unknown>).frozen === true);
}

function durationMs(evaluation: Record<string, unknown>) {
  const evidence = evaluation.evidence;
  if (!evidence || typeof evidence !== "object") return undefined;
  const startedAt = (evidence as Record<string, unknown>).startedAt;
  const observedAt = (evidence as Record<string, unknown>).observedAt;
  if (!isNonEmptyString(startedAt) || !isNonEmptyString(observedAt)) return undefined;
  const started = Date.parse(startedAt);
  const observed = Date.parse(observedAt);
  if (Number.isNaN(started) || Number.isNaN(observed)) return undefined;
  return Math.max(0, observed - started);
}

function sourceEvidenceHash(evaluation: Record<string, unknown>) {
  const evidence = evaluation.evidence;
  if (!evidence || typeof evidence !== "object") return "";
  const evidenceHash = (evidence as Record<string, unknown>).evidenceHash;
  return isNonEmptyString(evidenceHash) ? evidenceHash : "";
}

function hasReplayDispute(evaluation: Record<string, unknown>, reasons: readonly string[]) {
  const evidence = evaluation.evidence;
  if (!evidence || typeof evidence !== "object") return false;
  return reasons.includes("RUNTIME_REPLAY_MISMATCH") || (evidence as Record<string, unknown>).state === "DISPUTED";
}

function hasMissingCriticalEvidence(reasons: readonly string[], evidenceHash: string) {
  return !evidenceHash || reasons.includes("LOG_EVIDENCE_MISSING") || reasons.includes("REPLAY_EVIDENCE_MISSING");
}

function deriveStatus(reasons: readonly string[], evidenceHash: string, hashMismatch: boolean, state: unknown): OverrunAdvisoryStatus {
  if (hasMissingCriticalEvidence(reasons, evidenceHash)) return "FAILED";
  if (hashMismatch || reasons.some((reason) => reason.includes("MISMATCH"))) return "DISPUTED";
  if (
    state === "STALLED" ||
    state === "TIMEOUT_FAILURE" ||
    state === "DISPUTED" ||
    state === "BLOCKED" ||
    reasons.includes("HEARTBEAT_MISSING") ||
    reasons.includes("DUPLICATE_DEPLOYMENT_ATTEMPT") ||
    reasons.includes("RELEASE_GATE_NOT_PASSED")
  ) {
    return "ESCALATE";
  }
  if (state === "POSSIBLY_STUCK" || state === "POSSIBLE_STUCK") return "CAUTION";
  if (state === "OBSERVE_ONLY" || state === "ACTIVE_SLOW") return "WATCH";
  return "NORMAL";
}

function deriveRisk(status: OverrunAdvisoryStatus, reasons: readonly string[]): OverrunRisk {
  if (status === "FAILED" || status === "DISPUTED") return "UNKNOWN";
  if (reasons.includes("DUPLICATE_DEPLOYMENT_ATTEMPT") || reasons.includes("RELEASE_GATE_NOT_PASSED")) return "CRITICAL";
  if (status === "ESCALATE") return "HIGH";
  if (status === "CAUTION") return "HIGH";
  if (status === "WATCH") return "MEDIUM";
  return "LOW";
}

function buildAdvisoryHash(input: {
  advisoryStatus: OverrunAdvisoryStatus;
  risk: OverrunRisk;
  evidenceHash: string;
  evidenceRefs: readonly string[];
  advisoryReasons: readonly string[];
  durationMs?: number;
}) {
  return hashDeploymentOverrunEvidence({
    evidenceVersion: "1.0",
    workflowId: "deployment-overrun-advisory",
    workflowName: "Deployment overrun advisory",
    runId: input.evidenceHash || "missing-evidence",
    commitSha: input.risk,
    state: input.advisoryStatus === "FAILED" ? "FAILED" : input.advisoryStatus === "DISPUTED" ? "DISPUTED" : "RUNNING",
    startedAt: "1970-01-01T00:00:00.000Z",
    updatedAt: "1970-01-01T00:00:00.000Z",
    observedAt: "1970-01-01T00:00:00.000Z",
    approvalLineage: input.evidenceRefs,
    logs: input.advisoryReasons.map((reason) => ({ at: "1970-01-01T00:00:00.000Z", message: reason })),
    artifacts: [{ name: "deployment-overrun-advisory", hash: input.evidenceHash || "sha256:missing" }],
    reasons: input.advisoryReasons,
    telemetry: {
      workflow_id: "deployment-overrun-advisory",
      run_id: input.evidenceHash || "missing-evidence",
      started_at: "1970-01-01T00:00:00.000Z",
      updated_at: "1970-01-01T00:00:00.000Z",
      state: input.advisoryStatus === "FAILED" ? "FAILED" : input.advisoryStatus === "DISPUTED" ? "DISPUTED" : "RUNNING",
      heartbeat_age: null,
      evidence_status: input.evidenceHash ? "PRESENT" : "MISSING",
      elapsedMinutes: input.durationMs ? Math.floor(input.durationMs / 60_000) : 0,
      latestLogs: [],
    },
    containment: {
      frozen: false,
      blockRetries: false,
      blockNewDeploys: false,
      blockForcePushAutomation: false,
      preserveLogs: false,
      preserveArtifacts: false,
      preserveCertificationLineage: false,
    },
  });
}

export function adaptDeploymentOverrunToAdvisory(
  input: DeploymentOverrunAdvisoryInput,
): DeploymentOverrunAdvisoryResult {
  const evaluation = input.evaluation;
  const baseReasons = normalizeReasons(evaluation.reasons);
  const evidenceHash = sourceEvidenceHash(evaluation);
  const reasons = [...baseReasons];

  if (!evidenceHash) reasons.push("DEPLOYMENT_OVERRUN_EVIDENCE_MISSING");
  if (input.expectedEvidenceHash && input.expectedEvidenceHash !== evidenceHash) {
    reasons.push("DEPLOYMENT_OVERRUN_EVIDENCE_HASH_MISMATCH");
  }

  if (hasPolicyFlag(evaluation, "cancelAllowed")) reasons.push("CANCEL_RECOMMENDATION_NORMALIZED_TO_ADVISORY");
  if (hasPolicyFlag(evaluation, "retryAllowed")) reasons.push("RETRY_RECOMMENDATION_NORMALIZED_TO_ADVISORY");
  if (hasPolicyFlag(evaluation, "newDeployAllowed")) reasons.push("REDEPLOY_RECOMMENDATION_NORMALIZED_TO_ADVISORY");
  if (hasPolicyFlag(evaluation, "rollbackAllowed")) reasons.push("ROLLBACK_RECOMMENDATION_NORMALIZED_TO_ADVISORY");
  if (hasPolicyFlag(evaluation, "resumeAllowed")) reasons.push("RESUME_RECOMMENDATION_NORMALIZED_TO_ADVISORY");

  if (baseReasons.includes("HEARTBEAT_MISSING")) {
    reasons.push("HEARTBEAT_GAP_REQUIRES_OPERATOR_REVIEW");
  }
  if (containmentFrozen(evaluation)) {
    reasons.push("CONTAINMENT_RECOMMENDATION_RECORDED_AS_ADVISORY");
  }
  if (hasReplayDispute(evaluation, baseReasons)) {
    reasons.push("CONFLICTING_EVIDENCE_REQUIRES_OPERATOR_REVIEW");
  }
  if (input.operationalRules) {
    reasons.push(`OPERATIONAL_RULES_ADVISORY_REF:${input.operationalRules.advisoryStatus}`);
  }

  const advisoryReasons = [...new Set(reasons)].sort();
  const hashMismatch = advisoryReasons.includes("DEPLOYMENT_OVERRUN_EVIDENCE_HASH_MISMATCH");
  const status = deriveStatus(advisoryReasons, evidenceHash, hashMismatch, evaluation.state);
  const risk = deriveRisk(status, advisoryReasons);
  const refs = normalizeRefs(input.evidenceRefs);
  const elapsed = durationMs(evaluation);

  return Object.freeze({
    advisoryStatus: status,
    risk,
    evidenceHash,
    advisoryHash: buildAdvisoryHash({
      advisoryStatus: status,
      risk,
      evidenceHash,
      evidenceRefs: refs,
      advisoryReasons,
      durationMs: elapsed,
    }),
    evidenceRefs: Object.freeze(refs),
    advisoryReasons: Object.freeze(advisoryReasons),
    ...(elapsed !== undefined ? { durationMs: elapsed } : {}),
    replayable: status !== "FAILED" && status !== "DISPUTED",
    authority: "ADVISORY_ONLY",
    mayCancel: false,
    mayRetry: false,
    mayRollback: false,
    mayResume: false,
    mayDeploy: false,
    requiresExplicitEnforcementPhase: true,
  });
}
