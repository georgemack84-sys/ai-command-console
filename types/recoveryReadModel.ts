export type RecoveryReadModelResult =
  | {
      ok: true;
      data: RecoveryReadModel;
    }
  | {
      ok: false;
      error: "BLOCKED_UNSAFE_RECOVERY_READ_MODEL";
      warnings?: string[];
    };

export type RecoveryReadModel = {
  executionId: string;

  execution: {
    status: string;
    startedAt?: number;
    completedAt?: number;
  };

  recovery: {
    status: "none" | "pending" | "in_progress" | "completed" | "failed" | "unknown";
    latestAttemptId?: string;
    attemptsCount: number;
  };

  recoveryControl: {
    status: "none" | "requested" | "approval_required" | "approved" | "rejected" | "completed" | "failed" | "unknown";
    latestRequestId?: string;
    requiresApproval: boolean;
  };

  advisory: {
    status: "none" | "open" | "dismissed" | "escalated" | "request_created" | "unknown";
    latestAdvisoryId?: string;
    signalType?: "STALE_LOCK" | "EXPIRED_LEASE" | "FAILED_EXECUTION" | "INTERRUPTED_ATTEMPT" | "MISSING_TERMINAL_EVENT" | "OPERATOR_PAUSED" | "UNKNOWN";
    recommendation?: "resume" | "retry_safe_steps" | "operator_recovery" | "abandon" | "mark_corrupted" | "none";
    confidence?: number;
    requiresOperator: boolean;
    advisoryOnly: true;
  };

  automation: {
    status: "none" | "eligible" | "blocked" | "throttled" | "dry_run" | "unknown";
    latestAutomationId?: string;
    automationAllowed: boolean;
    reason?: string;
  };

  autonomy: {
    status: "none" | "allowed" | "blocked" | "requires_operator" | "unknown";
    latestAutonomyDecisionId?: string;
    autonomyAllowed: boolean;
    reason?: string;
  };

  verification: {
    status: "not_run" | "pending" | "passed" | "failed" | "unknown";
    latestVerificationId?: string;
  };

  learning: {
    status: "not_run" | "report_available" | "failed" | "unknown";
    latestReportId?: string;
    latestRunId?: string;
    recommendationCount: number;
    hasPolicyRecommendations: boolean;
    hasWarnings: boolean;
    advisoryOnly: true;
  };

  lock: {
    isLocked: boolean;
    leaseExpiresAt?: number;
    heartbeatAt?: number;
    ownerId?: string;
    stale: boolean;
  };

  ledger: {
    totalEvents: number;
    lastEventType?: string;
    lastEventAt?: number;
  };

  risk: {
    hasFailure: boolean;
    hasVerificationFailure: boolean;
    hasStaleLock: boolean;
    hasOpenAdvisory: boolean;
    hasUnsafeUnknown: boolean;
    hasLearningWarnings: boolean;
    requiresOperatorAttention: boolean;
  };

  meta: {
    updatedAt?: number;
    completeness: "complete" | "partial";
    warnings: string[];
  };
};
