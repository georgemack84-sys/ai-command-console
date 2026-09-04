import {
  CLASSIFICATION_SEMANTICS,
  type ClassificationRelationshipHints,
  type InformationClassificationRequest,
  type InformationClassificationResult,
  type InformationClassifier,
} from "../../types/learning-constitution/informationClassification";
import type {
  KnowledgeClassification,
  KnowledgeScope,
} from "../../types/learning-constitution/constitutionalVocabulary";

export const CONSERVATIVE_CLASSIFIER_ID = "phase-0-conservative-information-classifier";
export const CONSERVATIVE_CLASSIFIER_VERSION = "1.0.0";
export const MINIMUM_DEFINITIVE_CONFIDENCE = 0.7;

type ClassificationMatch = Readonly<{
  classification: KnowledgeClassification;
  confidence: number;
  rationaleCode: string;
  matchedSignals: readonly string[];
  inferredScope?: KnowledgeScope;
}>;

const normalizeRelationshipHints = (
  hints?: InformationClassificationRequest["relationshipHints"],
): ClassificationRelationshipHints => ({
  supersedesKnowledgeIds: Object.freeze([...(hints?.supersedesKnowledgeIds ?? [])]),
  exceptionToKnowledgeIds: Object.freeze([...(hints?.exceptionToKnowledgeIds ?? [])]),
});

const match = (
  classification: KnowledgeClassification,
  confidence: number,
  rationaleCode: string,
  matchedSignals: readonly string[],
  inferredScope?: KnowledgeScope,
): ClassificationMatch => ({
  classification,
  confidence,
  rationaleCode,
  matchedSignals,
  inferredScope,
});

const detectClassification = (content: string): ClassificationMatch | undefined => {
  if (/\b(correction|actually|replace(?:s|d)?|instead of|not .+ as previously stated)\b/i.test(content)) {
    return match("CORRECTION", 0.98, "EXPLICIT_CORRECTION_SIGNAL", ["correction-language"]);
  }

  if (/\b(except|exception|unless)\b/i.test(content)) {
    return match("EXCEPTION", 0.95, "EXPLICIT_EXCEPTION_SIGNAL", ["exception-language"]);
  }

  if (/\b(we (?:have )?decided|we will use|approved .+ for project|selected .+ for project)\b/i.test(content)) {
    return match("PROJECT_DECISION", 0.96, "EXPLICIT_PROJECT_DECISION_SIGNAL", ["decision-language"], "PROJECT");
  }

  if (/^(?:all|every)\b.+\b(?:must|shall|required to)\b/i.test(content) || /\bmust never\b/i.test(content)) {
    return match("AUTHORITATIVE_RULE", 0.9, "POTENTIAL_BINDING_RULE_SIGNAL", ["normative-universal-language"]);
  }

  if (/\b(i|we)\s+(?:strongly\s+)?prefer\b|\bi like\b/i.test(content)) {
    return match("PREFERENCE", 0.95, "EXPLICIT_PREFERENCE_SIGNAL", ["preference-language"], "USER");
  }

  if (/\b(let(?:'|’)s explore|brainstorm|what if|possible options?)\b/i.test(content)) {
    return match("BRAINSTORMING", 0.93, "EXPLORATORY_SIGNAL", ["exploratory-language"], "SESSION");
  }

  if (/\b(i think|hypothetically|just wondering|someday)\b/i.test(content)) {
    return match("CONVERSATION", 0.8, "TRANSIENT_CONVERSATION_SIGNAL", ["conversational-language"], "CONVERSATION");
  }

  if (/\b(?:could|might|maybe|consider)\b/i.test(content)) {
    return match("SUGGESTION", 0.9, "NON_BINDING_PROPOSAL_SIGNAL", ["suggestion-language"], "SESSION");
  }

  if (/^(?:procedure|steps?|workflow)\s*:/i.test(content)) {
    return match("PROCEDURE", 0.95, "EXPLICIT_PROCEDURE_LABEL", ["procedure-label"]);
  }

  if (/^(?:principle|guiding principle)\s*:/i.test(content)) {
    return match("PRINCIPLE", 0.95, "EXPLICIT_PRINCIPLE_LABEL", ["principle-label"]);
  }

  if (/^(?:please\s+)?(?:use|do|run|create|avoid|keep|set|change)\b/i.test(content)) {
    return match("INSTRUCTION", 0.86, "IMPERATIVE_DIRECTIVE_SIGNAL", ["imperative-language"]);
  }

  if (/^(?:fact\s*:)|\bproject\s+[\w-]+\s+(?:uses|is|has)\b/i.test(content)) {
    return match(
      "FACT",
      0.85,
      "DESCRIPTIVE_ASSERTION_SIGNAL",
      ["descriptive-assertion"],
      /\bproject\b/i.test(content) ? "PROJECT" : undefined,
    );
  }

  if (/\?$/i.test(content)) {
    return match("CONVERSATION", 0.8, "TRANSIENT_CONVERSATION_SIGNAL", ["conversational-language"], "CONVERSATION");
  }

  return undefined;
};

const ambiguousResult = (
  request: InformationClassificationRequest,
  reason: string,
): InformationClassificationResult => ({
  confidence: 0,
  status: "AMBIGUOUS",
  proposedDurability: "NONE",
  scopeHint: request.scopeHint,
  requiresValidation: true,
  provenance: request.provenance,
  reasoningMetadata: {
    rationaleCode: reason,
    matchedSignals: Object.freeze([]),
    classifierId: CONSERVATIVE_CLASSIFIER_ID,
    classifierVersion: CONSERVATIVE_CLASSIFIER_VERSION,
  },
  relationshipHints: normalizeRelationshipHints(request.relationshipHints),
  persistenceEffect: "NONE",
  authorityEffect: "UNCHANGED",
  executionPermissionGranted: false,
});

export const classifyInformationConservatively = (
  request: InformationClassificationRequest,
): InformationClassificationResult => {
  const content = request.content.trim();
  if (!content) {
    return ambiguousResult(request, "EMPTY_OBSERVATION");
  }

  const detected = detectClassification(content);
  if (!detected || detected.confidence < MINIMUM_DEFINITIVE_CONFIDENCE) {
    return ambiguousResult(request, "INSUFFICIENT_CLASSIFICATION_EVIDENCE");
  }

  const semantics = CLASSIFICATION_SEMANTICS[detected.classification];
  return {
    classification: detected.classification,
    confidence: detected.confidence,
    status: semantics.defaultStatus,
    proposedDurability: semantics.defaultDurability,
    scopeHint: request.scopeHint ?? detected.inferredScope,
    requiresValidation: semantics.requiresValidation,
    provenance: request.provenance,
    reasoningMetadata: {
      rationaleCode: detected.rationaleCode,
      matchedSignals: Object.freeze([...detected.matchedSignals]),
      classifierId: CONSERVATIVE_CLASSIFIER_ID,
      classifierVersion: CONSERVATIVE_CLASSIFIER_VERSION,
    },
    relationshipHints: normalizeRelationshipHints(request.relationshipHints),
    persistenceEffect: "NONE",
    authorityEffect: "UNCHANGED",
    executionPermissionGranted: false,
  };
};

export class ConservativeInformationClassifier implements InformationClassifier {
  classify(request: InformationClassificationRequest): Promise<InformationClassificationResult> {
    return Promise.resolve(classifyInformationConservatively(request));
  }
}
