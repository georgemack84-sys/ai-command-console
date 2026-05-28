import type { RecoveryReadModel, RecoveryReadModelResult } from "../../types/recoveryReadModel";
import {
  READ_MODEL_ERRORS,
  READ_MODEL_WARNINGS,
  STALE_LOCK_THRESHOLD_MS,
  UNKNOWN_STATUS,
} from "../../constants/recoveryReadModel.constants";
import * as store from "./recoveryReadModelStore";
import type { TenantContext } from "../tenancy/tenantTypes";
import { ensureTenantOwnedExecution, registerTenantOwnedExecution } from "../tenancy/tenantResourceScope";
import { TenantScopeError } from "../tenancy/tenantErrors";

type MaybeNumber = number | undefined;

function failClosed(warnings: string[] = []): RecoveryReadModelResult {
  return {
    ok: false,
    error: READ_MODEL_ERRORS.BLOCKED_UNSAFE_RECOVERY_READ_MODEL,
    warnings,
  };
}

function success(data: RecoveryReadModel): RecoveryReadModelResult {
  return { ok: true, data };
}

function toEpochMs(value: unknown): MaybeNumber {
  if (value == null || value === "") {
    return undefined;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  const parsed = Date.parse(String(value));
  return Number.isFinite(parsed) ? parsed : undefined;
}

function clampConfidence(value: unknown): number | undefined {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return undefined;
  }
  if (numeric < 0) {
    return 0;
  }
  if (numeric > 1) {
    return 1;
  }
  return numeric;
}

function ensureArray(value: unknown, warnings: string[], warningCode: string): any[] {
  if (value == null) {
    warnings.push(warningCode);
    return [];
  }
  if (!Array.isArray(value)) {
    throw new Error(`Expected array for ${warningCode}.`);
  }
  return value;
}

function pickLatestBy<T>(values: T[], selector: (value: T) => number): T | null {
  if (!Array.isArray(values) || values.length === 0) {
    return null;
  }
  return [...values].sort((left, right) => selector(right) - selector(left))[0] || null;
}

function latestAuditTimestamp(events: any[]): number {
  const latest = pickLatestBy(events, (event) => toEpochMs(event?.timestamp || event?.createdAt) || 0);
  return toEpochMs(latest?.timestamp || latest?.createdAt) || 0;
}

function mapRecoveryStatus(attempts: any[], warnings: string[]) {
  if (attempts.length === 0) {
    return {
      status: "none" as const,
      latestAttemptId: undefined,
      attemptsCount: 0,
    };
  }
  const latest = pickLatestBy(attempts, (attempt) => Number(attempt?.updatedAt || attempt?.createdAt || attempt?.id || 0));
  const status = String(latest?.status || "").trim().toLowerCase();
  switch (status) {
    case "pending":
      return { status: "pending" as const, latestAttemptId: String(latest?.id), attemptsCount: attempts.length };
    case "running":
      return { status: "in_progress" as const, latestAttemptId: String(latest?.id), attemptsCount: attempts.length };
    case "completed":
      return { status: "completed" as const, latestAttemptId: String(latest?.id), attemptsCount: attempts.length };
    case "failed":
    case "error":
      return { status: "failed" as const, latestAttemptId: String(latest?.id), attemptsCount: attempts.length };
    default:
      warnings.push(READ_MODEL_WARNINGS.UNKNOWN_RECOVERY_STATE);
      return { status: "unknown" as const, latestAttemptId: String(latest?.id || ""), attemptsCount: attempts.length };
  }
}

