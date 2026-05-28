import { beforeEach, describe, expect, it, vi } from "vitest";

const mockedAuditTrail = vi.hoisted(() => ({
  appendAuditEvent: vi.fn(),
}));

vi.mock("../../services/auditTrail.js", () => mockedAuditTrail);

import { appendSamAuditEvent } from "../../services/sam/samAudit.ts";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("sam audit", () => {
  it("appends through safe API if available", async () => {
    mockedAuditTrail.appendAuditEvent.mockReturnValue({ id: "audit_1" });

    const result = await appendSamAuditEvent({
      type: "sam.proposal.created",
      proposalId: "proposal_1",
      executionId: "demo-exec-1",
    });

    expect(result.appended).toBe(true);
    expect(result.auditId).toBe("audit_1");
  });

  it("skips safely if unavailable", async () => {
    mockedAuditTrail.appendAuditEvent.mockImplementation(undefined as any);

    const result = await appendSamAuditEvent({
      type: "sam.proposal.created",
      proposalId: "proposal_1",
      executionId: "demo-exec-1",
    });

    expect(result.skipped).toBe(true);
    expect(result.reason).toBe("SAFE_AUDIT_API_NOT_FOUND");
  });

  it("never creates new audit store", async () => {
    const fakeDb = { run: vi.fn(), exec: vi.fn() };

    await appendSamAuditEvent({
      db: fakeDb,
      type: "sam.preflight.failed",
      proposalId: "proposal_1",
      executionId: "demo-exec-1",
    });

    expect(fakeDb.run).not.toHaveBeenCalled();
    expect(fakeDb.exec).not.toHaveBeenCalled();
  });
});
