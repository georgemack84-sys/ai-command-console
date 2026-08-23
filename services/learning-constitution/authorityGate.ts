import type { AuthorityGate as AuthorityGateContract, AuthorityGateReasonCode, AuthorityGateRequest, AuthorityGateResult } from "../../types/learning-constitution";
import { validateAuthorityRecord } from "./authorityRecord";

const result = (decision: AuthorityGateResult["decision"], reasonCode: AuthorityGateReasonCode): AuthorityGateResult => ({ decision, reasonCode, persistenceEffect: "NONE", authorityEffect: "UNCHANGED", executionPermissionGranted: false });

/** Fail-closed authority enforcement before a future governed durable write. */
export class FailClosedAuthorityGate implements AuthorityGateContract {
  evaluate(request: AuthorityGateRequest): AuthorityGateResult {
    if (request.resolution.status !== "CANDIDATE_ASSIGNED" || !request.resolution.authorityType) return result("REVIEW", "UNKNOWN_AUTHORITY");
    if (!request.resolution.source.sourceIdentity.trim() || !request.resolution.source.sourceReference.trim()) return result("DENY", "AMBIGUOUS_SOURCE");
    if (!request.authorityRecord) return result("REVIEW", "UNKNOWN_AUTHORITY");
    if (request.authorityRecord.authorityType !== request.resolution.authorityType) return result("DENY", "AUTHORITY_RECORD_MISMATCH");
    if (request.authorityRecord.authoritySource !== request.resolution.source.sourceReference || request.authorityRecord.sourceIdentity !== request.resolution.source.sourceIdentity) return result("DENY", "SOURCE_LINEAGE_MISMATCH");
    try { validateAuthorityRecord(request.authorityRecord); } catch (error) {
      return result("DENY", request.authorityRecord.authorityType === "APPROVED_POLICY" || request.authorityRecord.authorityType === "APPROVED_REFERENCE" ? "MISSING_APPROVAL" : "INVALID_AUTHORITY_RECORD");
    }
    if (request.authorityRecord.delegatedFrom && request.delegationValid !== true) return result("DENY", "INVALID_DELEGATION");
    if (!request.boundary || request.boundary.outcome === "REQUIRE_REVIEW") return result("REVIEW", "UNRESOLVED_SCOPE_BOUNDARY");
    if (request.boundary.outcome === "OUT_OF_SCOPE") return result("DENY", "OUT_OF_SCOPE_AUTHORITY");
    if (!request.conflict) return result("REVIEW", "UNRESOLVED_CONFLICT");
    if (request.conflict.outcome === "REJECT_INCOMING") return result("DENY", "CONFLICT_REJECTED");
    if (request.conflict.outcome === "SUPERSEDE_EXISTING") return result("REVIEW", "SUPERSESSION_REQUIRES_LIFECYCLE");
    if (request.conflict.outcome !== "NO_CONFLICT" && request.conflict.outcome !== "COEXIST") return result("REVIEW", "UNRESOLVED_CONFLICT");
    return result("ALLOW", "AUTHORITY_ACCEPTED");
  }
}