function mapRecoveryControlStatus(requests: any[], warnings: string[]) {
  if (requests.length === 0) {
    return {
      status: "none" as const,
      latestRequestId: undefined,
      requiresApproval: false,
      latestRequest: null,
    };
  }
  const latest = pickLatestBy(requests, (request) => latestAuditTimestamp(request?.auditEvents || []));
  const status = String(latest?.status || "").trim().toUpperCase();
  switch (status) {
    case "REQUESTED":
      return { status: "requested" as const, latestRequestId: String(latest?.recoveryRequestId), requiresApproval: false, latestRequest: latest };
    case "AWAITING_APPROVAL":
      return { status: "approval_required" as const, latestRequestId: String(latest?.recoveryRequestId), requiresApproval: true, latestRequest: latest };
    case "APPROVED":
      return { status: "approved" as const, latestRequestId: String(latest?.recoveryRequestId), requiresApproval: false, latestRequest: latest };
    case "CANCELLED":
      return { status: "rejected" as const, latestRequestId: String(latest?.recoveryRequestId), requiresApproval: false, latestRequest: latest };
    case "COMMITTED":
      return { status: "completed" as const, latestRequestId: String(latest?.recoveryRequestId), requiresApproval: false, latestRequest: latest };
    case "FAILED":
      return { status: "failed" as const, latestRequestId: String(latest?.recoveryRequestId), requiresApproval: false, latestRequest: latest };
    case "BLOCKED":
      return { status: "failed" as const, latestRequestId: String(latest?.recoveryRequestId), requiresApproval: false, latestRequest: latest };
    default:
      warnings.push(READ_MODEL_WARNINGS.MISSING_RECOVERY_CONTROL);
      return { status: "unknown" as const, latestRequestId: String(latest?.recoveryRequestId || ""), requiresApproval: false, latestRequest: latest };
  }
}

function mapAdvisoryState(advisories: any[], warnings: string[]) {
  if (advisories.length === 0) {
    return {
      status: "none" as const,
      latestAdvisoryId: undefined,
      signalType: undefined,
      recommendation: undefined,
      confidence: undefined,
      requiresOperator: false,
      advisoryOnly: true as const,
    };
  }

  const latest = pickLatestBy(advisories, (advisory) => toEpochMs(advisory?.latestTimestamp) || 0);
  const state = String(latest?.state || "").trim().toUpperCase();
  const rawSignalType = String(latest?.signal?.signalType || latest?.candidate?.signalType || "").trim().toUpperCase();
  const signalType = rawSignalType || undefined;
  const mappedRecommendation = String(latest?.recommendation?.recommendation || latest?.recommendation?.action || "").trim();
  const confidence = clampConfidence(latest?.recommendation?.confidence ?? latest?.signal?.confidence);

  let status: RecoveryReadModel["advisory"]["status"];
  switch (state) {
    case "OPEN":
      status = "open";
      break;
    case "DISMISSED":
      status = "dismissed";
      break;
    case "ESCALATED":
      status = "escalated";
      break;
    case "REQUEST_CREATED":
      status = "request_created";
      break;
    default:
      status = "unknown";
      break;
  }

  const advisorySignal = signalType === undefined
    ? undefined
    : ([
        "STALE_LOCK",
        "EXPIRED_LEASE",
        "FAILED_EXECUTION",
        "INTERRUPTED_ATTEMPT",
        "MISSING_TERMINAL_EVENT",
        "OPERATOR_PAUSED",
        "UNKNOWN",
      ].includes(signalType)
        ? signalType
        : "UNKNOWN") as RecoveryReadModel["advisory"]["signalType"];

  let recommendation = (mappedRecommendation || undefined) as RecoveryReadModel["advisory"]["recommendation"] | undefined;
  let requiresOperator = Boolean(latest?.recommendation?.requiresOperator);

  if (advisorySignal === "UNKNOWN") {
    recommendation = "none";
    requiresOperator = true;
    warnings.push(READ_MODEL_WARNINGS.UNKNOWN_ADVISORY_SIGNAL);
  }

  if (status === "unknown") {
    requiresOperator = true;
  }

  return {
    status,
    latestAdvisoryId: String(latest?.advisoryId || ""),
    signalType: advisorySignal,
    recommendation,
    confidence,
    requiresOperator,
    advisoryOnly: true as const,
  };
}

