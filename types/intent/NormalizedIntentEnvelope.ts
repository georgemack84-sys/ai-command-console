export type NormalizedIntentEnvelope = {
  requestId: string;
  source:
    | "user"
    | "system"
    | "automation"
    | "recovery";
  receivedAt: number;
  rawInput: unknown;
  normalizedInput: {
    text?: string;
    structuredPayload?: Record<string, unknown>;
  };
  metadata: {
    sessionId?: string;
    userId?: string;
    correlationId?: string;
    parentRequestId?: string;
  };
  safety: {
    containsExecutableContent: boolean;
    requiresIsolationReview: boolean;
    rejected: boolean;
    rejectionReason?: string;
  };
};
