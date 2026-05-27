import { describe, expect, it } from "vitest";
import { buildMissionConsoleFixture } from "./helpers";

describe("deterministic console view", () => {
  it("builds a stable console hash and identical view for identical inputs", () => {
    const first = buildMissionConsoleFixture();
    const second = buildMissionConsoleFixture();

    expect(second.view).toEqual(first.view);
    expect(second.view.consoleHash).toBe(first.view.consoleHash);
  });
});
