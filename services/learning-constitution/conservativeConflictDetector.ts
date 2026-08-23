import type {
  ConflictDetectionRequest,
  ConflictDetectionResult,
  ConflictDetector,
  KnowledgeComparisonSubject,
} from "../../types/learning-constitution/conflictDetection";
import type { ConflictRelationship } from "../../types/learning-constitution/constitutionalVocabulary";
import { evaluateScopeCompatibility } from "./conservativeKnowledgeScopeResolver";

export const CONSERVATIVE_CONFLICT_DETECTOR_ID = "phase-0-conservative-conflict-detector";
export const CONSERVATIVE_CONFLICT_DETECTOR_VERSION = "1.0.0";

const normalize = (value: string): string => value.trim().replace(/\s+/g, " ").toLocaleLowerCase();

const normalizedSet = (values: readonly string[] = []): Set<string> =>
  new Set(values.map(normalize));

const isSuperset = (candidate: readonly string[] = [], existing: readonly string[] = []): boolean => {
  const candidateSet = normalizedSet(candidate);
  return existing.every((value) => candidateSet.has(normalize(value)));
};

const hasAdditionalValues = (
  candidate: readonly string[] = [],
  existing: readonly string[] = [],
): boolean => normalizedSet(candidate).size > normalizedSet(existing).size;

const result = (
  request: ConflictDetectionRequest,
  relationship: ConflictRelationship,
  confidence: number,
  status: ConflictDetectionResult["status"],
  rationaleCode: string,
  matchedFields: readonly string[],
  options: Pick<
    ConflictDetectionResult,
    | "requiresValidation"
    | "requiresClarification"
    | "requiresApproval"
    | "correctionTargetKnowledgeId"
    | "exceptionTargetKnowledgeId"
  >,
): ConflictDetectionResult => ({
  candidateId: request.candidate.knowledgeId,
  existingKnowledgeId: request.existingKnowledge.knowledgeId,
  relationship,
  confidence,
  status,
  scopeCompatibility: evaluateScopeCompatibility(
    request.candidate.scope,
    request.existingKnowledge.scope,
  ),
  provenance: {
    candidate: request.candidate.provenance,
    existingKnowledge: request.existingKnowledge.provenance,
  },
  reasoningMetadata: {
    rationaleCode,
    matchedFields: Object.freeze([...matchedFields]),
    detectorId: CONSERVATIVE_CONFLICT_DETECTOR_ID,
    detectorVersion: CONSERVATIVE_CONFLICT_DETECTOR_VERSION,
  },
  ...options,
  persistenceEffect: "NONE",
  authorityEffect: "UNCHANGED",
});

const isReferenced = (
  references: readonly string[] | undefined,
  knowledge: KnowledgeComparisonSubject,
): boolean => references?.includes(knowledge.knowledgeId) ?? false;

const qualifierRelationship = (
  candidate: KnowledgeComparisonSubject,
  existing: KnowledgeComparisonSubject,
): ConflictRelationship | undefined => {
  const candidateQualifiers = candidate.qualifiers ?? [];
  const existingQualifiers = existing.qualifiers ?? [];
  if (!isSuperset(candidateQualifiers, existingQualifiers) || !hasAdditionalValues(candidateQualifiers, existingQualifiers)) {
    return undefined;
  }

  if (candidateQualifiers.some((qualifier) => /^(when|only|if):/i.test(qualifier))) {
    return "QUALIFIES";
  }
  if (candidateQualifiers.some((qualifier) => /^constraint:/i.test(qualifier))) {
    return "NARROWS";
  }
  return "REFINES";
};

