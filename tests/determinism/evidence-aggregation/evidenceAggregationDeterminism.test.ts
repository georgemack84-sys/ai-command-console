import { describe, expect, it } from "vitest";
import { buildEvidenceAggregationFixture } from "@/tests/integration/evidence-aggregation/helpers";

describe("evidence aggregation determinism", () => {
  it("produces identical hashes for identical inputs", () => {
    const first = buildEvidenceAggregationFixture();
    const second = buildEvidenceAggregationFixture();

    expect(first.result.deterministicHash).toBe(second.result.deterministicHash);
    expect(first.result.session.canonicalAggregationHash).toBe(second.result.session.canonicalAggregationHash);
  });
});
