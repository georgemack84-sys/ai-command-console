export const SEMANTIC_MODIFIERS = [
  "CONDITIONAL", "TEMPORAL", "MODAL", "NEGATED", "USER_TEACHING", "NON_LEARNING", "EXPLICIT_LABEL", "MISLEADING_LABEL",
] as const;
export type SemanticModifier = (typeof SEMANTIC_MODIFIERS)[number];

export type SemanticModifierAnalysis = Readonly<{
  modifiers: readonly SemanticModifier[];
  reasonCodes: readonly string[];
  persistenceEffect: "NONE";
  authorityEffect: "UNCHANGED";
  executionPermissionGranted: false;
}>;
