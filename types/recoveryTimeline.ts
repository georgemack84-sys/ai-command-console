export type RecoveryTimelineResult =
  | { ok: true; data: RecoveryTimeline }
  | { ok: false; error: "BLOCKED_UNSAFE_RECOVERY_TIMELINE" };

export type RecoveryTimeline = {
  executionId: string;
  events: RecoveryTimelineEvent[];
  meta: {
    totalEvents: number;
    timeRange: { start?: number; end?: number };
    completeness: "complete" | "partial";
    warnings: string[];
    matchesReadModel: boolean;
  };
};

export type RecoveryTimelineEvent = {
  eventId: string;
  executionId: string;
  timestamp: number;
  source:
    | "execution"
    | "lock"
    | "ledger"
    | "recovery"
    | "control"
    | "advisory"
    | "automation"
    | "autonomy"
    | "verification"
    | "learning";
  type: string;
  severity: "info" | "warning" | "error" | "critical";
  summary: string;
  details?: Record<string, unknown>;
  relatedIds?: {
    attemptId?: string;
    advisoryId?: string;
    requestId?: string;
    verificationId?: string;
    learningRunId?: string;
  };
};
