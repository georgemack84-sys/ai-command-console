import type { KnowledgeClassification } from "./constitutionalVocabulary";

export const CANONICAL_TAXONOMY_VERSION = "1.0.0" as const;

export const CANONICAL_INFORMATION_CATEGORIES = [
  "CONVERSATION",
  "QUESTION",
  "BRAINSTORM",
  "IDEA",
  "SUGGESTION",
  "FACT",
  "CONCEPT",
  "PREFERENCE",
  "INSTRUCTION",
  "RULE",
  "PRINCIPLE",
  "PROCEDURE",
  "EXAMPLE",
  "DECISION",
  "CORRECTION",
  "EXCEPTION",
  "GOAL",
  "FEEDBACK",
] as const;
export type CanonicalInformationCategory = (typeof CANONICAL_INFORMATION_CATEGORIES)[number];
export type InformationCategory = CanonicalInformationCategory;

export const isInformationCategory = (value: unknown): value is InformationCategory =>
  typeof value === "string" && (CANONICAL_INFORMATION_CATEGORIES as readonly string[]).includes(value);

export const TAXONOMY_PROCESSING_STATUSES = [
  "CLASSIFIED",
  "UNCLASSIFIED",
  "AMBIGUOUS",
  "REQUIRES_CONTEXT",
  "REQUIRES_REVIEW",
] as const;
export type TaxonomyProcessingStatus = (typeof TAXONOMY_PROCESSING_STATUSES)[number];

export const TAXONOMY_REQUIREMENT_LEVELS = ["NONE", "CONTEXTUAL", "REQUIRED"] as const;
export type TaxonomyRequirementLevel = (typeof TAXONOMY_REQUIREMENT_LEVELS)[number];

export type CanonicalTaxonomyCategory = Readonly<{
  id: CanonicalInformationCategory;
  displayName: string;
  definition: string;
  semanticIntent: string;
  candidateKnowledge: boolean;
  promotionRequired: boolean;
  validationRequirement: TaxonomyRequirementLevel;
  scopeRequirement: TaxonomyRequirementLevel;
  conflictSensitivity: TaxonomyRequirementLevel;
  lifecycleEligibility: "NONE" | "CANDIDATE";
  authorityImplication: "NONE";
  examples: readonly string[];
  counterexamples: readonly string[];
  classificationNotes: readonly string[];
}>;

export type CanonicalTaxonomyBoundary = Readonly<{
  leftCategory: CanonicalInformationCategory;
  rightCategory: CanonicalInformationCategory;
  distinction: string;
  prohibitedInferences: readonly string[];
}>;

export type CanonicalTaxonomyRegistry = Readonly<{
  taxonomyVersion: typeof CANONICAL_TAXONOMY_VERSION;
  boundaryRules: readonly CanonicalTaxonomyBoundary[];
  categories: readonly CanonicalTaxonomyCategory[];
}>;

export type LegacyTaxonomyMapping = Readonly<{
  canonicalCategory: CanonicalInformationCategory;
  migrationNote: string;
  preservesSeparateAuthorityValidation: boolean;
  preservesRequiredScope: boolean;
}>;

export const LEGACY_PHASE_0_TAXONOMY_MAPPING: Readonly<
  Record<KnowledgeClassification, LegacyTaxonomyMapping>
> = {
  CONVERSATION: {
    canonicalCategory: "CONVERSATION",
    migrationNote: "Direct mapping.",
    preservesSeparateAuthorityValidation: false,
    preservesRequiredScope: false,
  },
  BRAINSTORMING: {
    canonicalCategory: "BRAINSTORM",
    migrationNote: "Identifier normalization only.",
    preservesSeparateAuthorityValidation: false,
    preservesRequiredScope: false,
  },
  SUGGESTION: {
    canonicalCategory: "SUGGESTION",
    migrationNote: "Direct mapping.",
    preservesSeparateAuthorityValidation: false,
    preservesRequiredScope: false,
  },
  FACT: {
    canonicalCategory: "FACT",
    migrationNote: "Direct mapping; validation remains separate.",
    preservesSeparateAuthorityValidation: false,
    preservesRequiredScope: false,
  },
  PREFERENCE: {
    canonicalCategory: "PREFERENCE",
    migrationNote: "Direct mapping; owner and scope remain separate dimensions.",
    preservesSeparateAuthorityValidation: false,
    preservesRequiredScope: true,
  },
  INSTRUCTION: {
    canonicalCategory: "INSTRUCTION",
    migrationNote: "Direct mapping; instruction never grants authority.",
    preservesSeparateAuthorityValidation: true,
    preservesRequiredScope: true,
  },
  PROJECT_DECISION: {
    canonicalCategory: "DECISION",
    migrationNote: "PROJECT remains required scope metadata, not a category suffix.",
    preservesSeparateAuthorityValidation: false,
    preservesRequiredScope: true,
  },
  PRINCIPLE: {
    canonicalCategory: "PRINCIPLE",
    migrationNote: "Direct mapping.",
    preservesSeparateAuthorityValidation: false,
    preservesRequiredScope: true,
  },
  PROCEDURE: {
    canonicalCategory: "PROCEDURE",
    migrationNote: "Direct mapping; procedure never grants execution permission.",
    preservesSeparateAuthorityValidation: true,
    preservesRequiredScope: true,
  },
  CORRECTION: {
    canonicalCategory: "CORRECTION",
    migrationNote: "Direct mapping; historical knowledge remains preserved.",
    preservesSeparateAuthorityValidation: false,
    preservesRequiredScope: true,
  },
  EXCEPTION: {
    canonicalCategory: "EXCEPTION",
    migrationNote: "Direct mapping; the underlying rule remains separate.",
    preservesSeparateAuthorityValidation: true,
    preservesRequiredScope: true,
  },
  AUTHORITATIVE_RULE: {
    canonicalCategory: "RULE",
    migrationNote: "Authority validation remains a separate state and is not encoded in the category.",
    preservesSeparateAuthorityValidation: true,
    preservesRequiredScope: true,
  },
};
