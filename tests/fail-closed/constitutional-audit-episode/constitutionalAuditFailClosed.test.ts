import { describe, expect, it } from "vitest";
import { buildConstitutionalAuditEpisodeFixture } from "@/tests/integration/constitutional-audit-episode/helpers";
import { buildFutureAutonomyFixture } from "@/tests/integration/future-autonomy/helpers";

describe("constitutional audit fail closed", () => {
  it("inherits upstream fail-closed states", () => {
    const future = buildFutureAutonomyFixture();
    const futureAutonomyResult = {
      ...future.result,
      record: {
        ...future.result.record,
        failClosed: true,
      },
    };
    const fixture = buildConstitutionalAuditEpisodeFixture({ futureAutonomyResult });

    expect(fixture.result.record.episodeState).toBe("blocked");
  });
});
