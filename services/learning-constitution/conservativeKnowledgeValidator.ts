import type {
  KnowledgeValidationRequest,
  KnowledgeValidationResult,
  KnowledgeValidator,
  ValidationOutcome,
  ValidationReasonCode,
} from "../../types/learning-constitution/knowledgeValidation";

export const CONSERVATIVE_KNOWLEDGE_VALIDATOR_ID = "phase-0-conservative-knowledge-validator";
export const CONSERVATIVE_KNOWLEDGE_VALIDATOR_VERSION = "1.0.0";

const result = (
  request: KnowledgeValidationRequest,
  outcome: ValidationOutcome,
  reasonCode: ValidationReasonCode,
  applicableRules: readonly string[],
): KnowledgeValidationResult => ({
  candidateId: request.candidateId,
  outcome,
  reasonCode,
  applicableRules: Object.freeze([...applicableRules]),
  evidenceIds: Object.freeze(request.evidence.map((evidence) => evidence.evidenceId)),
  provenance: request.provenance,
  persistenceEffect: "NONE",
  authorityEffect: "UNCHANGED",
  executionPermissionGranted: false,
});

const provenanceIsComplete = (request: KnowledgeValidationRequest): boolean =>
  Boolean(
    request.provenance.observationId &&
      request.provenance.sourceId &&
      request.provenance.sourceType &&
      request.provenance.originatingActorId &&
      request.provenance.observedAt,
  );

const hasIndependentSupportingEvidence = (request: KnowledgeValidationRequest): boolean =>
  request.evidence.some(
    (evidence) => evidence.supportsCandidate && evidence.type !== "AGENT_OUTPUT",
  );

export const validateKnowledgeConservatively = (
  request: KnowledgeValidationRequest,
): KnowledgeValidationResult => {
  if (request.classification.status === "AMBIGUOUS" || !request.classification.classification) {
    return result(request, "REQUIRES_CLARIFICATION", "CLASSIFICATION_UNRESOLVED", ["classification"]);
  }

  if (request.scopeResolution.status !== "RESOLVED" || !request.scopeResolution.scope) {
    return result(request, "REQUIRES_CLARIFICATION", "SCOPE_UNRESOLVED", ["scope"]);
  }

  if (!provenanceIsComplete(request)) {
    return result(request, "QUARANTINED", "PROVENANCE_INCOMPLETE", ["provenance"]);
  }

  if (
    request.conflictDetection.status === "UNCERTAIN" ||
    request.conflictDetection.relationship === "UNCERTAIN" ||
    request.conflictDetection.relationship === "CONTRADICTS"
  ) {
    return result(request, "CONFLICT_REVIEW_REQUIRED", "CONFLICT_REVIEW_REQUIRED", ["conflict"]);
  }

  const classification = request.classification.classification;
  if (
    classification === "CONVERSATION" ||
    classification === "BRAINSTORMING" ||
    classification === "SUGGESTION"
  ) {
    return result(request, "INVALID", "NON_DURABLE_CLASSIFICATION", ["classification"]);
  }

  if (classification === "PREFERENCE") {
    if (
      request.scopeResolution.scope.type !== "USER" ||
      request.provenance.sourceType !== "OPERATOR_STATEMENT"
    ) {
      return result(request, "REQUIRES_EVIDENCE", "PREFERENCE_REQUIRES_USER_ATTRIBUTION", ["scope", "source"]);
    }
    return result(request, "VALID", "VALIDATED", ["preference-attribution"]);
  }

  if (classification === "FACT") {
    if (!hasIndependentSupportingEvidence(request)) {
      return result(request, "REQUIRES_EVIDENCE", "FACT_REQUIRES_INDEPENDENT_EVIDENCE", ["evidence"]);
    }
    return result(request, "VALID", "VALIDATED", ["independent-evidence"]);
  }

  if (classification === "PROJECT_DECISION") {
    if (request.scopeResolution.scope.type !== "PROJECT") {
      return result(request, "INVALID", "PROJECT_DECISION_REQUIRES_PROJECT_SCOPE", ["scope"]);
    }
    return result(request, "REQUIRES_APPROVAL", "PROJECT_DECISION_REQUIRES_APPROVAL", ["project-approval"]);
  }

  if (classification === "CORRECTION") {
    if (!request.conflictDetection.correctionTargetKnowledgeId) {
      return result(request, "REQUIRES_CLARIFICATION", "CORRECTION_TARGET_REQUIRED", ["correction-target"]);
    }
    return result(request, "REQUIRES_APPROVAL", "CORRECTION_REQUIRES_APPROVAL", ["correction-approval"]);
  }

  if (classification === "EXCEPTION") {
    if (!request.conflictDetection.exceptionTargetKnowledgeId) {
      return result(request, "REQUIRES_CLARIFICATION", "EXCEPTION_TARGET_REQUIRED", ["exception-target"]);
    }
    return result(request, "REQUIRES_APPROVAL", "EXCEPTION_REQUIRES_APPROVAL", ["exception-approval"]);
  }

  if (classification === "AUTHORITATIVE_RULE") {
    if (!request.authorityVerified) {
      return result(request, "REQUIRES_APPROVAL", "AUTHORITATIVE_RULE_REQUIRES_AUTHORITY_VERIFICATION", ["authority-verification"]);
    }
    return result(request, "REQUIRES_APPROVAL", "AUTHORITATIVE_RULE_REQUIRES_APPROVAL", ["rule-approval"]);
  }

  if (classification === "PROCEDURE") {
    return result(request, "REQUIRES_APPROVAL", "PROCEDURE_REQUIRES_APPROVAL", ["procedure-approval"]);
  }

  return result(request, "REQUIRES_APPROVAL", "PROJECT_DECISION_REQUIRES_APPROVAL", ["classification-approval"]);
};

export class ConservativeKnowledgeValidator implements KnowledgeValidator {
  validate(request: KnowledgeValidationRequest): Promise<KnowledgeValidationResult> {
    return Promise.resolve(validateKnowledgeConservatively(request));
  }
}
