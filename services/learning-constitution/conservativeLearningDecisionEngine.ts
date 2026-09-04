import type {
  LearningDecisionEngine,
  LearningDecisionReasonCode,
  LearningDecisionRequest,
  LearningDecisionResult,
} from "../../types/learning-constitution/learningDecision";
import type { KnowledgeDisposition } from "../../types/learning-constitution/constitutionalVocabulary";
import { evaluateScopeCompatibility } from "./conservativeKnowledgeScopeResolver";

export const CONSERVATIVE_LEARNING_DECISION_ENGINE_ID = "phase-0-conservative-learning-decision-engine";
export const CONSERVATIVE_LEARNING_DECISION_ENGINE_VERSION = "1.0.0";

const result = (
  request: LearningDecisionRequest,
  disposition: KnowledgeDisposition,
  reasonCode: LearningDecisionReasonCode,
): LearningDecisionResult => ({
  candidateId: request.candidateId,
  disposition,
  reasonCode,
  decisionStatus: disposition === "ACCEPT" || disposition === "REJECT" ? "FINAL" : "PENDING",
  approvalReference: request.approval.approvalId,
  policyVersion: request.policy.policyVersion,
  constitutionVersion: request.policy.constitutionVersion,
  provenance: request.provenance,
  durableAdmissionEligible: disposition === "ACCEPT",
  persistenceEffect: "NONE",
  authorityEffect: "UNCHANGED",
  executionPermissionGranted: false,
});

const approvalIsCompleteAndCompatible = (request: LearningDecisionRequest): boolean => {
  const { approval } = request;
  if (
    approval.status !== "APPROVED" ||
    !approval.approvalId ||
    !approval.approvedBy ||
    !approval.approvedAt ||
    !approval.approvalScope ||
    !request.scopeResolution.scope
  ) {
    return false;
  }

  return (
    evaluateScopeCompatibility(approval.approvalScope, request.scopeResolution.scope).outcome ===
    "COMPATIBLE"
  );
};

const policyIsComplete = (request: LearningDecisionRequest): boolean =>
  Boolean(request.policy.policyVersion && request.policy.constitutionVersion);

export const decideLearningConservatively = (
  request: LearningDecisionRequest,
): LearningDecisionResult => {
  if (!policyIsComplete(request)) {
    return result(request, "DEFER", "POLICY_CONTEXT_INCOMPLETE");
  }

  if (request.policy.constitutionalMutationRequested) {
    return result(request, "REJECT", "CONSTITUTIONAL_MUTATION_PROHIBITED");
  }
  if (request.policy.authorityMutationRequested) {
    return result(request, "REJECT", "AUTHORITY_MUTATION_PROHIBITED");
  }
  if (request.policy.automaticConversationLearningRequested) {
    return result(request, "REJECT", "AUTOMATIC_CONVERSATION_LEARNING_PROHIBITED");
  }
  if (request.policy.unknownScopePromotionRequested) {
    return result(request, "REJECT", "UNKNOWN_SCOPE_PROMOTION_PROHIBITED");
  }
  if (request.policy.silentConflictResolutionRequested) {
    return result(request, "REJECT", "SILENT_CONFLICT_RESOLUTION_PROHIBITED");
  }
  if (request.policy.procedureExecutionPermissionRequested) {
    return result(request, "REJECT", "PROCEDURE_PERMISSION_ESCALATION_PROHIBITED");
  }
  if (request.policy.agentGeneratedEvidenceSelfValidated) {
    return result(request, "REJECT", "AGENT_EVIDENCE_SELF_VALIDATION_PROHIBITED");
  }

  if (
    request.validation.candidateId !== request.candidateId ||
    request.conflictDetection.candidateId !== request.candidateId ||
    request.classification.provenance.observationId !== request.provenance.observationId ||
    request.scopeResolution.provenance.observationId !== request.provenance.observationId
  ) {
    return result(request, "DEFER", "UPSTREAM_RESULT_INCONSISTENT");
  }

  if (request.validation.outcome === "QUARANTINED") {
    return result(request, "QUARANTINE", "VALIDATION_QUARANTINED");
  }
  if (request.validation.outcome === "CONFLICT_REVIEW_REQUIRED") {
    return result(request, "CONFLICT", "CONFLICT_REVIEW_REQUIRED");
  }
  if (request.validation.outcome === "INVALID") {
    return result(request, "REJECT", "VALIDATION_REJECTED");
  }
  if (
    request.validation.outcome === "REQUIRES_CLARIFICATION" ||
    request.validation.outcome === "REQUIRES_EVIDENCE"
  ) {
    return result(request, "REQUIRE_VALIDATION", "VALIDATION_REQUIRES_COMPLETION");
  }

  if (request.validation.outcome === "REQUIRES_APPROVAL" || request.approval.approvalRequired) {
    if (request.approval.status === "REJECTED") {
      return result(request, "REJECT", "APPROVAL_REJECTED");
    }
    if (request.approval.status === "EXPIRED") {
      return result(request, "REJECT", "APPROVAL_EXPIRED");
    }
    if (request.approval.status !== "APPROVED") {
      return result(request, "REQUIRE_APPROVAL", "APPROVAL_PENDING");
    }
    if (!approvalIsCompleteAndCompatible(request)) {
      return result(request, "DEFER", "APPROVAL_SCOPE_INCOMPATIBLE");
    }
    return result(request, "ACCEPT", "ACCEPTED_FOR_ADMISSION");
  }

  if (request.validation.outcome !== "VALID") {
    return result(request, "DEFER", "UPSTREAM_RESULT_INCONSISTENT");
  }

  if (request.approval.status === "REJECTED") {
    return result(request, "REJECT", "APPROVAL_REJECTED");
  }
  if (request.approval.status === "EXPIRED") {
    return result(request, "REJECT", "APPROVAL_EXPIRED");
  }
  if (request.approval.status === "PENDING") {
    return result(request, "REQUIRE_APPROVAL", "APPROVAL_PENDING");
  }
  if (request.approval.status === "APPROVED" && !approvalIsCompleteAndCompatible(request)) {
    return result(request, "DEFER", "APPROVAL_CONTEXT_INCOMPLETE");
  }

  return result(request, "ACCEPT", "ACCEPTED_FOR_ADMISSION");
};

export class ConservativeLearningDecisionEngine implements LearningDecisionEngine {
  decide(request: LearningDecisionRequest): Promise<LearningDecisionResult> {
    return Promise.resolve(decideLearningConservatively(request));
  }
}