export const detectConflictConservatively = (
  request: ConflictDetectionRequest,
): ConflictDetectionResult => {
  const scopeCompatibility = evaluateScopeCompatibility(
    request.candidate.scope,
    request.existingKnowledge.scope,
  );
  if (scopeCompatibility.outcome !== "COMPATIBLE") {
    return result(request, "UNRELATED", 1, "OUT_OF_SCOPE", "INCOMPATIBLE_SCOPE", ["scope"], {
      requiresValidation: false,
      requiresClarification: false,
      requiresApproval: false,
    });
  }

  if (
    request.candidate.classification === "CORRECTION" &&
    isReferenced(request.candidate.supersedesKnowledgeIds, request.existingKnowledge)
  ) {
    return result(request, "CORRECTS", 0.98, "ASSESSED", "EXPLICIT_CORRECTION_REFERENCE", ["supersedesKnowledgeIds"], {
      correctionTargetKnowledgeId: request.existingKnowledge.knowledgeId,
      requiresValidation: true,
      requiresClarification: false,
      requiresApproval: true,
    });
  }

  if (
    request.candidate.classification === "EXCEPTION" &&
    isReferenced(request.candidate.exceptionToKnowledgeIds, request.existingKnowledge)
  ) {
    return result(request, "CREATES_EXCEPTION", 0.98, "ASSESSED", "EXPLICIT_EXCEPTION_REFERENCE", ["exceptionToKnowledgeIds"], {
      exceptionTargetKnowledgeId: request.existingKnowledge.knowledgeId,
      requiresValidation: true,
      requiresClarification: false,
      requiresApproval: true,
    });
  }

  if (!request.candidate.semanticKey || !request.existingKnowledge.semanticKey) {
    if (normalize(request.candidate.content) === normalize(request.existingKnowledge.content)) {
      return result(request, "DUPLICATES", 1, "ASSESSED", "EXACT_CONTENT_MATCH", ["content"], {
        requiresValidation: false,
        requiresClarification: false,
        requiresApproval: false,
      });
    }

    return result(request, "UNCERTAIN", 0, "UNCERTAIN", "MISSING_SEMANTIC_KEY", [], {
      requiresValidation: true,
      requiresClarification: true,
      requiresApproval: false,
    });
  }

  if (normalize(request.candidate.semanticKey) !== normalize(request.existingKnowledge.semanticKey)) {
    return result(request, "UNRELATED", 0.9, "ASSESSED", "DIFFERENT_SEMANTIC_KEY", ["semanticKey"], {
      requiresValidation: false,
      requiresClarification: false,
      requiresApproval: false,
    });
  }

  if (!request.candidate.value || !request.existingKnowledge.value) {
    return result(request, "UNCERTAIN", 0, "UNCERTAIN", "MISSING_COMPARISON_VALUE", ["semanticKey"], {
      requiresValidation: true,
      requiresClarification: true,
      requiresApproval: false,
    });
  }

  if (normalize(request.candidate.value) !== normalize(request.existingKnowledge.value)) {
    return result(request, "CONTRADICTS", 0.95, "ASSESSED", "EXCLUSIVE_VALUE_MISMATCH", ["semanticKey", "value"], {
      requiresValidation: true,
      requiresClarification: false,
      requiresApproval: true,
    });
  }

  const qualification = qualifierRelationship(request.candidate, request.existingKnowledge);
  if (qualification) {
    return result(request, qualification, 0.9, "ASSESSED", "ADDITIONAL_QUALIFIERS", ["semanticKey", "value", "qualifiers"], {
      requiresValidation: true,
      requiresClarification: false,
      requiresApproval: false,
    });
  }

  if (normalize(request.candidate.content) === normalize(request.existingKnowledge.content)) {
    return result(request, "DUPLICATES", 1, "ASSESSED", "EXACT_CONTENT_MATCH", ["content"], {
      requiresValidation: false,
      requiresClarification: false,
      requiresApproval: false,
    });
  }

  return result(request, "AGREES", 0.9, "ASSESSED", "MATCHING_SEMANTIC_VALUE", ["semanticKey", "value"], {
    requiresValidation: false,
    requiresClarification: false,
    requiresApproval: false,
  });
};

export class ConservativeConflictDetector implements ConflictDetector {
  detect(request: ConflictDetectionRequest): Promise<ConflictDetectionResult> {
    return Promise.resolve(detectConflictConservatively(request));
  }
}
