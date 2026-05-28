import { describe, expect, it } from "vitest";
import { buildConstitutionalSnapshot, buildSnapshotFixture } from "./helpers";

describe("snapshot read-only behavior", () => {
  it("does not mutate snapshot inputs", () => {
    const fixture = buildSnapshotFixture();
    const before = JSON.stringify(fixture.input);

    buildConstitutionalSnapshot(fixture.input);

    expect(JSON.stringify(fixture.input)).toBe(before);
  });
});
