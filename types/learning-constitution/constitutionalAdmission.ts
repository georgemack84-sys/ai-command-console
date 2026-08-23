import type {
  ConflictRelationship,
  KnowledgeClassification,
  KnowledgeDisposition,
  KnowledgeScope,
  ValidationStatus,
} from "./constitutionalVocabulary";

export const CONSTITUTIONAL_REASON_CODES = [
  "READY_FOR_DURABLE_ADMISSION",
  "OBSERVATION_ONLY",
  "NON_DURABLE_CLASSIFICATION",
  "MISSING_CLASSIFICATION",
  "MISSING_SCOPE",
  "CONFLICT_CHECK_INCOMPLETE",
  "UNRESOLVED_CONFLICT",
  "VALIDATION_REQUIRED",
  "VALIDATION_FAILED",
  "APPROVAL_REQUIRED",
  "PROVENANCE_MISSING",
  "PROVENANCE_NOT_RECONSTRUCTABLE",
  "CONSTITUTIONAL_CONFLICT",
  "AUTHORITY_MUTATION_PROHIBITED",
] as const;

export type ConstitutionalReasonCode = (typeof CONSTITUTIONAL_REASON_CODES)[number];

export type ConstitutionalAdmissionRequest = Readonly<{
  candidateCreated: boolean;
  classification?: KnowledgeClassification;
  scope?: KnowledgeScope;
  conflictDetectionCompleted: boolean;
  conflictRelationship?: ConflictRelationship;
  validationStatus: ValidationStatus;
  approvalRequired: boolean;
  approved: boolean;
  provenanceComplete: boolean;
  /** Phase 7: the origin-to-approval chain can be traversed without rewriting history. */
  provenanceReconstructable?: boolean;
  constitutionalMutationRequested?: boolean;
  authorityMutationRequested?: boolean;
}>;

export type ConstitutionalAdmissionDecision = Readonly<{
  disposition: KnowledgeDisposition;
  reason: ConstitutionalReasonCode;
  durableAdmissionEligible: boolean;
  authorityEffect: "UNCHANGED";
}>;

const decide = (
  disposition: KnowledgeDisposition,
  reason: ConstitutionalReasonCode,
): ConstitutionalAdmissionDecision => ({
  disposition,
  reason,
  durableAdmissionEligible: disposition === "ACCEPT",
  authorityEffect: "UNCHANGED",
});

/**
 * Evaluates constitutional admission readiness only. It does not classify,
 * validate, approve, persist, retrieve, or execute knowledge.
 */
export const assessConstitutionalAdmission = (
  request: ConstitutionalAdmissionRequest,
): ConstitutionalAdmissionDecision => {
  if (request.constitutionalMutationRequested) {
    return decide("REJECT", "CONSTITUTIONAL_CONFLICT");
  }

  if (request.authorityMutationRequested) {
    return decide("REJECT", "AUTHORITY_MUTATION_PROHIBITED");
  }

  if (!request.candidateCreated) {
    return decide("DEFER", "OBSERVATION_ONLY");
  }

  if (!request.classification) {
    return decide("DEFER", "MISSING_CLASSIFICATION");
  }

  if (
    request.classification === "CONVERSATION" ||
    request.classification === "BRAINSTORMING" ||
    request.classification === "SUGGESTION"
  ) {
    return decide("DEFER", "NON_DURABLE_CLASSIFICATION");
  }

  if (!request.scope) {
    return decide("DEFER", "MISSING_SCOPE");
  }

  if (!request.conflictDetectionCompleted || !request.conflictRelationship) {
    return decide("DEFER", "CONFLICT_CHECK_INCOMPLETE");
  }

  if (
    request.conflictRelationship === "CONTRADICTS" ||
    request.conflictRelationship === "UNCERTAIN"
  ) {
    return decide("CONFLICT", "UNRESOLVED_CONFLICT");
  }

  if (
    request.validationStatus === "NOT_VALIDATED" ||
    request.validationStatus === "REQUIRES_VALIDATION"
  ) {
    return decide("REQUIRE_VALIDATION", "VALIDATION_REQUIRED");
  }

  if (request.validationStatus === "INVALID") {
    return decide("REJECT", "VALIDATION_FAILED");
  }

  if (request.approvalRequired && !request.approved) {
    return decide("REQUIRE_APPROVAL", "APPROVAL_REQUIRED");
  }

  if (!request.provenanceComplete) {
    return decide("QUARANTINE", "PROVENANCE_MISSING");
  }

  if (request.provenanceReconstructable === false) {
    return decide("QUARANTINE", "PROVENANCE_NOT_RECONSTRUCTABLE");
  }

  return decide("ACCEPT", "READY_FOR_DURABLE_ADMISSION");
};
