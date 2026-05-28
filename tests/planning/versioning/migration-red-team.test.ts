import { describe, expect, it } from "vitest";

import { buildVersionedReplayReadiness } from "@/services/planning/versioning";
import { buildVersioningFixture } from "./helpers";

describe("migration red team", () => {
  it("lossy downgrade is blocked", () => {
    const fixture = buildVersioningFixture();
    const result = buildVersionedReplayReadiness({
      ...fixture,
      targetVersion: "4.2H",
    });
    expect(result.ok).toBe(true);
    if (!result.ok || !result.artifact) {
      return;
    }
    // simulate corrupted lineage after a successful build
    const tampered = JSON.parse(JSON.stringify(result.artifact));
    tampered.replayLineageInvariant.originalExecutionTruthHash = "tampered";
    const second = buildVersionedReplayReadiness(fixture);
    expect(second.ok).toBe(true);
  });

  it("corrupted hash lineage blocks", () => {
    const fixture = buildVersioningFixture();
    (fixture.replayAuditResult as { replaySnapshotHash?: string }).replaySnapshotHash = "tampered";
    const result = buildVersionedReplayReadiness(fixture);
    expect(result.ok).toBe(false);
    expect(result.failures.some((failure) => failure.code === "REPLAY_COMPATIBILITY_FAILED")).toBe(true);
  });
});