function mapAutomationState(events: any[]) {
  if (events.length === 0) {
    return {
      status: "none" as const,
      latestAutomationId: undefined,
      automationAllowed: false,
      reason: undefined,
    };
  }
  const latest = pickLatestBy(events, (event) => toEpochMs(event?.timestamp) || 0);
  const type = String(latest?.type || "");
  const policy = latest?.payload?.policy || {};
  const throttle = latest?.payload?.throttle || {};
  if (type === "RECOVERY_AUTOMATION_SUPPRESSED" && throttle?.throttled) {
    return {
      status: "throttled" as const,
      latestAutomationId: String(latest?.id || ""),
      automationAllowed: false,
      reason: String(throttle?.reason || policy?.reason || latest?.payload?.reason || ""),
    };
  }
  if (type === "RECOVERY_AUTOMATION_BLOCKED") {
    return {
      status: "blocked" as const,
      latestAutomationId: String(latest?.id || ""),
      automationAllowed: false,
      reason: String(latest?.payload?.reason || policy?.reason || ""),
    };
  }
  if (type === "RECOVERY_AUTOMATION_SCAN_COMPLETED" && latest?.payload?.dryRun) {
    return {
      status: "dry_run" as const,
      latestAutomationId: String(latest?.id || ""),
      automationAllowed: false,
      reason: "dry_run",
    };
  }
  if (type === "RECOVERY_AUTOMATION_POLICY_EVALUATED" && policy?.allowed === true && policy?.action === "create_request") {
    return {
      status: "eligible" as const,
      latestAutomationId: String(latest?.id || ""),
      automationAllowed: true,
      reason: String(policy?.reason || ""),
    };
  }
  if (type === "RECOVERY_AUTOMATION_REQUEST_OPENED") {
    return {
      status: "eligible" as const,
      latestAutomationId: String(latest?.id || ""),
      automationAllowed: true,
      reason: "request_opened",
    };
  }
  return {
    status: "unknown" as const,
    latestAutomationId: String(latest?.id || ""),
    automationAllowed: false,
    reason: String(policy?.reason || latest?.payload?.reason || UNKNOWN_STATUS),
  };
}

function mapAutonomyState(events: any[]) {
  if (events.length === 0) {
    return {
      status: "none" as const,
      latestAutonomyDecisionId: undefined,
      autonomyAllowed: false,
      reason: undefined,
    };
  }
  const latest = pickLatestBy(events, (event) => toEpochMs(event?.timestamp) || 0);
  const type = String(latest?.type || "");
  const gate = latest?.payload?.gate || {};
  const policy = latest?.payload?.policy || {};

  if (type === "RECOVERY_AUTONOMY_AUTO_APPROVAL_ALLOWED") {
    return {
      status: "allowed" as const,
      latestAutonomyDecisionId: String(latest?.id || ""),
      autonomyAllowed: true,
      reason: String(gate?.reason || policy?.reason || ""),
    };
  }
  if (type === "RECOVERY_AUTONOMY_POLICY_EVALUATED" && policy?.action === "manual_approval_required") {
    return {
      status: "requires_operator" as const,
      latestAutonomyDecisionId: String(latest?.id || ""),
      autonomyAllowed: false,
      reason: String(policy?.reason || ""),
    };
  }
  if (type === "RECOVERY_AUTONOMY_AUTO_APPROVAL_BLOCKED") {
    return {
      status: "blocked" as const,
      latestAutonomyDecisionId: String(latest?.id || ""),
      autonomyAllowed: false,
      reason: String(gate?.reason || policy?.reason || ""),
    };
  }
  return {
    status: "unknown" as const,
    latestAutonomyDecisionId: String(latest?.id || ""),
    autonomyAllowed: false,
    reason: String(gate?.reason || policy?.reason || UNKNOWN_STATUS),
  };
}

function mapVerificationState(events: any[]) {
  if (events.length === 0) {
    return {
      status: "not_run" as const,
      latestVerificationId: undefined,
    };
  }
  const latest = pickLatestBy(events, (event) => toEpochMs(event?.timestamp) || 0);
  const outcome = String(latest?.payload?.verification?.outcome || "").trim().toUpperCase();
  switch (outcome) {
    case "VERIFIED":
      return { status: "passed" as const, latestVerificationId: String(latest?.id || "") };
    case "FAILED":
      return { status: "failed" as const, latestVerificationId: String(latest?.id || "") };
    case "PARTIAL":
      return { status: "failed" as const, latestVerificationId: String(latest?.id || "") };
    case "UNKNOWN":
      return { status: "unknown" as const, latestVerificationId: String(latest?.id || "") };
    case "NO_MUTATION_CONFIRMED":
      return { status: "passed" as const, latestVerificationId: String(latest?.id || "") };
    default:
      return { status: "unknown" as const, latestVerificationId: String(latest?.id || "") };
  }
}

