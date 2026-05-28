import { describe, expect, it } from "vitest";
import { buildReplayReconstruction } from "@/services/replay-reconstruction-engine";
import { buildReplayFixture } from "./helpers";

describe("no mutation behavior", () => {
  it("never mutates replay source inputs", () => {
    const fixture = buildReplayFixture();
    const before = JSON.stringify(fixture.input);

    buildReplayReconstruction(fixture.input);

    expect(JSON.stringify(fixture.input)).toBe(before);
  });
});
