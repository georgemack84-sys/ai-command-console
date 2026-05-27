import { describe, expect, it } from "vitest";

import { buildVersionedReplayReadiness } from "@/services/planning/versioning";
import { buildVersioningFixture } from "./helpers";

describe("replay lineage", () => {
  it("replay identity root remains stable", () => {
    const fixture = buildVersioningFixture();
    const result = buildVersionedReplayReadiness(fixture);
    expect(result.ok).toBe(true);
    if (!result.ok || !result.artifact) {
      return;
    }
    expect(result.artifact.immutableReplayIdentityRoot.executionTruthHash).toBe(fixture.executionCompatibilityContract.executionTruthHash);
    expect(result.artifact.immutableReplayIdentityRoot.executionCompatibilityHash).toBe(fixture.executionCompatibilityContract.executionCompatibilityHash);
    expect(result.artifact.immutableReplayIdentityRoot.initialReplaySnapshotHash).toBe(fixture.replayAuditResult.replaySnapshotHash);
  });

  it("executionTruthHash is preserved", () => {
    const fixture = buildVersioningFixture();
    const result = buildVersionedReplayReadiness(fixture);
    expect(result.artifact?.replayLineageInvariant.originalExecutionTruthHash).toBe(fixture.executionCompatibilityContract.executionTruthHash);
  });

  it("executionCompatibilityHash is preserved", () => {
    const fixture = buildVersioningFixture();
    const result = buildVersionedReplayReadiness(fixture);
    expect(result.artifact?.replayLineageInvariant.originalExecutionCompatibilityHash).toBe(fixture.executionCompatibilityContract.executionCompatibilityHash);
  });

  it("replaySnapshotHash is preserved", () => {
    const fixture = buildVersioningFixture();
    const result = buildVersionedReplayReadiness(fixture);
    expect(result.artifact?.replayLineageInvariant.replaySnapshotHash).toBe(fixture.replayAuditResult.replaySnapshotHash);
  });
});
