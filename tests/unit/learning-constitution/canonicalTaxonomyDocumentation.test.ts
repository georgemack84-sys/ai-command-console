import { describe, expect, it } from "vitest";
import { renderCanonicalTaxonomyCategoryCardsMarkdown } from "../../../services/learning-constitution";
import { CANONICAL_INFORMATION_CATEGORIES } from "../../../types/learning-constitution";

describe("canonical taxonomy category documentation", () => {
  it("renders a uniform complete card for every frozen category", () => {
    const markdown = renderCanonicalTaxonomyCategoryCardsMarkdown();
    for (const category of CANONICAL_INFORMATION_CATEGORIES) {
      expect(markdown).toContain(`Identifier: \`${category}\``);
    }
    for (const field of ["Definition:", "Semantic intent:", "Default durability:", "Default authority:", "Candidate knowledge:", "Promotion requirement:", "Validation requirement:", "Scope behavior:", "Conflict behavior:", "Supersession behavior:", "Positive examples:", "Counterexamples:", "Boundary cases:", "Does not imply:", "Related categories:", "Implementation notes:", "Test cases:"]) {
      expect(markdown).toContain(field);
    }
  });
});
