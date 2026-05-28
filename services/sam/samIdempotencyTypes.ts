export type SamIdempotencyInput = {
  tenantId?: string;
  workspaceId?: string;
  executionId: string;
  attemptId: string;
  idempotencyKey: string;
  actionType: string;
  proposalHash: string;
};

export type SamStoredIdempotencyResult = {
  tenantId?: string;
  workspaceId?: string;
  executionId: string;
  attemptId: string;
  idempotencyKey: string;
  actionType: string;
  proposalHash: string;
  resultHash?: string;
  result?: unknown;
  status: "pending" | "completed" | "failed" | "blocked" | "ambiguous";
  replayable: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type SamIdempotencyDecision = {
  status: "new_attempt" | "duplicate_returned" | "blocked_conflict" | "unsafe_retry" | "blocked_ambiguous";
  tenantId?: string;
  workspaceId?: string;
  executionId: string;
  attemptId: string;
  idempotencyKey: string;
  resultHash?: string;
  result?: unknown;
  reason?: string;
};

export type SamRetrySafety =
  | "safe_replay"
  | "duplicate_return"
  | "blocked_conflict"
  | "blocked_ambiguous"
  | "requires_approval";
