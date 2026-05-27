import { describe, expect, it } from "vitest";
import { buildConstitutionalSnapshot, buildSnapshotFixture } from "./helpers";

describe("snapshot unknown state fails closed", () => {
  it("returns an immutable fail-closed envelope when replay binding is missing", () => {
    const fixture = buildSnapshotFixture();
    const snapshot = buildConstitutionalSnapshot({
      ...fixture.input,
      sourceArtifacts: Object.freeze({
        ...fixture.input.sourceArtifacts,
        replay: undefined,
        treaty: Object.freeze({
          ...fixture.input.sourceArtifacts.treaty!,
          manifest: Object.freeze({
            ...fixture.input.sourceArtifacts.treaty!.manifest,
            replayBindingHash: "",
          }),
        }),
      }),
    });

    expect(snapshot.payload).toEqual(expect.objectContaining({ failClosed: true }));
  });
});
