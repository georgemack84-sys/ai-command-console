import type { CanonicalInformationCategory, TaxonomyProcessingStatus } from "./canonicalTaxonomy";
import type { CanonicalScopeDimension, ScopeApplicabilityStatus } from "./canonicalScopeTaxonomy";
import type { ClassificationBasis } from "./classificationAttribution";
import type { SemanticModifier } from "./semanticModifiers";

export const SEMANTIC_DURABILITY_DEFAULTS = ["NONE", "SESSION", "WORKSPACE", "PROJECT", "USER", "SYSTEM"] as const;
export type SemanticDurabilityDefault = (typeof SEMANTIC_DURABILITY_DEFAULTS)[number];

export const SEMANTIC_AUTHORITY_DEFAULTS = ["NONE", "ADVISORY", "ASSERTED", "APPROVED", "GOVERNING"] as const;
export type SemanticAuthorityDefault = (typeof SEMANTIC_AUTHORITY_DEFAULTS)[number];

export const SEMANTIC_VALIDATION_STATUSES = ["NOT_EVALUATED", "REQUIRES_VALIDATION", "VALIDATED", "CONFLICTING"] as const;
export type SemanticValidationStatus = (typeof SEMANTIC_VALIDATION_STATUSES)[number];

export const SEMANTIC_SENTIMENTS = ["POSITIVE", "NEGATIVE", "NEUTRAL", "MIXED", "NOT_EVALUATED"] as const;
export type SemanticSentiment = (typeof SEMANTIC_SENTIMENTS)[number];

export type InformationUnitOrthogonalDimensions = Readonly<{
  category: CanonicalInformationCategory;
  sourceType: string;
  scope: Readonly<{ status: ScopeApplicabilityStatus; dimension?: CanonicalScopeDimension; identifier?: string }>;
  authority: SemanticAuthorityDefault;
  durability: SemanticDurabilityDefault;
  validation: SemanticValidationStatus;
  confidence: number;
  status: TaxonomyProcessingStatus;
  temporality: readonly SemanticModifier[];
  learningIntent: "UNSPECIFIED" | "EXPLICIT_LEARNING" | "EXPLICIT_NON_LEARNING";
  sentiment: SemanticSentiment;
  classificationBasis: ClassificationBasis;
  sourceReliability: "NOT_EVALUATED";
  truthValidation: "NOT_EVALUATED";
  persistenceEffect: "NONE";
  authorityEffect: "UNCHANGED";
  executionPermissionGranted: false;
}>;

export type CategoryDefaultMatrixEntry = Readonly<{
  category: CanonicalInformationCategory;
  defaultDurability: "NONE";
  defaultAuthority: "NONE";
  candidateKnowledge: boolean;
  promotionRequired: boolean;
  validationRequired: boolean;
  scopeResolutionRequired: boolean;
}>;

export type CategoryInvariant = Readonly<{
  category: CanonicalInformationCategory;
  rules: readonly string[];
}>;

export const SEMANTIC_RISK_LEVELS = ["LOW", "MODERATE", "HIGH", "CRITICAL"] as const;
export type SemanticRiskLevel = (typeof SEMANTIC_RISK_LEVELS)[number];

export type SemanticRiskMatrixEntry = Readonly<{
  expectedCategory: CanonicalInformationCategory;
  observedCategory: CanonicalInformationCategory;
  severity: SemanticRiskLevel;
  rationale: string;
}>;

export type CategoryDecisionTree = Readonly<{
  id: "QUESTION_IDEA_SUGGESTION" | "INSTRUCTION_RULE";
  guidanceOnly: true;
  steps: readonly string[];
  outcomes: readonly CanonicalInformationCategory[];
}>;

export type ConfirmationTriggerAssessment = Readonly<{
  requiresConfirmation: boolean;
  reasonCode?: "HIGH_IMPACT_AMBIGUITY" | "SCOPE_DEPENDENT_CLASSIFICATION" | "CORRECTION_EXCEPTION_AMBIGUITY";
  prompt?: string;
  persistenceEffect: "NONE";
  authorityEffect: "UNCHANGED";
  executionPermissionGranted: false;
}>;
