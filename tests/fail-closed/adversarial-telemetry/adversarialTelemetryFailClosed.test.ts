import { describe, expect, it } from "vitest";
import { buildAdversarialTelemetryFixture } from "@/tests/integration/adversarial-telemetry/helpers";
import { buildConstitutionalAuditEpisodeFixture } from "@/tests/integration/constitutional-audit-episode/helpers";

describe("adversarial telemetry fail closed", () => {
  it("inherits upstream fail-closed state", () => {
    const episode = buildConstitutionalAuditEpisodeFixture();
    const constitutionalAuditEpisodeResult = {
      ...episode.result,
      record: {
        ...episode.result.record,
        failClosed: true,
      },
    };
    const fixture = buildAdversarialTelemetryFixture({ constitutionalAuditEpisodeResult });

    expect(fixture.result.record.telemetryState).toBe("blocked");
  });
});
