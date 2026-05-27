import { describe, expect, it } from "vitest";

import { deriveKillSwitchEvent } from "@/services/human-override-contract";

describe("killSwitchContract", () => {
  it("derives kill switch evidence without mutating history", () => {
    const kill = deriveKillSwitchEvent({
      events: Object.freeze([
        Object.freeze({
          overrideId: "override-kill",
          timestamp: "2026-05-16T16:00:00.000Z",
          operatorId: "operator-01",
          operatorRole: "executive",
          overrideType: "kill_switch" as const,
          targetType: "global" as const,
          targetId: "global",
          reasonCode: "critical_stop",
          justification: "constitutional stop",
          authoritySnapshotHash: "authority",
          governanceSnapshotHash: "governance",
          approvalGraphHash: "approval-graph",
          createdAt: "2026-05-16T16:00:00.000Z",
        }),
      ]),
      autonomyStateHash: "autonomy-state",
      governanceSnapshotHash: "governance",
    });
    expect(kill?.scope).toBe("global");
  });
});
