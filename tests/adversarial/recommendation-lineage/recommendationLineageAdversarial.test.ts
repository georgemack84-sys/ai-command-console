import { describe, expect, it } from "vitest";
import { buildRecommendationLineageFixture } from "@/tests/integration/recommendation-lineage/helpers";

describe("recommendation lineage adversarial", () => {
  it.each([
    { metadata: { replayRepairAttack: true }, code: "RECOMMENDATION_LINEAGE_REPLAY_DRIFT" },
    { metadata: { policyReplacementAttack: true }, code: "RECOMMENDATION_LINEAGE_POLICY_SUBSTITUTION" },
    { metadata: { approvalInheritanceCorruption: true }, code: "RECOMMENDATION_LINEAGE_APPROVAL_AMBIGUOUS" },
    { metadata: { runtimeLinked: true }, code: "RECOMMENDATION_LINEAGE_RUNTIME_LINKED" },
    { metadata: { authorityExpansion: true }, code: "RECOMMENDATION_LINEAGE_AUTHORITY_EXPANSION" },
    { metadata: { syntheticLineage: true }, code: "RECOMMENDATION_LINEAGE_SYNTHETIC_ANCESTRY" },
  ])("fails closed for %j", ({ metadata, code }) => {
    const fixture = buildRecommendationLineageFixture({
      metadata: Object.freeze(metadata),
    });
    expect(fixture.result.errors.some((error) => error.code === code)).toBe(true);
  });
});
