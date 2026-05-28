import { describe, expect, it } from "vitest";

import { buildMissionGraphFixture } from "./helpers";

describe("mission graph governance isolation", () => {
  it("remains advisory-only and governance-bound", () => {
    const { snapshot } = buildMissionGraphFixture();

    expect(snapshot.authorityContract.mayModifyPolicy).toBe(false);
    expect(snapshot.authorityContract.mayAdvanceLifecycle).toBe(false);
    expect(snapshot.nodes.every((node) => node.advisoryOnly && node.replaySafe)).toBe(true);
  });
});
