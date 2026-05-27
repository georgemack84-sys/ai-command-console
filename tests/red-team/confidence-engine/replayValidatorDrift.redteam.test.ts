import { describe, expect, it } from "vitest";
import { buildDeterministicConfidenceFixture } from "@/tests/integration/confidence-engine/helpers";

describe("confidence validator drift red-team", () => {
  it("fails closed on live weight mutation attempts", () => {
    const fixture = buildDeterministicConfidenceFixture({
      weightTableVersion: "confidence-weight-table-mutated",
    });

    expect(fixture.result.errors.some((error) => error.code === "DETERMINISTIC_CONFIDENCE_WEIGHT_TABLE_MISMATCH")).toBe(true);
  });
});
