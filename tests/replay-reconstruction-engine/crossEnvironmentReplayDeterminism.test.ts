import { describe, expect, it } from "vitest";
import { buildReplayReconstruction } from "@/services/replay-reconstruction-engine";
import { buildReplayFixture } from "./helpers";

describe("cross environment replay determinism", () => {
  it("keeps deterministic replay outputs stable across environment labels", () => {
    const fixture = buildReplayFixture();
    const left = buildReplayReconstruction({
      ...fixture.input,
      environmentId: "dev-a",
    });
    const right = buildReplayReconstruction({
      ...fixture.input,
      environmentId: "prod-b",
    });

    expect(right.reconstructionHash).toBe(left.reconstructionHash);
  });
});
