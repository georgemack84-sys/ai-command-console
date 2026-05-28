import { describe, expect, it } from "vitest";

import { buildAutonomyAuditEpisode } from "@/services/autonomy-audit-episode-model";
import { buildAutonomyAuditEpisodeFixture } from "./helpers";

describe("autonomy audit adversarial constraints", () => {
  it("fails closed on execution-shaped and orchestration-shaped metadata", () => {
    const { input } = buildAutonomyAuditEpisodeFixture({
      metadata: Object.freeze({
        dispatchPlan: true,
        runtimeControl: true,
        schedulerIntent: true,
      }),
    });
    const episode = buildAutonomyAuditEpisode(input);
    expect(episode.errors.map((error) => error.code)).toContain("AUTONOMY_AUDIT_EPISODE_INVALID");
  });

  it("fails closed on replay poisoning and evidence tampering", () => {
    const { input } = buildAutonomyAuditEpisodeFixture();
    const poisoned = Object.freeze({
      ...input,
      monitoringModel: Object.freeze({
        ...input.monitoringModel,
        replayBinding: Object.freeze({
          ...input.monitoringModel.replayBinding,
          valid: false,
          disputed: true,
        }),
      }),
    });
    const episode = buildAutonomyAuditEpisode(poisoned);
    expect(episode.errors.map((error) => error.code)).toContain("AUTONOMY_REPLAY_MISMATCH");
  });
});
