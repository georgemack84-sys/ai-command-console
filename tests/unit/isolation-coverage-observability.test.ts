import { describe, expect, it } from "vitest";

import { buildIsolationCoverageSnapshot } from "../../services/security/isolationCoverage.ts";

describe("isolation coverage observability", () => {
  it("emits persistence_enforced when store ownership is explicit", () => {
    const snapshot = buildIsolationCoverageSnapshot({
      executionState: "persistence_enforced",
      locks: "persistence_enforced",
      contracts: "boundary_enforced",
      sam: "boundary_enforced",
    });

    expect(snapshot.overall).toBe("persistence_enforced");
  });

  it("degrades safely when ownership truth is unknown", () => {
    const snapshot = buildIsolationCoverageSnapshot({
      executionState: "legacy_unscoped",
      locks: "degraded",
      contracts: "boundary_enforced",
      sam: "boundary_enforced",
    });

    expect(snapshot.overall).toBe("degraded");
  });
});
