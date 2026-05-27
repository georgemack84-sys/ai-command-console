import { describe, expect, it } from "vitest";
import { evaluateProposalFreshness } from "@/services/freshness/proposalFreshnessEngine";
import { buildFreshnessFixture } from "./helpers";

describe("adversarial freshness constraints", () => {
  it("rejects silent freshness renewal", () => {
    const { input } = buildFreshnessFixture({
      metadata: Object.freeze({ autoRefresh: true }),
    });
    expect(evaluateProposalFreshness(input).errors.map((error) => error.code)).toContain("AUTO_REVALIDATION_FORBIDDEN");
  });

  it("rejects telemetry-triggered trust restoration", () => {
    const { input } = buildFreshnessFixture({
      metadata: Object.freeze({ trustIncreaseRequested: true }),
    });
    expect(evaluateProposalFreshness(input).errors.map((error) => error.code)).toContain("FRESHNESS_TRUST_ACCUMULATION_REJECTED");
  });
});
