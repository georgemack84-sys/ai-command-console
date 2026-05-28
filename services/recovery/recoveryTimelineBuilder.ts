import type { RecoveryReadModel } from "../../types/recoveryReadModel";
import type { RecoveryTimeline, RecoveryTimelineEvent, RecoveryTimelineResult } from "../../types/recoveryTimeline";
import { TIMELINE_ERRORS, TIMELINE_WARNINGS } from "../../constants/recoveryTimeline.constants";
import { buildRecoveryReadModel } from "./recoveryReadModel";
import * as store from "./recoveryTimelineStore";
import type { TenantContext } from "../tenancy/tenantTypes";

function failClosed(): RecoveryTimelineResult {
  return {
    ok: false,
    error: TIMELINE_ERRORS.BLOCKED_UNSAFE_RECOVERY_TIMELINE,
  };
}

function success(data: RecoveryTimeline): RecoveryTimelineResult {
  return { ok: true, data };
}

function toEpochMs(value: unknown): number | undefined {
  if (value == null || value === "") {
    return undefined;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  const parsed = Date.parse(String(value));
  return Number.isFinite(parsed) ? parsed : undefined;
}

function severityForType(type: string): RecoveryTimelineEvent["severity"] {
  if (type.includes("failed") || type.includes("rejected")) {
    return "error";
  }
  if (type.includes("expired") || type.includes("escalated") || type.includes("blocked")) {
    return "warning";
  }
  if (type.includes("critical") || type.includes("corrupted")) {
    return "critical";
  }
  return "info";
}

function mapExecutionEvent(executionId: string, event: any): RecoveryTimelineEvent | null {
  const timestamp = toEpochMs(event?.createdAt);
  if (timestamp == null) {
    return null;
  }
  const eventType = String(event?.eventType || "");
  const mappedType =
    eventType === "execution.started"
      ? "execution_started"
      : eventType === "execution.completed"
        ? "execution_completed"
        : eventType === "execution.failed"
          ? "execution_failed"
          : null;
  if (!mappedType) {
    return null;
  }
  return {
    eventId: String(event?.id || `${executionId}:${mappedType}:${timestamp}`),
    executionId,
    timestamp,
    source: "execution",
    type: mappedType,
    severity: severityForType(mappedType),
    summary: mappedType.replaceAll("_", " "),
    details: event?.payload || {},
  };
}

function mapLedgerEvent(executionId: string, event: any): RecoveryTimelineEvent | null {
  const timestamp = toEpochMs(event?.createdAt);
  if (timestamp == null) {
    return null;
  }
  const rawType = String(event?.eventType || "");
  const typeMap: Record<string, string> = {
    "execution.started": "execution_started",
    "execution.completed": "execution_completed",
    "execution.failed": "execution_failed",
    "lease.acquired": "lock_acquired",
    "lease.released": "lock_released",
    "attempt.started": "recovery_attempt_started",
    "attempt.completed": "recovery_attempt_completed",
    "attempt.failed": "recovery_attempt_failed",
  };
  const mappedType = typeMap[rawType];
  if (!mappedType) {
    return null;
  }
  return {
    eventId: `ledger_${String(event?.id || `${executionId}:${rawType}:${timestamp}`)}`,
    executionId,
    timestamp,
    source: rawType.startsWith("lease.") ? "lock" : rawType.startsWith("attempt.") ? "recovery" : "ledger",
    type: mappedType,
    severity: severityForType(mappedType),
    summary: mappedType.replaceAll("_", " "),
    details: event?.eventPayload || {},
    relatedIds: {
      attemptId: event?.id == null ? undefined : String(event.id),
    },
  };
}

function mapRecoveryAttemptEvent(executionId: string, attempt: any): RecoveryTimelineEvent[] {
  const events: RecoveryTimelineEvent[] = [];
  const createdAt = toEpochMs(attempt?.createdAt);
  const completedAt = toEpochMs(attempt?.completedAt);
  if (createdAt != null) {
    events.push({
      eventId: `attempt_${String(attempt?.id || "")}_started`,
      executionId,
      timestamp: createdAt,
      source: "recovery",
      type: "recovery_attempt_started",
      severity: "info",
      summary: "recovery attempt started",
      details: {
        status: attempt?.status,
        sideEffectClass: attempt?.sideEffectClass,
      },
      relatedIds: {
        attemptId: attempt?.id == null ? undefined : String(attempt.id),
      },
    });
  }
  if (completedAt != null) {
    const mappedType = String(attempt?.status || "") === "completed"
      ? "recovery_attempt_completed"
      : String(attempt?.status || "") === "failed"
        ? "recovery_attempt_failed"
        : null;
    if (mappedType) {
      events.push({
        eventId: `attempt_${String(attempt?.id || "")}_${mappedType}`,
        executionId,
        timestamp: completedAt,
        source: "recovery",
        type: mappedType,
        severity: severityForType(mappedType),
        summary: mappedType.replaceAll("_", " "),
        details: {
          status: attempt?.status,
          errorPayload: attempt?.errorPayload,
          resultPayload: attempt?.resultPayload,
        },
        relatedIds: {
          attemptId: attempt?.id == null ? undefined : String(attempt.id),
        },
      });
    }
  }
  return events;
}

function mapControlEvent(executionId: string, event: any): RecoveryTimelineEvent | null {
  const timestamp = toEpochMs(event?.timestamp || event?.createdAt);
  if (timestamp == null) {
    return null;
  }
  const typeMap: Record<string, string> = {
    RECOVERY_REQUESTED: "recovery_request_created",
    RECOVERY_APPROVED: "recovery_approved",
    RECOVERY_CANCELLED: "recovery_rejected",
  };
  const mappedType = typeMap[String(event?.type || "")];
  if (!mappedType) {
    return null;
  }
  return {
    eventId: String(event?.id || `${executionId}:${mappedType}:${timestamp}`),
    executionId,
    timestamp,
    source: "control",
    type: mappedType,
    severity: severityForType(mappedType),
    summary: mappedType.replaceAll("_", " "),
    details: event?.payload || {},
    relatedIds: {
      requestId: event?.payload?.recoveryRequestId == null ? undefined : String(event.payload.recoveryRequestId),
    },
  };
}

function mapAdvisoryEvent(executionId: string, event: any): RecoveryTimelineEvent | null {
  const timestamp = toEpochMs(event?.timestamp || event?.createdAt);
  if (timestamp == null) {
    return null;
  }
  const typeMap: Record<string, string> = {
    RECOVERY_ADVISORY_CREATED: "advisory_created",
    RECOVERY_ADVISORY_ESCALATED: "advisory_escalated",
    RECOVERY_ADVISORY_DISMISSED: "advisory_dismissed",
    RECOVERY_ADVISORY_REQUEST_CREATED: "advisory_request_created",
  };
  const mappedType = typeMap[String(event?.type || "")];
  if (!mappedType) {
    return null;
  }
  return {
    eventId: String(event?.id || `${executionId}:${mappedType}:${timestamp}`),
    executionId,
    timestamp,
    source: "advisory",
    type: mappedType,
    severity: severityForType(mappedType),
    summary: mappedType.replaceAll("_", " "),
    details: event?.payload || {},
    relatedIds: {
      advisoryId: event?.payload?.advisoryId == null ? undefined : String(event.payload.advisoryId),
      requestId: event?.payload?.recoveryRequest?.recoveryRequestId == null ? undefined : String(event.payload.recoveryRequest.recoveryRequestId),
    },
  };
}

function mapAutomationEvent(executionId: string, event: any): RecoveryTimelineEvent | null {
  const timestamp = toEpochMs(event?.timestamp);
  if (timestamp == null) {
    return null;
  }
  return {
    eventId: String(event?.id || `${executionId}:automation:${timestamp}`),
    executionId,
    timestamp,
    source: "automation",
    type: String(event?.type || "").toLowerCase(),
    severity: severityForType(String(event?.type || "").toLowerCase()),
    summary: String(event?.type || "").toLowerCase().replaceAll("recovery_automation_", "").replaceAll("_", " "),
    details: event?.payload || {},
  };
}

function mapAutonomyEvent(executionId: string, event: any): RecoveryTimelineEvent | null {
  const timestamp = toEpochMs(event?.timestamp);
  if (timestamp == null) {
    return null;
  }
  return {
    eventId: String(event?.id || `${executionId}:autonomy:${timestamp}`),
    executionId,
    timestamp,
    source: "autonomy",
    type: String(event?.type || "").toLowerCase(),
    severity: severityForType(String(event?.type || "").toLowerCase()),
    summary: String(event?.type || "").toLowerCase().replaceAll("recovery_autonomy_", "").replaceAll("_", " "),
    details: event?.payload || {},
  };
}

function mapVerificationEvent(executionId: string, event: any): RecoveryTimelineEvent | null {
  const timestamp = toEpochMs(event?.timestamp);
  if (timestamp == null) {
    return null;
  }
  const outcome = String(event?.payload?.verification?.outcome || "").toUpperCase();
  const mappedType =
    outcome === "VERIFIED"
      ? "verification_passed"
      : outcome === "FAILED"
        ? "verification_failed"
        : String(event?.type || "") === "RECOVERY_VERIFICATION_STARTED"
          ? "verification_started"
          : null;
  if (!mappedType) {
    return null;
  }
  return {
    eventId: String(event?.id || `${executionId}:${mappedType}:${timestamp}`),
    executionId,
    timestamp,
    source: "verification",
    type: mappedType,
    severity: severityForType(mappedType),
    summary: mappedType.replaceAll("_", " "),
    details: event?.payload || {},
    relatedIds: {
      verificationId: String(event?.id || ""),
      requestId: event?.payload?.recoveryRequestId == null ? undefined : String(event.payload.recoveryRequestId),
    },
  };
}

function mapLearningEvent(executionId: string, event: any): RecoveryTimelineEvent | null {
  const timestamp = toEpochMs(event?.timestamp);
  if (timestamp == null) {
    return null;
  }
  const typeMap: Record<string, string> = {
    RECOVERY_LEARNING_RUN_STARTED: "learning_run_started",
    RECOVERY_LEARNING_REPORT_CREATED: "learning_report_created",
    RECOVERY_LEARNING_RUN_FAILED: "learning_failed",
  };
  const mappedType = typeMap[String(event?.type || "")];
  if (!mappedType) {
    return null;
  }
  return {
    eventId: String(event?.id || `${executionId}:${mappedType}:${timestamp}`),
    executionId,
    timestamp,
    source: "learning",
    type: mappedType,
    severity: severityForType(mappedType),
    summary: mappedType.replaceAll("_", " "),
    details: event?.payload || {},
    relatedIds: {
      learningRunId: String(event?.id || ""),
    },
  };
}

function sortTimelineEvents(events: RecoveryTimelineEvent[]) {
  return [...events].sort((left, right) => {
    if (left.timestamp !== right.timestamp) {
      return left.timestamp - right.timestamp;
    }
    return left.eventId.localeCompare(right.eventId);
  });
}

function validateAgainstReadModel(readModel: RecoveryReadModel, events: RecoveryTimelineEvent[], warnings: string[]) {
  const types = new Set(events.map((event) => event.type));
  let matchesReadModel = true;
  const expectEvent = (condition: boolean, type: string) => {
    if (condition && !types.has(type)) {
      matchesReadModel = false;
    }
  };

  expectEvent(readModel.recovery.status === "completed", "recovery_attempt_completed");
  expectEvent(readModel.recovery.status === "failed", "recovery_attempt_failed");
  expectEvent(readModel.advisory.status === "open", "advisory_created");
  expectEvent(readModel.advisory.status === "escalated", "advisory_escalated");
  expectEvent(readModel.advisory.status === "dismissed", "advisory_dismissed");
  expectEvent(readModel.advisory.status === "request_created", "advisory_request_created");
  expectEvent(readModel.recoveryControl.status === "requested", "recovery_request_created");
  expectEvent(readModel.recoveryControl.status === "approved", "recovery_approved");
  expectEvent(readModel.verification.status === "passed", "verification_passed");
  expectEvent(readModel.verification.status === "failed", "verification_failed");
  expectEvent(readModel.learning.status === "report_available", "learning_report_created");
  expectEvent(readModel.learning.status === "failed", "learning_failed");
  expectEvent(readModel.lock.stale === true, "lock_expired");
  expectEvent(readModel.execution.status === "completed", "execution_completed");
  expectEvent(readModel.execution.status === "failed", "execution_failed");

  if (readModel.verification.status === "passed") {
    const hasRecoveryPath =
      types.has("recovery_request_created")
      || types.has("recovery_approved")
      || types.has("recovery_attempt_started")
      || types.has("recovery_attempt_completed")
      || types.has("recovery_attempt_failed");
    if (!hasRecoveryPath) {
      matchesReadModel = false;
    }
  }

  if (!matchesReadModel) {
    warnings.push(TIMELINE_WARNINGS.TIMELINE_STATE_MISMATCH);
  }
  return matchesReadModel;
}

function buildTimeRange(events: RecoveryTimelineEvent[]) {
  if (events.length === 0) {
    return {};
  }
  return {
    start: events[0].timestamp,
    end: events[events.length - 1].timestamp,
  };
}

export async function buildRecoveryTimeline({
  db,
  executionId,
  nowMs,
  tenantContext,
}: {
  db?: unknown;
  executionId: string;
  nowMs?: number;
  tenantContext?: TenantContext;
}): Promise<RecoveryTimelineResult> {
  try {
    if (typeof executionId !== "string" || !executionId.trim()) {
      return failClosed();
    }

    const readModelResult = await buildRecoveryReadModel({ db, executionId, nowMs, tenantContext });
    if (!readModelResult.ok) {
      return failClosed();
    }

    const readModel = readModelResult.data;
    const warnings = [...readModel.meta.warnings];
    const rawExecutionEvents = store.getExecutionEvents(executionId);
    const rawLockEvents = store.getLockEvents(executionId);
    const rawLedgerEvents = store.getLedgerEvents(executionId);
    const rawRecoveryEvents = store.getRecoveryEvents(executionId);
    const rawControlEvents = store.getControlEvents(executionId);
    const rawAdvisoryEvents = store.getAdvisoryEvents(executionId);
    const rawAutomationEvents = store.getAutomationEvents(executionId);
    const rawAutonomyEvents = store.getAutonomyEvents(executionId);
    const rawVerificationEvents = store.getVerificationEvents(executionId);
    const rawLearningEvents = store.getLearningEvents(executionId);

    if (!readModel.execution || readModel.execution.status === "unknown") {
      warnings.push(TIMELINE_WARNINGS.MISSING_EXECUTION);
    }
    if (rawLedgerEvents.length === 0) {
      warnings.push(TIMELINE_WARNINGS.MISSING_LEDGER);
    }

    const timelineEvents: RecoveryTimelineEvent[] = [];
    rawExecutionEvents.forEach((event) => {
      const mapped = mapExecutionEvent(executionId, event);
      if (mapped) {
        timelineEvents.push(mapped);
      }
    });
    rawLockEvents.forEach((event) => {
      const mapped = mapLedgerEvent(executionId, event);
      if (mapped) {
        timelineEvents.push(mapped);
      }
    });
    rawLedgerEvents.forEach((event) => {
      const mapped = mapLedgerEvent(executionId, event);
      if (mapped) {
        timelineEvents.push(mapped);
      }
    });
    rawRecoveryEvents.forEach((attempt) => {
      timelineEvents.push(...mapRecoveryAttemptEvent(executionId, attempt));
    });
    rawControlEvents.forEach((event) => {
      const mapped = mapControlEvent(executionId, event);
      if (mapped) {
        timelineEvents.push(mapped);
      }
    });
    rawAdvisoryEvents.forEach((event) => {
      const mapped = mapAdvisoryEvent(executionId, event);
      if (mapped) {
        timelineEvents.push(mapped);
      }
    });
    rawAutomationEvents.forEach((event) => {
      const mapped = mapAutomationEvent(executionId, event);
      if (mapped) {
        timelineEvents.push(mapped);
      }
    });
    rawAutonomyEvents.forEach((event) => {
      const mapped = mapAutonomyEvent(executionId, event);
      if (mapped) {
        timelineEvents.push(mapped);
      }
    });
    rawVerificationEvents.forEach((event) => {
      const mapped = mapVerificationEvent(executionId, event);
      if (mapped) {
        timelineEvents.push(mapped);
      }
    });
    rawLearningEvents.forEach((event) => {
      const mapped = mapLearningEvent(executionId, event);
      if (mapped) {
        timelineEvents.push(mapped);
      }
    });

    if (readModel.lock.stale) {
      const timestamp = readModel.lock.leaseExpiresAt ?? readModel.lock.heartbeatAt ?? nowMs;
      if (timestamp != null) {
        timelineEvents.push({
          eventId: `${executionId}:lock_expired:${timestamp}`,
          executionId,
          timestamp,
          source: "lock",
          type: "lock_expired",
          severity: "warning",
          summary: "lock expired",
          details: {
            ownerId: readModel.lock.ownerId,
            leaseExpiresAt: readModel.lock.leaseExpiresAt,
            heartbeatAt: readModel.lock.heartbeatAt,
          },
        });
      }
    }

    const events = sortTimelineEvents(timelineEvents);
    const matchesReadModel = validateAgainstReadModel(readModel, events, warnings);

    if (
      (readModel.recovery.status === "completed" || readModel.recovery.status === "failed")
      && !events.some((event) => event.type === "recovery_attempt_completed" || event.type === "recovery_attempt_failed")
    ) {
      warnings.push(TIMELINE_WARNINGS.MISSING_CRITICAL_TRANSITIONS);
    }

    return success({
      executionId,
      events,
      meta: {
        totalEvents: events.length,
        timeRange: buildTimeRange(events),
        completeness: warnings.length === 0 ? "complete" : "partial",
        warnings: Array.from(new Set(warnings)),
        matchesReadModel,
      },
    });
  } catch {
    return failClosed();
  }
}
