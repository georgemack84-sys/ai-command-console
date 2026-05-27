import { describe, expect, it } from "vitest";
import { loadConfidenceSnapshots } from "@/services/confidence-engine/confidenceSnapshotLoader";
import { buildDeterministicConfidenceFixture } from "@/tests/integration/confidence-engine/helpers";

describe("confidenceSnapshotLoader", () => {
  it("loads immutable snapshot coordinates from proposal lineage", () => {
    const fixture = buildDeterministicConfidenceFixture();
    const loaded = loadConfidenceSnapshots(fixture.input);

    expect(loaded.snapshotBundle.evidenceSnapshotId).toBe(fixture.input.proposalIntegrityResult.snapshot.snapshotId);
    expect(loaded.snapshotBundle.governanceSnapshotId).toBe(fixture.input.proposalGovernanceBindingResult.binding.governanceSnapshotId);
  });
});
