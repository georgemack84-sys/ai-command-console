import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

const executionStateStore = require("../executionStateStore.js");
const executionIntegrityStore = require("../executionIntegrityStore.js");
const recoveryAuditStore = require("../recoveryAuditStore.js");
const recoveryVerificationStore = require("../recoveryVerificationStore.js");
const recoveryExecutionStore = require("../recoveryExecutionStore.js");
const recoveryAutomationStore = require("../recoveryAutomationStore.js");
const recoveryAutonomyStore = require("../recoveryAutonomyStore.js");
const recoveryLearningStore = require("../recoveryLearningStore.js");
const { listAuditEvents } = require("../auditTrail.js");

function safeRead<T>(reader: () => T, fallback: T): T {
  try {
    return reader();
  } catch {
    return fallback;
  }
}

function getExecutionState(executionId: string) {
  return safeRead(() => executionStateStore.loadExecutionState(String(executionId || "").trim()), null);
}

function getPlanId(executionId: string): string | null {
  const state = getExecutionState(executionId);
  const planId = state?.execution?.planId == null ? "" : String(state.execution.planId).trim();
  return planId || null;
}

function selectMatchingLock(locks: any[], executionId: string) {
  const matching = locks.filter((lock) => String(lock?.executionId || "") === String(executionId || ""));
  if (matching.length === 0) {
    return null;
  }
  const active = matching.find((lock) => lock?.lockReleasedAt == null);
  return active || matching.sort((left, right) => Number(right?.lockAcquiredAt || 0) - Number(left?.lockAcquiredAt || 0))[0] || null;
}

function buildAdvisoryFromEvents(events: any[]) {
  if (!Array.isArray(events) || events.length === 0) {
    return null;
  }
  const ordered = [...events].sort((left, right) => {
    const leftAt = Date.parse(String(left?.timestamp || left?.createdAt || ""));
    const rightAt = Date.parse(String(right?.timestamp || right?.createdAt || ""));
    return rightAt - leftAt;
  });
  const latest = ordered[0];
  let state = "OPEN";
  switch (String(latest?.type || "")) {
    case "RECOVERY_ADVISORY_DISMISSED":
      state = "DISMISSED";
      break;
    case "RECOVERY_ADVISORY_ESCALATED":
      state = "ESCALATED";
      break;
    case "RECOVERY_ADVISORY_REQUEST_CREATED":
      state = "REQUEST_CREATED";
      break;
    default:
      state = "OPEN";
      break;
  }

  const base = ordered.reduce((accumulator, event) => {
    const payload = event?.payload || {};
    return {
      advisoryId: String(payload.advisoryId || accumulator.advisoryId || ""),
      executionId: String(payload.executionId || accumulator.executionId || ""),
      state,
      candidate: payload.candidate || accumulator.candidate || null,
      signal: payload.signal || accumulator.signal || null,
      recommendation: payload.recommendation || accumulator.recommendation || null,
      explanation: payload.explanation || accumulator.explanation || null,
      latestEventId: String(event?.id || accumulator.latestEventId || ""),
      latestTimestamp: String(event?.timestamp || accumulator.latestTimestamp || ""),
      events: ordered,
    };
  }, {
    advisoryId: "",
    executionId: "",
    state,
    candidate: null,
    signal: null,
    recommendation: null,
    explanation: null,
    latestEventId: "",
    latestTimestamp: "",
    events: ordered,
  });

  return base;
}

function getExecution(executionId: string) {
  return getExecutionState(executionId);
}

function getLock(executionId: string) {
  const executionState = getExecutionState(executionId);
  const planId = executionState?.execution?.planId == null ? "" : String(executionState.execution.planId).trim();
  if (!planId) {
    const execution = executionState?.execution || null;
    if (execution?.leaseOwner || execution?.leaseExpiresAt) {
      return {
        planId: null,
        executionId: String(executionId || ""),
        workerId: execution.leaseOwner == null ? null : String(execution.leaseOwner),
        heartbeatAt: null,
        leaseExpiresAt: execution.leaseExpiresAt == null ? null : Number(execution.leaseExpiresAt),
        lockReleasedAt: null,
        lockAcquiredAt: null,
      };
    }
    return null;
  }
  const locksResult = safeRead(() => executionIntegrityStore.listExecutionLocks(planId), null);
  const locks = Array.isArray(locksResult?.data) ? locksResult.data : [];
  const matching = selectMatchingLock(locks, executionId);
  if (matching) {
    return matching;
  }
  const execution = executionState?.execution || null;
  if (execution?.leaseOwner || execution?.leaseExpiresAt) {
    return {
      planId,
      executionId: String(executionId || ""),
      workerId: execution.leaseOwner == null ? null : String(execution.leaseOwner),
      heartbeatAt: null,
      leaseExpiresAt: execution.leaseExpiresAt == null ? null : Number(execution.leaseExpiresAt),
      lockReleasedAt: null,
      lockAcquiredAt: null,
    };
  }
  return null;
}

