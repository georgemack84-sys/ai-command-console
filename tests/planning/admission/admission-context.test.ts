import { describe, expect, it } from "vitest";

import { buildAdmissionContext } from "@/services/planning/admission";
import { buildAdmissionFixture } from "@/tests/planning/admission/helpers";

describe("admission context", () => {
  it("builds a deterministic admission context", () => {
    const fixture = buildAdmissionFixture();
    expect(buildAdmissionContext(fixture)).toEqual(buildAdmissionContext(fixture));
  });

  it("preserves upstream hashes in context lineage", () => {
    const fixture = buildAdmissionFixture();
    const context = buildAdmissionContext(fixture);
    expect(context.lineage.executionTruthHash).toBe(fixture.executionTruthPackage.executionTruthHash);
    expect(context.lineage.executionCompatibilityHash).toBe(fixture.executionCompatibilityContract.executionCompatibilityHash);
    expect(context.lineage.replaySnapshotHash).toBe(fixture.versionedReplayArtifact.replayAuditResult.replaySnapshotHash);
    expect(context.lineage.derivedSimulationHash).toBe(fixture.simulationReadiness?.derivedSimulationHash);
  });
});
