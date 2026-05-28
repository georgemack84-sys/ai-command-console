import { describe, expect, it } from "vitest";
import { buildSnapshotFixture } from "./helpers";

describe("snapshot governance decision", () => {
  it("captures immutable governance decision records as hash-bound evidence", () => {
    const fixture = buildSnapshotFixture({
      snapshotType: "governance_decision",
      payload: { placeholder: true },
    });

    expect(fixture.snapshot.snapshotType).toBe("governance_decision");
    expect(JSON.stringify(fixture.governanceDecision)).toContain("decision-record-001");
    expect(fixture.snapshot.payloadHash).toMatch(/^[a-f0-9]{64}$/);
  });
});
