import {
  CLASSIFICATION_PRECEDENCE_RULES,
  type ClassificationCardinalityValidation,
} from "../../types/learning-constitution";

const rank = (rule: (typeof CLASSIFICATION_PRECEDENCE_RULES)[number]): number =>
  CLASSIFICATION_PRECEDENCE_RULES.indexOf(rule);

export const resolveClassificationPrecedence = (
  applicableRules: readonly (typeof CLASSIFICATION_PRECEDENCE_RULES)[number][],
): (typeof CLASSIFICATION_PRECEDENCE_RULES)[number] => {
  if (applicableRules.length === 0) return "FALLBACK_REVIEW";
  return [...applicableRules].sort((left, right) => rank(left) - rank(right))[0];
};

export const validateOneClassificationPerSemanticUnit = (
  semanticUnitIds: readonly string[],
  classificationUnitIds: readonly string[],
): ClassificationCardinalityValidation => {
  if (new Set(classificationUnitIds).size !== classificationUnitIds.length) return { status: "INVALID", reasonCode: "DUPLICATE_SEMANTIC_UNIT_ID" };
  if (semanticUnitIds.length !== classificationUnitIds.length || semanticUnitIds.some((unitId) => !classificationUnitIds.includes(unitId))) {
    return { status: "INVALID", reasonCode: "MISSING_SEMANTIC_UNIT_ID" };
  }
  return { status: "VALID" };
};
