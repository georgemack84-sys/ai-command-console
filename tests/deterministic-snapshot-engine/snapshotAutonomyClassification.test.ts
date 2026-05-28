import { describe, expect, it } from "vitest";
import { buildSnapshotFixture } from "./helpers";

describe("snapshot autonomy classification", () => {
  it("preserves the A0-A5 autonomy axis as immutable evidence", () => {
    const fixture = buildSnapshotFixture({
      snapshotType: "autonomy_classification",
      autonomyLevel: "A5",
      payload: { placeholder: true },
    });

    expect(fixture.snapshot.snapshotType).toBe("autonomy_classification");
    expect(fixture.snapshot.autonomyLevel).toBe("A5");
  });
});
