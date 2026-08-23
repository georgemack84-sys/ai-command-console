import { ScopeAwareAuthorityPrecedenceEvaluator } from "./authorityPrecedence";
import { evaluateScopeCompatibility } from "./conservativeKnowledgeScopeResolver";
import type { ConflictComparison } from "../../types/learning-constitution/conflictEngine";
import type { ConflictComparisonRequest, ConflictDimensionComparisons } from "../../types/learning-constitution/conflictComparison";

const comparison = (existing: string, candidate: string, outcome: ConflictComparison["outcome"], rationaleCode: string): ConflictComparison => ({ existing, candidate, outcome, rationaleCode });
const isConfidence = (value: number | undefined): value is number => value !== undefined && Number.isFinite(value) && value >= 0 && value <= 1;

/**
 * Produces independent comparison facts for a conflict. It cannot collapse
 * them into a trust score, choose a resolution, or grant authority.
 */
export class ConflictComparisonService {
  private readonly authorityPrecedence = new ScopeAwareAuthorityPrecedenceEvaluator();

  compare(request: ConflictComparisonRequest): ConflictDimensionComparisons {
    const scopeResult = evaluateScopeCompatibility(request.existing.scope, request.candidate.scope);
    const scope = comparison(JSON.stringify(request.existing.scope), JSON.stringify(request.candidate.scope), scopeResult.outcome === "COMPATIBLE" ? "EQUIVALENT" : scopeResult.outcome === "INCOMPATIBLE" ? "INCOMPARABLE" : "UNKNOWN", scopeResult.reason);

    const authority = !request.existing.authority || !request.candidate.authority
      ? comparison(request.existing.authority?.authorityId ?? "UNRECORDED", request.candidate.authority?.authorityId ?? "UNRECORDED", "UNKNOWN", "AUTHORITY_RECORD_MISSING")
      : (() => {
        const result = this.authorityPrecedence.evaluate({ existing: request.existing.authority!, incoming: request.candidate.authority!, relationshipIntent: request.authorityRelationshipIntent ?? "COEXIST" });
        const outcome = result.outcome === "SUPERSEDE" || result.outcome === "CORRECT" ? "CANDIDATE_STRONGER" : result.outcome === "COEXIST" ? "INCOMPARABLE" : "UNKNOWN";
        return comparison(request.existing.authority!.authorityId, request.candidate.authority!.authorityId, outcome, result.reasonCode);
      })();

    const evidenceIds = (items: ConflictComparisonRequest["existing"]["evidence"]) => items.map((item) => item.evidenceId).sort().join(",") || "NONE";
    const existingEvidence = evidenceIds(request.existing.evidence);
    const candidateEvidence = evidenceIds(request.candidate.evidence);
    const evidence = comparison(existingEvidence, candidateEvidence, existingEvidence === candidateEvidence ? "EQUIVALENT" : "INCOMPARABLE", existingEvidence === candidateEvidence ? "SAME_EVIDENCE_REFERENCES" : "EVIDENCE_REQUIRES_POLICY_REVIEW");

    const confidence = !isConfidence(request.existing.confidence) || !isConfidence(request.candidate.confidence)
      ? comparison(String(request.existing.confidence ?? "UNASSESSED"), String(request.candidate.confidence ?? "UNASSESSED"), "UNKNOWN", "CONFIDENCE_MISSING_OR_INVALID")
      : comparison(String(request.existing.confidence), String(request.candidate.confidence), request.existing.confidence === request.candidate.confidence ? "EQUIVALENT" : request.existing.confidence > request.candidate.confidence ? "EXISTING_STRONGER" : "CANDIDATE_STRONGER", "NUMERIC_CONFIDENCE_COMPARISON");

    const temporal = comparison(request.existing.effectiveFrom ?? "UNSPECIFIED", request.candidate.effectiveFrom ?? "UNSPECIFIED", request.existing.effectiveUntil && request.candidate.effectiveFrom && Date.parse(request.existing.effectiveUntil) < Date.parse(request.candidate.effectiveFrom) ? "CANDIDATE_STRONGER" : "UNKNOWN", request.existing.effectiveUntil && request.candidate.effectiveFrom && Date.parse(request.existing.effectiveUntil) < Date.parse(request.candidate.effectiveFrom) ? "EXISTING_TEMPORAL_APPLICABILITY_ENDED" : "TEMPORAL_COMPARISON_INCONCLUSIVE");

    return { scope, authority, evidence, confidence, temporal, persistenceEffect: "NONE", authorityEffect: "UNCHANGED", executionPermissionGranted: false };
  }
}
