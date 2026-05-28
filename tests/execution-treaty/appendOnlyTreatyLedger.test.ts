import { describe, expect, it } from "vitest";
import { appendExecutionTreatyEvent } from "@/services/execution-treaty";

describe("append-only treaty ledger", () => {
  it("appends deterministic events without rewriting prior entries", () => {
    const first = appendExecutionTreatyEvent([], {
      eventType: "treaty.created",
      treatyId: "treaty-1",
      result: "success",
      occurredAt: "2026-05-16T00:00:00.000Z",
    });
    const second = appendExecutionTreatyEvent(first, {
      eventType: "treaty.archived",
      treatyId: "treaty-1",
      result: "success",
      occurredAt: "2026-05-16T00:01:00.000Z",
    });

    expect(first).toHaveLength(1);
    expect(second).toHaveLength(2);
    expect(second[0]).toEqual(first[0]);
  });
});
