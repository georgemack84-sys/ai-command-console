import { beforeEach, describe, expect, it } from "vitest";

import { ensureIdempotentExecution } from "../../services/sam/samEnsureIdempotentExecution.ts";
import { clearSamIdempotencyStore, storeSamIdempotencyResult } from "../../services/sam/samIdempotencyStore.ts";

beforeEach(() => {
  clearSamIdempotencyStore();
});

describe("ensureIdempotentExecution", () => {
  it("missing attemptId fails closed", () => {
    const result = ensureIdempotentExecution({
      executionId: "demo-exec-1",
      attemptId: "",
      idempotencyKey: "key_1",
      actionType: "recover_execution",
      proposalHash: "hash_1",
    });

    expect(result.status).toBe("blocked_ambiguous");
  });

  it("missing idempotencyKey fails closed", () => {
    const result = ensureIdempotentExecution({
      executionId: "demo-exec-1",
      attemptId: "attempt_1",
      idempotencyKey: "",
      actionType: "recover_execution",
      proposalHash: "hash_1",
    });

    expect(result.status).toBe("blocked_ambiguous");
  });

  it("ambiguous prior attempt blocks retry", () => {
    storeSamIdempotencyResult({
      executionId: "demo-exec-1",
      attemptId: "attempt_1",
      idempotencyKey: "key_1",
      actionType: "recover_execution",
      proposalHash: "hash_1",
      status: "ambiguous",
      replayable: false,
    });

    const result = ensureIdempotentExecution({
      executionId: "demo-exec-1",
      attemptId: "attempt_2",
      idempotencyKey: "key_1",
      actionType: "recover_execution",
      proposalHash: "hash_1",
    });

    expect(result.status).toBe("blocked_ambiguous");
  });

  it("failed non-replayable attempt blocks retry", () => {
    storeSamIdempotencyResult({
      executionId: "demo-exec-1",
      attemptId: "attempt_1",
      idempotencyKey: "key_1",
      actionType: "recover_execution",
      proposalHash: "hash_1",
      status: "failed",
      replayable: false,
    });

    const result = ensureIdempotentExecution({
      executionId: "demo-exec-1",
      attemptId: "attempt_2",
      idempotencyKey: "key_1",
      actionType: "recover_execution",
      proposalHash: "hash_1",
    });

    expect(result.status).toBe("unsafe_retry");
  });
});
