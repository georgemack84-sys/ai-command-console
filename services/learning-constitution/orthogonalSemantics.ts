import {
  CANONICAL_INFORMATION_CATEGORIES,
  type CanonicalClassificationResult,
  type CanonicalInformationCategory,
  type CategoryDefaultMatrixEntry,
  type CategoryDecisionTree,
  type CategoryInvariant,
  type ConfirmationTriggerAssessment,
  type InformationUnitOrthogonalDimensions,
  type SemanticRiskLevel,
  type SemanticRiskMatrixEntry,
} from "../../types/learning-constitution";
import { CANONICAL_TAXONOMY_REGISTRY } from "./canonicalTaxonomyRegistry";

export const CATEGORY_DEFAULT_MATRIX: readonly CategoryDefaultMatrixEntry[] = CANONICAL_TAXONOMY_REGISTRY.categories.map((category) => ({
  category: category.id,
  defaultDurability: "NONE",
  defaultAuthority: "NONE",
  candidateKnowledge: category.candidateKnowledge,
  promotionRequired: category.promotionRequired,
  validationRequired: category.validationRequirement === "REQUIRED",
  scopeResolutionRequired: category.scopeRequirement === "REQUIRED",
}));

const invariantRules: Readonly<Record<CanonicalInformationCategory, readonly string[]>> = {
  CONVERSATION: ["MUST_NOT_IMPLY_DURABLE_KNOWLEDGE", "MUST_NOT_IMPLY_AUTHORITY", "MAY_CONTAIN_OTHER_SEMANTIC_UNITS"],
  QUESTION: ["MUST_NOT_BE_TREATED_AS_ASSERTION", "MUST_NOT_PROMOTE_EMBEDDED_PROPOSITION_TO_FACT"],
  BRAINSTORM: ["MUST_NOT_IMPLY_ADOPTION", "MUST_NOT_IMPLY_AUTHORIZATION"],
  IDEA: ["MUST_NOT_IMPLY_ADOPTION", "MUST_NOT_IMPLY_AUTHORIZATION", "MUST_NOT_SILENTLY_BECOME_DECISION"],
  SUGGESTION: ["MUST_REMAIN_ADVISORY", "REQUIRES_SEPARATE_ADOPTION_EVENT_FOR_DECISION"],
  FACT: ["MEANS_ASSERTION_NOT_VERIFIED_TRUTH", "REMAINS_SUBJECT_TO_VALIDATION_AND_CONFLICT_HANDLING"],
  CONCEPT: ["MUST_NOT_IMPLY_ADOPTION_OR_AUTHORITY"],
  PREFERENCE: ["MUST_NOT_AUTOMATICALLY_BECOME_RULE", "MUST_BE_BOUNDED_BY_OWNER_AND_SCOPE"],
  INSTRUCTION: ["MUST_NOT_CREATE_AUTHORITY", "REMAINS_SUBJECT_TO_POLICY_AND_AUTHORIZATION"],
  RULE: ["REQUIRES_AUTHORITY_VALIDATION_BEFORE_GOVERNING_BEHAVIOR"],
  PRINCIPLE: ["MUST_NOT_AUTOMATICALLY_OVERRIDE_EXPLICIT_HIGHER_AUTHORITY_RULES"],
  PROCEDURE: ["DESCRIBES_HOW", "MUST_NOT_IMPLY_PERMISSION_TO_EXECUTE"],
  EXAMPLE: ["MUST_NOT_AUTOMATICALLY_BECOME_GOVERNING_KNOWLEDGE", "NESTED_CONTENT_RETAINS_EXAMPLE_CONTEXT"],
  DECISION: ["IDENTIFIES_AN_ADOPTED_CHOICE", "REQUIRES_OWNER_AND_SCOPE_RESOLUTION_BEFORE_DURABLE_PROMOTION"],
  CORRECTION: ["MUST_PRESERVE_HISTORICAL_STATE", "SHOULD_IDENTIFY_WHAT_IT_CORRECTS"],
  EXCEPTION: ["MUST_NOT_DELETE_UNDERLYING_RULE", "MUST_BE_SCOPE_BOUND"],
  GOAL: ["DESCRIBES_DESIRED_FUTURE_STATE", "MUST_NOT_BE_TREATED_AS_EVIDENCE_STATE_EXISTS"],
  FEEDBACK: ["MUST_NOT_AUTOMATICALLY_BECOME_PREFERENCE", "MUST_NOT_AUTOMATICALLY_BECOME_CORRECTION"],
};

export const CATEGORY_INVARIANTS: readonly CategoryInvariant[] = CANONICAL_INFORMATION_CATEGORIES.map((category) => ({ category, rules: invariantRules[category] }));

