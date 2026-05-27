import { describe, expect, it } from "vitest";
import { buildProposalIntegrityFixture } from "@/tests/integration/proposal-integrity/helpers";

describe("proposal integrity governance unit", () => {
  it("binds to governance snapshots", () => {
    const fixture = buildProposalIntegrityFixture();
    expect(fixture.result.governanceBinding.governanceSnapshotId).toBeTruthy();
  });
});
