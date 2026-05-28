import { describe, expect, it } from "vitest";
import { revalidateReplayIntegrity } from "@/services/revalidation/replayRevalidationEngine";

describe("adversarial revalidation constraints", () => {
  it("rejects replay auto-healing attempts", () => {
    const result = revalidateReplayIntegrity({
      proposalId: "proposal-a",
      replayValid: false,
      lifecycleReplayHash: "old",
      proposalReplayHash: "new",
      lifecycleEntries: 1,
      currentLifecycleState: "approved",
      resultingLifecycleState: "approved",
      correlationEntries: 1,
      lifecycleImmutable: true,
      readinessDerivedOnly: true,
      escalationDerivedOnly: true,
      createdAt: "2026-05-17T06:10:00.000Z",
    });
    expect(result.record.replayIntegrity).not.toBe("verified");
  });
});
