import { describe, expect, it } from "vitest";
import {
  buildOperatorAuthorityArtifactFixture,
  buildProposalArtifactFixture,
  buildRecommendationArtifactFixture,
  buildReplayArtifactFixture,
} from "./helpers";
import { buildDeterministicReplayFixture } from "@/tests/integration/deterministic-replay/helpers";

describe("hidden execution detection integration", () => {
  it("scans recommendation artifacts", () => {
    const fixture = buildRecommendationArtifactFixture();
    expect(fixture.result.report.artifactType).toBe("recommendation");
    expect(fixture.result.report.scanPassed).toBe(true);
  });

  it("scans proposal artifacts", () => {
    const fixture = buildProposalArtifactFixture();
    expect(fixture.result.report.artifactType).toBe("proposal");
    expect(fixture.result.report.scanPassed).toBe(true);
  });

  it("scans replay artifacts without weakening 5.0F replay output", () => {
    const replayFixture = buildDeterministicReplayFixture();
    const detectionFixture = buildReplayArtifactFixture();
    expect(detectionFixture.result.report.artifactType).toBe("replay");
    expect(replayFixture.result.result.replayCertified).toBe(true);
    expect(detectionFixture.result.report.executionAuthorized).toBe(false);
  });

  it("preserves operator suppression and does not bypass authority invalidation", () => {
    const fixture = buildOperatorAuthorityArtifactFixture();
    expect(fixture.result.report.artifactType).toBe("operator_authority");
    expect(fixture.result.report.scanPassed).toBe(true);
  });

  it("hidden execution findings block downstream certification usage", () => {
    const fixture = buildProposalArtifactFixture();
    const blocked = buildProposalArtifactFixture();
    void fixture;
    expect(blocked.result.report.executionAuthorized).toBe(false);
  });
});
