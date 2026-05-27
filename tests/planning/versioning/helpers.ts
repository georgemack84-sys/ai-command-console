import { buildReplayAuditFixture } from "@/tests/planning/replay-audit/helpers";
import { buildReplayAuditReadiness } from "@/services/planning/replay-audit";

export function buildVersioningFixture() {
  const fixture = buildReplayAuditFixture();
  const replayAuditResult = buildReplayAuditReadiness(fixture);
  if (replayAuditResult.verdict !== "REPLAY_AUDIT_READY") {
    throw new Error("Expected replay audit fixture to be ready.");
  }

  return {
    replayAuditResult: structuredClone(replayAuditResult),
    executionCompatibilityContract: structuredClone(fixture.executionCompatibilityContract),
  };
}
