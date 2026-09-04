import { describe, expect, it } from "vitest";

import { analyzeTaxonomyCompatibility, validateTaxonomyChangeProposal } from "@/services/learning-constitution";
import { CANONICAL_INFORMATION_CATEGORIES, type TaxonomyChangeProposal } from "@/types/learning-constitution";

const current = { taxonomyVersion: "1.0.0", categoryIds: CANONICAL_INFORMATION_CATEGORIES };
const compatible = { taxonomyVersion: "1.1.0", categoryIds: [...CANONICAL_INFORMATION_CATEGORIES, "LOCAL_CONTEXT"] };
const breaking = { taxonomyVersion: "2.0.0", categoryIds: CANONICAL_INFORMATION_CATEGORIES.filter((category) => category !== "FEEDBACK") };
const proposal = (overrides: Partial<TaxonomyChangeProposal> = {}): TaxonomyChangeProposal => ({
  proposalId: "taxonomy-change-1", summary: "Add a local-context category.", current, proposed: compatible,
  compatibility: analyzeTaxonomyCompatibility(current, compatible), extensionAnalysis: { proposedCategoryId: "LOCAL_CONTEXT", semanticDefinition: "A local context category.", existingCategoryGap: "Existing categories do not identify local context.", nearestSemanticNeighbors: ["CONVERSATION"], uniqueDownstreamBehavior: "Enables review without authority.", positiveExamples: ["Local context."], counterexamples: ["A decision."], doesNotImply: ["Authority."], durabilityInteraction: "No durability.", authorityInteraction: "No authority.", promotionInteraction: "Promotion remains required.", requiresReclassification: false, migrationRequirement: "No migration." }, regressionCaseIds: ["clear-conversation", "adversarial-quoted-instruction"],
  approval: { status: "PENDING" }, ...overrides,
});

describe("taxonomy change governance", () => {
  it("requires semantic-version advancement appropriate to compatible and breaking changes", () => {
    expect(analyzeTaxonomyCompatibility(current, compatible)).toMatchObject({ status: "COMPATIBLE", requiredVersionBump: "MINOR", addedCategoryIds: ["LOCAL_CONTEXT"] });
    expect(analyzeTaxonomyCompatibility(current, breaking)).toMatchObject({ status: "BREAKING", requiredVersionBump: "MAJOR", removedCategoryIds: ["FEEDBACK"] });
    expect(() => analyzeTaxonomyCompatibility(current, { ...breaking, taxonomyVersion: "1.1.0" })).toThrow();
  });

  it("accepts complete compatible proposals and records approval as a separate decision", () => {
    expect(validateTaxonomyChangeProposal(proposal())).toMatchObject({ approval: { status: "PENDING" } });
    expect(validateTaxonomyChangeProposal(proposal({ approval: { status: "APPROVED", decidedBy: "governor-1", decidedAt: "2026-08-20T00:00:00.000Z", decisionReason: "Regression suite reviewed." } }))).toMatchObject({ approval: { status: "APPROVED" } });
  });

  it("rejects stale analysis, missing breaking-change migration plans, and malformed approval", () => {
    expect(() => validateTaxonomyChangeProposal(proposal({ compatibility: { ...analyzeTaxonomyCompatibility(current, compatible), requiredVersionBump: "PATCH" } }))).toThrow();
    expect(() => validateTaxonomyChangeProposal(proposal({ proposed: breaking, compatibility: analyzeTaxonomyCompatibility(current, breaking) }))).toThrow();
    expect(() => validateTaxonomyChangeProposal(proposal({ approval: { status: "APPROVED" } }))).toThrow();
    expect(() => validateTaxonomyChangeProposal(proposal({ extensionAnalysis: undefined }))).toThrow(/extension analysis/);
  });

  it("requires migration and rollback details for a breaking approved proposal", () => {
    const analysis = analyzeTaxonomyCompatibility(current, breaking);
    expect(validateTaxonomyChangeProposal(proposal({ proposed: breaking, compatibility: analysis, extensionAnalysis: undefined,
      migrationPlan: { planId: "migrate-feedback", affectedCategoryIds: ["FEEDBACK"], strategy: "Map existing records to review.", rollbackStrategy: "Restore the prior taxonomy version." },
      approval: { status: "APPROVED", decidedBy: "governor-1", decidedAt: "2026-08-20T00:00:00.000Z", decisionReason: "Migration reviewed." },
    }))).toMatchObject({ compatibility: { status: "BREAKING" } });
  });
});
