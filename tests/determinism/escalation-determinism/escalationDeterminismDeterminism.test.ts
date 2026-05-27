import { describe, expect, it } from "vitest";
import { buildEscalationDeterminismFixture } from "@/tests/integration/escalation-determinism/helpers";

describe("escalation determinism determinism", () => {
  it("produces identical escalation evidence for identical inputs", () => {
    const first = buildEscalationDeterminismFixture();
    const second = buildEscalationDeterminismFixture();

    expect(first.result.evidence.evidenceHash).toBe(second.result.evidence.evidenceHash);
    expect(first.result.lineage.lineageHash).toBe(second.result.lineage.lineageHash);
  });
});
