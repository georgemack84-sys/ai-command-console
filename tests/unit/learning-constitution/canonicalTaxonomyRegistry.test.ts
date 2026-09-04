import { describe, expect, it } from "vitest";

import {
  CANONICAL_TAXONOMY_REGISTRY,
  getCanonicalTaxonomyCategory,
  validateCanonicalTaxonomyRegistry,
} from "@/services/learning-constitution";
import { isInformationCategory } from "@/types/learning-constitution";

describe("canonical taxonomy registry", () => {
  it("loads a complete registry matching the frozen v1 contract", () => {
    expect(CANONICAL_TAXONOMY_REGISTRY).toMatchObject({ taxonomyVersion: "1.0.0" });
    expect(CANONICAL_TAXONOMY_REGISTRY.categories).toHaveLength(18);
    expect(CANONICAL_TAXONOMY_REGISTRY.categories.find((category) => category.id === "RULE")).toMatchObject({ authorityImplication: "NONE", validationRequirement: "REQUIRED" });
  });

  it("rejects malformed roots, missing categories, unknown categories, and authority-bearing metadata", () => {
    expect(() => validateCanonicalTaxonomyRegistry({ taxonomyVersion: "1.0.0", categories: [] })).toThrow();
    const missing = { ...CANONICAL_TAXONOMY_REGISTRY, categories: CANONICAL_TAXONOMY_REGISTRY.categories.slice(1) };
    expect(() => validateCanonicalTaxonomyRegistry(missing)).toThrow();
    const unknown = { ...CANONICAL_TAXONOMY_REGISTRY, categories: [...CANONICAL_TAXONOMY_REGISTRY.categories.slice(0, -1), { ...CANONICAL_TAXONOMY_REGISTRY.categories.at(-1)!, id: "LOCAL_ALIAS" }] };
    expect(() => validateCanonicalTaxonomyRegistry(unknown)).toThrow();
    const authority = { ...CANONICAL_TAXONOMY_REGISTRY, categories: [{ ...CANONICAL_TAXONOMY_REGISTRY.categories[0], authorityImplication: "GOVERNING" }, ...CANONICAL_TAXONOMY_REGISTRY.categories.slice(1)] };
    expect(() => validateCanonicalTaxonomyRegistry(authority)).toThrow();
  });

  it("exposes validated categories through a strongly typed identifier guard and lookup", () => {
    expect(isInformationCategory("DECISION")).toBe(true);
    expect(isInformationCategory("LOCAL_ALIAS")).toBe(false);
    expect(getCanonicalTaxonomyCategory("DECISION")).toMatchObject({
      id: "DECISION",
      scopeRequirement: "REQUIRED",
      authorityImplication: "NONE",
    });
  });
});