export const SEMANTIC_RISK_MATRIX: readonly SemanticRiskMatrixEntry[] = [
  { expectedCategory: "IDEA", observedCategory: "SUGGESTION", severity: "LOW", rationale: "Both are exploratory, but recommendation should remain explicit." },
  { expectedCategory: "PREFERENCE", observedCategory: "INSTRUCTION", severity: "MODERATE", rationale: "A preference must not become a directive." },
  { expectedCategory: "SUGGESTION", observedCategory: "DECISION", severity: "HIGH", rationale: "Recommendation must not be mistaken for adoption." },
  { expectedCategory: "EXAMPLE", observedCategory: "RULE", severity: "CRITICAL", rationale: "Illustration must not become governing knowledge." },
  { expectedCategory: "QUESTION", observedCategory: "INSTRUCTION", severity: "CRITICAL", rationale: "A request for information must not prescribe behavior." },
  { expectedCategory: "FEEDBACK", observedCategory: "CORRECTION", severity: "HIGH", rationale: "Evaluation must not rewrite historical assertions." },
];

export const CATEGORY_DECISION_TREES: readonly CategoryDecisionTree[] = [
  { id: "QUESTION_IDEA_SUGGESTION", guidanceOnly: true, steps: ["Is the statement asking for information? If yes, QUESTION.", "Otherwise, is the speaker exploring a possibility?", "If yes, is the speaker recommending it? If yes, SUGGESTION; otherwise IDEA."], outcomes: ["QUESTION", "IDEA", "SUGGESTION"] },
  { id: "INSTRUCTION_RULE", guidanceOnly: true, steps: ["Does the statement prescribe behavior?", "If yes, is it a scoped one-time or contextual directive? If yes, INSTRUCTION.", "Otherwise, is it intended as a continuing governing constraint? If yes, RULE."], outcomes: ["INSTRUCTION", "RULE"] },
];

export const validateOrthogonalDimensions = (dimensions: InformationUnitOrthogonalDimensions): void => {
  if (dimensions.authority !== "NONE" || dimensions.durability !== "NONE" || dimensions.persistenceEffect !== "NONE" || dimensions.authorityEffect !== "UNCHANGED" || dimensions.executionPermissionGranted) {
    throw new Error("taxonomy orthogonal dimensions must not create durability, authority, or execution permission");
  }
  if (dimensions.scope.status === "RESOLVED" && !dimensions.scope.dimension) throw new Error("resolved scope requires a scope dimension");
  if (!Number.isFinite(dimensions.confidence) || dimensions.confidence < 0 || dimensions.confidence > 1) throw new Error("classification confidence must be between zero and one");
};

export const semanticRiskForMisclassification = (expectedCategory: CanonicalInformationCategory, observedCategory: CanonicalInformationCategory): SemanticRiskLevel =>
  SEMANTIC_RISK_MATRIX.find((entry) => entry.expectedCategory === expectedCategory && entry.observedCategory === observedCategory)?.severity ?? "LOW";

export const assessUserConfirmationTrigger = (result: CanonicalClassificationResult): ConfirmationTriggerAssessment => {
  const candidateCategories = [result.category, ...result.candidates.map((candidate) => candidate.category)].filter((category): category is CanonicalInformationCategory => category !== undefined);
  if (candidateCategories.includes("CORRECTION") && candidateCategories.includes("EXCEPTION")) {
    return { requiresConfirmation: true, reasonCode: "CORRECTION_EXCEPTION_AMBIGUITY", prompt: "Are you correcting the prior rule, or creating an exception to it?", persistenceEffect: "NONE", authorityEffect: "UNCHANGED", executionPermissionGranted: false };
  }
  if (candidateCategories.length > 1 && candidateCategories.some((expected) => candidateCategories.some((observed) => expected !== observed && semanticRiskForMisclassification(expected, observed) === "CRITICAL"))) {
    return { requiresConfirmation: true, reasonCode: "HIGH_IMPACT_AMBIGUITY", prompt: "Please clarify the intended semantic category before this is considered for learning.", persistenceEffect: "NONE", authorityEffect: "UNCHANGED", executionPermissionGranted: false };
  }
  if (result.category && ["DECISION", "PREFERENCE", "EXCEPTION"].includes(result.category)) {
    return { requiresConfirmation: true, reasonCode: "SCOPE_DEPENDENT_CLASSIFICATION", prompt: "What scope should this apply to?", persistenceEffect: "NONE", authorityEffect: "UNCHANGED", executionPermissionGranted: false };
  }
  return { requiresConfirmation: false, persistenceEffect: "NONE", authorityEffect: "UNCHANGED", executionPermissionGranted: false };
};
