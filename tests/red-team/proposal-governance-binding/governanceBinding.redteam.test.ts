import { buildProposalGovernanceBindingFixture } from "@/tests/integration/proposal-governance-binding/helpers";

describe("proposal governance binding red-team", () => {
  it("fails closed on governance drift, authority escalation, replay corruption, policy substitution, and hidden autonomy semantics", () => {
    const base = buildProposalGovernanceBindingFixture();
    const fixture = buildProposalGovernanceBindingFixture({
      policySnapshotId: "latest-policy-snapshot",
      authorityBoundary: Object.freeze({
        ...base.input.authorityBoundary,
        allowedScopes: Object.freeze(["proposal.review", "runtime.execute"]),
      }),
      recommendationReplayResult: Object.freeze({
        ...base.input.recommendationReplayResult,
        episodes: Object.freeze(base.input.recommendationReplayResult.episodes.map((episode) => Object.freeze({
          ...episode,
          governanceReplay: Object.freeze({
            ...episode.governanceReplay,
            governanceSnapshotId: "governance-drift",
          }),
        }))),
      }),
      metadata: Object.freeze({
        injected: "execute, orchestrate, schedule, runtime mutation, latest governance migration",
      }),
    });

    expect(fixture.result.status).toBe("FAILED_CLOSED");
    expect(fixture.result.errors.length).toBeGreaterThan(0);
  });
});
