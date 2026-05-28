import { describe, expect, it } from "vitest";

import { evaluateSamRetrySafety } from "../../services/sam/samRetrySafety.ts";

describe("sam retry safety", () => {
  it("completed result is duplicate return", () => {
    const result = evaluateSamRetrySafety({
      existing: {
        executionId: "demo-exec-1",
        attemptId: "attempt_1",
        idempotencyKey: "key_1",
        actionType: "recover_execution",
        proposalHash: "hash_1",
        status: "completed",
        replayable: true,
      },
      incoming: {
        executionId: "demo-exec-1",
        attemptId: "attempt_2",
        idempotencyKey: "key_1",
        actionType: "recover_execution",
        proposalHash: "hash_1",
      },
    });

    expect(result).toBe("duplicate_return");
  });

  it("ambiguous result blocks", () => {
    const result = evaluateSamRetrySafety({
      existing: {
        executionId: "demo-exec-1",
        attemptId: "attempt_1",
        idempotencyKey: "key_1",
        actionType: "recover_execution",
        proposalHash: "hash_1",
        status: "ambiguous",
        replayable: false,
      },
      incoming: {
        executionId: "demo-exec-1",
        attemptId: "attempt_2",
        idempotencyKey: "key_1",
        actionType: "recover_execution",
        proposalHash: "hash_1",
      },
    });

    expect(result).toBe("blocked_ambiguous");
  });
});