function mapLearningState(events: any[], warnings: string[]) {
  if (events.length === 0) {
    return {
      status: "not_run" as const,
      latestReportId: undefined,
      latestRunId: undefined,
      recommendationCount: 0,
      hasPolicyRecommendations: false,
      hasWarnings: false,
      advisoryOnly: true as const,
    };
  }

  const latest = pickLatestBy(events, (event) => toEpochMs(event?.timestamp) || 0);
  const latestRun = pickLatestBy(
    events.filter((event) => String(event?.type || "") === "RECOVERY_LEARNING_RUN_STARTED"),
    (event) => toEpochMs(event?.timestamp) || 0,
  );
  const latestReport = pickLatestBy(
    events.filter((event) => String(event?.type || "") === "RECOVERY_LEARNING_REPORT_CREATED"),
    (event) => toEpochMs(event?.timestamp) || 0,
  );
  const latestSignals = pickLatestBy(
    events.filter((event) => String(event?.type || "") === "RECOVERY_LEARNING_SIGNALS_AGGREGATED"),
    (event) => toEpochMs(event?.timestamp) || 0,
  );

  const reportRecommendations = Array.isArray(latestReport?.payload?.report?.recommendations)
    ? latestReport.payload.report.recommendations
    : [];
  const signalWarnings = Array.isArray(latestSignals?.payload?.signals?.warnings)
    ? latestSignals.payload.signals.warnings
    : [];
  const hasWarnings = signalWarnings.length > 0
    || Number(latestSignals?.payload?.signals?.totals?.unknown || 0) > 0;

  if (String(latest?.type || "") === "RECOVERY_LEARNING_RUN_FAILED") {
    return {
      status: "failed" as const,
      latestReportId: latestReport?.id ? String(latestReport.id) : undefined,
      latestRunId: latestRun?.id ? String(latestRun.id) : undefined,
      recommendationCount: reportRecommendations.length,
      hasPolicyRecommendations: reportRecommendations.length > 0,
      hasWarnings,
      advisoryOnly: true as const,
    };
  }

  if (latestReport) {
    return {
      status: "report_available" as const,
      latestReportId: String(latestReport.id || ""),
      latestRunId: latestRun?.id ? String(latestRun.id) : undefined,
      recommendationCount: reportRecommendations.length,
      hasPolicyRecommendations: reportRecommendations.length > 0,
      hasWarnings,
      advisoryOnly: true as const,
    };
  }

  warnings.push(READ_MODEL_WARNINGS.UNKNOWN_LEARNING_STATE);
  return {
    status: "unknown" as const,
    latestReportId: undefined,
    latestRunId: latestRun?.id ? String(latestRun.id) : undefined,
    recommendationCount: 0,
    hasPolicyRecommendations: false,
    hasWarnings,
    advisoryOnly: true as const,
  };
}

function deriveLockState(lockRow: any, executionRow: any, nowMs?: number) {
  if (!lockRow && !executionRow?.leaseOwner && !executionRow?.leaseExpiresAt) {
    return {
      isLocked: false,
      leaseExpiresAt: undefined,
      heartbeatAt: undefined,
      ownerId: undefined,
      stale: false,
    };
  }

  const leaseExpiresAt = lockRow?.leaseExpiresAt == null
    ? (executionRow?.leaseExpiresAt == null ? undefined : Number(executionRow.leaseExpiresAt))
    : Number(lockRow.leaseExpiresAt);
  const heartbeatAt = lockRow?.heartbeatAt == null ? undefined : Number(lockRow.heartbeatAt);
  const ownerId = lockRow?.workerId == null
    ? (executionRow?.leaseOwner == null ? undefined : String(executionRow.leaseOwner))
    : String(lockRow.workerId);
  const isLocked = lockRow ? lockRow.lockReleasedAt == null : Boolean(ownerId || leaseExpiresAt);

  let stale = false;
  if (typeof nowMs === "number" && Number.isFinite(nowMs)) {
    if (leaseExpiresAt != null && leaseExpiresAt < nowMs) {
      stale = true;
    }
    if (heartbeatAt != null && heartbeatAt < nowMs - STALE_LOCK_THRESHOLD_MS) {
      stale = true;
    }
  }

  return {
    isLocked,
    leaseExpiresAt,
    heartbeatAt,
    ownerId,
    stale,
  };
}

