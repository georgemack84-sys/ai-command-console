import { beforeEach, describe, expect, it } from "vitest";

import { evaluateSamDeduplication } from "../../services/sam/samDeduplication.ts";
import { clearSamIdempotencyStore, storeSamIdempotencyResult } from "../../services/sam/samIdempotencyStore.ts";

beforeEach(() => {
  clearSamIdempotencyStore();
});

describe("sam deduplication", () => {
  it("new key allows attempt", () => {
    const result = evaluateSamDeduplication({
      executionId: "demo-exec-1",
      attemptId: "attempt_1",
      idempotencyKey: "key_1",
      proposalHash: "hash_1",
      actionType: "recover_execution",
    });

    expect(result.status).toBe("new_attempt");
  });

  it("same key returns same result", () => {
    storeSamIdempotencyResult({
      executionId: "demo-exec-1",
      attemptId: "attempt_1",
      idempotencyKey: "key_1",
      actionType: "recover_execution",
      proposalHash: "hash_1",
      status: "completed",
      replayable: true,
      resultHash: "result_hash_1",
      result: { ok: true, blocked: false, stage: "completed" },
    });

    const result = evaluateSamDeduplication({
      executionId: "demo-exec-1",
      attemptId: "attempt_2",
      idempotencyKey: "key_1",
      proposalHash: "hash_1",
      actionType: "recover_execution",
    });

    expect(result.status).toBe("duplicate_returned");
    expect(result.result).toEqual({ ok: true, blocked: false, stage: "completed" });
  });

  it("same key with different proposal is blocked", () => {
    storeSamIdempotencyResult({
      executionId: "demo-exec-1",
      attemptId: "attempt_1",
      idempotencyKey: "key_1",
      actionType: "recover_execution",
      proposalHash: "hash_1",
      status: "completed",
      replayable: true,
      result: { ok: true },
    });

    const result = evaluateSamDeduplication({
      executionId: "demo-exec-1",
      attemptId: "attempt_2",
      idempotencyKey: "key_1",
      proposalHash: "hash_2",
      actionType: "recover_execution",
    });

    expect(result.status).toBe("blocked_conflict");
  });

  it("same attemptId with different key is blocked", () => {
    storeSamIdempotencyResult({
      executionId: "demo-exec-1",
      attemptId: "attempt_1",
      idempotencyKey: "key_1",
      actionType: "recover_execution",
      proposalHash: "hash_1",
      status: "completed",
      replayable: true,
      result: { ok: true },
    });

    const result = evaluateSamDeduplication({
      executionId: "demo-exec-1",
      attemptId: "attempt_1",
      idempotencyKey: "key_2",
      proposalHash: "hash_1",
      actionType: "recover_execution",
    });

    expect(result.status).toBe("blocked_conflict");
  });
});