function getLedgerEvents(executionId: string) {
  const planId = getPlanId(executionId);
  if (!planId) {
    return [];
  }
  const result = safeRead(() => executionIntegrityStore.listLedgerEvents(planId, executionId), null);
  return Array.isArray(result?.data) ? result.data : [];
}

function getRecoveryAttempts(executionId: string) {
  const planId = getPlanId(executionId);
  if (!planId) {
    return [];
  }
  const result = safeRead(() => executionIntegrityStore.listExecutionAttempts(planId, executionId), null);
  return Array.isArray(result?.data) ? result.data : [];
}

function getRecoveryControlRequests(executionId: string) {
  return safeRead(() => {
    const requests = recoveryAuditStore.listRecoveryRequestsForExecution(executionId);
    if (!Array.isArray(requests)) {
      return [];
    }
    return requests.filter((request: any) =>
      [
        "REQUESTED",
        "PREVIEWED",
        "AWAITING_APPROVAL",
        "APPROVED",
        "COMMITTED",
        "FAILED",
        "BLOCKED",
        "CANCELLED",
      ].includes(String(request?.status || "").trim().toUpperCase()),
    );
  }, []);
}

function getRecoveryAdvisories(executionId: string) {
  return safeRead(() => {
    const events = listAuditEvents(5000).filter((event: any) =>
      String(event?.type || "").startsWith("RECOVERY_ADVISORY_")
      && String(event?.payload?.executionId || "") === String(executionId || ""),
    );
    const grouped = new Map<string, any[]>();
    for (const event of events) {
      const advisoryId = String(event?.payload?.advisoryId || "").trim();
      if (!advisoryId) {
        continue;
      }
      if (!grouped.has(advisoryId)) {
        grouped.set(advisoryId, []);
      }
      grouped.get(advisoryId)!.push(event);
    }
    return Array.from(grouped.values())
      .map((group) => buildAdvisoryFromEvents(group))
      .filter(Boolean);
  }, []);
}

function getAutomationState(executionId: string) {
  return safeRead(() => {
    const events = recoveryAutomationStore.listAutomationEvents(5000);
    return Array.isArray(events)
      ? events.filter((event: any) => String(event?.payload?.executionId || "") === String(executionId || ""))
      : [];
  }, []);
}

function getAutonomyState(executionId: string) {
  return safeRead(() => {
    const events = recoveryAutonomyStore.listAutonomyEvents(5000);
    return Array.isArray(events)
      ? events.filter((event: any) => String(event?.payload?.executionId || "") === String(executionId || ""))
      : [];
  }, []);
}

function getVerificationResults(executionId: string) {
  return safeRead(() => {
    const events = recoveryVerificationStore.listVerificationEvents(5000);
    return Array.isArray(events)
      ? events.filter((event: any) => String(event?.payload?.executionId || "") === String(executionId || ""))
      : [];
  }, []);
}

function getLearningReports(executionId: string) {
  return safeRead(() => {
    const events = recoveryLearningStore.listLearningEvents(5000);
    if (!Array.isArray(events)) {
      return [];
    }
    const scoped = events.filter((event: any) => {
      const reportExecutionId = String(event?.payload?.report?.executionId || "").trim();
      return !reportExecutionId || reportExecutionId === String(executionId || "");
    });
    return scoped;
  }, []);
}

export {
  getAdvisoryById,
  getAutomationState,
  getAutonomyState,
  getExecution,
  getLedgerEvents,
  getLearningReports,
  getLock,
  getRecoveryAdvisories,
  getRecoveryAttempts,
  getRecoveryControlRequests,
  getVerificationResults,
};

function getAdvisoryById(advisoryId: string) {
  return safeRead(() => recoveryAuditStore.getAdvisoryById?.(advisoryId) || null, null);
}
