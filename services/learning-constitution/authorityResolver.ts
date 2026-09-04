import type {
  AuthorityResolutionReasonCode,
  AuthorityResolutionRequest,
  AuthorityResolutionResult,
  AuthorityResolver,
} from "../../types/learning-constitution";

const review = (request: AuthorityResolutionRequest, reasonCode: AuthorityResolutionReasonCode): AuthorityResolutionResult => ({
  status: "REQUIRE_REVIEW",
  reasonCode,
  source: request.source,
  persistenceEffect: "NONE",
  authorityEffect: "UNCHANGED",
  executionPermissionGranted: false,
});

const assigned = (request: AuthorityResolutionRequest, authorityType: NonNullable<AuthorityResolutionResult["authorityType"]>, reasonCode: AuthorityResolutionReasonCode): AuthorityResolutionResult => ({
  status: "CANDIDATE_ASSIGNED",
  reasonCode,
  authorityType,
  source: request.source,
  persistenceEffect: "NONE",
  authorityEffect: "UNCHANGED",
  executionPermissionGranted: false,
});

/**
 * Deterministically identifies candidate authority from source identity and
 * semantic classification. It intentionally does not rank, validate conflicts,
 * create an AuthorityRecord, or authorize an action.
 */
export class ConservativeAuthorityResolver implements AuthorityResolver {
  resolve(request: AuthorityResolutionRequest): AuthorityResolutionResult {
    if (request.classification.status !== "CLASSIFIED" || !request.classification.classification) {
      return review(request, "CLASSIFICATION_UNRESOLVED");
    }
    if (request.scopeResolution.status !== "RESOLVED" || !request.scopeResolution.scope) {
      return review(request, "SCOPE_UNRESOLVED");
    }

    const classification = request.classification.classification;
    const { source } = request;
    if (source.sourceClass === "HUMAN") {
      if (classification === "INSTRUCTION") return assigned(request, "HUMAN_DIRECTIVE", "HUMAN_DIRECTIVE_IDENTIFIED");
      if (classification === "PROJECT_DECISION") return assigned(request, "HUMAN_DECISION", "HUMAN_DECISION_IDENTIFIED");
      if (classification === "CORRECTION") return assigned(request, "HUMAN_CORRECTION", "HUMAN_CORRECTION_IDENTIFIED");
      if (classification === "PREFERENCE") return assigned(request, "HUMAN_PREFERENCE", "HUMAN_PREFERENCE_IDENTIFIED");
      return review(request, "SEMANTICS_DO_NOT_ESTABLISH_AUTHORITY");
    }

    if (source.sourceClass === "GOVERNANCE") {
      if (classification !== "AUTHORITATIVE_RULE" || !source.approval?.approvedBy || !source.approval.approvalRecord) return review(request, "APPROVAL_MISSING");
      return assigned(request, "APPROVED_POLICY", "APPROVED_POLICY_IDENTIFIED");
    }

    if (source.sourceClass === "REFERENCE") {
      if (!source.referenceDesignated) return review(request, "REFERENCE_DESIGNATION_MISSING");
      return assigned(request, "APPROVED_REFERENCE", "APPROVED_REFERENCE_IDENTIFIED");
    }

    if (source.sourceClass === "EXTERNAL") {
      if (!source.externallyVerified) return review(request, "EXTERNAL_VERIFICATION_MISSING");
      return assigned(request, "VERIFIED_EXTERNAL_INFORMATION", "VERIFIED_EXTERNAL_INFORMATION_IDENTIFIED");
    }

    if (!source.agentKnowledgeKind) return review(request, "AGENT_KNOWLEDGE_KIND_MISSING");
    if (source.agentKnowledgeKind === "DERIVED") return assigned(request, "AGENT_DERIVED", "AGENT_DERIVATION_IDENTIFIED");
    if (source.agentKnowledgeKind === "INFERRED") return assigned(request, "AGENT_INFERRED", "AGENT_INFERENCE_IDENTIFIED");
    return assigned(request, "AGENT_HYPOTHESIS", "AGENT_HYPOTHESIS_IDENTIFIED");
  }
}
