import { describe, expect, it } from "vitest";
import { buildEvidenceAggregationFixture } from "@/tests/integration/evidence-aggregation/helpers";

describe("evidence aggregation engine", () => {
  it("aggregates deterministic evidence on the happy path", () => {
    const fixture = buildEvidenceAggregationFixture();

    expect(fixture.result.freeze.frozen).toBe(false);
    expect(fixture.result.evidenceReferences.length).toBeGreaterThan(0);
    expect(fixture.result.session.aggregationStatus).toBe("completed");
  });

  it("preserves immutable evidence references", () => {
    const fixture = buildEvidenceAggregationFixture();
    const reference = fixture.result.evidenceReferences[0];

    expect(reference?.canonicalHash).toBeTruthy();
    expect(reference?.sourceHash).toBeTruthy();
    expect(reference?.lineage.sourceSnapshots.length).toBeGreaterThan(0);
  });
});
