import { describe, expect, it } from "vitest";
import { buildEscalationDeterminismFixture } from "@/tests/integration/escalation-determinism/helpers";

describe("escalation determinism unit", () => {
  it("is deterministic for identical inputs", () => {
    const first = buildEscalationDeterminismFixture();
    const second = buildEscalationDeterminismFixture();

    expect(first.result.deterministicHash).toBe(second.result.deterministicHash);
    expect(first.result.forensicExport.exportHash).toBe(second.result.forensicExport.exportHash);
  });

  it("increases oversight on confidence collapse", () => {
    const fixture = buildEscalationDeterminismFixture({
      metadata: Object.freeze({ confidenceCollapse: true }),
    });

    expect(["elevated", "frozen", "disputed"]).toContain(fixture.result.record.oversightState);
  });
});
