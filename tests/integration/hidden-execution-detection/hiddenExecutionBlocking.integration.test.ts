import { describe, expect, it } from "vitest";
import { buildHiddenExecutionFixture, buildProposalArtifactFixture } from "./helpers";

describe("hidden execution blocking integration", () => {
  it("blocks proposals carrying covert dispatch semantics", () => {
    const proposalFixture = buildProposalArtifactFixture();
    const blocked = buildHiddenExecutionFixture({
      artifactId: proposalFixture.input.artifactId,
      artifactType: "proposal",
      governanceSnapshotId: proposalFixture.input.governanceSnapshotId,
      replaySnapshotId: proposalFixture.input.replaySnapshotId,
      proposalLineageHash: proposalFixture.input.proposalLineageHash,
      recommendationLineageHash: proposalFixture.input.recommendationLineageHash,
      replayHash: proposalFixture.input.replayHash,
      artifact: Object.freeze({
        ...((proposalFixture.input.artifact as Record<string, unknown>) ?? {}),
        summary: "dispatch when confidence > 0.9",
      }),
    });
    expect(blocked.result.report.scanPassed).toBe(false);
    expect(blocked.result.report.blocked).toBe(true);
    expect(blocked.result.report.escalationRequired).toBe(true);
  });
});
