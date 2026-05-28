import { describe, expect, it } from "vitest";
import { buildSnapshotFixture } from "./helpers";

describe("snapshot authorization binding", () => {
  it("preserves authorization state as legality evidence", () => {
    const fixture = buildSnapshotFixture({
      snapshotType: "authorization",
      payload: { placeholder: true },
    });

    expect(fixture.snapshot.snapshotType).toBe("authorization");
    expect(fixture.snapshot.authorityHash).toMatch(/^[a-f0-9]{64}$/);
    expect(fixture.snapshot.legalityHash).toMatch(/^[a-f0-9]{64}$/);
  });
});
