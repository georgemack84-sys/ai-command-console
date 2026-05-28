import { describe, expect, it } from "vitest";
import { monitorGovernanceDrift } from "@/services/drift/governanceDriftMonitor";

describe("governance drift monitor", () => {
  it("escalates incompatible governance snapshots", () => {
    const result = monitorGovernanceDrift({
      proposalId: "proposal-a",
      proposalGovernanceHash: "gov-a",
      lifecycleGovernanceHash: "gov-b",
      createdAt: "2026-05-17T06:10:00.000Z",
    });
    expect(result.compatibility).toBe("review_required");
    expect(result.drifts[0]?.requiresEscalation).toBe(true);
  });
});
