import type { SamChaosHookMode, SamChaosMetrics } from "./samChaosTypes";
import { recordSamThroughputEvent } from "../performance/samThroughputTracker";

let currentSamChaosMode: SamChaosHookMode | null = null;
let currentSamChaosMetrics: SamChaosMetrics = {
  dryRunInvocationCount: 0,
  auditAppendCount: 0,
  auditSkipCount: 0,
  auditEventCounts: {},
  storeReadCount: 0,
  storeWriteCount: 0,
  unauthorizedMutationDetected: false,
};

function cloneMetrics(): SamChaosMetrics {
  return {
    ...currentSamChaosMetrics,
  };
}

export function configureSamChaosFailureInjection(mode: SamChaosHookMode | null) {
  currentSamChaosMode = mode ? { ...mode } : null;
  currentSamChaosMetrics = {
    dryRunInvocationCount: 0,
    auditAppendCount: 0,
    auditSkipCount: 0,
    auditEventCounts: {},
    storeReadCount: 0,
    storeWriteCount: 0,
    unauthorizedMutationDetected: false,
  };
}

export function clearSamChaosFailureInjection() {
  configureSamChaosFailureInjection(null);
}

export function getSamChaosFailureInjectionMode() {
  return currentSamChaosMode ? { ...currentSamChaosMode } : null;
}

export function getSamChaosMetrics() {
  return cloneMetrics();
}

export function recordSamChaosUnauthorizedMutation() {
  currentSamChaosMetrics.unauthorizedMutationDetected = true;
}

export function onSamChaosStoreRead() {
  currentSamChaosMetrics.storeReadCount += 1;
  if (currentSamChaosMode?.failStoreRead) {
    throw new Error("SAM_CHAOS_STORE_READ_FAILURE");
  }
}

export function onSamChaosStoreWrite() {
  currentSamChaosMetrics.storeWriteCount += 1;
  if (currentSamChaosMode?.failStoreWrite) {
    throw new Error("SAM_CHAOS_STORE_WRITE_FAILURE");
  }
}

export function onSamChaosDryRunStart() {
  currentSamChaosMetrics.dryRunInvocationCount += 1;
  recordSamThroughputEvent("dryrun_generated");
  if (currentSamChaosMode?.failDryRunTimeout) {
    throw new Error("SAM_CHAOS_TIMEOUT_MID_EXECUTION");
  }
}

export function onSamChaosAuditAppendAttempt(type?: string) {
  currentSamChaosMetrics.auditAppendCount += 1;
  if (type) {
    currentSamChaosMetrics.auditEventCounts[type] = (currentSamChaosMetrics.auditEventCounts[type] || 0) + 1;
  }
  if (currentSamChaosMode?.failAuditAppend) {
    currentSamChaosMetrics.auditSkipCount += 1;
    throw new Error("SAM_CHAOS_AUDIT_APPEND_FAILURE");
  }
}

export function onSamChaosAuditAppendSkipped() {
  currentSamChaosMetrics.auditSkipCount += 1;
}
