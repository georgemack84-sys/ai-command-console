import type { AuthorityConflictDetector, AuthorityConflictReasonCode, AuthorityConflictRequest, AuthorityConflictResult } from "../../types/learning-constitution";

const result = (outcome: AuthorityConflictResult["outcome"], reasonCode: AuthorityConflictReasonCode): AuthorityConflictResult => ({ outcome, reasonCode, persistenceEffect: "NONE", authorityEffect: "UNCHANGED", executionPermissionGranted: false });
const AGENT_AUTHORITY_TYPES = new Set(["AGENT_DERIVED", "AGENT_INFERRED", "AGENT_HYPOTHESIS"]);
const HUMAN_AUTHORITY_TYPES = new Set(["HUMAN_DIRECTIVE", "HUMAN_DECISION", "HUMAN_CORRECTION", "HUMAN_PREFERENCE"]);
const compatibleKnowledgeRelationships = new Set(["AGREES", "DUPLICATES", "REINFORCES", "EXTENDS", "REFINES", "QUALIFIES", "NARROWS"]);

/** Resolves authority implications of an already-detected knowledge relation; it never mutates knowledge. */
export class ConservativeAuthorityConflictDetector implements AuthorityConflictDetector {
  detect(request: AuthorityConflictRequest): AuthorityConflictResult {
    if (request.knowledgeConflict.status === "OUT_OF_SCOPE") return result("COEXIST", "SCOPES_DO_NOT_OVERLAP");
    if (request.knowledgeConflict.relationship === "UNCERTAIN" || request.knowledgeConflict.status === "UNCERTAIN") return result("REQUIRE_VALIDATION", "KNOWLEDGE_RELATIONSHIP_UNCERTAIN");
    if (compatibleKnowledgeRelationships.has(request.knowledgeConflict.relationship)) return result("NO_CONFLICT", "KNOWLEDGE_COMPATIBLE");

    const incomingType = request.incomingAuthority.authorityType;
    const existingType = request.existingAuthority.authorityType;
    if (AGENT_AUTHORITY_TYPES.has(incomingType) && HUMAN_AUTHORITY_TYPES.has(existingType)) return result("REJECT_INCOMING", "AGENT_CLAIM_CANNOT_OVERRIDE_HUMAN_AUTHORITY");
    if (incomingType === "HUMAN_PREFERENCE" && existingType === "APPROVED_POLICY") return result("REJECT_INCOMING", "PREFERENCE_CANNOT_OVERRIDE_APPROVED_POLICY");
    if (incomingType === "VERIFIED_EXTERNAL_INFORMATION" && existingType === "APPROVED_REFERENCE") return result("REQUIRE_VALIDATION", "VERIFIED_EXTERNAL_INFORMATION_CHALLENGES_APPROVED_REFERENCE");
    if ((request.precedence.outcome === "CORRECT" || request.precedence.outcome === "SUPERSEDE") && ["CORRECTS", "CONTRADICTS"].includes(request.knowledgeConflict.relationship)) return result("SUPERSEDE_EXISTING", "EXPLICIT_AUTHORITY_SUPERSESSION");
    if (request.precedence.outcome === "REQUIRE_REVIEW") return result("REQUIRE_HUMAN_REVIEW", "PRECEDENCE_REQUIRES_REVIEW");
    return result("REQUIRE_HUMAN_REVIEW", "CONFLICT_REQUIRES_HUMAN_REVIEW");
  }
}
