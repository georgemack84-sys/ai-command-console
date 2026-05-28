import { describe, expect, it } from "vitest";
import { buildSnapshotFixture } from "./helpers";

describe("snapshot canonical serialization", () => {
  it("ignores object key ordering when hashing snapshots", () => {
    const first = buildSnapshotFixture({
      payload: {
        b: "second",
        a: "first",
        nested: {
          z: 2,
          y: 1,
        },
      },
    });
    const second = buildSnapshotFixture({
      payload: {
        nested: {
          y: 1,
          z: 2,
        },
        a: "first",
        b: "second",
      },
    });

    expect(second.snapshot.payloadHash).toBe(first.snapshot.payloadHash);
    expect(second.snapshot.integrityHash).toBe(first.snapshot.integrityHash);
  });
});
