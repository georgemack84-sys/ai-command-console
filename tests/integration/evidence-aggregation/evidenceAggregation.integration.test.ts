import { describe, expect, it } from "vitest";
import { buildEvidenceAggregationFixture } from "./helpers";

describe("evidence aggregation integration", () => {
  it("preserves governance and replay traceability from synthesis inputs", () => {
    const fixture = buildEvidenceAggregationFixture();

    expect(fixture.result.governanceRecord.governanceSnapshotId).toBe(
      fixture.input.recommendationSynthesisInput.recommendationValidationResult.result.governanceSnapshotId,
    );
    expect(fixture.result.replayRecord.replayHash).toBe(
      fixture.input.recommendationSynthesisInput.deterministicReplayResult.result.replayHash,
    );
  });

  it("records append-only audit entries", () => {
    const fixture = buildEvidenceAggregationFixture();
    expect(fixture.result.auditLedger.length).toBe(2);
    expect(fixture.result.auditRecord.auditHash).toBeTruthy();
  });
});
