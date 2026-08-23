import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import {
  CANONICAL_TAXONOMY_REGISTRY,
  renderCanonicalTaxonomyReferenceMarkdown,
  validateCanonicalTaxonomyRegistry,
} from "@/services/learning-constitution";

describe("canonical taxonomy reference", () => {
  it("renders the committed category guide directly from the validated registry", () => {
    const document = readFileSync(resolve(process.cwd(), "docs/governance/canonical-learning-taxonomy-reference.md"), "utf8");
    expect(document).toBe(renderCanonicalTaxonomyReferenceMarkdown());
  });

  it("preserves every required boundary and critical false-promotion guard", () => {
    const pairs = CANONICAL_TAXONOMY_REGISTRY.boundaryRules.map((rule) => `${rule.leftCategory}:${rule.rightCategory}`);
    expect(pairs).toEqual(expect.arrayContaining([
      "QUESTION:FACT", "BRAINSTORM:IDEA", "IDEA:SUGGESTION", "SUGGESTION:INSTRUCTION", "PREFERENCE:INSTRUCTION",
      "INSTRUCTION:RULE", "RULE:PRINCIPLE", "PRINCIPLE:PROCEDURE", "EXAMPLE:FACT", "IDEA:DECISION",
      "SUGGESTION:DECISION", "GOAL:DECISION", "FEEDBACK:PREFERENCE", "FEEDBACK:CORRECTION", "CORRECTION:DECISION", "EXCEPTION:RULE",
    ]));
    expect(CANONICAL_TAXONOMY_REGISTRY.boundaryRules.flatMap((rule) => rule.prohibitedInferences)).toEqual(expect.arrayContaining([
      "QUESTION -> INSTRUCTION", "EXAMPLE -> RULE", "IDEA -> DECISION", "SUGGESTION -> RULE", "PROCEDURE -> AUTHORIZATION",
    ]));
  });

  it("rejects malformed, duplicate, and incomplete boundary-rule data", () => {
    const missing = { ...CANONICAL_TAXONOMY_REGISTRY, boundaryRules: CANONICAL_TAXONOMY_REGISTRY.boundaryRules.slice(1) };
    expect(() => validateCanonicalTaxonomyRegistry(missing)).toThrow();
    const duplicate = { ...CANONICAL_TAXONOMY_REGISTRY, boundaryRules: [...CANONICAL_TAXONOMY_REGISTRY.boundaryRules, CANONICAL_TAXONOMY_REGISTRY.boundaryRules[0]] };
    expect(() => validateCanonicalTaxonomyRegistry(duplicate)).toThrow();
    const malformed = { ...CANONICAL_TAXONOMY_REGISTRY, boundaryRules: [{ ...CANONICAL_TAXONOMY_REGISTRY.boundaryRules[0], distinction: "" }, ...CANONICAL_TAXONOMY_REGISTRY.boundaryRules.slice(1)] };
    expect(() => validateCanonicalTaxonomyRegistry(malformed)).toThrow();
    const replacedRequiredPair = {
      ...CANONICAL_TAXONOMY_REGISTRY,
      boundaryRules: [{ ...CANONICAL_TAXONOMY_REGISTRY.boundaryRules[0], leftCategory: "CONVERSATION" }, ...CANONICAL_TAXONOMY_REGISTRY.boundaryRules.slice(1)],
    };
    expect(() => validateCanonicalTaxonomyRegistry(replacedRequiredPair)).toThrow();
  });
});
