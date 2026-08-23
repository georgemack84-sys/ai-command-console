import type {
  AuthorityPrecedenceEvaluator,
  AuthorityPrecedenceReasonCode,
  AuthorityPrecedenceRequest,
  AuthorityPrecedenceResult,
} from "../../types/learning-constitution";
import { evaluateScopeCompatibility } from "./conservativeKnowledgeScopeResolver";

const result = (outcome: AuthorityPrecedenceResult["outcome"], reasonCode: AuthorityPrecedenceReasonCode): AuthorityPrecedenceResult => ({
  outcome,
  reasonCode,
  persistenceEffect: "NONE",
  authorityEffect: "UNCHANGED",
  executionPermissionGranted: false,
});

/**
 * Evaluates an explicitly asserted relationship between authority records.
 * It has no authority-strength ranking: records only interact when their
 * scopes overlap and a source asserts a specific relationship.
 */
export class ScopeAwareAuthorityPrecedenceEvaluator implements AuthorityPrecedenceEvaluator {
  evaluate(request: AuthorityPrecedenceRequest): AuthorityPrecedenceResult {
    if (evaluateScopeCompatibility(request.existing.scope, request.incoming.scope).outcome !== "COMPATIBLE") {
      return result("COEXIST", "SCOPES_DO_NOT_OVERLAP");
    }

    const existingExpiresAt = request.existing.effectiveUntil ? Date.parse(request.existing.effectiveUntil) : undefined;
    if (existingExpiresAt !== undefined && existingExpiresAt < Date.parse(request.incoming.effectiveFrom)) {
      return result("COEXIST", "EXISTING_AUTHORITY_ALREADY_EXPIRED");
    }
    if (request.relationshipIntent === "COEXIST") return result("COEXIST", "NO_REPLACEMENT_CLAIM");
    if (request.relationshipIntent === "REVOKE") return result("REQUIRE_REVIEW", "EXPLICIT_REVOCATION_REQUIRES_REVIEW");
    if (!request.incoming.supersedes.includes(request.existing.authorityId)) {
      return result("REQUIRE_REVIEW", "SUPERSESSION_REFERENCE_MISSING");
    }
    if (request.existing.sourceIdentity !== request.incoming.sourceIdentity) {
      return result("REQUIRE_REVIEW", "SOURCE_IDENTITY_MISMATCH");
    }
    if (Date.parse(request.incoming.effectiveFrom) < Date.parse(request.existing.effectiveFrom)) {
      return result("REQUIRE_REVIEW", "REPLACEMENT_PREDATES_EXISTING_AUTHORITY");
    }
    if (request.relationshipIntent === "CORRECT" && request.incoming.authorityType === "HUMAN_CORRECTION") {
      return result("CORRECT", "EXPLICIT_CORRECTION_CANDIDATE");
    }
    return result("SUPERSEDE", "EXPLICIT_SUPERSESSION_CANDIDATE");
  }
}
