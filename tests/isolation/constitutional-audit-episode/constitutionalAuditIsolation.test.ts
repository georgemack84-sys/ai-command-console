import { describe, expect, it } from "vitest";
import { buildConstitutionalAuditEpisodeFixture } from "@/tests/integration/constitutional-audit-episode/helpers";

describe("constitutional audit isolation", () => {
  it("detects execution imports and runtime bridges", () => {
    const fixture = buildConstitutionalAuditEpisodeFixture({
      metadata: {
        executionImport: "node:child_process",
        runtimeBridges: true,
      },
    });

    expect(fixture.result.errors.map((item) => item.code)).toContain("CONSTITUTIONAL_AUDIT_ISOLATION_VIOLATION");
    expect(fixture.result.record.episodeState).toBe("blocked");
  });
});
