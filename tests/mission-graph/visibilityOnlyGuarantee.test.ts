import { describe, expect, it } from "vitest";

import { assertMissionGraphSourcesAreReadOnly } from "@/services/mission-graph/graphBoundaryEnforcer";
import { loadMissionGraphSources } from "./helpers";

describe("mission graph visibility-only guarantee", () => {
  it("keeps source surfaces free of runtime control", () => {
    expect(assertMissionGraphSourcesAreReadOnly(loadMissionGraphSources())).toEqual([]);
  });
});
