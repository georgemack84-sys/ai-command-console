import { describe, expect, it } from "vitest";

import { buildReplayAuditReadiness } from "@/services/planning/replay-audit";
import { buildReplayAuditFixture } from "./helpers";

describe("replay proof", () => {
  it("builds stable replay proof hash", () => {
    const fixture = buildReplayAuditFixture();
    const result = buildReplayAuditReadiness(fixture);
    expect(result.replayProofHash).toBeTruthy();
    expect(result.artifacts?.replayProof.verdict).toBe("REPLAY_COMPATIBLE");
  });
});
