import { describe, expect, it } from "vitest";

import { buildReplayAuditReadiness } from "@/services/planning/replay-audit";
import { buildReplayAuditFixture } from "./helpers";

describe("ledger events", () => {
  it("ledger events are deterministic and hash chained", () => {
    const fixture = buildReplayAuditFixture();
    const result = buildReplayAuditReadiness(fixture);
    const ledgerEvents = result.artifacts?.ledgerEvents ?? [];
    expect(ledgerEvents.length).toBe(6);
    for (let index = 1; index < ledgerEvents.length; index += 1) {
      expect(ledgerEvents[index]!.previousEventHash).toBe(ledgerEvents[index - 1]!.eventHash);
    }
  });
});