function deriveUpdatedAt(candidates: Array<unknown>): MaybeNumber {
  const normalized = candidates
    .map((value) => toEpochMs(value))
    .filter((value): value is number => typeof value === "number" && Number.isFinite(value));
  if (normalized.length === 0) {
    return undefined;
  }
  return Math.max(...normalized);
}

export async function buildRecoveryReadModel({
  db,
  executionId,
  nowMs,
  tenantContext,
}: {
  db?: unknown;
  executionId: string;
  nowMs?: number;
  tenantContext?: TenantContext;
}): Promise<RecoveryReadModelResult> {
  try {
    if (typeof executionId !== "string" || !executionId.trim()) {
      return failClosed();
    }
    const warnings: string[] = [];
    const executionState = store.getExecution(executionId);
    if (executionState !== null && typeof executionState !== "object") {
      return failClosed();
    }
    const persistedTenantId = executionState?.execution?.tenantId == null ? null : String(executionState.execution.tenantId).trim();
    const persistedWorkspaceId = executionState?.execution?.workspaceId == null ? null : String(executionState.execution.workspaceId).trim();
    if (tenantContext) {
      if (
        (persistedTenantId && persistedTenantId !== tenantContext.tenantId)
        || (persistedWorkspaceId && persistedWorkspaceId !== tenantContext.workspaceId)
      ) {
        return failClosed(["TENANT_RECOVERY_SCOPE_MISMATCH"]);
      }
      if (persistedTenantId && persistedWorkspaceId) {
        registerTenantOwnedExecution({
          tenantId: persistedTenantId,
          workspaceId: persistedWorkspaceId,
          executionId,
        });
      }
      ensureTenantOwnedExecution({
        tenantContext,
        executionId,
      });
    }

    const recoveryAttempts = ensureArray(store.getRecoveryAttempts(executionId), warnings, READ_MODEL_WARNINGS.MISSING_RECOVERY_ATTEMPTS);
    const recoveryRequests = ensureArray(store.getRecoveryControlRequests(executionId), warnings, READ_MODEL_WARNINGS.MISSING_RECOVERY_CONTROL);
    const advisories = ensureArray(store.getRecoveryAdvisories(executionId), warnings, READ_MODEL_WARNINGS.MISSING_ADVISORY_STATE);
    const automationEvents = ensureArray(store.getAutomationState(executionId), warnings, READ_MODEL_WARNINGS.MISSING_AUTOMATION_STATE);
    const autonomyEvents = ensureArray(store.getAutonomyState(executionId), warnings, READ_MODEL_WARNINGS.MISSING_AUTONOMY_STATE);
    const verificationEvents = ensureArray(store.getVerificationResults(executionId), warnings, READ_MODEL_WARNINGS.MISSING_VERIFICATION_STATE);
    const learningEvents = ensureArray(store.getLearningReports(executionId), warnings, READ_MODEL_WARNINGS.MISSING_LEARNING_STATE);
    const ledgerEvents = ensureArray(store.getLedgerEvents(executionId), warnings, READ_MODEL_WARNINGS.MISSING_LEDGER);
    const executionRow = executionState?.execution || null;
    const lockRow = store.getLock(executionId);

    const execution = executionRow
      ? {
          status: String(executionRow.status || UNKNOWN_STATUS),
          startedAt: toEpochMs(executionRow.startedAt),
          completedAt: toEpochMs(executionRow.finishedAt),
        }
      : {
          status: UNKNOWN_STATUS,
          startedAt: undefined,
          completedAt: undefined,
        };

    if (!executionRow) {
      warnings.push(READ_MODEL_WARNINGS.MISSING_EXECUTION);
    }
    if (ledgerEvents.length === 0) {
      warnings.push(READ_MODEL_WARNINGS.MISSING_LEDGER);
    }

    const recovery = mapRecoveryStatus(recoveryAttempts, warnings);
    const advisory = mapAdvisoryState(advisories, warnings);
    const autonomy = mapAutonomyState(autonomyEvents);
    const recoveryControlBase = mapRecoveryControlStatus(recoveryRequests, warnings);
    const recoveryControl = {
      status: recoveryControlBase.status,
      latestRequestId: recoveryControlBase.latestRequestId,
      requiresApproval:
        recoveryControlBase.requiresApproval
        || advisory.requiresOperator
        || autonomy.status === "requires_operator",
    };
    const automation = mapAutomationState(automationEvents);
    const verification = mapVerificationState(verificationEvents);
    const learning = mapLearningState(learningEvents, warnings);
    const lock = deriveLockState(lockRow, executionRow, nowMs);

    const latestLedger = pickLatestBy(ledgerEvents, (event) => Number(event?.createdAt || 0));
    const ledger = {
      totalEvents: ledgerEvents.length,
      lastEventType: latestLedger?.eventType == null ? undefined : String(latestLedger.eventType),
      lastEventAt: latestLedger?.createdAt == null ? undefined : Number(latestLedger.createdAt),
    };

    const risk = {
      hasFailure: execution.status === "failed",
      hasVerificationFailure: verification.status === "failed",
      hasStaleLock: lock.stale === true,
      hasOpenAdvisory: advisory.status === "open" || advisory.status === "escalated",
      hasUnsafeUnknown:
        execution.status === UNKNOWN_STATUS
        || recovery.status === "unknown"
        || recoveryControl.status === "unknown"
        || advisory.status === "unknown"
        || advisory.signalType === "UNKNOWN"
        || automation.status === "unknown"
        || autonomy.status === "unknown"
        || verification.status === "unknown"
        || learning.status === "unknown",
      hasLearningWarnings: learning.hasWarnings === true,
      requiresOperatorAttention: false,
    };
    risk.requiresOperatorAttention =
      risk.hasFailure
      || risk.hasVerificationFailure
      || risk.hasStaleLock
      || risk.hasOpenAdvisory
      || risk.hasLearningWarnings
      || recoveryControl.requiresApproval
      || advisory.requiresOperator
      || autonomy.status === "requires_operator";

    const updatedAt = deriveUpdatedAt([
      executionRow?.lastUpdatedAt,
      executionRow?.startedAt,
      executionRow?.finishedAt,
      lockRow?.heartbeatAt,
      lockRow?.leaseExpiresAt,
      ...ledgerEvents.map((event) => event?.createdAt),
      ...recoveryAttempts.map((attempt) => attempt?.updatedAt ?? attempt?.createdAt),
      ...recoveryRequests.map((request) => latestAuditTimestamp(request?.auditEvents || [])),
      ...advisories.map((advisory) => advisory?.latestTimestamp),
      ...automationEvents.map((event) => event?.timestamp),
      ...autonomyEvents.map((event) => event?.timestamp),
      ...verificationEvents.map((event) => event?.timestamp),
      ...learningEvents.map((event) => event?.timestamp),
    ]);

    const model: RecoveryReadModel = {
      executionId: String(executionId),
      execution,
      recovery,
      recoveryControl,
      advisory,
      automation,
      autonomy,
      verification,
      learning,
      lock,
      ledger,
      risk,
      meta: {
        updatedAt,
        completeness: warnings.length === 0 ? "complete" : "partial",
        warnings: Array.from(new Set(warnings)),
      },
    };

    return success(model);
  } catch (error) {
    if (error instanceof TenantScopeError) {
      return failClosed([error.code]);
    }
    return failClosed();
  }
}
