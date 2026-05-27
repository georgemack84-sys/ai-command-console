import { createRequire } from "node:module";
import * as readModelStore from "./recoveryReadModelStore";

const require = createRequire(import.meta.url);
const { listAuditEvents } = require("../auditTrail.js");

function safeArray<T>(reader: () => T[]): T[] {
  try {
    const value = reader();
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function getExecutionEvents(executionId: string) {
  return safeArray(() => {
    const executionState = readModelStore.getExecution(executionId);
    const execution = executionState?.execution || null;
    if (!execution) {
      return [];
    }
    const events: any[] = [];
    if (execution.createdAt) {
      events.push({
        id: `${executionId}:execution:created`,
        createdAt: execution.createdAt,
        eventType: "execution.created",
        payload: { status: execution.status },
      });
    }
    if (execution.startedAt) {
      events.push({
        id: `${executionId}:execution:started`,
        createdAt: execution.startedAt,
        eventType: "execution.started",
        payload: { status: execution.status },
      });
    }
    const terminalAt = execution.finishedAt || execution.lastUpdatedAt;
    if (terminalAt && execution.status === "completed") {
      events.push({
        id: `${executionId}:execution:completed`,
        createdAt: terminalAt,
        eventType: "execution.completed",
        payload: { status: execution.status },
      });
    }
    if (terminalAt && execution.status === "failed") {
      events.push({
        id: `${executionId}:execution:failed`,
        createdAt: terminalAt,
        eventType: "execution.failed",
        payload: { status: execution.status },
      });
    }
    return events;
  });
}

function getLockEvents(executionId: string) {
  return safeArray(() => {
    const events = readModelStore.getLedgerEvents(executionId);
    return events.filter((event: any) => String(event?.eventType || "").startsWith("lease."));
  });
}

function getLedgerEvents(executionId: string) {
  return safeArray(() => readModelStore.getLedgerEvents(executionId));
}

function getRecoveryEvents(executionId: string) {
  return safeArray(() => readModelStore.getRecoveryAttempts(executionId));
}

function getControlEvents(executionId: string) {
  return safeArray(() =>
    listAuditEvents(5000).filter((event: any) =>
      [
        "RECOVERY_REQUESTED",
        "RECOVERY_APPROVED",
        "RECOVERY_CANCELLED",
      ].includes(String(event?.type || ""))
      && String(event?.payload?.executionId || "") === String(executionId || ""),
    ),
  );
}

function getAdvisoryEvents(executionId: string) {
  return safeArray(() => {
    const advisories = readModelStore.getRecoveryAdvisories(executionId);
    return advisories.flatMap((advisory: any) => Array.isArray(advisory?.events) ? advisory.events : []);
  });
}

function getAutomationEvents(executionId: string) {
  return safeArray(() => readModelStore.getAutomationState(executionId));
}

function getAutonomyEvents(executionId: string) {
  return safeArray(() => readModelStore.getAutonomyState(executionId));
}

function getVerificationEvents(executionId: string) {
  return safeArray(() => readModelStore.getVerificationResults(executionId));
}

function getLearningEvents(executionId: string) {
  return safeArray(() => readModelStore.getLearningReports(executionId));
}

export {
  getAdvisoryEvents,
  getAutomationEvents,
  getAutonomyEvents,
  getControlEvents,
  getExecutionEvents,
  getLedgerEvents,
  getLearningEvents,
  getLockEvents,
  getRecoveryEvents,
  getVerificationEvents,
};
