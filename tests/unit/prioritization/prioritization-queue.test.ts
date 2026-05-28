import { describe, expect, it } from "vitest";

import { buildPrioritizationQueue } from "@/services/prioritization/prioritizationQueue";

describe("buildPrioritizationQueue", () => {
  it("separates ranked, blocked, and disputed recoveries", () => {
    const queue = buildPrioritizationQueue([
      { executionId: "exec_ranked", state: "RANKED" },
      { executionId: "exec_blocked", state: "BLOCKED" },
      { executionId: "exec_disputed", state: "DISPUTED" },
    ] as never);

    expect(queue.recoveryQueue).toEqual(["exec_ranked"]);
    expect(queue.blockedRecoveries).toEqual(["exec_blocked"]);
    expect(queue.disputedRecoveries).toEqual(["exec_disputed"]);
  });
});
