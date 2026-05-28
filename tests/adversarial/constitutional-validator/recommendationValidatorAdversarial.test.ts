import { describe, expect, it } from "vitest";
import { buildConstitutionalRecommendationValidationFixture } from "@/tests/integration/constitutional-validator/helpers";

describe("constitutional recommendation validator adversarial", () => {
  it.each([
    { metadata: { executionPayload: true }, code: "RECOMMENDATION_VALIDATION_EXECUTION_RISK" },
    { metadata: { schedulerPayload: true }, code: "RECOMMENDATION_VALIDATION_SCHEDULER_SEMANTICS" },
    { metadata: { runtimeLinked: true }, code: "RECOMMENDATION_VALIDATION_CONTAINMENT_INVALID" },
    { metadata: { recursiveCoordination: true }, code: "RECOMMENDATION_VALIDATION_RECURSIVE_COORDINATION" },
    { metadata: { governanceBypass: true }, code: "RECOMMENDATION_VALIDATION_GOVERNANCE_DRIFT" },
    { metadata: { overrideSuppression: true }, code: "RECOMMENDATION_VALIDATION_APPROVAL_DRIFT" },
    { metadata: { authorityExpansion: true }, code: "RECOMMENDATION_VALIDATION_AUTHORITY_EXPANSION" },
    { metadata: { proposalMutation: true }, code: "RECOMMENDATION_VALIDATION_MUTATION_DETECTED" },
    { metadata: { syntheticAncestry: true }, code: "RECOMMENDATION_VALIDATION_SYNTHETIC_ANCESTRY" },
  ])("detects adversarial marker %#", ({ metadata, code }) => {
    const fixture = buildConstitutionalRecommendationValidationFixture({
      metadata: Object.freeze(metadata),
    });
    expect(fixture.result.errors.some((error) => error.code === code)).toBe(true);
  });
});
