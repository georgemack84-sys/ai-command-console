import type { SemanticModifierAnalysis } from "../../types/learning-constitution";

const labeledCategory = /^(?:question|brainstorm|idea|suggestion|fact|concept|preference|instruction|rule|principle|procedure|example|decision|correction|exception|goal|feedback)\s*:/i;
const imperative = /^(?:do|write|use|delete|run|create|avoid|keep|set|change)\b/i;

export const analyzeSemanticModifiers = (content: string): SemanticModifierAnalysis => {
  const modifiers: string[] = [];
  const reasonCodes: string[] = [];
  const add = (modifier: string, reasonCode: string): void => { modifiers.push(modifier); reasonCodes.push(reasonCode); };
  if (/\bif\b|\bunless\b|\bonly when\b/i.test(content)) add("CONDITIONAL", "CONDITIONAL_LANGUAGE");
  if (/\b(?:currently|formerly|until|after|before|today|tomorrow|yesterday)\b/i.test(content)) add("TEMPORAL", "TEMPORAL_LANGUAGE");
  if (/\b(?:could|might|may|should|would)\b/i.test(content)) add("MODAL", "MODAL_LANGUAGE");
  if (/\b(?:not|never|no)\b/i.test(content)) add("NEGATED", "NEGATION_LANGUAGE");
  if (/\b(?:remember that|teach you|teaching)\b/i.test(content)) add("USER_TEACHING", "USER_TEACHING_LANGUAGE");
  if (/\b(?:do not learn|don't learn|not for memory|do not retain)\b/i.test(content)) add("NON_LEARNING", "EXPLICIT_NON_LEARNING_MARKER");
  if (labeledCategory.test(content)) {
    add("EXPLICIT_LABEL", "EXPLICIT_CATEGORY_LABEL");
    const labelEnd = content.indexOf(":") + 1;
    if (imperative.test(content.slice(labelEnd).trim())) add("MISLEADING_LABEL", "LABEL_CONTENT_CONFLICT");
  }
  return { modifiers: [...new Set(modifiers)] as SemanticModifierAnalysis["modifiers"], reasonCodes: [...new Set(reasonCodes)], persistenceEffect: "NONE", authorityEffect: "UNCHANGED", executionPermissionGranted: false };
};
