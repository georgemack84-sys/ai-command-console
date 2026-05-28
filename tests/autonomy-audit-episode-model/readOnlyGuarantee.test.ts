import { describe, expect, it } from "vitest";

import { assertAuditEpisodeSourcesAreReadOnly, buildAutonomyAuditEpisode } from "@/services/autonomy-audit-episode-model";
import { buildAutonomyAuditEpisodeFixture, loadAutonomyAuditEpisodeSources } from "./helpers";

describe("autonomy audit read-only guarantees", () => {
  it("does not mutate source inputs", () => {
    const { input } = buildAutonomyAuditEpisodeFixture();
    const before = JSON.stringify(input);
    buildAutonomyAuditEpisode(input);
    expect(JSON.stringify(input)).toBe(before);
  });

  it("does not import execution or orchestration behavior", () => {
    const sources = loadAutonomyAuditEpisodeSources();
    for (const source of sources) {
      if (source.path.endsWith("auditEpisodeGuards.ts")) {
        continue;
      }
      expect(assertAuditEpisodeSourcesAreReadOnly(source.content)).toEqual([]);
    }
  });
});
