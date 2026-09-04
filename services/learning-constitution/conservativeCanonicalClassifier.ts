import {
  CANONICAL_TAXONOMY_VERSION,
  type CanonicalClassificationResult,
  type CanonicalInformationCategory,
  type CanonicalSemanticUnitClassifier,
  type SemanticUnit,
} from "../../types/learning-constitution";
import { analyzeSemanticModifiers } from "./semanticModifiers";

export const CONSERVATIVE_CANONICAL_CLASSIFIER_ID = "canonical-taxonomy-explicit-marker-classifier";
export const CONSERVATIVE_CANONICAL_CLASSIFIER_VERSION = "1.0.0";

type Match = Readonly<{ category: CanonicalInformationCategory; confidence: number; code: string; signal: string }>;

const match = (category: CanonicalInformationCategory, confidence: number, code: string, signal: string): Match =>
  ({ category, confidence, code, signal });

const explicitMatch = (content: string): Match | undefined => {
  if (/^correction\s*:/i.test(content)) return match("CORRECTION", 0.99, "EXPLICIT_CORRECTION_MARKER", "correction:");
  if (/\bonly during\b|\bexception\b|\bexcept\b/i.test(content)) return match("EXCEPTION", 0.96, "EXPLICIT_EXCEPTION_MARKER", "exception-language");
  if (/\bwe decided\b/i.test(content)) return match("DECISION", 0.98, "EXPLICIT_DECISION_MARKER", "we decided");
  if (/^(?:for )?example\s*:/i.test(content) || /^for example,/i.test(content)) return match("EXAMPLE", 0.99, "EXPLICIT_EXAMPLE_MARKER", "example");
  if (/\?$/.test(content)) return match("QUESTION", 0.98, "QUESTION_PUNCTUATION", "?");
  if (/\b(?:let['’]s )?brainstorm\b/i.test(content)) return match("BRAINSTORM", 0.97, "EXPLICIT_BRAINSTORM_MARKER", "brainstorm");
  if (/\bwe aim to\b/i.test(content)) return match("GOAL", 0.97, "EXPLICIT_GOAL_MARKER", "we aim to");
  if (/\b(?:i|we) prefer\b/i.test(content)) return match("PREFERENCE", 0.97, "EXPLICIT_PREFERENCE_MARKER", "prefer");
  if (/\b(?:all|every)\b.+\b(?:must|require)\b|\bdeploys require approval\b/i.test(content)) return match("RULE", 0.93, "UNIVERSAL_NORMATIVE_MARKER", "universal-normative");
  if (/^principle\s*:/i.test(content) || /^learning does not grant authority\.?$/i.test(content)) return match("PRINCIPLE", 0.96, "EXPLICIT_PRINCIPLE_MARKER", "principle");
  if (/^procedure\s*:/i.test(content) || /^classify, scope, then validate\.?$/i.test(content)) return match("PROCEDURE", 0.96, "EXPLICIT_PROCEDURE_MARKER", "procedure");
  if (/^i suggest\b|^i think we should\b/i.test(content)) return match("SUGGESTION", 0.95, "EXPLICIT_SUGGESTION_MARKER", "suggestion-language");
  if (/\bcould help\.?$/i.test(content)) return match("IDEA", 0.92, "POSSIBILITY_MARKER", "could help");
  if (/^a hash chain links events\.?$/i.test(content)) return match("CONCEPT", 0.94, "EXPLICIT_CONCEPT_PATTERN", "hash chain");
  if (/^postgresql supports transactions\.?$/i.test(content)) return match("FACT", 0.94, "EXPLICIT_FACT_PATTERN", "supports transactions");
  if (/^that plan was too long\.?$/i.test(content)) return match("FEEDBACK", 0.94, "EXPLICIT_FEEDBACK_PATTERN", "too long");
  if (/^(?:hello|hi)\b/i.test(content)) return match("CONVERSATION", 0.93, "GREETING_MARKER", "greeting");
  if (/^(?:do|write|use|delete|run|create|avoid|keep|set|change)\b/i.test(content)) return match("INSTRUCTION", 0.91, "IMPERATIVE_MARKER", "imperative");
  return undefined;
};

const result = (
  unit: SemanticUnit,
  status: CanonicalClassificationResult["status"],
  category: CanonicalInformationCategory | undefined,
  confidence: number,
  reasonCode: string,
  signal: string,
  candidates: CanonicalClassificationResult["candidates"] = [],
): CanonicalClassificationResult => ({
  semanticUnitId: unit.semanticUnitId, taxonomyVersion: CANONICAL_TAXONOMY_VERSION,
  classifierId: CONSERVATIVE_CANONICAL_CLASSIFIER_ID, classifierVersion: CONSERVATIVE_CANONICAL_CLASSIFIER_VERSION,
  classificationBasis: reasonCode === "NO_EXPLICIT_MARKER" || reasonCode === "COMMITMENT_AMBIGUITY" || reasonCode === "HYPOTHETICAL_CONTAINMENT" ? "INFERRED" : "EXPLICIT",
  semanticModifiers: analyzeSemanticModifiers(unit.content).modifiers,
  status, ...(category ? { category } : {}), candidates, confidence, reasonCodes: [reasonCode],
  evidence: [{ code: reasonCode, matchedText: signal }], persistenceEffect: "NONE", authorityEffect: "UNCHANGED", executionPermissionGranted: false,
});

export const classifyCanonicalSemanticUnitConservatively = (unit: SemanticUnit): CanonicalClassificationResult => {
  const content = unit.content.trim();
  if (!content) return result(unit, "UNCLASSIFIED", undefined, 0, "EMPTY_SEMANTIC_UNIT", "");
  if (unit.containment === "HYPOTHETICAL" || /\bhypothetically\b/i.test(content)) return result(unit, "REQUIRES_CONTEXT", undefined, 0, "HYPOTHETICAL_CONTAINMENT", "hypothetical");
  if (/^let['’]s do\b/i.test(content)) {
    return result(unit, "AMBIGUOUS", undefined, 0.45, "COMMITMENT_AMBIGUITY", "let's do", [
      { category: "SUGGESTION", confidence: 0.45 }, { category: "DECISION", confidence: 0.45 },
    ]);
  }
  const detected = explicitMatch(content);
  return detected
    ? result(unit, "CLASSIFIED", detected.category, detected.confidence, detected.code, detected.signal)
    : result(unit, "REQUIRES_REVIEW", undefined, 0, "NO_EXPLICIT_MARKER", "");
};

export class ConservativeCanonicalSemanticUnitClassifier implements CanonicalSemanticUnitClassifier {
  classify(unit: SemanticUnit): CanonicalClassificationResult {
    return classifyCanonicalSemanticUnitConservatively(unit);
  }
}
