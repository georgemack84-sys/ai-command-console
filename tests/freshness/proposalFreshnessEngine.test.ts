import { describe, expect, it } from "vitest";
import { evaluateProposalFreshness } from "@/services/freshness/proposalFreshnessEngine";
import { buildFreshnessFixture } from "./helpers";

describe("proposal freshness engine", () => {
  it("produces deterministic freshness output", () => {
    const { input } = buildFreshnessFixture();
    const left = evaluateProposalFreshness(input);
    const right = evaluateProposalFreshness(input);
    expect(left.freshnessHash).toBe(right.freshnessHash);
    expect(left.state).toEqual(right.state);
  });

  it("requires explicit revalidation as freshness degrades", () => {
    const { evaluation } = buildFreshnessFixture({
      evaluatedAt: "2026-05-17T06:45:00.000Z",
    });
    expect(["revalidation_required", "stale", "expired", "frozen"]).toContain(evaluation.state.freshnessStatus);
    expect(evaluation.errors.map((error) => error.code)).toContain("FRESHNESS_REVALIDATION_REQUIRED");
  });

  it("does not mutate inputs", () => {
    const { input } = buildFreshnessFixture();
    const before = JSON.stringify(input);
    evaluateProposalFreshness(input);
    expect(JSON.stringify(input)).toBe(before);
  });
});
