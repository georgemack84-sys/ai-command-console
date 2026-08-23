import { describe, expect, it } from "vitest";
import {
  recordCanonicalClassificationForReplay,
  replayCanonicalClassification,
  validateTaxonomyCategoryDeprecation,
  validateTaxonomyExtensionAnalysis,
} from "../../../services/learning-constitution";

const request = {
  source: { observationId: "replay-1", sourceId: "source-1", sourceType: "OPERATOR_STATEMENT" as const, originatingActorId: "user-1", observedAt: "2026-08-21T00:00:00.000Z" },
  content: "We decided to use PostgreSQL.", contextFrames: [], maximumContextFrames: 6,
};

describe("taxonomy lifecycle and replay", () => {
  it("requires complete deprecation and extension analysis contracts", () => {
    expect(validateTaxonomyCategoryDeprecation({ categoryId: "OLD_CATEGORY", deprecated: true, deprecatedSince: "2026-08-21T00:00:00.000Z", replacementCategory: "CONCEPT", migrationRule: "Send records to review.", removalVersion: "2.0.0" }).replacementCategory).toBe("CONCEPT");
    expect(() => validateTaxonomyCategoryDeprecation({ categoryId: "OLD_CATEGORY", deprecated: true, deprecatedSince: "invalid", migrationRule: "", removalVersion: "2.0.0" })).toThrow();
    expect(validateTaxonomyExtensionAnalysis({ proposedCategoryId: "LOCAL_CONTEXT", semanticDefinition: "A local context type.", existingCategoryGap: "No category captures it.", nearestSemanticNeighbors: ["CONVERSATION"], uniqueDownstreamBehavior: "Supports distinct review.", positiveExamples: ["Local note."], counterexamples: ["Global decision."], doesNotImply: ["Authority."], durabilityInteraction: "No durability.", authorityInteraction: "No authority.", promotionInteraction: "Promotion required.", requiresReclassification: false, migrationRequirement: "No migration." }).proposedCategoryId).toBe("LOCAL_CONTEXT");
  });

  it("records sufficient immutable metadata for deterministic replay", () => {
    const record = recordCanonicalClassificationForReplay("record-1", "2026-08-21T00:00:00.000Z", request);
    expect(replayCanonicalClassification(record)).toMatchObject({ reproducible: true, persistenceEffect: "NONE", authorityEffect: "UNCHANGED" });
    expect(() => replayCanonicalClassification({ ...record, configuration: { maximumContextFrames: 3 } })).toThrow(/invalid/);
  });
});
