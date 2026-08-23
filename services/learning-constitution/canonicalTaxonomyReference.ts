import { CANONICAL_TAXONOMY_REGISTRY } from "./canonicalTaxonomyRegistry";

const cell = (value: string): string => value.replaceAll("|", "\\|");

/** Renders the committed human reference directly from the validated registry. */
export const renderCanonicalTaxonomyReferenceMarkdown = (): string => {
  const categoryRows = CANONICAL_TAXONOMY_REGISTRY.categories.map((category) =>
    `| ${category.id} | ${cell(category.definition)} | ${cell(category.semanticIntent)} | ${cell(category.counterexamples.join("; "))} | ${cell(category.classificationNotes.join("; "))} |`,
  );
  const boundaryRows = CANONICAL_TAXONOMY_REGISTRY.boundaryRules.map((boundary) =>
    `| ${boundary.leftCategory} | ${boundary.rightCategory} | ${cell(boundary.distinction)} | ${cell(boundary.prohibitedInferences.join("; ") || "None")} |`,
  );
  return [
    "# Canonical Learning Taxonomy Reference",
    "",
    "This document is generated from `learning/taxonomy/registry.v1.json`. It describes semantic distinctions only; it does not grant authority, persistence, approval, or execution permission.",
    "",
    "## Category definitions and negative semantics",
    "",
    "| ID | Definition | Semantic intent | Counterexamples | Classification notes |",
    "| --- | --- | --- | --- | --- |",
    ...categoryRows,
    "",
    "## Required boundary rules",
    "",
    "| Left category | Right category | Distinction | Prohibited inference |",
    "| --- | --- | --- | --- |",
    ...boundaryRows,
    "",
  ].join("\n");
};
