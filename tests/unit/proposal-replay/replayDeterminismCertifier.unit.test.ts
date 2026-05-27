import { certifyProposalReplayDeterminism } from "@/services/proposal-replay/replayDeterminismCertifier";
import { buildProposalReplayFixture } from "@/tests/integration/proposal-replay/helpers";

describe("replayDeterminismCertifier", () => {
  it("certifies identical replay inputs deterministically", () => {
    const fixture = buildProposalReplayFixture();
    const result = certifyProposalReplayDeterminism({
      replay: fixture.result.replay,
      snapshotBundle: fixture.result.snapshotBundle,
      lineage: fixture.result.lineage,
      drifts: fixture.result.drifts,
      auditRecords: fixture.result.auditRecords,
    });

    expect(result.certification.certified).toBe(true);
    expect(buildProposalReplayFixture().result.deterministicHash).toBe(fixture.result.deterministicHash);
  });
});
