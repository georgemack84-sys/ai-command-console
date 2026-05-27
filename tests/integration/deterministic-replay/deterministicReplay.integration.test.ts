import { describe, expect, it } from "vitest";
import { buildDeterministicReplayFixture } from "./helpers";

describe("deterministic replay integration", () => {
  it("emits immutable replay lineage and audit records", () => {
    const fixture = buildDeterministicReplayFixture();
    expect(fixture.result.lineage.entries.length).toBe(1);
    expect(fixture.result.auditLedger.length).toBe(2);
    expect(fixture.result.immutableSnapshots.length).toBeGreaterThan(0);
  });
});
