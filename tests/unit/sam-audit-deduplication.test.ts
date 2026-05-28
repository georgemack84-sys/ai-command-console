import { beforeEach, describe, expect, it, vi } from "vitest";

const mockedAudit = vi.hoisted(() => ({
  appendSamAuditEvent: vi.fn(),
}));

vi.mock("../../services/sam/samAudit.ts", () => mockedAudit);

import { appendDeduplicatedSamAuditEvent, clearSamAuditDeduplicationState } from "../../services/sam/samAuditDeduplication.ts";

beforeEach(() => {
  vi.clearAllMocks();
  clearSamAuditDeduplicationState();
  mockedAudit.appendSamAuditEvent.mockResolvedValue({
    attempted: true,
    appended: true,
    auditId: "audit_1",
  });
});

describe("sam audit deduplication", () => {
  it("duplicate retry does not append duplicate audit", async () => {
    await appendDeduplicatedSamAuditEvent({
      type: "sam.dry_run.generated",
      proposalId: "proposal_1",
      executionId: "demo-exec-1",
      attemptId: "attempt_1",
      idempotencyKey: "key_1",
    });
    const second = await appendDeduplicatedSamAuditEvent({
      type: "sam.dry_run.generated",
      proposalId: "proposal_1",
      executionId: "demo-exec-1",
      attemptId: "attempt_1",
      idempotencyKey: "key_1",
    });

    expect(mockedAudit.appendSamAuditEvent).toHaveBeenCalledTimes(1);
    expect(second.skipped).toBe(true);
  });
});
