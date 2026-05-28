import { describe, expect, it } from "vitest";
import { buildSnapshotFixture } from "./helpers";

describe("snapshot adaptation envelope", () => {
  it("captures adaptation constraints without enabling adaptation", () => {
    const fixture = buildSnapshotFixture({
      snapshotType: "adaptation",
      payload: { placeholder: true },
    });

    expect(fixture.snapshot.snapshotType).toBe("adaptation");
    expect(JSON.stringify(fixture.snapshot.payload)).toContain("capturedAsLegalityEnvelopeOnly");
  });
});
