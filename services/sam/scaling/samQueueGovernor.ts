import { recordSamQueueWaitDuration, recordSamLockWaitDuration, setSamQueueDepth } from "../performance/samQueueMetrics";
import { loadSamRuntimeLimits } from "./samRuntimeLimits";
import { evaluateSamBackpressure } from "./samBackpressureController";
import { SAM_SCALING_ERROR_CODES } from "./samScalingErrors";
import type { SamProposalAdmission, SamWorkPriority } from "./samScalingTypes";

type GovernorState = {
  queueDepth: number;
  concurrentProposals: number;
  concurrentDryRuns: number;
  retryCount: number;
  pendingRetries: number;
  auditAppendLatencyMs: number;
  idempotencyStoreLatencyMs: number;
  memoryPressure: number;
};

declare global {
  // eslint-disable-next-line no-var
  var __samQueueGovernorState__: GovernorState | undefined;
}

const state: GovernorState = globalThis.__samQueueGovernorState__ || {
  queueDepth: 0,
  concurrentProposals: 0,
  concurrentDryRuns: 0,
  retryCount: 0,
  pendingRetries: 0,
  auditAppendLatencyMs: 0,
  idempotencyStoreLatencyMs: 0,
  memoryPressure: 0,
};

globalThis.__samQueueGovernorState__ = state;

export function resetSamQueueGovernorState() {
  state.queueDepth = 0;
  state.concurrentProposals = 0;
  state.concurrentDryRuns = 0;
  state.retryCount = 0;
  state.pendingRetries = 0;
  state.auditAppendLatencyMs = 0;
  state.idempotencyStoreLatencyMs = 0;
  state.memoryPressure = 0;
  setSamQueueDepth(0);
}

export function primeSamQueueGovernorState(next: Partial<GovernorState>) {
  Object.assign(state, next);
  setSamQueueDepth(state.queueDepth);
}

export function getSamQueueGovernorSnapshot() {
  return { ...state };
}

export function getSamProposalPriority({
  actionType,
  approvalStatus,
}: {
  actionType: string;
  approvalStatus?: string;
}): SamWorkPriority {
  if (actionType === "recover_execution") {
    return "recovery";
  }
  if (approvalStatus === "granted") {
    return "approved";
  }
  if (actionType === "export_evidence" || actionType === "inspect_state") {
    return "audit";
  }
  if (actionType === "add_operator_note") {
    return "advisory";
  }
  return "retry";
}

export function beginSamProposal({
  priority,
}: {
  priority: SamWorkPriority;
}): SamProposalAdmission {
  const limits = loadSamRuntimeLimits();
  const decision = evaluateSamBackpressure({
    ...state,
    limits,
  });

  if (decision.shouldReject) {
    return {
      allowed: false,
      mode: decision.mode,
      reason: SAM_SCALING_ERROR_CODES.SAM_QUEUE_PRESSURE_REJECTED,
      priority,
    };
  }

  state.concurrentProposals += 1;
  state.queueDepth += 1;
  setSamQueueDepth(state.queueDepth);
  recordSamQueueWaitDuration(0);
  return {
    allowed: true,
    mode: decision.mode,
    token: `proposal-${priority}-${state.concurrentProposals}-${state.queueDepth}`,
    priority,
  };
}

export function finishSamProposal() {
  state.concurrentProposals = Math.max(0, state.concurrentProposals - 1);
  state.queueDepth = Math.max(0, state.queueDepth - 1);
  setSamQueueDepth(state.queueDepth);
}

export function beginSamDryRun() {
  const limits = loadSamRuntimeLimits();
  if (state.concurrentDryRuns >= limits.MAX_CONCURRENT_DRY_RUNS) {
    return {
      allowed: false,
      reason: SAM_SCALING_ERROR_CODES.SAM_DRY_RUN_CAPACITY_REJECTED,
    };
  }
  state.concurrentDryRuns += 1;
  recordSamLockWaitDuration(0);
  return {
    allowed: true,
  };
}

export function finishSamDryRun() {
  state.concurrentDryRuns = Math.max(0, state.concurrentDryRuns - 1);
}
