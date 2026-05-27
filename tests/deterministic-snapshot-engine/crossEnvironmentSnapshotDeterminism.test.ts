import { describe, expect, it } from "vitest";
import { buildSnapshotFixture } from "./helpers";

describe("cross environment snapshot determinism", () => {
  it("preserves hashes across payload ordering and nominal environment variance", () => {
    const first = buildSnapshotFixture({
      payload: {
        z: "last",
        a: "first",
        nested: {
          right: "b",
          left: "a",
        },
      },
    });
    const second = buildSnapshotFixture({
      payload: {
        nested: {
          left: "a",
          right: "b",
        },
        a: "first",
        z: "last",
      },
    });

    expect(second.snapshot.payloadHash).toBe(first.snapshot.payloadHash);
    expect(second.snapshot.integrityHash).toBe(first.snapshot.integrityHash);
  });
});
