import { describe, expect, it } from "vitest";

import { buildApprovalTimeWindow } from "@/services/approval-dependency-graph";

describe("approvalTimeWindowEngine", () => {
  it("marks expired windows invalid", () => {
    const window = buildApprovalTimeWindow({
      validFrom: "2026-05-16T14:00:00.000Z",
      validUntil: "2026-05-16T14:30:00.000Z",
      timestamp: "2026-05-16T15:00:00.000Z",
    });
    expect(window.expired).toBe(true);
    expect(window.validAtTimestamp).toBe(false);
  });
});
