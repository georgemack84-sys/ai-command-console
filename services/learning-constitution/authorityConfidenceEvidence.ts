import type { AuthorityConfidenceEvidenceEvaluation, AuthorityConfidenceEvidenceProfile } from "../../types/learning-constitution";
import { validateAuthorityRecord } from "./authorityRecord";

/**
 * Validates the independent three-axis model. It cannot infer authority from
 * confidence/evidence, or confidence from authority/evidence.
 */
export const evaluateAuthorityConfidenceEvidence = (profile: AuthorityConfidenceEvidenceProfile): AuthorityConfidenceEvidenceEvaluation => {
  if (!Number.isFinite(profile.confidence.score) || profile.confidence.score < 0 || profile.confidence.score > 1) {
    throw new Error("confidence must be between zero and one");
  }
  if (profile.authority.state === "RECORDED") validateAuthorityRecord(profile.authority.record);
  const evidenceIds = profile.evidence.items.map((item) => item.evidenceId);
  if (evidenceIds.some((id) => !id.trim()) || new Set(evidenceIds).size !== evidenceIds.length) {
    throw new Error("evidence identifiers must be present and unique");
  }
  if ("trustScore" in profile) throw new Error("generic trust scores must not replace authority, confidence, and evidence");
  return { profile, persistenceEffect: "NONE", authorityEffect: "UNCHANGED", executionPermissionGranted: false };
};
