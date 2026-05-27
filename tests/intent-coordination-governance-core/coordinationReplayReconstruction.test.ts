import { describe, expect, it } from "vitest";

import { reconstructCoordinationReplay } from "@/services/intent-coordination-governance-core";
import { buildIntentCoordinationGovernanceFixture } from "./helpers";

describe("coordination replay reconstruction", () => {
  it("reconstructs deterministically from immutable record state", () => {
    const { record } = buildIntentCoordinationGovernanceFixture();
    const replay = reconstructCoordinationReplay(record);
    expect(replay.deterministic).toBe(true);
    expect(replay.coordinationHash).toBe(record.coordinationHash);
    expect(replay.replayBinding).toEqual(record.replayBinding);
  });
});
