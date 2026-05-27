import { describe, expect, it } from "vitest";
import { buildSnapshotFixture } from "./helpers";

describe("deterministic snapshot creation", () => {
  it("produces identical snapshot hashes for identical input", () => {
    const first = buildSnapshotFixture();
    const second = buildSnapshotFixture();

    expect(second.snapshot).toEqual(first.snapshot);
    expect(second.snapshot.payloadHash).toBe(first.snapshot.payloadHash);
    expect(second.snapshot.integrityHash).toBe(first.snapshot.integrityHash);
  });
});
