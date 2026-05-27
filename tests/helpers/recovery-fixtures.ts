import type { RecoveryReadModel } from "../../types/recoveryReadModel";
import type { RecoveryTimeline } from "../../types/recoveryTimeline";

export function createRecoveryReadModel(overrides: Partial<RecoveryReadModel> = {}): RecoveryReadModel {
  return {
    executionId: "exec_1",
    execution: { status: "running" },
    recovery: { status: "none", attemptsCount: 0 },
    recoveryControl: { status: "none", latestRequestId: "recovery_1", requiresApproval: false },
    advisory: { status: "none", latestAdvisoryId: "adv_1", requiresOperator: false, advisoryOnly: true },
    automation: { status: "none", automationAllowed: false },
    autonomy: { status: "none", autonomyAllowed: false },
    verification: { status: "not_run" },
    learning: {
      status: "not_run",
      recommendationCount: 0,
      hasPolicyRecommendations: false,
      hasWarnings: false,
      advisoryOnly: true,
    },
    lock: { isLocked: false, stale: false },
    ledger: { totalEvents: 0 },
    risk: {
      hasFailure: false,
      hasVerificationFailure: false,
      hasStaleLock: false,
      hasOpenAdvisory: false,
      hasUnsafeUnknown: false,
      hasLearningWarnings: false,
      requiresOperatorAttention: false,
    },
    meta: { completeness: "complete", warnings: [] },
    ...overrides,
  };
}

export function createRecoveryTimeline(overrides: Partial<RecoveryTimeline> = {}): RecoveryTimeline {
  return {
    executionId: "exec_1",
    events: [],
    meta: {
      totalEvents: 0,
      timeRange: {},
      completeness: "complete",
      warnings: [],
      matchesReadModel: true,
    },
    ...overrides,
  };
}
