import registry from "../../learning/taxonomy/registry.v1.json";
import {
  CANONICAL_INFORMATION_CATEGORIES,
  CANONICAL_TAXONOMY_VERSION,
  TAXONOMY_REQUIREMENT_LEVELS,
  type CanonicalInformationCategory,
  type CanonicalTaxonomyCategory,
  type CanonicalTaxonomyRegistry,
} from "../../types/learning-constitution/canonicalTaxonomy";

export const CANONICAL_TAXONOMY_REGISTRY_ID = "canonical-learning-taxonomy-v1";

const requiredCategoryKeys = [
  "id", "displayName", "definition", "semanticIntent", "candidateKnowledge", "promotionRequired",
  "validationRequirement", "scopeRequirement", "conflictSensitivity", "lifecycleEligibility",
  "authorityImplication", "examples", "counterexamples", "classificationNotes",
] as const;
const requiredBoundaryKeys = ["leftCategory", "rightCategory", "distinction", "prohibitedInferences"] as const;
const requiredBoundaryPairs = [
  "QUESTION:FACT", "BRAINSTORM:IDEA", "IDEA:SUGGESTION", "SUGGESTION:INSTRUCTION", "PREFERENCE:INSTRUCTION",
  "INSTRUCTION:RULE", "RULE:PRINCIPLE", "PRINCIPLE:PROCEDURE", "EXAMPLE:FACT", "IDEA:DECISION",
  "SUGGESTION:DECISION", "GOAL:DECISION", "FEEDBACK:PREFERENCE", "FEEDBACK:CORRECTION", "CORRECTION:DECISION", "EXCEPTION:RULE",
] as const;
const requiredProhibitedInferences = [
  "QUESTION -> INSTRUCTION", "EXAMPLE -> RULE", "IDEA -> DECISION", "SUGGESTION -> RULE", "PROCEDURE -> AUTHORIZATION",
] as const;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;
const strings = (value: unknown): value is readonly string[] =>
  Array.isArray(value) && value.length > 0 && value.every((entry) => typeof entry === "string" && entry.trim().length > 0);

export const validateCanonicalTaxonomyRegistry = (value: unknown): CanonicalTaxonomyRegistry => {
  if (!isRecord(value) || value.taxonomyVersion !== CANONICAL_TAXONOMY_VERSION || !Array.isArray(value.categories) || !Array.isArray(value.boundaryRules)) {
    throw new Error("canonical taxonomy registry root is invalid");
  }
  if (value.categories.length !== CANONICAL_INFORMATION_CATEGORIES.length) {
    throw new Error("canonical taxonomy registry must contain every frozen category exactly once");
  }
  const categoryIds = new Set<string>();
  for (const category of value.categories) {
    if (!isRecord(category) || requiredCategoryKeys.some((key) => !(key in category)) ||
      Object.keys(category).some((key) => !requiredCategoryKeys.includes(key as typeof requiredCategoryKeys[number]))) {
      throw new Error("canonical taxonomy category schema is invalid");
    }
    if (typeof category.id !== "string" || !CANONICAL_INFORMATION_CATEGORIES.includes(category.id as typeof CANONICAL_INFORMATION_CATEGORIES[number]) || categoryIds.has(category.id) ||
      !["displayName", "definition", "semanticIntent"].every((key) => typeof category[key] === "string" && (category[key] as string).trim().length > 0) ||
      typeof category.candidateKnowledge !== "boolean" || typeof category.promotionRequired !== "boolean" ||
      !TAXONOMY_REQUIREMENT_LEVELS.includes(category.validationRequirement as typeof TAXONOMY_REQUIREMENT_LEVELS[number]) ||
      !TAXONOMY_REQUIREMENT_LEVELS.includes(category.scopeRequirement as typeof TAXONOMY_REQUIREMENT_LEVELS[number]) ||
      !TAXONOMY_REQUIREMENT_LEVELS.includes(category.conflictSensitivity as typeof TAXONOMY_REQUIREMENT_LEVELS[number]) ||
      (category.lifecycleEligibility !== "NONE" && category.lifecycleEligibility !== "CANDIDATE") ||
      category.authorityImplication !== "NONE" || !strings(category.examples) || !strings(category.counterexamples) || !strings(category.classificationNotes)) {
      throw new Error("canonical taxonomy category values are invalid");
    }
    categoryIds.add(category.id);
  }
  if (CANONICAL_INFORMATION_CATEGORIES.some((id) => !categoryIds.has(id))) {
    throw new Error("canonical taxonomy registry is missing a frozen category");
  }
  if (value.boundaryRules.length < 16) throw new Error("canonical taxonomy registry lacks required boundary rules");
  const boundaryPairs = new Set<string>();
  const prohibitedInferences = new Set<string>();
  for (const boundary of value.boundaryRules) {
    if (!isRecord(boundary) || requiredBoundaryKeys.some((key) => !(key in boundary)) ||
      Object.keys(boundary).some((key) => !requiredBoundaryKeys.includes(key as typeof requiredBoundaryKeys[number])) ||
      !CANONICAL_INFORMATION_CATEGORIES.includes(boundary.leftCategory as typeof CANONICAL_INFORMATION_CATEGORIES[number]) ||
      !CANONICAL_INFORMATION_CATEGORIES.includes(boundary.rightCategory as typeof CANONICAL_INFORMATION_CATEGORIES[number]) ||
      boundary.leftCategory === boundary.rightCategory || !isNonEmptyString(boundary.distinction) ||
      !Array.isArray(boundary.prohibitedInferences) || !boundary.prohibitedInferences.every((item) => typeof item === "string" && item.trim().length > 0)) {
      throw new Error("canonical taxonomy boundary rule is invalid");
    }
    const pairId = `${boundary.leftCategory}:${boundary.rightCategory}`;
    if (boundaryPairs.has(pairId)) throw new Error("canonical taxonomy boundary rules cannot duplicate a pair");
    boundaryPairs.add(pairId);
    for (const prohibitedInference of boundary.prohibitedInferences) prohibitedInferences.add(prohibitedInference);
  }
  if (requiredBoundaryPairs.some((pair) => !boundaryPairs.has(pair)) ||
    requiredProhibitedInferences.some((inference) => !prohibitedInferences.has(inference))) {
    throw new Error("canonical taxonomy registry is missing a required boundary guard");
  }
  return value as CanonicalTaxonomyRegistry;
};

export const CANONICAL_TAXONOMY_REGISTRY = validateCanonicalTaxonomyRegistry(registry);

const categoriesById: ReadonlyMap<CanonicalInformationCategory, CanonicalTaxonomyCategory> = new Map(
  CANONICAL_TAXONOMY_REGISTRY.categories.map((category) => [category.id, category]),
);

export const getCanonicalTaxonomyCategory = (
  categoryId: CanonicalInformationCategory,
): CanonicalTaxonomyCategory => {
  const category = categoriesById.get(categoryId);
  if (!category) throw new Error(`canonical taxonomy category is unavailable: ${categoryId}`);
  return category;
};
