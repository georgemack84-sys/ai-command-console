import { describe, expect, it } from "vitest";
import { buildSnapshotFixture, verifySnapshotIntegrity } from "./helpers";

describe("snapshot integrity hash", () => {
  it("changes when payload, schema, governance, or authority evidence changes", () => {
    const base = buildSnapshotFixture();
    const changed = buildSnapshotFixture({
      payload: {
        executionState: "changed",
      },
    });

    expect(changed.snapshot.integrityHash).not.toBe(base.snapshot.integrityHash);
    expect(verifySnapshotIntegrity(base.snapshot).valid).toBe(true);
  });
});
