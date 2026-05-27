import { describe, expect, it } from "vitest";

import { buildReplayAuditReadiness } from "@/services/planning/replay-audit";
import { buildReplayAuditFixture } from "./helpers";

describe("audit artifact", () => {
  it("builds stable audit artifact hash", () => {
    const fixture = buildReplayAuditFixture();
    const left = buildReplayAuditReadiness(fixture);
    const right = buildReplayAuditReadiness(JSON.parse(JSON.stringify(fixture)));
    expect(left.auditArtifactHash).toBe(right.auditArtifactHash);
  });
});
