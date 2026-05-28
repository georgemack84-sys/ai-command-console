import { describe, expect, it } from "vitest";
import { buildEvidenceAggregationFixture } from "@/tests/integration/evidence-aggregation/helpers";

describe("evidence aggregation governance enforcement", () => {
  it("keeps a single governance snapshot across aggregated evidence", () => {
    const fixture = buildEvidenceAggregationFixture();
    const governanceIds = new Set(
      fixture.result.evidenceReferences.map((reference) => reference.governanceSnapshotId).filter(Boolean),
    );

    expect(governanceIds.size).toBe(1);
  });
});
