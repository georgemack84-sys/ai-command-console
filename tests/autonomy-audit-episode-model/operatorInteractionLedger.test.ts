import { describe, expect, it } from "vitest";

import { buildAutonomyAuditEpisodeFixture } from "./helpers";

describe("operatorInteractionLedger", () => {
  it("preserves operator chronology from immutable override lineage", () => {
    const { episode, input } = buildAutonomyAuditEpisodeFixture();
    expect(episode.operatorInteractions.length).toBe(input.overrideContract.lineage.entries.length);
    expect(episode.operatorInteractions[0]?.operatorId).toBe(input.overrideContract.lineage.entries[0]?.override.operatorId);
  });
});
