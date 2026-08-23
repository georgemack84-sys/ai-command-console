import { CATEGORY_DEFAULT_MATRIX, CATEGORY_INVARIANTS } from "./orthogonalSemantics";
import { CANONICAL_TAXONOMY_REGISTRY } from "./canonicalTaxonomyRegistry";

/** Renders uniform category cards from validated registry and orthogonal metadata. */
export const renderCanonicalTaxonomyCategoryCardsMarkdown = (): string => {
  const cards = CANONICAL_TAXONOMY_REGISTRY.categories.map((category) => {
    const defaults = CATEGORY_DEFAULT_MATRIX.find((entry) => entry.category === category.id)!;
    const invariants = CATEGORY_INVARIANTS.find((entry) => entry.category === category.id)!;
    const related = CANONICAL_TAXONOMY_REGISTRY.boundaryRules
      .filter((boundary) => boundary.leftCategory === category.id || boundary.rightCategory === category.id)
      .map((boundary) => boundary.leftCategory === category.id ? boundary.rightCategory : boundary.leftCategory);
    return [
      `## ${category.displayName}`, `Identifier: \`${category.id}\``, `Definition: ${category.definition}`,
      `Semantic intent: ${category.semanticIntent}`, `Canonical meaning: ${category.definition}`,
      `Default durability: ${defaults.defaultDurability}`, `Default authority: ${defaults.defaultAuthority}`,
      `Candidate knowledge: ${defaults.candidateKnowledge ? "Yes" : "No"}`, `Promotion requirement: ${defaults.promotionRequired ? "Required" : "Not required"}`,
      `Validation requirement: ${category.validationRequirement}`, `Scope behavior: ${category.scopeRequirement}`,
      `Conflict behavior: ${category.conflictSensitivity}`, `Supersession behavior: ${category.lifecycleEligibility}`,
      `Positive examples: ${category.examples.join("; ")}`, `Counterexamples: ${category.counterexamples.join("; ")}`,
      `Boundary cases: ${related.join(", ") || "None"}`, `Does not imply: ${invariants.rules.join("; ")}`,
      `Related categories: ${related.join(", ") || "None"}`, `Implementation notes: ${category.classificationNotes.join("; ")}`,
      `Test cases: golden corpus, boundary cases, sequence cases, and adversarial cases for taxonomy v1.`, "",
    ].join("\n");
  });
  return ["# Canonical Learning Taxonomy Category Cards", "", "Generated from the frozen registry and orthogonal-semantics contract. These cards describe semantics only; they do not confer authority, durability, or execution permission.", "", ...cards].join("\n");
};
