import { describe, expect, it } from "vitest";

import { reconstructCorrelationReplay } from "@/services/intent-correlation-engine/correlationReplayReconstruction";
import { buildIntentCorrelationFixture } from "./helpers";

describe("correlation replay reconstruction", () => {
  it("reconstructs deterministically", () => {
    const { computation } = buildIntentCorrelationFixture();
    const replay = reconstructCorrelationReplay({
      result: computation.result,
      replayBinding: computation.result.replayBindings[0]!,
      lineage: computation.lineage,
    });
    expect(replay.errors).toEqual([]);
  });
});
