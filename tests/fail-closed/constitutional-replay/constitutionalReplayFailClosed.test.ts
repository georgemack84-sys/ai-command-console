import { describe, expect, it } from "vitest";
import { buildConstitutionalReplayFixture } from "@/tests/integration/constitutional-replay/helpers";
import { buildApprovalConflictFixture } from "@/tests/integration/approval-conflict/helpers";

describe("constitutional replay fail-closed inheritance", () => {
  it("inherits upstream fail-closed state", () => {
    const approvalConflictResult = buildApprovalConflictFixture({
      recommendationResult: buildApprovalConflictFixture().input.recommendationResult,
    }).result;
    const forced = {
      ...approvalConflictResult,
      record: Object.freeze({
        ...approvalConflictResult.record,
        failClosed: true,
      }),
    };
    const result = buildConstitutionalReplayFixture({
      approvalConflictResult: forced,
    }).result;

    expect(result.record.failClosed).toBe(true);
    expect(result.record.replayAttackState).toBe("FAIL_CLOSED");
  });
});
