import { describe, expect, it } from "vitest";
import { buildDeterministicConfidenceFixture } from "./helpers";

describe("confidence replay reconstruction", () => {
  it("reconstructs identical historical confidence under identical inputs", () => {
    const first = buildDeterministicConfidenceFixture();
    const second = buildDeterministicConfidenceFixture();

    expect(first.result.score.score).toBe(second.result.score.score);
    expect(first.result.score.outputHash).toBe(second.result.score.outputHash);
    expect(first.result.deterministicHash).toBe(second.result.deterministicHash);
  });
});
